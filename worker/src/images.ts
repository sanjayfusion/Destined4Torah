import type { Env } from './env'
import { LOGO_PNG_BASE64 } from './logo'
import { randomToken } from './util'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

/** Identifies the image type from its first bytes, so the declared type is never trusted. */
export function detectImageType(buffer: ArrayBuffer): string | null {
  const b = new Uint8Array(buffer.slice(0, 12))
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp'
  return null
}

export async function storeImage(env: Env, file: File): Promise<{ token: string } | { error: string }> {
  if (file.size > MAX_IMAGE_BYTES) return { error: 'That image is too large (8 MB limit). Save it as a JPEG or resize it and try again.' }
  const buffer = await file.arrayBuffer()
  const contentType = detectImageType(buffer)
  if (!contentType) return { error: 'That file is not a supported image. Use a JPEG, PNG, GIF, or WebP.' }
  const token = randomToken()
  await env.IMAGES.put(`img:${token}`, buffer, { metadata: { contentType } })
  return { token }
}

export async function serveImage(env: Env, token: string): Promise<Response> {
  const { value, metadata } = await env.IMAGES.getWithMetadata<{ contentType: string }>(`img:${token}`, 'arrayBuffer')
  if (!value || !metadata) return new Response('Not found', { status: 404 })
  return new Response(value, {
    headers: {
      'Content-Type': metadata.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

let logoBytes: Uint8Array | null = null
export function serveLogo(): Response {
  logoBytes ??= Uint8Array.from(atob(LOGO_PNG_BASE64), (c) => c.charCodeAt(0))
  return new Response(logoBytes, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } })
}

/** For previews of an image that has not been saved yet. */
export function toDataUri(buffer: ArrayBuffer, contentType: string): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:${contentType};base64,${btoa(binary)}`
}
