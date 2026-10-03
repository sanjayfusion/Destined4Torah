-- Which lists/groups someone was added to (e.g. "Everyone, Event registrants"), comma-separated.
ALTER TABLE subscribers ADD COLUMN lists TEXT NOT NULL DEFAULT '';
