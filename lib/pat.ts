/**
 * Personal Access Tokens for HTTPS git auth.
 *
 * Wire format: `siphr_pat_<43 chars of base64url>` (32 random bytes encoded).
 * The plaintext token is shown to the user exactly once at creation and only
 * its SHA-256 hash is stored.
 *
 * Use over git HTTPS:
 *   git clone https://<username>:<token>@siphr.app/owner/repo.git
 *   git push  https://<username>:<token>@siphr.app/owner/repo.git
 *
 * In a `git push` flow, git issues an HTTP Basic challenge — the credential
 * helper feeds back username + PAT, both of which we parse here.
 */

import { createHash, randomBytes } from "node:crypto";
import { pg } from "./supabase";

const PREFIX = "siphr_pat_";

export type StoredPat = {
  id: string;
  userUsername: string;
  name: string;
  tokenHash: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
};

type PatRow = {
  id: string;
  user_username: string;
  name: string;
  token_hash: string;
  prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
};

function fromRow(r: PatRow): StoredPat {
  return {
    id: r.id,
    userUsername: r.user_username,
    name: r.name,
    tokenHash: r.token_hash,
    prefix: r.prefix,
    scopes: r.scopes,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
    expiresAt: r.expires_at,
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Create a new PAT. Returns the plaintext token ONCE — store it carefully.
 */
export async function createPat(args: {
  username: string;
  name: string;
  scopes?: string[];
  expiresAt?: string | null;
}): Promise<{ plaintext: string; pat: StoredPat }> {
  const token = PREFIX + base64url(randomBytes(32));
  const tokenHash = hashToken(token);
  const prefix = token.slice(0, PREFIX.length + 6); // siphr_pat_xxxxxx for display
  const rows = await pg<PatRow[]>(
    "POST",
    "personal_access_tokens?select=*",
    [
      {
        user_username: args.username,
        name: args.name,
        token_hash: tokenHash,
        prefix,
        scopes: args.scopes ?? ["repo"],
        expires_at: args.expiresAt ?? null,
      },
    ],
    { prefer: "return=representation" }
  );
  return { plaintext: token, pat: fromRow(rows[0]) };
}

export async function listPatsFor(username: string): Promise<StoredPat[]> {
  const rows = await pg<PatRow[]>(
    "GET",
    `personal_access_tokens?select=*&user_username=eq.${encodeURIComponent(username)}&order=created_at.desc`
  );
  return (rows ?? []).map(fromRow);
}

export async function deletePat(id: string, username: string): Promise<boolean> {
  const rows = await pg<PatRow[]>(
    "DELETE",
    `personal_access_tokens?id=eq.${encodeURIComponent(id)}&user_username=eq.${encodeURIComponent(username)}&select=*`,
    undefined,
    { prefer: "return=representation" }
  );
  return (rows ?? []).length > 0;
}

/**
 * Look up a PAT by its plaintext token. Returns the owner record on a hit,
 * null otherwise. Bumps `last_used_at` as a side effect.
 */
export async function authenticateToken(token: string): Promise<StoredPat | null> {
  if (!token.startsWith(PREFIX)) return null;
  const tokenHash = hashToken(token);
  const rows = await pg<PatRow[]>(
    "GET",
    `personal_access_tokens?select=*&token_hash=eq.${encodeURIComponent(tokenHash)}&limit=1`
  );
  const row = rows?.[0];
  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
  // Best-effort last-used bump; don't fail auth if this insert errors.
  pg(
    "PATCH",
    `personal_access_tokens?id=eq.${encodeURIComponent(row.id)}`,
    { last_used_at: new Date().toISOString() }
  ).catch(() => {});
  return fromRow(row);
}

/**
 * Parse HTTP Basic credentials. Returns null if no/invalid header.
 * Username is the URL-encoded handle, password is the PAT.
 */
export function parseBasicAuth(
  req: Request
): { username: string; password: string } | null {
  const h = req.headers.get("authorization") ?? "";
  if (!h.startsWith("Basic ")) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(h.slice("Basic ".length), "base64").toString("utf8");
  } catch {
    return null;
  }
  const colon = decoded.indexOf(":");
  if (colon < 0) return null;
  return {
    username: decoded.slice(0, colon),
    password: decoded.slice(colon + 1),
  };
}

/**
 * Resolve a Basic-authenticated PAT user from a Request. Returns the
 * authenticated username if the token is valid and belongs to the basic
 * `username` field, null otherwise.
 */
export async function authenticatedUserFromRequest(
  req: Request
): Promise<string | null> {
  const basic = parseBasicAuth(req);
  if (!basic) return null;
  const pat = await authenticateToken(basic.password);
  if (!pat) return null;
  // We require username + PAT to match; this is what git tooling sends.
  if (basic.username && basic.username !== pat.userUsername) return null;
  return pat.userUsername;
}

/**
 * Build the WWW-Authenticate challenge response. Returns a 401 with the
 * realm so `git` knows to prompt for credentials.
 */
export function authChallenge(reason = "siphr"): Response {
  return new Response(`authentication required: ${reason}\n`, {
    status: 401,
    headers: {
      "content-type": "text/plain",
      "www-authenticate": `Basic realm="${reason}"`,
    },
  });
}
