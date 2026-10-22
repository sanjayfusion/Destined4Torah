import { useEffect, useState } from 'react'
import type { SavedPassage } from '../lib/studyProgress'
import { useReadAloud } from '../hooks/useReadAloud'
import { fetchChapterCommentary, type CommentaryByVerse } from '../lib/commentary'
import { fetchParshaByRef, fetchWeeklyParsha, sectionsForRef, type WeeklyParsha as WeeklyParshaData } from '../lib/sefaria'
import { OLD_TESTAMENT_BOOKS } from '../data/books'
import { hebrewTorahRef } from '../lib/hebrewNumerals'
import { findParshaEntry, type ParshaListEntry } from '../data/parshiyot'
import { HebrewVerseText } from './HebrewVerseText'
import { YouTubeIcon } from './icons'
import { ParshaDateHeader } from './ParshaDateHeader'
import { ReadAloudBar } from './ReadAloudBar'
import { SubscribeForm } from './SubscribeForm'
import { TextCredit } from './TextCredit'
import { useVerseSelection } from '../hooks/useVerseSelection'
import { VerseNumberButton, VerseSelectionBar } from './VerseSelection'
import { VerseCommentary } from './VerseCommentary'

interface WeeklyParshaProps {
  /** When set, shows this specific parsha instead of the current week's. */
  overrideParsha?: ParshaListEntry | null
  onReadingLoaded?: (passage: SavedPassage) => void
}

