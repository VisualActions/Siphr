import { NextResponse } from "next/server";
import { getRepo } from "@/lib/store";
import { pg, upsert } from "@/lib/supabase";
import { getSessionUser, requireSession } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Watch/unwatch a repository.
 *
 * GET    -> { watched: boolean, count: number }
 *           (count is public; watched is "you, the session-holder" — null if anon)
 * POST   -> mark watched (idempotent) — requires session
 * DELETE -> unwatch — requires session, only your own row
 */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  const user = await getSessionUser(req);
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
  const auth = await requireSession(req);
  if (auth.deny) return auth.deny;
  const user = auth.user;

  const { id } = await params;
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
  const auth = await requireSession(req);
  if (auth.deny) return auth.deny;
  const user = auth.user;

  const { id } = await params;
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
