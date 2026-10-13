import { createContext, useContext, useState, type ReactNode, type CSSProperties } from 'react'

import { defaults, key, parseReadingPreferences, type ReadingPreferences } from '../lib/readingPreferences'
const ReadingContext = createContext({ preferences: defaults, update: (_next: ReadingPreferences) => {} })
export function ReadingPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(() => {
    try { return parseReadingPreferences(localStorage.getItem(key)) } catch { return defaults }
  })
  function update(next: ReadingPreferences) {
    setPreferences(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* Controls still work without storage. */ }
  }
  return <ReadingContext.Provider value={{ preferences, update }}>
    <div className="reading-preferences" data-english={preferences.english} data-original={preferences.original} data-transliteration={preferences.transliteration} style={{ '--reading-scale': preferences.size } as CSSProperties}>{children}</div>
  </ReadingContext.Provider>
}
export function ReadingControls({ originalLanguage }: { originalLanguage: 'Hebrew' | 'Greek' }) {
  const { preferences, update } = useContext(ReadingContext)
  const visibleCount = [preferences.english, preferences.original, preferences.transliteration].filter(Boolean).length
  return <fieldset className="reading-controls">
    <legend>Reading controls</legend>
    <label>Text size <select value={preferences.size} onChange={e => update({ ...preferences, size: Number(e.target.value) })}>
      <option value={1}>Standard</option><option value={1.15}>Large</option><option value={1.3}>Larger</option><option value={1.5}>Largest</option>
    </select></label>
    {(['english','original','transliteration'] as const).map(field => <label key={field}>
      <input type="checkbox" checked={preferences[field]} disabled={preferences[field] && visibleCount === 1} onChange={e => update({ ...preferences, [field]: e.target.checked })} />
      {field === 'english' ? 'English' : field === 'original' ? originalLanguage : 'Transliteration'}
    </label>)}
    <small>Remembered on this device. Keep at least one text layer visible.</small>
  </fieldset>
}
