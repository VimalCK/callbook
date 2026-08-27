UPDATE providers
SET description = 'Recommended by the Residents'
WHERE lower(trim(description)) IN (
  'recommended by residents the resident',
  'recommended by resident the resident'
);

UPDATE providers
SET description = trim(
  substr(description, 1, instr(lower(description), 'recommended by residents :') - 1) ||
  'Recommended by the Residents' ||
  CASE
    WHEN instr(substr(description, instr(lower(description), 'recommended by residents :')), '.') > 0 THEN
      substr(
        description,
        instr(lower(description), 'recommended by residents :') + instr(substr(description, instr(lower(description), 'recommended by residents :')), '.')
      )
    ELSE ''
  END
)
WHERE lower(description) LIKE '%recommended by residents :%';

UPDATE providers
SET description = trim(
  substr(description, 1, instr(lower(description), 'recommended by resident :') - 1) ||
  'Recommended by the Residents' ||
  CASE
    WHEN instr(substr(description, instr(lower(description), 'recommended by resident :')), '.') > 0 THEN
      substr(
        description,
        instr(lower(description), 'recommended by resident :') + instr(substr(description, instr(lower(description), 'recommended by resident :')), '.')
      )
    ELSE ''
  END
)
WHERE lower(description) LIKE '%recommended by resident :%';

UPDATE providers
SET description = trim(
  substr(description, 1, instr(lower(description), 'recommended by :') - 1) ||
  'Recommended by the Residents' ||
  CASE
    WHEN instr(substr(description, instr(lower(description), 'recommended by :')), '.') > 0 THEN
      substr(
        description,
        instr(lower(description), 'recommended by :') + instr(substr(description, instr(lower(description), 'recommended by :')), '.')
      )
    ELSE ''
  END
)
WHERE lower(description) LIKE '%recommended by :%';
