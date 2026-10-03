import { checkPassword, clearSessionCookie, createSessionCookie, isAuthenticated, sameOrigin } from './auth'
import { parseImport, type ContactRow, type ImportRow } from './csv'
import { bannerFor, emailConfigured, mailingAddress, renderCampaign, sendBatch, type Banner } from './email'
import type { Campaign, Contact, Env, Subscriber } from './env'
import { esc, htmlResponse } from './html'
import { detectImageType, storeImage, toDataUri } from './images'
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
    <a href="/admin">Dashboard</a><a href="/admin/subscribers">Subscribers</a><a href="/admin/contacts">Contacts (no email)</a><a href="/admin/texts">Texts</a><a href="/admin/campaigns">Emails</a>
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
    AND (? = '' OR (', ' || lists || ', ') LIKE ? ESCAPE '\\') AND (? = '' OR source_name = ?)`
  const src = url.searchParams.get('src') ?? ''
  const binds = [status, status, q, like, like, like, list, `%, ${escapeLike(list)}, %`, src, src]
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
  const sourceRows = (await env.DB.prepare(`SELECT source_name, COUNT(*) AS n FROM subscribers WHERE source_name != '' GROUP BY source_name ORDER BY n DESC`).all<{ source_name: string; n: number }>()).results
  const sourceOptions = ['', ...sourceRows.map((r) => r.source_name)]
    .map((v) => `<option value="${esc(v)}"${v === src ? ' selected' : ''}>${v ? `${esc(v)} (${sourceRows.find((r) => r.source_name === v)?.n})` : 'All sources'}</option>`)
    .join('')
  const rows = people.length
    ? people
        .map(
          (s) => `<tr><td>${s.name ? esc(s.name) : '<span class="muted">(no name)</span>'}<br><span class="muted">${esc(s.email)}</span></td><td>${esc(s.phone)}</td><td class="muted">${esc(s.address)}</td><td class="muted">${esc(s.lists)}</td><td class="muted">${esc(s.source_name)}</td><td><span class="pill ${s.status}">${s.status}</span></td><td>${formatDate(s.created_at)}</td>
          <td><form method="post" action="/admin/subscribers/${s.id}/delete" style="margin:0"><button class="link" type="submit">Delete</button></form></td></tr>`,
        )
        .join('')
    : '<tr><td colspan="8" class="muted">No subscribers match.</td></tr>'

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const query = (p: number) => `/admin/subscribers?status=${encodeURIComponent(status)}&list=${encodeURIComponent(list)}&src=${encodeURIComponent(src)}&q=${encodeURIComponent(q)}&page=${p}`
  const pager = `<p class="muted">${total} people · page ${page} of ${pages} ${page > 1 ? `· <a href="${query(page - 1)}">Previous</a>` : ''} ${page < pages ? `· <a href="${query(page + 1)}">Next</a>` : ''}</p>`

  return adminPage(
    'Subscribers',
    `<h1>Subscribers</h1>
    <form method="get" class="row" style="margin-bottom:14px"><input type="search" name="q" value="${esc(q)}" placeholder="Search name, email or phone" style="max-width:280px">
      <select name="status" style="max-width:170px">${options}</select><select name="list" style="max-width:260px">${listOptions}</select><select name="src" style="max-width:200px">${sourceOptions}</select><button type="submit" class="secondary">Filter</button>
      <a class="btn secondary" href="/admin/subscribers.csv?status=${encodeURIComponent(status)}&list=${encodeURIComponent(list)}&src=${encodeURIComponent(src)}">Export CSV</a><a class="btn" href="/admin/import">Add or import</a></form>
    <div class="card"><table><tr><th>Name / email</th><th>Phone</th><th>Address</th><th>Lists</th><th>Source</th><th>Status</th><th>Joined</th><th></th></tr>${rows}</table>${pager}</div>`,
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
  const src = url.searchParams.get('src') ?? ''
  const rows = (
    await env.DB.prepare(
      `SELECT email, name, phone, address, lists, source_name, status, created_at FROM subscribers
       WHERE (? = '' OR status = ?) AND (? = '' OR (', ' || lists || ', ') LIKE ? ESCAPE '\\') AND (? = '' OR source_name = ?) ORDER BY id`,
    )
      .bind(status, status, list, `%, ${escapeLike(list)}, %`, src, src)
      .all<Subscriber>()
  ).results
  const lines = [
    'email,name,phone,address,lists,source,status,joined',
    ...rows.map((r) => [r.email, r.name, r.phone, r.address, r.lists, r.source_name, r.status, formatDate(r.created_at)].map(csvCell).join(',')),
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
    `INSERT INTO subscribers (email, name, phone, address, lists, source_name, status, token, source, created_at, confirmed_at)
     VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET
       confirmed_at = CASE WHEN subscribers.status = 'pending' THEN excluded.confirmed_at ELSE subscribers.confirmed_at END,
       status = CASE WHEN subscribers.status = 'pending' THEN 'confirmed' ELSE subscribers.status END,
       name = CASE WHEN subscribers.name = '' THEN excluded.name ELSE subscribers.name END,
       phone = CASE WHEN subscribers.phone = '' THEN excluded.phone ELSE subscribers.phone END,
       address = CASE WHEN subscribers.address = '' THEN excluded.address ELSE subscribers.address END,
       lists = CASE WHEN subscribers.lists = '' THEN excluded.lists ELSE subscribers.lists END,
       source_name = CASE WHEN subscribers.source_name = '' THEN excluded.source_name ELSE subscribers.source_name END`,
  )
  for (let i = 0; i < people.length; i += IMPORT_CHUNK) {
    await env.DB.batch(
      people.slice(i, i + IMPORT_CHUNK).map((p) => upsert.bind(p.email, p.name, p.phone, p.address, p.lists, p.sourceName, randomToken(), source, timestamp, timestamp)),
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
  const { added } = await addPeople(env, [{ email, name, phone: (form.phone ?? '').trim().slice(0, 40), address: (form.address ?? '').trim().slice(0, 300), lists: 'Added manually', sourceName: 'Added manually' }], 'manual')
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

// ---------- contacts without email ----------

function phoneKey(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

async function addContacts(env: Env, contacts: ContactRow[]): Promise<{ added: number; existing: number }> {
  const usable = contacts.filter((c) => phoneKey(c.phone))
  if (usable.length === 0) return { added: 0, existing: 0 }
  const countBefore = (await env.DB.prepare('SELECT COUNT(*) AS n FROM contacts').first<{ n: number }>())?.n ?? 0
  const timestamp = now()
  const upsert = env.DB.prepare(
    `INSERT INTO contacts (name, phone, phone_key, address, lists, source_name, sms_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (phone_key) DO UPDATE SET
       name = CASE WHEN contacts.name = '' THEN excluded.name ELSE contacts.name END,
       address = CASE WHEN contacts.address = '' THEN excluded.address ELSE contacts.address END,
       lists = CASE WHEN contacts.lists = '' THEN excluded.lists ELSE contacts.lists END,
       source_name = CASE WHEN contacts.source_name = '' THEN excluded.source_name ELSE contacts.source_name END,
       sms_status = CASE WHEN contacts.sms_status = '' THEN excluded.sms_status ELSE contacts.sms_status END`,
  )
  for (let i = 0; i < usable.length; i += IMPORT_CHUNK) {
    await env.DB.batch(usable.slice(i, i + IMPORT_CHUNK).map((c) => upsert.bind(c.name, c.phone, phoneKey(c.phone), c.address, c.lists, c.sourceName, c.smsStatus, timestamp)))
  }
  const countAfter = (await env.DB.prepare('SELECT COUNT(*) AS n FROM contacts').first<{ n: number }>())?.n ?? 0
  return { added: countAfter - countBefore, existing: usable.length - (countAfter - countBefore) }
}

async function contactsPage(env: Env, url: URL): Promise<Response> {
  const q = (url.searchParams.get('q') ?? '').trim()
  const list = url.searchParams.get('list') ?? ''
  const sms = url.searchParams.get('sms') ?? ''
  const src = url.searchParams.get('src') ?? ''
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  const like = `%${escapeLike(q)}%`
  const where = `WHERE (? = '' OR name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR address LIKE ? ESCAPE '\\')
    AND (? = '' OR (', ' || lists || ', ') LIKE ? ESCAPE '\\') AND (? = '' OR sms_status = ?) AND (? = '' OR source_name = ?)`
  const binds = [q, like, like, like, list, `%, ${escapeLike(list)}, %`, sms, sms, src, src]
  const total = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM contacts ${where}`).bind(...binds).first<{ n: number }>())?.n ?? 0
  const people = (await env.DB.prepare(`SELECT * FROM contacts ${where} ORDER BY name COLLATE NOCASE LIMIT ? OFFSET ?`).bind(...binds, PAGE_SIZE, (page - 1) * PAGE_SIZE).all<Contact>()).results

  const listCounts = new Map<string, number>()
  for (const r of (await env.DB.prepare(`SELECT lists, COUNT(*) AS n FROM contacts WHERE lists != '' GROUP BY lists`).all<{ lists: string; n: number }>()).results) {
    for (const name of r.lists.split(', ')) listCounts.set(name, (listCounts.get(name) ?? 0) + r.n)
  }
  const sourceRows = (await env.DB.prepare(`SELECT source_name, COUNT(*) AS n FROM contacts WHERE source_name != '' GROUP BY source_name ORDER BY n DESC`).all<{ source_name: string; n: number }>()).results
  const option = (value: string, label: string, current: string) => `<option value="${esc(value)}"${value === current ? ' selected' : ''}>${esc(label)}</option>`
  const listOptions = [option('', 'All lists', list), ...[...listCounts.keys()].sort().map((l) => option(l, `${l} (${listCounts.get(l)})`, list))].join('')
  const sourceOptions = [option('', 'All sources', src), ...sourceRows.map((r) => option(r.source_name, `${r.source_name} (${r.n})`, src))].join('')
  const smsOptions = [option('', 'All text statuses', sms), option('subscribed', 'Subscribed to texts', sms), option('unsubscribed', 'Opted out of texts', sms)].join('')

  const rows = people.length
    ? people
        .map(
          (c) => `<tr><td>${c.name ? esc(c.name) : '<span class="muted">(no name)</span>'}</td><td>${esc(c.phone)}</td><td class="muted">${esc(c.address)}</td><td class="muted">${esc(c.lists)}</td><td class="muted">${esc(c.source_name)}</td>
          <td>${c.sms_status ? `<span class="pill ${c.sms_status === 'subscribed' ? 'confirmed' : 'unsubscribed'}">${c.sms_status === 'subscribed' ? 'texts ok' : 'opted out'}</span>` : ''}</td>
          <td><form method="post" action="/admin/contacts/${c.id}/delete" style="margin:0"><button class="link" type="submit">Delete</button></form></td></tr>`,
        )
        .join('')
    : '<tr><td colspan="7" class="muted">No contacts match.</td></tr>'
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const query = (p: number) => `/admin/contacts?q=${encodeURIComponent(q)}&list=${encodeURIComponent(list)}&sms=${encodeURIComponent(sms)}&src=${encodeURIComponent(src)}&page=${p}`
  const pager = `<p class="muted">${total} contacts · page ${page} of ${pages} ${page > 1 ? `· <a href="${query(page - 1)}">Previous</a>` : ''} ${page < pages ? `· <a href="${query(page + 1)}">Next</a>` : ''}</p>`

  return adminPage(
    'Contacts without email',
    `<h1>Contacts (no email)</h1>
    <p class="muted">People you have a phone number for but no email address. They are kept here, separate from your email list, so they can never be emailed.</p>
    <form method="get" class="row" style="margin-bottom:14px"><input type="search" name="q" value="${esc(q)}" placeholder="Search name, phone or address" style="max-width:280px">
      <select name="list" style="max-width:240px">${listOptions}</select><select name="src" style="max-width:200px">${sourceOptions}</select><select name="sms" style="max-width:200px">${smsOptions}</select>
      <button type="submit" class="secondary">Filter</button><a class="btn secondary" href="/admin/contacts.csv?q=${encodeURIComponent(q)}&list=${encodeURIComponent(list)}&sms=${encodeURIComponent(sms)}&src=${encodeURIComponent(src)}">Export CSV</a></form>
    <div class="card"><table><tr><th>Name</th><th>Phone</th><th>Address</th><th>Lists</th><th>Source</th><th>Texts</th><th></th></tr>${rows}</table>${pager}</div>
    <div class="card"><h2>Import contacts without email</h2>
      <p class="muted">Upload a Constant Contact export. Only the people who have a phone number but no email address are added here; everyone with an email goes through <a href="/admin/import">Add or import</a> instead. Anyone already here (same phone number) is not duplicated.</p>
      <form method="post" action="/admin/contacts/import" enctype="multipart/form-data"><input name="file" type="file" accept=".csv,text/csv,text/plain" required>
      <div class="actions"><button type="submit">Import</button></div></form></div>`,
    flashFrom(url),
  )
}

