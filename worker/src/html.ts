const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c])
}

const STYLES = `
  *{box-sizing:border-box}
  body{margin:0;background:#fdfcf9;color:#4b4453;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  h1,h2,h3{color:#1a1522;font-family:Georgia,"Times New Roman",serif;line-height:1.25}
  a{color:#8a5a2c}
  .wrap{max-width:860px;margin:0 auto;padding:24px 20px 80px}
  .narrow{max-width:520px}
  .card{background:#fff;border:1px solid #e6e2d8;border-radius:14px;padding:22px 24px;margin:0 0 18px}
  nav.top{display:flex;gap:18px;align-items:center;flex-wrap:wrap;padding:14px 0 18px;border-bottom:1px solid #e6e2d8;margin-bottom:22px}
  nav.top strong{font-family:Georgia,serif;color:#1a1522;margin-right:auto}
  nav.top form{margin:0}
  label{display:block;font-weight:600;font-size:14px;margin:14px 0 5px}
  input[type=text],input[type=email],input[type=password],input[type=search],textarea,select{width:100%;padding:10px 12px;border:1px solid #d9d4c7;border-radius:8px;font:inherit;background:#fff;color:inherit}
  textarea{min-height:320px;font-family:ui-monospace,Menlo,monospace;font-size:14px}
  button,.btn{display:inline-block;background:#8a5a2c;color:#fff;border:0;border-radius:8px;padding:10px 18px;font:inherit;font-weight:600;cursor:pointer;text-decoration:none}
  button.secondary,.btn.secondary{background:#fff;color:#8a5a2c;border:1px solid #8a5a2c}
  button.danger{background:#b3352b}
  button.link{background:none;border:0;color:#8a5a2c;padding:0;font-weight:500;text-decoration:underline}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th,td{text-align:left;padding:9px 8px;border-bottom:1px solid #eee9dc;vertical-align:top}
  th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#7a7285}
  .stats{display:flex;gap:14px;flex-wrap:wrap}
  .stat{flex:1;min-width:120px;background:#fff;border:1px solid #e6e2d8;border-radius:12px;padding:14px 16px}
  .stat b{display:block;font:600 26px Georgia,serif;color:#1a1522}
  .muted{color:#7a7285;font-size:14px}
  .warn{background:#fff6e5;border:1px solid #f0d9a3;border-radius:10px;padding:10px 14px;margin:0 0 14px;font-size:14px}
  .ok{background:#eaf6ec;border:1px solid #b9dfc0;border-radius:10px;padding:10px 14px;margin:0 0 14px;font-size:14px}
  .err{background:#fdecea;border:1px solid #f0b7b1;border-radius:10px;padding:10px 14px;margin:0 0 14px;font-size:14px}
  .pill{display:inline-block;border-radius:999px;padding:1px 10px;font-size:12px;background:#eee9dc}
  .pill.confirmed,.pill.sent{background:#dff1e2}
  .pill.pending,.pill.sending,.pill.draft{background:#fdf0cf}
  .pill.unsubscribed,.pill.bounced,.pill.complained,.pill.failed{background:#f7dcd9}
  .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
`

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  // "no-referrer" makes browsers send `Origin: null` on form posts, which the CSRF check rejects.
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  // No scripts at all; inline styles only.
  'Content-Security-Policy':
    "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
}

export function htmlResponse(title: string, body: string, status = 200, extraHeaders: Record<string, string> = {}): Response {
  const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>${STYLES}</style></head><body>${body}</body></html>`
  return new Response(doc, { status, headers: { ...SECURITY_HEADERS, ...extraHeaders } })
}

/** Small centered message page used by the public confirm/unsubscribe links. */
export function messagePage(title: string, message: string, status = 200, extra = ''): Response {
  return htmlResponse(
    title,
    `<div class="wrap narrow"><div class="card"><h1>${esc(title)}</h1><p>${message}</p>${extra}</div></div>`,
    status,
  )
}
