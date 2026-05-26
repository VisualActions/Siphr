import { NextResponse } from "next/server";
import { getObject, getRepo, putObject } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; oid: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id, oid } = await params;
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  if (!/^[a-f0-9]{6,128}$/.test(oid)) {
    return NextResponse.json({ error: "invalid oid" }, { status: 400 });
  }

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: "empty body" }, { status: 400 });
  }
  if (buf.length > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "object too large" }, { status: 413 });
  }

  await putObject(id, oid, buf);
  return NextResponse.json({ ok: true, oid, bytes: buf.length });
}

export async function HEAD(_req: Request, { params }: Params) {
  const { id, oid } = await params;
  if (!(await getRepo(id))) {
    return new Response(null, { status: 404 });
  }
  if (!/^[a-f0-9]{6,128}$/.test(oid)) {
    return new Response(null, { status: 400 });
  }
  const buf = await getObject(id, oid);
  return new Response(null, { status: buf ? 200 : 404 });
}

export async function GET(_req: Request, { params }: Params) {
  const { id, oid } = await params;
  if (!(await getRepo(id))) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  const buf = await getObject(id, oid);
  if (!buf) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return new Response(new Uint8Array(buf), {
    headers: { "content-type": "application/octet-stream" },
  });
}
