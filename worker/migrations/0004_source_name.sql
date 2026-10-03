-- Where a person was added from, as recorded by the old system (e.g. "Square", "Event", "Added by you").
ALTER TABLE subscribers ADD COLUMN source_name TEXT NOT NULL DEFAULT '';
