"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FingerprintSigil,
  Pill,
  LockGlyph,
} from "@/components/Primitives";
import {
  repoKeyFromSession,
  siphrCommit,
  type FileEntry,
} from "@/lib/browser-git";

type Repo = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  defaultBranch: string;
};

const SKIP_DIRS = new Set([".git", "node_modules", ".next", "dist", "build", ".vercel"]);
const SKIP_FILES = new Set([".DS_Store", ".env", ".env.local", ".env.production"]);

export default function QuickSetup({
  repo,
  authorName,
  onCommitted,
}: {
  repo: Repo;
  authorName: string;
  onCommitted: () => void;
}) {
  const [active, setActive] = useState<"none" | "editor" | "drop">("none");
  const [progress, setProgress] = useState<string | null>(null);
  const cloneUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${repo.owner}/${repo.name}.git`
    : `https://siphr.dev/${repo.owner}/${repo.name}.git`;

  async function doCommit(files: FileEntry[], message: string) {
    setProgress("encrypting & uploading…");
    try {
      const repoKey =
        repo.visibility === "private" ? repoKeyFromSession(repo.id) : null;
      if (repo.visibility === "private" && !repoKey) {
        throw new Error("This tab doesn't hold the repo key — sign back in to refresh.");
      }
      const result = await siphrCommit({
        repoId: repo.id,
        branch: repo.defaultBranch,
        files,
        message,
        author: { name: authorName, email: `${authorName}@siphr.dev` },
        visibility: repo.visibility,
        repoKey,
      });
      setProgress(
        `✓ ${result.oid.slice(0, 7)} · uploaded ${result.upload.uploaded} obj · ${(result.upload.bytes / 1024).toFixed(1)} KB`
      );
      setTimeout(() => {
        onCommitted();
      }, 600);
    } catch (e) {
      setProgress(`✗ ${e instanceof Error ? e.message : "commit failed"}`);
    }
  }

  return (
    <>
      {/* Welcome */}
      <div className="card" style={{
        padding: "22px 24px", marginBottom: 22,
        borderLeft: "3px solid var(--copper)",
      }}>
        <div className="eyebrow" style={{ marginBottom: 6, color: "var(--copper)" }}>
          ↳ your repo is ready · {repo.visibility === "private" ? "repo key generated locally" : "plaintext storage"}
        </div>
        <h2 className="serif" style={{ fontSize: 30, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Quick setup.
        </h2>
        <p style={{
          marginTop: 8, fontSize: 14, color: "var(--ink-2)",
          lineHeight: 1.55, maxWidth: 740,
        }}>
          {repo.visibility === "private" ? (
            <>
              An AES-256 key for this repo lives only in this browser tab. It&apos;s wrapped to your public key.
              For private repos, encryption has to happen in a client that holds the key — which today means{" "}
              <strong>this browser</strong>.
            </>
          ) : (
            <>
              This is a public repository. Plain <code>git push</code> works over HTTPS. The in-browser editor
              below also works if you don&apos;t want to leave the page.
            </>
          )}
        </p>
        <div style={{
          marginTop: 14, padding: "10px 14px",
          background: "var(--paper-2)", borderRadius: 5,
          fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-2)",
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10,
        }}>
          <span>↳ clone URL ·</span>
          <code style={{ color: "var(--copper)" }}>{cloneUrl}</code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(cloneUrl).catch(() => {})}
            className="btn ghost xs"
          >⎘ copy</button>
          <span style={{ marginLeft: "auto", color: "var(--muted)" }}>· https only · no ssh</span>
        </div>
      </div>

      {/* PATH 1 — in-browser editor */}
      <PathBlock
        n="01"
        title="Add files in the browser"
        sub="encryption happens on this tab · zero plaintext leaves your machine"
        badge={{ text: "available now", tone: "moss" }}
      >
        {active === "editor" ? (
          <InlineEditor
            onCancel={() => setActive("none")}
            onCommit={async ({ filename, content, message }) => {
              await doCommit(
                [{ path: filename, content }],
                message
              );
              setActive("none");
            }}
            initialFile={
              repo.visibility === "private"
                ? "README.md"
                : "README.md"
            }
            initialContent={`# ${repo.owner}/${repo.name}\n\nFresh repository on Siphr.\n`}
          />
        ) : (
          <>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <StepRow
                icon="+"
                label="Create a new file"
                hint="open the in-page editor · everything you type stays in this tab until you commit"
                onClick={() => setActive("editor")}
              />
              <StepRow
                icon="↑"
                label="Upload files"
                hint="pick files from your filesystem · encrypted before the first byte leaves"
                onClick={() => setActive("drop")}
              />
              <StepRow
                icon="✎"
                label="Edit existing files inline"
                hint="available once you have at least one commit"
                disabled
              />
              <StepRow
                icon="⌥"
                label="Commit (with a message)"
                hint={repo.visibility === "private"
                  ? "the message itself is encrypted with the repo key before upload"
                  : "stored as plaintext, like any forge"}
                disabled
                last
              />
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button className="btn copper sm" onClick={() => setActive("editor")}>+ Create your first file</button>
              <button className="btn ghost sm" onClick={() => setActive("drop")}>↑ Upload files</button>
            </div>
          </>
        )}
        {progress && (
          <div style={{
            marginTop: 12, padding: "8px 12px", borderRadius: 5,
            background: progress.startsWith("✗")
              ? "rgba(138,42,31,0.08)"
              : progress.startsWith("✓")
              ? "var(--moss-bg)"
              : "var(--paper-2)",
            color: progress.startsWith("✗")
              ? "var(--rust)"
              : progress.startsWith("✓")
              ? "var(--moss)"
              : "var(--ink-2)",
            fontFamily: "var(--mono)", fontSize: 12,
          }}>
            {progress}
          </div>
        )}
      </PathBlock>

      {/* PATH 2 — drop a local folder */}
      <PathBlock
        n="02"
        title="Drop a local folder onto this page"
        sub="we scan it, encrypt each file, then commit as a single first commit"
        badge={{ text: "available now", tone: "moss" }}
      >
        <DropZone
          onFiles={async (files) => {
            if (!files.length) return;
            await doCommit(files, "Initial commit · folder drop");
          }}
        />
        <ul style={{
          listStyle: "none", padding: 0, margin: "14px 0 0",
          fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7,
        }}>
          <li>· every file is encrypted in this tab with the repo key before the first byte leaves</li>
          <li>· dotfiles (.git, .env, .DS_Store, node_modules/) are skipped by default</li>
          <li>· counts as a fresh first commit · push existing history is a v0.4 task</li>
        </ul>
      </PathBlock>

      {/* PATH 3 — plain git push for public */}
      <PathBlock
        n="03"
        title={repo.visibility === "public"
          ? "…or push from the terminal"
          : "…or push from the terminal — public repos only"}
        sub={repo.visibility === "public"
          ? "plain `git push` over HTTPS works for public repos"
          : "plain `git push` over HTTPS works · but it sends plaintext, so this path is disabled for private repos"}
        badge={{
          text: repo.visibility === "public" ? "available now" : "available now · public repos only",
          tone: repo.visibility === "public" ? "moss" : "amber",
        }}
      >
        <Term
          lines={[
            { cmd: "git remote add origin " + cloneUrl },
            { cmd: "git branch -M " + repo.defaultBranch },
            { cmd: "git push -u origin " + repo.defaultBranch, annot: repo.visibility === "private"
              ? "← rejected for private repos (403)"
              : "← uploads plaintext objects" },
          ]}
        />
        {repo.visibility === "private" && (
          <Caveat>
            <strong>This repo is private (e2ee), so plain <code>git push</code> will be rejected</strong> at
            the server with <code>403 — encrypted-only-endpoint</code>. The server has no way to encrypt the
            pack for you without your key, and we won&apos;t accept plaintext at rest.
            Use path 01, 02, or — when ready — 04.
          </Caveat>
        )}
      </PathBlock>

      {/* PATH 4 — native helper, PLANNED */}
      <PathBlock
        n="04"
        title="Push from the terminal for private repos"
        sub="a small native helper that does what the browser does today · planned"
        badge={{ text: "planned · v0.4 — v0.5", tone: "copper" }}
      >
        <Term
          lines={[
            { comment: "future · siphr-helper signs each pack with your wrapped key" },
            { cmd: "git push origin " + repo.defaultBranch, annot: "← interceptor encrypts before the network layer" },
          ]}
        />
        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: "var(--paper-2)", borderRadius: 5,
          fontSize: 13, color: "var(--ink-2)",
        }}>
          <span style={{
            fontFamily: "var(--mono)", fontSize: 10,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--copper)", marginRight: 10,
          }}>roadmap</span>
          SSH is <em>not</em> planned — keys live in the browser, not <code>~/.ssh</code>. The terminal
          experience we&apos;d ship is a tiny encryption helper, not a new transport. See the{" "}
          <Link href="/roadmap" style={{ color: "var(--copper)" }}>roadmap →</Link>
        </div>
      </PathBlock>

      {/* Pro tip */}
      {repo.visibility === "private" && (
        <div className="card" style={{
          marginTop: 22, padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 14,
          background: "var(--paper-2)",
        }}>
          <span style={{
            fontFamily: "var(--mono)", fontSize: 11, color: "var(--copper)",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>↳ pro tip</span>
          <span style={{ fontSize: 13, color: "var(--ink-2)" }}>
            Until path 04 ships, the recommended flow for private repos is the in-browser editor (path 01) or
            the drag-and-drop folder (path 02). Both are real today and produce real encrypted commits.
          </span>
        </div>
      )}
    </>
  );
}

