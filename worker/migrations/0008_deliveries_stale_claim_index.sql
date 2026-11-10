-- The per-minute cron releases stuck deliveries with:
--   UPDATE deliveries SET status = 'pending', claimed_at = NULL
--   WHERE status = 'sending' AND claimed_at < ?
-- Without this index that query scans the whole deliveries table every
-- minute (~5M rows read/day), exhausting the D1 free-tier read limit.
CREATE INDEX IF NOT EXISTS idx_deliveries_status_claimed ON deliveries (status, claimed_at);
