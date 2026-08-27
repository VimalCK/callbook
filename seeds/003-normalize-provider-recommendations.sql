UPDATE providers
SET description = trim(
  substr(description, 1, instr(lower(description), 'recommended by resident') - 1) ||
  'Recommended by the Residents' ||
  CASE
    WHEN instr(substr(description, instr(lower(description), 'recommended by resident')), '.') > 0 THEN
      substr(
        description,
        instr(lower(description), 'recommended by resident') + instr(substr(description, instr(lower(description), 'recommended by resident')), '.')
      )
    ELSE ''
  END
)
WHERE lower(description) LIKE '%recommended by resident%:%';
