import { NextResponse } from "next/server";
import { createUser, findUserCaseInsensitive } from "@/lib/store";
import {
  clientIp,
  createSession,
  hashPassphrase,
  isSecureRequest,
  sessionCookie,
} from "@/lib/auth";

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
  const passphrase = typeof b.passphrase === "string" ? b.passphrase : "";

  if (!/^[A-Za-z0-9_-]{3,32}$/.test(username) || /^-|-$/.test(username)) {
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

  if (await findUserCaseInsensitive(username)) {
    return NextResponse.json({ error: "username taken" }, { status: 409 });
  }

  // Old clients didn't send a passphrase at signup. We still accept the
  // signup so they aren't broken — the first signin will enroll them into
  // the modern auth path.
  let authMaterial: { authHash?: string; authSalt?: string } = {};
  if (passphrase) {
    const { hash, salt } = await hashPassphrase(passphrase);
    authMaterial = { authHash: hash, authSalt: salt };
  }

  try {
    await createUser({
      username,
      publicKeyJwk: publicKeyJwk as JsonWebKey,
      encryptedIdentity,
      fingerprint: fp,
      createdAt: new Date().toISOString(),
      ...authMaterial,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // If the signup included a passphrase we have everything we need to issue
  // a session right now so the user lands signed-in.
  if (passphrase) {
    const { token, expiresAt } = await createSession({
      username,
      userAgent: req.headers.get("user-agent"),
      ip: clientIp(req),
    });
    return new Response(
      JSON.stringify({ ok: true, username, fingerprint: fp }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie": sessionCookie(token, expiresAt, isSecureRequest(req)),
        },
      }
    );
  }
  return NextResponse.json({ ok: true, username, fingerprint: fp });
}

export async function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