async function exportContacts(env: Env, url: URL): Promise<Response> {
  const q = (url.searchParams.get('q') ?? '').trim()
  const list = url.searchParams.get('list') ?? ''
  const sms = url.searchParams.get('sms') ?? ''
  const src = url.searchParams.get('src') ?? ''
  const like = `%${escapeLike(q)}%`
  const rows = (
    await env.DB.prepare(
      `SELECT * FROM contacts WHERE (? = '' OR name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR address LIKE ? ESCAPE '\\')
       AND (? = '' OR (', ' || lists || ', ') LIKE ? ESCAPE '\\') AND (? = '' OR sms_status = ?) AND (? = '' OR source_name = ?) ORDER BY name COLLATE NOCASE`,
    )
      .bind(q, like, like, like, list, `%, ${escapeLike(list)}, %`, sms, sms, src, src)
      .all<Contact>()
  ).results
  const lines = ['name,phone,address,lists,source,text_status', ...rows.map((c) => [c.name, c.phone, c.address, c.lists, c.source_name, c.sms_status].map(csvCell).join(','))]
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="contacts-no-email.csv"', 'Cache-Control': 'no-store' },
  })
}

async function importContacts(request: Request, env: Env): Promise<Response> {
  const file = (await request.formData()).get('file')
  if (!(file instanceof File) || file.size === 0) return redirect('/admin/contacts', 'Choose a CSV file first.', 'err')
  if (file.size > MAX_IMPORT_BYTES) return redirect('/admin/contacts', 'That file is too large (2 MB limit).', 'err')
  const parsed = parseImport(await file.text())
  if (parsed.contacts.length === 0) return redirect('/admin/contacts', 'No contacts with a phone number and no email address were found in that file.', 'err')
  const { added, existing } = await addContacts(env, parsed.contacts)
  return redirect('/admin/contacts', `Imported. ${parsed.contacts.length} contacts had a phone number but no email: ${added} new, ${existing} already here.`)
}

