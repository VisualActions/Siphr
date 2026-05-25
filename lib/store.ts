/**
 * Server-side store. Filesystem-backed for v0.1 — swap for Postgres/Blob later.
 *
 * Important: the server only persists public material and ciphertext.
 * It never receives or stores plaintext private keys or repo keys.
 */

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = process.env.SIPHR_DATA_DIR ?? path.join(process.cwd(), "data");

export type StoredUser = {
  username: string;
  fingerprint: string;
  publicKeyJwk: JsonWebKey;
  /** Encrypted identity blob — server stores it as opaque JSON. */
  encryptedIdentity: unknown;
  createdAt: string;
  /** Verified by Siphr (e.g. Microsoft official account). */
  verified?: boolean;
  /** Optional canonical display name shown next to the badge, e.g. "Microsoft". */
  verifiedAs?: string;
  /** ISO date when verification was granted. */
  verifiedAt?: string;
  /** Org / individual / bot — affects badge tone. */
  verifiedKind?: "org" | "individual" | "bot";
};

export async function setUserVerification(
  username: string,
  v: Pick<StoredUser, "verified" | "verifiedAs" | "verifiedAt" | "verifiedKind">
): Promise<StoredUser> {
  const users = await listUsers();
  const i = users.findIndex((u) => u.username === username);
  if (i === -1) throw new Error("no such user");
  users[i] = { ...users[i], ...v };
  await writeJson(usersFile(), users);
  return users[i];
}

export type StoredRepo = {
  id: string;
  owner: string;
  name: string;
  /** "private" | "public". Public repos still encrypted; key is published. */
  visibility: "private" | "public";
  createdAt: string;
  /** username -> wrapped repo key */
  wrappedKeys: Record<string, unknown>;
};

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(file, "utf8");
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

const usersFile = () => path.join(DATA_DIR, "users.json");
const reposFile = () => path.join(DATA_DIR, "repos.json");
const repoDir = (id: string) => path.join(DATA_DIR, "repos", id);

export async function listUsers(): Promise<StoredUser[]> {
  return readJson<StoredUser[]>(usersFile(), []);
}

export async function getUser(username: string): Promise<StoredUser | null> {
  const users = await listUsers();
  return users.find((u) => u.username === username) ?? null;
}

export async function createUser(u: StoredUser): Promise<void> {
  const users = await listUsers();
  if (users.some((x) => x.username === u.username)) {
    throw new Error("username taken");
  }
  users.push(u);
  await writeJson(usersFile(), users);
}

export async function listRepos(): Promise<StoredRepo[]> {
  return readJson<StoredRepo[]>(reposFile(), []);
}

export async function getRepo(id: string): Promise<StoredRepo | null> {
  const repos = await listRepos();
  return repos.find((r) => r.id === id) ?? null;
}

export async function reposFor(username: string): Promise<StoredRepo[]> {
  const repos = await listRepos();
  return repos.filter(
    (r) => r.owner === username || username in (r.wrappedKeys ?? {})
  );
}

export async function createRepo(r: StoredRepo): Promise<void> {
  const repos = await listRepos();
  if (repos.some((x) => x.id === r.id)) {
    throw new Error("repo id collision");
  }
  repos.push(r);
  await writeJson(reposFile(), repos);
  await ensureDir(repoDir(r.id));
  await ensureDir(path.join(repoDir(r.id), "objects"));
}

export async function putObject(
  repoId: string,
  oid: string,
  ciphertext: Uint8Array | Buffer
): Promise<void> {
  if (!/^[a-f0-9]{6,128}$/.test(oid)) throw new Error("invalid oid");
  const dir = path.join(repoDir(repoId), "objects", oid.slice(0, 2));
  await ensureDir(dir);
  await fs.writeFile(path.join(dir, oid.slice(2)), Buffer.from(ciphertext));
}

export async function getObject(
  repoId: string,
  oid: string
): Promise<Buffer | null> {
  if (!/^[a-f0-9]{6,128}$/.test(oid)) return null;
  try {
    return await fs.readFile(
      path.join(repoDir(repoId), "objects", oid.slice(0, 2), oid.slice(2))
    );
  } catch {
    return null;
  }
}
