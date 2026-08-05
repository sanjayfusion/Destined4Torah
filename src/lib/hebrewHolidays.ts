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
  /** Length in Hebrew days. Multi-day lengths follow Diaspora practice (e.g. 8-day Passover). */
  days: number
}

/**
 * Major Hebrew calendar holidays, by their fixed Hebrew month/day. Purim
 * falls in "Adar" in a regular year but "Adar II" in a leap year (the
 * Hebrew calendar has a leap month, Adar I, inserted seven times per
 * 19-year cycle) — both are listed so it's found correctly either way.
 */
const HOLIDAYS: HolidayDef[] = [
  { name: 'Rosh Hashana', month: 'Tishri', day: 1, days: 2 },
  { name: 'Yom Kippur', month: 'Tishri', day: 10, days: 1 },
  { name: 'Sukkot', month: 'Tishri', day: 15, days: 7 },
  { name: 'Shemini Atzeret / Simchat Torah', month: 'Tishri', day: 22, days: 1 },
  { name: 'Chanukah', month: 'Kislev', day: 25, days: 8 },
  { name: 'Tu BiShvat', month: 'Shevat', day: 15, days: 1 },
  { name: 'Purim', month: 'Adar', day: 14, days: 1 },
  { name: 'Purim', month: 'Adar II', day: 14, days: 1 },
  { name: 'Passover', month: 'Nisan', day: 15, days: 8 },
  { name: 'Yom HaAtzmaut', month: 'Iyar', day: 5, days: 1 },
  { name: 'Shavuot', month: 'Sivan', day: 6, days: 2 },
  { name: "Tisha B'Av", month: 'Av', day: 9, days: 1 },
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
 * conversion, which we trust) to find the next occurrence of any listed
 * holiday, rather than implementing Hebrew<->Gregorian conversion by hand.
 */
export function findNextHoliday(): HolidayCountdown | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let offset = 0; offset <= 400; offset++) {
    const firstCivilDay = addDays(today, offset)
    const heb = getHebrewParts(firstCivilDay)

    const match = HOLIDAYS.find((holiday) => holiday.month === heb.month && holiday.day === heb.day)
    if (!match) continue

    // Hebrew days run sunset-to-sunset, so the holiday starts the evening
    // before its first civil day and ends the evening its last civil day
    // closes out.
    const start = addDays(firstCivilDay, -1)
    const end = addDays(firstCivilDay, match.days - 1)

    // If we're already inside a multi-day holiday (its start already
    // passed but it hasn't ended), don't report it as "upcoming" — but
    // since we scan forward from today, this only matters on day one.
    if (end < today) continue

    return {
      name: match.name,
      hebrewDate: `${heb.day} ${heb.month}, ${heb.year}`,
      start,
      end,
    }
  }

  return null
}
