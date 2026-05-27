import { getRepoByName } from "@/lib/store";
import { CT_RESULT, handleUploadPack } from "@/lib/git-transport";

export const runtime = "nodejs";
export const maxDuration = 300;

type Params = { params: Promise<{ owner: string; name: string }> };

/** git fetch/clone — server sends a packfile of every reachable object the client asked for. */
export async function POST(req: Request, { params }: Params) {
  const { owner, name } = await params;
  const repo = await getRepoByName(owner, name.replace(/\.git$/, ""));
  if (!repo) return new Response("repo not found\n", { status: 404 });
  if (repo.visibility === "private") {
    return new Response(
      "encrypted-only-endpoint · see /docs/why-no-plain-push\n",
      { status: 403, headers: { "content-type": "text/plain" } }
    );
  }
  const body = new Uint8Array(await req.arrayBuffer());
  let packed: Uint8Array;
  try {
    packed = await handleUploadPack(repo, body);
  } catch (e) {
    return new Response(
      `upload-pack failed: ${e instanceof Error ? e.message : "unknown"}\n`,
      { status: 500, headers: { "content-type": "text/plain" } }
    );
  }
  return new Response(packed as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": CT_RESULT("git-upload-pack"),
      "cache-control": "no-cache, max-age=0, must-revalidate",
    },
  });
}
