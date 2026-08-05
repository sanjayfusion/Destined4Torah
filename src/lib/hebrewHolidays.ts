export interface HolidayCountdown {
  name: string
  hebrewDate: string
  gregorianDate: string
  target: Date
}

interface HolidayDef {
  name: string
  month: string
  day: number
}

/**
 * Major Hebrew calendar holidays, by their fixed Hebrew month/day. Purim
 * falls in "Adar" in a regular year but "Adar II" in a leap year (the
 * Hebrew calendar has a leap month, Adar I, inserted seven times per
 * 19-year cycle) — both are listed so it's found correctly either way.
 */
const HOLIDAYS: HolidayDef[] = [
  { name: 'Rosh Hashana', month: 'Tishri', day: 1 },
  { name: 'Yom Kippur', month: 'Tishri', day: 10 },
  { name: 'Sukkot', month: 'Tishri', day: 15 },
  { name: 'Shemini Atzeret / Simchat Torah', month: 'Tishri', day: 22 },
  { name: 'Chanukah', month: 'Kislev', day: 25 },
  { name: 'Tu BiShvat', month: 'Shevat', day: 15 },
  { name: 'Purim', month: 'Adar', day: 14 },
  { name: 'Purim', month: 'Adar II', day: 14 },
  { name: 'Passover', month: 'Nisan', day: 15 },
  { name: 'Yom HaAtzmaut', month: 'Iyar', day: 5 },
  { name: 'Shavuot', month: 'Sivan', day: 6 },
  { name: "Tisha B'Av", month: 'Av', day: 9 },
]

function getHebrewParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(date)

  return {
    day: Number(parts.find((part) => part.type === 'day')?.value),
    month: parts.find((part) => part.type === 'month')?.value ?? '',
    year: parts.find((part) => part.type === 'year')?.value ?? '',
  }
}

/**
 * Scans forward day by day (using the browser's built-in Hebrew calendar
 * conversion, which we trust) to find the next occurrence of any listed
 * holiday, rather than implementing Hebrew<->Gregorian conversion by hand.
 */
export function findNextHoliday(): HolidayCountdown | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let offset = 0; offset <= 400; offset++) {
    const candidate = new Date(today)
    candidate.setDate(candidate.getDate() + offset)
    const heb = getHebrewParts(candidate)

    const match = HOLIDAYS.find((holiday) => holiday.month === heb.month && holiday.day === heb.day)
    if (!match) continue

    // Holidays begin at sunset the evening before this civil date; using
    // midnight of the matched date itself as the target is a simplification.
    const gregorianDate = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(candidate)

    return {
      name: match.name,
      hebrewDate: `${heb.day} ${heb.month}, ${heb.year}`,
      gregorianDate,
      target: candidate,
    }
  }

  return null
}
