import { PARSHIYOT_BY_BOOK, type ParshaListEntry } from '../data/parshiyot'

interface AllParshiyotProps {
  onSelect: (parsha: ParshaListEntry) => void
}

export function AllParshiyot({ onSelect }: AllParshiyotProps) {
  return (
    <article className="reader">
      <header className="reader-header">
        <div>
          <p className="parsha-label">All Parshiyot</p>
          <h2>The 54 Weekly Torah Portions</h2>
        </div>
      </header>

      {PARSHIYOT_BY_BOOK.map((group) => (
        <div key={group.book} className="parshiyot-group">
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
