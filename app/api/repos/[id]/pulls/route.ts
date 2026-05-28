import { NextResponse } from "next/server";
import { createPR, listPRs, type PRState } from "@/lib/prs";
import { getRef, getRepo, getUser } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(req.url);
  const stateParam = (url.searchParams.get("state") ?? "open") as
    | PRState
    | "all";
  if (!["open", "closed", "merged", "all"].includes(stateParam)) {
    return NextResponse.json({ error: "invalid state" }, { status: 400 });
  }
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  const prs = await listPRs(id, stateParam);
  return NextResponse.json({ prs });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const author = typeof b.author === "string" ? b.author.trim() : "";
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const prBody = typeof b.body === "string" ? b.body : "";
  const headRef = typeof b.headRef === "string" ? b.headRef : "";
  const baseRef = typeof b.baseRef === "string" ? b.baseRef : "";

  if (!author) return NextResponse.json({ error: "author required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!headRef.startsWith("refs/heads/") || !baseRef.startsWith("refs/heads/")) {
    return NextResponse.json(
      { error: "headRef and baseRef must be refs/heads/* paths" },
      { status: 400 }
    );
  }
  if (headRef === baseRef) {
    return NextResponse.json(
      { error: "head and base must differ" },
      { status: 400 }
    );
  }
  const repo = await getRepo(id);
  if (!repo) return NextResponse.json({ error: "no such repo" }, { status: 404 });
  if (!(await getUser(author))) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }
  const [head, base] = await Promise.all([
    getRef(id, headRef),
    getRef(id, baseRef),
  ]);
  if (!head?.oid) {
    return NextResponse.json({ error: `head ${headRef} not found` }, { status: 404 });
  }
  if (!base?.oid) {
    return NextResponse.json({ error: `base ${baseRef} not found` }, { status: 404 });
  }
  const pr = await createPR({
    repoId: id,
    author,
    title,
    body: prBody,
    headRef,
    baseRef,
    headOid: head.oid,
    baseOid: base.oid,
  });
  return NextResponse.json({ ok: true, pr });
}
