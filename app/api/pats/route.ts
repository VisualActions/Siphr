import { NextResponse } from "next/server";
import { createPat, listPatsFor } from "@/lib/pat";
import { getUser } from "@/lib/store";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Personal Access Token management.
 *
 * Auth model: there is no server-side session today, so the client passes
 * the username it claims to be in the query string. This is fine for now
 * because anyone with a username string can already enumerate that user's
 * public material; what we never expose is the plaintext token (only at
 * creation), the token hash, or another user's tokens.
 *
 * Once we have sessions (planned with v0.4f), this gate becomes session-aware.
 */
export async function GET(req: Request) {
  const auth = await requireSession(req);
  if (auth.deny) return auth.deny;
  const user = auth.user;

  if (!(await getUser(user))) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }
  const pats = await listPatsFor(user);
  // Never return tokenHash to clients.
  return NextResponse.json({
    pats: pats.map((p) => ({
      id: p.id,
      name: p.name,
      prefix: p.prefix,
      scopes: p.scopes,
      createdAt: p.createdAt,
      lastUsedAt: p.lastUsedAt,
      expiresAt: p.expiresAt,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (auth.deny) return auth.deny;
  const username = auth.user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const expiresAt = typeof b.expiresAt === "string" ? b.expiresAt : null;

  if (!name || name.length > 64) {
    return NextResponse.json(
      { error: "name required (max 64 chars)" },
      { status: 400 }
    );
  }
  if (!(await getUser(username))) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }

  const { plaintext, pat } = await createPat({ username, name, expiresAt });
  return NextResponse.json({
    ok: true,
    // Plaintext token is returned exactly once — clients must show it to the
    // user immediately and instruct them to copy it.
    token: plaintext,
    pat: {
      id: pat.id,
      name: pat.name,
      prefix: pat.prefix,
      scopes: pat.scopes,
      createdAt: pat.createdAt,
      lastUsedAt: pat.lastUsedAt,
      expiresAt: pat.expiresAt,
    },
  });
}
