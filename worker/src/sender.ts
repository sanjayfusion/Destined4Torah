import { bannerFor, renderBroadcast } from './email'
import type { Campaign, Env } from './env'
import { mainSegmentId, resendApi, syncContacts, syncPending } from './resend'
import { now, recordRequest, tooManyRequests } from './util'

/**
 * Newsletters are sent as Resend Broadcasts. Broadcasts go to Resend Contacts and do
 * not count against the transactional sending quota, so the whole list goes out in one
 * request instead of 100 emails at a time.
 *
 * Each cron run (once a minute):
 *  1. pushes subscriber changes to Resend Contacts (see resend.ts),
 *  2. once that is finished, turns the oldest "sending" campaign into a Broadcast,
 *  3. removes temporary Segments made for "only people who didn't open" sends.
 */

// Kept for the admin's "paused" notice; Broadcasts are not subject to the daily sending quota.
export const QUOTA_PAUSE_KEY = 'send-paused'
const RATE_PAUSE_KEY = 'resend-rate-limited'

/** Outgoing API calls per cron run. Free-plan Workers may make 50; the weekly and news jobs need a few. */
const CALLS_PER_RUN = 30

/** Placeholder written before calling Resend, so two overlapping runs never both create the same thing. */
const CLAIM = 'claimed:'
const CLAIM_TIMEOUT_SECONDS = 10 * 60

/** Marks the campaign's queued recipients failed so the admin can retry them. */
async function failCampaign(env: Env, campaign: Campaign, error: string): Promise<void> {
  console.error(`Campaign ${campaign.id} failed:`, error)
  await env.DB.batch([
    env.DB.prepare(`UPDATE deliveries SET status = 'failed', claimed_at = NULL, error = ? WHERE campaign_id = ? AND status IN ('pending', 'sending')`).bind(error, campaign.id),
    env.DB.prepare(`UPDATE campaigns SET status = 'sent', sent_at = COALESCE(sent_at, ?) WHERE id = ? AND status = 'sending'`).bind(now(), campaign.id),
  ])
}

/**
 * For an "only people who didn't open" send: puts each queued recipient into a
 * Segment of their own for this campaign. Delivery rows move from 'pending' to
 * 'sending' once the person is in the Segment. Returns calls used, or -1 to stop.
 */
async function fillCampaignSegment(env: Env, campaign: Campaign, budget: number): Promise<number> {
  let used = 0
  let segmentId = campaign.audience_segment_id
  if (segmentId === CLAIM) return 0
  if (!segmentId) {
    const claimed = await env.DB.prepare('UPDATE campaigns SET audience_segment_id = ? WHERE id = ? AND audience_segment_id IS NULL').bind(CLAIM, campaign.id).run()
    if (claimed.meta.changes !== 1) return 0
    const created = await resendApi<{ id: string }>(env, 'POST', '/segments', { name: `Email #${campaign.id} (not opened)` })
    used++
    if (!created.ok) {
      await env.DB.prepare('UPDATE campaigns SET audience_segment_id = NULL WHERE id = ?').bind(campaign.id).run()
      if (created.rateLimited) return -1
      await failCampaign(env, campaign, `Could not create a Resend segment: ${created.error}`)
      return -1
    }
    segmentId = created.data.id
    await env.DB.prepare('UPDATE campaigns SET audience_segment_id = ? WHERE id = ?').bind(segmentId, campaign.id).run()
  }

  const queued = (
    await env.DB.prepare(
      `SELECT d.id, s.email FROM deliveries d JOIN subscribers s ON s.id = d.subscriber_id
       WHERE d.campaign_id = ? AND d.status = 'pending' AND s.status = 'confirmed' ORDER BY d.id LIMIT ?`,
    )
      .bind(campaign.id, budget)
      .all<{ id: number; email: string }>()
  ).results
  for (const row of queued) {
    if (used >= budget) break
    const added = await resendApi(env, 'POST', `/contacts/${encodeURIComponent(row.email)}/segments/${encodeURIComponent(segmentId)}`)
    used++
    if (!added.ok && added.rateLimited) return -1
    if (added.ok) {
      await env.DB.prepare(`UPDATE deliveries SET status = 'sending', claimed_at = ? WHERE id = ?`).bind(now(), row.id).run()
    } else {
      await env.DB.prepare(`UPDATE deliveries SET status = 'failed', error = ? WHERE id = ?`).bind(added.error, row.id).run()
    }
  }
  return used
}

