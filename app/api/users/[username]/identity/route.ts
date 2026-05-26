import { NextResponse } from "next/server";
import { getUser } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ username: string }> };

/**
 * GET /api/users/:username/identity
 *
 * Returns the encrypted private key blob for a user. Anyone can fetch
 * this — that's intentional. The blob is unwrappable only with the
 * user's passphrase, which never leaves their device.
 *
 * This is what powers "sign in from any browser": fetch the blob,
 * enter the passphrase, decrypt locally.
 */
export async function GET(_req: Request, { params }: Params) {
  const { username } = await params;
  const user = await getUser(username);
  if (!user) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    username: user.username,
    publicKeyJwk: user.publicKeyJwk,
    encryptedIdentity: user.encryptedIdentity,
    fingerprint: user.fingerprint,
  });
}
