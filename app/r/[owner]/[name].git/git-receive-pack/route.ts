import { getRepoByName } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ owner: string; name: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { owner, name } = await params;
  const repo = await getRepoByName(owner, name.replace(/\.git$/, ""));
  if (!repo) return new Response("repo not found", { status: 404 });
  if (repo.visibility === "private") {
    return new Response(
      "encrypted-only-endpoint · see /docs/why-no-plain-push\n",
      { status: 403, headers: { "content-type": "text/plain" } }
    );
  }
  return new Response("receive-pack not yet implemented · see /roadmap\n", {
    status: 501,
    headers: { "content-type": "text/plain" },
  });
}
