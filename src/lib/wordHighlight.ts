/**
 * Maps a character offset within a verse's raw text (as reported by the
 * Web Speech API's onboundary event) to the index of the token that
 * contains it. Tokens must have been produced by splitting that exact same
 * text (tokenizeHebrewVerse / tokenizeGreekVerse), so their lengths sum
 * back up to the original string and the offsets line up.
 */
export function findTokenIndexAtChar(tokens: { text: string }[], charIndex: number | null): number | null {
  if (charIndex === null) return null

  let offset = 0
  for (let i = 0; i < tokens.length; i++) {
    const length = tokens[i].text.length
    if (charIndex >= offset && charIndex < offset + length) {
      return /\S/.test(tokens[i].text) ? i : null
    }
    offset += length
  }

  return null
}
