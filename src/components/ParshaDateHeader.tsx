function ordinal(n: number): string {
  const rules = new Intl.PluralRules('en', { type: 'ordinal' })
  const suffixes: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' }
  return `${n}${suffixes[rules.select(n)]}`
}

interface ParshaDateHeaderProps {
  parshaName: string
  parshaUrl: string
}

export function ParshaDateHeader({ parshaName, parshaUrl }: ParshaDateHeaderProps) {
  const today = new Date()
  const tonight = new Date(today)
  tonight.setDate(tonight.getDate() + 1)

  const gregorian = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(today)

  const hebrewParts = new Intl.DateTimeFormat('en-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(tonight)

  const hebrewDay = hebrewParts.find((part) => part.type === 'day')?.value
  const hebrewMonth = hebrewParts.find((part) => part.type === 'month')?.value
  const hebrewYear = hebrewParts.find((part) => part.type === 'year')?.value

  return (
    <p className="parsha-date-header">
      {gregorian} after sunset
      {hebrewDay && hebrewMonth && hebrewYear && (
        <>
          {' '}
          &middot; {ordinal(Number(hebrewDay))} of {hebrewMonth}, {hebrewYear}
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
