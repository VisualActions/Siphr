import { getRepoByName } from "@/lib/store";
import {
  buildAdvertisement,
  CT_ADVERTISEMENT,
} from "@/lib/git-transport";

export const runtime = "nodejs";
export const maxDuration = 300;

type Params = { params: Promise<{ owner: string; name: string }> };

/**
 * Smart-HTTP discovery endpoint.
 *
 * Public repos: real pkt-line ref advertisement so `git clone` / `git push`
 * handshake works.
 *
 * Private repos: 403 with policy text. The server cannot encrypt a packfile
 * without the user's repo key, so accepting plaintext objects would leak them.
 *
 * Invariant: response body for private repos is the literal policy string —
 * no repo names, commit messages, or filenames are ever included.
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

  const url = new URL(req.url);
  const service = url.searchParams.get("service");
  if (service !== "git-upload-pack" && service !== "git-receive-pack") {
    return new Response(
      "only smart-HTTP is supported · pass ?service=git-upload-pack or git-receive-pack\n",
      {
        status: 400,
        headers: { "content-type": "text/plain" },
      }
    );
  }

  const body = await buildAdvertisement(service, repo);
  return new Response(body as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": CT_ADVERTISEMENT(service),
      "cache-control": "no-cache, max-age=0, must-revalidate",
    },
  });
}

export async function POST() {
  return new Response("smart-HTTP /info/refs is GET only\n", {
    status: 405,
    headers: { "content-type": "text/plain" },
  });
}
