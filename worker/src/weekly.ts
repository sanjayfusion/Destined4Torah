import { reflectOnPortion } from './ai'
import { emailConfigured, mailingAddress, renderCampaign, sendBatch } from './email'
import type { Env } from './env'
import { esc, messagePage } from './html'
import { hmacHex, now, safeEqual } from './util'

// The weekly newsletter. On Saturday morning it drafts a newsletter about the Torah portion that
// begins at sunset that evening, emails a preview to the owner, and sends it to every confirmed
// subscriber in the afternoon unless the owner cancelled it. Runs from the once-a-minute cron.
const TZ = 'America/Los_Angeles'
const PREVIEW_HOUR = 8 // 8:00 AM Pacific
const SEND_HOUR = 14 // 2:00 PM Pacific
const LAST_SEND_HOUR = 20 // never send a missed newsletter after 8:00 PM
const PREVIEW_LEAD_SECONDS = 60 * 60 // the preview must have been out for an hour before the send
const STATE_TTL = 60 * 60 * 24 * 30
const FORCE_TEST_KEY = 'weekly:force-test'
const PAUSED_KEY = 'weekly:paused'

interface State {
  campaignId?: number
  previewSentAt?: number
  startedAt: number
  cancelled?: boolean
  sent?: boolean
  /** No newsletter this week (a holiday week with no regular portion). */
  skipped?: boolean
}

interface Local {
  weekday: number // 0 = Sunday
  year: number
  month: number
  day: number
  hour: number
}

function localTime(date: Date): Local {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  )
  return {
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday),
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
  }
}

function addDays(local: Local, days: number): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(local.year, local.month - 1, local.day + days, 12))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

const dateKey = (d: { year: number; month: number; day: number }) => `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`

interface Portion {
  name: string
  hebrew: string
  ref: string
  summary: string
}

/** The portion read on the Shabbat that falls on the given date, from Sefaria's calendar. */
async function fetchPortion(date: { year: number; month: number; day: number }): Promise<Portion> {
  const response = await fetch(`https://www.sefaria.org/api/calendars?year=${date.year}&month=${date.month}&day=${date.day}&diaspora=1&timezone=${TZ}`)
  if (!response.ok) throw new Error(`Sefaria ${response.status}`)
  const data = (await response.json()) as { calendar_items?: { title?: { en?: string }; displayValue?: { en?: string; he?: string }; ref?: string; description?: { en?: string } }[] }
  const item = data.calendar_items?.find((c) => c.title?.en === 'Parashat Hashavua')
  if (!item?.displayValue?.en || !item.ref) throw new Error('No portion found for that date')
  return { name: item.displayValue.en, hebrew: item.displayValue.he ?? '', ref: item.ref, summary: (item.description?.en ?? '').trim() }
}

const SPELLING_ALIASES: Record<string, string> = { chayeisara: 'chayeisarah' }
const normName = (name: string) => {
  const plain = name.toLowerCase().replace(/[^a-z]/g, '')
  return SPELLING_ALIASES[plain] ?? plain
}

interface SiteInfo {
  /** The site's spelling of the name (e.g. "Lech Lecha"), when the site list is reachable. */
  name?: string
  hebrew?: string
  videos: { title: string; url: string }[]
}

