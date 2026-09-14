import { useState, type FormEvent } from 'react'
import { parseReference } from '../lib/reference'

interface GoToVerseProps {
  onGo: (bookSlug: string, chapter: number, verse?: number) => void
}

export function GoToVerse({ onGo }: GoToVerseProps) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseReference(query)
    if (!parsed) {
      setError(true)
      return
    }
    setError(false)
    onGo(parsed.book.slug, parsed.chapter, parsed.verse)
  }

  return (
    <form className="go-to-verse" onSubmit={handleSubmit}>
      <input
        type="text"
        className="go-to-verse-input"
        placeholder="Go to reference, e.g. John 3:16"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setError(false)
        }}
        aria-label="Go to a Bible reference"
      />
      <button type="submit" className="go-to-verse-button">
        Go
      </button>
      {error && <p className="go-to-verse-error">Couldn't find that reference — try "Genesis 12:1" or "John 3:16".</p>}
    </form>
  )
}
