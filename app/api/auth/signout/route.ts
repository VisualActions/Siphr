import { NextResponse } from "next/server";
import { clearSessionCookie, isSecureRequest, revokeSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await revokeSessionFromRequest(req);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": clearSessionCookie(isSecureRequest(req)),
    },
  });
}
