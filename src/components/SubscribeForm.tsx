import { useState, type FormEvent } from 'react'
import { SUBSCRIBE_API_URL } from '../config'

type Status = 'idle' | 'sending' | 'done' | 'error'

export function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [company, setCompany] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  if (!SUBSCRIBE_API_URL) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    try {
      const response = await fetch(`${SUBSCRIBE_API_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone, address, company }),
      })
      const data = (await response.json()) as { ok: boolean; error?: string }
      if (data.ok) {
        setStatus('done')
        setMessage('Almost there! Check your email and click the link to confirm your subscription.')
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Could not reach the server. Please try again in a moment.')
    }
  }

  return (
    <section className="subscribe-card" aria-labelledby="subscribe-heading">
      <h2 id="subscribe-heading">Get Destined4Torah in your inbox</h2>
      <p>Teaching, Torah insights, and updates from Dr. Sanjay Prajapati, delivered by email. Unsubscribe any time.</p>

      {status === 'done' ? (
        <p className="subscribe-message success" role="status">
          {message}
        </p>
      ) : (
        <form className="subscribe-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="subscribe-input"
            placeholder="Your name"
            aria-label="Your name"
            autoComplete="name"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            className="subscribe-input"
            placeholder="Your email address"
            aria-label="Email address"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="tel"
            className="subscribe-input"
            placeholder="Phone (optional)"
            aria-label="Phone number (optional)"
            autoComplete="tel"
            maxLength={40}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="text"
            className="subscribe-input subscribe-input-wide"
            placeholder="Address (optional)"
            aria-label="Address (optional)"
            autoComplete="street-address"
            maxLength={300}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <input
            type="text"
            className="subscribe-trap"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <button type="submit" className="subscribe-button" disabled={status === 'sending'}>
            {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
          </button>
          {status === 'error' && (
            <p className="subscribe-message error" role="alert">
              {message}
            </p>
          )}
        </form>
      )}

      {status !== 'done' && (
        <div className="subscribe-qr">
          <img src="/join-qr.svg" width={132} height={132} alt="QR code to join the email list from your phone" />
          <p>
            <strong>On a computer?</strong> Point your phone camera at this code to sign up from your phone.
          </p>
        </div>
      )}
    </section>
  )
}
