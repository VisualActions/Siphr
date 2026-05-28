import { NextResponse } from "next/server";
import { deletePat } from "@/lib/pat";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Revoke a PAT. The DELETE removes the row by id, but only for the user
 * that the request claims to be — preventing one user from deleting another's
 * token if they guess the id.
 */
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(req.url);
  const user = (url.searchParams.get("user") ?? "").trim();
  if (!user) {
    return NextResponse.json({ error: "user required" }, { status: 400 });
  }
  const ok = await deletePat(id, user);
  if (!ok) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
