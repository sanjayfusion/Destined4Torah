import { checkPassword, clearSessionCookie, createSessionCookie, isAuthenticated, sameOrigin } from './auth'
import { parseImport, type ImportRow } from './csv'
import { emailConfigured, mailingAddress, renderCampaign, sendBatch } from './email'
import type { Campaign, Env, Subscriber } from './env'
import { esc, htmlResponse } from './html'
import { processQueue } from './sender'
import { clientIp, formatDate, normalizeEmail, now, randomToken, recordRequest, tooManyRequests } from './util'

const PAGE_SIZE = 50

type Flash = { text: string; kind: 'ok' | 'err' } | null

function redirect(path: string, text?: string, kind: 'ok' | 'err' = 'ok', headers: Record<string, string> = {}): Response {
  const separator = path.includes('?') ? '&' : '?'
  const location = text ? `${path}${separator}msg=${encodeURIComponent(text)}&kind=${kind}` : path
  return new Response(null, { status: 303, headers: { Location: location, ...headers } })
}

function flashFrom(url: URL): Flash {
  const text = url.searchParams.get('msg')
  if (!text) return null
  return { text: text.slice(0, 300), kind: url.searchParams.get('kind') === 'err' ? 'err' : 'ok' }
}

function adminPage(title: string, body: string, flash: Flash = null, extraHead = ''): Response {
  const nav = `<nav class="top"><strong>Daily Planet mail</strong>
    <a href="/admin">Dashboard</a><a href="/admin/subscribers">Subscribers</a><a href="/admin/campaigns">Emails</a>
    <form method="post" action="/admin/logout"><button class="link" type="submit">Log out</button></form></nav>`
  const notice = flash ? `<div class="${flash.kind}">${esc(flash.text)}</div>` : ''
  return htmlResponse(title, `<div class="wrap">${nav}${notice}${body}</div>${extraHead}`)
}

function warnings(env: Env): string {
  const items: string[] = []
  if (!emailConfigured(env)) items.push('Email sending is in <strong>test mode</strong> (no sending-service key is set), so emails are logged instead of delivered.')
  if (!mailingAddress(env)) items.push('Add your <strong>mailing address</strong> (MAILING_ADDRESS). It is legally required in every email, and sending to your list is blocked until it is set.')
  if (env.FROM_EMAIL.endsWith('@example.com')) items.push('<strong>FROM_EMAIL</strong> is still the placeholder. Set it to an address on your verified sending domain.')
  if (env.WORKER_URL.includes('localhost')) items.push('<strong>WORKER_URL</strong> points to localhost, so links in emails (confirm and unsubscribe) will not work for subscribers.')
  return items.map((i) => `<div class="warn">${i}</div>`).join('')
}

async function formData(request: Request): Promise<Record<string, string>> {
  const form = await request.formData()
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']))
}

// ---------- login ----------

async function login(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const form = (flash: Flash) =>
    htmlResponse(
      'Log in',
      `<div class="wrap narrow"><div class="card"><h1>Daily Planet mail</h1>${flash ? `<div class="err">${esc(flash.text)}</div>` : ''}
      <form method="post" action="/admin/login"><label for="password">Admin password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
      <div class="actions"><button type="submit">Log in</button></div></form></div></div>`,
    )

  if (request.method !== 'POST') return form(flashFrom(url))
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403 })

  const key = `login:${clientIp(request)}`
  if (await tooManyRequests(env.DB, key, 5, 15 * 60)) {
    return form({ text: 'Too many failed attempts. Try again in 15 minutes.', kind: 'err' })
  }
  const { password = '' } = await formData(request)
  if (!(await checkPassword(env, password))) {
    await recordRequest(env.DB, key)
    return form({ text: 'Incorrect password.', kind: 'err' })
  }
  return redirect('/admin', undefined, 'ok', { 'Set-Cookie': await createSessionCookie(env, request) })
}

// ---------- dashboard ----------

