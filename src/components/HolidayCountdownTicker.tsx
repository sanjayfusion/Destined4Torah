import { useEffect, useState } from 'react'
import { useTickerSpeed } from '../hooks/useTickerSpeed'
import { getTonightsHebrewDate, ordinal } from '../lib/hebrewDate'
import { findNextHoliday, type HolidayCountdown } from '../lib/hebrewHolidays'
import { fetchParshaInfo } from '../lib/sefaria'

const PARSHA_REFRESH_MS = 6 * 60 * 60 * 1000 // 6 hours — plenty to catch the weekly change
const TICK_MS = 60 * 1000

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

export function HolidayCountdownTicker() {
  const [holiday, setHoliday] = useState<HolidayCountdown | null>(null)
  const [parshaName, setParshaName] = useState<string | null>(null)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    setHoliday(findNextHoliday())
  }, [])

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
    const interval = setInterval(() => forceUpdate((n) => n + 1), TICK_MS)
    return () => clearInterval(interval)
  }, [])

  const date = getTonightsHebrewDate()
  const dateMessage =
    date && parshaName
      ? `${formatDateLabel(new Date())} after sunset · ${ordinal(Number(date.hebrewDay))} of ${date.hebrewMonth}, ${date.hebrewYear} · Parashat ${parshaName}`
      : null

  const holidayMessage = holiday
    ? `${formatCountdown(holiday.start)} until ${holiday.name} — ${holiday.hebrewDate} · ${formatDateLabel(holiday.start)} sunset to ${formatDateLabel(holiday.end)} sunset`
    : null

  const items = [dateMessage, holidayMessage].filter((item): item is string => item !== null)
  const { ref, duration } = useTickerSpeed(2, items, 135)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="holiday-ticker">
      <span className="holiday-ticker-label">Next Holiday</span>
      <div className="holiday-ticker-track">
        <div className="holiday-ticker-content" ref={ref} style={{ animationDuration: `${duration}s` }}>
          {[...items, ...items].map((message, i) => (
            <span key={i} className="holiday-ticker-item">
              {message}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
