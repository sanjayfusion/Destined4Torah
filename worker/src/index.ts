import { handleAdmin } from './admin'
import type { Env } from './env'
import { serveImage, serveLogo } from './images'
import { handleConfirm, handleSubscribe, handleSubscribeOptions, handleUnsubscribe } from './public'
import { processQueue } from './sender'
import { now } from './util'
import { handleResendWebhook } from './webhook'

async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const { pathname } = new URL(request.url)

  if (pathname === '/api/subscribe') {
    if (request.method === 'OPTIONS') return handleSubscribeOptions(request, env)
    if (request.method === 'POST') return handleSubscribe(request, env)
    return new Response('Method not allowed', { status: 405 })
  }
  const image = /^\/img\/([a-f0-9]{48})$/.exec(pathname)
  if (image && request.method === 'GET') return serveImage(env, image[1])
  if (pathname === '/assets/logo.png' && request.method === 'GET') return serveLogo()
  if (pathname === '/confirm' && request.method === 'GET') return handleConfirm(request, env)
  if (pathname === '/unsubscribe' && (request.method === 'GET' || request.method === 'POST')) return handleUnsubscribe(request, env)
  if (pathname === '/webhooks/resend' && request.method === 'POST') return handleResendWebhook(request, env)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return handleAdmin(request, env, ctx)
  if (pathname === '/') return Response.redirect(env.SITE_URL, 302)

  return new Response('Not found', { status: 404 })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await route(request, env, ctx)
    } catch (error) {
      console.error('Unhandled error:', error)
      return new Response('Something went wrong.', { status: 500 })
    }
  },

  // Runs every minute: sends the next batch of any email that is being sent.
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        await processQueue(env)
        await env.DB.prepare('DELETE FROM rate_limits WHERE at < ?').bind(now() - 24 * 60 * 60).run()
      })(),
    )
  },
}
