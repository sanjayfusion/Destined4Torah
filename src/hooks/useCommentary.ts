import { useEffect, useState } from 'react'
import { fetchChapterCommentary, fetchNTCommentary, type CommentaryByVerse } from '../lib/commentary'

interface CommentaryRequest {
  book: string
  chapter: number
  start?: number
  end?: number
  ntBookNumber?: number
}

export type CommentaryLoadStatus = 'loading' | 'ready' | 'empty' | 'error'
interface ChapterCommentary {
  status: CommentaryLoadStatus
  data?: CommentaryByVerse
}

export function useCommentary(requests: CommentaryRequest[]) {
  // A value key keeps equivalent render-created arrays from restarting requests.
  const key = JSON.stringify(requests)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; chapters: Record<number, ChapterCommentary> }>({ key: '', chapters: {} })

  useEffect(() => {
    let cancelled = false
    const selected: CommentaryRequest[] = JSON.parse(key)
    setResult({ key, chapters: Object.fromEntries(selected.map(({ chapter }) => [chapter, { status: 'loading' }])) })
    for (const request of selected) {
      const load = request.ntBookNumber !== undefined
        ? fetchNTCommentary(request.ntBookNumber, request.chapter)
        : fetchChapterCommentary(request.book, request.chapter,
          request.start !== undefined && request.end !== undefined ? { start: request.start, end: request.end } : undefined)
      load.then((data) => {
        if (!cancelled) setResult((previous) => ({ key, chapters: { ...previous.chapters,
          [request.chapter]: { data, status: Object.keys(data).length ? 'ready' : 'empty' },
        } }))
      }).catch(() => {
        if (!cancelled) setResult((previous) => ({ key, chapters: { ...previous.chapters,
          [request.chapter]: { status: 'error' },
        } }))
      })
    }
    return () => { cancelled = true }
  }, [key, attempt])

  return { chapters: result.key === key ? result.chapters : {}, retry: () => setAttempt((value) => value + 1) }
}
