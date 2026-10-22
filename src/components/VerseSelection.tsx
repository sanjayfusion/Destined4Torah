import { useEffect, useState } from 'react'
import { passageUrl } from '../lib/passageLinks'

export interface SelectableVerse {
  chapter: number
  verse: number
  english: string
  hebrew?: string
  greek?: string
}

interface VerseNumberButtonProps {
  label: string
  selected: boolean
  onClick: () => void
}

export function VerseNumberButton({ label, selected, onClick }: VerseNumberButtonProps) {
  return (
    <button
      type="button"
      className="verse-number verse-number-button"
      aria-pressed={selected}
      aria-label={`Select verse ${label}`}
      title="Select this verse to copy. Tap another verse number to select a range."
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function formatVerseRange(book: string, first: SelectableVerse, last: SelectableVerse): string {
  const start = `${book} ${first.chapter}:${first.verse}`
  if (first.chapter === last.chapter && first.verse === last.verse) return start
  return first.chapter === last.chapter ? `${start}-${last.verse}` : `${start}-${last.chapter}:${last.verse}`
}

interface VerseSelectionBarProps {
  /** Display name of the book, e.g. "Genesis". */
  book: string
  /** Book slug used for shareable links. */
  bookSlug: string
  translation: string
  verses: SelectableVerse[]
  range: { start: number; end: number } | null
  onClear: () => void
}

type CopyMode = 'english' | 'original' | 'link'

export function VerseSelectionBar({ book, bookSlug, translation, verses, range, onClear }: VerseSelectionBarProps) {
  const [status, setStatus] = useState('')
  const [fallback, setFallback] = useState('')

  const rangeKey = range ? `${range.start}-${range.end}` : ''
  useEffect(() => { setStatus(''); setFallback('') }, [rangeKey])

  useEffect(() => {
    if (!range) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClear() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [range, onClear])

  if (!range) return null

  const selected = verses.slice(range.start, range.end + 1)
  const first = selected[0]
  const last = selected[selected.length - 1]
  if (!first || !last) return null

  const reference = formatVerseRange(book, first, last)
  const crossesChapters = first.chapter !== last.chapter
  const hasHebrew = selected.some((v) => v.hebrew)
  const hasGreek = selected.some((v) => v.greek)
  const url = passageUrl({ view: 'book', book: bookSlug, chapter: first.chapter, verse: first.verse }, window.location.href)

  function textFor(mode: CopyMode): string {
    if (mode === 'link') return url
    const lines = selected.map((v) => {
      const number = crossesChapters ? `${v.chapter}:${v.verse}` : `${v.verse}`
      const original = mode === 'original' ? [v.hebrew, v.greek].filter(Boolean).join('\n') : ''
      return original ? `${number} ${original}\n${v.english}` : `${number} ${v.english}`
    })
    return [`${reference} (${translation})`, ...lines, url].join(mode === 'original' ? '\n\n' : '\n')
  }

  async function copy(mode: CopyMode) {
    const text = textFor(mode)
    try {
      await navigator.clipboard.writeText(text)
      setStatus(mode === 'link' ? 'Link copied' : `${reference} copied`)
      setFallback('')
    } catch {
      setStatus('Select and copy the text below')
      setFallback(text)
    }
  }

  return (
    <div className="verse-select-bar" role="region" aria-label="Selected verses">
      <div className="verse-select-summary">
        <strong>{reference}</strong>
        <span className="verse-select-hint">
          {selected.length === 1 ? 'Tap another verse number to select a range' : `${selected.length} verses selected`}
        </span>
      </div>
      <button type="button" className="verse-select-clear" aria-label="Clear selection" onClick={onClear}>&times;</button>
      <div className="verse-select-actions">
        <button type="button" onClick={() => copy('english')}>Copy</button>
        {(hasHebrew || hasGreek) && (
          <button type="button" onClick={() => copy('original')}>Copy with {hasHebrew ? 'Hebrew' : 'Greek'}</button>
        )}
        <button type="button" onClick={() => copy('link')}>Copy link</button>
      </div>
      <span role="status" className="verse-select-status">{status}</span>
      {fallback && (
        <textarea aria-label="Selected verses text" readOnly value={fallback} rows={4} onFocus={(event) => event.currentTarget.select()} />
      )}
    </div>
  )
}
