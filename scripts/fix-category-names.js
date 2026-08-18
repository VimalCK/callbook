/**
 * Set proper Title Case display names for all categories.
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '..', 'lokall.db'));

// Desired display names (slug → name)
const names = {
  'plumber': 'Plumbing',
  'electrician': 'Electrical',
  'carpenter': 'Carpentry',
  'painter': 'Painting',
  'cleaning': 'Cleaning',
  'gardener': 'Gardening',
  'appliance-repair': 'Appliance Repair',
  'pest-control': 'Pest Control',
  'mechanic': 'Mechanic',
  'other': 'Other',
  'handyman': 'Handyman',
  'flooring': 'Flooring',
  'transport': 'Transport',
  'solar': 'Solar & Energy',
  'blinds': 'Blinds & Curtains',
  'landscaping': 'Landscaping',
  'beauty': 'Beauty',
  'healthcare': 'Healthcare',
  'construction': 'Construction',
  'automotive': 'Automotive',
  'property': 'Property Management',
  'water': 'Water & Heating',
};

const update = db.prepare('UPDATE categories SET name = ? WHERE id = ?');

for (const [id, name] of Object.entries(names)) {
  update.run(name, id);
  console.log(`  ${id} → "${name}"`);
}

console.log(`\n✅ Done.`);
db.close();
