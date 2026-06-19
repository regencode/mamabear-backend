-- Update Setting rows for link keys to string type
UPDATE "Setting"
SET "type" = 'string'
WHERE "key" IN ('ig_link', 'fb_link', 'tr_link');
