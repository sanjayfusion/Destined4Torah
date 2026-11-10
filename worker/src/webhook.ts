import type { Env } from './env'
import { now, safeEqual } from './util'

const TOLERANCE_SECONDS = 5 * 60
const encoder = new TextEncoder()

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

/** Verifies a Svix-style signature, which is how Resend signs its webhooks. */
async function verifySignature(request: Request, rawBody: string, secret: string): Promise<boolean> {
  const id = request.headers.get('svix-id')
  const timestamp = request.headers.get('svix-timestamp')
  const header = request.headers.get('svix-signature')
  if (!id || !timestamp || !header) return false
  if (Math.abs(now() - Number(timestamp)) > TOLERANCE_SECONDS) return false

  const key = await crypto.subtle.importKey('raw', base64ToBytes(secret.replace(/^whsec_/, '')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${id}.${timestamp}.${rawBody}`))
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)))

  for (const part of header.split(' ')) {
    const [version, signature] = part.split(',')
    if (version === 'v1' && signature && (await safeEqual(signature, expected))) return true
  }
  return false
}

interface ResendEvent {
  type?: string
  created_at?: string
  data?: {
    to?: string[] | string
    tags?: Record<string, string> | { name: string; value: string }[]
    bounce?: { type?: string }
    broadcast_id?: string
    // contact.* events
    email?: string
    unsubscribed?: boolean
  }
}

function campaignIdFromTags(tags: NonNullable<ResendEvent['data']>['tags']): number | null {
  if (!tags) return null
  const raw = Array.isArray(tags) ? tags.find((t) => t.name === 'campaign_id')?.value : tags.campaign_id
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function handleResendWebhook(request: Request, env: Env): Promise<Response> {
  if (!env.RESEND_WEBHOOK_SECRET) return new Response('Webhook not configured', { status: 404 })

  const rawBody = await request.text()
  if (!(await verifySignature(request, rawBody, env.RESEND_WEBHOOK_SECRET))) {
    return new Response('Invalid signature', { status: 401 })
  }

  let event: ResendEvent
  try {
    event = JSON.parse(rawBody) as ResendEvent
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  // Someone used the unsubscribe link (or preference page) in a Broadcast: stop mailing them here too.
  if (event.type === 'contact.updated' || event.type === 'contact.deleted') {
    const email = event.data?.email?.toLowerCase()
    // Ignore news older than the person's latest confirmation (they may have re-subscribed since).
    const at = Math.floor(Date.parse(event.created_at ?? '') / 1000) || now()
    if (email && event.type === 'contact.updated' && event.data?.unsubscribed === true) {
      await env.DB.prepare(`UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE email = ? AND status = 'confirmed' AND COALESCE(confirmed_at, 0) < ?`)
        .bind(now(), email, at)
        .run()
    } else if (email && event.type === 'contact.deleted') {
      // Removed in the Resend dashboard: put them back so they keep getting the newsletter (delete them here to stop it).
      await env.DB.prepare(`UPDATE subscribers SET resend_synced = 0, resend_exists = 0 WHERE email = ? AND status = 'confirmed' AND resend_exists = 1`).bind(email).run()
    }
    return new Response('ok')
  }

  const type = (event.type ?? '').replace(/^email\./, '')
  const recipient = (Array.isArray(event.data?.to) ? event.data?.to[0] : event.data?.to)?.toLowerCase()
  if (!recipient || !type) return new Response('ok')

  let campaignId = campaignIdFromTags(event.data?.tags)
  if (campaignId === null && event.data?.broadcast_id) {
    const row = await env.DB.prepare('SELECT id FROM campaigns WHERE broadcast_id = ?').bind(event.data.broadcast_id).first<{ id: number }>()
    campaignId = row?.id ?? null
  }
  await env.DB.prepare('INSERT INTO events (campaign_id, email, type, created_at) VALUES (?, ?, ?, ?)')
    .bind(campaignId, recipient, type, now())
    .run()

  // Stop mailing addresses that bounce permanently or mark us as spam.
  const bounceType = event.data?.bounce?.type?.toLowerCase()
  if (type === 'bounced' && (!bounceType || bounceType === 'permanent')) {
    await env.DB.prepare(`UPDATE subscribers SET status = 'bounced' WHERE email = ? AND status IN ('confirmed', 'pending')`).bind(recipient).run()
  } else if (type === 'complained') {
    await env.DB.prepare(`UPDATE subscribers SET status = 'complained' WHERE email = ?`).bind(recipient).run()
  }
  return new Response('ok')
}
