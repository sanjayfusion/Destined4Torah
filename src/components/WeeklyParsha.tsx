import { useEffect, useRef, useState } from 'react'
import type { SavedPassage } from '../lib/studyProgress'
import { useReadAloud } from '../hooks/useReadAloud'
import { useReadAloudRate } from '../hooks/useReadAloudRate'
import { fetchChapterCommentary, type CommentaryByVerse } from '../lib/commentary'
import { fetchParshaByRef, fetchRefSections, fetchWeeklyParsha, sectionsForRef, type ParshaSection, type WeeklyParsha as WeeklyParshaData } from '../lib/sefaria'
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
  // Daily study reads one aliyah a day: Sunday is Aliyah 1 through Shabbat, Aliyah 7.
  const todaysAliyah = !overrideParsha && aliyot.length === 7 ? new Date().getDay() : null
  const aliyahIndex = aliyahChoice.ref === parsha?.ref ? aliyahChoice.index : todaysAliyah ?? 0
  const aliyahRef = aliyot[aliyahIndex]
  // The haftarah is offered as the stop after the last aliyah.
  const haftarahRefs = aliyot.length > 0 ? parsha?.haftarah ?? [] : []
  const showingHaftarah = haftarahRefs.length > 0 && aliyahIndex === aliyot.length
  const [haftarah, setHaftarah] = useState<{ key: string; sections: ParshaSection[]; commentary: Record<number, CommentaryByVerse>; failed?: boolean } | null>(null)
  const haftarahKey = haftarahRefs.join('; ')
  const haftarahLoaded = haftarah?.key === haftarahKey ? haftarah : null
  // Without known aliyot (e.g. a combined portion outside its week) the whole portion is shown.
  const shownSections = !parsha
    ? []
    : showingHaftarah
      ? haftarahLoaded?.sections ?? []
      : aliyahRef ? sectionsForRef(parsha.sections, aliyahRef) : parsha.sections
  const [readAloudRate, setReadAloudRate] = useReadAloudRate()
  const readAloud = useReadAloud(shownSections.flatMap((section) => section.hebrew), 'he-IL', readAloudRate)
  const selection = useVerseSelection(`${parsha?.ref ?? ''}#${aliyahIndex}`)
  useEffect(() => {
    if (!showingHaftarah || haftarahLoaded) return
    let cancelled = false
    const refs = haftarahKey.split('; ')
    Promise.all(refs.map(fetchRefSections))
      .then(async (parts) => {
        const sections = parts.flat()
        const book = refs[0].replace(/\s+\d.*$/, '').replace(/ /g, '_')
        const commentary = Object.fromEntries(await Promise.all(sections.map((section) =>
          fetchChapterCommentary(book, section.chapter)
            .then((data) => [section.chapter, data] as const)
            .catch(() => [section.chapter, {} as CommentaryByVerse] as const),
        )))
        if (!cancelled) setHaftarah({ key: haftarahKey, sections, commentary })
      })
      .catch(() => {
        if (!cancelled) setHaftarah({ key: haftarahKey, sections: [], commentary: {}, failed: true })
      })
    return () => {
      cancelled = true
    }
  }, [showingHaftarah, haftarahLoaded, haftarahKey])

  // Set by "Continue to Aliyah"; the scroll waits until the next aliyah has rendered.
  const scrollToTopRef = useRef(false)

  useEffect(() => {
    if (!scrollToTopRef.current) return
    scrollToTopRef.current = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [aliyahIndex])

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
  // The book the shown verses come from (the haftarah's prophet, or the Torah book).
  const readingBook = showingHaftarah ? haftarahRefs[0].replace(/\s+\d.*$/, '').replace(/ /g, '_') : bookSlug
  const readingCommentary = showingHaftarah ? haftarahLoaded?.commentary ?? {} : commentaryByChapter
  const haftarahLabel = haftarahRefs
    .map((ref) => ref.replace(/^([A-Za-z][A-Za-z ]*?)(?=\s+\d)/, (book) => OLD_TESTAMENT_BOOKS.find((b) => b.slug === book.replace(/ /g, '_'))?.english ?? book))
    .join('; ')
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
              className={`jump-menu-link${i === todaysAliyah ? ' aliyah-today' : ''}`}
              aria-pressed={i === aliyahIndex}
              title={ref}
              onClick={() => {
                readAloud.stop()
                setAliyahChoice({ ref: parsha.ref, index: i })
              }}
            >
              Aliyah {i + 1}
              {i === todaysAliyah && <span className="aliyah-today-badge">Today</span>}
            </button>
          ))}
          {haftarahRefs.length > 0 && (
            <button
              type="button"
              className="jump-menu-link"
              aria-pressed={showingHaftarah}
              title={haftarahLabel}
              onClick={() => {
                readAloud.stop()
                setAliyahChoice({ ref: parsha.ref, index: aliyot.length })
              }}
            >
              Haftarah
            </button>
          )}
        </nav>
      )}
      {todaysAliyah === 5 && aliyahIndex !== 6 && (
        <p className="shabbat-eve-note" role="note">
          Shabbat begins at sunset tonight · Aliyah 7 is Shabbat&rsquo;s reading.{' '}
          <button
            type="button"
            onClick={() => {
              readAloud.stop()
              setAliyahChoice({ ref: parsha.ref, index: 6 })
            }}
          >
            Read Aliyah 7
          </button>
        </p>
      )}
      {showingHaftarah && (
        <p className="aliyah-ref">Haftarah · {haftarahLabel}</p>
      )}
      {showingHaftarah && !haftarahLoaded && <p className="status">Loading haftarah…</p>}
      {haftarahLoaded?.failed && showingHaftarah && <p className="status error">Could not load the haftarah. Please try again.</p>}
      {aliyahRef && (
        <p className="aliyah-ref">
          Aliyah {aliyahIndex + 1}{aliyahIndex === todaysAliyah && " · Today's reading"} · {aliyahRef.replace(/(\d+):(\d+)-\1:/, '$1:$2-')}
        </p>
      )}

      <ReadAloudBar
        texts={shownSections.flatMap((section) => section.hebrew)}
        status={readAloud.status}
        currentIndex={readAloud.currentIndex}
        play={readAloud.play}
        stop={readAloud.stop}
        rate={readAloudRate}
        onRateChange={setReadAloudRate}
        label={showingHaftarah ? 'Read Haftarah aloud' : aliyahRef ? `Read Aliyah ${aliyahIndex + 1} aloud` : 'Read parashah aloud'}
      />

      {!aliyahRef && !showingHaftarah && parsha.sections.length > 1 && (
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
                      book={readingBook}
                      text={section.hebrew[i]}
                      highlightCharIndex={
                        readAloud.currentIndex === sectionStartIndex + i ? readAloud.currentCharIndex : null
                      }
                    />
                    <p className="verse-english">{section.english[i]}</p>
                    <VerseCommentary
                      entries={readingCommentary[section.chapter]?.[section.startVerse + i] ?? []}
                    />
                  </li>
                ))}
              </ol>
            </div>
          )
        })
      })()}

      {aliyahRef && (aliyahIndex < aliyot.length - 1 || haftarahRefs.length > 0) && (
        <button
          type="button"
          className="aliyah-next"
          onClick={() => {
            readAloud.stop()
            scrollToTopRef.current = true
            setAliyahChoice({ ref: parsha.ref, index: aliyahIndex + 1 })
          }}
        >
          {aliyahIndex < aliyot.length - 1 ? `Continue to Aliyah ${aliyahIndex + 2} →` : 'Continue to Haftarah →'}
        </button>
      )}

      <VerseSelectionBar
        book={OLD_TESTAMENT_BOOKS.find((book) => book.slug === readingBook)?.english ?? readingBook}
        bookSlug={readingBook}
        translation="JPS 1917"
        verses={selectableVerses}
        range={selection.range}
        onClear={selection.clear}
        onExtend={selection.extend}
      />

      <SubscribeForm compact />

      <TextCredit source="sefaria" />
    </article>
  )
}
