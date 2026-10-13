export interface NewsItem {
  title: string
  link: string
  publishedAt: string
}

// Tried in order; Times of Israel was dropped after it began blocking
// automated requests behind a Cloudflare captcha.
const FEED_URLS = [
  'https://www.jns.org/feed/',
  'https://www.jpost.com/rss/rssfeedsheadlines.aspx',
  'https://www.israelnationalnews.com/Rss.aspx?type=1',
]
const RSS_TO_JSON_ENDPOINT = 'https://api.rss2json.com/v1/api.json'

async function fetchFeed(feedUrl: string): Promise<NewsItem[]> {
  const url = `${RSS_TO_JSON_ENDPOINT}?rss_url=${encodeURIComponent(feedUrl)}`
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) })

  if (!response.ok) {
    throw new Error(`News request failed (${response.status})`)
  }

  const data = await response.json()

  if (data.status !== 'ok' || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Unexpected news response')
  }

  const now = Date.now()
  const fresh = data.items.flatMap((item: { title?: string; link?: string; pubDate?: string }) => {
    // rss2json returns timezone-less UTC dates; parse them explicitly as UTC.
    const rawDate = item.pubDate?.trim() ?? ''
    const publishedAt = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(rawDate)
      ? rawDate.replace(' ', 'T') + 'Z' : rawDate
    const timestamp = Date.parse(publishedAt)
    if (!item.title || !item.link || !/^https?:\/\//i.test(item.link) ||
        !Number.isFinite(timestamp) || timestamp > now || now - timestamp > 72 * 60 * 60 * 1000) return []
    return [{ title: item.title, link: item.link, publishedAt: new Date(timestamp).toISOString() }]
  }).slice(0, 15)
  if (fresh.length === 0) throw new Error('No recent news available')
  return fresh
}

export async function fetchIsraelNews(): Promise<NewsItem[]> {
  let lastError: unknown
  for (const feedUrl of FEED_URLS) {
    try {
      return await fetchFeed(feedUrl)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}
