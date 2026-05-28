import { NextResponse } from "next/server";
import { getPRByNumber, updatePR } from "@/lib/prs";
import { isFastForward } from "@/lib/git-server";
import { getRef, getRepo, putRef } from "@/lib/store";
import { effectivePermission, permissionAtLeast } from "@/lib/orgs";

export const runtime = "nodejs";
export const maxDuration = 300;

type Params = { params: Promise<{ id: string; number: string }> };

/**
 * Merge a PR. v0.4d only supports fast-forward merges: head must be a
 * descendant of base, and the base ref must still be at the same oid we
 * snapshotted at PR open time. Otherwise the merge is rejected and the user
 * must rebase locally.
 */
export async function POST(req: Request, { params }: Params) {
  const { id, number } = await params;
  const n = parseInt(number, 10);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const actor = typeof b.actor === "string" ? b.actor : "";
  if (!actor) {
    return NextResponse.json({ error: "actor required" }, { status: 400 });
  }

  const repo = await getRepo(id);
  if (!repo) return NextResponse.json({ error: "no such repo" }, { status: 404 });
  const pr = await getPRByNumber(id, n);
  if (!pr) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (pr.state !== "open") {
    return NextResponse.json(
      { error: `cannot merge a ${pr.state} PR` },
      { status: 409 }
    );
  }

  // Permission: writer or better on the repo.
  const perm = await effectivePermission(actor, repo);
  if (!permissionAtLeast(perm, "write")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Confirm the base ref hasn't moved since the PR opened.
  const currentBase = await getRef(repo.id, pr.baseRef);
  if (!currentBase?.oid) {
    return NextResponse.json(
      { error: `base ref ${pr.baseRef} no longer exists` },
      { status: 409 }
    );
  }
  if (currentBase.oid !== pr.baseOid) {
    return NextResponse.json(
      {
        error: "base has moved since this PR was opened; refresh the PR",
        currentBase: currentBase.oid,
        baseAtOpen: pr.baseOid,
      },
      { status: 409 }
    );
  }

  const ff = await isFastForward(repo, pr.baseOid, pr.headOid);
  if (!ff) {
    return NextResponse.json(
      { error: "non-fast-forward merges are not supported in v0.4 — rebase locally" },
      { status: 409 }
    );
  }

  // Advance the base ref. We don't write a merge commit — fast-forward leaves
  // history linear, which is the only mode supported in v0.4.
  await putRef(repo.id, pr.baseRef, { oid: pr.headOid, target: null });

  const merged = await updatePR(pr.id, {
    state: "merged",
    mergeCommitOid: pr.headOid,
    mergedBy: actor,
  });
  return NextResponse.json({ ok: true, pr: merged });
}
