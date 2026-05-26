import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin";
import { getRepo, getRepoByName, setRepoFeatured } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Mark a repo as featured (or revoke).
 *
 * POST /api/admin/featured
 *   Authorization: Bearer <SIPHR_ADMIN_TOKEN>
 *   { "id": "...", "featured": true, "tag": "operating systems",
 *     "blurb": "...", "rank": 10 }
 *   or:
 *   { "owner": "...", "name": "...", "featured": false }
 */
export async function POST(req: Request) {
  const auth = checkAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : null;
  const owner = typeof body.owner === "string" ? body.owner : null;
  const name = typeof body.name === "string" ? body.name : null;
  const repo = id
    ? await getRepo(id)
    : owner && name
    ? await getRepoByName(owner, name)
    : null;
  if (!repo) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }

  const featured = body.featured === false ? false : true;
  const tag = typeof body.tag === "string" ? body.tag : null;
  const blurb = typeof body.blurb === "string" ? body.blurb : null;
  const rank = typeof body.rank === "number" ? body.rank : null;

  const updated = await setRepoFeatured(repo.id, {
    featured,
    tag,
    blurb,
    rank,
  });

  return NextResponse.json({
    ok: true,
    id: updated.id,
    owner: updated.owner,
    name: updated.name,
    featured: !!updated.featured,
    featuredTag: updated.featuredTag ?? null,
    featuredBlurb: updated.featuredBlurb ?? null,
    featuredRank: updated.featuredRank ?? null,
    featuredAt: updated.featuredAt ?? null,
  });
}
