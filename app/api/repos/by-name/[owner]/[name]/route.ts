import { NextResponse } from "next/server";
import { listRepos } from "@/lib/store";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type Params = { params: Promise<{ owner: string; name: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { owner, name } = await params;
  const repos = await listRepos();
  const repo = repos.find((r) => r.owner === owner && r.name === name);
  if (!repo) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const dataDir = process.env.SIPHR_DATA_DIR ?? path.join(process.cwd(), "data");
  const objDir = path.join(dataDir, "repos", repo.id, "objects");
  let objectCount = 0;
  let cipherBytes = 0;
  try {
    const dirs = await fs.readdir(objDir, { withFileTypes: true });
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const files = await fs.readdir(path.join(objDir, d.name));
      objectCount += files.length;
      for (const f of files) {
        const s = await fs.stat(path.join(objDir, d.name, f));
        cipherBytes += s.size;
      }
    }
  } catch {}

  return NextResponse.json({
    id: repo.id,
    owner: repo.owner,
    name: repo.name,
    visibility: repo.visibility,
    createdAt: repo.createdAt,
    collaborators: Object.keys(repo.wrappedKeys ?? {}),
    objectCount,
    cipherBytes,
  });
}
