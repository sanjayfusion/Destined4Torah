import { STRONGS_HEBREW, type StrongsEntry } from '../data/strongsHebrew'

const HEBREW_MARKS_REGEX = /[֑-ׇ]/g
const NON_HEBREW_LETTER_REGEX = /[^א-ת]/g

export function stripToConsonants(word: string): string {
  return word.replace(HEBREW_MARKS_REGEX, '').replace(NON_HEBREW_LETTER_REGEX, '')
}

export function findStrongsMatch(word: string): StrongsEntry | undefined {
  const stripped = stripToConsonants(word)
  if (!stripped) return undefined

  if (STRONGS_HEBREW[stripped]) {
    return STRONGS_HEBREW[stripped]
  }

  // Hebrew prefixes (and, the, in, to, like, from, that/who) attach directly
  // to the front of a word with no space, so fall back to a suffix match.
  for (const key of Object.keys(STRONGS_HEBREW)) {
    if (stripped.length > key.length && stripped.endsWith(key)) {
      return STRONGS_HEBREW[key]
    }
  }

  return undefined
}

export interface HebrewToken {
  text: string
  entry?: StrongsEntry
}

export function tokenizeHebrewVerse(verse: string): HebrewToken[] {
  return verse
    .split(/(\s+)/)
    .filter((token) => token.length > 0)
    .map((token) => ({
      text: token,
      entry: /\s/.test(token) ? undefined : findStrongsMatch(token),
    }))
}
