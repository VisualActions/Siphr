/**
 * Supabase REST client (PostgREST). We only ever call this from server-side
 * code with the service role key, which bypasses RLS. RLS is enabled on every
 * table with no policies, so leaked publishable keys can't read/write anything.
 */

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function assertConfigured() {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function call(
  method: Method,
  pathAndQuery: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<Response> {
  assertConfigured();
  const init: RequestInit = {
    method,
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
      ...headers,
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  return fetch(`${url}/rest/v1/${pathAndQuery}`, init);
}

export async function pg<T = unknown>(
  method: Method,
  pathAndQuery: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const res = await call(method, pathAndQuery, body, extraHeaders);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Supabase ${method} ${pathAndQuery} -> ${res.status}: ${text}`);
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/**
 * Upsert with Prefer: resolution=merge-duplicates. The on_conflict query param
 * tells PostgREST which unique columns to use.
 */
export async function upsert<T>(
  table: string,
  rows: T | T[],
  onConflict: string,
  returning: "minimal" | "representation" = "representation"
): Promise<T[]> {
  const body = Array.isArray(rows) ? rows : [rows];
  const headers: Record<string, string> = {
    prefer: `resolution=merge-duplicates,return=${returning}`,
  };
  const result = await pg<T[]>(
    "POST",
    `${table}?on_conflict=${onConflict}`,
    body,
    headers
  );
  return result ?? [];
}

/** Bytea bytes need a hex literal for inserts via PostgREST. */
export function bytesToHexLiteral(bytes: Uint8Array | Buffer): string {
  const buf = Buffer.from(bytes);
  return "\\x" + buf.toString("hex");
}

/** Decode PostgREST bytea output ("\x68656c..." or base64 depending on settings). */
export function decodeBytea(value: string): Buffer {
  if (value.startsWith("\\x") || value.startsWith("0x")) {
    return Buffer.from(value.slice(2), "hex");
  }
  return Buffer.from(value, "base64");
}
