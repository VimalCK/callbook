ALTER TABLE providers ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';

UPDATE providers
SET status = 'approved'
WHERE status IS NULL OR status = '' OR status = 'pending';

ALTER TABLE estates ADD COLUMN status TEXT NOT NULL DEFAULT 'unavailable';

UPDATE estates
SET status = 'available'
WHERE status IS NULL OR status = '' OR status = 'unavailable';
