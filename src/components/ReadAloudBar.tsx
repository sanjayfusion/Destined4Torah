import type { ReadAloudStatus } from '../hooks/useReadAloud'
import { READ_ALOUD_SPEEDS } from '../hooks/useReadAloudRate'

interface ReadAloudBarProps {
  texts: string[]
  status: ReadAloudStatus
  currentIndex: number | null
  play: () => void
  stop: () => void
  rate: number
  onRateChange: (rate: number) => void
  wordByWord: boolean
  onWordByWordChange: (wordByWord: boolean) => void
  label?: string
}

export function ReadAloudBar({
  texts,
  status,
  currentIndex,
  play,
  stop,
  rate,
  onRateChange,
  wordByWord,
  onWordByWordChange,
  label = 'Read Hebrew aloud',
}: ReadAloudBarProps) {
  if (status === 'unsupported' || texts.length === 0) {
    return null
  }

  return (
    <div className="read-aloud-bar">
      {status === 'playing' ? (
        <button type="button" className="read-aloud-button playing" onClick={stop}>
          &#9632; Stop
        </button>
      ) : (
        <button type="button" className="read-aloud-button" onClick={() => play()}>
          &#9658; {label}
        </button>
      )}
      <label className="read-aloud-speed">
        <span>Speed</span>
        <select value={rate} onChange={(event) => onRateChange(Number(event.target.value))}>
          {READ_ALOUD_SPEEDS.map((speed) => (
            <option key={speed.rate} value={speed.rate}>{speed.label}</option>
          ))}
        </select>
      </label>
      <label className="read-aloud-speed" title="Speaks one word at a time so the highlight stays exactly with the voice">
        <input type="checkbox" checked={wordByWord} onChange={(event) => onWordByWordChange(event.target.checked)} />
        <span>Word by word</span>
      </label>
      {status === 'playing' && currentIndex !== null && (
        <span className="read-aloud-status">
          Verse {currentIndex + 1} of {texts.length}
        </span>
      )}
    </div>
  )
}
