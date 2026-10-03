import type { Env } from './env'
import { esc } from './html'
import { markdownToHtml, markdownToText } from './markdown'

export interface Message {
  to: string
  subject: string
  html: string
  text: string
  headers?: Record<string, string>
  tags?: { name: string; value: string }[]
}

export type SendResult = { ok: true } | { ok: false; error: string; retryable: boolean }

export function mailingAddress(env: Env): string {
  return (env.MAILING_ADDRESS ?? '').trim()
}

export function emailConfigured(env: Env): boolean {
  return Boolean(env.RESEND_API_KEY)
}

function fromHeader(env: Env): string {
  return `${env.FROM_NAME} <${env.FROM_EMAIL}>`
}

/** Sends up to 100 emails in one request via Resend. Without an API key it only logs (dry run). */
export async function sendBatch(env: Env, messages: Message[], idempotencyKey?: string): Promise<SendResult> {
  if (messages.length === 0) return { ok: true }

  if (!env.RESEND_API_KEY) {
    console.log(`[dry-run] would send ${messages.length} email(s):`, messages.map((m) => `${m.to} <- "${m.subject}"`).join('; '))
    for (const m of messages.slice(0, 3)) console.log(`[dry-run] text for ${m.to}:\n${m.text.slice(0, 600)}`)
    return { ok: true }
  }

  const payload = messages.map((m) => ({
    from: fromHeader(env),
    to: [m.to],
    subject: m.subject,
    html: m.html,
    text: m.text,
    ...(env.REPLY_TO ? { reply_to: env.REPLY_TO } : {}),
    ...(m.headers ? { headers: m.headers } : {}),
    ...(m.tags ? { tags: m.tags } : {}),
  }))

  let response: Response
  try {
    response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    return { ok: false, error: `Network error: ${String(error)}`, retryable: true }
  }

  if (response.ok) return { ok: true }
  const detail = (await response.text()).slice(0, 300)
  return { ok: false, error: `Resend ${response.status}: ${detail}`, retryable: response.status >= 500 || response.status === 429 }
}

interface Layout {
  env: Env
  subject: string
  bodyHtml: string
  footerHtml: string
}

function layout({ env, subject, bodyHtml, footerHtml }: Layout): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f1ea">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="padding:0 8px 14px;font:600 20px Georgia,'Times New Roman',serif;color:#1a1522;text-align:center">${esc(env.FROM_NAME)}</td></tr>
<tr><td style="background:#ffffff;border:1px solid #e6e2d8;border-radius:12px;padding:30px 32px;font:16px/1.6 -apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#3b3544">${bodyHtml}</td></tr>
<tr><td style="padding:18px 12px 0;font:12px/1.6 Arial,sans-serif;color:#7a7285;text-align:center">${footerHtml}</td></tr>
</table></td></tr></table></body></html>`
}

function addressHtml(env: Env): string {
  return mailingAddress(env) ? esc(mailingAddress(env)).replace(/\n/g, '<br>') : ''
}

export function renderCampaign(env: Env, subject: string, markdown: string, unsubscribeUrl: string): { html: string; text: string } {
  const footerHtml = `You are receiving this because you subscribed at ${esc(env.SITE_URL.replace(/^https?:\/\//, ''))}.<br>
<a href="${esc(unsubscribeUrl)}" style="color:#7a7285">Unsubscribe</a><br>${addressHtml(env)}`
  const text = `${markdownToText(markdown)}\n\n--\nYou are receiving this because you subscribed at ${env.SITE_URL}.\nUnsubscribe: ${unsubscribeUrl}\n${mailingAddress(env)}`
  return { html: layout({ env, subject, bodyHtml: markdownToHtml(markdown), footerHtml }), text }
}

export function renderConfirmation(env: Env, name: string, confirmUrl: string): { subject: string; html: string; text: string } {
  const greeting = name ? `Hi ${esc(name)},` : 'Hello,'
  const bodyHtml = `<p style="margin:0 0 16px">${greeting}</p>
<p style="margin:0 0 16px">Please confirm that you'd like to receive ${esc(env.FROM_NAME)} by email.</p>
<p style="margin:22px 0"><a href="${esc(confirmUrl)}" style="background:#8a5a2c;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;display:inline-block">Yes, subscribe me</a></p>
<p style="margin:0;color:#7a7285;font-size:14px">If you didn't ask for this, you can ignore this email and you won't be subscribed.</p>`
  const footerHtml = addressHtml(env)
  return {
    subject: `Please confirm your subscription to ${env.FROM_NAME}`,
    html: layout({ env, subject: 'Confirm your subscription', bodyHtml, footerHtml }),
    text: `${name ? `Hi ${name},` : 'Hello,'}\n\nPlease confirm that you'd like to receive ${env.FROM_NAME} by email:\n${confirmUrl}\n\nIf you didn't ask for this, you can ignore this email.\n\n${mailingAddress(env)}`,
  }
}

export function unsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

export function unsubscribeUrl(env: Env, token: string): string {
  return `${env.WORKER_URL}/unsubscribe?t=${encodeURIComponent(token)}`
}
