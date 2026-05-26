import { NextResponse } from "next/server";
import {
  getObject,
  getRef,
  getRepoByName,
  resolveRef,
} from "@/lib/store";
import {
  decodeObject,
  parseCommit,
  parseTree,
  walkPath,
} from "@/lib/git";

export const runtime = "nodejs";

type Params = { params: Promise<{ owner: string; name: string }> };

/**
 * GET /api/repos/by-name/:owner/:name/tree?ref=main&path=src/components
 *
 * Public repos only — for private repos the server holds ciphertext and can't
 * parse the tree. Private-repo browsing happens client-side.
 */
export async function GET(req: Request, { params }: Params) {
  const { owner, name } = await params;
  const url = new URL(req.url);
  const refName = url.searchParams.get("ref") ?? "main";
  const subpath = url.searchParams.get("path") ?? "";

  const repo = await getRepoByName(owner, name);
  if (!repo) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (repo.visibility !== "public") {
    return NextResponse.json(
      { error: "private repo: browse client-side" },
      { status: 403 }
    );
  }

  const commitOid =
    (await resolveRef(repo.id, `refs/heads/${refName}`)) ??
    (await resolveRef(repo.id, refName)) ??
    (await resolveRef(repo.id, "HEAD"));
  if (!commitOid) {
    return NextResponse.json({ error: "no commits" }, { status: 404 });
  }

  const loadObject = async (oid: string) => {
    const data = await getObject(repo.id, oid);
    if (!data) return null;
    return decodeObject(data);
  };

  const commitObj = await loadObject(commitOid);
  if (!commitObj || commitObj.type !== "commit") {
    return NextResponse.json({ error: "commit object missing" }, { status: 500 });
  }
  const commit = parseCommit(commitObj.content);

  const resolved = await walkPath(commit.tree, subpath, loadObject);
  if (!resolved) {
    return NextResponse.json({ error: "path not found" }, { status: 404 });
  }
  if (resolved.type !== "tree") {
    return NextResponse.json({ error: "not a tree" }, { status: 400 });
  }
  const tree = await loadObject(resolved.oid);
  if (!tree || tree.type !== "tree") {
    return NextResponse.json({ error: "tree missing" }, { status: 500 });
  }
  const entries = parseTree(tree.content);

  return NextResponse.json({
    repo: { id: repo.id, owner: repo.owner, name: repo.name },
    ref: refName,
    path: subpath,
    commit: {
      oid: commitOid,
      message: commit.message,
      author: commit.author,
      tree: commit.tree,
    },
    entries: entries.map((e) => ({
      mode: e.mode,
      name: e.name,
      oid: e.oid,
      type: e.type,
    })),
  });
}
