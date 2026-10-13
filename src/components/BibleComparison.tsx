import { ENGLISH_TRANSLATIONS, translationAvailable, type EnglishTranslationId } from '../data/englishTranslations'
import { useEffect, useState } from 'react'
import { ALL_BOOKS } from '../data/books'
import { fetchBibleTranslationChapter } from '../lib/bibleApi'
import { TextCredit } from './TextCredit'

import { kjvChapterCount } from '../lib/kjvNumbering'

export function BibleComparison({ book, chapter }: { book: string; chapter: number }) {
  const [open, setOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState(book)
  const [selectedChapter, setSelectedChapter] = useState(Math.min(chapter, kjvChapterCount(book)))
  const [translation, setTranslation] = useState<EnglishTranslationId>('kjv')
  const selectedTranslation = ENGLISH_TRANSLATIONS.find(t => t.id === translation)!
  const testament = ALL_BOOKS.find(b => b.slug === selectedBook)?.testament ?? 'old'
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    setTranslation('kjv')
    setSelectedBook(book)
    setSelectedChapter(Math.min(chapter, kjvChapterCount(book)))
    setOpen(false)
    setVerses([])
  }, [book, chapter])
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true); setError(false); setVerses([])
    fetchBibleTranslationChapter(selectedBook, selectedChapter, translation).then(data => { if (!cancelled) setVerses(data) }).catch(() => { if (!cancelled) setError(true) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, selectedBook, selectedChapter, translation, retry])
  return <section className="kjv-panel" aria-label="English translation comparison">
    <button type="button" className="kjv-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide comparison' : 'Compare English translations'}</button>
    {open && <>
      <h3>{selectedTranslation.name}</h3>
      <p className="kjv-hidden-message">English is hidden. Enable English in Reading controls to see the comparison text.</p>
      <p className="study-help">Each translation uses its own chapter and verse numbers; these may differ from the Hebrew and from other English editions. This is a full chapter for comparison; verses are not automatically paired with the Hebrew reading. Use the selectors to find the corresponding passage, including an adjacent chapter when needed.</p>
      <div className="kjv-selectors">
        <label>Translation <select value={translation} onChange={e => setTranslation(e.target.value as EnglishTranslationId)}>{ENGLISH_TRANSLATIONS.map(t => <option key={t.id} value={t.id} disabled={!translationAvailable(t.id, testament)}>{t.name}</option>)}</select></label>
        <label>Comparison book <select value={selectedBook} onChange={e => { setSelectedBook(e.target.value); setSelectedChapter(1); if (!translationAvailable(translation, ALL_BOOKS.find(b => b.slug === e.target.value)?.testament ?? 'old')) setTranslation('kjv') }}>{ALL_BOOKS.map(b => <option key={b.slug} value={b.slug}>{b.english}</option>)}</select></label>
        <label>Comparison chapter <select value={selectedChapter} onChange={e => setSelectedChapter(Number(e.target.value))}>{Array.from({length:kjvChapterCount(selectedBook)},(_,i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
      </div>
      {loading && <p role="status">Loading translation…</p>}
      {error && <p role="alert">Could not load this translation. <button type="button" onClick={() => setRetry(retry+1)}>Try again</button></p>}
      {!loading && !error && <ol className="kjv-verses">{verses.map(v => <li key={v.verse}><span className="verse-number">{selectedChapter}:{v.verse}</span><p className="verse-english">{v.text}</p></li>)}</ol>}
      <TextCredit source="bible-api" translation={selectedTranslation.name} />
    </>}
  </section>
}
