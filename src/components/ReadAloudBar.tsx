import { useReadAloud } from '../hooks/useReadAloud'

interface ReadAloudBarProps {
  texts: string[]
  label?: string
  lang?: string
  rate?: number
}

export function ReadAloudBar({ texts, label = 'Read Hebrew aloud', lang = 'he-IL', rate = 0.5 }: ReadAloudBarProps) {
  const { status, currentIndex, play, stop } = useReadAloud(texts, lang, rate)

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
