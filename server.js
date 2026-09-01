import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import { existsSync, copyFileSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_NOTIFY_EMAIL = 'vimalchakkarakottungal@gmail.com';
const FROM_EMAIL = 'onboarding@resend.dev';
const SUGGESTION_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const SUGGESTION_RATE_LIMIT_MAX = 10;
const suggestionRateLimits = new Map();
const FEEDBACK_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const FEEDBACK_RATE_LIMIT_MAX = 10;
const feedbackRateLimits = new Map();
const APP_FEEDBACK_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const APP_FEEDBACK_RATE_LIMIT_MAX = 5;
const appFeedbackRateLimits = new Map();

// Database setup
const bundledDbPath = join(__dirname, 'lokall.db');
const dbPath = process.env.DATABASE_PATH || bundledDbPath;

if (process.env.DATABASE_PATH && !existsSync(dbPath) && existsSync(bundledDbPath)) {
  mkdirSync(dirname(dbPath), { recursive: true });
  copyFileSync(bundledDbPath, dbPath);
}

const db = new Database(dbPath);
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

  CREATE TABLE IF NOT EXISTS provider_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS app_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_type TEXT NOT NULL DEFAULT 'other',
    message TEXT NOT NULL,
    contact TEXT,
    page_context TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    event_key TEXT NOT NULL,
    estate_id INTEGER REFERENCES estates(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    event_count INTEGER NOT NULL DEFAULT 1,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applied_seeds (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_event_bucket
    ON analytics_events (event_type, estate_id, event_key);
`);

// Add estate_id columns if they don't exist (migration for existing DBs)
try { db.exec('ALTER TABLE providers ADD COLUMN estate_id INTEGER DEFAULT 1'); } catch { /* already exists */ }

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

function runSqlSeeds() {
  const seedsDir = join(__dirname, 'seeds');
  if (!existsSync(seedsDir)) return;

  const applied = new Set(db.prepare('SELECT name FROM applied_seeds').all().map(row => row.name));
  const seedFiles = readdirSync(seedsDir)
    .filter(name => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const name of seedFiles) {
    if (applied.has(name)) continue;

    const sql = readFileSync(join(seedsDir, name), 'utf-8').trim();
    if (!sql) continue;

    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO applied_seeds (name) VALUES (?)').run(name);
    })();
    console.log(`Applied seed: ${name}`);
  }
}

runSqlSeeds();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkSuggestionRateLimit(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const entry = suggestionRateLimits.get(ip);
  if (!entry || now >= entry.resetAt) {
    suggestionRateLimits.set(ip, { count: 1, resetAt: now + SUGGESTION_RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (entry.count >= SUGGESTION_RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function checkRateLimit(store, req, max, windowMs) {
  const now = Date.now();
  const ip = getClientIp(req);
  const entry = store.get(ip);
  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength);
}

function normalizePhone(value) {
  if (typeof value !== 'string') return '';
  const normalized = value.replace(/[^0-9+]/g, '');
  if (normalized.startsWith('+')) return `+${normalized.slice(1).replace(/\+/g, '')}`;
  return normalized.replace(/\+/g, '');
}

function isContactAlreadyExistsError(error) {
  const message = String(error?.message || '');
  return error?.code === 'SQLITE_CONSTRAINT_UNIQUE' && (
    message.includes('providers.estate_id, providers.phone_normalized') ||
    message.includes('idx_providers_estate_phone_unique')
  );
}

function sendContactAlreadyExists(res) {
  return res.status(409).json({ error: 'Contact already exists in this estate.' });
}

function parseSuggestedEdits(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function normalizeComparableValue(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean).join(', ');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value == null) return '';
  return String(value).trim();
}

function getProviderComparableValue(provider, field) {
  if (field === 'services') return JSON.parse(provider.services || '[]').join(', ');
  if (field === 'is_verified') return Boolean(provider.is_verified) ? 'true' : 'false';
  return normalizeComparableValue(provider[field]);
}

function getCleanSuggestedEditValue(field, value) {
  if (field === 'is_verified') return Boolean(value);
  if (field === 'services') return cleanText(Array.isArray(value) ? value.join(', ') : value, 300);

  const maxLengths = {
    name: 100,
    business_name: 100,
    category: 50,
    description: 500,
    phone: 30,
    whatsapp: 30,
    service_area: 120,
    working_hours: 120,
  };

  return cleanText(value, maxLengths[field] || 120);
}

function hasInvalidSuggestedEditValue(field, value) {
  if (field === 'is_verified') return false;
  if (field === 'services') return hasInvalidText(Array.isArray(value) ? value.join(', ') : value, 300);

  const maxLengths = {
    name: 100,
    business_name: 100,
    category: 50,
    description: 500,
    phone: 30,
    whatsapp: 30,
    service_area: 120,
    working_hours: 120,
  };

  return hasInvalidText(value, maxLengths[field] || 120);
}

function buildSuggestedEditsFromBody(body) {
  const fields = ['name', 'business_name', 'category', 'description', 'phone', 'whatsapp', 'service_area', 'working_hours', 'services', 'is_verified'];
  const edits = {};

  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    if (hasInvalidSuggestedEditValue(field, body[field])) {
      return { error: 'Some fields are too long or contain invalid characters.' };
    }

    const value = getCleanSuggestedEditValue(field, body[field]);
    if (field !== 'is_verified' && !normalizeComparableValue(value)) continue;
    edits[field] = value;
  }

  return { edits };
}

function mergeSuggestedEdits(provider, nextEdits) {
  const merged = { ...parseSuggestedEdits(provider.suggested_edits), ...nextEdits };

  for (const [field, value] of Object.entries(merged)) {
    if (normalizeComparableValue(value) === getProviderComparableValue(provider, field)) {
      delete merged[field];
    }
  }

  return Object.keys(merged).length > 0 ? JSON.stringify(merged) : null;
}

function applySuggestedEdits(provider) {
  const edits = parseSuggestedEdits(provider.suggested_edits);
  if (Object.keys(edits).length === 0) return null;

  return {
    estate_id: provider.estate_id,
    name: Object.prototype.hasOwnProperty.call(edits, 'name') ? edits.name : provider.name,
    business_name: Object.prototype.hasOwnProperty.call(edits, 'business_name') ? edits.business_name || null : provider.business_name,
    category: Object.prototype.hasOwnProperty.call(edits, 'category') ? edits.category : provider.category,
    description: Object.prototype.hasOwnProperty.call(edits, 'description') ? edits.description || '' : provider.description,
    phone: Object.prototype.hasOwnProperty.call(edits, 'phone') ? edits.phone : provider.phone,
    whatsapp: Object.prototype.hasOwnProperty.call(edits, 'whatsapp') ? edits.whatsapp || null : provider.whatsapp,
    service_area: Object.prototype.hasOwnProperty.call(edits, 'service_area') ? edits.service_area || null : provider.service_area,
    address: provider.address,
    working_hours: Object.prototype.hasOwnProperty.call(edits, 'working_hours') ? edits.working_hours || null : provider.working_hours,
    image: provider.image,
    is_verified: Object.prototype.hasOwnProperty.call(edits, 'is_verified') ? (edits.is_verified ? 1 : 0) : provider.is_verified,
    services: Object.prototype.hasOwnProperty.call(edits, 'services')
      ? JSON.stringify(String(edits.services || '').split(',').map(s => s.trim()).filter(Boolean))
      : provider.services,
  };
}

function hasInvalidText(value, maxLength) {
  if (value == null) return false;
  return typeof value !== 'string' || value.length > maxLength || /[\u0000-\u001f\u007f]/.test(value);
}

// Admin password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD environment variable is required');
}

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

function resolveEstateId(estateName) {
  if (!estateName) return null;
  const trimmedName = estateName.trim();
  if (!trimmedName) return null;

  const [namePart, ...descriptionParts] = trimmedName.split(',');
  const name = namePart.trim();
  const description = descriptionParts.map(part => part.trim()).filter(Boolean).join(', ');
  if (!name) return null;

  const slugSource = description ? `${name} ${description}` : name;
  const slug = slugSource.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const legacySlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const byExactSlug = db.prepare('SELECT id FROM estates WHERE slug = ?').get(trimmedName);
  if (byExactSlug) return byExactSlug.id;

  if (description) {
    const byNameAndLocation = db.prepare('SELECT id FROM estates WHERE LOWER(name) = LOWER(?) AND LOWER(description) = LOWER(?)').get(name, description);
    if (byNameAndLocation) return byNameAndLocation.id;

    const byGeneratedSlug = db.prepare('SELECT id FROM estates WHERE slug = ?').get(slug);
    if (byGeneratedSlug) return byGeneratedSlug.id;
  } else {
    const byName = db.prepare('SELECT id FROM estates WHERE LOWER(name) = LOWER(?)').get(name);
    if (byName) return byName.id;
  }

  if (description) {
    const byLegacySlug = db.prepare('SELECT id FROM estates WHERE slug = ? AND LOWER(description) = LOWER(?)').get(legacySlug, description);
    if (byLegacySlug) return byLegacySlug.id;
  }

  const byGeneratedSlug = db.prepare('SELECT id FROM estates WHERE slug = ?').get(slug);
  if (byGeneratedSlug) return byGeneratedSlug.id;

  const result = db.prepare('INSERT INTO estates (slug, name, description) VALUES (?, ?, ?)').run(slug, name, description);
  return result.lastInsertRowid;
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
  const includeDisabled = req.headers['x-admin-token'] === ADMIN_PASSWORD;
  const visibleStatuses = includeDisabled ? "'approved', 'pending', 'disabled'" : "'approved', 'pending'";
  let rows;
  if (estateSlug) {
    const estateId = getEstateId(estateSlug);
    if (!estateId) return res.json([]);
    rows = db.prepare(`SELECT providers.*, estates.slug AS estate_slug, estates.name AS estate_name FROM providers LEFT JOIN estates ON estates.id = providers.estate_id WHERE providers.estate_id = ? AND providers.status IN (${visibleStatuses}) ORDER BY
      CASE WHEN COALESCE(providers.business_name, providers.name) GLOB '[A-Za-z]*' THEN 0 ELSE 1 END,
      LOWER(COALESCE(providers.business_name, providers.name)) ASC`).all(estateId);
  } else {
    rows = db.prepare(`SELECT providers.*, estates.slug AS estate_slug, estates.name AS estate_name FROM providers LEFT JOIN estates ON estates.id = providers.estate_id WHERE providers.status IN (${visibleStatuses}) ORDER BY
      CASE WHEN COALESCE(providers.business_name, providers.name) GLOB '[A-Za-z]*' THEN 0 ELSE 1 END,
      LOWER(COALESCE(providers.business_name, providers.name)) ASC`).all();
  }
  res.json(rows.map(row => ({ ...row, is_verified: Boolean(row.is_verified), services: JSON.parse(row.services) })));
});

app.get('/api/providers/:id', (req, res) => {
  const row = db.prepare("SELECT providers.*, estates.slug AS estate_slug, estates.name AS estate_name FROM providers LEFT JOIN estates ON estates.id = providers.estate_id WHERE providers.id = ? AND providers.status = 'approved'").get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, is_verified: Boolean(row.is_verified), services: JSON.parse(row.services) });
});

app.get('/api/providers/:id/feedback', (req, res) => {
  const provider = db.prepare("SELECT id FROM providers WHERE id = ? AND status = 'approved'").get(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  const summary = db.prepare(`
    SELECT COUNT(*) AS count, ROUND(AVG(rating), 1) AS average_rating
    FROM provider_feedback
    WHERE provider_id = ?
  `).get(req.params.id);
  const items = db.prepare(`
    SELECT id, rating, comment, created_at
    FROM provider_feedback
    WHERE provider_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 100
  `).all(req.params.id);

  res.json({
    count: summary.count || 0,
    average_rating: summary.average_rating || 0,
    items,
  });
});

app.post('/api/analytics/estate-visit', (req, res) => {
  const slug = cleanText(req.body.estate, 120);
  const estateId = getEstateId(slug);
  if (!estateId) return res.status(404).json({ error: 'Estate not found' });

  db.prepare(`
    INSERT INTO analytics_events (event_type, event_key, estate_id, event_count)
    VALUES ('estate_visit', ?, ?, 1)
    ON CONFLICT(event_type, estate_id, event_key)
    DO UPDATE SET event_count = event_count + 1, updated_at = datetime('now')
  `).run(slug, estateId);
  res.status(201).json({ success: true });
});

app.post('/api/analytics/provider-open', (req, res) => {
  const providerId = Number(req.body.provider_id);
  if (!Number.isInteger(providerId) || providerId <= 0) return res.status(400).json({ error: 'Invalid provider id' });

  const provider = db.prepare("SELECT id, estate_id FROM providers WHERE id = ? AND status = 'approved'").get(providerId);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  db.prepare(`
    INSERT INTO analytics_events (event_type, event_key, estate_id, provider_id, event_count)
    VALUES ('provider_open', ?, ?, ?, 1)
    ON CONFLICT(event_type, estate_id, event_key)
    DO UPDATE SET event_count = event_count + 1, updated_at = datetime('now')
  `).run(String(provider.id), provider.estate_id, provider.id);
  res.status(201).json({ success: true });
});

app.post('/api/analytics/search', (req, res) => {
  const term = cleanText(req.body.term, 80).replace(/\s+/g, ' ');
  const slug = cleanText(req.body.estate, 120);
  if (term.length < 2) return res.status(400).json({ error: 'Search term is too short' });

  const estateId = getEstateId(slug);
  if (!estateId) return res.status(404).json({ error: 'Estate not found' });

  db.prepare(`
    INSERT INTO analytics_events (event_type, event_key, estate_id, event_count)
    VALUES ('search', ?, ?, 1)
    ON CONFLICT(event_type, estate_id, event_key)
    DO UPDATE SET event_count = event_count + 1, updated_at = datetime('now')
  `).run(term.toLowerCase(), estateId);
  res.status(201).json({ success: true });
});

app.post('/api/app-feedback', (req, res) => {
  const rateLimit = checkRateLimit(appFeedbackRateLimits, req, APP_FEEDBACK_RATE_LIMIT_MAX, APP_FEEDBACK_RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: 'Too many feedback submissions. Please try later.', retry_after_seconds: rateLimit.retryAfterSeconds });
  }

  if (cleanText(req.body.website, 200)) {
    return res.status(201).json({ success: true });
  }

  const allowedTypes = new Set(['issue', 'feature', 'correction', 'other']);
  const feedbackType = cleanText(req.body.feedback_type, 30).toLowerCase();
  const message = cleanText(req.body.message, 1000);
  const contact = cleanText(req.body.contact, 120) || null;
  const pageContext = cleanText(req.body.page_context, 200) || null;

  if (!allowedTypes.has(feedbackType)) return res.status(400).json({ error: 'Invalid feedback type' });
  if (message.length < 5) return res.status(400).json({ error: 'Please enter a short message' });

  db.prepare(`
    INSERT INTO app_feedback (feedback_type, message, contact, page_context)
    VALUES (?, ?, ?, ?)
  `).run(feedbackType, message, contact, pageContext);

  res.status(201).json({ success: true });
});

app.post('/api/providers/:id/feedback', (req, res) => {
  const rateLimit = checkRateLimit(feedbackRateLimits, req, FEEDBACK_RATE_LIMIT_MAX, FEEDBACK_RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Too many feedback submissions. Please try again later.' });
  }

  if (cleanText(req.body.website, 200)) {
    return res.status(400).json({ error: 'Invalid submission' });
  }

  const provider = db.prepare("SELECT id FROM providers WHERE id = ? AND status = 'approved'").get(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  const rating = Number(req.body.rating);
  const comment = cleanText(req.body.comment, 500);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }
  if (!comment) {
    return res.status(400).json({ error: 'Feedback comment is required.' });
  }
  if (hasInvalidText(req.body.comment, 500)) {
    return res.status(400).json({ error: 'Feedback is too long or contains invalid characters.' });
  }

  const result = db.prepare(
    'INSERT INTO provider_feedback (provider_id, rating, comment) VALUES (?, ?, ?)'
  ).run(req.params.id, rating, comment || null);

  res.status(201).json({ id: result.lastInsertRowid, status: 'submitted' });
});

app.post('/api/providers/:id/suggest-edits', async (req, res) => {
  try {
    const rateLimit = checkSuggestionRateLimit(req);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
      return res.status(429).json({ error: 'Too many suggestions. Please try again later.' });
    }

    if (cleanText(req.body.website, 200)) {
      return res.status(400).json({ error: 'Invalid submission' });
    }

    const provider = db.prepare("SELECT * FROM providers WHERE id = ? AND status = 'approved'").get(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    const { edits, error } = buildSuggestedEditsFromBody(req.body);
    if (error) return res.status(400).json({ error });
    if (!edits || Object.keys(edits).length === 0) {
      return res.status(400).json({ error: 'No suggested changes provided.' });
    }

    const suggestedEdits = mergeSuggestedEdits(provider, edits);
    if (!suggestedEdits) {
      db.prepare("UPDATE providers SET suggested_edits = NULL, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
      return res.json({ success: true, status: 'unchanged' });
    }

    db.prepare("UPDATE providers SET suggested_edits = ?, updated_at = datetime('now') WHERE id = ?").run(suggestedEdits, req.params.id);
    res.status(201).json({ id: provider.id, status: 'suggested' });

    notifySuggestionSubmitted({
      name: provider.name,
      phone: edits.phone || provider.phone,
      category: edits.category || provider.category,
      service_area: edits.service_area || provider.service_area,
      note: edits.description || 'Suggested edit for existing provider',
      estate: provider.estate_id,
    });
  } catch (err) {
    console.error('Failed to submit suggested edits:', err);
    res.status(500).json({ error: 'Could not submit suggested edits' });
  }
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
    counts = db.prepare("SELECT category, COUNT(*) as count FROM providers WHERE estate_id = ? AND status = 'approved' GROUP BY category").all(estateId);
  } else {
    counts = db.prepare("SELECT category, COUNT(*) as count FROM providers WHERE status = 'approved' GROUP BY category").all();
  }
  const countMap = Object.fromEntries(counts.map(c => [c.category, c.count]));
  res.json(cats.map(cat => ({ ...cat, provider_count: countMap[cat.id] || 0 })));
});

async function notifySuggestionSubmitted(suggestion) {
  if (!process.env.RESEND_API_KEY) return;

  const escapeHtml = (value) => String(value || '-')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ADMIN_NOTIFY_EMAIL,
        subject: `New Estate Contacts suggestion: ${suggestion.name}`,
        html: `
        <h2>New contact suggestion</h2>
        <p><strong>Estate, location:</strong> ${escapeHtml(suggestion.estate)}</p>
        <p><strong>Name:</strong> ${escapeHtml(suggestion.name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(suggestion.phone)}</p>
        <p><strong>Category:</strong> ${escapeHtml(suggestion.category)}</p>
        <p><strong>Service area:</strong> ${escapeHtml(suggestion.service_area)}</p>
        <p><strong>Notes:</strong> ${escapeHtml(suggestion.note)}</p>
        <p>Open the Estate Contacts admin page to review and approve it.</p>
      `,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send suggestion notification:', await response.text());
    }
  } catch (err) {
    console.error('Failed to send suggestion notification:', err);
  }
}

// Suggestions are stored as pending providers.
app.post('/api/suggestions', async (req, res) => {
  const rateLimit = checkSuggestionRateLimit(req);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Too many suggestions. Please try again later.' });
  }

  if (cleanText(req.body.website, 200)) {
    return res.status(400).json({ error: 'Invalid submission' });
  }

  const name = cleanText(req.body.name, 100);
  const business_name = cleanText(req.body.business_name, 100);
  const phone = cleanText(req.body.phone, 30);
  const whatsapp = cleanText(req.body.whatsapp, 30);
  const category = cleanText(req.body.category, 50);
  const service_area = cleanText(req.body.service_area, 120);
  const working_hours = cleanText(req.body.working_hours, 120);
  const note = cleanText(req.body.note, 500);
  const services = cleanText(req.body.services, 300);
  const estate = cleanText(req.body.estate, 140);
  const is_verified = Boolean(req.body.is_verified);

  if (!name || !phone || !category) {
    return res.status(400).json({ error: 'name, phone, and category are required' });
  }
  if (
    hasInvalidText(req.body.name, 100) ||
    hasInvalidText(req.body.business_name, 100) ||
    hasInvalidText(req.body.phone, 30) ||
    hasInvalidText(req.body.whatsapp, 30) ||
    hasInvalidText(req.body.category, 50) ||
    hasInvalidText(req.body.service_area, 120) ||
    hasInvalidText(req.body.working_hours, 120) ||
    hasInvalidText(req.body.note, 500) ||
    hasInvalidText(req.body.services, 300) ||
    hasInvalidText(req.body.estate, 140)
  ) {
    return res.status(400).json({ error: 'Some fields are too long or contain invalid characters.' });
  }
  const estateId = resolveEstateId(estate);
  if (!estateId) {
    return res.status(400).json({ error: 'Estate, location is required.' });
  }

  const estateRow = db.prepare('SELECT id, slug, name, description FROM estates WHERE id = ?').get(estateId);
  let result;
  try {
    result = db.prepare(`
      INSERT INTO providers (estate_id, name, business_name, category, description, phone, phone_normalized, whatsapp, service_area, working_hours, is_verified, services, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      estateId,
      name,
      business_name || null,
      category,
      note || '',
      phone,
      normalizePhone(phone),
      whatsapp || null,
      service_area || null,
      working_hours || null,
      is_verified ? 1 : 0,
      JSON.stringify(services ? services.split(',').map(s => s.trim()).filter(Boolean) : [])
    );
  } catch (err) {
    if (isContactAlreadyExistsError(err)) return sendContactAlreadyExists(res);
    throw err;
  }

  await notifySuggestionSubmitted({ name, phone, category, service_area, note, estate });
  res.status(201).json({ id: result.lastInsertRowid, status: 'pending', estate: estateRow });
});

app.get('/api/suggestions', (req, res) => {
  const estateSlug = req.query.estate;
  let rows;
  if (estateSlug) {
    const estateId = getEstateId(estateSlug);
    if (!estateId) return res.json([]);
    rows = db.prepare(`
      SELECT providers.id, providers.name, providers.phone, providers.category, providers.service_area,
        providers.description AS note,
        providers.business_name,
        providers.whatsapp,
        providers.working_hours,
        providers.is_verified,
        providers.services,
        providers.status,
        providers.suggested_edits,
        providers.created_at AS submitted_at,
        estates.slug AS estate_slug,
        estates.name AS estate_name,
        estates.description AS estate_description
      FROM providers
      LEFT JOIN estates ON estates.id = providers.estate_id
      WHERE providers.estate_id = ? AND (providers.status = 'pending' OR providers.suggested_edits IS NOT NULL)
      ORDER BY providers.created_at DESC
    `).all(estateId);
  } else {
    rows = db.prepare(`
      SELECT providers.id, providers.name, providers.phone, providers.category, providers.service_area,
        providers.description AS note,
        providers.business_name,
        providers.whatsapp,
        providers.working_hours,
        providers.is_verified,
        providers.services,
        providers.status,
        providers.suggested_edits,
        providers.created_at AS submitted_at,
        estates.slug AS estate_slug,
        estates.name AS estate_name,
        estates.description AS estate_description
      FROM providers
      LEFT JOIN estates ON estates.id = providers.estate_id
      WHERE providers.status = 'pending' OR providers.suggested_edits IS NOT NULL
      ORDER BY providers.created_at DESC
    `).all();
  }
  res.json(rows.map(row => ({
    ...row,
    metadata: JSON.stringify({
      business_name: row.business_name,
      whatsapp: row.whatsapp,
      working_hours: row.working_hours,
      is_verified: Boolean(row.is_verified),
      services: JSON.parse(row.services || '[]').join(', '),
    }),
    suggested_edits: parseSuggestedEdits(row.suggested_edits),
    estate_name: [row.estate_name, row.estate_description].filter(Boolean).join(', '),
  })));
});

app.get('/api/suggestions/status', (req, res) => {
  const ids = String(req.query.ids || '')
    .split(',')
    .map(id => Number(id.trim()))
    .filter(Number.isInteger);

  if (ids.length === 0) return res.json([]);

  const placeholders = ids.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT providers.id, providers.name, providers.status,
      trim(estates.name || CASE WHEN estates.description IS NOT NULL AND estates.description != '' THEN ', ' || estates.description ELSE '' END) AS estate_name
    FROM providers
    LEFT JOIN estates ON estates.id = providers.estate_id
    WHERE providers.id IN (${placeholders})
  `).all(...ids);

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
  const { name, business_name, category, description, phone, whatsapp, service_area, address, working_hours, image, is_verified, services, estate, estate_name } = req.body;
  if (!name || !phone || !category) return res.status(400).json({ error: 'name, phone, and category are required' });
  const estateId = resolveEstateId(estate_name) || getEstateId(estate) || 1;
  try {
    const result = db.prepare(`
      INSERT INTO providers (estate_id, name, business_name, category, description, phone, phone_normalized, whatsapp, service_area, address, working_hours, image, is_verified, services, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
    `).run(estateId, name, business_name || null, category, description || '', phone, normalizePhone(phone), whatsapp || null, service_area || null, address || null, working_hours || null, image || null, is_verified ? 1 : 0, JSON.stringify(services || []));
    res.status(201).json({ id: result.lastInsertRowid, estate_id: estateId });
  } catch (err) {
    if (isContactAlreadyExistsError(err)) return sendContactAlreadyExists(res);
    throw err;
  }
});

app.put('/api/admin/providers/:id', requireAdmin, (req, res) => {
  const { name, business_name, category, description, phone, whatsapp, service_area, address, working_hours, image, is_verified, is_disabled, services, estate_name } = req.body;
  const existing = db.prepare('SELECT id, estate_id FROM providers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const estateId = resolveEstateId(estate_name) || existing.estate_id;
  const status = is_disabled ? 'disabled' : 'approved';
  try {
    db.prepare(`
      UPDATE providers SET estate_id = ?, name = ?, business_name = ?, category = ?, description = ?, phone = ?, phone_normalized = ?, whatsapp = ?,
        service_area = ?, address = ?, working_hours = ?, image = ?, is_verified = ?, services = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(estateId, name, business_name || null, category, description || '', phone, normalizePhone(phone), whatsapp || null, service_area || null, address || null, working_hours || null, image || null, is_verified ? 1 : 0, JSON.stringify(services || []), status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (isContactAlreadyExistsError(err)) return sendContactAlreadyExists(res);
    throw err;
  }
});

app.get('/api/admin/providers/:id/feedback', requireAdmin, (req, res) => {
  const provider = db.prepare('SELECT id FROM providers WHERE id = ?').get(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  const items = db.prepare(`
    SELECT id, rating, comment, created_at
    FROM provider_feedback
    WHERE provider_id = ?
    ORDER BY created_at DESC, id DESC
  `).all(req.params.id);

  res.json(items);
});

app.delete('/api/admin/feedback/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM provider_feedback WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Feedback not found' });
  res.json({ success: true });
});

