import { NextResponse } from "next/server";
import {
  createRepo,
  getUser,
  listRepos,
  reposFor,
  type EncryptionMode,
} from "@/lib/store";
import { generateDek, wrapDekWithMaster } from "@/lib/server-crypto";
import { getOrgByName, getOrgMember } from "@/lib/orgs";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = url.searchParams.get("user");
  if (!user) {
    const repos = (await listRepos()).filter((r) => r.visibility === "public");
    return NextResponse.json({ repos });
  }
  const repos = await reposFor(user);
  return NextResponse.json({ repos });
}

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (auth.deny) return auth.deny;
  const actor = auth.user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const owner = typeof b.owner === "string" ? b.owner : "";
  const name = typeof b.name === "string" ? b.name : "";
  const visibility = b.visibility === "public" ? "public" : "private";
  const description = typeof b.description === "string" ? b.description : null;
  const wrappedKeys =
    b.wrappedKeys && typeof b.wrappedKeys === "object"
      ? (b.wrappedKeys as Record<string, unknown>)
      : {};
  // 'server' = at-rest encryption with server-managed key (default for
  // private). 'e2ee' = legacy browser-encrypted, requires wrappedKeys.
  // 'none' is automatic for public repos.
  const requestedMode =
    typeof b.encryptionMode === "string" ? b.encryptionMode : null;

  // Match the signup regex — mixed case, A–Z/a–z/0–9/_/-, no leading or
  // trailing dash. Previously this was lowercase-only, which silently broke
  // repo creation for every account with a capital letter in their handle.
  if (!/^[A-Za-z0-9_-]{3,32}$/.test(owner) || /^-|-$/.test(owner)) {
    return NextResponse.json({ error: "invalid owner" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(name)) {
    return NextResponse.json({ error: "invalid repo name" }, { status: 400 });
  }
  // Owner namespace may be a user or an org. If it's an org, require the
  // actor to be an admin/owner of that org.
  const ownerUser = await getUser(owner);
  const ownerOrg = ownerUser ? null : await getOrgByName(owner);
  if (!ownerUser && !ownerOrg) {
    return NextResponse.json({ error: "unknown owner" }, { status: 404 });
  }
  if (ownerOrg) {
    const member = await getOrgMember(ownerOrg.id, actor);
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json(
        { error: "you are not an admin of this org" },
        { status: 403 }
      );
    }
  } else if (ownerUser && actor !== owner) {
    // A user can only create repos under their own namespace.
    return NextResponse.json(
      { error: "cannot create a repo under another user's namespace" },
      { status: 403 }
    );
  }

  // Resolve encryption mode.
  let encryptionMode: EncryptionMode;
  if (visibility === "public") {
    encryptionMode = "none";
  } else if (requestedMode === "e2ee") {
    encryptionMode = "e2ee";
  } else {
    // Default for private: server-managed at-rest encryption. This is what
    // makes standard `git push` / `git clone` work for private repos.
    encryptionMode = "server";
  }

  if (encryptionMode === "e2ee" && !(owner in wrappedKeys)) {
    return NextResponse.json(
      { error: "e2ee repos require a wrapped key for the owner" },
      { status: 400 }
    );
  }

  // Generate + wrap the per-repo DEK for server-mode private repos. Master
  // key is read from SIPHR_MASTER_KEY — this throws cleanly if unset.
  let wrappedDek: Buffer | null = null;
  if (encryptionMode === "server") {
    try {
      wrappedDek = wrapDekWithMaster(generateDek());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "server config error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  try {
    const repo = await createRepo({
      owner,
      name,
      visibility,
      description,
      wrappedKeys,
      encryptionMode,
      wrappedDek,
      keySource: "master",
    });
    return NextResponse.json({
      ok: true,
      id: repo.id,
      owner: repo.owner,
      name: repo.name,
      visibility: repo.visibility,
      encryptionMode: repo.encryptionMode,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server error";
    const status = msg.includes("duplicate") || msg.includes("23505") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
