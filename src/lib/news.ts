export interface NewsItem {
  title: string
  link: string
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
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`News request failed (${response.status})`)
  }

  const data = await response.json()

  if (data.status !== 'ok' || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Unexpected news response')
  }

  return data.items.slice(0, 15).map((item: { title: string; link: string }) => ({
    title: item.title,
    link: item.link,
  }))
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
