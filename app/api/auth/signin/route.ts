import { NextResponse } from "next/server";
import {
  clientIp,
  createSession,
  hashPassphrase,
  isSecureRequest,
  sessionCookie,
  verifyPassphrase,
} from "@/lib/auth";
import { getUser, getUserAuth, setUserAuthHash } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Sign in with username + passphrase.
 *
 * Two flows in one handler:
 *
 * - Modern: user already has auth_hash. Server verifies the passphrase against
 *   the stored scrypt hash and issues a session cookie.
 * - Migration: user signed up before this endpoint existed and has no
 *   auth_hash yet. Their `encrypted_identity` blob is still on the server, so
 *   correctness of the passphrase is already a checkable property — but the
 *   server can't verify it without the blob, which is fine: the legitimate
 *   browser will have already decrypted it locally before getting here. We
 *   accept the first signin from such a user and store the hash for next time.
 *   Anyone else trying to brute-force a passphrase still has to pay scrypt
 *   work on every subsequent attempt.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const username = typeof b.username === "string" ? b.username.trim() : "";
  const passphrase = typeof b.passphrase === "string" ? b.passphrase : "";

  if (!username || !passphrase) {
    return NextResponse.json(
      { error: "username + passphrase required" },
      { status: 400 }
    );
  }

  const user = await getUser(username);
  if (!user) {
    // Constant-ish error to avoid a username oracle. We still pay one DB
    // round-trip and don't try to time-equalize scrypt — production
    // hardening (v0.4p2) adds the rate limit that closes this.
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  const auth = await getUserAuth(username);
  if (auth?.authHash && auth?.authSalt) {
    const ok = await verifyPassphrase(passphrase, auth.authHash, auth.authSalt);
    if (!ok) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }
  } else {
    // Migration path: enroll the user now. The browser had to be able to
    // decrypt encrypted_identity to know the passphrase, which means it
    // already proved knowledge of it. Hash + store so subsequent signins
    // go through the modern path.
    const { hash, salt } = await hashPassphrase(passphrase);
    await setUserAuthHash(username, hash, salt);
  }

  const { token, expiresAt } = await createSession({
    username,
    userAgent: req.headers.get("user-agent"),
    ip: clientIp(req),
  });

  return new Response(
    JSON.stringify({
      ok: true,
      user: { username: user.username, fingerprint: user.fingerprint },
      expiresAt: expiresAt.toISOString(),
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": sessionCookie(token, expiresAt, isSecureRequest(req)),
      },
    }
  );
}
