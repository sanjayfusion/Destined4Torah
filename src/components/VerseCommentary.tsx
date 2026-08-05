import { useState } from 'react'
import type { CommentaryEntry } from '../lib/commentary'

interface VerseCommentaryProps {
  entries: CommentaryEntry[]
}

export function VerseCommentary({ entries }: VerseCommentaryProps) {
  const [open, setOpen] = useState(false)

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="verse-commentary">
      <button type="button" className="verse-commentary-toggle" onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'Show'} commentary &middot; {entries.map((entry) => entry.commentator).join(', ')}
      </button>

      {open && (
        <div className="verse-commentary-body">
          {entries.map((entry) => (
            <div key={entry.commentator} className="verse-commentary-entry">
              <p className="verse-commentary-name">{entry.commentator}</p>
              {entry.texts.map((text, i) => (
                <p key={i} className="verse-commentary-text">{text}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
