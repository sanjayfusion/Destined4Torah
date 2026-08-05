import { useEffect, useState } from 'react'
import { findNextHoliday, type HolidayCountdown } from '../lib/hebrewHolidays'

function formatCountdown(target: Date): string {
  const diffMs = target.getTime() - Date.now()
  if (diffMs <= 0) return 'now'

  const days = Math.floor(diffMs / 86400000)
  const hours = Math.floor((diffMs % 86400000) / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)

  return `${days} day${days === 1 ? '' : 's'}, ${hours} hour${hours === 1 ? '' : 's'}, ${minutes} minute${minutes === 1 ? '' : 's'}`
}

export function HolidayCountdownTicker() {
  const [holiday, setHoliday] = useState<HolidayCountdown | null>(null)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    setHoliday(findNextHoliday())
  }, [])

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  if (!holiday) {
    return null
  }

  const message = `${formatCountdown(holiday.target)} until ${holiday.name} — ${holiday.hebrewDate} · ${holiday.gregorianDate}`

  return (
    <div className="holiday-ticker">
      <span className="holiday-ticker-label">Next Holiday</span>
      <div className="holiday-ticker-track">
        <div className="holiday-ticker-content">
          {[0, 1, 2].map((i) => (
            <span key={i} className="holiday-ticker-item">
              {message}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
