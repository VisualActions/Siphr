/**
 * Server-side persistence backed by Supabase Postgres.
 *
 * Object encryption depends on the repo's `encryption_mode`:
 *   - 'none'   (public)  -> store zlib-deflated plaintext
 *   - 'server' (private) -> server wraps each object with the repo's DEK
 *                           (DEK itself is wrapped to SIPHR_MASTER_KEY on the
 *                           repo row). Server can decrypt; client tooling
 *                           never sees ciphertext.
 *   - 'e2ee'   (private) -> client encrypts before upload; server stores
 *                           opaque ciphertext and cannot decrypt. Legacy
 *                           flow — new private repos default to 'server'.
 */

import { bytesToHexLiteral, decodeBytea, pg, upsert } from "./supabase";
import {
  decryptObjectBytes,
  encryptObjectBytes,
  unwrapDekWithMaster,
} from "./server-crypto";

export type StoredUser = {
  username: string;
  fingerprint: string;
  publicKeyJwk: JsonWebKey;
  encryptedIdentity: unknown;
  createdAt: string;
  verified?: boolean;
  verifiedAs?: string;
  verifiedAt?: string;
  verifiedKind?: "org" | "individual" | "bot";
};

export type EncryptionMode = "none" | "server" | "e2ee";
export type KeySource = "master" | "byok";

export type StoredRepo = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  description: string | null;
  defaultBranch: string;
  createdAt: string;
  wrappedKeys: Record<string, unknown>;
  encryptionMode: EncryptionMode;
  /** Per-repo DEK wrapped with the master key. Only set when encryptionMode='server'. */
  wrappedDek: Buffer | null;
  keySource: KeySource;
  featured?: boolean;
  featuredAt?: string | null;
  featuredTag?: string | null;
  featuredBlurb?: string | null;
  featuredRank?: number | null;
};

type UserRow = {
  username: string;
  fingerprint: string;
  public_key_jwk: JsonWebKey;
  encrypted_identity: unknown;
  verified: boolean | null;
  verified_as: string | null;
  verified_kind: string | null;
  verified_at: string | null;
  created_at: string;
};
type RepoRow = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  description: string | null;
  default_branch: string;
  wrapped_keys: Record<string, unknown>;
  encryption_mode: EncryptionMode;
  wrapped_dek: string | null; // bytea encoded as \x... by PostgREST
  key_source: KeySource;
  created_at: string;
  featured?: boolean | null;
  featured_at?: string | null;
  featured_tag?: string | null;
  featured_blurb?: string | null;
  featured_rank?: number | null;
};

function userFromRow(r: UserRow): StoredUser {
  return {
    username: r.username,
    fingerprint: r.fingerprint,
    publicKeyJwk: r.public_key_jwk,
    encryptedIdentity: r.encrypted_identity,
    createdAt: r.created_at,
    verified: r.verified ?? false,
    verifiedAs: r.verified_as ?? undefined,
    verifiedKind: (r.verified_kind as StoredUser["verifiedKind"]) ?? undefined,
    verifiedAt: r.verified_at ?? undefined,
  };
}
function repoFromRow(r: RepoRow): StoredRepo {
  return {
    id: r.id,
    owner: r.owner,
    name: r.name,
    visibility: r.visibility,
    description: r.description,
    defaultBranch: r.default_branch,
    createdAt: r.created_at,
    wrappedKeys: r.wrapped_keys ?? {},
    encryptionMode: (r.encryption_mode ?? "none") as EncryptionMode,
    wrappedDek: r.wrapped_dek ? decodeBytea(r.wrapped_dek) : null,
    keySource: (r.key_source ?? "master") as KeySource,
    featured: r.featured ?? false,
    featuredAt: r.featured_at ?? null,
    featuredTag: r.featured_tag ?? null,
    featuredBlurb: r.featured_blurb ?? null,
    featuredRank: r.featured_rank ?? null,
  };
}

// ---- users ----