// ---------- texts helper ----------

const TITLES = /^(dr|mr|mrs|ms|miss|rev|reverend|pastor|evangelist|judge|minister|bishop|apostle|prophet|prophetess|elder|deacon|sister|brother)\.?\s+/i

function firstName(name: string): string {
  return name.replace(TITLES, '').trim().split(/\s+/)[0] ?? ''
}

/** A number that texting apps understand: +1XXXXXXXXXX for US numbers. */
function smsNumber(phone: string, key: string): string {
  if (key.length === 10) return `+1${key}`
  const digits = phone.replace(/\D/g, '')
  return digits ? `+${digits}` : ''
}

function textsParams(url: URL) {
  const hasMessage = url.searchParams.has('message')
  return {
    message: url.searchParams.get('message') ?? 'Shalom {name}, ',
    addStop: !hasMessage || url.searchParams.get('stop') === '1',
    list: url.searchParams.get('list') ?? '',
    all: url.searchParams.get('all') === '1',
  }
}

const STOP_LINE = ' Reply STOP to opt out.'

async function textsPage(env: Env, url: URL): Promise<Response> {
  const { message, addStop, list, all } = textsParams(url)
  const eligible = (await env.DB.prepare(`SELECT * FROM contacts WHERE sms_status = 'subscribed' ORDER BY name COLLATE NOCASE`).all<Contact>()).results
  const optedOut = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM contacts WHERE sms_status = 'unsubscribed'`).first<{ n: number }>())?.n ?? 0
  const unknown = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM contacts WHERE sms_status = ''`).first<{ n: number }>())?.n ?? 0

  const listCounts = new Map<string, number>()
  for (const c of eligible) for (const l of c.lists ? c.lists.split(', ') : []) listCounts.set(l, (listCounts.get(l) ?? 0) + 1)
  const listOptions = ['', ...[...listCounts.keys()].sort()]
    .map((l) => `<option value="${esc(l)}"${l === list ? ' selected' : ''}>${l ? `${esc(l)} (${listCounts.get(l)})` : 'All lists'}</option>`)
    .join('')

  const inList = eligible.filter((c) => !list || c.lists.split(', ').includes(list))
  const remaining = inList.filter((c) => !c.last_texted_at)
  const shown = all ? inList : remaining

  const keep = `<input type="hidden" name="message" value="${esc(message)}"><input type="hidden" name="stop" value="${addStop ? '1' : '0'}"><input type="hidden" name="list" value="${esc(list)}"><input type="hidden" name="all" value="${all ? '1' : '0'}">`
  const rows = shown.length
    ? shown
        .map((c) => {
          const body = message.replace(/\{name\}/gi, firstName(c.name) || 'friend').trimEnd() + (addStop ? STOP_LINE : '')
          const number = smsNumber(c.phone, c.phone_key)
          const textLink = number ? `<a class="btn" href="${esc(`sms:${number}?&body=${encodeURIComponent(body)}`)}">Text</a>` : '<span class="muted">no number</span>'
          return `<tr><td>${c.name ? esc(c.name) : '<span class="muted">(no name)</span>'}</td><td>${esc(c.phone)}</td>
          <td>${c.last_texted_at ? `<span class="pill sent">texted ${esc(formatDate(c.last_texted_at).slice(0, 10))}</span>` : '<span class="muted">not yet</span>'}</td>
          <td><div class="row">${textLink}
            <form method="post" action="/admin/texts/${c.id}/sent" style="margin:0">${keep}<button class="secondary" type="submit">Mark sent</button></form>
            <form method="post" action="/admin/texts/${c.id}/optout" style="margin:0">${keep}<button class="link" type="submit">Opted out</button></form></div></td></tr>`
        })
        .join('')
    : `<tr><td colspan="4" class="muted">${inList.length ? 'Everyone in this group has been texted. Start a new round below to text them again.' : 'No contacts with text consent in this group.'}</td></tr>`

  const example = shown[0] ? message.replace(/\{name\}/gi, firstName(shown[0].name) || 'friend').trimEnd() + (addStop ? STOP_LINE : '') : ''
  return adminPage(
    'Texts',
    `<h1>Texts</h1>
    <div class="card"><p class="muted">Free, one-to-one texting from your own phone. Write your message, then tap <strong>Text</strong> next to each person: it opens your messaging app with their number and message ready, and you press send. Only people who agreed to receive texts are listed. If someone replies STOP, click <strong>Opted out</strong> and they are removed.</p>
    <form method="get"><label for="message">Your message (use {name} for their first name)</label><textarea id="message" name="message" style="min-height:90px;font-family:inherit">${esc(message)}</textarea>
      <label><input type="checkbox" name="stop" value="1"${addStop ? ' checked' : ''}> Add "Reply STOP to opt out." to the end (recommended)</label>
      <label for="list">Who</label><select id="list" name="list" style="max-width:320px">${listOptions}</select>
      <label><input type="checkbox" name="all" value="1"${all ? ' checked' : ''}> Also show people I have already texted this round</label>
      <div class="actions"><button type="submit">Update list</button></div></form>
      ${example ? `<p class="muted" style="margin-top:14px">Preview: <em>${esc(example)}</em></p>` : ''}</div>
    <div class="card"><p class="muted">${inList.length} can be texted${list ? ` in "${esc(list)}"` : ''} · ${remaining.length} not yet texted this round · ${optedOut} opted out${unknown ? ` · ${unknown} with unknown consent (never listed)` : ''}</p>
    <table><tr><th>Name</th><th>Phone</th><th>This round</th><th></th></tr>${rows}</table>
    <form method="post" action="/admin/texts/reset" style="margin-top:14px">${keep}<button class="secondary" type="submit">Start a new round (clear all "texted")</button></form></div>`,
    flashFrom(url),
  )
}

