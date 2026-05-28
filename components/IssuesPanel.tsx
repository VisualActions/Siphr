"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type IssueSummary = {
  id: string;
  number: number;
  author: string;
  title: string;
  state: "open" | "closed";
  createdAt: string;
  labels: string[];
};

/**
 * Issues tab content. Renders the list, an inline-expandable new-issue form,
 * and a state toggle (open/closed/all).
 *
 * Permission model is intentionally tame: anyone signed in can file an issue
 * (matching most public forges); state changes are gated to owner or author
 * client-side and re-enforced on the server in v0.4f.
 */
export default function IssuesPanel({
  repoId,
  owner,
  name,
  currentUser,
}: {
  repoId: string;
  owner: string;
  name: string;
  currentUser: string | null;
}) {
  const [state, setState] = useState<"open" | "closed" | "all">("open");
  const [issues, setIssues] = useState<IssueSummary[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  async function refresh() {
    try {
      const r = await fetch(
        `/api/repos/${repoId}/issues?state=${state}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "load failed");
      setIssues(j.issues ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoId, state]);

  async function createIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      setError("sign in to file an issue");
      return;
    }
    if (!newTitle.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/repos/${repoId}/issues`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          author: currentUser,
          title: newTitle.trim(),
          body: newBody,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "create failed");
      setNewTitle("");
      setNewBody("");
      setShowNew(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "12px 16px", display: "flex", gap: 12,
        alignItems: "center", borderBottom: "1px solid var(--line-2)",
        flexWrap: "wrap",
      }}>
        <StateToggle value={state} onChange={setState} />
        <div style={{ marginLeft: "auto" }}>
          {currentUser ? (
            <button
              type="button"
              className="btn primary sm"
              onClick={() => setShowNew((v) => !v)}
            >
              {showNew ? "cancel" : "+ new issue"}
            </button>
          ) : (
            <Link href="/signin" className="btn ghost sm">sign in to file</Link>
          )}
        </div>
      </div>

      {showNew && (
        <form onSubmit={createIssue} style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--line-2)",
          background: "var(--panel-2)",
        }}>
          <input
            className="input"
            type="text"
            placeholder="title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            maxLength={200}
            autoFocus
          />
          <textarea
            rows={5}
            placeholder="describe the issue · markdown coming in v0.4d"
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            style={{
              marginTop: 8, width: "100%",
              border: "1px solid var(--line)", borderRadius: 2,
              padding: "10px 14px", fontFamily: "var(--sans)", fontSize: 13,
              background: "var(--panel)", resize: "vertical",
            }}
          />
          <div style={{
            marginTop: 10, display: "flex",
            justifyContent: "flex-end", gap: 8,
          }}>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => setShowNew(false)}
            >cancel</button>
            <button
              type="submit"
              className="btn primary sm"
              disabled={busy || !newTitle.trim()}
              style={{ opacity: busy || !newTitle.trim() ? 0.55 : 1 }}
            >{busy ? "submitting…" : "submit issue"}</button>
          </div>
        </form>
      )}

      {error && (
        <div style={{
          padding: "10px 16px",
          fontFamily: "var(--mono)", fontSize: 12,
          color: "var(--signal)",
          background: "color-mix(in oklab, var(--signal) 8%, transparent)",
        }}>{error}</div>
      )}

      {issues === null ? (
        <div style={{
          padding: "26px 16px",
          fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)",
        }}>loading…</div>
      ) : issues.length === 0 ? (
        <div style={{
          padding: "32px 16px", textAlign: "center",
          fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)",
        }}>
          ↳ no {state === "all" ? "" : state} issues yet
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {issues.map((i) => (
            <li
              key={i.id}
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--line-2)",
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 12, alignItems: "center",
              }}
            >
              <StateDot state={i.state} />
              <div style={{ minWidth: 0 }}>
                <Link
                  href={`/${owner}/${name}/issues/${i.number}`}
                  style={{
                    fontSize: 14, fontWeight: 500, color: "var(--ink)",
                    textDecoration: "none",
                  }}
                >
                  {i.title}
                </Link>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)",
                  marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap",
                }}>
                  <span>#{i.number}</span>
                  <span>opened by {i.author}</span>
                  <span>{new Date(i.createdAt).toLocaleDateString()}</span>
                  {i.labels.length > 0 && (
                    <span>· {i.labels.join(", ")}</span>
                  )}
                </div>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                {i.state === "closed" ? "closed" : "open"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StateToggle({
  value, onChange,
}: { value: "open" | "closed" | "all"; onChange: (v: "open" | "closed" | "all") => void }) {
  const opts = ["open", "closed", "all"] as const;
  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {opts.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          style={{
            padding: "5px 10px",
            background: value === o ? "var(--phosphor-bg)" : "transparent",
            color: value === o ? "var(--phosphor)" : "var(--muted)",
            border: "1px solid var(--line)",
            borderRadius: 2,
            fontFamily: "var(--mono)", fontSize: 11,
            textTransform: "lowercase",
            cursor: "pointer",
          }}
        >{o}</button>
      ))}
    </div>
  );
}

function StateDot({ state }: { state: "open" | "closed" }) {
  return (
    <span
      title={state}
      style={{
        width: 10, height: 10, borderRadius: 999, display: "inline-block",
        background: state === "open" ? "var(--phosphor)" : "var(--muted)",
      }}
    />
  );
}
