"use client";

import { useState } from "react";

type DiffLine = {
  kind: " " | "+" | "-";
  baseLine: number | null;
  headLine: number | null;
  text: string;
};

type DiffHunk = {
  baseStart: number;
  baseCount: number;
  headStart: number;
  headCount: number;
  lines: DiffLine[];
};

type DiffResult =
  | { kind: "ok"; hunks: DiffHunk[] }
  | { kind: "binary" }
  | { kind: "too-large"; baseLines: number; headLines: number };

/**
 * One file in a PR diff. Renders a collapsible header showing status and
 * path; on first expand, lazy-fetches the inline diff and renders hunks.
 */
export default function DiffFile({
  repoId,
  prNumber,
  path,
  status,
  defaultOpen = false,
}: {
  repoId: string;
  prNumber: number;
  path: string;
  status: "added" | "removed" | "modified";
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureLoaded() {
    if (diff || loading) return;
    setLoading(true);
    setError(null);
    try {
      const encoded = path.split("/").map(encodeURIComponent).join("/");
      const r = await fetch(
        `/api/repos/${repoId}/pulls/${prNumber}/files/${encoded}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "diff load failed");
      setDiff(j.diff);
    } catch (e) {
      setError(e instanceof Error ? e.message : "diff load failed");
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) ensureLoaded();
  }

  return (
    <div style={{ borderBottom: "1px solid var(--line-2)" }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          width: "100%",
          textAlign: "left",
          display: "grid",
          gridTemplateColumns: "auto auto 1fr auto",
          gap: 10,
          alignItems: "center",
          padding: "10px 14px",
          background: "transparent",
          border: 0,
          cursor: "pointer",
          color: "var(--ink)",
        }}
      >
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
          {open ? "▾" : "▸"}
        </span>
        <StatusGlyph status={status} />
        <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, wordBreak: "break-all" }}>
          {path}
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)" }}>
          {status}
        </span>
      </button>

      {open && (
        <div style={{
          padding: "0 0 10px 0",
          borderTop: "1px solid var(--line-2)",
          background: "var(--panel-2)",
        }}>
          {loading && (
            <div style={{ padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              loading diff…
            </div>
          )}
          {error && (
            <div style={{ padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--signal)" }}>
              {error}
            </div>
          )}
          {diff && diff.kind === "binary" && (
            <div style={{ padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              ↳ binary file · no inline diff
            </div>
          )}
          {diff && diff.kind === "too-large" && (
            <div style={{ padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              ↳ file too large to diff inline ({diff.baseLines} ↔ {diff.headLines} lines)
            </div>
          )}
          {diff && diff.kind === "ok" && diff.hunks.length === 0 && (
            <div style={{ padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              ↳ files are identical
            </div>
          )}
          {diff && diff.kind === "ok" && diff.hunks.map((h, i) => (
            <Hunk key={i} hunk={h} />
          ))}
        </div>
      )}
    </div>
  );
}

function Hunk({ hunk }: { hunk: DiffHunk }) {
  const header = `@@ -${hunk.baseStart},${hunk.baseCount} +${hunk.headStart},${hunk.headCount} @@`;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{
        padding: "4px 14px",
        fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)",
        background: "color-mix(in oklab, var(--phosphor) 4%, transparent)",
      }}>{header}</div>
      <pre style={{
        margin: 0, padding: 0,
        fontFamily: "var(--mono)", fontSize: 11.5, lineHeight: 1.55,
        overflowX: "auto",
      }}>
        {hunk.lines.map((l, i) => (
          <DiffLineRow key={i} line={l} />
        ))}
      </pre>
    </div>
  );
}

function DiffLineRow({ line }: { line: DiffLine }) {
  const bg =
    line.kind === "+" ? "color-mix(in oklab, var(--phosphor) 12%, transparent)"
    : line.kind === "-" ? "color-mix(in oklab, var(--signal) 12%, transparent)"
    : "transparent";
  const fg =
    line.kind === "+" ? "var(--phosphor)"
    : line.kind === "-" ? "var(--signal)"
    : "var(--ink-2)";
  return (
    <span style={{
      display: "grid", gridTemplateColumns: "44px 44px 16px 1fr",
      gap: 0,
      background: bg, color: fg,
    }}>
      <span style={{ padding: "0 8px", textAlign: "right", color: "var(--muted)", fontSize: 10.5 }}>
        {line.baseLine ?? ""}
      </span>
      <span style={{ padding: "0 8px", textAlign: "right", color: "var(--muted)", fontSize: 10.5 }}>
        {line.headLine ?? ""}
      </span>
      <span style={{ textAlign: "center", color: "var(--muted)" }}>{line.kind}</span>
      <span style={{ whiteSpace: "pre", paddingRight: 12 }}>{line.text}</span>
    </span>
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
