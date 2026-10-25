import { useCallback, useEffect, useRef, useState } from 'react'
import { speechChunks, wordAtSpokenChar, wordChunks } from '../lib/speech'

export type ReadAloudStatus = 'idle' | 'playing' | 'unsupported'

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

// How long to wait after a phrase starts before assuming the browser/voice
// won't send word-boundary events at all (common for Hebrew voices), and
// switching to the estimated timing instead.
const BOUNDARY_GRACE_MS = 350
// Roughly milliseconds per syllable at rate 1, scaled by rate. Only an
// estimate, but each phrase restarts it, so drift stays small.
const BASE_MS_PER_SYLLABLE = 190

function findVoice(lang: string): SpeechSynthesisVoice | undefined {
  const prefix = lang.slice(0, 2).toLowerCase()
  const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().replace('_', '-').startsWith(prefix))
  return voices.find((voice) => voice.localService) ?? voices[0]
}

export function useReadAloud(texts: string[], lang = 'he-IL', rate = 0.5, wordByWord = false) {
  const [status, setStatus] = useState<ReadAloudStatus>(isSupported ? 'idle' : 'unsupported')
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [currentCharIndex, setCurrentCharIndex] = useState<number | null>(null)
  const textsRef = useRef(texts)
  textsRef.current = texts
  const activeFallbackRef = useRef<(() => void) | null>(null)
  const statusRef = useRef(status)
  statusRef.current = status
  const currentIndexRef = useRef(currentIndex)
  currentIndexRef.current = currentIndex

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

  const play = useCallback((fromIndex = 0) => {
    if (!isSupported) return
    activeFallbackRef.current?.()
    activeFallbackRef.current = null
    window.speechSynthesis.cancel()

    const voice = findVoice(lang)
    const verses = textsRef.current
    const queue = verses.flatMap((text, i) => {
      if (i < fromIndex) return []
      const chunks = speechChunks(text)
      return (wordByWord ? wordChunks(chunks) : chunks).map((chunk) => ({ verse: i, chunk }))
    })
    if (queue.length === 0) return

    // Utterances are spoken one at a time, each queued only when the previous
    // one ends. Queuing them all at once lets iOS Safari silently stop sending
    // start/end events partway through, freezing the highlight while the
    // audio carries on.
    let stopped = false
    let timers: number[] = []
    let current: SpeechSynthesisUtterance | null = null
    const clearTimers = () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers = []
    }
    activeFallbackRef.current = () => {
      stopped = true
      clearTimers()
      current = null
    }

    const finish = () => {
      activeFallbackRef.current = null
      setStatus('idle')
      setCurrentIndex(null)
      setCurrentCharIndex(null)
    }

    const speakItem = (q: number) => {
      if (stopped) return
      if (q >= queue.length) {
        finish()
        return
      }
      const { verse, chunk } = queue[q]
      const utterance = new SpeechSynthesisUtterance(chunk.text)
      utterance.lang = lang
      utterance.rate = rate
      if (voice) utterance.voice = voice
      // Held so the browser can't garbage-collect it and drop its events.
      current = utterance

      let done = false
      let boundaryFired = false
      const next = () => {
        if (done || stopped) return
        done = true
        clearTimers()
        speakItem(q + 1)
      }

      // Highlight as soon as the words are handed to the voice, in case
      // onstart never arrives.
      setCurrentIndex(verse)
      setCurrentCharIndex(chunk.words[0].start)

      const msPerSyllable = BASE_MS_PER_SYLLABLE / rate
      const estimatedMs = chunk.words.reduce((total, word) => total + word.syllables * msPerSyllable, 0)

      utterance.onstart = () => {
        if (current !== utterance || chunk.words.length <= 1) return
        timers.push(window.setTimeout(() => {
          if (boundaryFired || current !== utterance) return
          // Space the remaining words out by their syllable counts, measured
          // from the phrase's start (the grace period has already passed).
          let offset = 0
          chunk.words.forEach((word, w) => {
            if (w > 0) timers.push(window.setTimeout(() => setCurrentCharIndex(word.start), Math.max(0, offset - BOUNDARY_GRACE_MS)))
            offset += word.syllables * msPerSyllable
          })
        }, BOUNDARY_GRACE_MS))
      }

      // Real word-boundary events (where supported) always take priority
      // over the estimated timing.
      utterance.onboundary = (event) => {
        if (current !== utterance || (event.name && event.name !== 'word')) return
        boundaryFired = true
        const word = wordAtSpokenChar(chunk, event.charIndex)
        if (word) setCurrentCharIndex(word.start)
      }

      utterance.onend = next
      utterance.onerror = next

      // Backstop for a missed onend: move on once the voice has gone quiet,
      // or after well over the time the words should take.
      const startedAt = Date.now()
      const poll = () => {
        if (done || stopped) return
        const quiet = !window.speechSynthesis.speaking && !window.speechSynthesis.pending
        if ((quiet && Date.now() - startedAt > 600) || Date.now() - startedAt > estimatedMs * 3 + 4000) {
          next()
          return
        }
        timers.push(window.setTimeout(poll, 250))
      }
      timers.push(window.setTimeout(poll, 250))

      window.speechSynthesis.speak(utterance)
    }

    setStatus('playing')
    speakItem(0)
  }, [lang, rate, wordByWord])

  // A new speed or mode applies straight away: restart from the verse being read.
  const lastSettingsRef = useRef(`${rate}|${wordByWord}`)
  useEffect(() => {
    const settings = `${rate}|${wordByWord}`
    if (lastSettingsRef.current === settings) return
    lastSettingsRef.current = settings
    if (statusRef.current === 'playing') play(currentIndexRef.current ?? 0)
  }, [rate, wordByWord, play])

  return { status, currentIndex, currentCharIndex, play, stop }
}
