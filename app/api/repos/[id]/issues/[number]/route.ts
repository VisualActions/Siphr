import { NextResponse } from "next/server";
import { getIssueByNumber, updateIssue, type IssueState } from "@/lib/issues";
import { getRepo } from "@/lib/store";
import { requireSession } from "@/lib/auth";
import { effectivePermission, permissionAtLeast } from "@/lib/orgs";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; number: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id, number } = await params;
  const n = parseInt(number, 10);
  if (!Number.isFinite(n)) {
    return NextResponse.json({ error: "invalid number" }, { status: 400 });
  }
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  const issue = await getIssueByNumber(id, n);
  if (!issue) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ issue });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireSession(req);
  if (auth.deny) return auth.deny;

  const { id, number } = await params;
  const n = parseInt(number, 10);
  if (!Number.isFinite(n)) {
    return NextResponse.json({ error: "invalid number" }, { status: 400 });
  }
  const repo = await getRepo(id);
  if (!repo) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  const existing = await getIssueByNumber(id, n);
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Permission: author can edit their own + change state; anyone with
  // maintain-or-better on the repo can manage any issue.
  const perm = await effectivePermission(auth.user, repo);
  const isOwner = auth.user === existing.author;
  const canManage = permissionAtLeast(perm, "maintain") || isOwner;
  if (!canManage) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const patch: Parameters<typeof updateIssue>[1] = {};
  if (typeof b.title === "string" && b.title.trim().length > 0) {
    patch.title = b.title.trim().slice(0, 200);
  }
  if (typeof b.body === "string") {
    if (b.body.length > 64_000) {
      return NextResponse.json({ error: "body too long" }, { status: 413 });
    }
    patch.body = b.body;
  }
  if (b.state === "open" || b.state === "closed") {
    patch.state = b.state as IssueState;
    patch.closedBy = b.state === "closed" ? auth.user : null;
  }
  const updated = await updateIssue(existing.id, patch);
  return NextResponse.json({ ok: true, issue: updated });
}
