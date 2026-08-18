/**
 * Extract service contacts mentioned in WhatsApp group chat.
 * 
 * This script parses a WhatsApp export .txt file and extracts:
 * - Phone numbers mentioned INSIDE message bodies (not the sender's number)
 * - .vcf file names (shared contacts)
 * - Surrounding context to understand what service was discussed
 * 
 * Usage: node scripts/extract-contacts.js "WhatsApp Chat with Ballymakenny Park Residents.txt"
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const filePath = process.argv[2] || join(__dirname, '..', 'WhatsApp Chat with Ballymakenny Park Residents.txt');
const raw = readFileSync(filePath, 'utf-8');

// WhatsApp message line pattern: "date, time - sender: message"
const msgPattern = /^(\d{1,2}\/\d{1,2}\/\d{2,4},\s\d{1,2}:\d{2}\s[AP]M)\s-\s(.+?):\s(.+)$/;

// Parse all messages
const lines = raw.split('\n');
const messages = [];
for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(msgPattern);
  if (match) {
    let body = match[3];
    // Multi-line messages: subsequent lines that don't match the pattern belong to previous message
    while (i + 1 < lines.length && !lines[i + 1].match(msgPattern) && lines[i + 1].trim()) {
      i++;
      body += '\n' + lines[i];
    }
    messages.push({ date: match[1], sender: match[2], body });
  }
}

console.log(`Parsed ${messages.length} messages.\n`);

// Collect all unique sender numbers (group members) — we want to EXCLUDE these
const senderNumbers = new Set();
for (const msg of messages) {
  const senderMatch = msg.sender.match(/\+353[\s\d]+/);
  if (senderMatch) {
    senderNumbers.add(senderMatch[0].replace(/\s/g, ''));
  }
}

console.log(`Found ${senderNumbers.size} unique group member numbers (excluded from results).\n`);

// Phone number patterns to find in message bodies
const phonePatterns = [
  /\+353\s*\(?\d{2,3}\)?\s*\d{3}\s*\d{4}/g,   // +353 (87) 290 5190 or +353 87 290 5190
  /\+353\s*\d[\d\s]{8,12}/g,                      // +353 87 163 3376
  /0\d{2}\s*\d{3}\s*\d{4}/g,                      // 087 290 5190 (local format)
  /\+\d{10,15}/g,                                   // generic international
];

// VCF pattern
const vcfPattern = /(.+?)\.vcf\s*\(file attached\)/g;

// Extract contacts from message bodies
const contacts = [];
const seenNumbers = new Set();
const seenVcfs = new Set();

for (let i = 0; i < messages.length; i++) {
  const msg = messages[i];
  const body = msg.body;

  // Skip system messages
  if (body === 'This message was deleted' || body === '<Media omitted>' || body === 'Waiting for this message') continue;

  // Look for phone numbers in the message body
  for (const pattern of phonePatterns) {
    pattern.lastIndex = 0;
    let phoneMatch;
    while ((phoneMatch = pattern.exec(body)) !== null) {
      const raw = phoneMatch[0];
      const normalized = raw.replace(/[\s()]/g, '');

      // Skip if it's a group member's own number
      if (senderNumbers.has(normalized)) continue;
      if (seenNumbers.has(normalized)) continue;

      // Skip false positives
      // - "requested to join" system messages
      if (body.includes('requested to join') || body.includes('was added') || body.includes('joined using')) continue;
      // - Numbers inside URLs (facebook, maps, diy.ie, etc.)
      const beforeMatch = body.substring(0, phoneMatch.index);
      const afterMatch = body.substring(phoneMatch.index + raw.length);
      if (beforeMatch.match(/https?:\/\/[^\s]*$/) || afterMatch.match(/^[^\s]*\.(com|ie|co|org|html|php)/)) continue;
      if (body.includes('maps.google') || body.includes('facebook.com') || body.includes('amazon.') || body.includes('diy.ie')) continue;
      // - "changed to" system messages
      if (body.includes('changed to')) continue;
      // - Numbers that are too short (likely not phone numbers)
      if (normalized.replace(/\D/g, '').length < 10) continue;

      seenNumbers.add(normalized);

      // Get context: this message + a few surrounding messages
      const contextStart = Math.max(0, i - 3);
      const contextEnd = Math.min(messages.length - 1, i + 2);
      const context = messages.slice(contextStart, contextEnd + 1).map(m => `${m.sender}: ${m.body}`).join('\n');

      contacts.push({
        type: 'phone',
        number: raw.trim(),
        normalized,
        sharedBy: msg.sender,
        date: msg.date,
        message: msg.body.substring(0, 200),
        context: context.substring(0, 500),
      });
    }
  }

  // Look for VCF (shared contact cards)
  vcfPattern.lastIndex = 0;
  let vcfMatch;
  while ((vcfMatch = vcfPattern.exec(body)) !== null) {
    const name = vcfMatch[1].trim();
    if (seenVcfs.has(name.toLowerCase())) continue;
    seenVcfs.add(name.toLowerCase());

    const contextStart = Math.max(0, i - 3);
    const contextEnd = Math.min(messages.length - 1, i + 2);
    const context = messages.slice(contextStart, contextEnd + 1).map(m => `${m.sender}: ${m.body}`).join('\n');

    contacts.push({
      type: 'vcf',
      name,
      sharedBy: msg.sender,
      date: msg.date,
      context: context.substring(0, 500),
    });
  }
}

// Output results
console.log('='.repeat(60));
console.log(`EXTRACTED CONTACTS: ${contacts.length}`);
console.log('='.repeat(60));
console.log('');

console.log('--- SHARED CONTACT CARDS (.vcf) ---\n');
const vcfContacts = contacts.filter(c => c.type === 'vcf');
for (const c of vcfContacts) {
  console.log(`  📇 ${c.name}`);
  console.log(`     Shared by: ${c.sharedBy} on ${c.date}`);
  console.log(`     Context: ${c.context.split('\n')[0]}`);
  console.log('');
}

console.log(`\n--- PHONE NUMBERS MENTIONED IN MESSAGES ---\n`);
const phoneContacts = contacts.filter(c => c.type === 'phone');
for (const c of phoneContacts) {
  console.log(`  📞 ${c.number}`);
  console.log(`     Shared by: ${c.sharedBy} on ${c.date}`);
  console.log(`     Message: ${c.message.substring(0, 120)}`);
  console.log('');
}

console.log(`\nTotal: ${vcfContacts.length} contact cards + ${phoneContacts.length} phone numbers = ${contacts.length} contacts`);

// Also write a JSON file for review
import { writeFileSync } from 'fs';
const output = contacts.map((c, i) => ({
  id: i + 1,
  type: c.type,
  name: c.type === 'vcf' ? c.name : '',
  phone: c.type === 'phone' ? c.number : '',
  sharedBy: c.sharedBy,
  date: c.date,
  message: c.type === 'phone' ? c.message : '',
  context: c.context || '',
}));
writeFileSync(join(__dirname, '..', 'extracted-contacts.json'), JSON.stringify(output, null, 2));
console.log(`\n✅ Written to extracted-contacts.json for review.`);
