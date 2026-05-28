/**
 * Server-side auth: scrypt-hashed passphrases + opaque session cookies.
 *
 * Trust model note: the passphrase crosses the wire ONLY at signup/signin,
 * over HTTPS. The server stores its scrypt hash (and never the passphrase),
 * so a database leak doesn't give the attacker decryption capability over
 * the user's `encrypted_identity` blob — the work factor still has to be
 * paid. The session cookie itself is just a random 32-byte secret; sha256
 * hashed before storage so a row leak can't be used to log in directly.
 */

import {
  createHash,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { pg, upsert } from "./supabase";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number
) => Promise<Buffer>;

const SCRYPT_KEYLEN = 32;
const SESSION_TTL_DAYS = 30;
const COOKIE_NAME = "siphr_session";

// ---- passphrase hashing -------------------------------------------------

export async function hashPassphrase(
  passphrase: string
): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16);
  const derived = await scrypt(passphrase, salt, SCRYPT_KEYLEN);
  return { hash: derived.toString("base64"), salt: salt.toString("base64") };
}

export async function verifyPassphrase(
  passphrase: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const salt = Buffer.from(storedSalt, "base64");
  const expected = Buffer.from(storedHash, "base64");
  const derived = await scrypt(passphrase, salt, expected.length);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

// ---- session tokens -----------------------------------------------------

function generateToken(): string {
  // 32 random bytes, base64url — strong enough that hash collisions and
  // brute force aren't realistic threats.
  return randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createSession(args: {
  username: string;
  userAgent?: string | null;
  ip?: string | null;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000);
  await pg(
    "POST",
    "sessions",
    [
      {
        user_username: args.username,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        user_agent: args.userAgent ?? null,
        ip: args.ip ?? null,
      },
    ],
    { prefer: "return=minimal" }
  );
  return { token, expiresAt };
}

type SessionRow = {
  id: string;
  user_username: string;
  expires_at: string;
  revoked_at: string | null;
};

/** Returns the authenticated username from the session cookie, or null. */
export async function getSessionUser(req: Request): Promise<string | null> {
  const cookies = parseCookies(req.headers.get("cookie"));
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const tokenHash = hashToken(token);
  const rows = await pg<SessionRow[]>(
    "GET",
    `sessions?select=id,user_username,expires_at,revoked_at&token_hash=eq.${encodeURIComponent(tokenHash)}&limit=1`
  );
  const row = rows?.[0];
  if (!row) return null;
  if (row.revoked_at) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  // best-effort last_seen_at bump; failure is silent
  pg(
    "PATCH",
    `sessions?id=eq.${encodeURIComponent(row.id)}`,
    { last_seen_at: new Date().toISOString() }
  ).catch(() => {});
  return row.user_username;
}

/**
 * Helper for write endpoints: returns `{ user }` if a valid session is
 * present, or `{ deny: Response }` with a 401 to short-circuit.
 *
 *   const auth = await requireSession(req);
 *   if (auth.deny) return auth.deny;
 *   // auth.user is the authenticated username
 */
export async function requireSession(
  req: Request
): Promise<{ user: string; deny: null } | { user: null; deny: Response }> {
  const user = await getSessionUser(req);
  if (!user) {
    return {
      user: null,
      deny: new Response(
        JSON.stringify({ error: "sign in required" }),
        { status: 401, headers: { "content-type": "application/json" } }
      ),
    };
  }
  return { user, deny: null };
}

export async function revokeSessionByToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await upsert(
    "sessions",
    { token_hash: tokenHash, revoked_at: new Date().toISOString() },
    "token_hash",
    "minimal"
  );
}

export async function revokeSessionFromRequest(req: Request): Promise<void> {
  const cookies = parseCookies(req.headers.get("cookie"));
  const token = cookies[COOKIE_NAME];
  if (token) await revokeSessionByToken(token);
}

// ---- cookie helpers -----------------------------------------------------

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k && v) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function sessionCookie(
  token: string,
  expiresAt: Date,
  secure: boolean
): string {
  // SameSite=Lax balances CSRF protection with letting top-level navigation
  // (e.g. clicking links from another site) still carry the cookie.
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    secure ? "Secure" : "",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie(secure: boolean): string {
  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    secure ? "Secure" : "",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ]
    .filter(Boolean)
    .join("; ");
}

/** Pull the client IP out of forwarded headers, fall back to remoteAddress. */
export function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? null;
}

export function isSecureRequest(req: Request): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const proto = req.headers.get("x-forwarded-proto");
  if (proto === "https") return true;
  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return false;
  }
}