/** Turns the oldest campaign that is waiting to go out into a Resend Broadcast. Returns calls used, or -1 to stop. */
async function sendNextCampaign(env: Env, budget: number): Promise<number> {
  const campaign = await env.DB.prepare(`SELECT * FROM campaigns WHERE status = 'sending' ORDER BY id LIMIT 1`).first<Campaign>()
  if (!campaign) return 0
  if (campaign.broadcast_id && !campaign.broadcast_id.startsWith(CLAIM)) {
    // The Broadcast was created but the run stopped before recording it as sent.
    await env.DB.batch([
      env.DB.prepare(`UPDATE deliveries SET status = 'sent', sent_at = ?, claimed_at = NULL WHERE campaign_id = ? AND status IN ('pending', 'sending')`).bind(now(), campaign.id),
      env.DB.prepare(`UPDATE campaigns SET status = 'sent', sent_at = ? WHERE id = ? AND status = 'sending'`).bind(now(), campaign.id),
    ])
    return 0
  }
  if (campaign.broadcast_id?.startsWith(CLAIM)) {
    // Another run is creating this Broadcast. If it never finished, say so rather than risk sending twice.
    if (now() - Number(campaign.broadcast_id.slice(CLAIM.length)) > CLAIM_TIMEOUT_SECONDS) {
      await env.DB.prepare('UPDATE campaigns SET broadcast_id = NULL WHERE id = ?').bind(campaign.id).run()
      await failCampaign(env, campaign, 'Sending was interrupted. Check Broadcasts in the Resend dashboard before retrying, in case it went out.')
    }
    return 0
  }

  // Anyone who unsubscribed (or bounced) after the send was queued must not get the email.
  await env.DB.prepare(
    `UPDATE deliveries SET status = 'skipped', claimed_at = NULL
     WHERE campaign_id = ? AND status IN ('pending', 'sending') AND subscriber_id NOT IN (SELECT id FROM subscribers WHERE status = 'confirmed')`,
  )
    .bind(campaign.id)
    .run()

  // Wait until every subscriber change has reached Resend, so the Broadcast goes to exactly the right people.
  if ((await syncPending(env)) > 0) return 0

  let used = 0
  let segmentId: string
  if (campaign.unopened_of) {
    used = await fillCampaignSegment(env, campaign, budget)
    if (used < 0) return used
    const left = await env.DB.prepare(`SELECT COUNT(*) AS n FROM deliveries WHERE campaign_id = ? AND status = 'pending'`).bind(campaign.id).first<{ n: number }>()
    if ((left?.n ?? 0) > 0) return used
    const ready = await env.DB.prepare('SELECT audience_segment_id FROM campaigns WHERE id = ?').bind(campaign.id).first<{ audience_segment_id: string | null }>()
    if (!ready?.audience_segment_id || ready.audience_segment_id === CLAIM) return used
    segmentId = ready.audience_segment_id
  } else {
    const segment = await mainSegmentId(env)
    used++
    if (!segment.ok) {
      if (segment.rateLimited) return -1
      await failCampaign(env, campaign, `Could not find the Resend segment: ${segment.error}`)
      return used
    }
    segmentId = segment.data.id
  }

  const recipients = await env.DB.prepare(`SELECT COUNT(*) AS n FROM deliveries WHERE campaign_id = ? AND status IN ('pending', 'sending')`).bind(campaign.id).first<{ n: number }>()
  if ((recipients?.n ?? 0) === 0) {
    await env.DB.prepare(`UPDATE campaigns SET status = 'sent', sent_at = ? WHERE id = ? AND status = 'sending'`).bind(now(), campaign.id).run()
    return used
  }

  // Claim the campaign so overlapping runs can never create two Broadcasts for it.
  const claim = await env.DB.prepare(`UPDATE campaigns SET broadcast_id = ? WHERE id = ? AND status = 'sending' AND broadcast_id IS NULL`)
    .bind(`${CLAIM}${now()}`, campaign.id)
    .run()
  if (claim.meta.changes !== 1) return used

  const { html, text } = renderBroadcast(env, campaign.subject, campaign.body, bannerFor(env, campaign))
  if (!env.RESEND_API_KEY) {
    await env.DB.prepare('UPDATE campaigns SET broadcast_id = NULL WHERE id = ?').bind(campaign.id).run()
    console.log(`[dry-run] would send Broadcast "${campaign.subject}" to segment ${segmentId} (${recipients?.n} people)`)
  } else {
    const result = await resendApi<{ id: string }>(env, 'POST', '/broadcasts', {
      segment_id: segmentId,
      from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      ...(env.REPLY_TO ? { reply_to: env.REPLY_TO } : {}),
      subject: campaign.subject,
      html,
      text,
      name: `#${campaign.id} ${campaign.subject}`.slice(0, 200),
      send: true,
    })
    used++
    if (!result.ok) {
      await env.DB.prepare('UPDATE campaigns SET broadcast_id = NULL WHERE id = ?').bind(campaign.id).run()
      if (result.rateLimited) return -1
      // Network errors are not retried automatically: the Broadcast may have been created anyway.
      await failCampaign(
        env,
        campaign,
        result.status === 0
          ? `${result.error}. Check Broadcasts in the Resend dashboard before retrying, in case it went out.`
          : result.error,
      )
      return used
    }
    await env.DB.prepare('UPDATE campaigns SET broadcast_id = ? WHERE id = ?').bind(result.data.id, campaign.id).run()
  }

  await env.DB.batch([
    env.DB.prepare(`UPDATE deliveries SET status = 'sent', sent_at = ?, claimed_at = NULL, error = NULL WHERE campaign_id = ? AND status IN ('pending', 'sending')`).bind(now(), campaign.id),
    env.DB.prepare(`UPDATE campaigns SET status = 'sent', sent_at = ? WHERE id = ? AND status = 'sending'`).bind(now(), campaign.id),
  ])
  return used
}