// ============================================================
// Sub-components
// ============================================================

function InlineEditor({
  initialFile,
  initialContent,
  onCommit,
  onCancel,
}: {
  initialFile: string;
  initialContent: string;
  onCommit: (v: { filename: string; content: string; message: string }) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [filename, setFilename] = useState(initialFile);
  const [content, setContent] = useState(initialContent);
  const [message, setMessage] = useState("Initial commit");
  const [busy, setBusy] = useState(false);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid var(--line)",
        background: "var(--paper-2)", display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          fontFamily: "var(--mono)", fontSize: 11,
          letterSpacing: "0.08em", color: "var(--muted)",
          textTransform: "uppercase",
        }}>↳ in-browser editor</span>
        <input
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          spellCheck={false}
          style={{
            marginLeft: "auto", maxWidth: 260,
            background: "#fffdf7", border: "1px solid var(--line)",
            borderRadius: 4, padding: "4px 10px",
            fontFamily: "var(--mono)", fontSize: 12,
          }}
        />
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
        rows={16}
        style={{
          width: "100%", border: 0, padding: "12px 14px",
          fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.5,
          background: "#fffdf7", resize: "vertical",
          outline: "none",
        }}
      />
      <div style={{
        padding: "12px 14px", borderTop: "1px solid var(--line)",
        background: "var(--paper-2)",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="commit message"
          style={{
            flex: 1, minWidth: 200,
            background: "#fffdf7", border: "1px solid var(--line)",
            borderRadius: 4, padding: "6px 10px",
            fontFamily: "var(--mono)", fontSize: 12,
          }}
        />
        <button
          type="button"
          className="btn ghost sm"
          onClick={onCancel}
          disabled={busy}
        >cancel</button>
        <button
          type="button"
          className="btn copper sm"
          disabled={busy || !filename || !message || !content}
          onClick={async () => {
            setBusy(true);
            try { await onCommit({ filename, content, message }); }
            finally { setBusy(false); }
          }}
        >
          {busy ? "committing…" : "commit"}
        </button>
      </div>
    </div>
  );
}

