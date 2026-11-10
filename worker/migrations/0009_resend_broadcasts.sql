-- Newsletters go out as Resend Broadcasts, which do not count against the
-- transactional daily/monthly sending quota. Broadcasts send to Resend
-- Contacts, so confirmed subscribers are mirrored to Resend by the cron.

-- 0 = this person's details or status changed and must be pushed to Resend.
ALTER TABLE subscribers ADD COLUMN resend_synced INTEGER NOT NULL DEFAULT 0;
-- 1 = a Resend Contact exists for this address.
ALTER TABLE subscribers ADD COLUMN resend_exists INTEGER NOT NULL DEFAULT 0;
-- Only confirmed subscribers need a Resend Contact to start with.
UPDATE subscribers SET resend_synced = 1 WHERE status != 'confirmed';
CREATE INDEX idx_subscribers_resend_dirty ON subscribers (id) WHERE resend_synced = 0;

-- Any change to who someone is or whether they want email marks them for a re-sync,
-- whichever code path made the change (signup, confirm, unsubscribe, import, webhook).
CREATE TRIGGER subscribers_resend_dirty AFTER UPDATE OF email, name, status ON subscribers
WHEN OLD.email IS NOT NEW.email OR OLD.name IS NOT NEW.name OR OLD.status IS NOT NEW.status
BEGIN
  UPDATE subscribers SET resend_synced = 0 WHERE id = NEW.id;
END;

-- Addresses whose Resend Contact must be removed (subscriber deleted or email changed).
CREATE TABLE resend_deletions (email TEXT PRIMARY KEY);

CREATE TRIGGER subscribers_resend_delete AFTER DELETE ON subscribers
WHEN OLD.resend_exists = 1
BEGIN
  INSERT OR IGNORE INTO resend_deletions (email) VALUES (OLD.email);
END;

CREATE TRIGGER subscribers_resend_email_change AFTER UPDATE OF email ON subscribers
WHEN OLD.email IS NOT NEW.email AND OLD.resend_exists = 1
BEGIN
  INSERT OR IGNORE INTO resend_deletions (email) VALUES (OLD.email);
  UPDATE subscribers SET resend_exists = 0 WHERE id = NEW.id;
END;

-- broadcast_id: the Resend Broadcast that delivered this email.
-- unopened_of: when set, only people who did not open that earlier email get this one.
-- audience_segment_id: the temporary Resend Segment used for an unopened-only send.
ALTER TABLE campaigns ADD COLUMN broadcast_id TEXT;
ALTER TABLE campaigns ADD COLUMN unopened_of INTEGER;
ALTER TABLE campaigns ADD COLUMN audience_segment_id TEXT;

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