export function WeeklyParsha({ overrideParsha = null, onReadingLoaded }: WeeklyParshaProps) {
  const [parsha, setParsha] = useState<WeeklyParshaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentaryByChapter, setCommentaryByChapter] = useState<Record<number, CommentaryByVerse>>({})
  const [aliyahChoice, setAliyahChoice] = useState({ ref: '', index: 0 })
  const aliyot = parsha?.aliyot ?? []
  const aliyahIndex = aliyahChoice.ref === parsha?.ref ? aliyahChoice.index : 0
  const aliyahRef = aliyot[aliyahIndex]
  // Without known aliyot (e.g. a combined portion outside its week) the whole portion is shown.
  const shownSections = parsha ? (aliyahRef ? sectionsForRef(parsha.sections, aliyahRef) : parsha.sections) : []
  const readAloud = useReadAloud(shownSections.flatMap((section) => section.hebrew), 'he-IL')
  const selection = useVerseSelection(`${parsha?.ref ?? ''}#${aliyahIndex}`)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setParsha(null)

    const load = overrideParsha
      ? fetchParshaByRef({
          englishName: overrideParsha.english,
          hebrewName: overrideParsha.hebrew,
          ref: overrideParsha.ref,
        })
      : fetchWeeklyParsha()

    load
      .then((data) => {
        if (!cancelled) setParsha(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this parashah. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [overrideParsha])

  useEffect(() => {
    if (loading || error || !parsha) return
    onReadingLoaded?.({ view: 'parsha', parsha: overrideParsha ?? { english: parsha.englishName, hebrew: parsha.hebrewName, ref: parsha.ref } })
  }, [loading, error, parsha, overrideParsha, onReadingLoaded])

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
    return <p className="status">Loading parashah…</p>
  }

  if (error) {
    return <p className="status error">{error}</p>
  }

  if (!parsha) {
    return null
  }

  const teachingEntry = overrideParsha ?? findParshaEntry(parsha.englishName)
  const youtubeUrls = teachingEntry?.youtubeUrls ?? []
  const bookSlug = parsha.ref.split(' ')[0]
  const hebrewRef = hebrewTorahRef(parsha.ref)
  const bookTransliteration = OLD_TESTAMENT_BOOKS.find((book) => book.slug === bookSlug)?.transliteration
  const selectableVerses = shownSections.flatMap((section) =>
    section.hebrew.map((hebrew, i) => ({
      chapter: section.chapter,
      verse: section.startVerse + i,
      english: section.english[i] ?? '',
      hebrew,
    })),
  )

  return (
    <article className="reader">
      {!overrideParsha && <ParshaDateHeader />}

      <header className="parsha-header">
        <p className="parsha-label">{overrideParsha ? 'Parashah' : "This Week's Parashah"}</p>
        <div className="parsha-title-row">
          <div className="parsha-name">
            <h2>{parsha.englishName}</h2>
            {teachingEntry?.meaning && <p className="parsha-meaning">{teachingEntry.meaning}</p>}
          </div>
          <h2 className="hebrew" dir="rtl" lang="he">{teachingEntry?.hebrew ?? parsha.hebrewName}</h2>
        </div>
        <div className="parsha-title-row parsha-ref-row">
          <p className="parsha-ref">
            {bookTransliteration ? parsha.ref.replace(bookSlug, `${bookSlug} (${bookTransliteration})`) : parsha.ref}
          </p>
          {hebrewRef && <p className="parsha-ref hebrew" dir="rtl" lang="he">{hebrewRef}</p>}
        </div>
      </header>

      {youtubeUrls.length > 0 && (
        <div className="youtube-teaching-links">
          {youtubeUrls.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="youtube-teaching-link">
              <YouTubeIcon className="social-icon" />
              {teachingEntry?.youtubeTitles?.[i] ? `Watch: ${teachingEntry.youtubeTitles[i]}` : "Watch Sanjay's teaching"}
            </a>
          ))}
        </div>
      )}

      {aliyot.length > 0 && (
        <nav className="jump-menu aliyah-menu" aria-label="Choose an aliyah">
          {aliyot.map((ref, i) => (
            <button
              key={ref}
              type="button"
              className="jump-menu-link"
              aria-pressed={i === aliyahIndex}
              title={ref}
              onClick={() => {
                readAloud.stop()
                setAliyahChoice({ ref: parsha.ref, index: i })
              }}
            >
              Aliyah {i + 1}
            </button>
          ))}
        </nav>
      )}
      {aliyahRef && (
        <p className="aliyah-ref">
          Aliyah {aliyahIndex + 1} · {aliyahRef.replace(/(\d+):(\d+)-\1:/, '$1:$2-')}
        </p>
      )}

      <ReadAloudBar
        texts={shownSections.flatMap((section) => section.hebrew)}
        status={readAloud.status}
        currentIndex={readAloud.currentIndex}
        play={readAloud.play}
        stop={readAloud.stop}
        label={aliyahRef ? `Read Aliyah ${aliyahIndex + 1} aloud` : 'Read parashah aloud'}
      />

      {!aliyahRef && parsha.sections.length > 1 && (
        <nav className="jump-menu" aria-label="Jump to a chapter">
          <span className="jump-menu-label">Jump to:</span>
          {parsha.sections.map((section) => (
            <button
              key={section.chapter}
              type="button"
              className="jump-menu-link"
              onClick={() => document.getElementById(`chapter-${section.chapter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Chapter {section.chapter}
            </button>
          ))}
        </nav>
      )}

      {(() => {
        let globalVerseIndex = 0

        return shownSections.map((section) => {
          const sectionStartIndex = globalVerseIndex
          globalVerseIndex += section.hebrew.length

          return (
            <div key={section.chapter} id={`chapter-${section.chapter}`} className="parsha-section">
              {shownSections.length > 1 && (
                <h3 className="chapter-divider">Chapter {section.chapter}</h3>
              )}
              <ol className="verse-list">
                {section.hebrew.map((_, i) => (
                  <li key={i} className={selection.isSelected(sectionStartIndex + i) ? 'verse verse-selected' : 'verse'}>
                    <VerseNumberButton
                      label={`${section.chapter}:${section.startVerse + i}`}
                      selected={selection.isSelected(sectionStartIndex + i)}
                      onClick={() => selection.toggle(sectionStartIndex + i)}
                    />
                    <HebrewVerseText
                      book={bookSlug}
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

      {aliyahRef && aliyahIndex < aliyot.length - 1 && (
        <button
          type="button"
          className="aliyah-next"
          onClick={() => {
            readAloud.stop()
            setAliyahChoice({ ref: parsha.ref, index: aliyahIndex + 1 })
            document.querySelector('.aliyah-menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        >
          Continue to Aliyah {aliyahIndex + 2} →
        </button>
      )}

      <VerseSelectionBar
        book={bookSlug}
        bookSlug={bookSlug}
        translation="JPS 1917"
        verses={selectableVerses}
        range={selection.range}
        onClear={selection.clear}
      />

      <SubscribeForm compact />

      <TextCredit source="sefaria" />
    </article>
  )
}
