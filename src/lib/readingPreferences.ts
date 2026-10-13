export interface ReadingPreferences {
  size: number
  english: boolean
  original: boolean
  transliteration: boolean
}
export const defaults: ReadingPreferences = { size: 1, english: true, original: true, transliteration: true }
export const key = 'd4t.reading-preferences.v1'
export function parseReadingPreferences(value: string | null): ReadingPreferences {
  try {
    const v = JSON.parse(value ?? 'null')
    if (!v || ![1, 1.15, 1.3, 1.5].includes(v.size) || ['english','original','transliteration'].some(k => typeof v[k] !== 'boolean') || !(v.english || v.original || v.transliteration)) return defaults
    return { size: v.size, english: v.english, original: v.original, transliteration: v.transliteration }
  } catch { return defaults }
}
