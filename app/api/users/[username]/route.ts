import { NextResponse } from "next/server";
import { getUser } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ username: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { username } = await params;
  const user = await getUser(username);
  if (!user) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    username: user.username,
    publicKeyJwk: user.publicKeyJwk,
    fingerprint: user.fingerprint,
    createdAt: user.createdAt,
    verified: !!user.verified,
    verifiedAs: user.verifiedAs ?? null,
    verifiedKind: user.verifiedKind ?? null,
    verifiedAt: user.verifiedAt ?? null,
  });
}
