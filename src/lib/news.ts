export interface NewsItem {
  title: string
  link: string
}

const FEED_URL = 'https://www.timesofisrael.com/feed/'
const RSS_TO_JSON_ENDPOINT = 'https://api.rss2json.com/v1/api.json'

export async function fetchIsraelNews(): Promise<NewsItem[]> {
  const url = `${RSS_TO_JSON_ENDPOINT}?rss_url=${encodeURIComponent(FEED_URL)}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`News request failed (${response.status})`)
  }

  const data = await response.json()

  if (data.status !== 'ok' || !Array.isArray(data.items)) {
    throw new Error('Unexpected news response')
  }

  return data.items.slice(0, 15).map((item: { title: string; link: string }) => ({
    title: item.title,
    link: item.link,
  }))
}
