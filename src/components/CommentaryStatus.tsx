import type { CommentaryLoadStatus } from '../hooks/useCommentary'

export function CommentaryStatus({ status, onRetry }: { status: CommentaryLoadStatus; onRetry: () => void }) {
  if (status === 'ready') return null
  return (
    <p className="study-help" role="status">
      {status === 'loading' && 'Loading commentary…'}
      {status === 'empty' && 'No commentary is available for this reading.'}
      {status === 'error' && <>Commentary could not load. <button type="button" className="jump-menu-link" onClick={onRetry}>Retry commentary</button></>}
    </p>
  )
}
