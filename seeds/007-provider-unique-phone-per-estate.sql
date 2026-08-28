ALTER TABLE providers ADD COLUMN phone_normalized TEXT;

UPDATE providers
SET phone_normalized = replace(
  replace(
    replace(
      replace(
        replace(
          replace(
            replace(phone, ' ', ''),
          '-', ''),
        '(', ''),
      ')', ''),
    '.', ''),
  '/', ''),
'+', '+')
WHERE phone IS NOT NULL;

UPDATE providers
SET phone_normalized = NULL
WHERE phone_normalized = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_estate_phone_unique
ON providers (estate_id, phone_normalized)
WHERE phone_normalized IS NOT NULL AND phone_normalized != '';
