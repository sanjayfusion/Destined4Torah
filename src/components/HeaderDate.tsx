import { getTonightsHebrewDate, ordinal } from '../lib/hebrewDate'

export function HeaderDate() {
  const date = getTonightsHebrewDate()

  if (!date) {
    return null
  }

  return (
    <p className="header-date">
      {date.gregorian} &middot; {ordinal(Number(date.hebrewDay))} of {date.hebrewMonth}, {date.hebrewYear}{' '}
      after sunset
    </p>
  )
}
