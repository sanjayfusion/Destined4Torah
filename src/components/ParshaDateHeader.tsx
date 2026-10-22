import { getTonightsHebrewDate, ordinal } from '../lib/hebrewDate'

export function ParshaDateHeader() {
  const date = getTonightsHebrewDate()
  if (!date) return null

  return (
    <p className="parsha-date-header">
      {date.gregorian} after sunset &middot; {ordinal(Number(date.hebrewDay))} of {date.hebrewMonth}, {date.hebrewYear}
    </p>
  )
}
