-- People who have a phone number but no email address. Kept apart from
-- `subscribers` on purpose, so they can never be emailed.
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  -- Digits only (last 10), used to avoid duplicates.
  phone_key TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL DEFAULT '',
  lists TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL DEFAULT '',
  -- 'subscribed', 'unsubscribed', or '' if unknown (text-message status from the old system).
  sms_status TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
