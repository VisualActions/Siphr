import { NextResponse } from "next/server";
import { pg } from "@/lib/supabase";

export const runtime = "nodejs";

type UserRow = {
  username: string;
  fingerprint: string;
  verified: boolean | null;
  verified_as: string | null;
  verified_kind: string | null;
};

type RepoRow = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  description: string | null;
  featured: boolean | null;
};

/**
 * Cross-entity search.
 *
 * Looks in:
 *   - users (case-insensitive prefix on username + verified_as)
 *   - public repos (case-insensitive substring on owner/name/description)
 *
 * Private repo metadata is NEVER surfaced through search — the server
 * couldn't anyway, since the description for private repos is encrypted
 * blob ciphertext.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("q") ?? "").trim();
  if (raw.length < 1) {
    return NextResponse.json({ users: [], repos: [] });
  }
  // PostgREST ilike requires the wildcards in the value itself.
  const q = `*${raw.replace(/[*]/g, "")}*`;

  const [users, repos] = await Promise.all([
    pg<UserRow[]>(
      "GET",
      `users?select=username,fingerprint,verified,verified_as,verified_kind` +
        `&or=(username.ilike.${encodeURIComponent(q)},verified_as.ilike.${encodeURIComponent(q)})` +
        `&order=verified.desc.nullslast,username.asc&limit=8`
    ),
    pg<RepoRow[]>(
      "GET",
      `repos?select=id,owner,name,visibility,description,featured` +
        `&visibility=eq.public` +
        `&or=(name.ilike.${encodeURIComponent(q)},owner.ilike.${encodeURIComponent(q)},description.ilike.${encodeURIComponent(q)})` +
        `&order=featured.desc.nullslast,name.asc&limit=8`
    ),
  ]);

  return NextResponse.json({
    users: (users ?? []).map((u) => ({
      username: u.username,
      fingerprint: u.fingerprint,
      verified: !!u.verified,
      verifiedAs: u.verified_as ?? null,
      verifiedKind: u.verified_kind ?? null,
    })),
    repos: (repos ?? []).map((r) => ({
      id: r.id,
      owner: r.owner,
      name: r.name,
      visibility: r.visibility,
      description: r.description,
      featured: !!r.featured,
    })),
  });
}
