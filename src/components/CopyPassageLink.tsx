import { useEffect, useState } from 'react'
import { passageUrl, type PassageRoute } from '../lib/passageLinks'

interface CopyPassageLinkProps {
  route: PassageRoute
  label?: string
}

export function CopyPassageLink({ route, label = 'Copy link' }: CopyPassageLinkProps) {
  const [status, setStatus] = useState('')
  const [fallback, setFallback] = useState('')
  const url = passageUrl(route, window.location.href)
  useEffect(() => { setStatus(''); setFallback('') }, [url])
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setStatus('Link copied')
      setFallback('')
    } catch {
      setStatus('Select and copy the link below')
      setFallback(url)
    }
  }
  return <span className="copy-passage">
    <button type="button" className="copy-passage-button" onClick={copy}>{label}</button>
    <span role="status" className="copy-passage-status">{status}</span>
    {fallback && <input aria-label="Passage link" readOnly value={fallback} onFocus={(event) => event.currentTarget.select()} />}
  </span>
}
