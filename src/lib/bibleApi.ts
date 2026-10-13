import { ENGLISH_TRANSLATIONS, translationAvailable, type EnglishTranslationId } from '../data/englishTranslations'
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

const translationCache = new Map<string, BibleApiVerse[]>()
export async function fetchBibleTranslationChapter(book: string, chapter: number, translation: EnglishTranslationId): Promise<BibleApiVerse[]> {
  if (!ENGLISH_TRANSLATIONS.some(t => t.id === translation)) throw new Error('Unsupported translation')
  const testament = ALL_BOOKS.find(b => b.slug === book)?.testament ?? 'old'
  if (!translationAvailable(translation, testament)) throw new Error('This translation is available only for the New Testament')
  const key = `${translation}:${book} ${chapter}`
  if (translationCache.has(key)) return translationCache.get(key)!
  const apiBook = ALL_BOOKS.find(b => b.slug === book)?.english ?? book
  const response = await fetch(`https://bible-api.com/${encodeURIComponent(apiBook)}+${chapter}?translation=${translation}&single_chapter_book_matching=indifferent`, { signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new Error(`Bible translation request failed (${response.status})`)
  const data = await response.json()
  if (data.translation_id !== translation) throw new Error('The requested translation was not returned')
  if (data.error || !Array.isArray(data.verses) || data.verses.length === 0) throw new Error('No verses returned')
  if (data.verses.some((v: BibleApiVerse) => !Number.isInteger(v.verse) || v.verse < 1 || v.chapter !== chapter || typeof v.text !== 'string')) throw new Error('Invalid Bible verse data')
  const verses: BibleApiVerse[] = data.verses.map((v: BibleApiVerse) => ({ ...v, text: v.text.replace(/\s+/g, ' ').trim() }))
  translationCache.set(key, verses)
  return verses
}

export function fetchKjvChapter(book: string, chapter: number): Promise<BibleApiVerse[]> {
  return fetchBibleTranslationChapter(book, chapter, 'kjv')
}
