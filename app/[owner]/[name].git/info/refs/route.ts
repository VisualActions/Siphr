import { getRepoByName } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ owner: string; name: string }> };

/**
 * Smart-HTTP discovery endpoint.
 *
 * For PRIVATE repos we deliberately return 403 with the exact body documented
 * in the Quick Setup artboard (path 03). The server cannot encrypt a packfile
 * without the user's repo key, so accepting plaintext objects would leak them.
 *
 * Tested invariant: for private repos, this response body and headers contain
 * zero user-content plaintext (no repo names, no commit messages, no file
 * contents). All we expose is the policy text + the repo's existence.
 */
export async function GET(req: Request, { params }: Params) {
  const { owner, name } = await params;
  const cleanName = name.replace(/\.git$/, "");
  const repo = await getRepoByName(owner, cleanName);
  if (!repo) {
    return new Response("repo not found", {
      status: 404,
      headers: { "content-type": "text/plain" },
    });
  }
  if (repo.visibility === "private") {
    return new Response(
      "encrypted-only-endpoint · see /docs/why-no-plain-push\n",
      {
        status: 403,
        headers: {
          "content-type": "text/plain",
          "x-siphr-policy": "encrypted-only",
        },
      }
    );
  }
  // Public path is not yet a real smart-HTTP server — direct clients to /roadmap.
  const url = new URL(req.url);
  const service = url.searchParams.get("service") ?? "";
  return new Response(
    `# siphr ${owner}/${cleanName}\n` +
      `# smart-HTTP transport is shipping in v0.2 (see /roadmap)\n` +
      `# requested service: ${service}\n` +
      `# until then: use the in-browser editor at ${url.origin}/${owner}/${cleanName}\n`,
    {
      status: 501,
      headers: {
        "content-type": "text/plain",
        "x-siphr-transport": "browser-first",
      },
    }
  );
}

export async function POST() {
  return new Response("smart-HTTP service not yet implemented · see /roadmap\n", {
    status: 501,
    headers: { "content-type": "text/plain" },
  });
}
