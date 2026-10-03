-- Per-email banner image (stored in KV under this key) and its alt text.
ALTER TABLE campaigns ADD COLUMN banner_image TEXT NOT NULL DEFAULT '';
ALTER TABLE campaigns ADD COLUMN banner_alt TEXT NOT NULL DEFAULT '';
