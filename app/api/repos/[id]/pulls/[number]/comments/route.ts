import { NextResponse } from "next/server";
import { addPRComment, getPRByNumber, listPRComments } from "@/lib/prs";
import { getRepo, getUser } from "@/lib/store";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; number: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id, number } = await params;
  const n = parseInt(number, 10);
  const pr = await getPRByNumber(id, n);
  if (!pr) return NextResponse.json({ error: "not found" }, { status: 404 });
  const comments = await listPRComments(pr.id);
  return NextResponse.json({ comments });
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireSession(req);
  if (auth.deny) return auth.deny;

  const { id, number } = await params;
  const n = parseInt(number, 10);
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  const pr = await getPRByNumber(id, n);
  if (!pr) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const commentBody = typeof b.body === "string" ? b.body : "";
  if (!commentBody.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }
  if (commentBody.length > 32_000) {
    return NextResponse.json({ error: "body too long" }, { status: 413 });
  }
  const author = auth.user;
  if (!(await getUser(author))) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }
  const comment = await addPRComment({ prId: pr.id, author, body: commentBody });
  return NextResponse.json({ ok: true, comment });
}
