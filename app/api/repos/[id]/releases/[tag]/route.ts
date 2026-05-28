import { NextResponse } from "next/server";
import { deleteRelease, getReleaseByTag } from "@/lib/releases";
import { getRepo } from "@/lib/store";
import { effectivePermission, permissionAtLeast } from "@/lib/orgs";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; tag: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id, tag } = await params;
  const release = await getReleaseByTag(id, decodeURIComponent(tag));
  if (!release) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ release });
}

export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireSession(req);
  if (auth.deny) return auth.deny;
  const actor = auth.user;

  const { id, tag } = await params;
  const repo = await getRepo(id);
  if (!repo) return NextResponse.json({ error: "no such repo" }, { status: 404 });
  const perm = await effectivePermission(actor, repo);
  if (!permissionAtLeast(perm, "maintain")) {
    return NextResponse.json({ error: "maintain permission required" }, { status: 403 });
  }
  const ok = await deleteRelease(id, decodeURIComponent(tag));
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
