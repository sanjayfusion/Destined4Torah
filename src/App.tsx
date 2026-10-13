import { ReadingPreferencesProvider } from './components/ReadingControls'
import { useCallback, useEffect, useRef, useState } from 'react'
import { About } from './components/About'
import { AllParshiyot } from './components/AllParshiyot'
import { BookNav } from './components/BookNav'
import { HolidayCountdownTicker } from './components/HolidayCountdownTicker'
import { NewsTicker } from './components/NewsTicker'
import { Reader } from './components/Reader'
import { SubscribeForm } from './components/SubscribeForm'
import { WeeklyParsha } from './components/WeeklyParsha'
import { fetchNewTestamentChapter } from './lib/bibleApi'
import { ALL_BOOKS } from './data/books'
import { readPassageRoute, passageUrl, type PassageRoute } from './lib/passageLinks'
import { fetchChapter, type ChapterText } from './lib/sefaria'
import { initialStudyRoute, loadStudyProgress, saveStudyProgress, savedPassageLabel, type SavedPassage } from './lib/studyProgress'
import logo from './assets/logo.png'
import './App.css'

function App() {
  const [savedPassage, setSavedPassage] = useState<SavedPassage | null>(() => {
    try { return loadStudyProgress(window.localStorage) } catch { return null }
  })
  const [route, setRoute] = useState<PassageRoute>(() => initialStudyRoute(window.location.search, savedPassage))
  const initialRoute = useRef(route)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!['ref', 'parsha', 'view'].some((key) => params.has(key))) {
      window.history.replaceState(null, '', passageUrl(initialRoute.current, window.location.href))
    }
  }, [])
  const rememberPassage = useCallback((passage: SavedPassage) => {
    try {
      if (saveStudyProgress(passage, window.localStorage)) setSavedPassage(passage)
    } catch { /* The reader still works when local storage is unavailable. */ }
  }, [])
  const view = route.view
  const selectedParsha = route.view === 'parsha' ? route.parsha ?? null : null
  const selectedBook = route.view === 'book' ? route.book : 'Genesis'
  const selectedChapter = route.view === 'book' ? route.chapter : 1
  const [chapter, setChapter] = useState<ChapterText | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [verseJump, setVerseJump] = useState<{ verse: number; token: number } | null>(() => route.view === 'book' && route.verse !== undefined ? { verse: route.verse, token: 0 } : null)
  const verseJumpCounter = useRef(0)

  function applyRoute(next: PassageRoute) {
    if (next.view !== 'book' || route.view !== 'book' || next.book !== route.book || next.chapter !== route.chapter) {
      setChapter(null)
      setLoading(true)
      setError(null)
    }
    setRoute(next)
    setMobileNavOpen(false)
    verseJumpCounter.current += 1
    setVerseJump(next.view === 'book' && next.verse !== undefined ? { verse: next.verse, token: verseJumpCounter.current } : null)
  }

  function navigate(next: PassageRoute) {
    const url = passageUrl(next, window.location.href)
    if (url !== window.location.href) window.history.pushState(null, '', url)
    applyRoute(next)
  }

  useEffect(() => {
    const onPopState = () => {
      const next = readPassageRoute(window.location.search)
      if (next.view !== 'book' || route.view !== 'book' || next.book !== route.book || next.chapter !== route.chapter) {
        setChapter(null)
        setLoading(true)
        setError(null)
      }
      setRoute(next)
      setMobileNavOpen(false)
      verseJumpCounter.current += 1
      setVerseJump(next.view === 'book' && next.verse !== undefined ? { verse: next.verse, token: verseJumpCounter.current } : null)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [route])

  const selectedBookInfo = ALL_BOOKS.find((book) => book.slug === selectedBook)
  const source = selectedBookInfo?.testament === 'new' ? 'kjv' : 'sefaria'

  useEffect(() => {
    if (view !== 'book') return

    let cancelled = false
    setLoading(true)
    setError(null)

    const fetchPromise =
      source === 'kjv'
        ? fetchNewTestamentChapter(selectedBook, selectedChapter, selectedBookInfo?.bookNumber)
        : fetchChapter(selectedBook, selectedChapter)

    fetchPromise
      .then((data) => {
        if (!cancelled) setChapter(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this chapter. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [view, selectedBook, selectedChapter, source, selectedBookInfo?.bookNumber])

  useEffect(() => {
    if (route.view !== 'book' || loading || error || !chapter) return
    const verseCount = Math.max(chapter.english.length, chapter.hebrew.length)
    rememberPassage({ ...route, verse: route.verse !== undefined && route.verse <= verseCount ? route.verse : undefined })
  }, [route, loading, error, chapter, rememberPassage])

  useEffect(() => {
    if (!mobileNavOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  return (
    <ReadingPreferencesProvider>
      <NewsTicker />
      <HolidayCountdownTicker />
      <div className="app">
        <header className="app-header">
          <img src={logo} className="app-logo" alt="Destined4Torah" />
          <p>Scripture in its Jewish context, Genesis to Revelation.</p>
          <p className="header-verse">
            &ldquo;Ye worship ye know not what: we know what we worship: for salvation is of the
            Jews.&rdquo; &mdash; John 4:22 (KJV)
          </p>
          <div className="header-nav">
            <button
              type="button"
              className={view === 'parsha' ? 'parsha-toggle active' : 'parsha-toggle'}
              onClick={() => {
                navigate({ view: 'parsha' })
              }}
            >
              This Week's Parashah
            </button>
            <button
              type="button"
              className={view === 'parshiyot-list' ? 'parsha-toggle active' : 'parsha-toggle'}
              onClick={() => navigate({ view: 'parshiyot-list' })}
            >
              All Parshiyot
            </button>
            <button
              type="button"
              className={view === 'about' ? 'parsha-toggle active' : 'parsha-toggle'}
              onClick={() => navigate({ view: 'about' })}
            >
              About
            </button>
            <a
              href="https://square.link/u/TQ6ubiPe?src=sheet"
              target="_blank"
              rel="noopener noreferrer"
              className="donate-link"
            >
              Donate
            </a>
          </div>
        </header>

        {savedPassage && <section className="continue-studying" aria-label="Saved reading">
          <div><strong>Your last reading</strong><p>{savedPassageLabel(savedPassage)}</p></div>
          <button type="button" onClick={() => navigate(savedPassage)}>Continue studying</button>
          <small>Remembered on this device.</small>
        </section>}

        <button type="button" className="mobile-nav-trigger" onClick={() => setMobileNavOpen(true)}>
          <span className="mobile-nav-trigger-label">
            {view === 'book' ? `${selectedBookInfo?.english ?? selectedBook} ${selectedChapter}` : view === 'parsha' ? (selectedParsha?.ref ?? "This Week's Parashah") : view === 'about' ? 'About' : 'All Parshiyot'}
          </span>
          <span aria-hidden="true">Browse books ▾</span>
        </button>

        <div className="app-body">
          <div className={mobileNavOpen ? 'book-nav-wrapper open' : 'book-nav-wrapper'}>
            {mobileNavOpen && (
              <button
                type="button"
                className="mobile-nav-close"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close book navigation"
              >
                ✕
              </button>
            )}
            <BookNav
              selectedBook={selectedBook}
              selectedChapter={selectedChapter}
              onSelect={(book, chap, verse) => {
                navigate({ view: 'book', book, chapter: chap, verse })
              }}
            />
          </div>
          <main className="app-main">
            {view === 'parsha' && <WeeklyParsha key={selectedParsha?.english ?? "weekly"} overrideParsha={selectedParsha} onReadingLoaded={rememberPassage} />}
            {view === 'parshiyot-list' && (
              <AllParshiyot
                onSelect={(parsha) => {
                  navigate({ view: 'parsha', parsha })
                }}
              />
            )}
            {view === 'about' && <About />}
            {view === 'book' && (
              <Reader
                chapter={chapter}
                loading={loading}
                error={error}
                source={source}
                bookSlug={selectedBook}
                chapterNum={selectedChapter}
                targetVerse={verseJump}
              />
            )}
          </main>
        </div>

        <SubscribeForm />
      </div>
    </ReadingPreferencesProvider>
  )
}

export default App
