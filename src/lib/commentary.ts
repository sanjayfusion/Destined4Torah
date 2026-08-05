import { stripTags } from './sefaria'

export interface CommentaryEntry {
  commentator: string
  texts: string[]
}

export type CommentaryByVerse = Record<number, CommentaryEntry[]>

/**
 * Classical rabbinic commentators to surface — not every cross-reference
 * Sefaria links (which also include Talmud, Midrash, modern commentary,
 * etc.), just the well-known "sages of blessed memory."
 */
const CLASSICAL_COMMENTATORS = [
  'Rashi',
  'Ramban',
  'Ibn Ezra',
  'Sforno',
  'Or HaChaim',
  'Rashbam',
  'Chizkuni',
  'Ralbag',
  "Ba'al HaTurim",
]

interface SefariaLink {
  category?: string
  collectiveTitle?: { en?: string }
  index_title?: string
  anchorRef?: string
  text?: string | string[]
}

export async function fetchChapterCommentary(bookSlug: string, chapter: number): Promise<CommentaryByVerse> {
  const url = `https://www.sefaria.org/api/links/${bookSlug}.${chapter}?with_text=1`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Sefaria links request failed (${response.status})`)
  }

  const data: SefariaLink[] = await response.json()

  if (!Array.isArray(data)) {
    throw new Error('Unexpected links response')
  }

  const byVerse: CommentaryByVerse = {}

  for (const link of data) {
    if (link.category !== 'Commentary') continue

    const commentator = link.collectiveTitle?.en ?? link.index_title ?? ''
    if (!CLASSICAL_COMMENTATORS.some((name) => commentator.includes(name))) continue

    const rawText = Array.isArray(link.text) ? link.text : link.text ? [link.text] : []
    const cleaned = rawText.map(stripTags).filter(Boolean)
    if (cleaned.length === 0) continue

    const verseMatch = /:(\d+)$/.exec(link.anchorRef ?? '')
    if (!verseMatch) continue
    const verseNum = Number(verseMatch[1])

    const entries = (byVerse[verseNum] ??= [])
    const existing = entries.find((entry) => entry.commentator === commentator)
    if (existing) {
      existing.texts.push(...cleaned)
    } else {
      entries.push({ commentator, texts: cleaned })
    }
  }

  return byVerse
}
