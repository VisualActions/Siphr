#!/usr/bin/env node
/**
 * Push the current repo's git objects to a running Siphr instance.
 *
 * Bootstrap-shaped push (no smart-HTTP wire protocol yet):
 *   1. Generate a P-256 ECDH keypair in this process.
 *   2. Sign up as @username on Siphr (server stores public key + encrypted blob).
 *   3. Generate a 256-bit repo key, wrap it to our public key, create the repo.
 *   4. Walk ./.git/objects, encrypt each loose object with the repo key
 *      (AES-256-GCM, fresh nonce), and PUT it to /api/repos/{id}/objects/{oid}.
 *
 * The Siphr server never sees: passphrase, private key, repo key plaintext,
 * object plaintext. It stores ciphertext and the wrapped repo key.
 */

import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { webcrypto as crypto } from "node:crypto";

const BASE = process.env.SIPHR_URL ?? "http://localhost:3000";
const USERNAME = process.env.SIPHR_USER ?? "siphr";
const PASSPHRASE = process.env.SIPHR_PASS ?? "siphr-bootstrap-passphrase-v0";
const REPO_NAME = process.env.SIPHR_REPO ?? "siphr";
const VISIBILITY = "public";
const GIT_DIR = path.resolve(".git");
const STATE_FILE = path.resolve(".siphr-push.json");

const enc = new TextEncoder();

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}
function fromB64url(s) {
  return new Uint8Array(Buffer.from(s, "base64url"));
}

async function generateIdentity() {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits", "deriveKey"]
  );
  return {
    publicKeyJwk: await crypto.subtle.exportKey("jwk", pair.publicKey),
    privateKeyJwk: await crypto.subtle.exportKey("jwk", pair.privateKey),
  };
}

async function pbkdf2Key(passphrase, salt, iters) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: iters, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptIdentity(identity, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iters = 600_000;
  const key = await pbkdf2Key(passphrase, salt, iters);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(identity.privateKeyJwk))
  );
  return {
    publicKeyJwk: identity.publicKeyJwk,
    wrappedPrivateKey: { ct: b64url(ct), iv: b64url(iv) },
    salt: b64url(salt),
    iters,
  };
}

async function fingerprint(pubJwk) {
  const canonical = JSON.stringify({
    crv: pubJwk.crv,
    kty: pubJwk.kty,
    x: pubJwk.x,
    y: pubJwk.y,
  });
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(canonical));
  return b64url(hash).slice(0, 16);
}

async function wrapRepoKey(repoKey, recipientPubJwk) {
  const recipientPub = await crypto.subtle.importKey(
    "jwk",
    recipientPubJwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits", "deriveKey"]
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: recipientPub },
    ephemeral.privateKey,
    256
  );
  const wrappingKey = await crypto.subtle.importKey(
    "raw",
    sharedBits,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    repoKey
  );
  const epkJwk = await crypto.subtle.exportKey("jwk", ephemeral.publicKey);
  return {
    ct: b64url(ct),
    iv: b64url(iv),
    epk: b64url(enc.encode(JSON.stringify(epkJwk))),
  };
}

async function encryptObject(repoKey, plaintext) {
  const key = await crypto.subtle.importKey(
    "raw",
    repoKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );
  // pack: [12-byte iv][ciphertext]
  const out = new Uint8Array(12 + ct.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ct), 12);
  return out;
}

async function* walkObjects(objectsDir) {
  const dirs = await readdir(objectsDir, { withFileTypes: true });
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    if (!/^[a-f0-9]{2}$/.test(d.name)) continue;
    const inner = path.join(objectsDir, d.name);
    const files = await readdir(inner);
    for (const f of files) {
      if (!/^[a-f0-9]{38}$/.test(f)) continue;
      const oid = d.name + f;
      const full = path.join(inner, f);
      const s = await stat(full);
      if (!s.isFile()) continue;
      yield { oid, path: full };
    }
  }
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${url} -> ${res.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function waitForServer(maxMs = 60_000) {
  const t0 = Date.now();
  for (;;) {
    try {
      const res = await fetch(BASE + "/api/repos");
      if (res.ok) return;
    } catch {}
    if (Date.now() - t0 > maxMs) throw new Error("server did not come up at " + BASE);
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function loadState() {
  if (!existsSync(STATE_FILE)) return null;
  return JSON.parse(await readFile(STATE_FILE, "utf8"));
}
async function saveState(s) {
  await writeFile(STATE_FILE, JSON.stringify(s, null, 2));
}

async function main() {
  if (!existsSync(GIT_DIR)) {
    throw new Error("no .git directory; run from the repo root after committing");
  }

  console.log(`siphr push -> ${BASE}`);
  console.log(`  user: ${USERNAME}  repo: ${USERNAME}/${REPO_NAME}`);

  await waitForServer();

  let state = await loadState();
  let identity, repoKey, repoId;

  if (state) {
    identity = state.identity;
    repoKey = fromB64url(state.repoKey);
    repoId = state.repoId;
    console.log(`  reusing existing identity + repo (${repoId})`);
  } else {
    console.log("  generating identity...");
    identity = await generateIdentity();
    const fp = await fingerprint(identity.publicKeyJwk);
    const encryptedIdentity = await encryptIdentity(identity, PASSPHRASE);

    console.log(`  signing up as @${USERNAME} (fp ${fp})...`);
    await fetchJson(BASE + "/api/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: USERNAME,
        publicKeyJwk: identity.publicKeyJwk,
        encryptedIdentity,
        fingerprint: fp,
      }),
    }).catch(async (err) => {
      if (String(err).includes("409")) {
        console.log("  user already exists, continuing");
      } else throw err;
    });

    console.log("  generating repo key + wrapping for owner...");
    repoKey = crypto.getRandomValues(new Uint8Array(32));
    const wrapped = await wrapRepoKey(repoKey, identity.publicKeyJwk);

    console.log("  creating repo...");
    const created = await fetchJson(BASE + "/api/repos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        owner: USERNAME,
        name: REPO_NAME,
        visibility: VISIBILITY,
        wrappedKeys: { [USERNAME]: wrapped },
      }),
    });
    repoId = created.id;

    state = {
      identity,
      repoKey: b64url(repoKey),
      repoId,
      createdAt: new Date().toISOString(),
    };
    await saveState(state);
  }

  console.log(`  repo id: ${repoId}`);
  console.log("  encrypting + uploading objects...");

  const objectsDir = path.join(GIT_DIR, "objects");
  let count = 0;
  let bytes = 0;
  for await (const { oid, path: p } of walkObjects(objectsDir)) {
    const plain = await readFile(p);
    const ct = await encryptObject(repoKey, plain);
    const res = await fetch(`${BASE}/api/repos/${repoId}/objects/${oid}`, {
      method: "PUT",
      headers: { "content-type": "application/octet-stream" },
      body: ct,
    });
    if (!res.ok) {
      throw new Error(`PUT ${oid} -> ${res.status}: ${await res.text()}`);
    }
    count++;
    bytes += ct.byteLength;
    if (count % 25 === 0) process.stdout.write(`    ${count} objects...\r`);
  }

  console.log(`\n  pushed ${count} encrypted objects (${(bytes / 1024).toFixed(1)} KB ciphertext)`);
  console.log(`  visible at: ${BASE}/r/${USERNAME}/${REPO_NAME}`);
}

main().catch((err) => {
  console.error("\npush failed:", err.message);
  process.exit(1);
});