async function dashboard(env: Env, url: URL): Promise<Response> {
  const counts = (await env.DB.prepare('SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status').all<{ status: string; n: number }>()).results
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]))
  const recent = (await env.DB.prepare('SELECT * FROM campaigns ORDER BY id DESC LIMIT 5').all<Campaign>()).results

  const stat = (label: string, key: string) => `<div class="stat"><b>${byStatus[key] ?? 0}</b><span class="muted">${label}</span></div>`
  const rows = recent.length
    ? recent.map((c) => `<tr><td><a href="/admin/campaigns/${c.id}">${esc(c.subject)}</a></td><td><span class="pill ${c.status}">${c.status}</span></td><td>${formatDate(c.sent_at ?? c.created_at)}</td></tr>`).join('')
    : '<tr><td colspan="3" class="muted">No emails yet.</td></tr>'

  return adminPage(
    'Dashboard',
    `${warnings(env)}<h1>Dashboard</h1>
    <div class="stats">${stat('Subscribed', 'confirmed')}${stat('Awaiting confirmation', 'pending')}${stat('Unsubscribed', 'unsubscribed')}${stat('Bounced or spam', 'bounced')}</div>
    <div class="actions"><a class="btn" href="/admin/campaigns/new">Write an email</a><a class="btn secondary" href="/admin/import">Add or import people</a></div>
    <h2>Recent emails</h2><div class="card"><table><tr><th>Subject</th><th>Status</th><th>Date</th></tr>${rows}</table></div>`,
    flashFrom(url),
  )
}

// ---------- subscribers ----------

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

async function subscribersPage(env: Env, url: URL): Promise<Response> {
  const status = url.searchParams.get('status') ?? ''
  const q = (url.searchParams.get('q') ?? '').trim()
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  const like = `%${escapeLike(q)}%`

  const list = url.searchParams.get('list') ?? ''
  const where = `WHERE (? = '' OR status = ?) AND (? = '' OR email LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\')
    AND (? = '' OR (', ' || lists || ', ') LIKE ? ESCAPE '\\')`
  const binds = [status, status, q, like, like, like, list, `%, ${escapeLike(list)}, %`]
  const total = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM subscribers ${where}`).bind(...binds).first<{ n: number }>())?.n ?? 0
  const people = (
    await env.DB.prepare(`SELECT * FROM subscribers ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...binds, PAGE_SIZE, (page - 1) * PAGE_SIZE).all<Subscriber>()
  ).results

  const options = ['', 'confirmed', 'pending', 'unsubscribed', 'bounced', 'complained']
    .map((s) => `<option value="${s}"${s === status ? ' selected' : ''}>${s || 'All statuses'}</option>`)
    .join('')
  const listCounts = new Map<string, number>()
  const listRows = (await env.DB.prepare(`SELECT lists, COUNT(*) AS n FROM subscribers WHERE lists != '' GROUP BY lists`).all<{ lists: string; n: number }>()).results
  for (const r of listRows) for (const name of r.lists.split(', ')) listCounts.set(name, (listCounts.get(name) ?? 0) + r.n)
  const listOptions = ['', ...[...listCounts.keys()].sort()]
    .map((l) => `<option value="${esc(l)}"${l === list ? ' selected' : ''}>${l ? `${esc(l)} (${listCounts.get(l)})` : 'All lists'}</option>`)
    .join('')
  const rows = people.length
    ? people
        .map(
          (s) => `<tr><td>${s.name ? esc(s.name) : '<span class="muted">(no name)</span>'}<br><span class="muted">${esc(s.email)}</span></td><td>${esc(s.phone)}</td><td class="muted">${esc(s.address)}</td><td class="muted">${esc(s.lists)}</td><td><span class="pill ${s.status}">${s.status}</span></td><td>${formatDate(s.created_at)}</td>
          <td><form method="post" action="/admin/subscribers/${s.id}/delete" style="margin:0"><button class="link" type="submit">Delete</button></form></td></tr>`,
        )
        .join('')
    : '<tr><td colspan="7" class="muted">No subscribers match.</td></tr>'

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const query = (p: number) => `/admin/subscribers?status=${encodeURIComponent(status)}&list=${encodeURIComponent(list)}&q=${encodeURIComponent(q)}&page=${p}`
  const pager = `<p class="muted">${total} people · page ${page} of ${pages} ${page > 1 ? `· <a href="${query(page - 1)}">Previous</a>` : ''} ${page < pages ? `· <a href="${query(page + 1)}">Next</a>` : ''}</p>`

  return adminPage(
    'Subscribers',
    `<h1>Subscribers</h1>
    <form method="get" class="row" style="margin-bottom:14px"><input type="search" name="q" value="${esc(q)}" placeholder="Search name, email or phone" style="max-width:280px">
      <select name="status" style="max-width:170px">${options}</select><select name="list" style="max-width:260px">${listOptions}</select><button type="submit" class="secondary">Filter</button>
      <a class="btn secondary" href="/admin/subscribers.csv?status=${encodeURIComponent(status)}&list=${encodeURIComponent(list)}">Export CSV</a><a class="btn" href="/admin/import">Add or import</a></form>
    <div class="card"><table><tr><th>Name / email</th><th>Phone</th><th>Address</th><th>Lists</th><th>Status</th><th>Joined</th><th></th></tr>${rows}</table>${pager}</div>`,
    flashFrom(url),
  )
}

