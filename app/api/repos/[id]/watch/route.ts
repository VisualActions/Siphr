import { NextResponse } from "next/server";
import { getRepo } from "@/lib/store";
import { pg, upsert } from "@/lib/supabase";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Watch/unwatch a repository.
 *
 * The current model is best-effort: anyone with a username string can
 * (un)watch any repo. No auth on the wire because Siphr has no server-side
 * session. Once v0.5 signing keys exist, we'll require a signed assertion.
 *
 *   GET    ?user=alice   → { watched: boolean, count: number }
 *   POST   ?user=alice   → mark watched (idempotent)
 *   DELETE ?user=alice   → unwatch
 */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(req.url);
  const user = (url.searchParams.get("user") ?? "").trim();
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  const [allRows, mine] = await Promise.all([
    pg<{ user_username: string }[]>(
      "GET",
      `watches?select=user_username&repo_id=eq.${encodeURIComponent(id)}`
    ),
    user
      ? pg<{ user_username: string }[]>(
          "GET",
          `watches?select=user_username&repo_id=eq.${encodeURIComponent(id)}` +
            `&user_username=eq.${encodeURIComponent(user)}&limit=1`
        )
      : Promise.resolve([]),
  ]);
  return NextResponse.json({
    count: (allRows ?? []).length,
    watched: (mine ?? []).length > 0,
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(req.url);
  const user = (url.searchParams.get("user") ?? "").trim();
  if (!user) {
    return NextResponse.json({ error: "user required" }, { status: 400 });
  }
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  await upsert(
    "watches",
    {
      user_username: user,
      repo_id: id,
      created_at: new Date().toISOString(),
    },
    "user_username,repo_id",
    "minimal"
  );
  return NextResponse.json({ ok: true, watched: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(req.url);
  const user = (url.searchParams.get("user") ?? "").trim();
  if (!user) {
    return NextResponse.json({ error: "user required" }, { status: 400 });
  }
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  await pg(
    "DELETE",
    `watches?user_username=eq.${encodeURIComponent(user)}` +
      `&repo_id=eq.${encodeURIComponent(id)}`
  );
  return NextResponse.json({ ok: true, watched: false });
}