app.get('/api/admin/app-feedback', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT id, feedback_type, message, contact, page_context, created_at
    FROM app_feedback
    ORDER BY created_at DESC, id DESC
  `).all();
  res.json(rows);
});

app.delete('/api/admin/app-feedback/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM app_feedback WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Feedback not found' });
  res.json({ success: true });
});

app.get('/api/admin/analytics', requireAdmin, (req, res) => {
  const overview = db.prepare(`
    SELECT
      SUM(CASE WHEN event_type = 'estate_visit' THEN event_count ELSE 0 END) AS estate_visits,
      SUM(CASE WHEN event_type = 'provider_open' THEN event_count ELSE 0 END) AS provider_opens,
      SUM(CASE WHEN event_type = 'search' THEN event_count ELSE 0 END) AS searches
    FROM analytics_events
  `).get();

  const estateVisits = db.prepare(`
    SELECT
      estates.id,
      estates.slug,
      estates.name,
      estates.description,
      COALESCE(analytics_events.event_count, 0) AS visit_count,
      analytics_events.updated_at AS last_visited_at
    FROM estates
    LEFT JOIN analytics_events
      ON analytics_events.estate_id = estates.id
      AND analytics_events.event_type = 'estate_visit'
    ORDER BY visit_count DESC, LOWER(estates.name) ASC
  `).all();

  const topProviders = db.prepare(`
    SELECT
      providers.id,
      providers.name,
      providers.business_name,
      providers.category,
      providers.estate_id,
      estates.name AS estate_name,
      estates.description AS estate_description,
      COALESCE(analytics_events.event_count, 0) AS open_count,
      analytics_events.updated_at AS last_opened_at
    FROM providers
    LEFT JOIN estates ON estates.id = providers.estate_id
    LEFT JOIN analytics_events
      ON analytics_events.provider_id = providers.id
      AND analytics_events.event_type = 'provider_open'
    WHERE providers.status = 'approved'
      AND analytics_events.id IS NOT NULL
    ORDER BY open_count DESC, LOWER(COALESCE(providers.business_name, providers.name)) ASC
    LIMIT 5
  `).all();

  const topSearches = db.prepare(`
    SELECT
      analytics_events.event_key AS search_term,
      analytics_events.estate_id,
      estates.name AS estate_name,
      estates.description AS estate_description,
      analytics_events.event_count AS search_count,
      analytics_events.updated_at AS last_searched_at
    FROM analytics_events
    LEFT JOIN estates ON estates.id = analytics_events.estate_id
    WHERE analytics_events.event_type = 'search'
      AND analytics_events.event_key != ''
    ORDER BY search_count DESC, analytics_events.event_key ASC
    LIMIT 10
  `).all();

  res.json({
    totals: {
      estate_visits: overview.estate_visits || 0,
      provider_opens: overview.provider_opens || 0,
      searches: overview.searches || 0,
    },
    estate_visits: estateVisits,
    top_providers: topProviders.map(row => ({
      ...row,
      estate_name: [row.estate_name, row.estate_description].filter(Boolean).join(', '),
    })),
    top_searches: topSearches.map(row => ({
      ...row,
      estate_name: [row.estate_name, row.estate_description].filter(Boolean).join(', '),
    })),
  });
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

app.delete('/api/admin/estates/:id', requireAdmin, (req, res) => {
  const estateId = Number(req.params.id);
  if (!Number.isInteger(estateId) || estateId <= 0) return res.status(400).json({ error: 'Invalid estate id' });

  const estate = db.prepare('SELECT id FROM estates WHERE id = ?').get(estateId);
  if (!estate) return res.status(404).json({ error: 'Estate not found' });

  const deleteEstate = db.transaction(() => {
    db.prepare('DELETE FROM provider_feedback WHERE provider_id IN (SELECT id FROM providers WHERE estate_id = ?)').run(estateId);
    const providerResult = db.prepare('DELETE FROM providers WHERE estate_id = ?').run(estateId);
    db.prepare('DELETE FROM estates WHERE id = ?').run(estateId);
    return providerResult.changes;
  });

  const deletedProviders = deleteEstate();
  res.json({ success: true, deleted_providers: deletedProviders });
});

app.delete('/api/admin/suggestions/:id', requireAdmin, (req, res) => {
  const provider = db.prepare('SELECT id, status, suggested_edits FROM providers WHERE id = ?').get(req.params.id);
  if (!provider || (provider.status !== 'pending' && !provider.suggested_edits)) return res.status(404).json({ error: 'Not found' });

  if (provider.status === 'pending') {
    db.prepare("DELETE FROM providers WHERE id = ? AND status = 'pending'").run(req.params.id);
  } else {
    db.prepare("UPDATE providers SET suggested_edits = NULL, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  }

  res.json({ success: true });
});

app.put('/api/admin/suggestions/:id', requireAdmin, (req, res) => {
  const { name, phone, category, service_area, note, estate_name, business_name, whatsapp, working_hours, services, is_verified } = req.body;
  const existing = db.prepare("SELECT * FROM providers WHERE id = ? AND (status = 'pending' OR suggested_edits IS NOT NULL)").get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const estateId = resolveEstateId(estate_name) || existing.estate_id;
  try {
    if (existing.status !== 'pending') {
      const { edits, error } = buildSuggestedEditsFromBody({
        name,
        business_name,
        category,
        description: note,
        phone,
        whatsapp,
        service_area,
        working_hours,
        services,
        is_verified,
      });
      if (error) return res.status(400).json({ error });

      const suggestedEdits = mergeSuggestedEdits(existing, edits || {});
      db.prepare("UPDATE providers SET suggested_edits = ?, updated_at = datetime('now') WHERE id = ?").run(suggestedEdits, req.params.id);
      return res.json({ success: true, estate_id: existing.estate_id });
    }

    db.prepare(`
      UPDATE providers SET estate_id = ?, name = ?, business_name = ?, category = ?, description = ?, phone = ?, phone_normalized = ?, whatsapp = ?,
        service_area = ?, working_hours = ?, is_verified = ?, services = ?, updated_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `).run(estateId, name, business_name || null, category, note || '', phone, normalizePhone(phone), whatsapp || null, service_area || null, working_hours || null, is_verified ? 1 : 0, JSON.stringify(services ? services.split(',').map(s => s.trim()).filter(Boolean) : []), req.params.id);
    res.json({ success: true, estate_id: estateId });
  } catch (err) {
    if (isContactAlreadyExistsError(err)) return sendContactAlreadyExists(res);
    throw err;
  }
});

app.post('/api/admin/suggestions/:id/approve', requireAdmin, (req, res) => {
  const suggestion = db.prepare("SELECT providers.*, estates.name AS estate_name, estates.description AS estate_description FROM providers LEFT JOIN estates ON estates.id = providers.estate_id WHERE providers.id = ? AND (providers.status = 'pending' OR providers.suggested_edits IS NOT NULL)").get(req.params.id);
  if (!suggestion) return res.status(404).json({ error: 'Not found' });

  try {
    if (suggestion.status === 'pending') {
      db.prepare("UPDATE providers SET status = 'approved', suggested_edits = NULL, updated_at = datetime('now') WHERE id = ? AND status = 'pending'").run(req.params.id);
    } else {
      const updated = applySuggestedEdits(suggestion);
      if (!updated) return res.status(400).json({ error: 'No suggested edits to approve.' });

      db.prepare(`
        UPDATE providers SET estate_id = ?, name = ?, business_name = ?, category = ?, description = ?, phone = ?, phone_normalized = ?, whatsapp = ?,
          service_area = ?, address = ?, working_hours = ?, image = ?, is_verified = ?, services = ?, suggested_edits = NULL, updated_at = datetime('now')
        WHERE id = ?
      `).run(updated.estate_id, updated.name, updated.business_name, updated.category, updated.description, updated.phone, normalizePhone(updated.phone), updated.whatsapp, updated.service_area, updated.address, updated.working_hours, updated.image, updated.is_verified, updated.services, req.params.id);
    }

    res.json({ success: true, estate_id: suggestion.estate_id });
  } catch (err) {
    if (isContactAlreadyExistsError(err)) return sendContactAlreadyExists(res);
    throw err;
  }
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
  app.use(express.static(join(__dirname, 'dist'), {
    setHeaders: (res, filePath) => {
      res.setHeader('Cache-Control', 'no-store');
    },
  }));
  app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
  app.get('/{*path}', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Estate Contacts server running at http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
  if (err.code === 'ECONNRESET' || err.message?.includes('request aborted')) return;
  console.error(err);
  process.exit(1);
});
