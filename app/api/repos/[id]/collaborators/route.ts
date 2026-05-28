import { NextResponse } from "next/server";
import {
  effectivePermission,
  listCollaborators,
  permissionAtLeast,
  removeCollaborator,
  upsertCollaborator,
  type Permission,
} from "@/lib/orgs";
import { getRepo, getUser } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_PERMS: Permission[] = ["read", "write", "maintain", "admin"];

async function actorCanManage(repoId: string, actor: string): Promise<boolean> {
  const repo = await getRepo(repoId);
  if (!repo) return false;
  const eff = await effectivePermission(actor, repo);
  return permissionAtLeast(eff, "admin");
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const collaborators = await listCollaborators(id);
  return NextResponse.json({ collaborators });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const actor = typeof b.actor === "string" ? b.actor : "";
  const principalType = b.principalType === "team" ? "team" : "user";
  const principalId = typeof b.principalId === "string" ? b.principalId.trim() : "";
  const permission = typeof b.permission === "string" ? b.permission : "";

  if (!actor || !principalId || !permission) {
    return NextResponse.json(
      { error: "actor, principalId, permission required" },
      { status: 400 }
    );
  }
  if (!ALLOWED_PERMS.includes(permission as Permission)) {
    return NextResponse.json({ error: "invalid permission" }, { status: 400 });
  }
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (!(await actorCanManage(id, actor))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (principalType === "user" && !(await getUser(principalId))) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }
  await upsertCollaborator({
    repoId: id,
    principalType,
    principalId,
    permission: permission as Permission,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(req.url);
  const actor = (url.searchParams.get("actor") ?? "").trim();
  const principalType = (url.searchParams.get("principalType") ?? "user") as "user" | "team";
  const principalId = (url.searchParams.get("principalId") ?? "").trim();
  if (!actor || !principalId) {
    return NextResponse.json({ error: "actor + principalId required" }, { status: 400 });
  }
  if (!(await actorCanManage(id, actor))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await removeCollaborator(id, principalType, principalId);
  return NextResponse.json({ ok: true });
}
