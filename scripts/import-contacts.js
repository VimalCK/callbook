/**
 * Import cleaned contacts into the Estate Contacts database.
 * Creates the "Ballymakenny Park" estate if it doesn't exist,
 * then imports all contacts as providers.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', 'lokall.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Load cleaned contacts
const contacts = JSON.parse(readFileSync(join(__dirname, '..', 'extracted-contacts-clean.json'), 'utf-8'));

// Ensure estate exists
let estate = db.prepare("SELECT id FROM estates WHERE slug = 'ballymakenny-park'").get();
if (!estate) {
  const result = db.prepare("INSERT INTO estates (slug, name, description) VALUES ('ballymakenny-park', 'Ballymakenny Park', 'Ballymakenny Park residential estate')").run();
  estate = { id: result.lastInsertRowid };
  console.log('Created estate: Ballymakenny Park');
} else {
  console.log('Estate exists: Ballymakenny Park (id=' + estate.id + ')');
}

// Ensure categories exist
const existingCats = db.prepare('SELECT id FROM categories').all().map(c => c.id);
if (!existingCats.includes('other')) {
  db.prepare("INSERT OR IGNORE INTO categories (id, name, description, sort_order) VALUES ('other', 'Other', 'Miscellaneous services', 10)").run();
}

// Insert providers
const insert = db.prepare(`
  INSERT INTO providers (estate_id, name, business_name, category, description, phone, phone_normalized, whatsapp, service_area, is_verified, services)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
`);

function normalizePhone(value) {
  if (typeof value !== 'string') return '';
  const normalized = value.replace(/[^0-9+]/g, '');
  if (normalized.startsWith('+')) return `+${normalized.slice(1).replace(/\+/g, '')}`;
  return normalized.replace(/\+/g, '');
}

let imported = 0;
let skipped = 0;

for (const c of contacts) {
  let name = '';
  let phone = '';
  let description = '';

  if (c.type === 'vcf') {
    name = c.name;
    phone = ''; // VCF contacts don't have phone in our export
    description = c.context ? c.context.split('\n').find(l => l.includes(c.name))?.substring(0, 200) || '' : '';
  } else {
    // Phone type — try to extract name from message
    const msg = c.message || '';
    phone = c.phone;
    // Try to find a name near the number
    const nameMatch = msg.match(/(?:name[:\s]*|contact[:\s]*|called?\s+)([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i);
    if (nameMatch) {
      name = nameMatch[1];
    } else {
      // Use the message as description, number as name
      name = phone;
    }
    description = msg.substring(0, 200);
  }

  // Skip if no name
  if (!name || name === '2 contacts' || name === '3 contacts' || name === '4 contacts') {
    skipped++;
    continue;
  }

  // Check if already exists in this estate by name or normalized phone.
  const normalizedPhone = normalizePhone(phone);
  const existingProviders = db.prepare('SELECT id, name, phone, phone_normalized FROM providers WHERE estate_id = ?').all(estate.id);
  const existing = existingProviders.find(provider =>
    provider.name === name ||
    (normalizedPhone && (provider.phone_normalized === normalizedPhone || normalizePhone(provider.phone) === normalizedPhone))
  );
  if (existing) {
    skipped++;
    continue;
  }

  insert.run(
    estate.id,
    name,
    null, // business_name
    'other', // category — can be recategorized by admin later
    description,
    phone || '',
    normalizedPhone,
    null, // whatsapp
    'Ballymakenny Park',
    '[]' // services
  );
  imported++;
}

console.log(`\n✅ Import complete`);
console.log(`   Imported: ${imported}`);
console.log(`   Skipped (duplicates/empty): ${skipped}`);
console.log(`   Total in DB: ${db.prepare('SELECT COUNT(*) as n FROM providers WHERE estate_id = ?').get(estate.id).n} providers`);

db.close();
