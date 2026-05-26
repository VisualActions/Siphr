import { NextResponse } from "next/server";
import { getRepoByName, repoStats, resolveRef } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ owner: string; name: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { owner, name } = await params;
  const repo = await getRepoByName(owner, name);
  if (!repo) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const stats = await repoStats(repo.id);
  const head = await resolveRef(repo.id, "HEAD");

  return NextResponse.json({
    id: repo.id,
    owner: repo.owner,
    name: repo.name,
    visibility: repo.visibility,
    description: repo.description,
    defaultBranch: repo.defaultBranch,
    createdAt: repo.createdAt,
    collaborators: Object.keys(repo.wrappedKeys ?? {}),
    objectCount: stats.objectCount,
    cipherBytes: stats.bytes,
    head,
  });
}
