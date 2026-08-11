export interface ChapterText {
  ref: string
  heRef: string
  english: string[]
  hebrew: string[]
  greek?: string[]
}

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&thinsp;': ' ',
  '&ensp;': ' ',
  '&emsp;': ' ',
  '&rlm;': '',
  '&lrm;': '',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
}

export function stripTags(value: string): string {
  return value
    // Footnote markers/bodies: drop the whole element, not just the tag,
    // since their text isn't meant to sit inline with the verse.
    .replace(/<sup\b[^>]*>.*?<\/sup>/gis, '')
    .replace(/<i\b[^>]*>.*?<\/i>/gis, '')
    // Any other formatting tags: keep the inner text, drop the tag.
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;|&#\d+;/gi, (entity) => HTML_ENTITIES[entity.toLowerCase()] ?? '')
    // Sefaria's open/closed-section markers (e.g. {פ} {ס}) in the Hebrew text.
    .replace(/\{[^}]*\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function fetchChapter(bookSlug: string, chapter: number): Promise<ChapterText> {
  const url = `https://www.sefaria.org/api/texts/${bookSlug}.${chapter}?context=0&commentary=0`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Sefaria request failed (${response.status})`)
  }

  const data = await response.json()

  const english: string[] = Array.isArray(data.text) ? data.text : [data.text].filter(Boolean)
  const hebrew: string[] = Array.isArray(data.he) ? data.he : [data.he].filter(Boolean)

  return {
    ref: data.ref ?? `${bookSlug} ${chapter}`,
    heRef: data.heRef ?? '',
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

function parseParshaRef(ref: string): ParshaRange {
  const crossChapter = ref.match(/^([A-Za-z]+)\s+(\d+):(\d+)-(\d+):(\d+)$/)
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

  const sameChapter = ref.match(/^([A-Za-z]+)\s+(\d+):(\d+)-(\d+)$/)
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

  throw new Error(`Unrecognized parsha reference: ${ref}`)
}

export interface ParshaSection {
  chapter: number
  startVerse: number
  hebrew: string[]
  english: string[]
}

function refToUrlSlug(ref: string): string {
  const match = ref.match(/^([A-Za-z]+)\s+(.+)$/)
  if (!match) return ref
  const [, book, rest] = match
  return `${book}.${rest.replace(/:/g, '.')}`
}

export interface ParshaInfo {
  englishName: string
  hebrewName: string
  ref: string
  url: string
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

  return {
    englishName: item.displayValue?.en ?? item.ref,
    hebrewName: item.displayValue?.he ?? '',
    ref: item.ref,
    url: item.url ?? refToUrlSlug(item.ref),
  }
}

export interface WeeklyParsha extends ParshaInfo {
  sections: ParshaSection[]
}

export async function fetchWeeklyParsha(): Promise<WeeklyParsha> {
  const info = await fetchParshaInfo()
  const range = parseParshaRef(info.ref)
  const chapterNumbers = Array.from(
    { length: range.endChapter - range.startChapter + 1 },
    (_, i) => range.startChapter + i,
  )

  const chapters = await Promise.all(chapterNumbers.map((chapter) => fetchChapter(range.book, chapter)))

  const sections: ParshaSection[] = chapters.map((text, i) => {
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
    }
  })

  return { ...info, sections }
}
