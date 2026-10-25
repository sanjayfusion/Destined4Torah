import { ALIYOT_BY_PARSHA_REF } from '../data/aliyot'

export interface ChapterText {
  ref: string
  heRef: string
  english: string[]
  hebrew: string[]
  greek?: string[]
  englishVersion?: string
}

export function stripTags(value: string): string {
  const doc = new DOMParser().parseFromString(value, 'text/html')
  doc.querySelectorAll('sup, .footnote, .footnote-marker, .footnoteAnchor').forEach((element) => element.remove())
  doc.querySelectorAll('br').forEach((element) => element.replaceWith(' '))
  doc.querySelectorAll('p, div, li').forEach((element) => element.append(' '))
  return (doc.body.textContent ?? '')
    .replace(/[\u200e\u200f]/g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const JPS_1917_VERSION = 'The Holy Scriptures: A New Translation (JPS 1917)'

export async function fetchChapter(bookSlug: string, chapter: number): Promise<ChapterText> {
  const url = `https://www.sefaria.org/api/texts/${bookSlug}.${chapter}?context=0&commentary=0&ven=${encodeURIComponent(JPS_1917_VERSION)}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Sefaria request failed (${response.status})`)
  }

  const data = await response.json()
  if (data.error || data.versionTitle !== JPS_1917_VERSION) {
    throw new Error('The requested JPS 1917 translation is not available for this chapter.')
  }

  const english: string[] = Array.isArray(data.text) ? data.text : [data.text].filter(Boolean)
  const hebrew: string[] = Array.isArray(data.he) ? data.he : [data.he].filter(Boolean)

  return {
    ref: data.ref ?? `${bookSlug} ${chapter}`,
    heRef: data.heRef ?? '',
    englishVersion: 'JPS 1917 (traditional translation)',
    english: english.map(stripTags),
    hebrew: hebrew.map(stripTags),
  }
}

interface ParshaRange {
  book: string
  startChapter: number
  startVerse: number
  endChapter: number
  endVerse: number
}

