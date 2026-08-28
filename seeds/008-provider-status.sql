ALTER TABLE providers ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';

UPDATE providers
SET status = 'approved'
WHERE status IS NULL OR status = '' OR status = 'pending';
