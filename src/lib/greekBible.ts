/**
 * Fetches the original Greek (Textus Receptus) text for a New Testament
 * chapter from bolls.life's free public API, keyed by the standard 1-66
 * book number. This is the least-verified integration in the app — unlike
 * Sefaria and bible-api.com, this endpoint's exact shape hasn't been
 * confirmed against a live response. Failures here are non-fatal: callers
 * should treat a rejected promise as "no Greek text available" and keep
 * showing the English KJV text on its own.
 */
export async function fetchGreekChapter(bookNumber: number, chapter: number): Promise<string[]> {
  const url = `https://bolls.life/get-text/TR/${bookNumber}/${chapter}/`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Greek text request failed (${response.status})`)
  }

  const data = await response.json()

  if (!Array.isArray(data)) {
    throw new Error('Unexpected Greek text response')
  }

  return data.map((verse: { text: string }) => verse.text.replace(/<[^>]*>/g, '').trim())
}