function csvCell(value: string): string {
  // A leading = + - @ can be run as a formula when the file is opened in a spreadsheet.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

async function exportCsv(env: Env, url: URL): Promise<Response> {
  const status = url.searchParams.get('status') ?? ''
  const list = url.searchParams.get('list') ?? ''
  const rows = (
    await env.DB.prepare(
      `SELECT email, name, phone, address, lists, status, created_at FROM subscribers
       WHERE (? = '' OR status = ?) AND (? = '' OR (', ' || lists || ', ') LIKE ? ESCAPE '\\') ORDER BY id`,
    )
      .bind(status, status, list, `%, ${escapeLike(list)}, %`)
      .all<Subscriber>()
  ).results
  const lines = [
    'email,name,phone,address,lists,status,joined',
    ...rows.map((r) => [r.email, r.name, r.phone, r.address, r.lists, r.status, formatDate(r.created_at)].map(csvCell).join(',')),
  ]
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="subscribers.csv"', 'Cache-Control': 'no-store' },
  })
}

function importPage(url: URL): Response {
  return adminPage(
    'Add or import people',
    `<h1>Add or import people</h1>
    <div class="card"><h2>Add one person</h2><form method="post" action="/admin/subscribers/add">
      <label for="name">Name (required)</label><input id="name" name="name" type="text" required maxlength="100">
      <label for="email">Email (required)</label><input id="email" name="email" type="email" required>
      <label for="phone">Phone (optional)</label><input id="phone" name="phone" type="text" maxlength="40">
      <label for="address">Address (optional)</label><input id="address" name="address" type="text" maxlength="300">
      <label><input type="checkbox" name="consent" value="yes" required> This person has given me permission to email them.</label>
      <div class="actions"><button type="submit">Add person</button></div></form></div>
    <div class="card"><h2>Import a list</h2>
      <p class="muted">Upload a CSV exported from Constant Contact (or any list with an email column), or paste it below. Name, phone and address columns are picked up automatically. People marked unsubscribed or bounced in the file are skipped, anyone who has already unsubscribed here stays unsubscribed, and rows without an email are ignored. People already on file keep their details; blank ones are filled in.</p>
      <form method="post" action="/admin/subscribers/import" enctype="multipart/form-data">
      <label for="file">CSV file</label><input id="file" name="file" type="file" accept=".csv,text/csv,text/plain">
      <label for="csv">...or paste CSV / one email per line</label><textarea id="csv" name="csv" style="min-height:140px"></textarea>
      <label><input type="checkbox" name="consent" value="yes" required> Everyone on this list has given me permission to email them.</label>
      <div class="actions"><button type="submit">Import</button></div></form></div>`,
    flashFrom(url),
  )
}

const IMPORT_CHUNK = 100
const MAX_IMPORT_BYTES = 2 * 1024 * 1024

/**
 * Adds people as confirmed in batches (one database round trip per chunk rather
 * than per person). Existing people keep their status, so anyone who unsubscribed,
 * bounced or complained is never re-subscribed; a person still pending is confirmed,
 * and blank name/phone/address fields are filled in.
 */
