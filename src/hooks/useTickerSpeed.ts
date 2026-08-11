import { useEffect, useRef, useState } from 'react'

/**
 * A fixed animation-duration doesn't produce the same visual speed across
 * tickers with different amounts of content — a ticker with more text
 * travels farther in the same time, so it looks faster. This measures the
 * actual rendered width of one copy of the (duplicated) content and picks
 * a duration so every ticker using it scrolls at the same pixels/second.
 */
export function useTickerSpeed(duplicateCount: number, dependency: unknown, pxPerSecond = 90) {
  const ref = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(40)

  useEffect(() => {
    if (!ref.current) return
    const singleSetWidth = ref.current.scrollWidth / duplicateCount
    if (singleSetWidth > 0) {
      setDuration(singleSetWidth / pxPerSecond)
    }
  }, [dependency, duplicateCount, pxPerSecond])

  return { ref, duration }
}
