import { NextResponse } from "next/server";
import {
  getOrgByName,
  getOrgMember,
  listOrgMembers,
  removeOrgMember,
  setOrgMember,
  type OrgRole,
} from "@/lib/orgs";
import { getUser } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ name: string }> };

async function actorIsAdminOrOwner(orgId: string, actor: string): Promise<boolean> {
  const m = await getOrgMember(orgId, actor);
  return !!m && (m.role === "owner" || m.role === "admin");
}

export async function GET(_req: Request, { params }: Params) {
  const { name } = await params;
  const org = await getOrgByName(name);
  if (!org) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ members: await listOrgMembers(org.id) });
}

export async function POST(req: Request, { params }: Params) {
  const { name } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const actor = typeof b.actor === "string" ? b.actor : "";
  const username = typeof b.username === "string" ? b.username : "";
  const role = typeof b.role === "string" ? b.role : "";
  if (!actor || !username || !role) {
    return NextResponse.json({ error: "actor, username, role required" }, { status: 400 });
  }
  if (!["owner", "admin", "member"].includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }
  const org = await getOrgByName(name);
  if (!org) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!(await actorIsAdminOrOwner(org.id, actor))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await getUser(username))) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }
  await setOrgMember({ orgId: org.id, username, role: role as OrgRole });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const { name } = await params;
  const url = new URL(req.url);
  const actor = (url.searchParams.get("actor") ?? "").trim();
  const username = (url.searchParams.get("username") ?? "").trim();
  if (!actor || !username) {
    return NextResponse.json({ error: "actor + username required" }, { status: 400 });
  }
  const org = await getOrgByName(name);
  if (!org) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Self-removal is always allowed; otherwise admin+owner only.
  if (actor !== username && !(await actorIsAdminOrOwner(org.id, actor))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await removeOrgMember(org.id, username);
  return NextResponse.json({ ok: true });
}
