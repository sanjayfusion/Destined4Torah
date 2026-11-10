import type { Env } from './env'

/**
 * Small client for the parts of the Resend API used by Broadcasts: Contacts, Segments
 * and Broadcasts. Broadcasts do not count against the transactional sending quota;
 * the free plan allows unlimited Broadcast emails to up to 1,000 contacts.
 */

export type ApiResult<T = Record<string, unknown>> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; rateLimited: boolean }

export async function resendApi<T = Record<string, unknown>>(env: Env, method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  let response: Response
  try {
    response = await fetch(`${env.RESEND_API_URL || 'https://api.resend.com'}${path}`, {
      method,
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch (error) {
    return { ok: false, status: 0, error: `Network error: ${String(error)}`, rateLimited: false }
  }
  const text = await response.text()
  if (response.ok) {
    let data = {} as T
    try {
      data = (text ? JSON.parse(text) : {}) as T
    } catch {
      // Some endpoints return an empty body.
    }
    return { ok: true, status: response.status, data }
  }
  return { ok: false, status: response.status, error: `Resend ${response.status}: ${text.slice(0, 300)}`, rateLimited: response.status === 429 }
}

const contactPath = (email: string) => `/contacts/${encodeURIComponent(email)}`

/** The Segment every confirmed subscriber is added to. Created on first use. */
export async function mainSegmentId(env: Env): Promise<ApiResult<{ id: string }>> {
  const stored = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'resend_segment_id'`).first<{ value: string }>()
  if (stored) return { ok: true, status: 200, data: { id: stored.value } }
  const created = await resendApi<{ id: string }>(env, 'POST', '/segments', { name: `${env.FROM_NAME} subscribers` })
  if (created.ok) {
    await env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('resend_segment_id', ?)`).bind(created.data.id).run()
  }
  return created
}

interface Dirty {
  id: number
  email: string
  name: string
  status: string
  resend_exists: number
}

/** A 4xx answer other than "slow down": retrying the same request will not help. */
function permanent(result: ApiResult): boolean {
  return !result.ok && result.status >= 400 && result.status < 500 && !result.rateLimited
}

function alreadyExists(result: ApiResult): boolean {
  return !result.ok && (result.status === 409 || (result.status === 422 && /exist|already/i.test(result.error)))
}

/** Creates or updates the Resend Contact for a confirmed subscriber and puts them in the main Segment. */
async function upsertContact(env: Env, row: Dirty, segmentId: string): Promise<{ result: ApiResult; calls: number }> {
  const name = row.name.trim().slice(0, 100)
  const created = await resendApi(env, 'POST', '/contacts', {
    email: row.email,
    ...(name ? { first_name: name } : {}),
    unsubscribed: false,
    segments: [{ id: segmentId }],
  })
  if (!alreadyExists(created)) return { result: created, calls: 1 }
  const updated = await resendApi(env, 'PATCH', contactPath(row.email), { first_name: name || null, unsubscribed: false })
  if (!updated.ok) return { result: updated, calls: 2 }
  return { result: await resendApi(env, 'POST', `${contactPath(row.email)}/segments/${encodeURIComponent(segmentId)}`), calls: 3 }
}

/**
 * Pushes subscriber changes to Resend Contacts, making at most `budget` API calls.
 * Returns the number of calls made, or -1 if Resend asked us to slow down.
 * A Worker invocation on the free plan may make only 50 outgoing requests, so the
 * budget keeps each cron run well inside that.
 */
export async function syncContacts(env: Env, budget: number): Promise<number> {
  let used = 0

  if (!env.RESEND_API_KEY) {
    // Dry run: nothing to mirror.
    await env.DB.batch([
      env.DB.prepare('UPDATE subscribers SET resend_synced = 1 WHERE resend_synced = 0'),
      env.DB.prepare('DELETE FROM resend_deletions'),
    ])
    return 0
  }

  const deletions = (await env.DB.prepare('SELECT email FROM resend_deletions LIMIT ?').bind(budget).all<{ email: string }>()).results
  for (const { email } of deletions) {
    const result = await resendApi(env, 'DELETE', contactPath(email))
    used++
    if (!result.ok && result.rateLimited) return -1
    if (result.ok || result.status === 404) await env.DB.prepare('DELETE FROM resend_deletions WHERE email = ?').bind(email).run()
    else console.error(`Could not delete Resend contact ${email}:`, result.error)
  }

  const rows = (
    await env.DB.prepare('SELECT id, email, name, status, resend_exists FROM subscribers WHERE resend_synced = 0 ORDER BY id LIMIT ?')
      .bind(Math.max(0, budget - used) * 2 + 20)
      .all<Dirty>()
  ).results
  if (rows.length === 0) return used

  // Mark done only if nothing about the person changed while we were talking to Resend.
  const markSynced = (row: Dirty, exists: number) =>
    env.DB.prepare('UPDATE subscribers SET resend_synced = 1, resend_exists = ? WHERE id = ? AND email = ? AND name = ? AND status = ?').bind(exists, row.id, row.email, row.name, row.status)

  // People who never had a Resend Contact and do not want email need no API call.
  const quiet = rows.filter((r) => r.status !== 'confirmed' && !r.resend_exists)
  if (quiet.length) await env.DB.batch(quiet.map((r) => markSynced(r, 0)))

  let segmentId = ''
  for (const row of rows) {
    if (row.status !== 'confirmed' && !row.resend_exists) continue
    if (used + (row.status === 'confirmed' ? 3 : 1) > budget) break

    if (row.status === 'confirmed') {
      if (!segmentId) {
        const segment = await mainSegmentId(env)
        used++
        if (!segment.ok) {
          console.error('Could not create the Resend segment:', segment.error)
          return segment.rateLimited ? -1 : used
        }
        segmentId = segment.data.id
      }
      const { result, calls } = await upsertContact(env, row, segmentId)
      used += calls
      if (!result.ok && result.rateLimited) return -1
      if (result.ok) await markSynced(row, 1).run()
      else if (permanent(result)) {
        // For example an address Resend rejects. Logged, and not retried every minute.
        console.error(`Could not sync ${row.email} to Resend:`, result.error)
        await markSynced(row, row.resend_exists).run()
      } else console.error(`Resend unavailable while syncing ${row.email}, will retry:`, result.error)
    } else {
      // Unsubscribed, bounced, complained or pending again: Broadcasts must skip them.
      const result = await resendApi(env, 'PATCH', contactPath(row.email), { unsubscribed: true })
      used++
      if (!result.ok && result.rateLimited) return -1
      if (result.ok || result.status === 404) await markSynced(row, result.ok ? 1 : 0).run()
      else if (permanent(result)) {
        console.error(`Could not unsubscribe ${row.email} in Resend:`, result.error)
        await markSynced(row, row.resend_exists).run()
      } else console.error(`Resend unavailable while unsubscribing ${row.email}, will retry:`, result.error)
    }
  }
  return used
}

/** True while some subscriber change has not reached Resend yet. */
export async function syncPending(env: Env): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM (SELECT 1 FROM subscribers WHERE resend_synced = 0 LIMIT 1000)').first<{ n: number }>()
  const deletions = await env.DB.prepare('SELECT COUNT(*) AS n FROM resend_deletions').first<{ n: number }>()
  return (row?.n ?? 0) + (deletions?.n ?? 0)
}
