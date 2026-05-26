/**
 * Browser-side git commit driver for Siphr.
 *
 * Uses isomorphic-git over an in-memory Lightning FS to build real git
 * objects from files the user types or drops. Each emitted loose object
 * is either uploaded as-is (public repos) or encrypted with the repo
 * key (private repos) before being PUT to /api/repos/:id/objects/:oid.
 *
 * The unwrapped repo key NEVER leaves this module — callers pass it in
 * by value and we drop the reference when done.
 */

import git from "isomorphic-git";
import {
  decryptWithRepoKey,
  encryptWithRepoKey,
  fromB64Url,
  toB64Url,
  type EncryptedBlob,
} from "./crypto";

// Lightning FS exposes a node:fs/promises-shaped API but the bundled type
// signatures don't enumerate every method. We treat it as `any` at the seam
// and keep call sites narrow.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FsPromises = any;

export type FileEntry = { path: string; content: Uint8Array | string };

export type PutObjectsResult = {
  uploaded: number;
  skipped: number;
  bytes: number;
};

export type ServerObject = {
  oid: string;
  data: Uint8Array;
};

const DIR = "/repo";

// ----------------------------------------------------------------------------
// Lightning FS singleton (browser only)
// ----------------------------------------------------------------------------

let _fs: FsPromises | null = null;
async function lfs(): Promise<FsPromises> {
  if (_fs) return _fs;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = (await import("@isomorphic-git/lightning-fs")) as any;
  const FS = mod.default ?? mod;
  // Distinct per tab — we don't want a global persistent fs leaking across users.
  const prefix = `siphr-${Math.random().toString(36).slice(2, 8)}`;
  const inst = new FS(prefix);
  _fs = inst.promises as FsPromises;
  return _fs;
}

// ----------------------------------------------------------------------------
// Workspace
// ----------------------------------------------------------------------------

async function fresh(): Promise<FsPromises> {
  // Drop the cached fs so each "commit" call starts from a clean tree —
  // simpler than walking and reconciling on every keystroke.
  _fs = null;
  const p = await lfs();
  try { await p.mkdir(DIR); } catch { /* exists */ }
  return p;
}

async function writeFiles(p: FsPromises, files: FileEntry[]): Promise<void> {
  for (const f of files) {
    const full = `${DIR}/${f.path.replace(/^\/+/, "")}`;
    const dir = full.replace(/\/[^/]*$/, "");
    if (dir && dir !== DIR) {
      await mkdirP(p, dir);
    }
    const body =
      typeof f.content === "string"
        ? new TextEncoder().encode(f.content)
        : f.content;
    await p.writeFile(full, body);
  }
}

async function mkdirP(p: FsPromises, full: string): Promise<void> {
  const parts = full.split("/").filter(Boolean);
  let cur = "";
  for (const part of parts) {
    cur += "/" + part;
    try { await p.mkdir(cur); } catch { /* ignore EEXIST */ }
  }
}

// ----------------------------------------------------------------------------
// Author / repo helpers
// ----------------------------------------------------------------------------

async function initRepo(
  fs: FsPromises,
  defaultBranch: string,
  parentOid: string | null
): Promise<void> {
  await git.init({ fs, dir: DIR, defaultBranch });
  if (parentOid) {
    await git.writeRef({
      fs,
      dir: DIR,
      ref: `refs/heads/${defaultBranch}`,
      value: parentOid,
      force: true,
    });
  }
}

async function addAll(fs: FsPromises, files: FileEntry[]): Promise<void> {
  for (const f of files) {
    await git.add({ fs, dir: DIR, filepath: f.path });
  }
}

async function commit(
  fs: FsPromises,
  author: { name: string; email: string },
  message: string
): Promise<string> {
  return git.commit({
    fs, dir: DIR, message,
    author, committer: author,
  });
}

// ----------------------------------------------------------------------------
// Object enumeration
// ----------------------------------------------------------------------------

async function listLooseObjects(p: FsPromises): Promise<ServerObject[]> {
  const objectsDir = `${DIR}/.git/objects`;
  const out: ServerObject[] = [];
  let prefixes: string[];
  try {
    prefixes = await p.readdir(objectsDir);
  } catch {
    return out;
  }
  for (const prefix of prefixes) {
    if (prefix === "info" || prefix === "pack") continue;
    if (!/^[a-f0-9]{2}$/.test(prefix)) continue;
    let files: string[];
    try {
      files = await p.readdir(`${objectsDir}/${prefix}`);
    } catch {
      continue;
    }
    for (const rest of files) {
      if (!/^[a-f0-9]+$/.test(rest)) continue;
      const oid = prefix + rest;
      const data = (await p.readFile(`${objectsDir}/${prefix}/${rest}`)) as Uint8Array;
      out.push({ oid, data });
    }
  }
  return out;
}

