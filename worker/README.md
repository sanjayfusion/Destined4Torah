# Destined4Torah mail

Your own email-list system for app.destined4torah.com: a signup form, double opt-in confirmation, one-click unsubscribe, an admin area to import your list and write and send emails, and bounce/open/click tracking.

It runs as a [Cloudflare Worker](https://developers.cloudflare.com/workers/) with a D1 database, and sends through [Resend](https://resend.com). The website itself stays on GitHub Pages and only shows the signup form.

## What it does

| Area | Details |
| --- | --- |
| Signup | Form on the site; double opt-in (people must click a confirmation link) |
| Unsubscribe | One-click link plus the `List-Unsubscribe` header mail apps use for their own "unsubscribe" button |
| Admin (`/admin`) | Password login, subscriber list with search and CSV export, import from Constant Contact, write/preview/test/send emails, per-email results |
| Sending | Queued and sent in the background (about 100 per minute), skips anyone who unsubscribes mid-send |
| Safety | Bounces and spam complaints are suppressed automatically; every email has your address and an unsubscribe link; rate-limited signups; escaped content |

**Not included** (compared with Constant Contact): drag-and-drop editor, scheduling for later, automations/drip series, segments, A/B tests. Emails are written in simple Markdown (formatting help is on the compose page).

## Setup (one time)

You need accounts on **Cloudflare** (you have one) and **Resend**, and access to wherever destined4torah.com's DNS is managed.

### 1. Resend: verify a sending domain

1. Create a Resend account and add the domain `mail.destined4torah.com` (a *subdomain* is recommended so your existing email is untouched).
2. Resend shows a few DNS records (SPF, DKIM, and optionally DMARC). Add them at your DNS provider and wait for Resend to show "Verified".
3. In Resend, turn on open and click tracking for the domain if you want those stats.
4. Create an API key with sending access. Keep it handy for step 4.

> Resend's free plan has a daily sending cap. For a list of 500 to 5,000 people you will need a paid plan, so check Resend's current pricing.

### 2. Create the database

```bash
cd worker
npm install
npx wrangler login                      # opens your browser to approve access
npx wrangler d1 create d4t-mail         # prints a database_id
```

Also create the storage used for banner images, and paste both ids into `wrangler.toml`:

```bash
npx wrangler kv namespace create IMAGES   # prints an id for [[kv_namespaces]]
```

Paste the `database_id` into `wrangler.toml`, then:

```bash
npm run db:migrate:remote
```

### 3. Edit `wrangler.toml`

Set these under `[vars]`:

- `FROM_EMAIL`: e.g. `newsletter@mail.destined4torah.com` (must be on the domain you verified)
- `REPLY_TO`: where replies should go (e.g. your regular email)

`MAILING_ADDRESS` (your postal address, **required by law under CAN-SPAM**; sending is blocked without it) is set as a secret in the next step, so it isn't published in this public repository.

### 4. Set the secrets

Run each command and type or paste the value when prompted (they are stored encrypted by Cloudflare, not in the repo):

```bash
npx wrangler secret put ADMIN_PASSWORD      # choose a long, unique password
npx wrangler secret put SESSION_SECRET      # any long random string, e.g. output of: openssl rand -hex 32
npx wrangler secret put RESEND_API_KEY      # from Resend
npx wrangler secret put MAILING_ADDRESS     # e.g. 123 Main St, City, ST 12345 (a PO box is fine)
```

### 5. Deploy

```bash
npm run deploy
```

Wrangler prints the worker's address, like `https://d4t-mail.YOURNAME.workers.dev`. Put it in `wrangler.toml` as `WORKER_URL` (no trailing slash) and deploy once more:

```bash
npm run deploy
```

### 6. Connect bounce/open/click tracking

In Resend, add a webhook pointing to `https://YOUR-WORKER-URL/webhooks/resend` with the events `email.delivered`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`. Copy its signing secret, then:

```bash
npx wrangler secret put RESEND_WEBHOOK_SECRET
```

### 7. Turn on the form on the website

Create `.env.production` in the project root (not in `worker/`) containing:

```
VITE_SUBSCRIBE_API_URL=https://YOUR-WORKER-URL
```

Commit and push; the site's normal deploy shows the signup box. Until this file exists the box stays hidden.

### 8. Try it

1. Subscribe yourself on the site and click the link in the confirmation email.
2. Log in at `https://YOUR-WORKER-URL/admin`.
3. Import your Constant Contact list (Subscribers, then Add or import). Export it from Constant Contact as CSV first. People marked unsubscribed or bounced are skipped automatically.
4. Write an email, send yourself a test, and check how it looks.

## The weekly Saturday newsletter

Every Saturday the worker writes and sends a newsletter about the Torah portion that begins at sunset that evening (Sefaria's calendar picks the portion; the site's `/parshiyot.json` supplies the spelling, Hebrew and Dr. Sanjay's teaching videos; Workers AI writes a short introduction using only Sefaria's summary).

- **8:00 AM Pacific:** a draft is created and a **[PREVIEW]** email goes to the `AUTO_PREVIEW_TO` address. It has links to edit the draft in the admin or cancel the week.
- **2:00 PM Pacific:** the draft is sent to every confirmed subscriber, unless it was cancelled or deleted. If the preview went out late, the send waits until the preview has been out for an hour, and a newsletter that would start after 8:00 PM is not sent (the draft stays for you to send by hand).
- Editing the draft in the admin before 2:00 PM changes what is sent.

Setup and controls (all use the `IMAGES` KV namespace; `--remote` is the live one):

```
wrangler secret put AUTO_PREVIEW_TO                                   # preview address; the weekly send is off without it
wrangler kv key put weekly:paused 1 --binding IMAGES --remote         # pause the weekly send
wrangler kv key delete weekly:paused --binding IMAGES --remote        # resume it
wrangler kv key put weekly:force-test 1 --binding IMAGES --remote     # next minute: email yourself a test preview only (nothing is sent to subscribers)
```

## Using it day to day

- **Write and send:** Admin, Emails, Write an email. Use "Save and send test" until it looks right, then "Review and send to everyone".
- **Results:** open any sent email to see sent, delivered, opened, clicked, bounced.
- **Removing someone:** they can unsubscribe themselves, or you can click Remove on the Subscribers page. Removed subscribers stay on file as unsubscribed (only people who never confirmed are deleted), so re-importing an old list never adds back anyone who opted out, bounced or reported spam.

## Running it locally

```bash
cd worker
npm install
npm run db:migrate:local
npm run dev          # http://localhost:8787, admin password is in .dev.vars
```

With no `RESEND_API_KEY` it runs in **test mode**: emails are printed in the terminal instead of sent. Run the website with `VITE_SUBSCRIBE_API_URL=http://localhost:8787` (a `.env.development.local` file) to try the signup box.

## Email-list rules to keep

- Only email people who asked to hear from you. The import page asks you to confirm this.
- Honor unsubscribes (automatic) and keep your mailing address current.
- Start by sending to people who recently engaged, and avoid sudden huge blasts from a brand-new sending domain, which is what triggers spam filters.
