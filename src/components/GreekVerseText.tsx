import { useState } from 'react'
import { tokenizeGreekVerse } from '../lib/greekWords'
import { buildGreekInterlinear } from '../lib/interlinear'
import { transliterateGreek } from '../lib/transliterate'
import { findTokenIndexAtChar } from '../lib/wordHighlight'
import { VerseInterlinear } from './VerseInterlinear'

interface GreekVerseTextProps {
  text: string
  highlightCharIndex?: number | null
}

export function GreekVerseText({ text, highlightCharIndex = null }: GreekVerseTextProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const tokens = tokenizeGreekVerse(text)
  const active = activeIndex !== null ? tokens[activeIndex] : undefined
  const spokenIndex = findTokenIndexAtChar(tokens, highlightCharIndex)

  return (
    <div className="verse-greek-wrap">
      <p className="verse-greek">
        {tokens.map((token, i) => {
          const spokenClass = i === spokenIndex ? ' read-aloud-active' : ''
          return token.entry ? (
            <button
              key={i}
              type="button"
              className={`strongs-word${spokenClass}`}
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            >
              {token.text}
            </button>
          ) : (
            <span key={i} className={spokenClass || undefined}>
              {token.text}
            </span>
          )
        })}
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
