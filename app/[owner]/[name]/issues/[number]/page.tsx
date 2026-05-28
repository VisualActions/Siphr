"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import TopNav from "@/components/TopNav";
import { FingerprintSigil } from "@/components/Primitives";

type IssueDetail = {
  id: string;
  repoId: string;
  number: number;
  author: string;
  title: string;
  body: string;
  state: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  closedBy: string | null;
  labels: string[];
};

type Comment = {
  id: string;
  issueId: string;
  author: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
};

type RepoMin = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
};

export default function IssuePage({
  params,
}: {
  params: Promise<{ owner: string; name: string; number: string }>;
}) {
  const { owner, name, number } = use(params);
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [repo, setRepo] = useState<RepoMin | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const [commentDraft, setCommentDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(localStorage.getItem("siphr:current_user"));
    let cancelled = false;
    (async () => {
      try {
        const repoRes = await fetch(`/api/repos/by-name/${owner}/${name}`);
        if (repoRes.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const repoJson = await repoRes.json();
        if (cancelled) return;
        setRepo({
          id: repoJson.id,
          owner: repoJson.owner,
          name: repoJson.name,
          visibility: repoJson.visibility,
        });

        const issueRes = await fetch(
          `/api/repos/${repoJson.id}/issues/${encodeURIComponent(number)}`,
          { cache: "no-store" }
        );
        if (issueRes.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const issueJson = await issueRes.json();
        if (cancelled) return;
        setIssue(issueJson.issue);

        const commentsRes = await fetch(
          `/api/repos/${repoJson.id}/issues/${encodeURIComponent(number)}/comments`,
          { cache: "no-store" }
        );
        const commentsJson = await commentsRes.json();
        if (!cancelled) setComments(commentsJson.comments ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "load failed");
      }
    })();
    return () => { cancelled = true; };
  }, [owner, name, number]);

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !repo || !issue) return;
    if (!commentDraft.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/repos/${repo.id}/issues/${issue.number}/comments`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ author: currentUser, body: commentDraft }),
        }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "post failed");
      setComments((c) => [...c, j.comment]);
      setCommentDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "post failed");
    } finally {
      setPosting(false);
    }
  }

  async function toggleState() {
    if (!repo || !issue) return;
    const next = issue.state === "open" ? "closed" : "open";
    setError(null);
    try {
      const r = await fetch(
        `/api/repos/${repo.id}/issues/${issue.number}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ state: next, actor: currentUser }),
        }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "update failed");
      setIssue(j.issue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "update failed");
    }
  }

  if (notFound) {
    return (
      <>
        <TopNav />
        <main style={{ maxWidth: 1012, margin: "0 auto", padding: "64px 6vw", textAlign: "center" }}>
          <h1 className="serif" style={{ fontSize: 80, color: "var(--copper)" }}>404</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>
            issue not found
          </p>
        </main>
      </>
    );
  }

  if (!issue || !repo) {
    return (
      <>
        <TopNav />
        <main style={{ maxWidth: 880, margin: "0 auto", padding: "64px 6vw", fontFamily: "var(--mono)", color: "var(--muted)" }}>
          loading…
        </main>
      </>
    );
  }

  const canChangeState = currentUser && (currentUser === issue.author || currentUser === repo.owner);

  return (
    <>
      <TopNav />
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "44px 6vw 80px" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          ↳{" "}
          <Link href={`/${owner}/${name}`} style={{ color: "var(--phosphor)" }}>
            {owner}/{name}
          </Link>{" "}
          · issue #{issue.number}
        </div>
        <h1 className="serif" style={{ fontSize: 36, letterSpacing: "-0.015em", lineHeight: 1.1 }}>
          {issue.title}
        </h1>

        <div style={{
          marginTop: 14, display: "flex",
          alignItems: "center", gap: 12, flexWrap: "wrap",
          fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)",
        }}>
          <span
            className="pill"
            style={
              issue.state === "open"
                ? { color: "var(--phosphor)", borderColor: "var(--phosphor)" }
                : { color: "var(--muted)" }
            }
          >
            {issue.state}
          </span>
          <span>opened by {issue.author}</span>
          <span>· {new Date(issue.createdAt).toLocaleDateString()}</span>
          {issue.closedAt && (
            <span>· closed {new Date(issue.closedAt).toLocaleDateString()}</span>
          )}
        </div>

        {/* Issue body */}
        <CommentCard
          author={issue.author}
          body={issue.body || "_(no description provided)_"}
          createdAt={issue.createdAt}
        />

        {/* Comment list */}
        {comments.map((c) => (
          <CommentCard
            key={c.id}
            author={c.author}
            body={c.body}
            createdAt={c.createdAt}
          />
        ))}

        {/* Comment form */}
        {currentUser ? (
          <form onSubmit={postComment} style={{ marginTop: 24 }}>
            <textarea
              rows={4}
              placeholder="leave a comment"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid var(--line)", borderRadius: 2,
                padding: "10px 14px", fontFamily: "var(--sans)", fontSize: 13,
                background: "var(--panel)", resize: "vertical",
              }}
            />
            <div style={{
              marginTop: 10, display: "flex", justifyContent: "space-between",
              gap: 12, alignItems: "center", flexWrap: "wrap",
            }}>
              {canChangeState ? (
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={toggleState}
                >
                  {issue.state === "open" ? "close issue" : "reopen issue"}
                </button>
              ) : <span />}
              <button
                type="submit"
                className="btn primary sm"
                disabled={posting || !commentDraft.trim()}
                style={{ opacity: posting || !commentDraft.trim() ? 0.55 : 1 }}
              >{posting ? "posting…" : "comment"}</button>
            </div>
          </form>
        ) : (
          <div style={{
            marginTop: 24, padding: "12px 14px",
            border: "1px solid var(--line)", borderRadius: 2,
            background: "var(--panel)",
            fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)",
          }}>
            <Link href="/signin" style={{ color: "var(--phosphor)" }}>sign in</Link>{" "}
            to leave a comment
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 12, padding: "8px 12px", borderRadius: 2,
            background: "color-mix(in oklab, var(--signal) 10%, transparent)",
            color: "var(--signal)", fontFamily: "var(--mono)", fontSize: 12,
          }}>{error}</div>
        )}
      </main>
    </>
  );
}

function CommentCard({
  author, body, createdAt,
}: { author: string; body: string; createdAt: string }) {
  return (
    <div className="card" style={{
      marginTop: 16, padding: 0, overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--line-2)",
        display: "flex", alignItems: "center", gap: 10,
        background: "var(--panel-2)",
      }}>
        <FingerprintSigil seed={`${author}@siphr`} size={22} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{author}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
          · {new Date(createdAt).toLocaleString()}
        </span>
      </div>
      <pre style={{
        margin: 0, padding: "16px 18px",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        fontFamily: "var(--sans)", fontSize: 13.5, lineHeight: 1.6,
      }}>{body}</pre>
    </div>
  );
}
