CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'unsubscribed', 'bounced', 'complained')),
  -- Random secret used in this person's confirm and unsubscribe links.
  token TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'website',
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  unsubscribed_at INTEGER,
  confirmation_sent_at INTEGER
);
CREATE INDEX idx_subscribers_status ON subscribers (status);

CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent')),
  total_recipients INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sent_at INTEGER
);

-- One row per (campaign, subscriber). The send queue is the 'pending' rows.
CREATE TABLE deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  subscriber_id INTEGER NOT NULL REFERENCES subscribers (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts INTEGER NOT NULL DEFAULT 0,
  claimed_at INTEGER,
  sent_at INTEGER,
  error TEXT,
  UNIQUE (campaign_id, subscriber_id)
);
CREATE INDEX idx_deliveries_queue ON deliveries (campaign_id, status);

-- Delivery, open, click, bounce and complaint events from the sending service.
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER,
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_events_campaign ON events (campaign_id, type);

CREATE TABLE rate_limits (
  key TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX idx_rate_limits ON rate_limits (key, at);
