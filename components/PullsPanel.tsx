"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PRSummary = {
  id: string;
  number: number;
  author: string;
  title: string;
  state: "open" | "closed" | "merged";
  headRef: string;
  baseRef: string;
  createdAt: string;
};

/**
 * Pull-requests tab content. Lists open/closed/merged PRs and offers a
 * "+ new pull request" link to the inline creation page.
 */
export default function PullsPanel({
  repoId, owner, name,
}: { repoId: string; owner: string; name: string }) {
  const [state, setState] = useState<"open" | "closed" | "merged" | "all">("open");
  const [prs, setPrs] = useState<PRSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/repos/${repoId}/pulls?state=${state}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "load failed");
        if (!cancelled) setPrs(j.prs ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "load failed");
      }
    })();
    return () => { cancelled = true; };
  }, [repoId, state]);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "12px 16px", display: "flex", gap: 12, alignItems: "center",
        borderBottom: "1px solid var(--line-2)", flexWrap: "wrap",
      }}>
        <StateToggle value={state} onChange={setState} />
        <div style={{ marginLeft: "auto" }}>
          <Link
            href={`/${owner}/${name}/pulls/new`}
            className="btn primary sm"
          >
            + new pull request
          </Link>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "10px 16px",
          fontFamily: "var(--mono)", fontSize: 12, color: "var(--signal)",
        }}>{error}</div>
      )}

      {prs === null ? (
        <div style={{ padding: 26, fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>loading…</div>
      ) : prs.length === 0 ? (
        <div style={{
          padding: "32px 16px", textAlign: "center",
          fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)",
        }}>
          ↳ no {state === "all" ? "" : state} pull requests
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {prs.map((p) => (
            <li key={p.id} style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--line-2)",
              display: "grid", gridTemplateColumns: "auto 1fr auto",
              gap: 12, alignItems: "center",
            }}>
              <StateDot state={p.state} />
              <div style={{ minWidth: 0 }}>
                <Link
                  href={`/${owner}/${name}/pulls/${p.number}`}
                  style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", textDecoration: "none" }}
                >
                  {p.title}
                </Link>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)",
                  marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap",
                }}>
                  <span>#{p.number}</span>
                  <span>by {p.author}</span>
                  <span>{p.headRef.replace("refs/heads/", "")} → {p.baseRef.replace("refs/heads/", "")}</span>
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                {p.state}
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
}: { value: "open" | "closed" | "merged" | "all"; onChange: (v: "open" | "closed" | "merged" | "all") => void }) {
  const opts = ["open", "merged", "closed", "all"] as const;
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

function StateDot({ state }: { state: "open" | "closed" | "merged" }) {
  const bg =
    state === "open" ? "var(--phosphor)"
    : state === "merged" ? "var(--phosphor-2)"
    : "var(--muted)";
  return (
    <span title={state} style={{
      width: 10, height: 10, borderRadius: 999, display: "inline-block", background: bg,
    }} />
  );
}
