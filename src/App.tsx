import { useEffect, useState } from 'react'
import { BookNav } from './components/BookNav'
import { Reader } from './components/Reader'
import { WeeklyParsha } from './components/WeeklyParsha'
import { fetchChapter, type ChapterText } from './lib/sefaria'
import './App.css'

type View = 'book' | 'parsha'

function App() {
  const [view, setView] = useState<View>('parsha')
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [chapter, setChapter] = useState<ChapterText | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (view !== 'book') return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchChapter(selectedBook, selectedChapter)
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
  }, [view, selectedBook, selectedChapter])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Destined4Torah</h1>
        <p>A simple space to learn the Five Books of Moses, in Hebrew and English.</p>
        <button
          type="button"
          className={view === 'parsha' ? 'parsha-toggle active' : 'parsha-toggle'}
          onClick={() => setView('parsha')}
        >
          This Week's Parsha
        </button>
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
          {view === 'parsha' ? (
            <WeeklyParsha />
          ) : (
            <Reader chapter={chapter} loading={loading} error={error} />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
