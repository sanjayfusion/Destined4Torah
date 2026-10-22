import { parseParshaRef } from './sefaria'

const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת']
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ']
const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט']

const TORAH_BOOKS_HEBREW: Record<string, string> = {
  Genesis: 'בראשית',
  Exodus: 'שמות',
  Leviticus: 'ויקרא',
  Numbers: 'במדבר',
  Deuteronomy: 'דברים',
}

/** Writes 1-499 in Hebrew letters with geresh/gershayim, e.g. 12 -> "י״ב", 15 -> "ט״ו". */
export function hebrewNumeral(value: number): string {
  let letters = HUNDREDS[Math.floor(value / 100)] ?? ''
  const rest = value % 100
  // 15 and 16 are written ט״ו and ט״ז so they don't spell a divine name.
  if (rest === 15) letters += 'טו'
  else if (rest === 16) letters += 'טז'
  else letters += TENS[Math.floor(rest / 10)] + ONES[rest % 10]
  return letters.length === 1 ? `${letters}׳` : `${letters.slice(0, -1)}״${letters.slice(-1)}`
}

/** Hebrew form of a Torah range, e.g. "Genesis 12:1-17:27" -> "בראשית י״ב:א׳-י״ז:כ״ז". */
export function hebrewTorahRef(ref: string): string | null {
  try {
    const range = parseParshaRef(ref)
    const book = TORAH_BOOKS_HEBREW[range.book]
    if (!book) return null
    const start = `${hebrewNumeral(range.startChapter)}:${hebrewNumeral(range.startVerse)}`
    const end = range.endChapter === range.startChapter
      ? hebrewNumeral(range.endVerse)
      : `${hebrewNumeral(range.endChapter)}:${hebrewNumeral(range.endVerse)}`
    return `${book} ${start}-${end}`
  } catch {
    return null
  }
}