async function addPeople(env: Env, people: ImportRow[], source: string): Promise<{ added: number; existing: number }> {
  if (people.length === 0) return { added: 0, existing: 0 }
  const countBefore = (await env.DB.prepare('SELECT COUNT(*) AS n FROM subscribers').first<{ n: number }>())?.n ?? 0
  const timestamp = now()
  const upsert = env.DB.prepare(
    `INSERT INTO subscribers (email, name, phone, address, lists, status, token, source, created_at, confirmed_at)
     VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET
       confirmed_at = CASE WHEN subscribers.status = 'pending' THEN excluded.confirmed_at ELSE subscribers.confirmed_at END,
       status = CASE WHEN subscribers.status = 'pending' THEN 'confirmed' ELSE subscribers.status END,
       name = CASE WHEN subscribers.name = '' THEN excluded.name ELSE subscribers.name END,
       phone = CASE WHEN subscribers.phone = '' THEN excluded.phone ELSE subscribers.phone END,
       address = CASE WHEN subscribers.address = '' THEN excluded.address ELSE subscribers.address END,
       lists = CASE WHEN subscribers.lists = '' THEN excluded.lists ELSE subscribers.lists END`,
  )
  for (let i = 0; i < people.length; i += IMPORT_CHUNK) {
    await env.DB.batch(
      people.slice(i, i + IMPORT_CHUNK).map((p) => upsert.bind(p.email, p.name, p.phone, p.address, p.lists, randomToken(), source, timestamp, timestamp)),
    )
  }
  const countAfter = (await env.DB.prepare('SELECT COUNT(*) AS n FROM subscribers').first<{ n: number }>())?.n ?? 0
  const added = countAfter - countBefore
  return { added, existing: people.length - added }
}

async function addSubscriber(request: Request, env: Env): Promise<Response> {
  const form = await formData(request)
  const email = normalizeEmail(form.email ?? '')
  const name = (form.name ?? '').trim().slice(0, 100)
  if (!name) return redirect('/admin/import', 'Please enter a name.', 'err')
  if (!email) return redirect('/admin/import', 'That email address is not valid.', 'err')
  if (form.consent !== 'yes') return redirect('/admin/import', 'Please confirm you have permission to email this person.', 'err')
  const { added } = await addPeople(env, [{ email, name, phone: (form.phone ?? '').trim().slice(0, 40), address: (form.address ?? '').trim().slice(0, 300), lists: 'Added manually' }], 'manual')
  return redirect('/admin/import', added ? `Added ${email}.` : `${email} was already on file, so nothing was re-subscribed.`)
}

async function importSubscribers(request: Request, env: Env): Promise<Response> {
  const form = await request.formData()
  if (form.get('consent') !== 'yes') return redirect('/admin/import', 'Please confirm everyone on the list has given permission.', 'err')

  const file = form.get('file')
  let text = ''
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_IMPORT_BYTES) return redirect('/admin/import', 'That file is too large (2 MB limit).', 'err')
    text = await file.text()
  } else {
    text = String(form.get('csv') ?? '')
  }
  if (!text.trim()) return redirect('/admin/import', 'Choose a CSV file or paste a list first.', 'err')

  const parsed = parseImport(text)
  const { added, existing } = await addPeople(env, parsed.rows, 'import')
  const notes = [
    `${parsed.rows.length} people in the file had an email address.`,
    `${added} new, ${existing} already on file.`,
    parsed.skipped ? `${parsed.skipped} skipped (marked unsubscribed or bounced).` : '',
    parsed.noEmail ? `${parsed.noEmail} rows had no email address.` : '',
    parsed.invalid ? `${parsed.invalid} had an invalid email address.` : '',
    parsed.missingName ? `${parsed.missingName} imported without a name.` : '',
  ]
  return redirect('/admin/subscribers', `Imported. ${notes.filter(Boolean).join(' ')}`)
}

// ---------- campaigns ----------

