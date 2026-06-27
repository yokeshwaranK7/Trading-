#!/usr/bin/env node
/**
 * Grant / revoke / list trading-journal access by email.
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
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

initializeApp({ credential: cert(sa) });
const db = getFirestore();
const col = db.collection('allowlist');

if (cmd === 'list') {
  const snap = await col.get();
  if (snap.empty) { console.log('No one has access yet.'); }
  else {
    console.log(`\n${snap.size} email(s) with access:`);
    snap.forEach((d) => console.log('  •', d.id));
    console.log('');
  }
  process.exit(0);
}

if (!rawEmail) { console.error('Provide an email address.'); process.exit(1); }
const email = rawEmail.toLowerCase().trim();

if (cmd === 'add') {
  await col.doc(email).set({ addedAt: new Date().toISOString() });
  console.log(`\u2713 Granted access to ${email}`);
} else {
  await col.doc(email).delete();
  console.log(`\u2713 Revoked access for ${email}`);
}
process.exit(0);
