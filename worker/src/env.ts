export interface Env {
  DB: D1Database

  // Secrets (set with `wrangler secret put`, or .dev.vars locally)
  ADMIN_PASSWORD: string
  SESSION_SECRET: string
  RESEND_API_KEY?: string
  RESEND_WEBHOOK_SECRET?: string
  MAILING_ADDRESS?: string

  // Plain config (wrangler.toml [vars])
  SITE_URL: string
  ALLOWED_ORIGINS: string
  WORKER_URL: string
  FROM_NAME: string
  FROM_EMAIL: string
  REPLY_TO?: string
  SEND_BATCH_SIZE?: string
}

export interface Subscriber {
  id: number
  email: string
  name: string
  status: 'pending' | 'confirmed' | 'unsubscribed' | 'bounced' | 'complained'
  token: string
  source: string
  created_at: number
  confirmed_at: number | null
  unsubscribed_at: number | null
  confirmation_sent_at: number | null
}

export interface Campaign {
  id: number
  subject: string
  body: string
  status: 'draft' | 'sending' | 'sent'
  total_recipients: number
  created_at: number
  updated_at: number
  sent_at: number | null
}
