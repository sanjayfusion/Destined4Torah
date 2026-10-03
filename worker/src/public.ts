import { renderConfirmation, sendBatch } from './email'
import type { Env, Subscriber } from './env'
import { esc, messagePage } from './html'
import { clientIp, normalizeEmail, now, randomToken, recordRequest, tooManyRequests } from './util'

const CONFIRM_RESEND_COOLDOWN_SECONDS = 10 * 60

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') ?? ''
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  if (!allowed.includes(origin)) return { Vary: 'Origin' }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function jsonResponse(request: Request, env: Env, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
  })
}

export function handleSubscribeOptions(request: Request, env: Env): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) })
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get('Content-Type') ?? ''
  if (type.includes('application/json')) return (await request.json()) as Record<string, unknown>
  const form = await request.formData()
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']))
}

async function sendConfirmation(env: Env, subscriber: Pick<Subscriber, 'email' | 'name' | 'token'>) {
  const confirmUrl = `${env.WORKER_URL}/confirm?t=${encodeURIComponent(subscriber.token)}`
  const { subject, html, text } = renderConfirmation(env, subscriber.name, confirmUrl)
  return sendBatch(env, [{ to: subscriber.email, subject, html, text }])
}

export async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  const ip = clientIp(request)
  if (await tooManyRequests(env.DB, `subscribe:${ip}`, 5, 3600)) {
    return jsonResponse(request, env, { ok: false, error: 'Too many attempts. Please try again later.' }, 429)
  }
  await recordRequest(env.DB, `subscribe:${ip}`)

  let body: Record<string, unknown>
  try {
    body = await readBody(request)
  } catch {
    return jsonResponse(request, env, { ok: false, error: 'Invalid request.' }, 400)
  }

  // Hidden field that real visitors never fill in; bots do.
  if (body.company) return jsonResponse(request, env, { ok: true })

  const email = normalizeEmail(String(body.email ?? ''))
  if (!email) return jsonResponse(request, env, { ok: false, error: 'Please enter a valid email address.' }, 400)
  const name = String(body.name ?? '').trim().slice(0, 100)
  if (!name) return jsonResponse(request, env, { ok: false, error: 'Please enter your name.' }, 400)
  const phone = String(body.phone ?? '').trim().slice(0, 40)
  const address = String(body.address ?? '').trim().slice(0, 300)

  const existing = await env.DB.prepare('SELECT * FROM subscribers WHERE email = ?').bind(email).first<Subscriber>()
  const timestamp = now()
  let target: Pick<Subscriber, 'email' | 'name' | 'token'>

  if (existing) {
    // Already confirmed or suppressed: say nothing different, so addresses can't be probed.
    if (existing.status === 'confirmed' || existing.status === 'bounced' || existing.status === 'complained') {
      return jsonResponse(request, env, { ok: true })
    }
    if (existing.confirmation_sent_at && timestamp - existing.confirmation_sent_at < CONFIRM_RESEND_COOLDOWN_SECONDS) {
      return jsonResponse(request, env, { ok: true })
    }
    await env.DB.prepare(
      `UPDATE subscribers SET status = 'pending', unsubscribed_at = NULL, confirmation_sent_at = ?, name = ?,
       phone = CASE WHEN ? != '' THEN ? ELSE phone END, address = CASE WHEN ? != '' THEN ? ELSE address END WHERE id = ?`,
    )
      .bind(timestamp, name, phone, phone, address, address, existing.id)
      .run()
    target = { email, name, token: existing.token }
  } else {
    const token = randomToken()
    await env.DB.prepare(
      `INSERT INTO subscribers (email, name, phone, address, lists, source_name, status, token, source, created_at, confirmation_sent_at)
       VALUES (?, ?, ?, ?, 'Website signup', 'Website signup', 'pending', ?, 'website', ?, ?)`,
    )
      .bind(email, name, phone, address, token, timestamp, timestamp)
      .run()
    target = { email, name, token }
  }

  const result = await sendConfirmation(env, target)
  if (!result.ok) {
    console.error('Confirmation email failed:', result.error)
    return jsonResponse(request, env, { ok: false, error: "We couldn't send the confirmation email. Please try again later." }, 502)
  }
  return jsonResponse(request, env, { ok: true })
}

async function findByToken(env: Env, token: string | null): Promise<Subscriber | null> {
  if (!token || token.length < 16) return null
  return env.DB.prepare('SELECT * FROM subscribers WHERE token = ?').bind(token).first<Subscriber>()
}

export async function handleConfirm(request: Request, env: Env): Promise<Response> {
  const subscriber = await findByToken(env, new URL(request.url).searchParams.get('t'))
  if (!subscriber) return messagePage('Link not valid', 'This confirmation link is not valid. Please subscribe again from the website.', 404)

  if (subscriber.status === 'confirmed') {
    return messagePage("You're already subscribed", `Thank you! <a href="${esc(env.SITE_URL)}">Return to the website</a>.`)
  }
  if (subscriber.status !== 'pending') {
    return messagePage('Link no longer active', `Please <a href="${esc(env.SITE_URL)}">subscribe again from the website</a>.`, 410)
  }

  await env.DB.prepare(`UPDATE subscribers SET status = 'confirmed', confirmed_at = ? WHERE id = ?`).bind(now(), subscriber.id).run()
  return messagePage("You're subscribed", `Thank you! You'll receive ${esc(env.FROM_NAME)} by email. <a href="${esc(env.SITE_URL)}">Return to the website</a>.`)
}

export async function handleUnsubscribe(request: Request, env: Env): Promise<Response> {
  const token = new URL(request.url).searchParams.get('t')
  const subscriber = await findByToken(env, token)
  if (!subscriber) return messagePage('Link not valid', 'This unsubscribe link is not valid.', 404)

  if (request.method === 'GET') {
    // GET only asks for confirmation, so mail scanners that prefetch links can't unsubscribe anyone.
    const form = `<form method="post" action="/unsubscribe?t=${encodeURIComponent(token ?? '')}"><button type="submit">Yes, unsubscribe me</button></form>`
    return messagePage('Unsubscribe', `Stop sending <strong>${esc(subscriber.email)}</strong> email from ${esc(env.FROM_NAME)}?`, 200, form)
  }

  if (subscriber.status !== 'unsubscribed') {
    await env.DB.prepare(`UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE id = ?`).bind(now(), subscriber.id).run()
  }
  return messagePage("You've been unsubscribed", `You will no longer receive email from ${esc(env.FROM_NAME)}. <a href="${esc(env.SITE_URL)}">Return to the website</a>.`)
}
