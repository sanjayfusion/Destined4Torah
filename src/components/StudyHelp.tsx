interface StudyHelpProps {
  version: string
  originalLanguage: 'Hebrew' | 'Greek'
  compareTranslations?: boolean
}

export function StudyHelp({ version, originalLanguage, compareTranslations = false }: StudyHelpProps) {
  return (
    <div className="study-help">
      <p>English: {version}</p>
      <p>Tap an underlined {originalLanguage} word to study its meaning, or choose “Show interlinear” for a word-by-word view. Transliteration is a simplified pronunciation guide.</p>
      {compareTranslations && <p>
        Use “Compare English translations” above to compare this reading.
        {' '}Hebrew and KJV chapter and verse numbering may differ.
      </p>}
    </div>
  )
}
