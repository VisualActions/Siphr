/**
 * Server-side git smart-HTTP transport.
 *
 * Backed by Supabase loose-object storage. Each request materializes the
 * relevant objects into a fresh temp dir, lets isomorphic-git do the protocol
 * work, then persists changes back to Supabase.
 *
 * Vercel functions get a writable /tmp (up to 512MB) and a 300s execution
 * budget — both sufficient for non-trivial pushes.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import os from "node:os";
import git from "isomorphic-git";
import {
  getObject,
  listRefs,
  putObject,
  putRef,
  type StoredRepo,
  type StoredRef,
} from "./store";
import { concat, pkt, readPktLines, FLUSH } from "./pkt";

const enc = new TextEncoder();

// Only advertise what we actually implement on the server side.
// Anything else (side-band-64k, multi_ack, shallow, etc.) would cause the
// client to expect framing/negotiation we don't speak — see the "bad band"
// protocol error we hit during early testing.
const CAPS_ADV = [
  "report-status",
  "delete-refs",
  "ofs-delta",
  "no-thin",
  "agent=siphr/0.3",
];

// ============================================================================
// Workspace
// ============================================================================

type Workspace = {
  dir: string;
  cleanup: () => Promise<void>;
};

async function mkTemp(repoId: string): Promise<Workspace> {
  const base = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), `siphr-${repoId.slice(0, 8)}-`)
  );
  await fs.promises.mkdir(path.join(base, ".git", "objects", "pack"), { recursive: true });
  await fs.promises.writeFile(path.join(base, ".git", "HEAD"), "ref: refs/heads/main\n");
  return {
    dir: base,
    cleanup: async () => {
      try { await fs.promises.rm(base, { recursive: true, force: true }); } catch { /* */ }
    },
  };
}

async function writeLooseObject(dir: string, oid: string, body: Buffer): Promise<void> {
  const prefix = oid.slice(0, 2);
  const rest = oid.slice(2);
  const d = path.join(dir, ".git", "objects", prefix);
  await fs.promises.mkdir(d, { recursive: true });
  await fs.promises.writeFile(path.join(d, rest), body);
}

async function readLooseObject(dir: string, oid: string): Promise<Buffer | null> {
  const fp = path.join(dir, ".git", "objects", oid.slice(0, 2), oid.slice(2));
  try { return await fs.promises.readFile(fp); }
  catch { return null; }
}

// ============================================================================
// Hydrate refs into the temp workspace
// ============================================================================

async function hydrateRefs(dir: string, refs: StoredRef[]): Promise<void> {
  let head: string | null = null;
  for (const ref of refs) {
    if (ref.name === "HEAD") {
      head = ref.target ?? (ref.oid ? `ref: refs/heads/main` : null);
      continue;
    }
    if (!ref.oid) continue;
    const fp = path.join(dir, ".git", ref.name);
    await fs.promises.mkdir(path.dirname(fp), { recursive: true });
    await fs.promises.writeFile(fp, ref.oid + "\n");
  }
  if (head) {
    await fs.promises.writeFile(path.join(dir, ".git", "HEAD"), head + "\n");
  }
}

// ============================================================================
// Object walking — find every loose object reachable from a set of commit oids.
// Uses isomorphic-git's parsers after we've materialized objects into /tmp.
// ============================================================================

type WalkContext = {
  dir: string;
  repoId: string;
  cache: Map<string, Buffer>; // hydrated object bytes (zlib-deflated wrapped form)
};

async function fetchAndCacheObject(ctx: WalkContext, oid: string): Promise<Buffer | null> {
  if (ctx.cache.has(oid)) return ctx.cache.get(oid)!;
  const buf = await getObject(ctx.repoId, oid);
  if (!buf) return null;
  ctx.cache.set(oid, buf);
  await writeLooseObject(ctx.dir, oid, buf);
  return buf;
}

