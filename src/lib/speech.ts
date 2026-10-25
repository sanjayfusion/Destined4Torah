// Cantillation (te'amim), meteg, paseq, sof pasuq and nun hafukha. Speech
// voices don't need them and some read them oddly, so they are stripped.
const SPEECH_MARKS_REGEX = /[֑-ֽ֯׀׃׆]/g
// Disjunctive accents where a reader naturally pauses: etnachta, segol,
// shalshelet, zakef katan/gadol, tipcha and revia.
const HEBREW_PAUSE_REGEX = /[֑-֗]/
const PUNCTUATION_PAUSE_REGEX = /[,.;:·׃]$/
const HEBREW_VOWEL_REGEX = /[ֱ-ׇֻ]|וּ/g
const GREEK_VOWEL_REGEX = /[αεηιουω]+/g

export interface SpeechWord {
  /** Offset of the word in the original verse text (for highlighting). */
  start: number
  /** Offset of the word in the chunk's spoken text (for boundary events). */
  spokenStart: number
  /** Rough syllable count, used to estimate timing when the voice gives none. */
  syllables: number
}

export interface SpeechChunk {
  text: string
  words: SpeechWord[]
}

function countSyllables(word: string): number {
  const hebrew = word.match(HEBREW_VOWEL_REGEX)?.length ?? 0
  if (hebrew) return hebrew
  const greek = word.normalize('NFD').toLowerCase().match(GREEK_VOWEL_REGEX)?.length ?? 0
  return Math.max(1, greek)
}

/**
 * Splits a verse into short phrases at its natural pauses (Hebrew
 * disjunctive accents or punctuation), cleaned for a speech voice. Speaking
 * phrase by phrase sounds measured and lets word highlighting resync at the
 * start of every phrase instead of drifting across a whole verse.
 */
export function speechChunks(verse: string): SpeechChunk[] {
  const chunks: SpeechChunk[] = []
  let current: SpeechChunk = { text: '', words: [] }
  const regex = /[^\s־]+/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(verse))) {
    const raw = match[0]
    const spoken = raw.replace(SPEECH_MARKS_REGEX, '')
    if (!/\p{L}/u.test(spoken)) continue

    if (current.text) current.text += ' '
    current.words.push({ start: match.index, spokenStart: current.text.length, syllables: countSyllables(spoken) })
    current.text += spoken

    if (HEBREW_PAUSE_REGEX.test(raw) || PUNCTUATION_PAUSE_REGEX.test(raw)) {
      chunks.push(current)
      current = { text: '', words: [] }
    }
  }

  if (current.words.length) chunks.push(current)
  return chunks
}

/**
 * Splits phrase chunks into one chunk per word. Each word then starts its own
 * utterance, so the highlight follows the voice exactly even when the voice
 * reports no word timing (as with iPhone Hebrew voices).
 */
export function wordChunks(chunks: SpeechChunk[]): SpeechChunk[] {
  return chunks.flatMap((chunk) =>
    chunk.words.map((word, i) => ({
      text: chunk.text.slice(word.spokenStart, chunk.words[i + 1]?.spokenStart ?? chunk.text.length).trim(),
      words: [{ ...word, spokenStart: 0 }],
    })),
  )
}

/** The word a boundary event's character offset (within the chunk's spoken text) falls in. */
export function wordAtSpokenChar(chunk: SpeechChunk, charIndex: number): SpeechWord | undefined {
  let found: SpeechWord | undefined
  for (const word of chunk.words) {
    if (word.spokenStart > charIndex) break
    found = word
  }
  return found
}
