import { useState } from 'react'
import type { CommentaryEntry } from '../lib/commentary'

interface VerseCommentaryProps {
  entries: CommentaryEntry[]
}

export function VerseCommentary({ entries }: VerseCommentaryProps) {
  const targums = entries.filter((entry) => entry.targum)
  const commentaries = entries.filter((entry) => !entry.targum)

  return (
    <>
      <CommentarySection label="Aramaic Targum" entries={targums} />
      <CommentarySection label="commentary" entries={commentaries} />
    </>
  )
}

function CommentarySection({ label, entries }: { label: string; entries: CommentaryEntry[] }) {
  const [open, setOpen] = useState(false)

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="verse-commentary">
      <button type="button" className="verse-commentary-toggle" onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'Show'} {label} &middot; {entries.map((entry) => entry.commentator.replace(/^Targum (?=\S)/, '')).join(', ')}
      </button>

      {open && (
        <div className="verse-commentary-body">
          {entries.map((entry) => (
            <div key={entry.commentator} className="verse-commentary-entry">
              <p className="verse-commentary-name">{entry.commentator}</p>
              {entry.aramaic?.map((text, i) => (
                <p key={`ar${i}`} className="verse-commentary-text verse-commentary-aramaic" dir="rtl" lang="arc">{text}</p>
              ))}
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
