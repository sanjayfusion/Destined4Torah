const CONSONANTS: Record<string, string> = {
  א: '',
  ב: 'v',
  ג: 'g',
  ד: 'd',
  ה: 'h',
  ו: 'v',
  ז: 'z',
  ח: 'ch',
  ט: 't',
  י: 'y',
  כ: 'kh',
  ך: 'kh',
  ל: 'l',
  מ: 'm',
  ם: 'm',
  נ: 'n',
  ן: 'n',
  ס: 's',
  ע: '',
  פ: 'f',
  ף: 'f',
  צ: 'tz',
  ץ: 'tz',
  ק: 'k',
  ר: 'r',
  ש: 'sh',
  ת: 't',
}

// Begadkefat letters that harden with a dagesh (ת/ג/ד sound the same either way
// in modern pronunciation, so they're not listed here).
const DAGESH_OVERRIDE: Record<string, string> = {
  ב: 'b',
  כ: 'k',
  ך: 'k',
  פ: 'p',
  ף: 'p',
}

const NIQQUD_VOWELS: Record<string, string> = {
  'ֱ': 'e', // chataf segol
  'ֲ': 'a', // chataf patach
  'ֳ': 'o', // chataf kamatz
  'ִ': 'i', // chirik
  'ֵ': 'e', // tzere
  'ֶ': 'e', // segol
  'ַ': 'a', // patach
  'ָ': 'a', // kamatz
  'ֹ': 'o', // cholam
  'ֻ': 'u', // kubutz
  'ׇ': 'o', // kamatz katan
}

const SHEVA = 'ְ'
const DAGESH = 'ּ'
const SIN_DOT = 'ׂ'
const MAQAF = '־'
const MARKS_REGEX = /[֑-ׇ]/
const CONSONANT_REGEX = /[א-ת]/

function transliterateWord(word: string): string {
  const chars = [...word]
  let result = ''
  let i = 0

  while (i < chars.length) {
    const ch = chars[i]

    if (ch === MAQAF) {
      result += '-'
      i++
      continue
    }

    if (!CONSONANT_REGEX.test(ch)) {
      i++
      continue
    }

    const consonant = ch
    i++

    const marks: string[] = []
    while (i < chars.length && chars[i] !== MAQAF && MARKS_REGEX.test(chars[i])) {
      marks.push(chars[i])
      i++
    }

    const hasDagesh = marks.includes(DAGESH)
    const hasSinDot = marks.includes(SIN_DOT)
    const hasSheva = marks.includes(SHEVA)
    const vowelMark = marks.find((mark) => NIQQUD_VOWELS[mark] !== undefined)

    // Bare vav/yod right after a vowel we just wrote are usually a mater
    // lectionis (a silent letter marking a long vowel), not a new consonant.
    if ((consonant === 'י' || consonant === 'ו') && marks.length === 0 && result) {
      const lastChar = result[result.length - 1]
      if (consonant === 'י' && (lastChar === 'i' || lastChar === 'e')) continue
      if (consonant === 'ו' && (lastChar === 'o' || lastChar === 'u')) continue
    }

    // Vav carrying a cholam directly on it (וֹ) is the vowel "o", not "v" + "o".
    if (consonant === 'ו' && marks.includes('ֹ')) {
      result += 'o'
      continue
    }
    // Vav with a dagesh and no separate vowel is shuruk — the vowel "u".
    if (consonant === 'ו' && hasDagesh && !vowelMark) {
      result += 'u'
      continue
    }

    const isFirstConsonant = result === ''

    if (consonant === 'ש') {
      result += hasSinDot ? 's' : 'sh'
    } else if (hasDagesh && DAGESH_OVERRIDE[consonant]) {
      result += DAGESH_OVERRIDE[consonant]
    } else {
      result += CONSONANTS[consonant] ?? ''
    }

    if (vowelMark) {
      result += NIQQUD_VOWELS[vowelMark]
    } else if (hasSheva && isFirstConsonant) {
      // A sheva is usually silent, except it's typically voiced as a short
      // "e" when it's a word's very first vowel (e.g. "bereshit").
      result += 'e'
    }
  }

  return result
}

/** A simplified, readable transliteration — a pronunciation guide for study, not a scholarly-grade transcription. */
export function transliterateHebrew(text: string): string {
  return text
    .split(/(\s+)/)
    .map((part) => (/\s/.test(part) ? part : transliterateWord(part)))
    .join('')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

const GREEK_LETTERS: Record<string, string> = {
  α: 'a', β: 'b', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'ē', θ: 'th',
  ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p',
  ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'ph', χ: 'ch', ψ: 'ps', ω: 'ō',
}

// Classical vowel-pair diphthongs. Broken up by a diaeresis (dialytika) on
// the second vowel, which marks the letters as pronounced separately.
const GREEK_DIPHTHONGS: Record<string, string> = {
  αι: 'ai', ει: 'ei', οι: 'oi', υι: 'yi',
  αυ: 'au', ευ: 'eu', ηυ: 'ēu', ου: 'ou',
}

const ROUGH_BREATHING = '̔' // combining reversed comma above (dasia)
const DIAERESIS = '̈' // combining diaeresis (dialytika)
const GREEK_LETTER_REGEX = /[α-ωΑ-Ω]/
// Combining Diacritical Marks block — covers accents, breathing marks,
// iota subscript, and diaeresis once the text is NFD-decomposed.
const GREEK_MARK_REGEX = /[̀-ͯ]/

interface GreekLetterGroup {
  base: string
  marks: string[]
  end: number
}

function readGreekGroup(chars: string[], start: number): GreekLetterGroup | null {
  if (start >= chars.length || !GREEK_LETTER_REGEX.test(chars[start])) return null

  const base = chars[start].toLowerCase()
  let i = start + 1
  const marks: string[] = []
  while (i < chars.length && GREEK_MARK_REGEX.test(chars[i])) {
    marks.push(chars[i])
    i++
  }

  return { base, marks, end: i }
}

function transliterateGreekWord(word: string): string {
  const chars = [...word.normalize('NFD')]
  let result = ''
  let i = 0

  while (i < chars.length) {
    const first = readGreekGroup(chars, i)
    if (!first) {
      i++
      continue
    }

    const second = readGreekGroup(chars, first.end)
    const pair = second ? first.base + second.base : null
    const isDiphthong =
      pair !== null &&
      GREEK_DIPHTHONGS[pair] !== undefined &&
      !first.marks.includes(DIAERESIS) &&
      !second!.marks.includes(DIAERESIS)

    if (isDiphthong && second) {
      const hasRough = first.marks.includes(ROUGH_BREATHING) || second.marks.includes(ROUGH_BREATHING)
      result += (hasRough ? 'h' : '') + GREEK_DIPHTHONGS[pair!]
      i = second.end
      continue
    }

    const hasRough = first.marks.includes(ROUGH_BREATHING)
    const letter = GREEK_LETTERS[first.base]
    if (letter === undefined) {
      i = first.end
      continue
    }

    // Rho with rough breathing (ῥ) is conventionally "rh", not "hr".
    result += first.base === 'ρ' && hasRough ? 'rh' : (hasRough ? 'h' : '') + letter
    i = first.end
  }

  return result
}

/** A simplified, readable transliteration — a pronunciation guide for study, not a scholarly-grade transcription. */
export function transliterateGreek(text: string): string {
  return text
    .split(/(\s+)/)
    .map((part) => (/\s/.test(part) ? part : transliterateGreekWord(part)))
    .join('')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}
