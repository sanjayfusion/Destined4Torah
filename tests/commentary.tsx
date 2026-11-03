import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useCommentary } from '../src/hooks/useCommentary'
import { CommentaryStatus } from '../src/components/CommentaryStatus'
import { VerseCommentary } from '../src/components/VerseCommentary'

// Controlled responses let browser QA verify independent loading, retry, and
// navigation without depending on Sefaria availability or its response speed.
const pending = new Map<string, (response: Response) => void>()
window.fetch = (input) => new Promise((resolve) => { pending.set(String(input), resolve) })
function complete(chapter: number, failed = false) {
  for (const [url, resolve] of pending) {
    if (!url.includes(`Genesis.${chapter}?`)) continue
    pending.delete(url)
    resolve(new Response(JSON.stringify([
      {category:'Commentary',collectiveTitle:{en:'Rashi'},anchorRef:`Genesis ${chapter}:1`,text:`Commentary for chapter ${chapter}`},
    ]), { status: failed ? 504 : 200, headers: { 'Content-Type': 'application/json' } }))
  }
}
function Checks() {
  const [book, setBook] = useState('Genesis')
  const commentary = useCommentary([23,24].map(chapter => ({book,chapter})))
  return <>
    <h1>Commentary loading checks</h1>
    <p>Reading: {book}</p>
    <button onClick={() => complete(23)}>Resolve chapter 23</button>
    <button onClick={() => complete(24,true)}>Fail chapter 24</button>
    <button onClick={() => complete(24)}>Resolve chapter 24</button>
    <button onClick={() => setBook('Exodus')}>Switch reading</button>
    {[23,24].map(chapter => <section key={chapter}>
      <h2>Chapter {chapter}</h2>
      <CommentaryStatus status={commentary.chapters[chapter]?.status ?? 'loading'} onRetry={commentary.retry} />
      <VerseCommentary entries={commentary.chapters[chapter]?.data?.[1] ?? []} />
    </section>)}
  </>
}
createRoot(document.getElementById('root')!).render(<Checks />)
