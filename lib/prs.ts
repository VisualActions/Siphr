/**
 * Pull request persistence and merge mechanics.
 *
 * MVP: PRs reference two refs (head and base) with snapshotted oids at open
 * time. Merge is fast-forward only — we advance the base ref to head_oid if
 * head is a descendant of base. Squash/rebase/octopus come in v0.5.
 */

import { pg } from "./supabase";

export type PRState = "open" | "closed" | "merged";

export type StoredPR = {
  id: string;
  repoId: string;
  number: number;
  author: string;
  title: string;
  body: string;
  state: PRState;
  headRef: string;
  baseRef: string;
  headOid: string;
  baseOid: string;
  mergeCommitOid: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  mergedBy: string | null;
};

type PRRow = {
  id: string;
  repo_id: string;
  number: number;
  author: string;
  title: string;
  body: string;
  state: PRState;
  head_ref: string;
  base_ref: string;
  head_oid: string;
  base_oid: string;
  merge_commit_oid: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merged_by: string | null;
};

function fromRow(r: PRRow): StoredPR {
  return {
    id: r.id,
    repoId: r.repo_id,
    number: r.number,
    author: r.author,
    title: r.title,
    body: r.body,
    state: r.state,
    headRef: r.head_ref,
    baseRef: r.base_ref,
    headOid: r.head_oid,
    baseOid: r.base_oid,
    mergeCommitOid: r.merge_commit_oid,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    closedAt: r.closed_at,
    mergedAt: r.merged_at,
    mergedBy: r.merged_by,
  };
}

async function nextPRNumber(repoId: string): Promise<number> {
  const result = await pg<number>(
    "POST",
    "rpc/next_pr_number",
    { p_repo_id: repoId }
  );
  if (typeof result !== "number") {
    throw new Error("next_pr_number rpc returned non-number");
  }
  return result;
}

export async function listPRs(
  repoId: string,
  state: PRState | "all" = "open"
): Promise<StoredPR[]> {
  const filter = state === "all" ? "" : `&state=eq.${state}`;
  const rows = await pg<PRRow[]>(
    "GET",
    `pull_requests?select=*&repo_id=eq.${encodeURIComponent(repoId)}${filter}&order=created_at.desc`
  );
  return (rows ?? []).map(fromRow);
}

export async function getPRByNumber(
  repoId: string,
  number: number
): Promise<StoredPR | null> {
  const rows = await pg<PRRow[]>(
    "GET",
    `pull_requests?select=*&repo_id=eq.${encodeURIComponent(repoId)}&number=eq.${number}&limit=1`
  );
  return rows?.[0] ? fromRow(rows[0]) : null;
}

export async function createPR(args: {
  repoId: string;
  author: string;
  title: string;
  body?: string;
  headRef: string;
  baseRef: string;
  headOid: string;
  baseOid: string;
}): Promise<StoredPR> {
  const number = await nextPRNumber(args.repoId);
  const rows = await pg<PRRow[]>(
    "POST",
    "pull_requests?select=*",
    [
      {
        repo_id: args.repoId,
        number,
        author: args.author,
        title: args.title,
        body: args.body ?? "",
        head_ref: args.headRef,
        base_ref: args.baseRef,
        head_oid: args.headOid,
        base_oid: args.baseOid,
      },
    ],
    { prefer: "return=representation" }
  );
  return fromRow(rows[0]);
}

export async function updatePR(
  prId: string,
  patch: Partial<{
    title: string;
    body: string;
    state: PRState;
    mergeCommitOid: string | null;
    mergedBy: string | null;
  }>
): Promise<StoredPR | null> {
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.body !== undefined) body.body = patch.body;
  if (patch.state !== undefined) {
    body.state = patch.state;
    if (patch.state === "merged") {
      body.merged_at = new Date().toISOString();
      body.closed_at = new Date().toISOString();
    } else if (patch.state === "closed") {
      body.closed_at = new Date().toISOString();
    } else if (patch.state === "open") {
      body.closed_at = null;
      body.merged_at = null;
    }
  }
  if (patch.mergeCommitOid !== undefined) body.merge_commit_oid = patch.mergeCommitOid;
  if (patch.mergedBy !== undefined) body.merged_by = patch.mergedBy;

  const rows = await pg<PRRow[]>(
    "PATCH",
    `pull_requests?id=eq.${encodeURIComponent(prId)}&select=*`,
    body,
    { prefer: "return=representation" }
  );
  return rows?.[0] ? fromRow(rows[0]) : null;
}

// ---- comments ----

export type StoredPRComment = {
  id: string;
  prId: string;
  author: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
};

type PRCommentRow = {
  id: string;
  pr_id: string;
  author: string;
  body: string;
  created_at: string;
  edited_at: string | null;
};

function commentFromRow(r: PRCommentRow): StoredPRComment {
  return {
    id: r.id,
    prId: r.pr_id,
    author: r.author,
    body: r.body,
    createdAt: r.created_at,
    editedAt: r.edited_at,
  };
}

export async function listPRComments(prId: string): Promise<StoredPRComment[]> {
  const rows = await pg<PRCommentRow[]>(
    "GET",
    `pr_comments?select=*&pr_id=eq.${encodeURIComponent(prId)}&order=created_at.asc`
  );
  return (rows ?? []).map(commentFromRow);
}

export async function addPRComment(args: {
  prId: string;
  author: string;
  body: string;
}): Promise<StoredPRComment> {
  const rows = await pg<PRCommentRow[]>(
    "POST",
    "pr_comments?select=*",
    [
      {
        pr_id: args.prId,
        author: args.author,
        body: args.body,
      },
    ],
    { prefer: "return=representation" }
  );
  return commentFromRow(rows[0]);
}
