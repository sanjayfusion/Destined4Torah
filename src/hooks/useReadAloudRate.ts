import { useState } from 'react'

export const READ_ALOUD_SPEEDS = [
  { label: 'Very slow', rate: 0.3 },
  { label: 'Slow', rate: 0.4 },
  { label: 'Medium', rate: 0.55 },
  { label: 'Natural', rate: 0.75 },
]
const DEFAULT_RATE = 0.4
const key = 'd4t.read-aloud-rate.v1'

function readStoredRate(): number {
  try {
    const stored = Number(localStorage.getItem(key))
    return READ_ALOUD_SPEEDS.some((speed) => speed.rate === stored) ? stored : DEFAULT_RATE
  } catch {
    return DEFAULT_RATE
  }
}

const wordByWordKey = 'd4t.read-aloud-word-by-word.v1'

/** Whether read-aloud speaks one word at a time (exact highlighting), remembered on this device. Defaults to on. */
export function useReadAloudWordByWord() {
  const [wordByWord, setState] = useState(() => {
    try { return localStorage.getItem(wordByWordKey) !== 'false' } catch { return true }
  })

  function setWordByWord(next: boolean) {
    setState(next)
    try { localStorage.setItem(wordByWordKey, String(next)) } catch { /* storage unavailable: keep it for this visit only */ }
  }

  return [wordByWord, setWordByWord] as const
}

/** The chosen read-aloud speed, remembered on this device. */
export function useReadAloudRate() {
  const [rate, setRateState] = useState(readStoredRate)

  function setRate(next: number) {
    setRateState(next)
    try { localStorage.setItem(key, String(next)) } catch { /* storage unavailable: keep it for this visit only */ }
  }

  return [rate, setRate] as const
}
