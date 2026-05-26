/**
 * Server-side persistence backed by Supabase Postgres.
 *
 * The server only persists public material and either:
 *   - public repos: zlib-deflated plaintext git objects
 *   - private repos: AES-256-GCM ciphertext (server holds no key to unwrap)
 */

import { bytesToHexLiteral, decodeBytea, pg, upsert } from "./supabase";

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

export type StoredRepo = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  description: string | null;
  defaultBranch: string;
  createdAt: string;
  wrappedKeys: Record<string, unknown>;
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
  created_at: string;
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

export async function createRepo(
  r: Omit<StoredRepo, "id" | "createdAt" | "defaultBranch" | "description"> & {
    description?: string | null;
    defaultBranch?: string;
  }
): Promise<StoredRepo> {
  const rows = await pg<RepoRow[]>(
    "POST",
    "repos?select=*",
    [
      {
        owner: r.owner,
        name: r.name,
        visibility: r.visibility,
        description: r.description ?? null,
        default_branch: r.defaultBranch ?? "main",
        wrapped_keys: r.wrappedKeys ?? {},
      },
    ],
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
