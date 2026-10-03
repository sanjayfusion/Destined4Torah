-- When this person was last texted from the Texts helper (null = not yet this round).
ALTER TABLE contacts ADD COLUMN last_texted_at INTEGER;