function DropZone({
  onFiles,
}: {
  onFiles: (files: FileEntry[]) => void | Promise<void>;
}) {
  const [over, setOver] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirInput = useRef<HTMLInputElement>(null);

  async function handleEvent(items: DataTransferItemList | null, files: FileList | null) {
    setScanning(true);
    try {
      const collected: FileEntry[] = [];
      if (items) {
        for (const item of Array.from(items)) {
          const entry =
            ("webkitGetAsEntry" in item ? item.webkitGetAsEntry() : null) as
              | FileSystemEntry
              | null;
          if (entry) await walkEntry(entry, "", collected);
        }
      } else if (files) {
        for (const f of Array.from(files)) {
          if (SKIP_FILES.has(f.name)) continue;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rel = ((f as any).webkitRelativePath as string) || f.name;
          if (rel.split("/").some((p) => SKIP_DIRS.has(p))) continue;
          collected.push({ path: rel, content: new Uint8Array(await f.arrayBuffer()) });
        }
      }
      await onFiles(collected);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setOver(false);
        await handleEvent(e.dataTransfer.items ?? null, e.dataTransfer.files ?? null);
      }}
      style={{
        border: `2px dashed ${over ? "var(--copper)" : "var(--line)"}`,
        borderRadius: 6, padding: "28px 24px",
        display: "flex", alignItems: "center", gap: 20,
        background: over ? "var(--copper-bg)" : "var(--paper-2)",
        transition: "background 0.12s",
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 6,
        background: "var(--copper-bg)", color: "var(--copper)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--mono)", fontSize: 28,
      }}>↓</div>
      <div>
        <div className="serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>
          {scanning ? "scanning files…" : "Drop a folder anywhere."}
        </div>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 11.5,
          color: "var(--muted)", marginTop: 4,
        }}>
          ↳ chrome / firefox / safari · everything stays in this tab
        </div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => dirInput.current?.click()}
        >Pick a folder</button>
        <button
          type="button"
          className="btn sm"
          onClick={() => fileInput.current?.click()}
        >Pick files</button>
        <input
          ref={dirInput}
          type="file"
          multiple
          style={{ display: "none" }}
          // @ts-expect-error — webkitdirectory is non-standard but widely supported
          webkitdirectory=""
          onChange={(e) => handleEvent(null, e.target.files)}
        />
        <input
          ref={fileInput}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleEvent(null, e.target.files)}
        />
      </div>
    </div>
  );
}

