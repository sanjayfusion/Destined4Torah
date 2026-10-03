import type { Env } from './env'
import { hmacHex, now, safeEqual } from './util'

const SESSION_SECONDS = 7 * 24 * 60 * 60

export function checkPassword(env: Env, input: string): Promise<boolean> {
  return safeEqual(input, env.ADMIN_PASSWORD)
}

export async function createSessionCookie(env: Env, request: Request): Promise<string> {
  const expires = now() + SESSION_SECONDS
  const signature = await hmacHex(env.SESSION_SECRET, `session.${expires}`)
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `session=${expires}.${signature}; HttpOnly; SameSite=Strict; Path=/${secure}; Max-Age=${SESSION_SECONDS}`
}

export function clearSessionCookie(): string {
  return 'session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'
}

export async function isAuthenticated(request: Request, env: Env): Promise<boolean> {
  const cookie = request.headers.get('Cookie') ?? ''
  const match = /(?:^|;\s*)session=(\d+)\.([a-f0-9]+)/.exec(cookie)
  if (!match) return false
  const [, expires, signature] = match
  if (Number(expires) < now()) return false
  const expected = await hmacHex(env.SESSION_SECRET, `session.${expires}`)
  return safeEqual(signature, expected)
}

/** Browsers always send Origin on cross-site POSTs; reject any that don't match this worker. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin')
  if (!origin) return true
  return origin === new URL(request.url).origin
}
