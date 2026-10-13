export function dictionarySourceUrl(strongs: string) {
  const language = strongs.startsWith('H') ? 'hebrew' : 'greek'
  return `https://github.com/openscriptures/strongs/blob/master/${language}/strongs-${language}-dictionary.js`
}

