import { useEffect, useState } from 'react'
import { About } from './components/About'
import { AllParshiyot } from './components/AllParshiyot'
import { BookNav } from './components/BookNav'
import { HolidayCountdownTicker } from './components/HolidayCountdownTicker'
import { NewsTicker } from './components/NewsTicker'
import { Reader } from './components/Reader'
import { WeeklyParsha } from './components/WeeklyParsha'
import { fetchNewTestamentChapter } from './lib/bibleApi'
import { ALL_BOOKS } from './data/books'
import type { ParshaListEntry } from './data/parshiyot'
import { fetchChapter, type ChapterText } from './lib/sefaria'
import logo from './assets/logo.png'
import './App.css'

type View = 'book' | 'parsha' | 'about' | 'parshiyot-list'

function App() {
  const [view, setView] = useState<View>('parsha')
  const [selectedParsha, setSelectedParsha] = useState<ParshaListEntry | null>(null)
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [chapter, setChapter] = useState<ChapterText | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }, [view, selectedBook, selectedChapter, source])

  return (
    <>
      <NewsTicker />
      <HolidayCountdownTicker />
      <div className="app">
        <header className="app-header">
          <img src={logo} className="app-logo" alt="Destined4Torah" />
          <p>Scripture in its Jewish context, Genesis to Revelation.</p>
          <p className="header-verse">
            &ldquo;...salvation is of the Jews.&rdquo; &mdash; John 4:22 (KJV)
          </p>
          <div className="header-nav">
            <button
              type="button"
              className={view === 'parsha' ? 'parsha-toggle active' : 'parsha-toggle'}
              onClick={() => {
                setSelectedParsha(null)
                setView('parsha')
              }}
            >
              This Week's Parashah
            </button>
            <button
              type="button"
              className={view === 'parshiyot-list' ? 'parsha-toggle active' : 'parsha-toggle'}
              onClick={() => setView('parshiyot-list')}
            >
              All Parshiyot
            </button>
            <button
              type="button"
              className={view === 'about' ? 'parsha-toggle active' : 'parsha-toggle'}
              onClick={() => setView('about')}
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

        <div className="app-body">
          <BookNav
            selectedBook={selectedBook}
            selectedChapter={selectedChapter}
            onSelect={(book, chap) => {
              setView('book')
              setSelectedBook(book)
              setSelectedChapter(chap)
            }}
          />
          <main className="app-main">
            {view === 'parsha' && <WeeklyParsha overrideParsha={selectedParsha} />}
            {view === 'parshiyot-list' && (
              <AllParshiyot
                onSelect={(parsha) => {
                  setSelectedParsha(parsha)
                  setView('parsha')
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
              />
            )}
          </main>
        </div>
      </div>
    </>
  )
}

export default App
