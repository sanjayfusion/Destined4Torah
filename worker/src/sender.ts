import { bannerFor, renderCampaign, sendBatch, unsubscribeHeaders, unsubscribeUrl, type Message } from './email'
import type { Campaign, Env } from './env'
import { now, sha256Hex } from './util'

const MAX_ATTEMPTS = 3
const STALE_CLAIM_SECONDS = 10 * 60

interface Claimed {
  id: number
  subscriber_id: number
  attempts: number
}

interface Recipient {
  id: number
  email: string
  token: string
  status: string
}

/** D1 limits bound parameters, so the (integer-only) id lists are inlined after validation. */
function idList(ids: number[]): string {
  if (!ids.every((id) => Number.isInteger(id))) throw new Error('Non-integer id')
  return ids.join(',')
}

async function finishCampaignIfDone(env: Env, campaignId: number): Promise<void> {
  const open = await env.DB.prepare(`SELECT COUNT(*) AS n FROM deliveries WHERE campaign_id = ? AND status IN ('pending', 'sending')`)
    .bind(campaignId)
    .first<{ n: number }>()
  if ((open?.n ?? 0) === 0) {
    await env.DB.prepare(`UPDATE campaigns SET status = 'sent', sent_at = ? WHERE id = ? AND status = 'sending'`).bind(now(), campaignId).run()
  }
}

/** Sends the next batch of queued deliveries for the oldest campaign that is still sending. */
export async function processQueue(env: Env): Promise<number> {
  await env.DB.prepare(`UPDATE deliveries SET status = 'pending', claimed_at = NULL WHERE status = 'sending' AND claimed_at < ?`)
    .bind(now() - STALE_CLAIM_SECONDS)
    .run()

  const campaign = await env.DB.prepare(`SELECT * FROM campaigns WHERE status = 'sending' ORDER BY id LIMIT 1`).first<Campaign>()
  if (!campaign) return 0

  const batchSize = Math.min(100, Math.max(1, Number.parseInt(env.SEND_BATCH_SIZE ?? '100', 10) || 100))

  // Claiming marks rows 'sending' atomically, so overlapping runs never pick the same recipients.
  const claimed = (
    await env.DB.prepare(
      `UPDATE deliveries SET status = 'sending', claimed_at = ?, attempts = attempts + 1
       WHERE id IN (SELECT id FROM deliveries WHERE campaign_id = ? AND status = 'pending' ORDER BY id LIMIT ?)
       RETURNING id, subscriber_id, attempts`,
    )
      .bind(now(), campaign.id, batchSize)
      .all<Claimed>()
  ).results

  if (claimed.length === 0) {
    await finishCampaignIfDone(env, campaign.id)
    return 0
  }

  const recipients = (
    await env.DB.prepare(`SELECT id, email, token, status FROM subscribers WHERE id IN (${idList(claimed.map((c) => c.subscriber_id))})`).all<Recipient>()
  ).results
  const bySubscriber = new Map(recipients.map((r) => [r.id, r]))

  const toSend: { claim: Claimed; message: Message }[] = []
  const skipIds: number[] = []
  for (const claim of claimed) {
    const recipient = bySubscriber.get(claim.subscriber_id)
    // Someone who unsubscribed (or bounced) after the send was queued must not get the email.
    if (!recipient || recipient.status !== 'confirmed') {
      skipIds.push(claim.id)
      continue
    }
    const unsubUrl = unsubscribeUrl(env, recipient.token)
    const { html, text } = renderCampaign(env, campaign.subject, campaign.body, unsubUrl, bannerFor(env, campaign))
    toSend.push({
      claim,
      message: {
        to: recipient.email,
        subject: campaign.subject,
        html,
        text,
        headers: unsubscribeHeaders(unsubUrl),
        tags: [{ name: 'campaign_id', value: String(campaign.id) }],
      },
    })
  }

  if (skipIds.length) {
    await env.DB.prepare(`UPDATE deliveries SET status = 'skipped', claimed_at = NULL WHERE id IN (${idList(skipIds)})`).run()
  }

  if (toSend.length) {
    const key = `c${campaign.id}-${(await sha256Hex(toSend.map((t) => t.claim.id).join(','))).slice(0, 40)}`
    const result = await sendBatch(env, toSend.map((t) => t.message), key)
    const ids = idList(toSend.map((t) => t.claim.id))

    if (result.ok) {
      await env.DB.prepare(`UPDATE deliveries SET status = 'sent', sent_at = ?, claimed_at = NULL, error = NULL WHERE id IN (${ids})`).bind(now()).run()
    } else {
      console.error('Batch send failed:', result.error)
      const retry = toSend.filter((t) => result.retryable && t.claim.attempts < MAX_ATTEMPTS).map((t) => t.claim.id)
      const fail = toSend.filter((t) => !retry.includes(t.claim.id)).map((t) => t.claim.id)
      if (retry.length) {
        await env.DB.prepare(`UPDATE deliveries SET status = 'pending', claimed_at = NULL, error = ? WHERE id IN (${idList(retry)})`).bind(result.error).run()
      }
      if (fail.length) {
        await env.DB.prepare(`UPDATE deliveries SET status = 'failed', claimed_at = NULL, error = ? WHERE id IN (${idList(fail)})`).bind(result.error).run()
      }
    }
  }

  await finishCampaignIfDone(env, campaign.id)
  return toSend.length
}
