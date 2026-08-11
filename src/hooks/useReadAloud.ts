import { useCallback, useEffect, useRef, useState } from 'react'

export type ReadAloudStatus = 'idle' | 'playing' | 'unsupported'

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

// How long to wait after a verse starts before assuming the browser/voice
// won't send word-boundary events at all (common for non-English voices),
// and switching to the estimated fallback instead.
const BOUNDARY_GRACE_MS = 350
// Roughly seconds-per-word at rate 1 (~2.6 words/sec, typical natural
// speech), scaled by rate. This is a rough estimate, not a true sync —
// it exists only so the highlight moves along when the browser gives no
// real timing signal at all.
const BASE_MS_PER_WORD = 380

function estimateWordOffsets(text: string): number[] {
  const offsets: number[] = []
  const regex = /\S+/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(text))) offsets.push(match.index)
  return offsets
}

export function useReadAloud(texts: string[], lang = 'he-IL', rate = 0.5) {
  const [status, setStatus] = useState<ReadAloudStatus>(isSupported ? 'idle' : 'unsupported')
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [currentCharIndex, setCurrentCharIndex] = useState<number | null>(null)
  const textsRef = useRef(texts)
  textsRef.current = texts
  const activeFallbackRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      if (!isSupported) return
      activeFallbackRef.current?.()
      window.speechSynthesis.cancel()
    }
  }, [])

  const stop = useCallback(() => {
    if (!isSupported) return
    activeFallbackRef.current?.()
    activeFallbackRef.current = null
    window.speechSynthesis.cancel()
    setStatus('idle')
    setCurrentIndex(null)
    setCurrentCharIndex(null)
  }, [])

  const play = useCallback(() => {
    if (!isSupported) return
    activeFallbackRef.current?.()
    activeFallbackRef.current = null
    window.speechSynthesis.cancel()

    const verses = textsRef.current
    verses.forEach((text, i) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = rate

      const wordOffsets = estimateWordOffsets(text)
      let boundaryFired = false
      let fallbackTimer: number | undefined

      const clearFallback = () => {
        if (fallbackTimer !== undefined) {
          clearInterval(fallbackTimer)
          fallbackTimer = undefined
        }
      }

      utterance.onstart = () => {
        setCurrentIndex(i)
        setCurrentCharIndex(wordOffsets[0] ?? 0)
        activeFallbackRef.current = clearFallback

        setTimeout(() => {
          if (boundaryFired || wordOffsets.length <= 1) return
          let wordIndex = 0
          const msPerWord = BASE_MS_PER_WORD / rate
          fallbackTimer = setInterval(() => {
            wordIndex++
            if (wordIndex >= wordOffsets.length) {
              clearFallback()
              return
            }
            setCurrentCharIndex(wordOffsets[wordIndex])
          }, msPerWord)
        }, BOUNDARY_GRACE_MS)
      }

      // Real word-boundary events (where supported) always take priority
      // over the estimated fallback.
      utterance.onboundary = (event) => {
        if (!event.name || event.name === 'word') {
          boundaryFired = true
          clearFallback()
          setCurrentCharIndex(event.charIndex)
        }
      }

      utterance.onend = () => {
        clearFallback()
        if (i === verses.length - 1) {
          activeFallbackRef.current = null
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
