interface TextCreditProps {
  source: 'sefaria' | 'kjv' | 'bible-api'
  translation?: string
}

export function TextCredit({ source, translation }: TextCreditProps) {
  if (source !== 'sefaria') {
    return (
      <p className="sefaria-credit">
        {translation ?? 'King James Version'} text via{' '}
        <a href="https://bible-api.com" target="_blank" rel="noopener noreferrer">
          bible-api.com
        </a>
      </p>
    )
  }

  return (
    <p className="sefaria-credit">
      Hebrew and English text courtesy of{' '}
      <a href="https://www.sefaria.org" target="_blank" rel="noopener noreferrer">
        Sefaria.org
      </a>
    </p>
  )
}
