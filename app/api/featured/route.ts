import { NextResponse } from "next/server";
import { listFeaturedRepos } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const repos = await listFeaturedRepos();
  return NextResponse.json({
    repos: repos.map((r) => ({
      id: r.id,
      owner: r.owner,
      name: r.name,
      visibility: r.visibility,
      description: r.description,
      featuredTag: r.featuredTag ?? null,
      featuredBlurb: r.featuredBlurb ?? null,
      featuredRank: r.featuredRank ?? null,
      featuredAt: r.featuredAt ?? null,
      createdAt: r.createdAt,
    })),
  });
}
