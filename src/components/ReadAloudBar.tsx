import type { ReadAloudStatus } from '../hooks/useReadAloud'

interface ReadAloudBarProps {
  texts: string[]
  status: ReadAloudStatus
  currentIndex: number | null
  play: () => void
  stop: () => void
  label?: string
}

export function ReadAloudBar({
  texts,
  status,
  currentIndex,
  play,
  stop,
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
        <button type="button" className="read-aloud-button" onClick={play}>
          &#9658; {label}
        </button>
      )}
      {status === 'playing' && currentIndex !== null && (
        <span className="read-aloud-status">
          Verse {currentIndex + 1} of {texts.length}
        </span>
      )}
    </div>
  )
}
