import { passageUrl, readPassageRoute, type PassageRoute } from './passageLinks'

export const STUDY_PROGRESS_KEY = 'd4t.study-progress.v1'
export type SavedPassage = Extract<PassageRoute, { view: 'book' | 'parsha' }>
type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>

export function loadStudyProgress(storage: ProgressStorage): SavedPassage | null {
  try {
    const raw = storage.getItem(STUDY_PROGRESS_KEY)
    if (!raw || raw.length > 2000) return null
    const data = JSON.parse(raw)
    if (data.version !== 1 || typeof data.search !== 'string') return null
    const route = readPassageRoute(data.search)
    if (route.view === 'book' || (route.view === 'parsha' && route.parsha)) return route
  } catch { /* Storage can be disabled or contain an older, malformed value. */ }
  return null
}

export function saveStudyProgress(route: PassageRoute, storage: ProgressStorage): boolean {
  if (route.view !== 'book' && !(route.view === 'parsha' && route.parsha)) return false
  try {
    const search = new URL(passageUrl(route, 'https://app.destined4torah.com/')).search
    storage.setItem(STUDY_PROGRESS_KEY, JSON.stringify({ version: 1, search }))
    return true
  } catch { return false }
}

export function initialStudyRoute(search: string, saved: SavedPassage | null): PassageRoute {
  const params = new URLSearchParams(search)
  // Explicit links always take precedence, including invalid ones (normal fallback).
  if (['ref', 'parsha', 'view'].some((key) => params.has(key))) return readPassageRoute(search)
  return saved ?? { view: 'parsha' }
}

export function savedPassageLabel(route: SavedPassage): string {
  return route.view === 'book'
    ? `${route.book.replaceAll('_', ' ')} ${route.chapter}${route.verse === undefined ? '' : ':' + route.verse}`
    : route.parsha?.english ?? 'Torah portion'
}
