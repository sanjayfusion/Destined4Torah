import { useCallback, useEffect, useRef, useState } from 'react'

export type ReadAloudStatus = 'idle' | 'playing' | 'unsupported'

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function useReadAloud(texts: string[], lang = 'he-IL', rate = 0.5) {
  const [status, setStatus] = useState<ReadAloudStatus>(isSupported ? 'idle' : 'unsupported')
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [currentCharIndex, setCurrentCharIndex] = useState<number | null>(null)
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
    setCurrentCharIndex(null)
  }, [])

  const play = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()

    const verses = textsRef.current
    verses.forEach((text, i) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = rate
      utterance.onstart = () => {
        setCurrentIndex(i)
        setCurrentCharIndex(0)
      }
      // Lets the verse text highlight along as speech progresses. Browser
      // and voice support for this varies — some fire a boundary per word,
      // some only per sentence, some not at all. Playback still works
      // either way; word highlighting just won't track as closely without it.
      utterance.onboundary = (event) => {
        if (!event.name || event.name === 'word') {
          setCurrentCharIndex(event.charIndex)
        }
      }
      if (i === verses.length - 1) {
        utterance.onend = () => {
          setStatus('idle')
          setCurrentIndex(null)
          setCurrentCharIndex(null)
        }
      }
      window.speechSynthesis.speak(utterance)
    })

    setStatus('playing')
  }, [lang, rate])

  return { status, currentIndex, currentCharIndex, play, stop }
}
