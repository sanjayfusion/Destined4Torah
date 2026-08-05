import { useEffect, useState } from 'react'
import { fetchWeeklyParsha, type WeeklyParsha as WeeklyParshaData } from '../lib/sefaria'
import { HebrewVerseText } from './HebrewVerseText'
import { ParshaDateHeader } from './ParshaDateHeader'
import { TextCredit } from './TextCredit'

export function WeeklyParsha() {
  const [parsha, setParsha] = useState<WeeklyParshaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchWeeklyParsha()
      .then((data) => {
        if (!cancelled) setParsha(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this week\'s parsha. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="status">Loading this week's parsha…</p>
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
          <p className="parsha-label">This Week's Parsha</p>
          <h2>{parsha.englishName}</h2>
        </div>
        <h2 className="hebrew" dir="rtl">{parsha.hebrewName}</h2>
      </header>
      <p className="parsha-ref">{parsha.ref}</p>

      {parsha.sections.map((section) => (
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
                <HebrewVerseText text={section.hebrew[i]} />
                <p className="verse-english">{section.english[i]}</p>
              </li>
            ))}
          </ol>
        </div>
      ))}

      <TextCredit source="sefaria" />
    </article>
  )
}
