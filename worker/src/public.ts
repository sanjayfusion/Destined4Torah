import { renderConfirmation, sendBatch } from './email'
import type { Env, Subscriber } from './env'
import { esc, htmlResponse, messagePage } from './html'
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
  if (await tooManyRequests(env.DB, `subscribe:${ip}`, 20, 3600)) {
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
  const sourceLabel = body.via === 'qr' ? 'QR code' : 'Website signup'

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
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, 'website', ?, ?)`,
    )
      .bind(email, name, phone, address, sourceLabel, sourceLabel, token, timestamp, timestamp)
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

function preferencesForm(subscriber: Subscriber, token: string, error = ''): Response {
  const field = (label: string, name: string, value: string, extra = '') =>
    `<label for="${name}">${label}</label><input type="text" id="${name}" name="${name}" value="${esc(value)}" ${extra}>`
  const form = `<form method="post" action="/preferences?t=${encodeURIComponent(token)}">
    ${error ? `<div class="err">${esc(error)}</div>` : ''}
    <label>Email address</label><p style="margin:0">${esc(subscriber.email)}</p>
    <p class="muted" style="margin:4px 0 0">To use a different email address, just reply to any newsletter and I'll change it for you.</p>
    ${field('Name', 'name', subscriber.name, 'required maxlength="100" autocomplete="name"')}
    ${field('Phone (optional)', 'phone', subscriber.phone, 'maxlength="40" autocomplete="tel"')}
    ${field('Mailing address (optional)', 'address', subscriber.address, 'maxlength="300" autocomplete="street-address"')}
    <div class="actions"><button type="submit">Save my details</button></div>
  </form>`
  return htmlResponse('Update your details', `<div class="wrap narrow"><div class="card"><h1>Update your details</h1><p class="muted">Keep your contact details current so I can stay in touch.</p>${form}</div></div>`)
}

/** Lets a subscriber update their own name, phone and address from the link in every email. */
export async function handlePreferences(request: Request, env: Env): Promise<Response> {
  const token = new URL(request.url).searchParams.get('t')
  const subscriber = await findByToken(env, token)
  if (!subscriber || !token) return messagePage('Link not valid', 'This link is not valid. Please use the link in your most recent email from Destined4Torah.', 404)

  if (request.method === 'GET') return preferencesForm(subscriber, token)

  const ip = clientIp(request)
  if (await tooManyRequests(env.DB, `prefs:${ip}`, 30, 3600)) return messagePage('Too many attempts', 'Please try again later.', 429)
  await recordRequest(env.DB, `prefs:${ip}`)

  let body: Record<string, unknown>
  try {
    body = await readBody(request)
  } catch {
    return messagePage('Something went wrong', 'Please go back and try again.', 400)
  }
  const name = String(body.name ?? '').trim().slice(0, 100)
  const phone = String(body.phone ?? '').trim().slice(0, 40)
  const address = String(body.address ?? '').trim().slice(0, 300)
  if (!name) return preferencesForm({ ...subscriber, name, phone, address }, token, 'Please enter your name.')

  await env.DB.prepare('UPDATE subscribers SET name = ?, phone = ?, address = ? WHERE id = ?').bind(name, phone, address, subscriber.id).run()
  return messagePage('Details updated', `Thank you, ${esc(name)}. Your details have been saved. <a href="${esc(env.SITE_URL)}">Return to the website</a>.`)
}

function joinForm(env: Env, values: { name?: string; email?: string; phone?: string; address?: string } = {}, error = ''): Response {
  const field = (label: string, name: string, value: string | undefined, extra = '', type = 'text') =>
    `<label for="${name}">${label}</label><input type="${type}" id="${name}" name="${name}" value="${esc(value ?? '')}" ${extra}>`
  const form = `<form method="post" action="/join">
    ${error ? `<div class="err">${esc(error)}</div>` : ''}
    ${field('Name', 'name', values.name, 'required maxlength="100" autocomplete="name"')}
    ${field('Email address', 'email', values.email, 'required maxlength="200" autocomplete="email" inputmode="email"', 'email')}
    ${field('Phone (optional)', 'phone', values.phone, 'maxlength="40" autocomplete="tel"')}
    ${field('Mailing address (optional)', 'address', values.address, 'maxlength="300" autocomplete="street-address"')}
    <div style="position:absolute;left:-9999px" aria-hidden="true"><label for="company">Company</label><input type="text" id="company" name="company" tabindex="-1" autocomplete="off"></div>
    <input type="hidden" name="via" value="qr">
    <div class="actions"><button type="submit" style="width:100%">Sign me up</button></div>
    <p class="muted" style="margin:14px 0 0">We'll email you a link to confirm. You can unsubscribe at any time.</p>
  </form>`
  const logo = `<p style="text-align:center;margin:0 0 6px"><img src="${esc(env.WORKER_URL)}/assets/logo.png" alt="Destined4Torah" width="280" style="max-width:100%;height:auto"></p>`
  return htmlResponse('Join Destined4Torah', `<div class="wrap narrow"><div class="card">${logo}<h1 style="text-align:center;font-size:24px">Get Destined4Torah in your inbox</h1><p class="muted" style="text-align:center">Teaching and updates from Dr. Sanjay Prajapati.</p>${form}</div></div>`)
}

/** A simple signup page for the QR code: same double opt-in as the website form. */
export async function handleJoin(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') return joinForm(env)

  const values = await readBody(request.clone()).catch(() => ({}) as Record<string, unknown>)
  const typed = { name: String(values.name ?? ''), email: String(values.email ?? ''), phone: String(values.phone ?? ''), address: String(values.address ?? '') }
  const response = await handleSubscribe(request, env)
  const result = (await response.json().catch(() => ({ ok: false, error: 'Something went wrong. Please try again.' }))) as { ok: boolean; error?: string }
  if (!result.ok) return joinForm(env, typed, result.error ?? 'Something went wrong. Please try again.')
  return messagePage('Check your email', `We sent a confirmation link to <strong>${esc(typed.email.trim())}</strong>. Open it and tap the button to finish subscribing. If you don't see it, check your spam folder.`)
}
