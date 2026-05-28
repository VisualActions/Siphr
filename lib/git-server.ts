/**
 * Server-side git mechanics used by PR diffing + merging.
 *
 * The pattern is the same as lib/git-transport.ts: spin up a /tmp workspace,
 * hydrate the relevant object slice via getRepoObject (which transparently
 * decrypts server-mode repos), then let isomorphic-git do the parsing.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import git from "isomorphic-git";
import type { StoredRepo } from "./store";
import { getRepoObject } from "./store";

type Workspace = {
  dir: string;
  cleanup: () => Promise<void>;
};

async function mkTemp(repoId: string): Promise<Workspace> {
  const dir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), `siphr-diff-${repoId.slice(0, 8)}-`)
  );
  await fs.promises.mkdir(path.join(dir, ".git", "objects", "pack"), {
    recursive: true,
  });
  await fs.promises.writeFile(path.join(dir, ".git", "HEAD"), "ref: refs/heads/main\n");
  return {
    dir,
    cleanup: async () => {
      try { await fs.promises.rm(dir, { recursive: true, force: true }); } catch { /* */ }
    },
  };
}

async function writeLoose(dir: string, oid: string, body: Buffer) {
  const d = path.join(dir, ".git", "objects", oid.slice(0, 2));
  await fs.promises.mkdir(d, { recursive: true });
  await fs.promises.writeFile(path.join(d, oid.slice(2)), body);
}

/**
 * Hydrate every object reachable from `roots` into a temp workspace.
 * Returns the workspace handle; caller is responsible for cleanup.
 */
async function hydrateReachable(
  repo: StoredRepo,
  roots: string[]
): Promise<Workspace> {
  const ws = await mkTemp(repo.id);
  await git.init({ fs, dir: ws.dir, defaultBranch: "main" });

  const seen = new Set<string>();
  const queue: string[] = [...roots];
  while (queue.length) {
    const oid = queue.shift()!;
    if (!oid || seen.has(oid)) continue;
    seen.add(oid);
    const buf = await getRepoObject(repo, oid);
    if (!buf) continue;
    await writeLoose(ws.dir, oid, buf);
    try {
      const obj = await git.readObject({ fs, dir: ws.dir, oid });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const o = obj.object as any;
      if (obj.type === "commit") {
        if (o.tree) queue.push(o.tree);
        if (Array.isArray(o.parent)) queue.push(...o.parent);
      } else if (obj.type === "tree") {
        if (Array.isArray(o)) {
          for (const e of o) if (e?.oid) queue.push(e.oid);
        } else if (o?.entries) {
          const entries = typeof o.entries === "function"
            ? Array.from(o.entries())
            : o.entries;
          for (const e of entries) {
            const entry = Array.isArray(e) ? e[1] : e;
            if (entry?.oid) queue.push(entry.oid);
          }
        }
      } else if (obj.type === "tag") {
        if (o.object) queue.push(o.object);
      }
    } catch { /* */ }
  }
  return ws;
}

/**
 * Walk back from `head` and return the set of commit oids ancestor-of head
 * (including head itself). Used to check whether base is reachable from head
 * (fast-forward eligibility).
 */
async function ancestors(dir: string, head: string): Promise<Set<string>> {
  const out = new Set<string>();
  const queue: string[] = [head];
  while (queue.length) {
    const oid = queue.shift()!;
    if (!oid || out.has(oid)) continue;
    out.add(oid);
    try {
      const obj = await git.readObject({ fs, dir, oid });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const o = obj.object as any;
      if (obj.type === "commit" && Array.isArray(o.parent)) {
        queue.push(...o.parent);
      }
    } catch { /* */ }
  }
  return out;
}

/**
 * True if `head` is a descendant of `base` (or equal), meaning a fast-forward
 * merge is mathematically possible.
 */
export async function isFastForward(
  repo: StoredRepo,
  baseOid: string,
  headOid: string
): Promise<boolean> {
  if (baseOid === headOid) return true;
  const ws = await hydrateReachable(repo, [headOid, baseOid]);
  try {
    const anc = await ancestors(ws.dir, headOid);
    return anc.has(baseOid);
  } finally {
    await ws.cleanup();
  }
}