async function campaignsPage(env: Env, url: URL): Promise<Response> {
  const list = (await env.DB.prepare('SELECT * FROM campaigns ORDER BY id DESC LIMIT 100').all<Campaign>()).results
  const rows = list.length
    ? list.map((c) => `<tr><td><a href="/admin/campaigns/${c.id}">${esc(c.subject)}</a></td><td><span class="pill ${c.status}">${c.status}</span></td><td>${c.total_recipients || ''}</td><td>${formatDate(c.sent_at ?? c.created_at)}</td></tr>`).join('')
    : '<tr><td colspan="4" class="muted">No emails yet.</td></tr>'
  return adminPage(
    'Emails',
    `<h1>Emails</h1><div class="actions" style="margin:0 0 16px"><a class="btn" href="/admin/campaigns/new">Write an email</a></div>
    <div class="card"><table><tr><th>Subject</th><th>Status</th><th>Recipients</th><th>Date</th></tr>${rows}</table></div>`,
    flashFrom(url),
  )
}

const STARTER_BODY = `Shalom,

Write your message here. You can use **bold**, *italic*, and [links](https://app.destined4torah.com).

## A heading

- A list item
- Another item

Blessings,
Dr. Sanjay Prajapati`

function composeForm(env: Env, campaign: Campaign | null, url: URL): Response {
  const action = campaign ? `/admin/campaigns/${campaign.id}` : '/admin/campaigns'
  return adminPage(
    campaign ? 'Edit email' : 'New email',
    `${warnings(env)}<h1>${campaign ? 'Edit email' : 'Write an email'}</h1>
    <div class="card"><form method="post" action="${action}">
      <label for="subject">Subject</label><input id="subject" name="subject" type="text" maxlength="200" required value="${esc(campaign?.subject ?? '')}">
      <label for="body">Message</label><textarea id="body" name="body" required>${esc(campaign?.body ?? STARTER_BODY)}</textarea>
      <p class="muted">Formatting: <code># Heading</code>, <code>**bold**</code>, <code>*italic*</code>, <code>[text](https://link)</code>, <code>![alt](https://image-url)</code>, <code>- list</code>, <code>&gt; quote</code>, <code>---</code> line. An unsubscribe link and your mailing address are added automatically.</p>
      <label for="to">Send a test to</label><input id="to" name="to" type="email" placeholder="you@example.com">
      <div class="actions">
        <button type="submit" name="do" value="save">Save draft</button>
        <button type="submit" name="do" value="test" class="secondary">Save and send test</button>
        <button type="submit" formaction="/admin/preview" formtarget="_blank" class="secondary">Preview</button>
        <button type="submit" name="do" value="review" class="secondary">Review and send to everyone</button>
      </div></form></div>
    ${campaign ? `<form method="post" action="/admin/campaigns/${campaign.id}/delete"><button class="link" type="submit">Delete this draft</button></form>` : ''}`,
    flashFrom(url),
  )
}

async function loadCampaign(env: Env, id: number): Promise<Campaign | null> {
  return env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first<Campaign>()
}

async function campaignReport(env: Env, campaign: Campaign, url: URL): Promise<Response> {
  const delivery = Object.fromEntries(
    (await env.DB.prepare('SELECT status, COUNT(*) AS n FROM deliveries WHERE campaign_id = ? GROUP BY status').bind(campaign.id).all<{ status: string; n: number }>()).results.map((r) => [r.status, r.n]),
  )
  const events = Object.fromEntries(
    (await env.DB.prepare('SELECT type, COUNT(DISTINCT email) AS n FROM events WHERE campaign_id = ? GROUP BY type').bind(campaign.id).all<{ type: string; n: number }>()).results.map((r) => [r.type, r.n]),
  )
  const failure = await env.DB.prepare(`SELECT error FROM deliveries WHERE campaign_id = ? AND status = 'failed' AND error IS NOT NULL LIMIT 1`).bind(campaign.id).first<{ error: string }>()
  const stat = (label: string, n: number | undefined) => `<div class="stat"><b>${n ?? 0}</b><span class="muted">${label}</span></div>`
  const refresh = campaign.status === 'sending' ? '<meta http-equiv="refresh" content="10">' : ''

  return adminPage(
    campaign.subject,
    `<h1>${esc(campaign.subject)}</h1><p><span class="pill ${campaign.status}">${campaign.status}</span> <span class="muted">${formatDate(campaign.sent_at ?? campaign.created_at)}</span></p>
    ${campaign.status === 'sending' ? '<div class="ok">Sending in the background. Large lists go out over several minutes. This page refreshes itself.</div>' : ''}
    ${failure ? `<div class="err">Some emails failed: ${esc(failure.error)}</div>` : ''}
    <div class="stats">${stat('Recipients', campaign.total_recipients)}${stat('Sent', delivery.sent)}${stat('Waiting', (delivery.pending ?? 0) + (delivery.sending ?? 0))}${stat('Failed', delivery.failed)}${stat('Skipped (opted out)', delivery.skipped)}</div>
    <h2>Results</h2><div class="stats">${stat('Delivered', events.delivered)}${stat('Opened', events.opened)}${stat('Clicked', events.clicked)}${stat('Bounced', events.bounced)}${stat('Spam complaints', events.complained)}</div>
    <p class="muted">Delivered, opened and clicked counts come from your sending service and appear once its webhook is connected (see the setup guide).</p>
    <h2>Message</h2><div class="card"><iframe title="Email preview" sandbox srcdoc="${esc(renderCampaign(env, campaign.subject, campaign.body, '#').html)}" style="width:100%;height:520px;border:0"></iframe></div>`,
    flashFrom(url),
    refresh,
  )
}

