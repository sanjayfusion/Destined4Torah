import { useEffect, useState } from 'react'
import { useReadAloud } from '../hooks/useReadAloud'
import { fetchChapterCommentary, type CommentaryByVerse } from '../lib/commentary'
import { fetchWeeklyParsha, type WeeklyParsha as WeeklyParshaData } from '../lib/sefaria'
import { HebrewVerseText } from './HebrewVerseText'
import { ParshaDateHeader } from './ParshaDateHeader'
import { ReadAloudBar } from './ReadAloudBar'
import { TextCredit } from './TextCredit'
import { VerseCommentary } from './VerseCommentary'

export function WeeklyParsha() {
  const [parsha, setParsha] = useState<WeeklyParshaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentaryByChapter, setCommentaryByChapter] = useState<Record<number, CommentaryByVerse>>({})
  const readAloud = useReadAloud(parsha?.sections.flatMap((section) => section.hebrew) ?? [], 'he-IL')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchWeeklyParsha()
      .then((data) => {
        if (!cancelled) setParsha(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this week\'s parashah. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!parsha) return
    let cancelled = false

    Promise.all(
      parsha.sections.map((section) =>
        fetchChapterCommentary(parsha.ref.split(' ')[0], section.chapter)
          .then((data) => [section.chapter, data] as const)
          .catch(() => [section.chapter, {} as CommentaryByVerse] as const),
      ),
    ).then((results) => {
      if (cancelled) return
      setCommentaryByChapter(Object.fromEntries(results))
    })

    return () => {
      cancelled = true
    }
  }, [parsha])

  if (loading) {
    return <p className="status">Loading this week's parashah…</p>
  }

  if (error) {
    return <p className="status error">{error}</p>
  }

  if (!parsha) {
    return null
  }

  return (
    <article className="reader">
      <ParshaDateHeader parshaName={parsha.englishName} parshaUrl={parsha.url} />

      <header className="reader-header">
        <div>
          <p className="parsha-label">This Week's Parashah</p>
          <h2>{parsha.englishName}</h2>
        </div>
        <h2 className="hebrew" dir="rtl">{parsha.hebrewName}</h2>
      </header>
      <p className="parsha-ref">{parsha.ref}</p>

      <ReadAloudBar
        texts={parsha.sections.flatMap((section) => section.hebrew)}
        status={readAloud.status}
        currentIndex={readAloud.currentIndex}
        play={readAloud.play}
        stop={readAloud.stop}
        label="Read parsha aloud"
      />

      {(() => {
        let globalVerseIndex = 0

        return parsha.sections.map((section) => {
          const sectionStartIndex = globalVerseIndex
          globalVerseIndex += section.hebrew.length

          return (
            <div key={section.chapter} className="parsha-section">
              {parsha.sections.length > 1 && (
                <h3 className="chapter-divider">Chapter {section.chapter}</h3>
              )}
              <ol className="verse-list">
                {section.hebrew.map((_, i) => (
                  <li key={i} className="verse">
                    <span className="verse-number">
                      {section.chapter}:{section.startVerse + i}
                    </span>
                    <HebrewVerseText
                      text={section.hebrew[i]}
                      highlightCharIndex={
                        readAloud.currentIndex === sectionStartIndex + i ? readAloud.currentCharIndex : null
                      }
                    />
                    <p className="verse-english">{section.english[i]}</p>
                    <VerseCommentary
                      entries={commentaryByChapter[section.chapter]?.[section.startVerse + i] ?? []}
                    />
                  </li>
                ))}
              </ol>
            </div>
          )
        })
      })()}

      <TextCredit source="sefaria" />
    </article>
  )
}