async function walkFromCommits(
  ctx: WalkContext,
  startOids: string[]
): Promise<Set<string>> {
  const reachable = new Set<string>();
  const queue: string[] = [...startOids];
  while (queue.length) {
    const oid = queue.shift()!;
    if (reachable.has(oid)) continue;
    const present = await fetchAndCacheObject(ctx, oid);
    if (!present) continue;
    reachable.add(oid);

    // Read object via isomorphic-git to walk its references
    try {
      const obj = await git.readObject({
        fs,
        dir: ctx.dir,
        oid,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const o = obj.object as any;
      if (obj.type === "commit") {
        if (o.tree) queue.push(o.tree);
        if (Array.isArray(o.parent)) queue.push(...o.parent);
      } else if (obj.type === "tree") {
        // o is either a TreeObject (iterable of [i, entry]) or a parsed array shape.
        if (Array.isArray(o)) {
          for (const e of o) if (e?.oid) queue.push(e.oid);
        } else if (o?.entries) {
          const entries = typeof o.entries === "function" ? Array.from(o.entries()) : o.entries;
          for (const e of entries) {
            const entry = Array.isArray(e) ? e[1] : e;
            if (entry?.oid) queue.push(entry.oid);
          }
        }
      } else if (obj.type === "tag") {
        if (o.object) queue.push(o.object);
      }
    } catch {
      /* skip unparseable */
    }
  }
  return reachable;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/** Build the smart-HTTP service advertisement (for info/refs). */
export async function buildAdvertisement(
  service: "git-upload-pack" | "git-receive-pack",
  repo: StoredRepo
): Promise<Uint8Array> {
  const refs = await listRefs(repo.id);
  const headOid = await resolveHead(repo.id, refs);

  // The first reported ref carries the capability list (NUL-separated).
  // If there are no refs at all, we still send a single ref-less line
  // following git protocol convention.
  const lines: Uint8Array[] = [];
  // Service prefix
  lines.push(pkt(`# service=${service}\n`));
  lines.push(FLUSH);

  if (refs.length === 0 || !headOid) {
    // Empty repo capability advertisement
    lines.push(
      pkt(`0000000000000000000000000000000000000000 capabilities^{}\0${CAPS_ADV.join(" ")}\n`)
    );
    lines.push(FLUSH);
    return concat(lines);
  }

  let first = true;
  // Advertise HEAD (resolved) first — clients use this to determine default branch.
  if (headOid) {
    const head: string = first
      ? `${headOid} HEAD\0${CAPS_ADV.join(" ")} symref=HEAD:refs/heads/${defaultBranchFromRefs(refs)}\n`
      : `${headOid} HEAD\n`;
    lines.push(pkt(head));
    first = false;
  }

  for (const r of refs) {
    if (!r.oid || r.name === "HEAD") continue;
    const ann: string = first
      ? `${r.oid} ${r.name}\0${CAPS_ADV.join(" ")}\n`
      : `${r.oid} ${r.name}\n`;
    lines.push(pkt(ann));
    first = false;
  }
  lines.push(FLUSH);
  return concat(lines);
}

async function resolveHead(repoId: string, refs: StoredRef[]): Promise<string | null> {
  const headRef = refs.find((r) => r.name === "HEAD");
  if (!headRef) return null;
  if (headRef.oid) return headRef.oid;
  if (headRef.target) {
    const target = headRef.target.replace(/^ref: /, "");
    const targetRef = refs.find((r) => r.name === target);
    return targetRef?.oid ?? null;
  }
  return null;
}

function defaultBranchFromRefs(refs: StoredRef[]): string {
  const head = refs.find((r) => r.name === "HEAD");
  if (head?.target) {
    const target = head.target.replace(/^ref: /, "");
    if (target.startsWith("refs/heads/")) return target.slice("refs/heads/".length);
  }
  const first = refs.find((r) => r.name.startsWith("refs/heads/"));
  return first ? first.name.slice("refs/heads/".length) : "main";
}

// ============================================================================
// upload-pack — serve a clone/fetch
// ============================================================================

export async function handleUploadPack(
  repo: StoredRepo,
  body: Uint8Array
): Promise<Uint8Array> {
  // Parse want lines + done.
  const { lines } = readPktLines(body);
  const wants: string[] = [];
  for (const l of lines) {
    if (l.kind !== "data") continue;
    const m = /^want ([a-f0-9]{40})/.exec(l.text);
    if (m) wants.push(m[1]);
  }

  if (wants.length === 0) {
    return concat([pkt("NAK\n")]);
  }

  const ws = await mkTemp(repo.id);
  try {
    // Initialize a bare-ish repo (we keep working tree off-disk)
    await git.init({ fs, dir: ws.dir, defaultBranch: "main" });

    // Walk all reachable objects from the wants
    const ctx: WalkContext = { dir: ws.dir, repoId: repo.id, cache: new Map() };
    const reachable = await walkFromCommits(ctx, wants);

    if (reachable.size === 0) {
      return concat([pkt("NAK\n")]);
    }

    // Pack them
    const result = await git.packObjects({
      fs,
      dir: ws.dir,
      oids: Array.from(reachable),
      write: false,
    });
    const packBytes = (result as { packfile?: Uint8Array }).packfile;
    if (!packBytes) {
      throw new Error("packObjects returned no packfile");
    }

    // Response: NAK pkt-line, then raw pack bytes (no side-band; we didn't negotiate it).
    return concat([pkt("NAK\n"), packBytes]);
  } finally {
    await ws.cleanup();
  }
}

// ============================================================================
// receive-pack — accept a push
// ============================================================================

export type RefUpdate = {
  oldOid: string;
  newOid: string;
  ref: string;
};

export async function handleReceivePack(
  repo: StoredRepo,
  body: Uint8Array
): Promise<Uint8Array> {
  // Parse ref-update commands until flush, then the packfile follows verbatim.
  const { lines, next } = readPktLines(body);

  const updates: RefUpdate[] = [];
  for (const l of lines) {
    if (l.kind !== "data") continue;
    // Format: <old-oid> <new-oid> <refname>\0<capabilities>?\n
    const text = l.text.split("\0")[0];
    const m = /^([a-f0-9]{40}) ([a-f0-9]{40}) (\S+)/.exec(text);
    if (m) {
      updates.push({ oldOid: m[1], newOid: m[2], ref: m[3] });
    }
  }

  // Filter zero-pack (just-ref-update) requests: if all newOids are zero, no pack.
  const ZERO = "0000000000000000000000000000000000000000";
  const hasPack = updates.some((u) => u.newOid !== ZERO);
  const pack = body.subarray(next);

  const reports: { ref: string; ok: boolean; msg?: string }[] = [];
  let unpackStatus = "ok";

  const ws = await mkTemp(repo.id);
  try {
    await git.init({ fs, dir: ws.dir, defaultBranch: "main" });

    // Hydrate existing refs so the new pack's objects can resolve their parents.
    const existingRefs = await listRefs(repo.id);
    await hydrateRefs(ws.dir, existingRefs);

    // Materialize the existing object graph that the push descends from so
    // deltas in the new pack can be resolved against it.
    if (existingRefs.length > 0) {
      const ctx: WalkContext = { dir: ws.dir, repoId: repo.id, cache: new Map() };
      const seedOids = updates
        .map((u) => u.oldOid)
        .filter((o) => o && o !== ZERO);
      await walkFromCommits(ctx, seedOids);
    }

    let unpackedOids: string[] = [];
    if (hasPack && pack.length > 32) {
      try {
        const packName = `pack-${sha1(pack).slice(0, 40)}.pack`;
        const packPath = path.join(ws.dir, ".git", "objects", "pack", packName);
        await fs.promises.writeFile(packPath, pack);
        const idx = await git.indexPack({
          fs,
          dir: ws.dir,
          filepath: path.join("objects", "pack", packName),
        });
        unpackedOids = (idx as unknown as { oids: string[] }).oids ?? [];
      } catch (e) {
        unpackStatus = `unpack failed: ${e instanceof Error ? e.message : "unknown"}`;
      }
    }

    // Persist each new object as a loose object back to Supabase.
    if (unpackStatus === "ok") {
      for (const oid of unpackedOids) {
        // readObject returns the inflated wrapped data with format:'wrapped'
        try {
          const obj = await git.readObject({
            fs,
            dir: ws.dir,
            oid,
            format: "wrapped",
          });
          const wrapped = obj.object as Uint8Array;
          // Re-deflate to the canonical loose-object byte form before storing.
          const deflated = zlib.deflateSync(Buffer.from(wrapped));
          await putObject(repo.id, oid, deflated);
        } catch (e) {
          unpackStatus = `unpack failed: object ${oid.slice(0, 7)}: ${
            e instanceof Error ? e.message : "unknown"
          }`;
          break;
        }
      }
    }

    // Apply ref updates
    if (unpackStatus === "ok") {
      for (const u of updates) {
        try {
          if (u.newOid === ZERO) {
            // Delete the ref by clearing the oid + target.
            await putRef(repo.id, u.ref, { oid: null, target: null });
          } else {
            // Sanity-check that we have the object the ref is pointing at.
            const have = await readLooseObject(ws.dir, u.newOid);
            if (!have) {
              reports.push({ ref: u.ref, ok: false, msg: "missing-object" });
              continue;
            }
            await putRef(repo.id, u.ref, { oid: u.newOid, target: null });
          }
          // If there's no HEAD yet, point it at the first branch we accept.
          if (u.ref.startsWith("refs/heads/")) {
            const head = existingRefs.find((r) => r.name === "HEAD");
            if (!head) {
              await putRef(repo.id, "HEAD", { oid: null, target: `ref: ${u.ref}` });
            }
          }
          reports.push({ ref: u.ref, ok: true });
        } catch (e) {
          reports.push({
            ref: u.ref, ok: false,
            msg: e instanceof Error ? e.message : "store-failed",
          });
        }
      }
    }
  } finally {
    await ws.cleanup();
  }

  // Build status report
  const out: Uint8Array[] = [];
  out.push(pkt(`unpack ${unpackStatus}\n`));
  for (const r of reports) {
    out.push(pkt(r.ok ? `ok ${r.ref}\n` : `ng ${r.ref} ${r.msg ?? "fail"}\n`));
  }
  out.push(FLUSH);
  return concat(out);
}

function sha1(b: Uint8Array): string {
  return crypto.createHash("sha1").update(b).digest("hex");
}

// Export for content-type usage in routes
export const CT_ADVERTISEMENT = (service: string) =>
  `application/x-${service}-advertisement`;
export const CT_RESULT = (service: string) => `application/x-${service}-result`;

// Tell next/eslint the unused enc constant is intentional (we may use it later).
void enc;
