import { useEffect, useState } from 'react'
import { ALL_BOOKS } from '../data/books'
import { fetchKjvChapter } from '../lib/bibleApi'
import { TextCredit } from './TextCredit'

import { kjvChapterCount } from '../lib/kjvNumbering'

export function KjvPanel({ book, chapter }: { book: string; chapter: number }) {
  const [open, setOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState(book)
  const [selectedChapter, setSelectedChapter] = useState(Math.min(chapter, kjvChapterCount(book)))
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    setSelectedBook(book)
    setSelectedChapter(Math.min(chapter, kjvChapterCount(book)))
    setOpen(false)
    setVerses([])
  }, [book, chapter])
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true); setError(false); setVerses([])
    fetchKjvChapter(selectedBook, selectedChapter).then(data => { if (!cancelled) setVerses(data) }).catch(() => { if (!cancelled) setError(true) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, selectedBook, selectedChapter, retry])
  return <section className="kjv-panel" aria-label="King James Version comparison">
    <button type="button" className="kjv-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide KJV' : 'Read KJV here'}</button>
    {open && <>
      <h3>King James Version</h3>
      <p className="kjv-hidden-message">English is hidden. Enable English in Reading controls to see the KJV text.</p>
      <p className="study-help">KJV uses its own chapter and verse numbers. This is a full chapter for comparison; verses are not automatically paired with the Hebrew reading. Use the selectors to find the corresponding passage, including an adjacent chapter when needed.</p>
      <div className="kjv-selectors">
        <label>KJV book <select value={selectedBook} onChange={e => { setSelectedBook(e.target.value); setSelectedChapter(1) }}>{ALL_BOOKS.map(b => <option key={b.slug} value={b.slug}>{b.english}</option>)}</select></label>
        <label>KJV chapter <select value={selectedChapter} onChange={e => setSelectedChapter(Number(e.target.value))}>{Array.from({length:kjvChapterCount(selectedBook)},(_,i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
      </div>
      {loading && <p role="status">Loading KJV…</p>}
      {error && <p role="alert">Could not load KJV. <button type="button" onClick={() => setRetry(retry+1)}>Try again</button></p>}
      {!loading && !error && <ol className="kjv-verses">{verses.map(v => <li key={v.verse}><span className="verse-number">{selectedChapter}:{v.verse}</span><p className="verse-english">{v.text}</p></li>)}</ol>}
      <TextCredit source="kjv" />
    </>}
  </section>
}
