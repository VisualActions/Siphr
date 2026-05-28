/**
 * Releases: tagged + named publications of a repo state.
 *
 * Binary asset uploads (Vercel Blob) land in v0.4e.2 — the `release_assets`
 * table is in place but unused for now.
 */

import { pg } from "./supabase";

export type StoredRelease = {
  id: string;
  repoId: string;
  tagName: string;
  name: string | null;
  body: string;
  targetOid: string;
  author: string;
  draft: boolean;
  prerelease: boolean;
  createdAt: string;
  publishedAt: string | null;
};

type ReleaseRow = {
  id: string;
  repo_id: string;
  tag_name: string;
  name: string | null;
  body: string;
  target_oid: string;
  author: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
};

function fromRow(r: ReleaseRow): StoredRelease {
  return {
    id: r.id,
    repoId: r.repo_id,
    tagName: r.tag_name,
    name: r.name,
    body: r.body,
    targetOid: r.target_oid,
    author: r.author,
    draft: r.draft,
    prerelease: r.prerelease,
    createdAt: r.created_at,
    publishedAt: r.published_at,
  };
}

export async function listReleases(repoId: string): Promise<StoredRelease[]> {
  const rows = await pg<ReleaseRow[]>(
    "GET",
    `releases?select=*&repo_id=eq.${encodeURIComponent(repoId)}&order=created_at.desc`
  );
  return (rows ?? []).map(fromRow);
}

export async function getReleaseByTag(
  repoId: string,
  tag: string
): Promise<StoredRelease | null> {
  const rows = await pg<ReleaseRow[]>(
    "GET",
    `releases?select=*&repo_id=eq.${encodeURIComponent(repoId)}&tag_name=eq.${encodeURIComponent(tag)}&limit=1`
  );
  return rows?.[0] ? fromRow(rows[0]) : null;
}

export async function createRelease(args: {
  repoId: string;
  tagName: string;
  name: string | null;
  body: string;
  targetOid: string;
  author: string;
  draft: boolean;
  prerelease: boolean;
}): Promise<StoredRelease> {
  const rows = await pg<ReleaseRow[]>(
    "POST",
    "releases?select=*",
    [
      {
        repo_id: args.repoId,
        tag_name: args.tagName,
        name: args.name,
        body: args.body,
        target_oid: args.targetOid,
        author: args.author,
        draft: args.draft,
        prerelease: args.prerelease,
        published_at: args.draft ? null : new Date().toISOString(),
      },
    ],
    { prefer: "return=representation" }
  );
  return fromRow(rows[0]);
}

export async function deleteRelease(repoId: string, tag: string): Promise<boolean> {
  const rows = await pg<ReleaseRow[]>(
    "DELETE",
    `releases?repo_id=eq.${encodeURIComponent(repoId)}&tag_name=eq.${encodeURIComponent(tag)}&select=*`,
    undefined,
    { prefer: "return=representation" }
  );
  return (rows ?? []).length > 0;
}
