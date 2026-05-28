"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import TopNav from "@/components/TopNav";
import { FingerprintSigil } from "@/components/Primitives";

type PR = {
  id: string;
  number: number;
  author: string;
  title: string;
  body: string;
  state: "open" | "closed" | "merged";
  headRef: string;
  baseRef: string;
  headOid: string;
  baseOid: string;
  createdAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  mergedBy: string | null;
};

type FileChange = {
  path: string;
  status: "added" | "removed" | "modified";
  baseOid: string | null;
  headOid: string | null;
};

type Counts = { ahead: number; behind: number };

type PRComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

type RepoMin = { id: string; owner: string; name: string };

export default function PullPage({
  params,
}: {
  params: Promise<{ owner: string; name: string; number: string }>;
}) {
  const { owner, name, number } = use(params);

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [repo, setRepo] = useState<RepoMin | null>(null);
  const [pr, setPr] = useState<PR | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [changes, setChanges] = useState<FileChange[]>([]);
  const [comments, setComments] = useState<PRComment[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"conversation" | "files">("conversation");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!repo) return;
    const [prRes, commRes] = await Promise.all([
      fetch(`/api/repos/${repo.id}/pulls/${number}?diff=1`, { cache: "no-store" }),
      fetch(`/api/repos/${repo.id}/pulls/${number}/comments`, { cache: "no-store" }),
    ]);
    if (prRes.status === 404) { setNotFound(true); return; }
    const prJson = await prRes.json();
    setPr(prJson.pr);
    setCounts(prJson.counts ?? null);
    setChanges(prJson.changes ?? []);
    const cj = await commRes.json();
    setComments(cj.comments ?? []);
  }

  useEffect(() => {
    setCurrentUser(localStorage.getItem("siphr:current_user"));
    let cancelled = false;
    (async () => {
      const r = await fetch(`/api/repos/by-name/${owner}/${name}`);
      if (r.status === 404) { if (!cancelled) setNotFound(true); return; }
      const j = await r.json();
      if (cancelled) return;
      setRepo({ id: j.id, owner: j.owner, name: j.name });
    })();
    return () => { cancelled = true; };
  }, [owner, name]);

  useEffect(() => {
    if (repo) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, number]);

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !repo || !pr || !draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/repos/${repo.id}/pulls/${pr.number}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ author: currentUser, body: draft }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "post failed");
      setComments((c) => [...c, j.comment]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "post failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleState() {
    if (!repo || !pr) return;
    const next = pr.state === "open" ? "closed" : "open";
    const r = await fetch(`/api/repos/${repo.id}/pulls/${pr.number}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state: next }),
    });
    const j = await r.json();
    if (r.ok) setPr(j.pr);
    else setError(j.error ?? "update failed");
  }

  async function merge() {
    if (!repo || !pr || !currentUser) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/repos/${repo.id}/pulls/${pr.number}/merge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor: currentUser }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "merge failed");
      setPr(j.pr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "merge failed");
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <>
        <TopNav />
        <main style={{ maxWidth: 1012, margin: "0 auto", padding: "64px 6vw", textAlign: "center" }}>
          <h1 className="serif" style={{ fontSize: 80, color: "var(--copper)" }}>404</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>pull request not found</p>
        </main>
      </>
    );
  }

  if (!pr || !repo) {
    return (
      <>
        <TopNav />
        <main style={{ maxWidth: 880, margin: "0 auto", padding: "64px 6vw", fontFamily: "var(--mono)", color: "var(--muted)" }}>loading…</main>
      </>
    );
  }

  return (
    <>
      <TopNav />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "44px 6vw 80px" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          ↳{" "}
          <Link href={`/${owner}/${name}`} style={{ color: "var(--phosphor)" }}>
            {owner}/{name}
          </Link>{" "}
          · pull #{pr.number}
        </div>
        <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.015em", lineHeight: 1.1 }}>
          {pr.title}
        </h1>

        <div style={{
          marginTop: 14, display: "flex", gap: 14,
          alignItems: "center", flexWrap: "wrap",
          fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)",
        }}>
          <StateBadge state={pr.state} />
          <span>{pr.author}</span>
          <span>{pr.headRef.replace("refs/heads/", "")} → {pr.baseRef.replace("refs/heads/", "")}</span>
          {counts && <span>+{counts.ahead} / -{counts.behind}</span>}
          <span>opened {new Date(pr.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Tab strip */}
        <div style={{
          marginTop: 24, display: "flex", gap: 24,
          borderBottom: "1px solid var(--line)",
        }}>
          <TabButton active={tab === "conversation"} onClick={() => setTab("conversation")}>
            conversation · {comments.length}
          </TabButton>
          <TabButton active={tab === "files"} onClick={() => setTab("files")}>
            files changed · {changes.length}
          </TabButton>
        </div>

        {tab === "conversation" && (
          <>
            <CommentCard author={pr.author} body={pr.body || "_(no description)_"} createdAt={pr.createdAt} />
            {comments.map((c) => (
              <CommentCard key={c.id} author={c.author} body={c.body} createdAt={c.createdAt} />
            ))}

            {currentUser ? (
              <form onSubmit={postComment} style={{ marginTop: 22 }}>
                <textarea
                  rows={4}
                  placeholder="leave a comment"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid var(--line)", borderRadius: 2,
                    padding: "10px 14px", fontFamily: "var(--sans)", fontSize: 13,
                    background: "var(--panel)", resize: "vertical",
                  }}
                />
                <div style={{
                  marginTop: 10, display: "flex", justifyContent: "space-between",
                  gap: 10, alignItems: "center", flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {pr.state === "open" && (
                      <>
                        <button type="button" className="btn ghost sm" onClick={toggleState}>
                          close pr
                        </button>
                        <button
                          type="button"
                          className="btn primary sm"
                          onClick={merge}
                          disabled={busy}
                          style={{ opacity: busy ? 0.55 : 1 }}
                        >
                          {busy ? "merging…" : "merge (fast-forward)"}
                        </button>
                      </>
                    )}
                    {pr.state === "closed" && (
                      <button type="button" className="btn ghost sm" onClick={toggleState}>
                        reopen pr
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn primary sm"
                    disabled={busy || !draft.trim()}
                    style={{ opacity: busy || !draft.trim() ? 0.55 : 1 }}
                  >comment</button>
                </div>
              </form>
            ) : (
              <div style={{
                marginTop: 22, padding: "12px 14px",
                border: "1px solid var(--line)", borderRadius: 2,
                background: "var(--panel)",
                fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)",
              }}>
                <Link href="/signin" style={{ color: "var(--phosphor)" }}>sign in</Link> to comment
              </div>
            )}

            {error && (
              <div style={{
                marginTop: 12, padding: "8px 12px", borderRadius: 2,
                background: "color-mix(in oklab, var(--signal) 10%, transparent)",
                color: "var(--signal)", fontFamily: "var(--mono)", fontSize: 12,
              }}>{error}</div>
            )}
          </>
        )}

        {tab === "files" && (
          <div className="card" style={{ marginTop: 18, padding: 0, overflow: "hidden" }}>
            {changes.length === 0 ? (
              <div style={{
                padding: "32px 16px", textAlign: "center",
                fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)",
              }}>
                ↳ no file changes
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {changes.map((c) => (
                  <li key={c.path} style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--line-2)",
                    display: "grid", gridTemplateColumns: "auto 1fr",
                    gap: 12, alignItems: "center",
                  }}>
                    <StatusGlyph status={c.status} />
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, wordBreak: "break-all" }}>
                      {c.path}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div style={{
              padding: "10px 14px",
              fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)",
              background: "var(--panel-2)",
            }}>
              ↳ inline diff rendering ships in v0.4d.2
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function StateBadge({ state }: { state: "open" | "closed" | "merged" }) {
  const colors = {
    open:   { c: "var(--phosphor)", t: "open" },
    merged: { c: "var(--phosphor-2)", t: "merged" },
    closed: { c: "var(--muted)", t: "closed" },
  }[state];
  return (
    <span className="pill" style={{ color: colors.c, borderColor: colors.c }}>{colors.t}</span>
  );
}

function StatusGlyph({ status }: { status: "added" | "removed" | "modified" }) {
  const ch = status === "added" ? "+" : status === "removed" ? "−" : "~";
  const c =
    status === "added" ? "var(--phosphor)"
    : status === "removed" ? "var(--signal)"
    : "var(--amber)";
  return (
    <span style={{
      fontFamily: "var(--mono)", fontSize: 12,
      color: c, width: 16, textAlign: "center",
    }}>{ch}</span>
  );
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 0",
        fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: active ? "var(--ink)" : "var(--muted)",
        borderBottom: active ? "2px solid var(--phosphor)" : "2px solid transparent",
        marginBottom: -1,
        background: "transparent", border: 0,
        borderRadius: 0, cursor: "pointer",
      }}
    >{children}</button>
  );
}

function CommentCard({
  author, body, createdAt,
}: { author: string; body: string; createdAt: string }) {
  return (
    <div className="card" style={{ marginTop: 16, padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid var(--line-2)",
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
