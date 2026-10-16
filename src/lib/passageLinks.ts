import { parseReference } from './reference'
import { findParshaEntry, type ParshaListEntry } from '../data/parshiyot'

export type PassageRoute =
  | { view: 'book'; book: string; chapter: number; verse?: number }
  | { view: 'parsha'; parsha?: ParshaListEntry }
  | { view: 'about' | 'parshiyot-list' | 'subscribe' | 'tanakh' | 'new-testament' }

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
  if (view === 'about' || view === 'parshiyot-list' || view === 'subscribe' || view === 'tanakh' || view === 'new-testament') return { view }
  return { view: 'parsha' }
}

export function passageUrl(route: PassageRoute, base: string): string {
  const url = new URL(base)
  url.searchParams.delete('ref')
  url.searchParams.delete('parsha')
  url.searchParams.delete('view')
  url.hash = ''
  if (route.view === 'book') {
    url.searchParams.set('ref', `${route.book.replaceAll('_', ' ')} ${route.chapter}${route.verse === undefined ? '' : ':' + route.verse}`)
  } else if (route.view === 'parsha' && route.parsha) {
    url.searchParams.set('parsha', route.parsha.english)
  } else if (route.view !== 'parsha') {
    url.searchParams.set('view', route.view)
  }
  return url.href
}