async function walkEntry(
  entry: FileSystemEntry,
  prefix: string,
  out: FileEntry[]
): Promise<void> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    if (SKIP_FILES.has(fileEntry.name)) return;
    const file = await new Promise<File>((res, rej) =>
      fileEntry.file(res, rej)
    );
    const path = prefix + fileEntry.name;
    out.push({ path, content: new Uint8Array(await file.arrayBuffer()) });
    return;
  }
  if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    if (SKIP_DIRS.has(dirEntry.name)) return;
    const reader = dirEntry.createReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const readAll = (): Promise<any[]> => new Promise((res, rej) => {
      const all: FileSystemEntry[] = [];
      function step() {
        reader.readEntries((batch) => {
          if (!batch.length) return res(all);
          all.push(...batch);
          step();
        }, rej);
      }
      step();
    });
    const entries = await readAll();
    for (const child of entries) {
      await walkEntry(child, prefix + dirEntry.name + "/", out);
    }
  }
}

function StepRow({
  icon, label, hint, onClick, disabled, last,
}: {
  icon: string; label: string; hint: string;
  onClick?: () => void; disabled?: boolean; last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", textAlign: "left",
        display: "grid", gridTemplateColumns: "44px 1fr auto",
        gap: 14, alignItems: "center",
        padding: "14px 18px",
        borderBottom: last ? "none" : "1px solid var(--line-2)",
        background: "transparent", color: "var(--ink)",
        border: 0, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span style={{
        width: 32, height: 32, borderRadius: 5,
        background: "var(--copper-bg)", color: "var(--copper)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600,
      }}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{hint}</div>
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
        {disabled ? "—" : "go →"}
      </span>
    </button>
  );
}

function PathBlock({
  n, title, sub, badge, children,
}: {
  n: string; title: string; sub: string;
  badge?: { text: string; tone: "moss" | "amber" | "copper" | "rust" };
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 12,
        marginBottom: 4, flexWrap: "wrap",
      }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--copper)", letterSpacing: "0.08em" }}>{n}</span>
        <h3 className="serif" style={{ fontSize: 22, letterSpacing: "-0.015em" }}>{title}</h3>
        {badge && <PathBadge {...badge} />}
      </div>
      <p style={{
        fontFamily: "var(--mono)", fontSize: 11,
        color: "var(--muted)", marginBottom: 12,
      }}>{sub}</p>
      {children}
    </div>
  );
}

function PathBadge({
  text, tone,
}: { text: string; tone: "moss" | "amber" | "copper" | "rust" }) {
  const map: Record<string, { bg: string; fg: string }> = {
    moss: { bg: "var(--moss-bg)", fg: "var(--moss)" },
    amber: { bg: "var(--amber-bg)", fg: "#7a5a16" },
    copper: { bg: "var(--copper-bg)", fg: "var(--copper)" },
    rust: { bg: "#f4d9d4", fg: "var(--rust)" },
  };
  const { bg, fg } = map[tone] ?? { bg: "var(--paper-2)", fg: "var(--muted)" };
  return (
    <span style={{
      fontFamily: "var(--mono)", fontSize: 10,
      letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 3,
      background: bg, color: fg,
    }}>{text}</span>
  );
}

function Term({
  lines,
}: { lines: ({ cmd?: string; annot?: string; comment?: string })[] }) {
  const text = lines
    .map((l) => l.comment ? `# ${l.comment}` : l.cmd!)
    .join("\n");
  return (
    <div style={{
      background: "#0f0d0a", color: "#e8d9b8",
      border: "1px solid #2a2520", borderRadius: 6,
      padding: "14px 16px",
      fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.7,
      position: "relative",
    }}>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(text).catch(() => {})}
        style={{
          position: "absolute", top: 8, right: 10,
          background: "transparent", color: "#a08762",
          border: "1px solid #2a2520", borderRadius: 4,
          padding: "2px 8px", fontFamily: "var(--mono)", fontSize: 10,
          cursor: "pointer",
        }}
      >⎘ copy</button>
      {lines.map((l, i) => {
        if (l.comment) {
          return <div key={i} style={{ color: "#806c4a" }}># {l.comment}</div>;
        }
        return (
          <div key={i}>
            <span style={{ color: "#806c4a", marginRight: 8 }}>$</span>
            <span>{l.cmd}</span>
            {l.annot && (
              <span style={{ color: "#806c4a", marginLeft: 14 }}># {l.annot}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Caveat({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 12, padding: "10px 14px",
      background: "var(--copper-bg)", borderRadius: 5,
      fontSize: 12.5, color: "#5c2a17", lineHeight: 1.55,
    }}>
      <span style={{
        fontFamily: "var(--mono)", fontSize: 10,
        letterSpacing: "0.1em", textTransform: "uppercase",
        marginRight: 8, fontWeight: 600,
      }}>! heads up</span>
      {children}
    </div>
  );
}

// Re-export so the parent page can show the pill chips in the same vocab.
export { LockGlyph, Pill, FingerprintSigil };