export function parseParshaRef(ref: string): ParshaRange {
  const crossChapter = ref.match(/^([A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)-(\d+):(\d+)$/)
  if (crossChapter) {
    const [, book, startChapter, startVerse, endChapter, endVerse] = crossChapter
    return {
      book,
      startChapter: Number(startChapter),
      startVerse: Number(startVerse),
      endChapter: Number(endChapter),
      endVerse: Number(endVerse),
    }
  }

  const sameChapter = ref.match(/^([A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)-(\d+)$/)
  if (sameChapter) {
    const [, book, chapter, startVerse, endVerse] = sameChapter
    return {
      book,
      startChapter: Number(chapter),
      startVerse: Number(startVerse),
      endChapter: Number(chapter),
      endVerse: Number(endVerse),
    }
  }

  const singleVerse = ref.match(/^([A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)$/)
  if (singleVerse) {
    const [, book, chapter, verse] = singleVerse
    return { book, startChapter: Number(chapter), startVerse: Number(verse), endChapter: Number(chapter), endVerse: Number(verse) }
  }

  throw new Error(`Unrecognized parsha reference: ${ref}`)
}

export interface ParshaSection {
  chapter: number
  startVerse: number
  hebrew: string[]
  english: string[]
  englishVersion?: string
}

function refToUrlSlug(ref: string): string {
  const match = ref.match(/^([A-Za-z]+)\s+(.+)$/)
  if (!match) return ref
  const [, book, rest] = match
  return `${book}.${rest.replace(/:/g, '.')}`
}

/** Narrows a portion's sections to the verses of one aliyah ref, e.g. "Genesis 12:14-13:4". */
export function sectionsForRef(sections: ParshaSection[], ref: string): ParshaSection[] {
  const range = parseParshaRef(ref)
  const start = range.startChapter * 1000 + range.startVerse
  const end = range.endChapter * 1000 + range.endVerse
  return sections
    .map((section) => {
      const keep = section.hebrew.map((_, i) => {
        const position = section.chapter * 1000 + section.startVerse + i
        return position >= start && position <= end
      })
      const first = keep.indexOf(true)
      const last = keep.lastIndexOf(true)
      return {
        ...section,
        startVerse: section.startVerse + first,
        hebrew: section.hebrew.slice(first, last + 1),
        english: section.english.slice(first, last + 1),
      }
    })
    .filter((section) => section.hebrew.length > 0)
}

export interface ParshaInfo {
  englishName: string
  hebrewName: string
  ref: string
  url: string
  /** The seven aliyah refs, e.g. "Genesis 12:14-13:4". Empty when unknown. */
  aliyot: string[]
  /** This week's haftarah ref(s), e.g. ["Isaiah 40:27-41:16"]. Empty when unknown. */
  haftarah: string[]
}

/**
 * Splits a haftarah ref that may list several passages, e.g.
 * "Isaiah 66:1-24, 66:23", into full refs ("Isaiah 66:1-24", "Isaiah 66:23").
 */
export function splitHaftarahRef(ref: string): string[] {
  let book = ''
  return ref.split(/[;,]\s*/).map((part) => part.trim()).filter(Boolean).map((part) => {
    const named = part.match(/^([A-Za-z][A-Za-z ]*?)\s+\d/)
    if (named) {
      book = named[1]
      return part
    }
    return `${book} ${part}`
  })
}

/** Just the current parsha's name/ref — no verse text. Cheap to call often. */
export async function fetchParshaInfo(): Promise<ParshaInfo> {
  const response = await fetch('https://www.sefaria.org/api/calendars')

  if (!response.ok) {
    throw new Error(`Sefaria request failed (${response.status})`)
  }

  const data = await response.json()
  const item = (data.calendar_items ?? []).find(
    (candidate: { title?: { en?: string } }) => candidate.title?.en === 'Parashat Hashavua',
  )

  if (!item) {
    throw new Error('Could not find this week\'s parsha')
  }

  const haftarahItems = (data.calendar_items ?? []).filter(
    (candidate: { title?: { en?: string }; ref?: string }) => candidate.title?.en === 'Haftarah' && candidate.ref,
  )

  return {
    haftarah: haftarahItems.flatMap((haftarah: { ref: string }) => splitHaftarahRef(haftarah.ref)),
    englishName: item.displayValue?.en ?? item.ref,
    hebrewName: item.displayValue?.he ?? '',
    ref: item.ref,
    url: item.url ?? refToUrlSlug(item.ref),
    // Sefaria lists maftir as an eighth entry; only the seven aliyot are shown.
    aliyot: Array.isArray(item.extraDetails?.aliyot) ? item.extraDetails.aliyot.slice(0, 7) : [],
  }
}

export interface WeeklyParsha extends ParshaInfo {
  sections: ParshaSection[]
}

interface NamedParshaRef {
  englishName: string
  hebrewName: string
  ref: string
  aliyot?: string[]
  haftarah?: string[]
}

/** Fetches the verses of one passage ref (any Tanakh book), one section per chapter. */
export async function fetchRefSections(ref: string): Promise<ParshaSection[]> {
  const range = parseParshaRef(ref)
  const bookSlug = range.book.replace(/ /g, '_')
  const chapterNumbers = Array.from(
    { length: range.endChapter - range.startChapter + 1 },
    (_, i) => range.startChapter + i,
  )

  const chapters = await Promise.all(chapterNumbers.map((chapter) => fetchChapter(bookSlug, chapter)))

  return chapters.map((text, i) => {
    const chapterNumber = chapterNumbers[i]
    const isFirst = chapterNumber === range.startChapter
    const isLast = chapterNumber === range.endChapter
    const sliceStart = isFirst ? range.startVerse - 1 : 0
    const sliceEnd = isLast ? range.endVerse : Math.max(text.english.length, text.hebrew.length)

    return {
      chapter: chapterNumber,
      startVerse: sliceStart + 1,
      hebrew: text.hebrew.slice(sliceStart, sliceEnd),
      english: text.english.slice(sliceStart, sliceEnd),
      englishVersion: text.englishVersion,
    }
  })
}

/** Fetches the full text for any named parsha (not just the current week's). */
export async function fetchParshaByRef(entry: NamedParshaRef): Promise<WeeklyParsha> {
  const sections = await fetchRefSections(entry.ref)

  return {
    englishName: entry.englishName,
    hebrewName: entry.hebrewName,
    ref: entry.ref,
    url: refToUrlSlug(entry.ref),
    aliyot: entry.aliyot?.length ? entry.aliyot : ALIYOT_BY_PARSHA_REF[entry.ref] ?? [],
    haftarah: entry.haftarah ?? [],
    sections,
  }
}

export async function fetchWeeklyParsha(): Promise<WeeklyParsha> {
  const info = await fetchParshaInfo()
  return fetchParshaByRef({ englishName: info.englishName, hebrewName: info.hebrewName, ref: info.ref, aliyot: info.aliyot, haftarah: info.haftarah })
}
