import { NextResponse } from "next/server";
import { createUser, getUser } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const username = typeof b.username === "string" ? b.username : "";
  const publicKeyJwk = b.publicKeyJwk;
  const encryptedIdentity = b.encryptedIdentity;
  const fp = typeof b.fingerprint === "string" ? b.fingerprint : "";

  if (!/^[a-z0-9_-]{3,32}$/.test(username)) {
    return NextResponse.json({ error: "invalid username" }, { status: 400 });
  }
  if (!publicKeyJwk || typeof publicKeyJwk !== "object") {
    return NextResponse.json({ error: "missing publicKeyJwk" }, { status: 400 });
  }
  if (!encryptedIdentity || typeof encryptedIdentity !== "object") {
    return NextResponse.json({ error: "missing encryptedIdentity" }, { status: 400 });
  }
  if (!fp) {
    return NextResponse.json({ error: "missing fingerprint" }, { status: 400 });
  }

  if (await getUser(username)) {
    return NextResponse.json({ error: "username taken" }, { status: 409 });
  }

  try {
    await createUser({
      username,
      publicKeyJwk: publicKeyJwk as JsonWebKey,
      encryptedIdentity,
      fingerprint: fp,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username, fingerprint: fp });
}

export async function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
