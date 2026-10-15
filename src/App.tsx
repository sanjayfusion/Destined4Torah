import { TanakhPage } from './components/TanakhPage'
import { ReadingPreferencesProvider } from './components/ReadingControls'
import { useCallback, useEffect, useRef, useState } from 'react'
import { About } from './components/About'
import { AllParshiyot } from './components/AllParshiyot'
import { BackToTop } from './components/BackToTop'
import { BookNav } from './components/BookNav'
import { TopTicker } from './components/TopTicker'
import { Reader } from './components/Reader'
import { SubscribePage } from './components/SubscribePage'
import { WeeklyParsha } from './components/WeeklyParsha'
import { fetchNewTestamentChapter } from './lib/bibleApi'
import { ALL_BOOKS } from './data/books'
import { readPassageRoute, passageUrl, type PassageRoute } from './lib/passageLinks'
import { fetchChapter, type ChapterText } from './lib/sefaria'
import { initialStudyRoute, loadStudyProgress, saveStudyProgress, savedPassageLabel, type SavedPassage } from './lib/studyProgress'
import { SocialLinks } from './components/SocialLinks'
import headerBanner from './assets/header-banner.jpg'
import './App.css'

function App() {
  const [savedPassage, setSavedPassage] = useState<SavedPassage | null>(() => {
    try { return loadStudyProgress(window.localStorage) } catch { return null }
  })
  const [route, setRoute] = useState<PassageRoute>(() => initialStudyRoute(window.location.search, savedPassage))
  const lastReading = useRef<SavedPassage>(route.view === 'book' || route.view === 'parsha' ? route : savedPassage ?? { view: 'parsha' })
  useEffect(() => {
    if (route.view === 'book' || route.view === 'parsha') lastReading.current = route
  }, [route])
  const rememberPassage = useCallback((passage: SavedPassage) => {
    try {
      if (saveStudyProgress(passage, window.localStorage)) setSavedPassage(passage)
    } catch { /* The reader still works when local storage is unavailable. */ }
  }, [])
  const [studyMenuOpen, setStudyMenuOpen] = useState(false)
  useEffect(() => setStudyMenuOpen(false), [route])
  const view = route.view
  const overviewPage = view === 'subscribe' || view === 'tanakh' || view === 'about'
  // The book/chapter panel only helps while reading a book; the weekly portion and portion list get the full width.
  const showBookNav = view === 'book'
  const selectedParsha = route.view === 'parsha' ? route.parsha ?? null : null
  const selectedBook = route.view === 'book' ? route.book : 'Genesis'
  const selectedChapter = route.view === 'book' ? route.chapter : 1
  const [chapter, setChapter] = useState<ChapterText | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [resumeDismissed, setResumeDismissed] = useState(false)
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
      <TopTicker />
      <div className="app">
        <header className="app-header">
          <img
            src={headerBanner}
            className="app-banner"
            width={1600}
            height={592}
            alt="Destined4Torah. Dr. Sanjay Prajapati. Scripture in its Jewish context, Genesis to Revelation."
          />
          <SocialLinks />
          <p className="header-verse">
            &ldquo;Ye worship ye know not what: we know what we worship: for salvation is of the
            Jews.&rdquo; &mdash; John 4:22 (KJV)
          </p>
          <nav className="header-nav" aria-label="Main navigation">
            <div className="study-navigation">
            <button type="button" className="parsha-toggle study-menu-toggle" aria-expanded={studyMenuOpen} aria-controls="study-navigation-links" onClick={() => setStudyMenuOpen(!studyMenuOpen)}>Study Scripture ▾</button>
            <div id="study-navigation-links" className={studyMenuOpen ? 'study-links open' : 'study-links'}>
            <button
              type="button"
              className={view === 'parsha' ? 'parsha-toggle active' : 'parsha-toggle'}
              onClick={() => {
                navigate({ view: 'parsha' })
              }}
              title="This week's parashah"
            >
              This Week
            </button>
            <button
              type="button"
              className={view === 'parshiyot-list' ? 'parsha-toggle active' : 'parsha-toggle'}
              onClick={() => navigate({ view: 'parshiyot-list' })}
              title="All parshiyot"
            >
              Parshiyot
            </button>
            <button type="button" className={view === 'tanakh' ? 'parsha-toggle active' : 'parsha-toggle'} aria-current={view === 'tanakh' ? 'page' : undefined} onClick={() => navigate({ view: 'tanakh' })}>Tanakh</button>
            </div>
            </div>
            <button
              type="button"
              className={view === 'about' ? 'parsha-toggle active' : 'parsha-toggle'}
              onClick={() => navigate({ view: 'about' })}
            >
              About
            </button>
            <div className="header-actions">
            <button type="button" className={view === 'subscribe' ? 'parsha-toggle subscribe-nav active' : 'parsha-toggle subscribe-nav'} aria-current={view === 'subscribe' ? 'page' : undefined} onClick={() => navigate({ view: 'subscribe' })}>Subscribe</button>
            <a
              href="https://square.link/u/TQ6ubiPe?src=sheet"
              target="_blank"
              rel="noopener noreferrer"
              className="donate-link"
            >
              Partner with us
            </a>
            </div>
          </nav>
        </header>

        {savedPassage && !overviewPage && !resumeDismissed && <section className="continue-studying" aria-label="Saved reading" title="Remembered on this device">
          <span className="continue-studying-text">Last read: <strong>{savedPassageLabel(savedPassage)}</strong></span>
          <button type="button" className="continue-studying-go" onClick={() => navigate(savedPassage)}>Continue</button>
          <button type="button" className="continue-studying-close" aria-label="Hide this for now" onClick={() => setResumeDismissed(true)}>&times;</button>
        </section>}

        {showBookNav && <button type="button" className="mobile-nav-trigger" onClick={() => setMobileNavOpen(true)}>
          <span className="mobile-nav-trigger-label">
            {`${selectedBookInfo?.english ?? selectedBook} ${selectedChapter}`}
          </span>
          <span aria-hidden="true">Browse books ▾</span>
        </button>}

        <div className={showBookNav ? 'app-body' : 'app-body subscribe-layout'}>
          {showBookNav && <div className={mobileNavOpen ? 'book-nav-wrapper open' : 'book-nav-wrapper'}>
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
          </div>}
          <main className="app-main">
            {view === 'parsha' && <WeeklyParsha key={selectedParsha?.english ?? "weekly"} overrideParsha={selectedParsha} onReadingLoaded={selectedParsha ? rememberPassage : undefined} />}
            {view === 'parshiyot-list' && (
              <AllParshiyot
                onSelect={(parsha) => {
                  navigate({ view: 'parsha', parsha })
                }}
              />
            )}
            {view === 'about' && <About />}
            {view === 'tanakh' && <TanakhPage onSelect={(book) => navigate({ view: 'book', book, chapter: 1 })} />}
            {view === 'subscribe' && <SubscribePage onBackToReading={() => navigate(lastReading.current)} />}
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

        <BackToTop />
      </div>
    </ReadingPreferencesProvider>
  )
}

export default App