export async function listUsers(): Promise<StoredUser[]> {
  const rows = await pg<UserRow[]>("GET", "users?select=*&order=created_at.desc");
  return (rows ?? []).map(userFromRow);
}

export async function getUser(username: string): Promise<StoredUser | null> {
  const rows = await pg<UserRow[]>(
    "GET",
    `users?select=*&username=eq.${encodeURIComponent(username)}&limit=1`
  );
  return rows?.[0] ? userFromRow(rows[0]) : null;
}

/** Case-insensitive lookup, used for signup collision check and URL canonicalization. */
export async function findUserCaseInsensitive(username: string): Promise<StoredUser | null> {
  const rows = await pg<UserRow[]>(
    "GET",
    `users?select=*&username=ilike.${encodeURIComponent(username)}&limit=1`
  );
  return rows?.[0] ? userFromRow(rows[0]) : null;
}

export async function createUser(u: StoredUser): Promise<void> {
  await pg("POST", "users", [
    {
      username: u.username,
      fingerprint: u.fingerprint,
      public_key_jwk: u.publicKeyJwk,
      encrypted_identity: u.encryptedIdentity,
    },
  ]);
}

export async function setUserVerification(
  username: string,
  v: Pick<StoredUser, "verified" | "verifiedAs" | "verifiedAt" | "verifiedKind">
): Promise<StoredUser> {
  const patch: Record<string, unknown> = {
    verified: v.verified ?? false,
    verified_as: v.verified ? v.verifiedAs ?? null : null,
    verified_kind: v.verified ? v.verifiedKind ?? null : null,
    verified_at: v.verified ? v.verifiedAt ?? new Date().toISOString() : null,
  };
  const rows = await pg<UserRow[]>(
    "PATCH",
    `users?username=eq.${encodeURIComponent(username)}&select=*`,
    patch,
    { prefer: "return=representation" }
  );
  if (!rows?.[0]) throw new Error("no such user");
  return userFromRow(rows[0]);
}

// ---- repos ----

export async function listRepos(): Promise<StoredRepo[]> {
  const rows = await pg<RepoRow[]>("GET", "repos?select=*&order=created_at.desc");
  return (rows ?? []).map(repoFromRow);
}

