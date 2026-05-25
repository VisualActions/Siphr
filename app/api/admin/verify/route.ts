import { NextResponse } from "next/server";
import { getUser, setUserVerification } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Mark a user as verified. Requires SIPHR_ADMIN_TOKEN to match.
 *
 * POST /api/admin/verify
 *   Authorization: Bearer <SIPHR_ADMIN_TOKEN>
 *   { "username": "microsoft", "verifiedAs": "Microsoft", "verifiedKind": "org" }
 *   { "username": "microsoft", "verified": false }  // revoke
 */
export async function POST(req: Request) {
  const token = process.env.SIPHR_ADMIN_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "admin endpoint disabled (SIPHR_ADMIN_TOKEN not set)" },
      { status: 503 }
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.replace(/^Bearer\s+/i, "");
  if (presented !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username : "";
  if (!username || !(await getUser(username))) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }

  const verified = body.verified === false ? false : true;
  const verifiedAs =
    typeof body.verifiedAs === "string" ? body.verifiedAs : undefined;
  const verifiedKind = ["org", "individual", "bot"].includes(
    body.verifiedKind as string
  )
    ? (body.verifiedKind as "org" | "individual" | "bot")
    : undefined;

  const updated = await setUserVerification(username, {
    verified,
    verifiedAs: verified ? verifiedAs : undefined,
    verifiedKind: verified ? verifiedKind : undefined,
    verifiedAt: verified ? new Date().toISOString() : undefined,
  });

  return NextResponse.json({
    ok: true,
    username: updated.username,
    verified: !!updated.verified,
    verifiedAs: updated.verifiedAs ?? null,
    verifiedKind: updated.verifiedKind ?? null,
  });
}
