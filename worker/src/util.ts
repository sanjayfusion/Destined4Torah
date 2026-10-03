const encoder = new TextEncoder()

export function now(): number {
  return Math.floor(Date.now() / 1000)
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Compares two strings in constant time (by comparing fixed-length digests). */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ])
  return crypto.subtle.timingSafeEqual(da, db)
}

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase()
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null
  return email
}

export function formatDate(ts: number | null): string {
  if (!ts) return ''
  return new Date(ts * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

export function clientIp(req: Request): string {
  return req.headers.get('CF-Connecting-IP') ?? 'unknown'
}

export async function tooManyRequests(db: D1Database, key: string, max: number, windowSeconds: number): Promise<boolean> {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM rate_limits WHERE key = ? AND at > ?')
    .bind(key, now() - windowSeconds)
    .first<{ n: number }>()
  return (row?.n ?? 0) >= max
}

export async function recordRequest(db: D1Database, key: string): Promise<void> {
  await db.prepare('INSERT INTO rate_limits (key, at) VALUES (?, ?)').bind(key, now()).run()
}
