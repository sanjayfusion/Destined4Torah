import { getTonightsHebrewDate, ordinal } from '../lib/hebrewDate'

interface ParshaDateHeaderProps {
  parshaName: string
  parshaUrl: string
}

export function ParshaDateHeader({ parshaName, parshaUrl }: ParshaDateHeaderProps) {
  const date = getTonightsHebrewDate()

  return (
    <p className="parsha-date-header">
      {date?.gregorian} after sunset
      {date && (
        <>
          {' '}
          &middot; {ordinal(Number(date.hebrewDay))} of {date.hebrewMonth}, {date.hebrewYear}
        </>
      )}
      {' '}
      &middot;{' '}
      <a href={`https://www.sefaria.org/${parshaUrl}`} target="_blank" rel="noopener noreferrer">
        Parashat {parshaName}
      </a>
    </p>
  )
}
