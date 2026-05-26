/**
 * Shared helper for admin endpoint auth.
 * The single admin secret lives in SIPHR_ADMIN_TOKEN and is presented as a
 * bearer token by the /admin UI (operator pastes it once into localStorage).
 */
export type AdminAuth =
  | { ok: true }
  | { ok: false; status: number; error: string };

export function checkAdmin(req: Request): AdminAuth {
  const token = process.env.SIPHR_ADMIN_TOKEN;
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "admin endpoint disabled (SIPHR_ADMIN_TOKEN not set)",
    };
  }
  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.replace(/^Bearer\s+/i, "");
  if (presented !== token) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  return { ok: true };
}
