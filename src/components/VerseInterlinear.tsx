import { useState } from 'react'
import type { InterlinearRow } from '../lib/interlinear'

interface VerseInterlinearProps {
  rows: InterlinearRow[]
  dir?: 'ltr' | 'rtl'
}

export function VerseInterlinear({ rows, dir = 'ltr' }: VerseInterlinearProps) {
  const [open, setOpen] = useState(false)

  if (rows.length === 0) {
    return null
  }

  return (
    <div className="verse-interlinear">
      <button type="button" className="verse-interlinear-toggle" onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'Show'} interlinear
      </button>

      {open && (
        <div className="verse-interlinear-body">
          <table className="verse-interlinear-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Transliteration</th>
                <th>Strong's &amp; Meaning</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="verse-interlinear-word" dir={dir}>
                    {row.text}
                  </td>
                  <td className="verse-interlinear-translit">{row.transliteration}</td>
                  <td className="verse-interlinear-strongs">
                    {row.strongs ? (
                      <>
                        <span className="verse-interlinear-strongs-num">{row.strongs}</span>{' '}
                        {row.definition}
                      </>
                    ) : (
                      <span className="verse-interlinear-nomatch">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
