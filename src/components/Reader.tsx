import { useEffect, useState } from 'react'
import { fetchChapterCommentary, type CommentaryByVerse } from '../lib/commentary'
import type { ChapterText } from '../lib/sefaria'
import { GreekVerseText } from './GreekVerseText'
import { HebrewVerseText } from './HebrewVerseText'
import { TextCredit } from './TextCredit'
import { VerseCommentary } from './VerseCommentary'

interface ReaderProps {
  chapter: ChapterText | null
  loading: boolean
  error: string | null
  source: 'sefaria' | 'kjv'
  bookSlug: string
  chapterNum: number
}

export function Reader({ chapter, loading, error, source, bookSlug, chapterNum }: ReaderProps) {
  const [commentary, setCommentary] = useState<CommentaryByVerse>({})

  useEffect(() => {
    if (source !== 'sefaria') {
      setCommentary({})
      return
    }

    let cancelled = false
    fetchChapterCommentary(bookSlug, chapterNum)
      .then((data) => {
        if (!cancelled) setCommentary(data)
      })
      .catch(() => {
        if (!cancelled) setCommentary({})
      })

    return () => {
      cancelled = true
    }
  }, [source, bookSlug, chapterNum])

  if (loading) {
    return <p className="status">Loading text…</p>
  }

  if (error) {
    return <p className="status error">{error}</p>
  }

  if (!chapter) {
    return null
  }

  const verseCount = Math.max(chapter.english.length, chapter.hebrew.length)

  return (
    <article className="reader">
      <header className="reader-header">
        <h2>{chapter.ref}</h2>
        {chapter.heRef && (
          <h2 className="hebrew" dir="rtl">{chapter.heRef}</h2>
        )}
      </header>

      <ol className="verse-list">
        {Array.from({ length: verseCount }, (_, i) => (
          <li key={i} className="verse">
            <span className="verse-number">{i + 1}</span>
            {chapter.hebrew[i] && <HebrewVerseText text={chapter.hebrew[i]} />}
            {chapter.greek?.[i] && <GreekVerseText text={chapter.greek[i]} />}
            <p className="verse-english">{chapter.english[i]}</p>
            <VerseCommentary entries={commentary[i + 1] ?? []} />
          </li>
        ))}
      </ol>

      <TextCredit source={source} />
    </article>
  )
}
