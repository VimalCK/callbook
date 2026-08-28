WITH normalized AS (
  SELECT
    id,
    estate_id,
    replace(
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
    '+', '+') AS normalized_phone
  FROM providers
  WHERE phone IS NOT NULL
),
ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY estate_id, normalized_phone
      ORDER BY id
    ) AS row_num
  FROM normalized
  WHERE normalized_phone IS NOT NULL
    AND normalized_phone != ''
)
DELETE FROM providers
WHERE id IN (
  SELECT id FROM ranked WHERE row_num > 1
);
