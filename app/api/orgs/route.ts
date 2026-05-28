import { NextResponse } from "next/server";
import {
  createOrg,
  findOrgCaseInsensitive,
  listOrgsForUser,
} from "@/lib/orgs";
import { findUserCaseInsensitive, getUser } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = (url.searchParams.get("user") ?? "").trim();
  if (!user) {
    return NextResponse.json({ error: "user required" }, { status: 400 });
  }
  const orgs = await listOrgsForUser(user);
  return NextResponse.json({ orgs });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const displayName = typeof b.displayName === "string" ? b.displayName : null;
  const description = typeof b.description === "string" ? b.description : null;
  const founder = typeof b.founder === "string" ? b.founder.trim() : "";

  if (!/^[A-Za-z0-9_][A-Za-z0-9_-]{1,30}[A-Za-z0-9_}]$/.test(name) && !/^[A-Za-z0-9_]{3}$/.test(name)) {
    return NextResponse.json({ error: "invalid org name" }, { status: 400 });
  }
  if (!founder) {
    return NextResponse.json({ error: "founder required" }, { status: 400 });
  }
  if (!(await getUser(founder))) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }
  // Names must be unique across users + orgs to avoid namespace collisions.
  if (await findUserCaseInsensitive(name)) {
    return NextResponse.json(
      { error: "name already taken by a user" },
      { status: 409 }
    );
  }
  if (await findOrgCaseInsensitive(name)) {
    return NextResponse.json(
      { error: "name already taken by an org" },
      { status: 409 }
    );
  }
  try {
    const org = await createOrg({
      name,
      displayName,
      description,
      founderUsername: founder,
    });
    return NextResponse.json({ ok: true, org });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
