/**
 * Server-side AES-256-GCM helpers.
 *
 * Used to encrypt private-repo git objects at rest. For `encryption_mode='server'`
 * repos, every loose object stored in Supabase is wrapped here before insert and
 * unwrapped here on read. The DEK lives in `repos.wrapped_dek` (already wrapped
 * to the master key); the master key lives in the SIPHR_MASTER_KEY env var.
 *
 * Wire format for both wrappings is the same: `iv (12 bytes) || ciphertext+tag`.
 * `crypto.createCipheriv('aes-256-gcm', ...)` puts the GCM auth tag at the end
 * of the ciphertext via getAuthTag(); we concatenate so the whole blob is one
 * contiguous Buffer.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const IV_LEN = 12;
const TAG_LEN = 16;

let cachedMasterKey: Buffer | null = null;

/**
 * Read SIPHR_MASTER_KEY from env. Accepts base64 or base64url, must decode to
 * exactly 32 bytes.
 */
export function getMasterKey(): Buffer {
  if (cachedMasterKey) return cachedMasterKey;
  const raw = process.env.SIPHR_MASTER_KEY;
  if (!raw) {
    throw new Error(
      "SIPHR_MASTER_KEY not set. Generate one with: " +
        "node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }
  const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  const buf = Buffer.from(b64, "base64");
  if (buf.length !== 32) {
    throw new Error(
      `SIPHR_MASTER_KEY must decode to 32 bytes, got ${buf.length}`
    );
  }
  cachedMasterKey = buf;
  return buf;
}

/** 32 random bytes — used as a per-repo data-encryption key. */
export function generateDek(): Buffer {
  return randomBytes(32);
}

/**
 * Encrypt `plaintext` with `key` (32 bytes) using AES-256-GCM.
 * Returns `iv (12) || ciphertext || tag (16)` as a single Buffer.
 */
export function aesGcmEncrypt(key: Buffer, plaintext: Buffer): Buffer {
  if (key.length !== 32) throw new Error("aesGcmEncrypt: key must be 32 bytes");
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]);
}

/**
 * Decrypt a blob produced by aesGcmEncrypt. Throws on tag mismatch — never
 * returns garbage on a key mismatch.
 */
export function aesGcmDecrypt(key: Buffer, blob: Buffer): Buffer {
  if (key.length !== 32) throw new Error("aesGcmDecrypt: key must be 32 bytes");
  if (blob.length < IV_LEN + TAG_LEN) {
    throw new Error("aesGcmDecrypt: blob too short");
  }
  const iv = blob.subarray(0, IV_LEN);
  const tag = blob.subarray(blob.length - TAG_LEN);
  const ct = blob.subarray(IV_LEN, blob.length - TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
}

/** Wrap a per-repo DEK with the master key. Output goes into `repos.wrapped_dek`. */
export function wrapDekWithMaster(dek: Buffer): Buffer {
  return aesGcmEncrypt(getMasterKey(), dek);
}

/** Reverse of wrapDekWithMaster. */
export function unwrapDekWithMaster(wrapped: Buffer): Buffer {
  return aesGcmDecrypt(getMasterKey(), wrapped);
}

/**
 * Encrypt a git object's deflated-loose bytes with the per-repo DEK. The
 * resulting buffer is what we store in `objects.data`.
 */
export function encryptObjectBytes(dek: Buffer, plaintext: Buffer): Buffer {
  return aesGcmEncrypt(dek, plaintext);
}

/** Reverse of encryptObjectBytes. */
export function decryptObjectBytes(dek: Buffer, ciphertext: Buffer): Buffer {
  return aesGcmDecrypt(dek, ciphertext);
}
