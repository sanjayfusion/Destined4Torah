/**
 * Public URL of the email-signup worker (see worker/README.md). While this is
 * empty the signup form stays hidden, so the site is unaffected until the
 * backend is deployed. Set VITE_SUBSCRIBE_API_URL in `.env.production`.
 */
export const SUBSCRIBE_API_URL: string = (import.meta.env.VITE_SUBSCRIBE_API_URL ?? '').replace(/\/+$/, '')
