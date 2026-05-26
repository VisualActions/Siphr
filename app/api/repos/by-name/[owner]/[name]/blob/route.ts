import { NextResponse } from "next/server";
import { getObject, getRepoByName, resolveRef } from "@/lib/store";
import {
  decodeObject,
  inferLanguage,
  isBinary,
  parseCommit,
  walkPath,
} from "@/lib/git";

export const runtime = "nodejs";

type Params = { params: Promise<{ owner: string; name: string }> };

/** GET /api/repos/by-name/:owner/:name/blob?ref=main&path=README.md */
export async function GET(req: Request, { params }: Params) {
  const { owner, name } = await params;
  const url = new URL(req.url);
  const refName = url.searchParams.get("ref") ?? "main";
  const subpath = url.searchParams.get("path") ?? "";

  if (!subpath) {
    return NextResponse.json({ error: "missing path" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "commit missing" }, { status: 500 });
  }
  const commit = parseCommit(commitObj.content);

  const resolved = await walkPath(commit.tree, subpath, loadObject);
  if (!resolved) return NextResponse.json({ error: "path not found" }, { status: 404 });
  if (resolved.type !== "blob") {
    return NextResponse.json({ error: "not a file" }, { status: 400 });
  }

  const blob = await loadObject(resolved.oid);
  if (!blob || blob.type !== "blob") {
    return NextResponse.json({ error: "blob missing" }, { status: 500 });
  }

  const binary = isBinary(blob.content);
  const filename = subpath.split("/").pop() ?? "";

  if (binary) {
    return NextResponse.json({
      ref: refName,
      path: subpath,
      oid: resolved.oid,
      size: blob.content.length,
      binary: true,
      language: inferLanguage(filename),
    });
  }

  return NextResponse.json({
    ref: refName,
    path: subpath,
    oid: resolved.oid,
    size: blob.content.length,
    binary: false,
    language: inferLanguage(filename),
    content: blob.content.toString("utf8"),
  });
}
