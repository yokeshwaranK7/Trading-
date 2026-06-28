#!/usr/bin/env node
/**
 * Grant / revoke / list trading-journal access by email (Realtime Database).
 *
 * Setup (one time):
 *   1. Firebase console -> Project settings -> Service accounts -> Generate new private key
 *   2. Save the downloaded file as  serviceAccount.json  in this project root (it's gitignored)
 *   3. npm install
 *
 * Usage:
 *   npm run allow   user@example.com      # grant access
 *   npm run deny    user@example.com      # revoke access
 *   npm run list-access                   # list everyone with access
 *
 * (Or directly:)
 *   node scripts/allow.mjs add    user@example.com
 *   node scripts/allow.mjs remove user@example.com
 *   node scripts/allow.mjs list
 */
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Realtime Database instance URL — must match public/firebase-config.js.
const DATABASE_URL = 'https://trading-journal-c8bd6-default-rtdb.asia-southeast1.firebasedatabase.app';

// RTDB keys can't contain ".", "#", "$", "[" or "]" — encode emails (dots -> commas), lowercase.
const encEmail = (email) => email.toLowerCase().trim().replace(/\./g, ',');

const [cmd, rawEmail] = process.argv.slice(2);

if (!['add', 'remove', 'list'].includes(cmd)) {
  console.error('Usage: node scripts/allow.mjs <add|remove|list> [email]');
  process.exit(1);
}

let sa;
try {
  sa = JSON.parse(readFileSync(new URL('../serviceAccount.json', import.meta.url)));
} catch {
  console.error('\nMissing serviceAccount.json in the project root.');
  console.error('Firebase console -> Project settings -> Service accounts -> Generate new private key,');
  console.error('then save it as serviceAccount.json next to package.json.\n');
  process.exit(1);
}

initializeApp({ credential: cert(sa), databaseURL: DATABASE_URL });
const allowlist = getDatabase().ref('allowlist');

if (cmd === 'list') {
  const snap = await allowlist.get();
  if (!snap.exists()) {
    console.log('No one has access yet.');
  } else {
    const keys = Object.keys(snap.val());
    console.log(`\n${keys.length} email(s) with access:`);
    keys.forEach((k) => console.log('  •', k.replace(/,/g, '.')));
    console.log('');
  }
  process.exit(0);
}

if (!rawEmail) { console.error('Provide an email address.'); process.exit(1); }
const key = encEmail(rawEmail);

if (cmd === 'add') {
  await allowlist.child(key).set(true);
  console.log(`\u2713 Granted access to ${rawEmail.toLowerCase().trim()}`);
} else {
  await allowlist.child(key).remove();
  console.log(`\u2713 Revoked access for ${rawEmail.toLowerCase().trim()}`);
}
process.exit(0);
