interface StudyHelpProps {
  version: string
  reference: string
  originalLanguage: 'Hebrew' | 'Greek'
  compareKjv?: boolean
}

export function StudyHelp({ version, reference, originalLanguage, compareKjv = false }: StudyHelpProps) {
  return (
    <div className="study-help">
      <p>English: {version}</p>
      <p>Tap an underlined {originalLanguage} word to study its meaning, or choose “Show interlinear” for a word-by-word view. Transliteration is a simplified pronunciation guide.</p>
      {compareKjv && <p>
        <a href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=KJV`} target="_blank" rel="noopener noreferrer">Compare in KJV ↗</a>
        {' '}Hebrew and KJV chapter and verse numbering may differ.
      </p>}
    </div>
  )
}
