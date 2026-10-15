import type { Env } from './env'

// Israel news headlines for the site's top ticker. Fetched here, on the server, so visitors'
// browsers never depend on a third-party RSS converter. CBN News comes first (it has no RSS
// feed, so its Israel page is read directly). If that gives nothing recent, the RSS feeds below
// are tried in order and the first one that returns recent items wins.
const CBN_ISRAEL_PAGE = 'https://cbn.com/news/israel'
const CBN_ORIGIN = 'https://cbn.com'
const CBN_MAX_STORIES = 14
const CBN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // CBN posts less often than a wire service
const TARGET_ITEMS = 12
const OPINION_LINK = /\/(opinion|column|columns|editorial)s?\//i
const CBN_DATES_KEY = 'news:cbn-dates'
const FEEDS = ['https://www.jns.org/feed/', 'https://www.jpost.com/rss/rssfeedsheadlines.aspx', 'https://www.israelnationalnews.com/Rss.aspx?type=1']

const CACHE_KEY = 'news:israel'
const REFRESH_AFTER_MS = 15 * 60 * 1000
const MAX_ITEM_AGE_MS = 72 * 60 * 60 * 1000
const MAX_ITEMS = 15

export interface NewsItem {
  title: string
  link: string
  publishedAt: string
}

interface Cached {
  items: NewsItem[]
  fetchedAt: number
}

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…' }

function decode(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED[name.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim()
}

function tag(block: string, name: string): string {
  const match = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(block)
  return match ? decode(match[1]) : ''
}

function parseRss(xml: string): NewsItem[] {
  const now = Date.now()
  const items: NewsItem[] = []
  for (const match of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const block = match[0]
    const title = tag(block, 'title')
    const link = tag(block, 'link')
    const timestamp = Date.parse(tag(block, 'pubDate') || tag(block, 'dc:date'))
    if (!title || !/^https?:\/\//i.test(link) || !Number.isFinite(timestamp) || timestamp > now + 5 * 60 * 1000 || now - timestamp > MAX_ITEM_AGE_MS) continue
    items.push({ title, link, publishedAt: new Date(Math.min(timestamp, now)).toISOString() })
  }
  return items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, MAX_ITEMS)
}

async function fetchFeed(url: string): Promise<NewsItem[]> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Feed ${url} returned ${response.status}`)
  const items = parseRss(await response.text())
  if (items.length === 0) throw new Error(`Feed ${url} had no recent items`)
  return items
}


const USER_AGENT = 'Destined4Torah-news/1.0 (+https://app.destined4torah.com)'

/** "2026-10-14T03:35:16-0400" -> a Date (adds the colon in the offset so Date.parse accepts it). */
function parsePublished(value: string): number {
  return Date.parse(value.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'))
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' }, signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error(`Page ${url} returned ${response.status}`)
  return response.text()
}

/** CBN News has no RSS feed: read the Israel page for story links, then each story's publish time. */
async function fetchCbn(env: Env): Promise<NewsItem[]> {
  const html = await fetchPage(CBN_ISRAEL_PAGE)
  const stories = new Map<string, string>()
  for (const match of html.matchAll(/<a href="(\/news\/israel\/[a-z0-9-]+)"[^>]*aria-label="([^"]+)"/gi)) {
    if (!stories.has(match[1])) stories.set(match[1], decode(match[2]))
  }
  const top = [...stories.entries()].slice(0, CBN_MAX_STORIES)
  if (top.length === 0) throw new Error('No CBN stories found on the Israel page')

  // Publish times are remembered between runs, so only new stories need a fetch.
  const known = (await env.IMAGES.get<Record<string, string>>(CBN_DATES_KEY, 'json')) ?? {}
  const missing = top.filter(([path]) => !known[path])
  await Promise.all(
    missing.map(async ([path]) => {
      try {
        const page = await fetchPage(CBN_ORIGIN + path)
        const published = /article:published_time"\s+content="([^"]+)"/i.exec(page)?.[1]
        if (published && Number.isFinite(parsePublished(published))) known[path] = new Date(parsePublished(published)).toISOString()
      } catch (error) {
        console.error('CBN story date failed:', path, String(error))
      }
    }),
  )
  const live: Record<string, string> = {}
  for (const [path] of top) if (known[path]) live[path] = known[path]
  await env.IMAGES.put(CBN_DATES_KEY, JSON.stringify(live), { expirationTtl: 7 * 24 * 60 * 60 })

  const now = Date.now()
  const items: NewsItem[] = []
  for (const [path, title] of top) {
    const publishedAt = live[path]
    const timestamp = publishedAt ? Date.parse(publishedAt) : NaN
    if (!title || !Number.isFinite(timestamp) || timestamp > now + 5 * 60 * 1000 || now - timestamp > CBN_MAX_AGE_MS) continue
    items.push({ title, link: CBN_ORIGIN + path, publishedAt })
  }
  if (items.length === 0) throw new Error('No recent CBN stories')
  return items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, MAX_ITEMS)
}

/** Fetches fresh headlines and stores them. Keeps the old ones if every source fails. */
export async function refreshNews(env: Env): Promise<NewsItem[]> {
  // CBN News first.
  let items: NewsItem[] = []
  try {
    items = await fetchCbn(env)
  } catch (error) {
    console.error('News source failed: CBN News', String(error))
  }

  // Top up with current news stories (opinion columns left out) so the line stays fresh.
  if (items.length < TARGET_ITEMS) {
    for (const url of FEEDS) {
      try {
        const have = new Set(items.map((item) => item.link))
        const extra = (await fetchFeed(url)).filter((item) => !OPINION_LINK.test(item.link) && !have.has(item.link))
        items = [...items, ...extra].slice(0, TARGET_ITEMS)
        break
      } catch (error) {
        console.error('News source failed:', url, String(error))
      }
    }
  }

  if (items.length > 0) {
    const cached: Cached = { items, fetchedAt: Date.now() }
    await env.IMAGES.put(CACHE_KEY, JSON.stringify(cached), { expirationTtl: 24 * 60 * 60 })
    return items
  }
  const stale = await env.IMAGES.get<Cached>(CACHE_KEY, 'json')
  return stale?.items ?? []
}

/** Called from the cron: refresh only when the stored headlines are getting old. */
export async function refreshNewsIfStale(env: Env): Promise<void> {
  const cached = await env.IMAGES.get<Cached>(CACHE_KEY, 'json')
  if (!cached || Date.now() - cached.fetchedAt > REFRESH_AFTER_MS) await refreshNews(env)
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') ?? ''
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  return allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', Vary: 'Origin' } : { Vary: 'Origin' }
}

export async function handleNews(request: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(request, env)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 })

  const cached = await env.IMAGES.get<Cached>(CACHE_KEY, 'json')
  const stale = !cached || Date.now() - cached.fetchedAt > REFRESH_AFTER_MS
  const items = stale ? await refreshNews(env) : cached.items
  return new Response(JSON.stringify({ items }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...cors },
  })
}
