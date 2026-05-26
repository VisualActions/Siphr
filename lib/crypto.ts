/**
 * Siphr crypto primitives.
 *
 * Every private key in this system lives in the user's browser. The server
 * stores public keys, ciphertext, and wrapped repo keys it cannot unwrap.
 *
 * Stack:
 *   - Identity keys: X25519 (key agreement) + Ed25519 (signing), generated client-side.
 *   - The user's private keys are encrypted at rest in the browser with a key
 *     derived from their passphrase via PBKDF2-SHA256 (600k iterations) + AES-GCM.
 *   - Each repo has its own random 256-bit symmetric key (the "repo key").
 *   - The repo key is wrapped for each collaborator: ECDH(theirPub, ownerPriv)
 *     -> HKDF -> AES-KW. Wrapping happens client-side; server only sees the
 *     wrapped blob.
 *   - Git objects (blob/tree/commit) are encrypted with the repo key using
 *     AES-256-GCM with a fresh random nonce per object.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

export type IdentityKeypair = {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
};

export type WrappedKey = {
  /** base64url ciphertext */
  ct: string;
  /** base64url nonce */
  iv: string;
  /** ephemeral X25519 public key used in ECDH, base64url */
  epk: string;
};

export type EncryptedBlob = {
  ct: string;
  iv: string;
};

export type EncryptedIdentity = {
  publicKeyJwk: JsonWebKey;
  /** AES-GCM wrapped private key JWK, encoded JSON */
  wrappedPrivateKey: EncryptedBlob;
  /** PBKDF2 salt, base64url */
  salt: string;
  /** iteration count */
  iters: number;
};

const PBKDF2_ITERS = 600_000;

export function toB64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromB64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

function getSubtle(): SubtleCrypto {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("WebCrypto not available in this environment");
  }
  return crypto.subtle;
}

/** TS lib.dom requires ArrayBufferView<ArrayBuffer>; coerce away SharedArrayBuffer. */
function bs(b: Uint8Array): BufferSource {
  return b as unknown as BufferSource;
}

export async function generateIdentity(): Promise<IdentityKeypair> {
  const subtle = getSubtle();
  const pair = (await subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits", "deriveKey"]
  )) as CryptoKeyPair;
  const publicKeyJwk = await subtle.exportKey("jwk", pair.publicKey);
  const privateKeyJwk = await subtle.exportKey("jwk", pair.privateKey);
  return { publicKeyJwk, privateKeyJwk };
}

async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iters: number
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const baseKey = await subtle.importKey(
    "raw",
    bs(enc.encode(passphrase)),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return subtle.deriveKey(
    { name: "PBKDF2", salt: bs(salt), iterations: iters, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptIdentity(
  identity: IdentityKeypair,
  passphrase: string
): Promise<EncryptedIdentity> {
  const subtle = getSubtle();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKeyFromPassphrase(passphrase, salt, PBKDF2_ITERS);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = enc.encode(JSON.stringify(identity.privateKeyJwk));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv: bs(iv) }, key, bs(plaintext));
  return {
    publicKeyJwk: identity.publicKeyJwk,
    wrappedPrivateKey: { ct: toB64Url(ct), iv: toB64Url(iv) },
    salt: toB64Url(salt),
    iters: PBKDF2_ITERS,
  };
}

export async function decryptIdentity(
  encrypted: EncryptedIdentity,
  passphrase: string
): Promise<IdentityKeypair> {
  const subtle = getSubtle();
  const salt = fromB64Url(encrypted.salt);
  const key = await deriveKeyFromPassphrase(passphrase, salt, encrypted.iters);
  const iv = fromB64Url(encrypted.wrappedPrivateKey.iv);
  const ct = fromB64Url(encrypted.wrappedPrivateKey.ct);
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: bs(iv) }, key, bs(ct));
  const privateKeyJwk = JSON.parse(dec.decode(pt)) as JsonWebKey;
  return { publicKeyJwk: encrypted.publicKeyJwk, privateKeyJwk };
}

export async function generateRepoKey(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(32));
}

async function importPubJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return getSubtle().importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

async function importPrivJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return getSubtle().importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

/**
 * Wrap a 32-byte repo key for a recipient using ECDH(ephemeral, recipient).
 * Produces a self-contained wrapped blob the server can store.
 */
export async function wrapRepoKey(
  repoKey: Uint8Array,
  recipientPubJwk: JsonWebKey
): Promise<WrappedKey> {
  const subtle = getSubtle();
  const recipientPub = await importPubJwk(recipientPubJwk);
  const ephemeral = (await subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits", "deriveKey"]
  )) as CryptoKeyPair;
  const sharedBits = await subtle.deriveBits(
    { name: "ECDH", public: recipientPub },
    ephemeral.privateKey,
    256
  );
  const wrappingKey = await subtle.importKey(
    "raw",
    sharedBits,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv: bs(iv) }, wrappingKey, bs(repoKey));
  const epkJwk = await subtle.exportKey("jwk", ephemeral.publicKey);
  return {
    ct: toB64Url(ct),
    iv: toB64Url(iv),
    epk: toB64Url(enc.encode(JSON.stringify(epkJwk))),
  };
}

export async function unwrapRepoKey(
  wrapped: WrappedKey,
  recipientPrivJwk: JsonWebKey
): Promise<Uint8Array> {
  const subtle = getSubtle();
  const recipientPriv = await importPrivJwk(recipientPrivJwk);
  const epkJwk = JSON.parse(dec.decode(fromB64Url(wrapped.epk))) as JsonWebKey;
  const ephemeralPub = await importPubJwk(epkJwk);
  const sharedBits = await subtle.deriveBits(
    { name: "ECDH", public: ephemeralPub },
    recipientPriv,
    256
  );
  const wrappingKey = await subtle.importKey(
    "raw",
    sharedBits,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const iv = fromB64Url(wrapped.iv);
  const ct = fromB64Url(wrapped.ct);
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: bs(iv) }, wrappingKey, bs(ct));
  return new Uint8Array(pt);
}

export async function encryptWithRepoKey(
  repoKey: Uint8Array,
  plaintext: Uint8Array
): Promise<EncryptedBlob> {
  const subtle = getSubtle();
  const key = await subtle.importKey(
    "raw",
    bs(repoKey),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv: bs(iv) }, key, bs(plaintext));
  return { ct: toB64Url(ct), iv: toB64Url(iv) };
}

export async function decryptWithRepoKey(
  repoKey: Uint8Array,
  blob: EncryptedBlob
): Promise<Uint8Array> {
  const subtle = getSubtle();
  const key = await subtle.importKey(
    "raw",
    bs(repoKey),
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const iv = fromB64Url(blob.iv);
  const ct = fromB64Url(blob.ct);
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: bs(iv) }, key, bs(ct));
  return new Uint8Array(pt);
}

/** Stable fingerprint of a public key for display/lookup. */
export async function fingerprint(pubJwk: JsonWebKey): Promise<string> {
  const subtle = getSubtle();
  const canonical = JSON.stringify({
    crv: pubJwk.crv,
    kty: pubJwk.kty,
    x: pubJwk.x,
    y: pubJwk.y,
  });
  const hash = await subtle.digest("SHA-256", bs(enc.encode(canonical)));
  return toB64Url(hash).slice(0, 16);
}
