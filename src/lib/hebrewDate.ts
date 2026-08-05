export function ordinal(n: number): string {
  const rules = new Intl.PluralRules('en', { type: 'ordinal' })
  const suffixes: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' }
  return `${n}${suffixes[rules.select(n)]}`
}

export interface HebrewDateInfo {
  gregorian: string
  hebrewDay: string
  hebrewMonth: string
  hebrewYear: string
}

/** Today's Gregorian date, plus the Hebrew date that begins at sunset tonight. */
export function getTonightsHebrewDate(): HebrewDateInfo | null {
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

  if (!hebrewDay || !hebrewMonth || !hebrewYear) return null

  return { gregorian, hebrewDay, hebrewMonth, hebrewYear }
}
