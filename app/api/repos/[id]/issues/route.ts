import { NextResponse } from "next/server";
import { createIssue, listIssues, type IssueState } from "@/lib/issues";
import { getRepo, getUser } from "@/lib/store";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(req.url);
  const stateParam = (url.searchParams.get("state") ?? "open") as
    | IssueState
    | "all";
  if (!["open", "closed", "all"].includes(stateParam)) {
    return NextResponse.json({ error: "invalid state" }, { status: 400 });
  }
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  const issues = await listIssues(id, stateParam);
  return NextResponse.json({ issues });
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireSession(req);
  if (auth.deny) return auth.deny;

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const issueBody = typeof b.body === "string" ? b.body : "";
  const labels = Array.isArray(b.labels)
    ? b.labels.filter((s): s is string => typeof s === "string")
    : [];

  if (!title || title.length > 200) {
    return NextResponse.json(
      { error: "title required (max 200 chars)" },
      { status: 400 }
    );
  }
  if (issueBody.length > 64_000) {
    return NextResponse.json({ error: "body too long" }, { status: 413 });
  }
  const repo = await getRepo(id);
  if (!repo) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  // Author is taken from the verified session, never the request body.
  const author = auth.user;
  if (!(await getUser(author))) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }

  const issue = await createIssue({
    repoId: id,
    author,
    title,
    body: issueBody,
    labels,
  });
  return NextResponse.json({ ok: true, issue });
}