function textsBack(form: Record<string, string>): string {
  const params = new URLSearchParams({ message: form.message ?? '', stop: form.stop ?? '1', list: form.list ?? '', all: form.all ?? '0' })
  return `/admin/texts?${params.toString()}`
}

async function textsAction(request: Request, env: Env, action: string, id: number | null): Promise<Response> {
  const form = await formData(request)
  if (action === 'sent' && id !== null) await env.DB.prepare('UPDATE contacts SET last_texted_at = ? WHERE id = ?').bind(now(), id).run()
  else if (action === 'optout' && id !== null) await env.DB.prepare(`UPDATE contacts SET sms_status = 'unsubscribed' WHERE id = ?`).bind(id).run()
  else if (action === 'reset') await env.DB.prepare('UPDATE contacts SET last_texted_at = NULL').run()
  return redirect(textsBack(form))
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

Write your newsletter here.`

function composeForm(env: Env, campaign: Campaign | null, url: URL): Response {
  const action = campaign ? `/admin/campaigns/${campaign.id}` : '/admin/campaigns'
  return adminPage(
    campaign ? 'Edit email' : 'New email',
    `${warnings(env)}<h1>${campaign ? 'Edit email' : 'Write an email'}</h1>
    <div class="card"><form method="post" action="${action}" enctype="multipart/form-data">
      <label for="subject">Subject</label><input id="subject" name="subject" type="text" maxlength="200" required value="${esc(campaign?.subject ?? '')}">
      <label for="banner">Banner image (the picture under your logo; replace it for each email)</label>
      ${campaign?.banner_image ? `<p><img src="/img/${esc(campaign.banner_image)}" alt="" style="max-width:320px;border-radius:6px"><br><label style="font-weight:400"><input type="checkbox" name="remove_banner" value="yes"> Remove this image</label></p>` : ''}
      <input id="banner" name="banner" type="file" accept="image/png,image/jpeg,image/gif,image/webp">
      <input type="hidden" name="existing_banner" value="${esc(campaign?.banner_image ?? '')}">
      <label for="banner_alt">Describe the image (optional, for screen readers)</label><input id="banner_alt" name="banner_alt" type="text" maxlength="200" value="${esc(campaign?.banner_alt ?? '')}">
      <label for="body">Your newsletter (appears below the banner)</label><textarea id="body" name="body" required>${esc(campaign?.body ?? STARTER_BODY)}</textarea>
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
    <h2>Message</h2><div class="card"><iframe title="Email preview" sandbox srcdoc="${esc(renderCampaign(env, campaign.subject, campaign.body, '#', bannerFor(env, campaign)).html)}" style="width:100%;height:520px;border:0"></iframe></div>`,
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
  const raw = await request.formData()
  const form = Object.fromEntries([...raw.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']))
  const subject = (form.subject ?? '').trim().slice(0, 200)
  const body = form.body ?? ''
  const timestamp = now()
  const back = id ? `/admin/campaigns/${id}` : '/admin/campaigns/new'
  if (!subject || !body.trim()) return redirect(back, 'A subject and a message are both required.', 'err')

  // Keep the current banner unless it is removed or a new file is chosen.
  let bannerImage = id === null ? '' : ((await loadCampaign(env, id))?.banner_image ?? '')
  if (form.remove_banner === 'yes') bannerImage = ''
  const file = raw.get('banner')
  if (file instanceof File && file.size > 0) {
    const stored = await storeImage(env, file)
    if ('error' in stored) return redirect(back, stored.error, 'err')
    bannerImage = stored.token
  }
  const bannerAlt = (form.banner_alt ?? '').trim().slice(0, 200)

  let campaignId = id
  if (id === null) {
    const result = await env.DB.prepare(`INSERT INTO campaigns (subject, body, banner_image, banner_alt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(subject, body, bannerImage, bannerAlt, timestamp, timestamp)
      .run()
    campaignId = Number(result.meta.last_row_id)
  } else {
    const result = await env.DB.prepare(`UPDATE campaigns SET subject = ?, body = ?, banner_image = ?, banner_alt = ?, updated_at = ? WHERE id = ? AND status = 'draft'`)
      .bind(subject, body, bannerImage, bannerAlt, timestamp, id)
      .run()
    if (result.meta.changes === 0) return redirect(`/admin/campaigns/${id}`, 'This email has already been sent and can no longer be edited.', 'err')
  }

  const page = `/admin/campaigns/${campaignId}`
  if (form.do === 'review') return redirect(`${page}/send`)
  if (form.do === 'test') {
    const to = normalizeEmail(form.to ?? '')
    if (!to) return redirect(page, 'Saved, but enter a valid address to send a test to.', 'err')
    const { html, text } = renderCampaign(env, `[TEST] ${subject}`, body, `${env.WORKER_URL}/unsubscribe?t=test`, bannerFor(env, { banner_image: bannerImage, banner_alt: bannerAlt }))
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
  if (path === '/admin/contacts') return contactsPage(env, url)
  if (path === '/admin/contacts.csv') return exportContacts(env, url)
  if (path === '/admin/contacts/import' && post) return importContacts(request, env)
  const deleteContact = /^\/admin\/contacts\/(\d+)\/delete$/.exec(path)
  if (deleteContact && post) {
    await env.DB.prepare('DELETE FROM contacts WHERE id = ?').bind(Number(deleteContact[1])).run()
    return redirect('/admin/contacts', 'Contact deleted.')
  }
  if (path === '/admin/texts') return textsPage(env, url)
  const textsMatch = /^\/admin\/texts\/(?:(\d+)\/(sent|optout)|(reset))$/.exec(path)
  if (textsMatch && post) return textsAction(request, env, textsMatch[2] ?? textsMatch[3], textsMatch[1] ? Number(textsMatch[1]) : null)
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
    const raw = await request.formData()
    const form = Object.fromEntries([...raw.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']))
    const alt = (form.banner_alt ?? '').slice(0, 200)
    let banner: Banner | undefined
    const file = raw.get('banner')
    if (file instanceof File && file.size > 0) {
      const buffer = await file.arrayBuffer()
      const type = detectImageType(buffer)
      if (type) banner = { src: toDataUri(buffer, type), alt }
    } else if (/^[a-f0-9]{48}$/.test(form.existing_banner ?? '') && form.remove_banner !== 'yes') {
      banner = bannerFor(env, { banner_image: form.existing_banner, banner_alt: alt })
    }
    const { html } = renderCampaign(env, form.subject ?? '', form.body ?? '', '#', banner)
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