export async function getRepo(id: string): Promise<StoredRepo | null> {
  const rows = await pg<RepoRow[]>(
    "GET",
    `repos?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
  );
  return rows?.[0] ? repoFromRow(rows[0]) : null;
}

export async function getRepoByName(
  owner: string,
  name: string
): Promise<StoredRepo | null> {
  const rows = await pg<RepoRow[]>(
    "GET",
    `repos?select=*&owner=eq.${encodeURIComponent(owner)}&name=eq.${encodeURIComponent(name)}&limit=1`
  );
  return rows?.[0] ? repoFromRow(rows[0]) : null;
}

export async function reposFor(username: string): Promise<StoredRepo[]> {
  const owned = await pg<RepoRow[]>(
    "GET",
    `repos?select=*&owner=eq.${encodeURIComponent(username)}&order=created_at.desc`
  );
  return (owned ?? []).map(repoFromRow);
}

export async function createRepo(r: {
  owner: string;
  name: string;
  visibility: "private" | "public";
  description?: string | null;
  defaultBranch?: string;
  wrappedKeys?: Record<string, unknown>;
  encryptionMode?: EncryptionMode;
  wrappedDek?: Buffer | Uint8Array | null;
  keySource?: KeySource;
}): Promise<StoredRepo> {
  const row: Record<string, unknown> = {
    owner: r.owner,
    name: r.name,
    visibility: r.visibility,
    description: r.description ?? null,
    default_branch: r.defaultBranch ?? "main",
    wrapped_keys: r.wrappedKeys ?? {},
    encryption_mode: r.encryptionMode ?? "none",
    key_source: r.keySource ?? "master",
  };
  if (r.wrappedDek) {
    row.wrapped_dek = bytesToHexLiteral(Buffer.from(r.wrappedDek));
  }
  const rows = await pg<RepoRow[]>(
    "POST",
    "repos?select=*",
    [row],
    { prefer: "return=representation" }
  );
  return repoFromRow(rows[0]);
}

// ---- refs ----

export type StoredRef = {
  name: string;
  oid: string | null;
  target: string | null;
  updatedAt: string;
};

type RefRow = {
  repo_id: string;
  name: string;
  oid: string | null;
  target: string | null;
  updated_at: string;
};

export async function listRefs(repoId: string): Promise<StoredRef[]> {
  const rows = await pg<RefRow[]>(
    "GET",
    `refs?select=*&repo_id=eq.${encodeURIComponent(repoId)}&order=name.asc`
  );
  return (rows ?? []).map((r) => ({
    name: r.name,
    oid: r.oid,
    target: r.target,
    updatedAt: r.updated_at,
  }));
}

export async function getRef(repoId: string, name: string): Promise<StoredRef | null> {
  const rows = await pg<RefRow[]>(
    "GET",
    `refs?select=*&repo_id=eq.${encodeURIComponent(repoId)}&name=eq.${encodeURIComponent(name)}&limit=1`
  );
  const r = rows?.[0];
  if (!r) return null;
  return { name: r.name, oid: r.oid, target: r.target, updatedAt: r.updated_at };
}

/** Resolve symbolic refs (e.g. HEAD -> refs/heads/main -> oid). */
export async function resolveRef(repoId: string, name: string): Promise<string | null> {
  let cur = await getRef(repoId, name);
  let hops = 0;
  while (cur && cur.target && !cur.oid && hops < 5) {
    const next = cur.target.startsWith("ref: ") ? cur.target.slice(5) : cur.target;
    cur = await getRef(repoId, next);
    hops++;
  }
  return cur?.oid ?? null;
}

export async function putRef(
  repoId: string,
  name: string,
  value: { oid?: string | null; target?: string | null }
): Promise<void> {
  await upsert(
    "refs",
    {
      repo_id: repoId,
      name,
      oid: value.oid ?? null,
      target: value.target ?? null,
      updated_at: new Date().toISOString(),
    },
    "repo_id,name",
    "minimal"
  );
}

// ---- objects ----

export async function putObject(
  repoId: string,
  oid: string,
  data: Uint8Array | Buffer
): Promise<void> {
  if (!/^[a-f0-9]{6,128}$/.test(oid)) throw new Error("invalid oid");
  const buf = Buffer.from(data);
  await upsert(
    "objects",
    {
      repo_id: repoId,
      oid,
      data: bytesToHexLiteral(buf),
      size: buf.length,
    },
    "repo_id,oid",
    "minimal"
  );
}

export async function getObject(
  repoId: string,
  oid: string
): Promise<Buffer | null> {
  if (!/^[a-f0-9]{6,128}$/.test(oid)) return null;
  const rows = await pg<{ data: string }[]>(
    "GET",
    `objects?select=data&repo_id=eq.${encodeURIComponent(repoId)}&oid=eq.${encodeURIComponent(oid)}&limit=1`
  );
  if (!rows?.[0]) return null;
  return decodeBytea(rows[0].data);
}

/**
 * Memoize per-request DEK unwrap so we don't pay the AES-GCM unwrap cost
 * for every object during a clone of thousands of objects.
 */
const dekCache = new WeakMap<StoredRepo, Buffer>();

function repoDek(repo: StoredRepo): Buffer {
  let dek = dekCache.get(repo);
  if (dek) return dek;
  if (!repo.wrappedDek) {
    throw new Error(`repo ${repo.id} is server-mode but has no wrapped_dek`);
  }
  dek = unwrapDekWithMaster(repo.wrappedDek);
  dekCache.set(repo, dek);
  return dek;
}

/**
 * Store a git object for a repo, applying the repo's encryption_mode.
 * Callers (smart-HTTP transport, /api/repos/:id/objects PUT) hand in the
 * deflated-loose bytes; this function decides whether to wrap them.
 */
export async function putRepoObject(
  repo: StoredRepo,
  oid: string,
  deflated: Buffer | Uint8Array
): Promise<void> {
  const buf = Buffer.from(deflated);
  if (repo.encryptionMode === "server") {
    const wrapped = encryptObjectBytes(repoDek(repo), buf);
    await putObject(repo.id, oid, wrapped);
    return;
  }
  // 'none' and 'e2ee' pass through verbatim — for 'e2ee' the bytes are
  // already client-side ciphertext, for 'none' they're plaintext loose.
  await putObject(repo.id, oid, buf);
}

/**
 * Fetch an object and return the deflated-loose bytes a git tool expects.
 * For server-mode repos, unwraps with the per-repo DEK. For 'e2ee' the bytes
 * are still client-side ciphertext and only the browser can decrypt them.
 */
export async function getRepoObject(
  repo: StoredRepo,
  oid: string
): Promise<Buffer | null> {
  const raw = await getObject(repo.id, oid);
  if (!raw) return null;
  if (repo.encryptionMode === "server") {
    return decryptObjectBytes(repoDek(repo), raw);
  }
  return raw;
}

export async function listFeaturedRepos(): Promise<StoredRepo[]> {
  const rows = await pg<RepoRow[]>(
    "GET",
    "repos?select=*&featured=eq.true&order=featured_rank.asc.nullslast,featured_at.desc"
  );
  return (rows ?? []).map(repoFromRow);
}

export async function setRepoFeatured(
  id: string,
  v: {
    featured: boolean;
    tag?: string | null;
    blurb?: string | null;
    rank?: number | null;
  }
): Promise<StoredRepo> {
  const patch: Record<string, unknown> = {
    featured: v.featured,
    featured_at: v.featured ? new Date().toISOString() : null,
    featured_tag: v.featured ? v.tag ?? null : null,
    featured_blurb: v.featured ? v.blurb ?? null : null,
    featured_rank: v.featured ? v.rank ?? null : null,
  };
  const rows = await pg<RepoRow[]>(
    "PATCH",
    `repos?id=eq.${encodeURIComponent(id)}&select=*`,
    patch,
    { prefer: "return=representation" }
  );
  if (!rows?.[0]) throw new Error("no such repo");
  return repoFromRow(rows[0]);
}

export async function totalRepoCounts(): Promise<{
  total: number;
  privateCount: number;
  publicCount: number;
  featuredCount: number;
}> {
  const rows = await pg<{ visibility: string; featured: boolean | null }[]>(
    "GET",
    "repos?select=visibility,featured"
  );
  const list = rows ?? [];
  return {
    total: list.length,
    privateCount: list.filter((r) => r.visibility === "private").length,
    publicCount: list.filter((r) => r.visibility === "public").length,
    featuredCount: list.filter((r) => r.featured).length,
  };
}

export async function totalUserCount(): Promise<number> {
  const rows = await pg<{ username: string }[]>("GET", "users?select=username");
  return (rows ?? []).length;
}

export async function totalObjectStats(): Promise<{
  objectCount: number;
  totalBytes: number;
}> {
  const rows = await pg<{ size: number }[]>("GET", "objects?select=size");
  const list = rows ?? [];
  return {
    objectCount: list.length,
    totalBytes: list.reduce((s, r) => s + (r.size ?? 0), 0),
  };
}

export async function repoStats(
  repoId: string
): Promise<{ objectCount: number; bytes: number }> {
  const list = await pg<{ size: number }[]>(
    "GET",
    `objects?select=size&repo_id=eq.${encodeURIComponent(repoId)}`
  );
  const arr = list ?? [];
  return {
    objectCount: arr.length,
    bytes: arr.reduce((s, r) => s + (r.size ?? 0), 0),
  };
}
