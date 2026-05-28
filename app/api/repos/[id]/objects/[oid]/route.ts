import { NextResponse } from "next/server";
import {
  getObject,
  getRepo,
  getRepoObject,
  putObject,
  putRepoObject,
} from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; oid: string }> };

/**
 * Object endpoint. Encryption boundary depends on the repo's mode:
 *   - 'e2ee' repos: bytes are already client-side ciphertext; store/serve verbatim.
 *   - 'server' repos: server wraps on PUT, unwraps on GET.
 *   - 'none' (public): plaintext loose objects, passthrough.
 *
 * The smart-HTTP transport doesn't go through this endpoint — it's used by
 * the browser editor (lib/browser-git.ts) and ad-hoc object uploads.
 */
export async function PUT(req: Request, { params }: Params) {
  const { id, oid } = await params;
  const repo = await getRepo(id);
  if (!repo) {
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

  if (repo.encryptionMode === "e2ee") {
    // Legacy E2EE: client uploaded opaque ciphertext; store verbatim.
    await putObject(id, oid, buf);
  } else {
    await putRepoObject(repo, oid, buf);
  }
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
  const repo = await getRepo(id);
  if (!repo) {
    return NextResponse.json({ error: "no such repo" }, { status: 404 });
  }
  // E2EE repos: return raw ciphertext so the browser can decrypt with the
  // unwrapped repo key it holds. Everyone else gets plaintext-equivalent.
  const buf = repo.encryptionMode === "e2ee"
    ? await getObject(id, oid)
    : await getRepoObject(repo, oid);
  if (!buf) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return new Response(new Uint8Array(buf), {
    headers: { "content-type": "application/octet-stream" },
  });
}
