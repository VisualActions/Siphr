import { NextResponse } from "next/server";
import { getPRByNumber } from "@/lib/prs";
import { readBlobAtCommit } from "@/lib/git-server";
import { diffStrings } from "@/lib/diff";
import { getRepo } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

type Params = { params: Promise<{ id: string; number: string; path: string[] }> };

/**
 * Inline diff for a single file in a PR.
 *
 * GET /api/repos/:id/pulls/:number/files/:path
 *
 * Response shape mirrors lib/diff.ts DiffResult plus the file metadata.
 * One file per request keeps the response bounded and lets the UI lazy-load
 * diffs as the user scrolls through the file list.
 */
export async function GET(_req: Request, { params }: Params) {
  const { id, number, path } = await params;
  const filepath = (path ?? []).map((p) => decodeURIComponent(p)).join("/");
  if (!filepath) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }
  const n = parseInt(number, 10);
  if (!Number.isFinite(n)) {
    return NextResponse.json({ error: "invalid number" }, { status: 400 });
  }
  const repo = await getRepo(id);
  if (!repo) return NextResponse.json({ error: "no such repo" }, { status: 404 });
  const pr = await getPRByNumber(id, n);
  if (!pr) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [baseRead, headRead] = await Promise.all([
    readBlobAtCommit(repo, pr.baseOid, filepath),
    readBlobAtCommit(repo, pr.headOid, filepath),
  ]);

  if (baseRead?.binary || headRead?.binary) {
    return NextResponse.json({
      path: filepath,
      diff: { kind: "binary" },
    });
  }

  const baseText = baseRead && !baseRead.binary ? baseRead.content : null;
  const headText = headRead && !headRead.binary ? headRead.content : null;

  if (baseText === null && headText === null) {
    return NextResponse.json({ error: "file not present in either side" }, { status: 404 });
  }
  const diff = diffStrings(baseText, headText);
  return NextResponse.json({
    path: filepath,
    status:
      baseText === null ? "added" : headText === null ? "removed" : "modified",
    diff,
  });
}