async function sendConfirmPage(env: Env, campaign: Campaign, url: URL): Promise<Response> {
  const confirmed = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM subscribers WHERE status = 'confirmed'`).first<{ n: number }>())?.n ?? 0
  const blocked = !mailingAddress(env) ? 'Add your mailing address (MAILING_ADDRESS) before sending. It is required by law in every email.' : confirmed === 0 ? 'There are no confirmed subscribers to send to yet.' : ''
  return adminPage(
    'Send email',
    `${warnings(env)}<h1>Send to everyone?</h1><div class="card">
      <p><strong>${esc(campaign.subject)}</strong></p>
      <p>This will send to <strong>${confirmed}</strong> confirmed subscribers. It cannot be undone.</p>
      ${blocked ? `<div class="err">${esc(blocked)}</div>` : ''}
      <form method="post" action="/admin/campaigns/${campaign.id}/send"><div class="actions">
        <button type="submit" class="danger"${blocked ? ' disabled' : ''}>Send now</button><a class="btn secondary" href="/admin/campaigns/${campaign.id}">Back to edit</a></div></form></div>`,
    flashFrom(url),
  )
}

async function saveCampaign(request: Request, env: Env, id: number | null): Promise<Response> {
  const form = await formData(request)
  const subject = (form.subject ?? '').trim().slice(0, 200)
  const body = form.body ?? ''
  const timestamp = now()
  if (!subject || !body.trim()) return redirect(id ? `/admin/campaigns/${id}` : '/admin/campaigns/new', 'A subject and a message are both required.', 'err')

  let campaignId = id
  if (id === null) {
    const result = await env.DB.prepare(`INSERT INTO campaigns (subject, body, created_at, updated_at) VALUES (?, ?, ?, ?)`).bind(subject, body, timestamp, timestamp).run()
    campaignId = Number(result.meta.last_row_id)
  } else {
    const result = await env.DB.prepare(`UPDATE campaigns SET subject = ?, body = ?, updated_at = ? WHERE id = ? AND status = 'draft'`).bind(subject, body, timestamp, id).run()
    if (result.meta.changes === 0) return redirect(`/admin/campaigns/${id}`, 'This email has already been sent and can no longer be edited.', 'err')
  }

  const page = `/admin/campaigns/${campaignId}`
  if (form.do === 'review') return redirect(`${page}/send`)
  if (form.do === 'test') {
    const to = normalizeEmail(form.to ?? '')
    if (!to) return redirect(page, 'Saved, but enter a valid address to send a test to.', 'err')
    const { html, text } = renderCampaign(env, `[TEST] ${subject}`, body, `${env.WORKER_URL}/unsubscribe?t=test`)
    const result = await sendBatch(env, [{ to, subject: `[TEST] ${subject}`, html, text }])
    return result.ok ? redirect(page, `Saved. Test email sent to ${to}.`) : redirect(page, `Saved, but the test failed: ${result.error}`, 'err')
  }
  return redirect(page, 'Draft saved.')
}

async function sendCampaign(env: Env, ctx: ExecutionContext, id: number): Promise<Response> {
  if (!mailingAddress(env)) return redirect(`/admin/campaigns/${id}/send`, 'Add your mailing address before sending.', 'err')

  // Queue every confirmed subscriber and flip to "sending" in one transaction.
  const results = await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO deliveries (campaign_id, subscriber_id)
       SELECT ?, id FROM subscribers WHERE status = 'confirmed' AND (SELECT status FROM campaigns WHERE id = ?) = 'draft'`,
    ).bind(id, id),
    env.DB.prepare(
      `UPDATE campaigns SET status = 'sending', total_recipients = (SELECT COUNT(*) FROM deliveries WHERE campaign_id = ?), updated_at = ? WHERE id = ? AND status = 'draft'`,
    ).bind(id, now(), id),
  ])
  if (results[1].meta.changes === 0) return redirect(`/admin/campaigns/${id}`, 'This email was already sent.', 'err')

  ctx.waitUntil(processQueue(env))
  return redirect(`/admin/campaigns/${id}`, 'Sending started.')
}

