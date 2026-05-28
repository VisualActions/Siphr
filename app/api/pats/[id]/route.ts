import { NextResponse } from "next/server";
import { deletePat } from "@/lib/pat";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Revoke a PAT. Scoped to the session user — you can only revoke your own.
 */
export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireSession(req);
  if (auth.deny) return auth.deny;

  const { id } = await params;
  const ok = await deletePat(id, auth.user);
  if (!ok) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
