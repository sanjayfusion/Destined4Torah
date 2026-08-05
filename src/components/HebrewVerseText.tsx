import { useState } from 'react'
import { tokenizeHebrewVerse } from '../lib/hebrewWords'

interface HebrewVerseTextProps {
  text: string
}

export function HebrewVerseText({ text }: HebrewVerseTextProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const tokens = tokenizeHebrewVerse(text)
  const active = activeIndex !== null ? tokens[activeIndex] : undefined

  return (
    <div className="verse-hebrew-wrap">
      <p className="verse-hebrew" dir="rtl">
        {tokens.map((token, i) =>
          token.entry ? (
            <button
              key={i}
              type="button"
              className="strongs-word"
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            >
              {token.text}
            </button>
          ) : (
            <span key={i}>{token.text}</span>
          ),
        )}
      </p>

      {active?.entry && (
        <div className="strongs-popover" dir="ltr">
          <button
            type="button"
            className="strongs-popover-close"
            onClick={() => setActiveIndex(null)}
            aria-label="Close"
          >
            &times;
          </button>
          <p className="strongs-popover-word" dir="rtl">{active.entry.hebrew}</p>
          <p className="strongs-popover-translit">
            {active.entry.transliteration} &middot; {active.entry.strongs}
          </p>
          <p className="strongs-popover-def">{active.entry.definition}</p>
        </div>
      )}
    </div>
  )
}
