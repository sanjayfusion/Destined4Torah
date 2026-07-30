export interface ChapterText {
  ref: string
  heRef: string
  english: string[]
  hebrew: string[]
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim()
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

export interface WeeklyParsha {
  englishName: string
  hebrewName: string
  ref: string
  sections: ParshaSection[]
}

export async function fetchWeeklyParsha(): Promise<WeeklyParsha> {
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

  const range = parseParshaRef(item.ref)
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

  return {
    englishName: item.displayValue?.en ?? item.ref,
    hebrewName: item.displayValue?.he ?? '',
    ref: item.ref,
    sections,
  }
}
