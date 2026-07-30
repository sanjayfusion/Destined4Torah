import type { ChapterText } from '../lib/sefaria'

interface ReaderProps {
  chapter: ChapterText | null
  loading: boolean
  error: string | null
}

export function Reader({ chapter, loading, error }: ReaderProps) {
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
        <h2 className="hebrew" dir="rtl">{chapter.heRef}</h2>
      </header>

      <ol className="verse-list">
        {Array.from({ length: verseCount }, (_, i) => (
          <li key={i} className="verse">
            <span className="verse-number">{i + 1}</span>
            <p className="verse-hebrew" dir="rtl">{chapter.hebrew[i]}</p>
            <p className="verse-english">{chapter.english[i]}</p>
          </li>
        ))}
      </ol>
    </article>
  )
}
