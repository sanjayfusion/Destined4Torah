import { SubscribeForm } from './SubscribeForm'

export function SubscribePage({ onBackToReading }: { onBackToReading: () => void }) {
  return <article className="subscribe-page">
    <button type="button" className="parsha-toggle subscribe-back" onClick={onBackToReading}>← Back to reading</button>
    <SubscribeForm />
  </article>
}
