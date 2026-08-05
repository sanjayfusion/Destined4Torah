import { useCallback, useEffect, useRef, useState } from 'react'

export type ReadAloudStatus = 'idle' | 'playing' | 'unsupported'

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function useReadAloud(texts: string[]) {
  const [status, setStatus] = useState<ReadAloudStatus>(isSupported ? 'idle' : 'unsupported')
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const textsRef = useRef(texts)
  textsRef.current = texts

  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel()
    }
  }, [])

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setStatus('idle')
    setCurrentIndex(null)
  }, [])

  const play = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()

    const verses = textsRef.current
    verses.forEach((text, i) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'he-IL'
      utterance.rate = 0.85
      utterance.onstart = () => setCurrentIndex(i)
      if (i === verses.length - 1) {
        utterance.onend = () => {
          setStatus('idle')
          setCurrentIndex(null)
        }
      }
      window.speechSynthesis.speak(utterance)
    })

    setStatus('playing')
  }, [])

  return { status, currentIndex, play, stop }
}