// ---------- router ----------

export async function handleAdmin(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const post = request.method === 'POST'

  // Never run the admin area without real secrets: an unset password would otherwise match an empty login.
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 8 || !env.SESSION_SECRET || env.SESSION_SECRET.length < 16) {
    return htmlResponse('Admin not set up', '<div class="wrap narrow"><div class="card"><h1>Admin not set up</h1><p>Set the ADMIN_PASSWORD (at least 8 characters) and SESSION_SECRET secrets, then reload. See the setup guide.</p></div></div>', 503)
  }

  if (path === '/admin/login') return login(request, env)
  if (!(await isAuthenticated(request, env))) return redirect('/admin/login')
  if (post && !sameOrigin(request)) return new Response('Forbidden', { status: 403 })

  if (path === '/admin/logout' && post) return redirect('/admin/login', undefined, 'ok', { 'Set-Cookie': clearSessionCookie() })
  if (path === '/admin') return dashboard(env, url)

  if (path === '/admin/subscribers') return subscribersPage(env, url)
  if (path === '/admin/subscribers.csv') return exportCsv(env, url)
  if (path === '/admin/import') return importPage(url)
  if (path === '/admin/subscribers/add' && post) return addSubscriber(request, env)
  if (path === '/admin/subscribers/import' && post) return importSubscribers(request, env)
  const deleteMatch = /^\/admin\/subscribers\/(\d+)\/delete$/.exec(path)
  if (deleteMatch && post) {
    await env.DB.prepare('DELETE FROM subscribers WHERE id = ?').bind(Number(deleteMatch[1])).run()
    return redirect('/admin/subscribers', 'Subscriber deleted.')
  }

  if (path === '/admin/campaigns') return post ? saveCampaign(request, env, null) : campaignsPage(env, url)
  if (path === '/admin/campaigns/new') return composeForm(env, null, url)
  if (path === '/admin/preview' && post) {
    const form = await formData(request)
    const { html } = renderCampaign(env, form.subject ?? '', form.body ?? '', '#')
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:", 'Cache-Control': 'no-store' },
    })
  }

  const campaignMatch = /^\/admin\/campaigns\/(\d+)(?:\/(send|delete))?$/.exec(path)
  if (campaignMatch) {
    const id = Number(campaignMatch[1])
    const action = campaignMatch[2]
    const campaign = await loadCampaign(env, id)
    if (!campaign) return redirect('/admin/campaigns', 'That email no longer exists.', 'err')

    if (action === 'delete' && post) {
      if (campaign.status === 'draft') await env.DB.prepare('DELETE FROM campaigns WHERE id = ?').bind(id).run()
      return redirect('/admin/campaigns', campaign.status === 'draft' ? 'Draft deleted.' : 'Sent emails cannot be deleted.', campaign.status === 'draft' ? 'ok' : 'err')
    }
    if (action === 'send') {
      if (campaign.status !== 'draft') return redirect(`/admin/campaigns/${id}`)
      return post ? sendCampaign(env, ctx, id) : sendConfirmPage(env, campaign, url)
    }
    if (post) return saveCampaign(request, env, id)
    return campaign.status === 'draft' ? composeForm(env, campaign, url) : campaignReport(env, campaign, url)
  }

  return redirect('/admin')
}

