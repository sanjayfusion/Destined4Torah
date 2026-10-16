import { parseReference } from './reference'
import { findParshaEntry, PARSHIYOT_BY_BOOK, type ParshaListEntry } from '../data/parshiyot'

export type PassageRoute =
  | { view: 'book'; book: string; chapter: number; verse?: number }
  | { view: 'parsha'; parsha?: ParshaListEntry }
  | { view: 'parshiyot-list'; book?: string }
  | { view: 'about' | 'subscribe' | 'tanakh' | 'new-testament' }

/** Query URLs work on static hosting without server rewrites. */
export function readPassageRoute(search: string): PassageRoute {
  const params = new URLSearchParams(search)
  const ref = params.get('ref')
  if (ref) {
    const parsed = parseReference(ref)
    if (parsed && (parsed.verse === undefined || Number.isSafeInteger(parsed.verse))) {
      return { view: 'book', book: parsed.book.slug, chapter: parsed.chapter, verse: parsed.verse }
    }
  }
  const parsha = findParshaEntry(params.get('parsha') ?? '')
  if (parsha) return { view: 'parsha', parsha }
  const view = params.get('view')
  if (view === 'parshiyot-list') {
    const book = PARSHIYOT_BY_BOOK.find((group) => group.book === params.get('book'))?.book
    return book ? { view, book } : { view }
  }
  if (view === 'about' || view === 'subscribe' || view === 'tanakh' || view === 'new-testament') return { view }
  return { view: 'parsha' }
}

export function passageUrl(route: PassageRoute, base: string): string {
  const url = new URL(base)
  url.searchParams.delete('ref')
  url.searchParams.delete('parsha')
  url.searchParams.delete('view')
  url.searchParams.delete('book')
  url.hash = ''
  if (route.view === 'book') {
    url.searchParams.set('ref', `${route.book.replaceAll('_', ' ')} ${route.chapter}${route.verse === undefined ? '' : ':' + route.verse}`)
  } else if (route.view === 'parsha' && route.parsha) {
    url.searchParams.set('parsha', route.parsha.english)
  } else if (route.view !== 'parsha') {
    url.searchParams.set('view', route.view)
    if (route.view === 'parshiyot-list' && route.book) url.searchParams.set('book', route.book)
  }
  return url.href
}
