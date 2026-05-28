import { getRepoByName } from "@/lib/store";
import {
  buildAdvertisement,
  CT_ADVERTISEMENT,
} from "@/lib/git-transport";
import { gateRepoAccess, type Access } from "@/lib/repo-access";

export const runtime = "nodejs";
export const maxDuration = 300;

type Params = { params: Promise<{ owner: string; name: string }> };

/**
 * Smart-HTTP discovery endpoint.
 *
 * Behavior depends on encryption_mode:
 *   - 'none'   (public)  -> open ref advertisement
 *   - 'server' (private) -> ref advertisement gated by PAT auth (v0.4b)
 *   - 'e2ee'   (private) -> 403; smart-HTTP can't serve client-only ciphertext
 *
 * Invariant: 403 response body never includes repo metadata.
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
  if (repo.encryptionMode === "e2ee") {
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

  // Auth gate: private repos require a PAT for both services; public repos
  // require one when the client is about to push (service=git-receive-pack).
  const accessMode: Access = service === "git-receive-pack" ? "write" : "read";
  const { deny } = await gateRepoAccess(req, repo, accessMode);
  if (deny) return deny;

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
