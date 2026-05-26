import { NextResponse } from "next/server";
import { getRepoByName } from "@/lib/store";

export const runtime = "nodejs";

/** Live name-availability check for the new-repo form. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const owner = url.searchParams.get("owner") ?? "";
  const name = url.searchParams.get("name") ?? "";
  if (!owner || !name) {
    return NextResponse.json({ available: false, reason: "missing" }, { status: 400 });
  }
  if (!/^[A-Za-z0-9_][A-Za-z0-9_.-]{0,99}$/.test(name) || /-$/.test(name)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }
  const existing = await getRepoByName(owner, name);
  return NextResponse.json({ available: !existing });
}
