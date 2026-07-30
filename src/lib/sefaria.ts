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
