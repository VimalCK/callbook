UPDATE estates
SET slug = lower(replace(trim(name || '-' || description), ' ', '-'))
WHERE trim(coalesce(description, '')) != '';
