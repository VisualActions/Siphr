#!/usr/bin/env node
/**
 * Mark a Siphr user as verified.
 *
 * Usage:
 *   SIPHR_ADMIN_TOKEN=xxx node scripts/verify-user.mjs <username> [--as "Microsoft"] [--kind org|individual|bot]
 *   SIPHR_ADMIN_TOKEN=xxx node scripts/verify-user.mjs <username> --revoke
 */

const args = process.argv.slice(2);
const BASE = process.env.SIPHR_URL ?? "http://localhost:3000";
const TOKEN = process.env.SIPHR_ADMIN_TOKEN;

if (!TOKEN) {
  console.error("set SIPHR_ADMIN_TOKEN (must match the server's value)");
  process.exit(2);
}
if (args.length === 0) {
  console.error("usage: verify-user.mjs <username> [--as \"Display Name\"] [--kind org|individual|bot] [--revoke]");
  process.exit(2);
}

const username = args[0];
let verifiedAs;
let verifiedKind = "org";
let revoke = false;
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--as") verifiedAs = args[++i];
  else if (args[i] === "--kind") verifiedKind = args[++i];
  else if (args[i] === "--revoke") revoke = true;
}

const body = revoke
  ? { username, verified: false }
  : { username, verified: true, verifiedAs, verifiedKind };

const res = await fetch(`${BASE}/api/admin/verify`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${TOKEN}`,
  },
  body: JSON.stringify(body),
});

const text = await res.text();
if (!res.ok) {
  console.error(`failed (${res.status}): ${text}`);
  process.exit(1);
}
console.log(text);