/** Names, Hebrew and Dr. Sanjay's teaching videos for a portion, from the same list the site uses. */
async function fetchSiteInfo(env: Env, name: string): Promise<SiteInfo | null> {
  try {
    const response = await fetch(`${env.SITE_URL}/parshiyot.json`)
    if (!response.ok) return null
    const list = (await response.json()) as { english: string; hebrew: string; youtubeUrls?: string[]; youtubeTitles?: string[] }[]
    // Combined portions arrive as "Vayakhel-Pekudei": match each half, or the whole name.
    const whole = list.find((p) => normName(p.english) === normName(name))
    const entries = whole ? [whole] : name.split('-').map((part) => list.find((p) => normName(p.english) === normName(part))).filter((p): p is NonNullable<typeof p> => Boolean(p))
    if (entries.length === 0) return { videos: [] }
    const seen = new Set<string>()
    const videos: { title: string; url: string }[] = []
    for (const entry of entries) {
      entry.youtubeUrls?.forEach((url, i) => {
        if (!/^https:\/\/(www\.)?youtube\.com\//.test(url) || seen.has(url)) return
        seen.add(url)
        videos.push({ url, title: entry.youtubeTitles?.[i] ?? "Dr. Sanjay's teaching" })
      })
    }
    return { name: entries.map((e) => e.english).join('-'), hebrew: entries.map((e) => e.hebrew).join('־'), videos }
  } catch {
    return null
  }
}

function buildBody(env: Env, portion: Portion, sefariaName: string, reflection: string, videos: { title: string; url: string }[]): string {
  const siteLink = `${env.SITE_URL}/?parsha=${encodeURIComponent(sefariaName)}`
  const lines = [
    `# ${portion.name}${portion.hebrew ? ` | ${portion.hebrew}` : ''}`,
    '',
    `Beginning at sunset this evening, our Torah portion is **${portion.name}** (${portion.ref}).`,
  ]
  if (reflection) lines.push('', reflection)
  lines.push('', `**Read it in Hebrew and English:** [Open ${portion.name} on the study site](${siteLink})`)
  for (const video of videos) lines.push('', `**Watch Dr. Sanjay's teaching:** [${video.title.replace(/[[\]]/g, '')}](${video.url})`)
  lines.push('', 'Blessings,', '', '**Dr. Sanjay Prajapati**')
  return lines.join('\n')
}

async function cancelToken(env: Env, campaignId: number): Promise<string> {
  return hmacHex(env.SESSION_SECRET, `weekly-cancel.${campaignId}`)
}

async function createDraftAndPreview(env: Env, saturday: { year: number; month: number; day: number }, mode: 'weekly' | 'test'): Promise<State> {
  const portion = await fetchPortion(addDays({ ...saturday, weekday: 6, hour: 0 }, 7))
  const site = await fetchSiteInfo(env, portion.name)
  if (!site) throw new Error('The site portion list is unavailable') // try again next minute
  if (!site.name) {
    // Holiday weeks: Sefaria lists the holiday reading instead of a regular portion. Skip, and say so.
    const note = `No weekly newsletter was made this week. Sefaria lists "${portion.name}" (a holiday reading) for next Shabbat, not a regular Torah portion. You can still write one in the admin: ${env.WORKER_URL}/admin`
    await sendBatch(env, [{ to: env.AUTO_PREVIEW_TO!, subject: `No weekly newsletter this week (${portion.name})`, html: `<p>${esc(note)}</p>`, text: note }])
    return { startedAt: now(), skipped: true, sent: true }
  }
  const reflection = portion.summary
    ? await reflectOnPortion(env, portion.name, portion.ref, portion.summary).catch((error) => (console.error('Reflection failed:', String(error)), ''))
    : ''
  // Prefer the site's own spelling and vowelled Hebrew so the email matches what readers see on the site.
  const shown: Portion = { ...portion, name: site.name ?? portion.name, hebrew: site.hebrew ?? portion.hebrew }
  const body = buildBody(env, shown, portion.name, reflection, site.videos)
  const subject = `${shown.name}: your Torah portion begins at sunset`
  const stamp = now()
  const row = await env.DB.prepare(`INSERT INTO campaigns (subject, body, status, created_at, updated_at) VALUES (?, ?, 'draft', ?, ?) RETURNING id`)
    .bind(subject, body, stamp, stamp)
    .first<{ id: number }>()
  const campaignId = row!.id

  const adminLink = `${env.WORKER_URL}/admin/campaigns/${campaignId}`
  const cancelLink = `${env.WORKER_URL}/weekly/cancel?c=${campaignId}&d=${dateKey(saturday)}&t=${await cancelToken(env, campaignId)}`
  const notice =
    mode === 'test'
      ? '> **This is a test.** Nothing was sent to your subscribers.'
      : `> **Preview.** This will be sent automatically to all confirmed subscribers at 2:00 PM Pacific today. [Edit it in the admin](${adminLink}) before then, or [cancel this week's send](${cancelLink}).`
  const [headline, ...rest] = body.split('\n')
  const preview = renderCampaign(env, `[PREVIEW] ${subject}`, `${headline}\n\n${notice}\n${rest.join('\n')}`, `${env.WORKER_URL}/unsubscribe?t=preview`, undefined, 'Sanjay')
  const result = await sendBatch(env, [{ to: env.AUTO_PREVIEW_TO!, subject: `[PREVIEW] ${subject}`, html: preview.html, text: preview.text }])
  if (!result.ok) {
    await env.DB.prepare(`DELETE FROM campaigns WHERE id = ? AND status = 'draft'`).bind(campaignId).run()
    throw new Error(`Preview email failed: ${result.error}`)
  }
  if (mode === 'test') await env.DB.prepare(`DELETE FROM campaigns WHERE id = ? AND status = 'draft'`).bind(campaignId).run()
  return { campaignId, previewSentAt: now(), startedAt: stamp }
}

/** Queues every confirmed subscriber for a draft, exactly like the admin's Send button. */
async function queueCampaign(env: Env, id: number): Promise<boolean> {
  const results = await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO deliveries (campaign_id, subscriber_id) SELECT ?, id FROM subscribers WHERE status = 'confirmed' AND (SELECT status FROM campaigns WHERE id = ?) = 'draft'`).bind(id, id),
    env.DB.prepare(`UPDATE campaigns SET status = 'sending', total_recipients = (SELECT COUNT(*) FROM deliveries WHERE campaign_id = ?), updated_at = ? WHERE id = ? AND status = 'draft'`).bind(id, now(), id),
  ])
  return results[1].meta.changes > 0
}

/** Called every minute by the cron. Does nothing unless it is the right time on a Saturday. */
export async function runWeekly(env: Env): Promise<void> {
  if (!env.AUTO_PREVIEW_TO || !emailConfigured(env) || !mailingAddress(env)) return

  const local = localTime(new Date())

  // A manual test: make this week's newsletter right now and email only the preview.
  // Works even while the weekly send is paused.
  if (await env.IMAGES.get(FORCE_TEST_KEY)) {
    await env.IMAGES.delete(FORCE_TEST_KEY)
    const saturday = addDays(local, (6 - local.weekday + 7) % 7)
    await createDraftAndPreview(env, { ...saturday }, 'test')
    return
  }

  if (await env.IMAGES.get(PAUSED_KEY)) return

  if (local.weekday !== 6) return
  const saturday = { year: local.year, month: local.month, day: local.day }
  const key = `weekly:${dateKey(saturday)}`
  const raw = await env.IMAGES.get(key)
  const state = raw ? (JSON.parse(raw) as State) : null

  if (!state) {
    if (local.hour < PREVIEW_HOUR) return
    // Claim the week first so a slow run is never repeated by the next minute's run.
    await env.IMAGES.put(key, JSON.stringify({ startedAt: now() } satisfies State), { expirationTtl: STATE_TTL })
    try {
      const created = await createDraftAndPreview(env, saturday, 'weekly')
      await env.IMAGES.put(key, JSON.stringify(created), { expirationTtl: STATE_TTL })
    } catch (error) {
      console.error('Weekly newsletter preview failed:', String(error))
      await env.IMAGES.delete(key) // try again next minute
    }
    return
  }

  if (state.skipped || state.cancelled || state.sent) return
  if (!state.campaignId) {
    // A run that claimed the week but never finished: let a new run try after five minutes.
    if (now() - state.startedAt > 5 * 60) await env.IMAGES.delete(key)
    return
  }
  if (state.cancelled || state.sent) return
  if (local.hour < SEND_HOUR || local.hour >= LAST_SEND_HOUR) return
  if (now() - (state.previewSentAt ?? now()) < PREVIEW_LEAD_SECONDS) return

  const started = await queueCampaign(env, state.campaignId)
  await env.IMAGES.put(key, JSON.stringify({ ...state, sent: true }), { expirationTtl: STATE_TTL })
  console.log(started ? `Weekly newsletter ${state.campaignId} queued for sending.` : `Weekly newsletter ${state.campaignId} was not a draft; nothing queued.`)
}

/** The link in the preview email: GET asks for confirmation, POST cancels (so link scanners cannot cancel it). */
export async function handleWeeklyCancel(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const id = Number(url.searchParams.get('c'))
  const day = url.searchParams.get('d') ?? ''
  const token = url.searchParams.get('t') ?? ''
  if (!Number.isInteger(id) || id <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(day) || !(await safeEqual(token, await cancelToken(env, id)))) {
    return messagePage('Link not valid', 'This cancel link is not valid.', 404)
  }
  if (request.method === 'GET') {
    const form = `<form method="post" action="/weekly/cancel?c=${id}&d=${esc(day)}&t=${esc(token)}"><button type="submit">Yes, cancel this week's newsletter</button></form>`
    return messagePage("Cancel this week's newsletter?", 'The draft will be deleted and nothing will be sent to your subscribers this week.', 200, form)
  }
  const deleted = await env.DB.prepare(`DELETE FROM campaigns WHERE id = ? AND status = 'draft'`).bind(id).run()
  const key = `weekly:${day}`
  const raw = await env.IMAGES.get(key)
  const state = raw ? (JSON.parse(raw) as State) : { startedAt: now() }
  await env.IMAGES.put(key, JSON.stringify({ ...state, cancelled: true }), { expirationTtl: STATE_TTL })
  return deleted.meta.changes > 0
    ? messagePage("This week's newsletter is cancelled", 'Nothing will be sent to your subscribers this week. Next Saturday\'s newsletter is not affected.')
    : messagePage('Too late to cancel', 'This newsletter has already started sending, so it can no longer be cancelled here.', 409)
}
