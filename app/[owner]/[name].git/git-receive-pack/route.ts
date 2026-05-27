import { getRepoByName } from "@/lib/store";
import { CT_RESULT, handleReceivePack } from "@/lib/git-transport";

export const runtime = "nodejs";
export const maxDuration = 300;

type Params = { params: Promise<{ owner: string; name: string }> };

/** git push — server unpacks the incoming packfile, stores objects, advances refs. */
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
  let report: Uint8Array;
  try {
    report = await handleReceivePack(repo, body);
  } catch (e) {
    return new Response(
      `receive-pack failed: ${e instanceof Error ? e.message : "unknown"}\n`,
      { status: 500, headers: { "content-type": "text/plain" } }
    );
  }
  return new Response(report as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": CT_RESULT("git-receive-pack"),
      "cache-control": "no-cache, max-age=0, must-revalidate",
    },
  });
}
