import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Database setup
const db = new Database(join(__dirname, 'lokall.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS estates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estate_id INTEGER DEFAULT 1,
    name TEXT NOT NULL,
    business_name TEXT,
    category TEXT NOT NULL REFERENCES categories(id),
    description TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL,
    whatsapp TEXT,
    service_area TEXT,
    address TEXT,
    working_hours TEXT,
    image TEXT,
    is_verified INTEGER NOT NULL DEFAULT 0,
    services TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estate_id INTEGER DEFAULT 1,
    estate_name TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    category TEXT NOT NULL,
    service_area TEXT,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Add estate_id columns if they don't exist (migration for existing DBs)
try { db.exec('ALTER TABLE providers ADD COLUMN estate_id INTEGER DEFAULT 1'); } catch { /* already exists */ }
try { db.exec('ALTER TABLE suggestions ADD COLUMN estate_id INTEGER DEFAULT 1'); } catch { /* already exists */ }
try { db.exec('ALTER TABLE suggestions ADD COLUMN estate_name TEXT'); } catch { /* already exists */ }

// Seed data if estates table is empty
const estateCount = db.prepare('SELECT COUNT(*) as n FROM estates').get();
if (estateCount.n === 0) {
  db.prepare('INSERT INTO estates (slug, name, description) VALUES (?, ?, ?)').run(
    'ballymakenny-park', 'Ballymakenny Park', 'Ballymakenny Park residential estate'
  );
  db.prepare('INSERT INTO estates (slug, name, description) VALUES (?, ?, ?)').run(
    'riverside-manor', 'Riverside Manor', 'Riverside Manor housing estate'
  );
  console.log('Estates seeded.');
}

const catCount = db.prepare('SELECT COUNT(*) as n FROM categories').get();
if (catCount.n === 0) {
  const insertCat = db.prepare('INSERT INTO categories (id, name, description, sort_order) VALUES (?, ?, ?, ?)');
  const cats = [
    ['plumber', 'Plumbing', 'Pipes, leaks, taps, tanks', 1],
    ['electrician', 'Electrical', 'Wiring, switches, appliances', 2],
    ['carpenter', 'Carpentry', 'Furniture, doors, wood work', 3],
    ['painter', 'Painting', 'Interior, exterior, texture', 4],
    ['cleaning', 'Cleaning', 'Home, deep clean, regular', 5],
    ['gardener', 'Gardening', 'Plants, landscaping, lawn', 6],
    ['appliance-repair', 'Appliances', 'AC, fridge, washing machine', 7],
    ['pest-control', 'Pest Control', 'Termites, cockroaches, rats', 8],
    ['mechanic', 'Mechanic', 'Car, bike, breakdown', 9],
    ['other', 'Other', 'Locks, hardware, misc', 10],
  ];
  for (const c of cats) insertCat.run(...c);

  const insertProv = db.prepare(`
    INSERT INTO providers (estate_id, name, business_name, category, description, phone, whatsapp, service_area, working_hours, is_verified, services)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const provs = [
    [1, 'Rajesh Sharma', 'Sharma Plumbing Works', 'plumber', 'Pipe fitting, leak repairs, and bathroom installations.', '+919876543210', '919876543210', 'Sectors 10–25', 'Mon–Sat, 8 AM – 7 PM', 1, '["Pipe repair","Leak fixing","Bathroom fitting","Water tank"]'],
    [1, 'Suresh Patel', 'Patel Electrical Services', 'electrician', 'Wiring, MCB repairs, fan/light installation, inverter setup.', '+919876543211', '919876543211', 'All Sectors', 'Mon–Sat, 9 AM – 8 PM', 1, '["Wiring","MCB repair","Fan installation","Inverter setup"]'],
    [1, 'Vijay Kumar', 'Vijay Carpenter & Interiors', 'carpenter', 'Custom furniture, modular kitchen, and wood repair.', '+919876543212', '919876543212', 'Sectors 5–20', 'Mon–Sat, 9 AM – 6 PM', 0, '["Custom furniture","Modular kitchen","Door repair","Polishing"]'],
    [1, 'Anita Verma', 'Fresh Coat Painters', 'painter', 'Interior/exterior painting, texture, waterproofing.', '+919876543213', '919876543213', 'All Sectors', 'Mon–Sat, 8 AM – 6 PM', 1, '["Interior painting","Exterior painting","Texture","Waterproofing"]'],
    [1, 'Mohammed Iqbal', 'CleanPro Services', 'cleaning', 'Deep cleaning, regular housekeeping, move-in/out cleaning.', '+919876543214', '919876543214', 'Sectors 1–30', 'All days, 7 AM – 9 PM', 1, '["Deep cleaning","Housekeeping","Sofa cleaning","Kitchen cleaning"]'],
    [1, 'Ravi Shankar', 'GreenTouch Gardens', 'gardener', 'Garden maintenance, landscaping, terrace gardens.', '+919876543215', null, 'Sectors 10–20', 'Mon–Sat, 6 AM – 12 PM', 0, '["Garden maintenance","Landscaping","Plant care","Terrace gardens"]'],
    [1, 'Deepak Mehra', 'QuickFix Appliances', 'appliance-repair', 'Washing machine, fridge, microwave, RO repair.', '+919876543216', '919876543216', 'All Sectors', 'Mon–Sun, 9 AM – 8 PM', 1, '["Washing machine","Fridge repair","Microwave","RO service"]'],
    [1, 'Priya Nair', 'PestGuard Solutions', 'pest-control', 'Termite, cockroach, mosquito, rodent treatment.', '+919876543217', '919876543217', 'All Sectors', 'Mon–Sat, 10 AM – 6 PM', 0, '["Termite treatment","Cockroach control","Mosquito fogging","Rodent control"]'],
    [1, 'Arun Gupta', 'Gupta Auto Works', 'mechanic', 'Car/bike servicing, breakdown help, denting-painting.', '+919876543218', '919876543218', 'Near Sector 12 Market', 'Mon–Sat, 8 AM – 7 PM', 1, '["Car servicing","Two-wheeler repair","Denting & painting","Battery"]'],
    [1, 'Harish Joshi', 'Joshi Hardware & Locks', 'other', 'Lock repair, key duplication, door hardware.', '+919876543221', '919876543221', 'Sector 15 Market', 'Mon–Sat, 10 AM – 8 PM', 0, '["Lock repair","Key duplication","Door hardware","Minor repairs"]'],
  ];
  for (const p of provs) insertProv.run(...p);

  console.log('Database seeded with sample data.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Admin password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@Apache3749';

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Helper: resolve estate_id from slug
function getEstateId(slug) {
  if (!slug) return null;
  const row = db.prepare('SELECT id FROM estates WHERE slug = ?').get(slug);
  return row ? row.id : null;
}

// ===== API ROUTES =====

// Estates
app.get('/api/estates', (req, res) => {
  const estates = db.prepare('SELECT id, slug, name, description FROM estates ORDER BY name').all();
  res.json(estates);
});

app.get('/api/estates/:slug', (req, res) => {
  const estate = db.prepare('SELECT id, slug, name, description FROM estates WHERE slug = ?').get(req.params.slug);
  if (!estate) return res.status(404).json({ error: 'Estate not found' });
  res.json(estate);
});

// Providers — filtered by estate
app.get('/api/providers', (req, res) => {
  const estateSlug = req.query.estate;
  let rows;
  if (estateSlug) {
    const estateId = getEstateId(estateSlug);
    if (!estateId) return res.json([]);
    rows = db.prepare(`SELECT * FROM providers WHERE estate_id = ? ORDER BY
      CASE WHEN COALESCE(business_name, name) GLOB '[A-Za-z]*' THEN 0 ELSE 1 END,
      LOWER(COALESCE(business_name, name)) ASC`).all(estateId);
  } else {
    rows = db.prepare(`SELECT * FROM providers ORDER BY
      CASE WHEN COALESCE(business_name, name) GLOB '[A-Za-z]*' THEN 0 ELSE 1 END,
      LOWER(COALESCE(business_name, name)) ASC`).all();
  }
  res.json(rows.map(row => ({ ...row, is_verified: Boolean(row.is_verified), services: JSON.parse(row.services) })));
});

app.get('/api/providers/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM providers WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, is_verified: Boolean(row.is_verified), services: JSON.parse(row.services) });
});

// Categories — with counts filtered by estate
app.get('/api/categories', (req, res) => {
  const estateSlug = req.query.estate;
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  let counts;
  if (estateSlug) {
    const estateId = getEstateId(estateSlug);
    if (!estateId) {
      return res.json(cats.map(cat => ({ ...cat, provider_count: 0 })));
    }
    counts = db.prepare('SELECT category, COUNT(*) as count FROM providers WHERE estate_id = ? GROUP BY category').all(estateId);
  } else {
    counts = db.prepare('SELECT category, COUNT(*) as count FROM providers GROUP BY category').all();
  }
  const countMap = Object.fromEntries(counts.map(c => [c.category, c.count]));
  res.json(cats.map(cat => ({ ...cat, provider_count: countMap[cat.id] || 0 })));
});

// Suggestions — store estate_name as text (estate may not exist yet)
app.post('/api/suggestions', (req, res) => {
  const { name, phone, category, service_area, note, estate } = req.body;
  if (!name || !phone || !category) {
    return res.status(400).json({ error: 'name, phone, and category are required' });
  }
  // Store the estate slug/name as text — don't resolve to estate_id yet
  const result = db.prepare(
    'INSERT INTO suggestions (estate_id, name, phone, category, service_area, note, estate_name) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(0, name, phone, category, service_area || null, note || null, estate || null);
  res.status(201).json({ id: result.lastInsertRowid, status: 'pending' });
});

app.get('/api/suggestions', (req, res) => {
  const estateSlug = req.query.estate;
  let rows;
  if (estateSlug) {
    const estateId = getEstateId(estateSlug);
    if (!estateId) return res.json([]);
    rows = db.prepare('SELECT * FROM suggestions WHERE estate_id = ? ORDER BY submitted_at DESC').all(estateId);
  } else {
    rows = db.prepare('SELECT * FROM suggestions ORDER BY submitted_at DESC').all();
  }
  res.json(rows);
});

// Admin
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

app.post('/api/admin/providers', requireAdmin, (req, res) => {
  const { name, business_name, category, description, phone, whatsapp, service_area, address, working_hours, image, is_verified, services, estate } = req.body;
  if (!name || !phone || !category) return res.status(400).json({ error: 'name, phone, and category are required' });
  const estateId = getEstateId(estate) || 1;
  const result = db.prepare(`
    INSERT INTO providers (estate_id, name, business_name, category, description, phone, whatsapp, service_area, address, working_hours, image, is_verified, services)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(estateId, name, business_name || null, category, description || '', phone, whatsapp || null, service_area || null, address || null, working_hours || null, image || null, is_verified ? 1 : 0, JSON.stringify(services || []));
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/admin/providers/:id', requireAdmin, (req, res) => {
  const { name, business_name, category, description, phone, whatsapp, service_area, address, working_hours, image, is_verified, services } = req.body;
  const existing = db.prepare('SELECT id FROM providers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare(`
    UPDATE providers SET name = ?, business_name = ?, category = ?, description = ?, phone = ?, whatsapp = ?,
      service_area = ?, address = ?, working_hours = ?, image = ?, is_verified = ?, services = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(name, business_name || null, category, description || '', phone, whatsapp || null, service_area || null, address || null, working_hours || null, image || null, is_verified ? 1 : 0, JSON.stringify(services || []), req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/providers/:id', requireAdmin, (req, res) => {
  const provider = db.prepare('SELECT estate_id FROM providers WHERE id = ?').get(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM providers WHERE id = ?').run(req.params.id);
  // Auto-delete estate if no providers remain in it
  const remaining = db.prepare('SELECT COUNT(*) as n FROM providers WHERE estate_id = ?').get(provider.estate_id);
  if (remaining.n === 0) {
    db.prepare('DELETE FROM estates WHERE id = ?').run(provider.estate_id);
  }
  res.json({ success: true });
});

app.delete('/api/admin/suggestions/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM suggestions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.put('/api/admin/suggestions/:id', requireAdmin, (req, res) => {
  const { name, phone, category, service_area, note, estate_name } = req.body;
  const existing = db.prepare('SELECT id FROM suggestions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare(`
    UPDATE suggestions SET name = ?, phone = ?, category = ?, service_area = ?, note = ?, estate_name = ?
    WHERE id = ?
  `).run(name, phone, category, service_area || null, note || null, estate_name || null, req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/suggestions/:id/approve', requireAdmin, (req, res) => {
  const suggestion = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(req.params.id);
  if (!suggestion) return res.status(404).json({ error: 'Not found' });

  // Resolve estate: use estate_name to find or create the estate
  let estateId = 1; // default fallback
  const estateName = suggestion.estate_name;
  if (estateName) {
    // Check if it's a slug of an existing estate
    const bySlug = db.prepare('SELECT id FROM estates WHERE slug = ?').get(estateName);
    if (bySlug) {
      estateId = bySlug.id;
    } else {
      // Check by name
      const byName = db.prepare('SELECT id FROM estates WHERE LOWER(name) = LOWER(?)').get(estateName);
      if (byName) {
        estateId = byName.id;
      } else {
        // Create a new estate now
        const slug = estateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const result = db.prepare('INSERT INTO estates (slug, name, description) VALUES (?, ?, ?)').run(slug, estateName, '');
        estateId = result.lastInsertRowid;
      }
    }
  }

  db.prepare('INSERT INTO providers (estate_id, name, category, phone, service_area, description) VALUES (?, ?, ?, ?, ?, ?)').run(
    estateId, suggestion.name, suggestion.category, suggestion.phone, suggestion.service_area || null, suggestion.note || ''
  );
  db.prepare("UPDATE suggestions SET status = 'approved' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Admin: manage categories
app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { id, name, description } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name are required' });
  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (existing) return res.status(409).json({ error: 'Category with this id already exists' });
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM categories').get();
  const sortOrder = (maxOrder?.m || 0) + 1;
  db.prepare('INSERT INTO categories (id, name, description, sort_order) VALUES (?, ?, ?, ?)').run(id, name, description || '', sortOrder);
  res.status(201).json({ id, name, description: description || '', sort_order: sortOrder });
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const catId = req.params.id;
  const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(catId);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  // Don't allow deleting if providers still reference it
  const provCount = db.prepare('SELECT COUNT(*) as n FROM providers WHERE category = ?').get(catId);
  if (provCount.n > 0) return res.status(409).json({ error: `Cannot delete: ${provCount.n} provider(s) still use this category` });
  db.prepare('DELETE FROM categories WHERE id = ?').run(catId);
  res.json({ success: true });
});

app.put('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const catId = req.params.id;
  const { name, description } = req.body;
  const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(catId);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(name || '', description || '', catId);
  res.json({ success: true });
});

// Admin: manage estates
app.post('/api/admin/estates', requireAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = db.prepare('SELECT id FROM estates WHERE slug = ?').get(slug);
  if (existing) return res.status(409).json({ error: 'Estate with this name already exists' });
  const result = db.prepare('INSERT INTO estates (slug, name, description) VALUES (?, ?, ?)').run(slug, name, description || '');
  res.status(201).json({ id: result.lastInsertRowid, slug });
});

// ===== FRONTEND =====

const isDev = process.argv.includes('--dev');
if (isDev) {
  const { createServer: createViteServer } = await import('vite');
  const { readFileSync } = await import('fs');
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });
  app.use(async (req, res, next) => {
    const isHtmlRequest =
      req.method === 'GET' &&
      req.headers.accept?.includes('text/html') &&
      !req.url.startsWith('/api') &&
      !req.url.startsWith('/@') &&
      !req.url.startsWith('/src') &&
      !req.url.startsWith('/node_modules') &&
      !req.url.includes('.');
    if (!isHtmlRequest) return next();
    try {
      const rawHtml = readFileSync(join(__dirname, 'index.html'), 'utf-8');
      const html = await vite.transformIndexHtml(req.originalUrl, rawHtml);
      res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(join(__dirname, 'dist')));
  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
  app.get('/{*path}', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Callbook server running at http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
  if (err.code === 'ECONNRESET' || err.message?.includes('request aborted')) return;
  console.error(err);
  process.exit(1);
});