/** Deletes the temporary Segment of an "only people who didn't open" send once its Broadcast has gone out. */
async function cleanUpSegments(env: Env): Promise<number> {
  const done = await env.DB.prepare(`SELECT id, broadcast_id, audience_segment_id FROM campaigns WHERE status = 'sent' AND audience_segment_id IS NOT NULL AND audience_segment_id != ? LIMIT 1`).bind(CLAIM).first<{
    id: number
    broadcast_id: string | null
    audience_segment_id: string
  }>()
  if (!done) return 0
  let used = 0
  if (done.broadcast_id) {
    const broadcast = await resendApi<{ status?: string }>(env, 'GET', `/broadcasts/${encodeURIComponent(done.broadcast_id)}`)
    used++
    if (!broadcast.ok || broadcast.data.status !== 'sent') return used
  }
  const removed = await resendApi(env, 'DELETE', `/segments/${encodeURIComponent(done.audience_segment_id)}`)
  used++
  if (removed.ok || removed.status === 404) await env.DB.prepare('UPDATE campaigns SET audience_segment_id = NULL WHERE id = ?').bind(done.id).run()
  return used
}

/** Runs every minute from the cron, and right after the admin presses Send. */
export async function processQueue(env: Env): Promise<number> {
  if (await tooManyRequests(env.DB, RATE_PAUSE_KEY, 1, 60)) return 0
  const slowDown = () => recordRequest(env.DB, RATE_PAUSE_KEY)

  let used = await syncContacts(env, CALLS_PER_RUN)
  if (used < 0) return slowDown().then(() => 0)

  const sent = await sendNextCampaign(env, CALLS_PER_RUN - used)
  if (sent < 0) return slowDown().then(() => 0)
  used += sent

  if (env.RESEND_API_KEY && used < CALLS_PER_RUN - 2) {
    const cleaned = await cleanUpSegments(env)
    used += cleaned
  }
  return used
}
