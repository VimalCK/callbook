/**
 * Auto-categorize providers based on their name and description keywords.
 * Updates the database directly.
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '..', 'lokall.db'));

// Ensure new categories exist
const newCategories = [
  ['handyman', 'Handyman', 'General repairs, odd jobs', 11],
  ['flooring', 'Flooring', 'Carpet, laminate, hardwood', 12],
  ['transport', 'Transport', 'Taxi, drivers, moving vans', 13],
  ['solar', 'Solar & Energy', 'Solar panels, batteries, insulation', 14],
  ['blinds', 'Blinds & Curtains', 'Blinds, curtains, window coverings', 15],
  ['landscaping', 'Landscaping', 'Paving, fencing, gardens', 16],
  ['beauty', 'Beauty', 'Hair, lash, nails, skincare', 17],
  ['healthcare', 'Healthcare', 'Doctor, GP, therapist', 18],
  ['construction', 'Construction', 'Building, attic, extensions', 19],
  ['automotive', 'Automotive', 'Car repair, panel beating, NCT', 20],
  ['property', 'Property Mgmt', 'Estate management, snagging', 21],
  ['water', 'Water & Heating', 'Plumbing, heating, boilers, water filters', 22],
];

const insertCat = db.prepare('INSERT OR IGNORE INTO categories (id, name, description, sort_order) VALUES (?, ?, ?, ?)');
for (const cat of newCategories) {
  insertCat.run(...cat);
}
console.log('Categories ensured.\n');

// Keyword-to-category mapping (checked in order, first match wins)
const rules = [
  // Electrician
  { keywords: ['electric', 'electrician', 'wiring', 'socket', 'lighting', 'light fixture'], category: 'electrician' },
  // Plumber / Water / Heating
  { keywords: ['plumb', 'plumber', 'plumbing', 'water filter', 'water softener', 'boiler', 'heating', 'heat pump', 'firebird', 'calpeda', 'banshee'], category: 'water' },
  // Solar
  { keywords: ['solar', 'panel', 'battery system', 'inverter'], category: 'solar' },
  // Flooring
  { keywords: ['floor', 'flooring', 'carpet', 'laminate', 'hardwood'], category: 'flooring' },
  // Handyman
  { keywords: ['handyman', 'handy man', 'odd job', 'general repair'], category: 'handyman' },
  // Painting
  { keywords: ['paint', 'painter'], category: 'painter' },
  // Cleaning
  { keywords: ['clean', 'cleaner', 'cleaning'], category: 'cleaning' },
  // Construction / Building
  { keywords: ['build', 'builder', 'attic', 'construction', 'concrete', 'pergola', 'extension'], category: 'construction' },
  // Blinds & Curtains
  { keywords: ['blind', 'curtain', 'window covering'], category: 'blinds' },
  // Landscaping
  { keywords: ['landscap', 'paving', 'garden', 'fence', 'fencing'], category: 'landscaping' },
  // Transport / Driving
  { keywords: ['driver', 'driving', 'taxi', 'van', 'mover', 'moving', 'man with van'], category: 'transport' },
  // Automotive
  { keywords: ['car wash', 'car repair', 'panel beat', 'motor', 'mechanic', 'nct'], category: 'automotive' },
  // Beauty
  { keywords: ['lash', 'nail', 'manicure', 'hair', 'beauty', 'braid', 'trancista'], category: 'beauty' },
  // Healthcare
  { keywords: ['doctor', 'gp', 'health', 'therapist', 'medical'], category: 'healthcare' },
  // Property management / Snagging
  { keywords: ['snag', 'snagger', 'snagging', 'castlethorn', 'katie bmk', 'katie ballymakenny', 'lauren agnew', 'property', 'estate manage'], category: 'property' },
  // Pest control
  { keywords: ['pest', 'termite', 'cockroach', 'rodent'], category: 'pest-control' },
  // Carpenter / Furniture / Drawers
  { keywords: ['carpenter', 'carpentry', 'furniture', 'drawer', 'wardrobe', 'cabinet', 'interiors', 'innovating interiors'], category: 'carpenter' },
  // Appliance repair
  { keywords: ['appliance', 'fridge', 'washing machine', 'microwave'], category: 'appliance-repair' },
  // Locksmith
  { keywords: ['lock', 'locksmith', 'key cut', 'chaveiro'], category: 'other' },
  // Windows
  { keywords: ['window clean', 'window', 'glass'], category: 'other' },
  // Feature wall / Decorative
  { keywords: ['feature wall', 'wall'], category: 'painter' },
  // Engineering
  { keywords: ['engineer', 'engineering', 'consultancy'], category: 'construction' },
  // Ventilation
  { keywords: ['ventilat'], category: 'construction' },
  // Ice cream / Food / Bakery
  { keywords: ['ice cream', 'icecream', 'cake', 'bolo', 'food', 'bites', 'bloom'], category: 'other' },
];

// Get all providers
const providers = db.prepare('SELECT id, name, business_name, description, category FROM providers').all();

let updated = 0;
let unchanged = 0;

const updateStmt = db.prepare('UPDATE providers SET category = ? WHERE id = ?');

for (const p of providers) {
  // Skip if already properly categorized (not "other")
  if (p.category !== 'other') {
    unchanged++;
    continue;
  }

  const searchText = [p.name, p.business_name, p.description].filter(Boolean).join(' ').toLowerCase();

  let matched = false;
  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (searchText.includes(kw)) {
        updateStmt.run(rule.category, p.id);
        console.log(`  ✓ "${p.name}" → ${rule.category} (matched: "${kw}")`);
        updated++;
        matched = true;
        break;
      }
    }
    if (matched) break;
  }

  if (!matched) {
    console.log(`  ? "${p.name}" → kept as "other"`);
    unchanged++;
  }
}

console.log(`\n✅ Done. Updated: ${updated}, Unchanged: ${unchanged}, Total: ${providers.length}`);
db.close();
