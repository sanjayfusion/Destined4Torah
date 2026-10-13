import { dictionarySourceUrl } from '../lib/dictionarySource'
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
      <button type="button" className="verse-interlinear-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'Show'} interlinear
      </button>

      {open && (
        <div className="verse-interlinear-body">
          <p className="study-help">Dictionary definitions cover selected words and are possible matches, not verse-specific translations. “Not yet available” means this word has no entry in our study dictionary.</p>
          <table className="verse-interlinear-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Transliteration</th>
                <th>Dictionary definition</th>
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
                        <a className="verse-interlinear-strongs-num" href={dictionarySourceUrl(row.strongs)} target="_blank" rel="noopener noreferrer">Strong’s {row.strongs}</a>{' '}
                        {row.definition}
                      </>
                    ) : (
                      <span className="verse-interlinear-nomatch">Not yet available</span>
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
