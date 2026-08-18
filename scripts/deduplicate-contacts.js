/**
 * Deduplicate and clean the extracted contacts.
 * Removes duplicates (same person shared multiple times) and non-service entries.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contacts = JSON.parse(readFileSync(join(__dirname, '..', 'extracted-contacts.json'), 'utf-8'));

// IDs to remove — duplicates or non-service contacts
const removeIds = new Set([
  // Katie duplicates — keep #1 "Katie BMK" (property management)
  3,   // Katie Castlethorn (same as Katie BMK)
  34,  // Katie Ballymakenny (same)
  
  // Sean Griffin / Firebird duplicates — keep #19 "Sean Ballymakenny Firebird"
  41,  // Sean Griffin Firebird BMK
  54,  // Sean Griffin Heat Pump Service Agent Firebird  
  55,  // Firebird (just the company)
  56,  // Sean Firebird
  57,  // Sean Griffin Firebird Heat pump Company
  74,  // Sean Griffin Firebird (another share)
  76,  // Sean Griffin Firebird (yet another)

  // Chris duplicates — keep #2 "Chris Sealing"
  12,  // Chris Pergola (same person)

  // Victor duplicates — keep #15 "Victor Castlethorn"
  24,  // Victor Ballymakenny (same person)
  69,  // Victor Snagger (same)

  // Adam electrician duplicates — keep #7 "Adam Electric"
  71,  // Adam Ballymakenny
  73,  // Adam BMK
  75,  // Adam Electrician

  // Innovating Interiors / Marc duplicates — keep #26
  44,  // Marc Flooring (same as Innovating Interiors Marc)
  47,  // Marc - Innovating Interiors
  85,  // Innovating Interiors - Marc

  // Ronan duplicates — keep #8 "Ronan Larcfild Patt"
  27,  // Ronan Patt (same)
  78,  // Ronan Plumber Ballymakenny (same)

  // Dan Plumber duplicates — keep #66
  96,  // Dan Plumber BMK Neighbor (same)

  // Lauren Agnew duplicates — keep #95
  87,  // Lauren Agnew BMK

  // Phone number duplicates
  // +353 (83) 436 8329 same as 0834368329 — keep #22 with name "Ronan"
  128, // 0834368329 (same number)

  // Non-service contacts (residents, not providers)
  11,  // BMK 85 James Mugeres (resident requesting to join)
  33,  // Ana 16 BMK Close (resident)
  58,  // William Correa Kekeny BMK (resident)
  72,  // Abdullah BMK Electrician (keep? actually this is a service)
  74,  // M£LW!N Drogheda (unclear)
  
  // Generic/useless entries
  91,  // 2 contacts
  99,  // 3 contacts (generic)
  93,  // 4 contacts

  // Not a service — job posting/personal number
  35,  // 0877865328 (QA role job posting, not a service)
  
  // Hotel/non-trade
  43,  // Hotel Slane

  // Craiggavon — hiring post, not a service
  68,  // Craiggavon
]);

const cleaned = contacts.filter(c => !removeIds.has(c.id));

// Renumber
cleaned.forEach((c, i) => { c.id = i + 1; });

writeFileSync(join(__dirname, '..', 'extracted-contacts-clean.json'), JSON.stringify(cleaned, null, 2));
console.log(`Original: ${contacts.length} contacts`);
console.log(`Removed: ${removeIds.size} duplicates/non-service entries`);
console.log(`Cleaned: ${cleaned.length} contacts`);
console.log(`\n✅ Written to extracted-contacts-clean.json`);
