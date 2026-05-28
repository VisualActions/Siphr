import { NextResponse } from "next/server";
import { addComment, getIssueByNumber, listComments } from "@/lib/issues";
import { getRepo, getUser } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; number: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id, number } = await params;
  const n = parseInt(number, 10);
  if (!Number.isFinite(n)) {
    return NextResponse.json({ error: "invalid number" }, { status: 400 });
  }
  const issue = await getIssueByNumber(id, n);
  if (!issue) return NextResponse.json({ error: "not found" }, { status: 404 });
  const comments = await listComments(issue.id);
  return NextResponse.json({ comments });
}

export async function POST(req: Request, { params }: Params) {
  const { id, number } = await params;
  const n = parseInt(number, 10);
  if (!Number.isFinite(n)) {
    return NextResponse.json({ error: "invalid number" }, { status: 400 });
  }
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  const issue = await getIssueByNumber(id, n);
  if (!issue) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const author = typeof b.author === "string" ? b.author.trim() : "";
  const commentBody = typeof b.body === "string" ? b.body : "";
  if (!author) {
    return NextResponse.json({ error: "author required" }, { status: 400 });
  }
  if (!commentBody.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }
  if (!(await getUser(author))) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }
  const comment = await addComment({
    issueId: issue.id,
    author,
    body: commentBody,
  });
  return NextResponse.json({ ok: true, comment });
}
