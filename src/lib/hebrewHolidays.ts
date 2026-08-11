export interface HolidayCountdown {
  name: string
  hebrewDate: string
  /** Sunset the evening before the holiday's first Hebrew day — its actual start. */
  start: Date
  /** Sunset at the end of the holiday's last Hebrew day. */
  end: Date
}

interface HolidayDef {
  name: string
  month: string
  day: number
  /** Length in Hebrew days. Multi-day lengths follow Diaspora practice (e.g. 8-day Pesach). */
  days: number
}

/**
 * Major Hebrew calendar holidays, by their fixed Hebrew month/day. Purim
 * falls in "Adar" in a regular year but "Adar II" in a leap year (the
 * Hebrew calendar has a leap month, Adar I, inserted seven times per
 * 19-year cycle) — both are listed so it's found correctly either way.
 * Shemini Atzeret and Simchat Torah are listed separately (Diaspora
 * practice: Tishri 22 and 23, rather than combined into one day).
 */
const HOLIDAYS: HolidayDef[] = [
  { name: 'Rosh Hashana', month: 'Tishri', day: 1, days: 2 },
  { name: 'Yom Kippur', month: 'Tishri', day: 10, days: 1 },
  { name: 'Sukkot', month: 'Tishri', day: 15, days: 7 },
  { name: 'Shemini Atzeret', month: 'Tishri', day: 22, days: 1 },
  { name: 'Simchat Torah', month: 'Tishri', day: 23, days: 1 },
  { name: 'Chanukah', month: 'Kislev', day: 25, days: 8 },
  { name: 'Tu BiShvat', month: 'Shevat', day: 15, days: 1 },
  { name: 'Purim', month: 'Adar', day: 14, days: 1 },
  { name: 'Purim', month: 'Adar II', day: 14, days: 1 },
  { name: 'Pesach', month: 'Nisan', day: 15, days: 8 },
  { name: 'Yom HaAtzmaut', month: 'Iyar', day: 5, days: 1 },
  { name: 'Shavuot', month: 'Sivan', day: 6, days: 2 },
  { name: "Tish'a B'Av", month: 'Av', day: 9, days: 1 },
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

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Scans forward day by day (using the browser's built-in Hebrew calendar
 * conversion, which we trust) to find every listed holiday starting within
 * the given window, rather than implementing Hebrew<->Gregorian conversion
 * by hand. Holidays whose end has already passed relative to "today" are
 * naturally excluded — call this again later and they'll be gone on their
 * own, no separate cleanup needed.
 */
export function findUpcomingHolidays(monthsAhead = 12): HolidayCountdown[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const windowEnd = new Date(today)
  windowEnd.setMonth(windowEnd.getMonth() + monthsAhead)
  const maxOffsetDays = Math.ceil((windowEnd.getTime() - today.getTime()) / 86400000)

  const results: HolidayCountdown[] = []

  for (let offset = 0; offset <= maxOffsetDays; offset++) {
    const firstCivilDay = addDays(today, offset)
    const heb = getHebrewParts(firstCivilDay)

    const match = HOLIDAYS.find((holiday) => holiday.month === heb.month && holiday.day === heb.day)
    if (!match) continue

    // Hebrew days run sunset-to-sunset, so the holiday starts the evening
    // before its first civil day and ends the evening its last civil day
    // closes out.
    const start = addDays(firstCivilDay, -1)
    const end = addDays(firstCivilDay, match.days - 1)

    if (end < today) continue

    results.push({
      name: match.name,
      hebrewDate: `${heb.day} ${heb.month}, ${heb.year}`,
      start,
      end,
    })
  }

  return results
}
