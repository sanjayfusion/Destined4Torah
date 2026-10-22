import { useState } from 'react'

interface SelectedRange {
  anchor: number
  end: number
}

/**
 * Tracks a contiguous range of verses picked by tapping verse numbers, like
 * Blue Letter Bible: the first tap selects a verse, a tap on another verse
 * extends the range to it, and tapping the lone selected verse clears it.
 * Indexes are positions in the reading's verse list. The selection resets
 * whenever `resetKey` changes (a new chapter or portion).
 */
export function useVerseSelection(resetKey: string) {
  const [state, setState] = useState<{ key: string; range: SelectedRange | null }>({ key: resetKey, range: null })
  const range = state.key === resetKey ? state.range : null

  function toggle(index: number) {
    let next: SelectedRange | null
    if (!range) next = { anchor: index, end: index }
    else if (index === range.anchor) next = range.anchor === range.end ? null : { anchor: index, end: index }
    else next = { anchor: range.anchor, end: index }
    setState({ key: resetKey, range: next })
  }

  function clear() {
    setState({ key: resetKey, range: null })
  }

  const start = range ? Math.min(range.anchor, range.end) : -1
  const end = range ? Math.max(range.anchor, range.end) : -1
  return {
    range: range ? { start, end } : null,
    isSelected: (index: number) => index >= start && index <= end,
    toggle,
    clear,
  }
}
