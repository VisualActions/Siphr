import { NextResponse } from "next/server";
import { createRelease, listReleases } from "@/lib/releases";
import { getRef, getRepo, getUser } from "@/lib/store";
import { effectivePermission, permissionAtLeast } from "@/lib/orgs";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  const releases = await listReleases(id);
  return NextResponse.json({ releases });
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
  const author = auth.user;
  const tagName = typeof b.tagName === "string" ? b.tagName.trim() : "";
  const name = typeof b.name === "string" ? b.name : null;
  const releaseBody = typeof b.body === "string" ? b.body : "";
  const target = typeof b.target === "string" ? b.target.trim() : "";
  const draft = b.draft === true;
  const prerelease = b.prerelease === true;

  if (!tagName) return NextResponse.json({ error: "tag name required" }, { status: 400 });
  if (!target) return NextResponse.json({ error: "target required" }, { status: 400 });

  const repo = await getRepo(id);
  if (!repo) return NextResponse.json({ error: "no such repo" }, { status: 404 });
  if (!(await getUser(author))) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }
  const perm = await effectivePermission(author, repo);
  if (!permissionAtLeast(perm, "maintain")) {
    return NextResponse.json({ error: "maintain permission required" }, { status: 403 });
  }

  // Resolve target: accept either a 40-char oid or a ref name to look up.
  let targetOid = target;
  if (!/^[a-f0-9]{40}$/.test(target)) {
    const ref = await getRef(id, target);
    if (!ref?.oid) {
      return NextResponse.json(
        { error: `target ref ${target} not found` },
        { status: 404 }
      );
    }
    targetOid = ref.oid;
  }

  const release = await createRelease({
    repoId: id,
    tagName,
    name,
    body: releaseBody,
    targetOid,
    author,
    draft,
    prerelease,
  });
  return NextResponse.json({ ok: true, release });
}
