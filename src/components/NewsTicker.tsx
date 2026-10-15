import { useEffect, useState } from 'react'
import { useTickerSpeed } from '../hooks/useTickerSpeed'
import { fetchIsraelNews, type NewsItem } from '../lib/news'

const REFRESH_INTERVAL_MS = 10 * 60 * 1000
const RETRY_DELAY_MS = 30 * 1000
const MAX_QUICK_RETRIES = 3

export function NewsTicker() {
  const [items, setItems] = useState<NewsItem[]>([])
  const { ref, duration } = useTickerSpeed(2, items, 63)

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let failures = 0

    const load = () => {
      fetchIsraelNews()
        .then((data) => {
          failures = 0
          if (!cancelled) setItems(data)
        })
        .catch(() => {
          // Keep any headlines we already have. After a failure, try again soon a few times
          // before settling back to the regular refresh.
          if (cancelled) return
          failures += 1
          if (failures <= MAX_QUICK_RETRIES) retryTimer = setTimeout(load, RETRY_DELAY_MS)
        })
    }

    load()
    const interval = setInterval(load, REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      clearTimeout(retryTimer)
      clearInterval(interval)
    }
  }, [])

  // The verse always shows. The headlines are an extra that appears when they load.
  const hasNews = items.length > 0

  return (
    <div className={hasNews ? 'news-ticker' : 'news-ticker news-ticker-verse-only'}>
      <span className="news-ticker-verse">
        &ldquo;Pray for the peace of Jerusalem: they shall prosper that love thee.&rdquo;
        &nbsp;&mdash;&nbsp;Psalm 122:6
      </span>
      {hasNews && <span className="news-ticker-label">Israel News</span>}
      {hasNews && <div className="news-ticker-track">
        <div className="news-ticker-content" ref={ref} style={{ animationDuration: `${duration}s` }}>
          {[...items, ...items].map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="news-ticker-item"
            >
              {item.title}{' · '}
              <time dateTime={item.publishedAt}>
                {new Date(item.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </time>
            </a>
          ))}
        </div>
      </div>}
    </div>
  )
}
