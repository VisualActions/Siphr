/**
 * Issue and comment persistence.
 *
 * Per-repo numbering goes through the `next_issue_number` Postgres function
 * via PostgREST's /rpc endpoint so we don't race on concurrent creates.
 */

import { pg } from "./supabase";

export type IssueState = "open" | "closed";

export type StoredIssue = {
  id: string;
  repoId: string;
  number: number;
  author: string;
  title: string;
  body: string;
  state: IssueState;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  closedBy: string | null;
  labels: string[];
};

export type StoredComment = {
  id: string;
  issueId: string;
  author: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
};

type IssueRow = {
  id: string;
  repo_id: string;
  number: number;
  author: string;
  title: string;
  body: string;
  state: IssueState;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_by: string | null;
};

type CommentRow = {
  id: string;
  issue_id: string;
  author: string;
  body: string;
  created_at: string;
  edited_at: string | null;
};

function issueFromRow(r: IssueRow, labels: string[]): StoredIssue {
  return {
    id: r.id,
    repoId: r.repo_id,
    number: r.number,
    author: r.author,
    title: r.title,
    body: r.body,
    state: r.state,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    closedAt: r.closed_at,
    closedBy: r.closed_by,
    labels,
  };
}

function commentFromRow(r: CommentRow): StoredComment {
  return {
    id: r.id,
    issueId: r.issue_id,
    author: r.author,
    body: r.body,
    createdAt: r.created_at,
    editedAt: r.edited_at,
  };
}

async function labelsForIssues(issueIds: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (issueIds.length === 0) return out;
  const inList = issueIds.map((i) => `"${i}"`).join(",");
  const rows = await pg<{ issue_id: string; label_name: string }[]>(
    "GET",
    `issue_labels?select=issue_id,label_name&issue_id=in.(${inList})`
  );
  for (const row of rows ?? []) {
    const cur = out.get(row.issue_id) ?? [];
    cur.push(row.label_name);
    out.set(row.issue_id, cur);
  }
  return out;
}

export async function listIssues(
  repoId: string,
  state: IssueState | "all" = "open"
): Promise<StoredIssue[]> {
  const filter = state === "all" ? "" : `&state=eq.${state}`;
  const rows = await pg<IssueRow[]>(
    "GET",
    `issues?select=*&repo_id=eq.${encodeURIComponent(repoId)}${filter}&order=created_at.desc`
  );
  const issues = rows ?? [];
  const labelMap = await labelsForIssues(issues.map((r) => r.id));
  return issues.map((r) => issueFromRow(r, labelMap.get(r.id) ?? []));
}

export async function countIssues(
  repoId: string
): Promise<{ open: number; closed: number }> {
  const rows = await pg<{ state: IssueState }[]>(
    "GET",
    `issues?select=state&repo_id=eq.${encodeURIComponent(repoId)}`
  );
  const list = rows ?? [];
  return {
    open: list.filter((r) => r.state === "open").length,
    closed: list.filter((r) => r.state === "closed").length,
  };
}

export async function getIssueByNumber(
  repoId: string,
  number: number
): Promise<StoredIssue | null> {
  const rows = await pg<IssueRow[]>(
    "GET",
    `issues?select=*&repo_id=eq.${encodeURIComponent(repoId)}&number=eq.${number}&limit=1`
  );
  const r = rows?.[0];
  if (!r) return null;
  const labels = await labelsForIssues([r.id]);
  return issueFromRow(r, labels.get(r.id) ?? []);
}

async function nextIssueNumber(repoId: string): Promise<number> {
  const result = await pg<number>(
    "POST",
    "rpc/next_issue_number",
    { p_repo_id: repoId }
  );
  if (typeof result !== "number") {
    throw new Error("next_issue_number rpc returned non-number");
  }
  return result;
}

export async function createIssue(args: {
  repoId: string;
  author: string;
  title: string;
  body?: string;
  labels?: string[];
}): Promise<StoredIssue> {
  const number = await nextIssueNumber(args.repoId);
  const rows = await pg<IssueRow[]>(
    "POST",
    "issues?select=*",
    [
      {
        repo_id: args.repoId,
        number,
        author: args.author,
        title: args.title,
        body: args.body ?? "",
      },
    ],
    { prefer: "return=representation" }
  );
  const issue = rows[0];
  if (args.labels && args.labels.length > 0) {
    await pg(
      "POST",
      "issue_labels",
      args.labels.map((name) => ({ issue_id: issue.id, label_name: name }))
    );
  }
  return issueFromRow(issue, args.labels ?? []);
}

export async function updateIssue(
  issueId: string,
  patch: Partial<{ title: string; body: string; state: IssueState; closedBy: string | null }>
): Promise<StoredIssue | null> {
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.body !== undefined) body.body = patch.body;
  if (patch.state !== undefined) {
    body.state = patch.state;
    if (patch.state === "closed") {
      body.closed_at = new Date().toISOString();
      body.closed_by = patch.closedBy ?? null;
    } else {
      body.closed_at = null;
      body.closed_by = null;
    }
  }
  const rows = await pg<IssueRow[]>(
    "PATCH",
    `issues?id=eq.${encodeURIComponent(issueId)}&select=*`,
    body,
    { prefer: "return=representation" }
  );
  if (!rows?.[0]) return null;
  const labels = await labelsForIssues([rows[0].id]);
  return issueFromRow(rows[0], labels.get(rows[0].id) ?? []);
}

export async function listComments(issueId: string): Promise<StoredComment[]> {
  const rows = await pg<CommentRow[]>(
    "GET",
    `issue_comments?select=*&issue_id=eq.${encodeURIComponent(issueId)}&order=created_at.asc`
  );
  return (rows ?? []).map(commentFromRow);
}

export async function addComment(args: {
  issueId: string;
  author: string;
  body: string;
}): Promise<StoredComment> {
  const rows = await pg<CommentRow[]>(
    "POST",
    "issue_comments?select=*",
    [
      {
        issue_id: args.issueId,
        author: args.author,
        body: args.body,
      },
    ],
    { prefer: "return=representation" }
  );
  return commentFromRow(rows[0]);
}

// ---- labels ----

export type StoredLabel = {
  repoId: string;
  name: string;
  color: string;
  description: string | null;
};

type LabelRow = {
  repo_id: string;
  name: string;
  color: string;
  description: string | null;
};

function labelFromRow(r: LabelRow): StoredLabel {
  return {
    repoId: r.repo_id,
    name: r.name,
    color: r.color,
    description: r.description,
  };
}

export async function listLabels(repoId: string): Promise<StoredLabel[]> {
  const rows = await pg<LabelRow[]>(
    "GET",
    `labels?select=*&repo_id=eq.${encodeURIComponent(repoId)}&order=name.asc`
  );
  return (rows ?? []).map(labelFromRow);
}
