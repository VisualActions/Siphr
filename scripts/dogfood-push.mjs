#!/usr/bin/env node
/**
 * Push the local git history to a Siphr instance one object at a time.
 *
 * Why this exists: Vercel's serverless functions cap request bodies at
 * ~4.5MB, so smart-HTTP `git push` fails (413) for any pack larger than
 * that. The per-object PUT endpoint takes one deflated loose-object per
 * request — always small enough.
 *
 * Algorithm:
 *   1. `git cat-file --batch-all-objects --batch-check` → all OIDs + type
 *      + size on this side
 *   2. HEAD each one on the server; only upload the ones missing
 *   3. For each missing OID: `git cat-file <type> <oid>` → raw content,
 *      reassemble loose-object header, zlib-deflate, PUT
 *   4. PUT refs/heads/main pointing at HEAD
 *
 * Usage:
 *   SIPHR_URL=https://siphr.dev SIPHR_REPO_ID=<uuid> SIPHR_PAT=<token> \
 *     node scripts/dogfood-push.mjs [branch]
 *
 * `branch` defaults to the current branch's HEAD oid.
 */

import { spawn } from "node:child_process";
import { deflateSync } from "node:zlib";

const BASE = process.env.SIPHR_URL ?? "https://siphr.dev";
const REPO_ID = process.env.SIPHR_REPO_ID;
const PAT = process.env.SIPHR_PAT;
const REF = process.env.SIPHR_REF ?? "refs/heads/main";

if (!REPO_ID) {
  console.error("SIPHR_REPO_ID required");
  process.exit(1);
}
if (!PAT) {
  console.error("SIPHR_PAT required (so the final ref-set call can auth)");
  process.exit(1);
}

// ---- shell helpers ------------------------------------------------------

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "inherit"], ...opts });
    const chunks = [];
    child.stdout.on("data", (b) => chunks.push(b));
    child.on("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(chunks))
        : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`))
    );
    child.on("error", reject);
    if (opts.input != null) child.stdin.end(opts.input);
    else child.stdin.end();
  });
}

async function gitText(args) {
  const buf = await run("git", args);
  return buf.toString("utf8").trimEnd();
}

// ---- object enumeration -------------------------------------------------

async function listAllOids() {
  // type + size of every object the local repo can reach
  const out = await gitText([
    "cat-file",
    "--batch-all-objects",
    "--batch-check=%(objectname) %(objecttype) %(objectsize)",
  ]);
  return out.split("\n").filter(Boolean).map((line) => {
    const [oid, type, size] = line.split(" ");
    return { oid, type, size: parseInt(size, 10) };
  });
}

async function readObject(oid, type) {
  // Note: --batch could be faster, but per-call cat-file keeps the script
  // simple and is fast enough for tens of thousands of objects.
  return run("git", ["cat-file", type, oid]);
}

function serializeLooseObject(type, content) {
  // Standard git loose-object format: `<type> <size>\0<content>`, zlib-deflated.
  const header = Buffer.from(`${type} ${content.length}\0`, "utf8");
  return deflateSync(Buffer.concat([header, content]));
}

// ---- server transport ---------------------------------------------------

async function objectExists(oid) {
  const r = await fetch(`${BASE}/api/repos/${REPO_ID}/objects/${oid}`, {
    method: "HEAD",
  });
  return r.status === 200;
}

async function putObject(oid, deflated) {
  // Vercel + Supabase occasionally hand back a transient 500. Cheap retry.
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 200 * 2 ** attempt));
    }
    try {
      const r = await fetch(`${BASE}/api/repos/${REPO_ID}/objects/${oid}`, {
        method: "PUT",
        headers: { "content-type": "application/octet-stream" },
        body: deflated,
      });
      if (r.ok) return;
      // 4xx is not retried — it's a real bug, surface it.
      if (r.status >= 400 && r.status < 500) {
        const text = await r.text().catch(() => "");
        throw new Error(`PUT object ${oid} -> ${r.status}: ${text}`);
      }
      const text = await r.text().catch(() => "");
      lastErr = new Error(`${r.status}: ${text.slice(0, 120)}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`PUT object ${oid} gave up after retries: ${lastErr?.message}`);
}

async function putRefs(refs) {
  const auth = `Basic ${Buffer.from(`siphr:${PAT}`).toString("base64")}`;
  const r = await fetch(`${BASE}/api/repos/${REPO_ID}/refs`, {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify({ refs }),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`PUT refs failed: ${r.status} ${text}`);
  }
}

// ---- main ---------------------------------------------------------------

async function main() {
  const branch = process.argv[2];
  const tipOid = branch ?? (await gitText(["rev-parse", "HEAD"]));
  console.log(`tip:   ${tipOid}`);
  console.log(`ref:   ${REF}`);
  console.log(`base:  ${BASE}`);
  console.log(`repo:  ${REPO_ID}`);
  console.log();

  // Walk only objects reachable from tipOid — don't ship unrelated history.
  const reachableText = await gitText(["rev-list", "--objects", tipOid]);
  const reachable = new Set(
    reachableText
      .split("\n")
      .map((l) => l.split(" ")[0])
      .filter((s) => /^[a-f0-9]{40}$/.test(s))
  );

  const all = await listAllOids();
  const todo = all.filter((o) => reachable.has(o.oid));
  console.log(`${todo.length} reachable objects from ${tipOid.slice(0, 7)}`);

  // Concurrency-limited upload loop.
  const CONCURRENCY = 8;
  let uploaded = 0;
  let skipped = 0;
  let bytesOut = 0;
  let inflight = [];

  async function uploadOne({ oid, type }) {
    if (await objectExists(oid)) {
      skipped++;
      return;
    }
    const content = await readObject(oid, type);
    const deflated = serializeLooseObject(type, content);
    await putObject(oid, deflated);
    uploaded++;
    bytesOut += deflated.length;
  }

  let i = 0;
  while (i < todo.length) {
    while (inflight.length < CONCURRENCY && i < todo.length) {
      const item = todo[i++];
      const p = uploadOne(item)
        .catch((e) => {
          console.error(`× ${item.oid}: ${e.message}`);
          throw e;
        })
        .finally(() => {
          inflight = inflight.filter((x) => x !== p);
        });
      inflight.push(p);
    }
    await Promise.race(inflight);
    if (i % 100 === 0 || i === todo.length) {
      process.stdout.write(
        `\r${i}/${todo.length} · ↑ ${uploaded} · ✓ ${skipped} · ${(bytesOut / 1024).toFixed(0)} KiB`
      );
    }
  }
  await Promise.all(inflight);
  process.stdout.write(
    `\r${todo.length}/${todo.length} · ↑ ${uploaded} · ✓ ${skipped} · ${(bytesOut / 1024).toFixed(0)} KiB\n`
  );

  console.log(`\nSetting ${REF} → ${tipOid}`);
  // Update both the branch and HEAD so default-branch resolution still works.
  await putRefs([
    { name: REF, oid: tipOid },
    { name: "HEAD", target: `ref: ${REF}` },
  ]);
  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
