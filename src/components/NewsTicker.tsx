import { useEffect, useState } from 'react'
import { fetchIsraelNews, type NewsItem } from '../lib/news'

const REFRESH_INTERVAL_MS = 10 * 60 * 1000

export function NewsTicker() {
  const [items, setItems] = useState<NewsItem[]>([])

  useEffect(() => {
    let cancelled = false

    const load = () => {
      fetchIsraelNews()
        .then((data) => {
          if (!cancelled) setItems(data)
        })
        .catch(() => {
          if (!cancelled) setItems([])
        })
    }

    load()
    const interval = setInterval(load, REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (items.length === 0) {
    return null
  }

  return (
    <div className="news-ticker">
      <span className="news-ticker-verse">
        &ldquo;Pray for the peace of Jerusalem: they shall prosper that love thee.&rdquo;
        &nbsp;&mdash;&nbsp;Psalm 122:6
      </span>
      <span className="news-ticker-label">Israel News</span>
      <div className="news-ticker-track">
        <div className="news-ticker-content">
          {[...items, ...items].map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="news-ticker-item"
            >
              {item.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
