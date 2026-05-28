import { NextResponse } from "next/server";
import { getPRByNumber, updatePR, type PRState } from "@/lib/prs";
import { aheadBehind, diffTrees } from "@/lib/git-server";
import { getRepo } from "@/lib/store";
import { requireSession } from "@/lib/auth";
import { effectivePermission, permissionAtLeast } from "@/lib/orgs";

export const runtime = "nodejs";
export const maxDuration = 300;

type Params = { params: Promise<{ id: string; number: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id, number } = await params;
  const n = parseInt(number, 10);
  if (!Number.isFinite(n)) {
    return NextResponse.json({ error: "invalid number" }, { status: 400 });
  }
  const repo = await getRepo(id);
  if (!repo) return NextResponse.json({ error: "no such repo" }, { status: 404 });
  const pr = await getPRByNumber(id, n);
  if (!pr) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Optionally include diff metadata when ?diff=1 is set. Doing it lazily keeps
  // the cheap GET cheap.
  const url = new URL(req.url);
  const wantDiff = url.searchParams.get("diff") === "1";
  if (!wantDiff) return NextResponse.json({ pr });

  const [counts, changes] = await Promise.all([
    aheadBehind(repo, pr.baseOid, pr.headOid),
    diffTrees(repo, pr.baseOid, pr.headOid),
  ]);
  return NextResponse.json({ pr, counts, changes });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireSession(req);
  if (auth.deny) return auth.deny;

  const { id, number } = await params;
  const n = parseInt(number, 10);
  const repo = await getRepo(id);
  if (!repo) return NextResponse.json({ error: "no such repo" }, { status: 404 });
  const existing = await getPRByNumber(id, n);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Author can edit own PR + flip its open/closed state; maintainers can too.
  const perm = await effectivePermission(auth.user, repo);
  const canManage = permissionAtLeast(perm, "maintain") || auth.user === existing.author;
  if (!canManage) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const patch: Parameters<typeof updatePR>[1] = {};
  if (typeof b.title === "string") patch.title = b.title.trim().slice(0, 200);
  if (typeof b.body === "string") {
    if (b.body.length > 64_000) return NextResponse.json({ error: "body too long" }, { status: 413 });
    patch.body = b.body;
  }
  if (b.state === "open" || b.state === "closed") {
    // 'merged' is only set by the merge endpoint.
    patch.state = b.state as PRState;
  }
  const updated = await updatePR(existing.id, patch);
  return NextResponse.json({ ok: true, pr: updated });
}