// ----------------------------------------------------------------------------
// Upload — public stores zlib bytes verbatim; private wraps with repo key.
// ----------------------------------------------------------------------------

async function uploadObject(
  repoId: string,
  oid: string,
  data: Uint8Array,
  repoKey: Uint8Array | null
): Promise<{ size: number; skipped: boolean }> {
  // Skip if already present — content-addressed so duplicate uploads are wasted bytes.
  const head = await fetch(`/api/repos/${repoId}/objects/${oid}`, { method: "HEAD" });
  if (head.ok) return { size: data.length, skipped: true };

  let body: Uint8Array;
  let headers: Record<string, string> = { "content-type": "application/octet-stream" };

  if (repoKey) {
    const enc = await encryptWithRepoKey(repoKey, data);
    const json = JSON.stringify(enc);
    body = new TextEncoder().encode(json);
    headers = { "content-type": "application/x-siphr-encrypted-object+json" };
  } else {
    body = data;
  }

  const r = await fetch(`/api/repos/${repoId}/objects/${oid}`, {
    method: "PUT",
    headers,
    body: body as unknown as BodyInit,
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`object ${oid.slice(0, 8)}: ${r.status} ${t}`);
  }
  return { size: body.length, skipped: false };
}

// ----------------------------------------------------------------------------
// Public entry point
// ----------------------------------------------------------------------------

export type CommitOptions = {
  repoId: string;
  branch: string;
  files: FileEntry[];
  message: string;
  author: { name: string; email: string };
  visibility: "public" | "private";
  /** When visibility === "private", the unwrapped 32-byte repo key. */
  repoKey?: Uint8Array | null;
};

export type CommitResult = {
  oid: string;
  refUpdated: boolean;
  upload: PutObjectsResult;
};

/**
 * Build a commit in an in-memory git workspace, then upload every loose object
 * (encrypted if private) and advance the branch ref on the server.
 */
export async function siphrCommit(opts: CommitOptions): Promise<CommitResult> {
  if (opts.visibility === "private" && (!opts.repoKey || opts.repoKey.length !== 32)) {
    throw new Error("private commit requires a 32-byte repo key in this tab");
  }

  // Resolve current HEAD so the new commit descends from it.
  const headRes = await fetch(`/api/repos/${opts.repoId}/refs`);
  const headJson = headRes.ok ? await headRes.json() : { refs: [] };
  const branchRef = (headJson.refs as { name: string; oid: string | null }[] | undefined)?.find(
    (r) => r.name === `refs/heads/${opts.branch}`
  );
  const parent = branchRef?.oid ?? null;

  const fs = await fresh();
  await initRepo(fs, opts.branch, parent);

  // If there is a parent, we need to materialize it in the workspace so
  // isomorphic-git computes a real diff against existing trees. For v0.2 we
  // skip this — every commit is from a clean slate, meaning we don't yet
  // support amendments. Documented in /roadmap.

  await writeFiles(fs, opts.files);
  await addAll(fs, opts.files);
  const oid = await commit(fs, opts.author, opts.message);

  const objects = await listLooseObjects(fs);

  let uploaded = 0;
  let skipped = 0;
  let bytes = 0;
  for (const o of objects) {
    const r = await uploadObject(
      opts.repoId,
      o.oid,
      o.data,
      opts.visibility === "private" ? (opts.repoKey ?? null) : null
    );
    bytes += r.size;
    if (r.skipped) skipped++;
    else uploaded++;
  }

  // Advance the branch ref + HEAD (HEAD only if this is the first commit).
  const refPut = await fetch(`/api/repos/${opts.repoId}/refs`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      refs: [
        { name: `refs/heads/${opts.branch}`, oid },
        { name: "HEAD", target: `ref: refs/heads/${opts.branch}` },
      ],
    }),
  });

  return {
    oid,
    refUpdated: refPut.ok,
    upload: { uploaded, skipped, bytes },
  };
}

// ----------------------------------------------------------------------------
// Repo-key (un)wrap utilities used by the browser components
// ----------------------------------------------------------------------------

/** Pull the repo key for this tab out of sessionStorage. */
export function repoKeyFromSession(repoId: string): Uint8Array | null {
  const b64 = sessionStorage.getItem(`siphr:repokey:${repoId}`);
  if (!b64) return null;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Re-export so client components don't import lib/crypto directly. */
export const decodeEncryptedBlob = async (
  repoKey: Uint8Array,
  blob: EncryptedBlob
): Promise<Uint8Array> => decryptWithRepoKey(repoKey, blob);

export { encryptWithRepoKey, fromB64Url, toB64Url };
