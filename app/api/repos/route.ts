import { NextResponse } from "next/server";
import { createRepo, getUser, listRepos, reposFor } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = url.searchParams.get("user");
  if (!user) {
    const repos = (await listRepos()).filter((r) => r.visibility === "public");
    return NextResponse.json({ repos });
  }
  const repos = await reposFor(user);
  return NextResponse.json({ repos });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const owner = typeof b.owner === "string" ? b.owner : "";
  const name = typeof b.name === "string" ? b.name : "";
  const visibility = b.visibility === "public" ? "public" : "private";
  const description = typeof b.description === "string" ? b.description : null;
  const wrappedKeys =
    b.wrappedKeys && typeof b.wrappedKeys === "object"
      ? (b.wrappedKeys as Record<string, unknown>)
      : {};

  if (!/^[a-z0-9_-]{3,32}$/.test(owner)) {
    return NextResponse.json({ error: "invalid owner" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(name)) {
    return NextResponse.json({ error: "invalid repo name" }, { status: 400 });
  }
  if (!(await getUser(owner))) {
    return NextResponse.json({ error: "unknown owner" }, { status: 404 });
  }
  if (visibility === "private" && !(owner in wrappedKeys)) {
    return NextResponse.json(
      { error: "private repos require a wrapped key for the owner" },
      { status: 400 }
    );
  }

  try {
    const repo = await createRepo({
      owner,
      name,
      visibility,
      description,
      wrappedKeys,
    });
    return NextResponse.json({
      ok: true,
      id: repo.id,
      owner: repo.owner,
      name: repo.name,
      visibility: repo.visibility,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server error";
    const status = msg.includes("duplicate") || msg.includes("23505") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