/** Count how many commits `head` is ahead of `base`. Counts head's ancestors
 *  that aren't reachable from base. Returns null if either is missing. */
export async function aheadBehind(
  repo: StoredRepo,
  baseOid: string,
  headOid: string
): Promise<{ ahead: number; behind: number } | null> {
  if (baseOid === headOid) return { ahead: 0, behind: 0 };
  const ws = await hydrateReachable(repo, [headOid, baseOid]);
  try {
    const headAnc = await ancestors(ws.dir, headOid);
    const baseAnc = await ancestors(ws.dir, baseOid);
    let ahead = 0, behind = 0;
    for (const oid of headAnc) if (!baseAnc.has(oid)) ahead++;
    for (const oid of baseAnc) if (!headAnc.has(oid)) behind++;
    return { ahead, behind };
  } finally {
    await ws.cleanup();
  }
}

/**
 * Compute a flat list of file-level changes between two trees referenced by
 * commit oids. No inline content diff in v0.4d-MVP — just paths + status.
 */
export type FileChange = {
  path: string;
  status: "added" | "removed" | "modified";
  // file mode is best-effort; isomorphic-git surfaces it as a string.
  baseOid: string | null;
  headOid: string | null;
};

async function listTreeEntries(
  dir: string,
  treeOid: string,
  prefix: string,
  out: Map<string, { oid: string }>
): Promise<void> {
  const obj = await git.readObject({ fs, dir, oid: treeOid }).catch(() => null);
  if (!obj || obj.type !== "tree") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = obj.object as any;
  const rawEntries: { path: string; oid: string; type: string }[] = [];
  if (Array.isArray(o)) {
    for (const e of o) {
      if (e?.oid && e?.path) rawEntries.push({ path: e.path, oid: e.oid, type: e.type });
    }
  } else if (o?.entries) {
    const it = typeof o.entries === "function" ? Array.from(o.entries()) : o.entries;
    for (const e of it) {
      const entry = Array.isArray(e) ? e[1] : e;
      if (entry?.oid && entry?.path)
        rawEntries.push({ path: entry.path, oid: entry.oid, type: entry.type });
    }
  }
  for (const e of rawEntries) {
    const full = prefix ? `${prefix}/${e.path}` : e.path;
    if (e.type === "tree" || e.type === "002") {
      await listTreeEntries(dir, e.oid, full, out);
    } else {
      out.set(full, { oid: e.oid });
    }
  }
}

async function commitTreeOid(dir: string, commitOid: string): Promise<string | null> {
  const obj = await git.readObject({ fs, dir, oid: commitOid }).catch(() => null);
  if (!obj || obj.type !== "commit") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = obj.object as any;
  return o.tree ?? null;
}

export async function diffTrees(
  repo: StoredRepo,
  baseCommit: string,
  headCommit: string
): Promise<FileChange[]> {
  const ws = await hydrateReachable(repo, [baseCommit, headCommit]);
  try {
    const baseTreeOid = await commitTreeOid(ws.dir, baseCommit);
    const headTreeOid = await commitTreeOid(ws.dir, headCommit);

    const baseFiles = new Map<string, { oid: string }>();
    const headFiles = new Map<string, { oid: string }>();
    if (baseTreeOid) await listTreeEntries(ws.dir, baseTreeOid, "", baseFiles);
    if (headTreeOid) await listTreeEntries(ws.dir, headTreeOid, "", headFiles);

    const changes: FileChange[] = [];
    const seen = new Set<string>();
    for (const [path, head] of headFiles.entries()) {
      seen.add(path);
      const base = baseFiles.get(path);
      if (!base) {
        changes.push({ path, status: "added", baseOid: null, headOid: head.oid });
      } else if (base.oid !== head.oid) {
        changes.push({ path, status: "modified", baseOid: base.oid, headOid: head.oid });
      }
    }
    for (const [path, base] of baseFiles.entries()) {
      if (seen.has(path)) continue;
      changes.push({ path, status: "removed", baseOid: base.oid, headOid: null });
    }
    changes.sort((a, b) => a.path.localeCompare(b.path));
    return changes;
  } finally {
    await ws.cleanup();
  }
}
