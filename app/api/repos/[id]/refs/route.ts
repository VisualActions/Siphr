import { NextResponse } from "next/server";
import { getRepo, listRefs, putRef } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  const refs = await listRefs(id);
  return NextResponse.json({ refs });
}

/**
 * Set one or more refs.
 *   { "refs": [
 *       { "name": "HEAD",            "target": "ref: refs/heads/main" },
 *       { "name": "refs/heads/main", "oid":    "abc123..." }
 *     ]
 *   }
 */
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const refs = Array.isArray(b.refs) ? (b.refs as Array<Record<string, unknown>>) : [];
  if (refs.length === 0) {
    return NextResponse.json({ error: "no refs" }, { status: 400 });
  }
  for (const r of refs) {
    const name = typeof r.name === "string" ? r.name : "";
    if (!name) continue;
    const oid = typeof r.oid === "string" ? r.oid : null;
    const target = typeof r.target === "string" ? r.target : null;
    if (oid && !/^[a-f0-9]{40}$/.test(oid)) {
      return NextResponse.json({ error: `invalid oid for ${name}` }, { status: 400 });
    }
    await putRef(id, name, { oid, target });
  }
  return NextResponse.json({ ok: true, count: refs.length });
}
