import { tokenizeGreekVerse } from './greekWords'
import { tokenizeHebrewVerse } from './hebrewWords'
import { transliterateGreek, transliterateHebrew } from './transliterate'

export interface InterlinearRow {
  text: string
  transliteration: string
  strongs?: string
  definition?: string
}

const WHITESPACE_ONLY = /^\s+$/

/**
 * Word-by-word breakdown of a verse. Strong's number and definition are
 * only present for words in the curated dictionary (lib/hebrewWords.ts,
 * lib/greekWords.ts) — most words in any given verse won't match, since
 * that's a hand-picked set of significant words, not a full lexicon. This
 * intentionally doesn't include grammatical parsing (part of speech, case,
 * tense, etc.) since the app has no morphology data source for it.
 */
export function buildHebrewInterlinear(verse: string): InterlinearRow[] {
  return tokenizeHebrewVerse(verse)
    .filter((token) => !WHITESPACE_ONLY.test(token.text))
    .map((token) => ({
      text: token.text,
      transliteration: transliterateHebrew(token.text),
      strongs: token.entry?.strongs,
      definition: token.entry?.definition,
    }))
}

export function buildGreekInterlinear(verse: string): InterlinearRow[] {
  return tokenizeGreekVerse(verse)
    .filter((token) => !WHITESPACE_ONLY.test(token.text))
    .map((token) => ({
      text: token.text,
      transliteration: transliterateGreek(token.text),
      strongs: token.entry?.strongs,
      definition: token.entry?.definition,
    }))
}
