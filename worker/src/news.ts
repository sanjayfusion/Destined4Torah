import type { Env } from './env'

// Israel news headlines for the site's top ticker. Fetched here, on the server, so visitors'
// browsers never depend on a third-party RSS converter. Tried in order; the first feed that
// returns recent items wins.
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
    headers: { 'User-Agent': 'Destined4Torah-news/1.0 (+https://app.destined4torah.com)', Accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Feed ${url} returned ${response.status}`)
  const items = parseRss(await response.text())
  if (items.length === 0) throw new Error(`Feed ${url} had no recent items`)
  return items
}

/** Fetches fresh headlines and stores them. Keeps the old ones if every feed fails. */
export async function refreshNews(env: Env): Promise<NewsItem[]> {
  for (const url of FEEDS) {
    try {
      const items = await fetchFeed(url)
      const cached: Cached = { items, fetchedAt: Date.now() }
      await env.IMAGES.put(CACHE_KEY, JSON.stringify(cached), { expirationTtl: 24 * 60 * 60 })
      return items
    } catch (error) {
      console.error('News feed failed:', String(error))
    }
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
