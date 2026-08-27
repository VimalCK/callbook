UPDATE providers
SET description = 'Recommended by the Residents'
WHERE lower(trim(description)) IN (
  'recommended by residents',
  'recommended by resident',
  'recommended by residents the resident',
  'recommended by resident the resident'
);

INSERT INTO estates (slug, name, description)
SELECT 'ushers-mill', 'Ushers Mill', 'Drogheda'
WHERE NOT EXISTS (
  SELECT 1 FROM estates WHERE slug = 'ushers-mill'
);

INSERT INTO providers (
  estate_id,
  name,
  business_name,
  category,
  description,
  phone,
  whatsapp,
  service_area,
  address,
  working_hours,
  image,
  is_verified,
  services
)
SELECT
  (SELECT id FROM estates WHERE slug = 'ushers-mill'),
  p.name,
  p.business_name,
  p.category,
  p.description,
  p.phone,
  p.whatsapp,
  'Ushers Mill',
  p.address,
  p.working_hours,
  p.image,
  p.is_verified,
  p.services
FROM providers p
JOIN estates e ON e.id = p.estate_id
WHERE e.slug = 'ballymakenny-park'
  AND NOT EXISTS (
    SELECT 1
    FROM providers existing
    WHERE existing.estate_id = (SELECT id FROM estates WHERE slug = 'ushers-mill')
      AND existing.phone = p.phone
      AND existing.category = p.category
  );
