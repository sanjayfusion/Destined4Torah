import { Fragment, useEffect, useState } from 'react'
import { useTickerSpeed } from '../hooks/useTickerSpeed'
import { getTonightsHebrewDate, ordinal } from '../lib/hebrewDate'
import { findUpcomingHolidays } from '../lib/hebrewHolidays'
import { fetchIsraelNews, type NewsItem } from '../lib/news'
import { fetchParshaInfo } from '../lib/sefaria'

const PARSHA_REFRESH_MS = 6 * 60 * 60 * 1000 // 6 hours: plenty to catch the weekly change
const NEWS_REFRESH_MS = 10 * 60 * 1000
const NEWS_RETRY_MS = 30 * 1000
const MAX_QUICK_RETRIES = 3
const TICK_MS = 60 * 1000
const ROLLING_WINDOW_MONTHS = 12

function formatCountdown(target: Date): string {
  const diffMs = target.getTime() - Date.now()
  if (diffMs <= 0) return 'now'

  const days = Math.floor(diffMs / 86400000)
  const hours = Math.floor((diffMs % 86400000) / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)

  return `${days} day${days === 1 ? '' : 's'}, ${hours} hour${hours === 1 ? '' : 's'}, ${minutes} minute${minutes === 1 ? '' : 's'}`
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date)
}

/**
 * One scrolling line at the top of the page: the verse, tonight's Hebrew date and
 * parashah, the countdown to the next holiday, then Israel news headlines.
 * The verse, date and countdown never depend on the network for headlines, so the
 * line is always there even if the news request fails.
 */
export function TopTicker() {
  const [parshaName, setParshaName] = useState<string | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      fetchParshaInfo()
        .then((info) => {
          if (!cancelled) setParshaName(info.englishName)
        })
        .catch(() => {
          if (!cancelled) setParshaName(null)
        })
    }
    load()
    const interval = setInterval(load, PARSHA_REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let failures = 0

    const load = () => {
      fetchIsraelNews()
        .then((data) => {
          failures = 0
          if (!cancelled) setNews(data)
        })
        .catch(() => {
          // Keep any headlines we already have; retry soon a few times, then wait for the regular refresh.
          if (cancelled) return
          failures += 1
          if (failures <= MAX_QUICK_RETRIES) retryTimer = setTimeout(load, NEWS_RETRY_MS)
        })
    }
    load()
    const interval = setInterval(load, NEWS_REFRESH_MS)
    return () => {
      cancelled = true
      clearTimeout(retryTimer)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), TICK_MS)
    return () => clearInterval(interval)
  }, [])

  const date = getTonightsHebrewDate()
  const dateMessage =
    date && parshaName
      ? `${formatDateLabel(new Date())} after sunset · ${ordinal(Number(date.hebrewDay))} of ${date.hebrewMonth}, ${date.hebrewYear} · Parashat ${parshaName}`
      : null

  // Re-scanned on every tick, so once a holiday passes the next one takes its place.
  const nextHoliday = findUpcomingHolidays(ROLLING_WINDOW_MONTHS)[0]
  const holidayInProgress = nextHoliday !== undefined && nextHoliday.start.getTime() <= Date.now()
  const holidayMessage = nextHoliday
    ? holidayInProgress
      ? `${nextHoliday.name} is underway · ${nextHoliday.hebrewDate} · ends ${formatDateLabel(nextHoliday.end)} sunset`
      : `${formatCountdown(nextHoliday.start)} until ${nextHoliday.name} · ${nextHoliday.hebrewDate} · ${formatDateLabel(nextHoliday.start)} sunset to ${formatDateLabel(nextHoliday.end)} sunset`
    : null

  // Re-measuring on every minute tick would restart the CSS animation (a visible jump),
  // so only re-measure when what is shown actually changes.
  const stableKey = `${parshaName ?? ''}|${nextHoliday?.name ?? ''}|${news.length}`
  const { ref, duration } = useTickerSpeed(2, stableKey, 80)

  const segments: React.ReactNode[] = [
    <span key="verse" className="top-ticker-verse">
      &ldquo;Pray for the peace of Jerusalem: they shall prosper that love thee.&rdquo; (Psalm 122:6)
    </span>,
  ]
  if (dateMessage) segments.push(<span key="date">{dateMessage}</span>)
  if (holidayMessage) segments.push(<span key="holiday">{holidayMessage}</span>)
  if (news.length > 0) {
    segments.push(
      <span key="news-label" className="top-ticker-news-label">
        Israel News
      </span>,
    )
    news.forEach((item, i) =>
      segments.push(
        <a key={`news-${i}`} href={item.link} target="_blank" rel="noopener noreferrer" className="top-ticker-link">
          {item.title}
          {' · '}
          <time dateTime={item.publishedAt}>
            {new Date(item.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </time>
        </a>,
      ),
    )
  }

  return (
    <div className="top-ticker" role="region" aria-label="Verse, Hebrew date, next holiday and Israel news">
      <div className="top-ticker-track">
        <div className="top-ticker-content" ref={ref} style={{ animationDuration: `${duration}s` }}>
          {[0, 1].map((copy) => (
            <Fragment key={copy}>
              {segments.map((segment, i) => (
                <span key={i} className="top-ticker-item" aria-hidden={copy === 1 ? true : undefined}>
                  {segment}
                </span>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
