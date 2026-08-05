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
  const url = `https://bible-api.com/${encodeURIComponent(bookSlug)}+${chapter}?translation=kjv`
  const [response, greekResult] = await Promise.all([
    fetch(url),
    bookNumber ? fetchGreekChapter(bookNumber, chapter).catch(() => undefined) : Promise.resolve(undefined),
  ])

  if (!response.ok) {
    throw new Error(`Bible API request failed (${response.status})`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error)
  }

  const verses: BibleApiVerse[] = Array.isArray(data.verses) ? data.verses : []

  return {
    ref: data.reference ?? `${bookSlug} ${chapter}`,
    heRef: '',
    english: verses.map((verse) => verse.text.replace(/\s+/g, ' ').trim()),
    hebrew: [],
    greek: greekResult,
  }
}
