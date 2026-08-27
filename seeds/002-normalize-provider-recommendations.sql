UPDATE providers
SET description = trim(
  substr(description, 1, instr(lower(description), 'recommended by residents') - 1) ||
  'Recommended by the Residents' ||
  CASE
    WHEN instr(substr(description, instr(lower(description), 'recommended by residents')), '.') > 0 THEN
      substr(
        description,
        instr(lower(description), 'recommended by residents') + instr(substr(description, instr(lower(description), 'recommended by residents')), '.')
      )
    ELSE ''
  END
)
WHERE lower(description) LIKE '%recommended by residents%:%';
