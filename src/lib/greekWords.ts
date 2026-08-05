import { STRONGS_GREEK, type GreekStrongsEntry } from '../data/strongsGreek'

const GREEK_DIACRITICS_REGEX = /[̀-ͯ᾽-῿]/g
const NON_GREEK_LETTER_REGEX = /[^a-zα-ω]/gi

function normalize(word: string): string {
  return word
    .normalize('NFD')
    .replace(GREEK_DIACRITICS_REGEX, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(NON_GREEK_LETTER_REGEX, '')
}

const DICTIONARY_KEYS = Object.keys(STRONGS_GREEK).sort((a, b) => b.length - a.length)

export function findGreekStrongsMatch(word: string): GreekStrongsEntry | undefined {
  const stripped = normalize(word)
  if (!stripped) return undefined

  // Greek declension changes word endings, not beginnings, so match on the
  // stem: the longest dictionary key that the word starts with.
  for (const key of DICTIONARY_KEYS) {
    if (stripped.startsWith(key)) {
      return STRONGS_GREEK[key]
    }
  }

  return undefined
}

export interface GreekToken {
  text: string
  entry?: GreekStrongsEntry
}

export function tokenizeGreekVerse(verse: string): GreekToken[] {
  return verse
    .split(/(\s+)/)
    .filter((token) => token.length > 0)
    .map((token) => ({
      text: token,
      entry: /\s/.test(token) ? undefined : findGreekStrongsMatch(token),
    }))
}
