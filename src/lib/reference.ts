import { ALL_BOOKS, type BibleBook } from '../data/books'

export interface ParsedReference {
  book: BibleBook
  chapter: number
  verse?: number
}

/**
 * Common short forms that prefix matching alone can't resolve — either
 * because the abbreviation isn't literally a prefix of the book's name
 * ("jn" for John), or because it's a prefix of more than one book
 * ("phil" matches both Philippians and Philemon).
 */
const ABBREVIATIONS: Record<string, string> = {
  dt: 'Deuteronomy',
  mt: 'Matthew',
  mk: 'Mark',
  lk: 'Luke',
  jn: 'John',
  phil: 'Philippians',
}

/** Normalizes a book-name-ish string for comparison: lowercase, roman/arabic
 *  numeral prefixes unified to arabic, underscores/extra space collapsed. */
function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^iii\b/, '3')
    .replace(/^ii\b/, '2')
    .replace(/^i\b/, '1')
    .replace(/^first\b/, '1')
    .replace(/^second\b/, '2')
    .replace(/^third\b/, '3')
    .replace(/\s+/g, ' ')
    .trim()
}

function findBook(rawName: string): BibleBook | null {
  const name = normalize(rawName)
  if (!name) return null

  const exact = ALL_BOOKS.find(
    (book) => normalize(book.english) === name || normalize(book.slug) === name || (book.transliteration && normalize(book.transliteration) === name),
  )
  if (exact) return exact

  const abbrevTarget = ABBREVIATIONS[name.replace(/\s/g, '')]
  if (abbrevTarget) {
    const match = ALL_BOOKS.find((book) => book.english === abbrevTarget)
    if (match) return match
  }

  // Unambiguous prefix match, e.g. "gen" -> Genesis, "1 cor" -> 1 Corinthians.
  const prefixMatches = ALL_BOOKS.filter((book) => normalize(book.english).startsWith(name) || normalize(book.slug).startsWith(name))
  if (prefixMatches.length === 1) return prefixMatches[0]

  return null
}

/**
 * Parses a free-typed reference like "Genesis 12:1", "1 sam 17", "jn 3.16",
 * or just "Exodus" (defaults to chapter 1). Returns null if the book can't
 * be identified or the chapter/verse numbers are out of range.
 */
export function parseReference(input: string): ParsedReference | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^(.*?)(?:\s+(\d+)(?:[:.](\d+))?)?\s*$/)
  if (!match) return null

  const [, bookPart, chapterStr, verseStr] = match
  const book = findBook(bookPart)
  if (!book) return null

  const chapter = chapterStr ? Number(chapterStr) : 1
  if (chapter < 1 || chapter > book.chapters) return null

  const verse = verseStr ? Number(verseStr) : undefined
  if (verse !== undefined && verse < 1) return null

  return { book, chapter, verse }
}
