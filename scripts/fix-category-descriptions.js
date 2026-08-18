/**
 * Title-case the description field of all categories.
 * "Furniture, doors, wood work" → "Furniture, Doors, Wood Work"
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '..', 'lokall.db'));

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

const categories = db.prepare('SELECT id, description FROM categories').all();
const update = db.prepare('UPDATE categories SET description = ? WHERE id = ?');

for (const cat of categories) {
  if (!cat.description) continue;
  const fixed = titleCase(cat.description);
  if (fixed !== cat.description) {
    update.run(fixed, cat.id);
    console.log(`  ${cat.id}: "${cat.description}" → "${fixed}"`);
  }
}

console.log(`\n✅ Done.`);
db.close();
