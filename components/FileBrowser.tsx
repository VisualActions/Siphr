"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Entry = {
  mode: string;
  name: string;
  oid: string;
  type: "tree" | "blob";
};

type TreeResponse = {
  ref: string;
  path: string;
  commit: {
    oid: string;
    message: string;
    author?: { name: string; email: string; when: number };
  };
  entries: Entry[];
};

export default function FileBrowser({
  owner,
  name,
  branch,
  path,
}: {
  owner: string;
  name: string;
  branch: string;
  path: string;
}) {
  const [data, setData] = useState<TreeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    const url = `/api/repos/by-name/${owner}/${name}/tree?ref=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error ?? `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((j) => setData(j))
      .catch((e) => setError(e.message));
  }, [owner, name, branch, path]);

  if (error) {
    return (
      <div className="box-row text-sm" style={{ color: "#cf222e" }}>
        Could not load directory: {error}
      </div>
    );
  }
  if (!data) {
    return <div className="box-row text-sm text-[color:var(--color-fg-muted)]">Loading…</div>;
  }

  const subject = data.commit.message.split("\n")[0];

  return (
    <>
      <div className="box-row flex items-center gap-3" style={{ background: "var(--color-canvas-subtle)" }}>
        <Avatar name={data.commit.author?.name ?? owner} />
        <span className="font-semibold text-sm">{data.commit.author?.name ?? owner}</span>
        <span className="text-sm text-[color:var(--color-fg-muted)] truncate flex-1">{subject}</span>
        <span className="text-xs font-mono text-[color:var(--color-fg-muted)]" title={data.commit.oid}>
          {data.commit.oid.slice(0, 7)}
        </span>
        {data.commit.author?.when && (
          <span className="text-xs text-[color:var(--color-fg-muted)]">
            {timeAgo(data.commit.author.when * 1000)}
          </span>
        )}
      </div>

      {path && (
        <Row
          owner={owner}
          name={name}
          branch={branch}
          type="tree"
          entryName=".."
          targetPath={parentPath(path)}
          icon="↩"
        />
      )}

      {data.entries.map((e) => (
        <Row
          key={e.oid + e.name}
          owner={owner}
          name={name}
          branch={branch}
          type={e.type}
          entryName={e.name}
          targetPath={path ? `${path}/${e.name}` : e.name}
          icon={e.type === "tree" ? "📁" : iconForFile(e.name)}
        />
      ))}
    </>
  );
}

function Row({
  owner,
  name,
  branch,
  type,
  entryName,
  targetPath,
  icon,
}: {
  owner: string;
  name: string;
  branch: string;
  type: "tree" | "blob";
  entryName: string;
  targetPath: string;
  icon: string;
}) {
  const href =
    type === "tree"
      ? `/${owner}/${name}/tree/${branch}${targetPath ? "/" + targetPath : ""}`
      : `/${owner}/${name}/blob/${branch}/${targetPath}`;
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 border-t border-[color:var(--color-border-muted)] hover:bg-[color:var(--color-canvas-subtle)] no-underline text-[color:var(--color-fg)]"
    >
      <span className="w-4 text-center" aria-hidden>{icon}</span>
      <span className="text-sm">{entryName}</span>
    </Link>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold"
      style={{ width: 24, height: 24, background: "#0969da", color: "#fff", fontSize: 12 }}
    >
      {(name[0] ?? "?").toUpperCase()}
    </span>
  );
}

function iconForFile(name: string): string {
  const n = name.toLowerCase();
  if (n === "readme.md") return "📖";
  if (n === "license" || n === "license.md") return "📜";
  if (n.endsWith(".md")) return "📝";
  if (n.endsWith(".json")) return "🧾";
  if (n.endsWith(".ts") || n.endsWith(".tsx") || n.endsWith(".js") || n.endsWith(".jsx")) return "📄";
  if (n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".svg") || n.endsWith(".gif")) return "🖼";
  if (n.startsWith(".")) return "⚙";
  return "📄";
}

function parentPath(p: string): string {
  const i = p.lastIndexOf("/");
  return i < 0 ? "" : p.slice(0, i);
}

function timeAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ms).toLocaleDateString();
}
