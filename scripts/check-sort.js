import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '..', 'lokall.db'));
const rows = db.prepare("SELECT name, business_name FROM providers ORDER BY LOWER(COALESCE(business_name, name)) ASC LIMIT 20").all();
rows.forEach(r => console.log(r.business_name || r.name));
db.close();
