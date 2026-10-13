import { ALL_BOOKS } from '../data/books'
import { fetchGreekChapter } from './greekBible'
import type { ChapterText } from './sefaria'

interface BibleApiVerse {
  book_name: string
  chapter: number
  verse: number
  text: string
}

export async function fetchNewTestamentChapter(
  bookSlug: string,
  chapter: number,
  bookNumber?: number,
): Promise<ChapterText> {
  const [verses, greekResult] = await Promise.all([
    fetchKjvChapter(bookSlug, chapter),
    bookNumber ? fetchGreekChapter(bookNumber, chapter).catch(() => undefined) : Promise.resolve(undefined),
  ])

  return {
    ref: `${bookSlug} ${chapter}`,
    heRef: '',
    english: verses.map((verse) => verse.text.replace(/\s+/g, ' ').trim()),
    hebrew: [],
    greek: greekResult,
  }
}

const kjvCache = new Map<string, BibleApiVerse[]>()
export async function fetchKjvChapter(book: string, chapter: number): Promise<BibleApiVerse[]> {
  const key = `${book} ${chapter}`
  if (kjvCache.has(key)) return kjvCache.get(key)!
  const apiBook = ALL_BOOKS.find(b => b.slug === book)?.english ?? book
  const response = await fetch(`https://bible-api.com/${encodeURIComponent(apiBook)}+${chapter}?translation=kjv&single_chapter_book_matching=indifferent`, { signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new Error(`KJV request failed (${response.status})`)
  const data = await response.json()
  if (data.error || !Array.isArray(data.verses) || data.verses.length === 0) throw new Error('No KJV verses returned')
  if (data.verses.some((v: BibleApiVerse) => !Number.isInteger(v.verse) || v.verse < 1 || v.chapter !== chapter || typeof v.text !== 'string')) throw new Error('Invalid KJV verse data')
  const verses: BibleApiVerse[] = data.verses.map((v: BibleApiVerse) => ({ ...v, text: v.text.replace(/\s+/g, ' ').trim() }))
  kjvCache.set(key, verses)
  return verses
}
