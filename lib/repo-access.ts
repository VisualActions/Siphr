/**
 * Permission gate for git endpoints.
 *
 * Resolution flows through `effectivePermission()` in lib/orgs.ts which:
 *   - implicitly grants admin to the owner (user or org-admin)
 *   - merges direct user grants and team grants on the repo
 *   - falls back to 'read' for public repos / null for private
 *
 * Then we compare against the action's required level:
 *   - read  -> 'read' (HTTPS clone, info/refs ?service=git-upload-pack)
 *   - write -> 'write' (HTTPS push, git-receive-pack)
 */

import { authenticatedUserFromRequest, authChallenge } from "./pat";
import { effectivePermission, permissionAtLeast, type Permission } from "./orgs";
import type { StoredRepo } from "./store";

export type Access = "read" | "write";

function needed(mode: Access): Permission {
  return mode === "read" ? "read" : "write";
}

export async function gateRepoAccess(
  req: Request,
  repo: StoredRepo,
  mode: Access
): Promise<{ deny: Response | null; user: string | null }> {
  // Public read is allowed anonymously. Anything else needs auth.
  const isPublicRead = repo.visibility === "public" && mode === "read";
  if (isPublicRead) {
    return { deny: null, user: null };
  }

  const user = await authenticatedUserFromRequest(req);
  if (!user) {
    return { deny: authChallenge("siphr · supply username + PAT"), user: null };
  }

  const eff = await effectivePermission(user, repo);
  if (!permissionAtLeast(eff, needed(mode))) {
    return {
      deny: new Response("forbidden: insufficient permission\n", {
        status: 403,
        headers: { "content-type": "text/plain" },
      }),
      user,
    };
  }
  return { deny: null, user };
}
