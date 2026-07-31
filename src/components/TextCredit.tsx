interface TextCreditProps {
  source: 'sefaria' | 'kjv'
}

export function TextCredit({ source }: TextCreditProps) {
  if (source === 'kjv') {
    return (
      <p className="sefaria-credit">
        King James Version text (public domain) via{' '}
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
