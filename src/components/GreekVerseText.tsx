import { useState } from 'react'
import { tokenizeGreekVerse } from '../lib/greekWords'
import { buildGreekInterlinear } from '../lib/interlinear'
import { transliterateGreek } from '../lib/transliterate'
import { VerseInterlinear } from './VerseInterlinear'

interface GreekVerseTextProps {
  text: string
}

export function GreekVerseText({ text }: GreekVerseTextProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const tokens = tokenizeGreekVerse(text)
  const active = activeIndex !== null ? tokens[activeIndex] : undefined

  return (
    <div className="verse-greek-wrap">
      <p className="verse-greek">
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

      <p className="verse-translit">{transliterateGreek(text)}</p>

      {active?.entry && (
        <div className="strongs-popover">
          <button
            type="button"
            className="strongs-popover-close"
            onClick={() => setActiveIndex(null)}
            aria-label="Close"
          >
            &times;
          </button>
          <p className="strongs-popover-word">{active.entry.greek}</p>
          <p className="strongs-popover-translit">
            {active.entry.transliteration} &middot; {active.entry.strongs}
          </p>
          <p className="strongs-popover-def">{active.entry.definition}</p>
        </div>
      )}

      <VerseInterlinear rows={buildGreekInterlinear(text)} />
    </div>
  )
}
