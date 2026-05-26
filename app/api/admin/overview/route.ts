import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin";
import {
  listRepos,
  listUsers,
  totalObjectStats,
  totalRepoCounts,
  totalUserCount,
} from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = checkAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [users, repoCounts, objStats, userCount, repos] = await Promise.all([
    listUsers(),
    totalRepoCounts(),
    totalObjectStats(),
    totalUserCount(),
    listRepos(),
  ]);

  return NextResponse.json({
    users: {
      total: userCount,
      verified: users.filter((u) => u.verified).length,
      recent: users.slice(0, 8).map((u) => ({
        username: u.username,
        fingerprint: u.fingerprint,
        verified: !!u.verified,
        verifiedAs: u.verifiedAs ?? null,
        verifiedKind: u.verifiedKind ?? null,
        createdAt: u.createdAt,
      })),
    },
    repos: repoCounts,
    objects: objStats,
    recentRepos: repos.slice(0, 12).map((r) => ({
      id: r.id,
      owner: r.owner,
      name: r.name,
      visibility: r.visibility,
      featured: !!r.featured,
      featuredTag: r.featuredTag ?? null,
      createdAt: r.createdAt,
    })),
  });
}
