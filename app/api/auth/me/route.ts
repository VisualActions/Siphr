import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUser } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Whoami: returns the current session's user, or { user: null }.
 *
 * Used by the client to detect "the cookie expired/got revoked" without
 * making a 401 on every regular API call.
 */
export async function GET(req: Request) {
  const username = await getSessionUser(req);
  if (!username) return NextResponse.json({ user: null });
  const user = await getUser(username);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      username: user.username,
      fingerprint: user.fingerprint,
      verified: user.verified ?? false,
    },
  });
}
