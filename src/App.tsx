import { useEffect, useState } from 'react'
import { BookNav } from './components/BookNav'
import { Reader } from './components/Reader'
import { fetchChapter, type ChapterText } from './lib/sefaria'
import './App.css'

function App() {
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [chapter, setChapter] = useState<ChapterText | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
  }, [selectedBook, selectedChapter])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Destined4Torah</h1>
        <p>A simple space to learn the Five Books of Moses, in Hebrew and English.</p>
      </header>

      <div className="app-body">
        <BookNav
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          onSelect={(book, chap) => {
            setSelectedBook(book)
            setSelectedChapter(chap)
          }}
        />
        <main className="app-main">
          <Reader chapter={chapter} loading={loading} error={error} />
        </main>
      </div>
    </div>
  )
}

export default App
