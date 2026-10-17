import { useEffect } from 'react'
import { PARSHIYOT_BY_BOOK, type ParshaListEntry } from '../data/parshiyot'

interface AllParshiyotProps {
  onSelect: (parsha: ParshaListEntry) => void
  /** Torah book to scroll to on open, e.g. "Exodus" from the Tanakh page's weekly-portion links. */
  focusBook?: string
}

export function AllParshiyot({ onSelect, focusBook }: AllParshiyotProps) {
  useEffect(() => {
    if (focusBook) document.getElementById(`parshiyot-${focusBook.toLowerCase()}`)?.scrollIntoView({ block: 'start' })
  }, [focusBook])

  return (
    <article className="reader">
      <header className="reader-header">
        <div>
          <p className="parsha-label">All Parshiyot</p>
          <h2>The 54 Weekly Torah Portions</h2>
        </div>
      </header>

      {PARSHIYOT_BY_BOOK.map((group) => (
        <div key={group.book} id={`parshiyot-${group.book.toLowerCase()}`} className="parshiyot-group">
          <h3 className="chapter-divider">{group.book}</h3>
          <ul className="parshiyot-list">
            {group.parshiyot.map((parsha) => (
              <li key={parsha.english}>
                <button type="button" className="parshiyot-button" onClick={() => onSelect(parsha)}>
                  <span className="parshiyot-hebrew" dir="rtl">{parsha.hebrew}</span>
                  <span className="parshiyot-english">{parsha.english}</span>
                  <span className="parshiyot-ref">{parsha.ref}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </article>
  )
}
