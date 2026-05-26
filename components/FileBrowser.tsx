"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FingerprintSigil } from "./Primitives";

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
      <div style={{ padding: "12px 18px", fontSize: 13, color: "var(--rust)", fontFamily: "var(--mono)" }}>
        Could not load directory: {error}
      </div>
    );
  }
  if (!data) {
    return <div style={{ padding: "12px 18px", fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)" }}>loading tree…</div>;
  }

  const subject = data.commit.message.split("\n")[0];
  const authorName = data.commit.author?.name ?? owner;

  return (
    <>
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", gap: 12,
        background: "var(--paper-2)", fontSize: 13,
      }}>
        <FingerprintSigil seed={`commit ${data.commit.oid}`} size={22} />
        <strong>{authorName}</strong>
        <span style={{
          color: "var(--ink-2)", flex: 1, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{subject}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }} title={data.commit.oid}>
          {data.commit.oid.slice(0, 7)}
        </span>
        {data.commit.author?.when && (
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
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
          oid=""
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
          oid={e.oid}
        />
      ))}
    </>
  );
}

function Row({
  owner, name, branch, type, entryName, targetPath, oid,
}: {
  owner: string; name: string; branch: string;
  type: "tree" | "blob";
  entryName: string; targetPath: string; oid: string;
}) {
  const href =
    type === "tree"
      ? `/${owner}/${name}/tree/${branch}${targetPath ? "/" + targetPath : ""}`
      : `/${owner}/${name}/blob/${branch}/${targetPath}`;
  return (
    <Link
      href={href}
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 14, alignItems: "center",
        padding: "10px 14px",
        borderTop: "1px solid var(--line-2)",
        fontSize: 13, color: "var(--ink)",
      }}
    >
      <span style={{ color: type === "tree" ? "var(--copper)" : "var(--muted)", width: 16, textAlign: "center" }}>
        {entryName === ".." ? "↩" : type === "tree" ? "📁" : "·"}
      </span>
      <span style={{ fontWeight: type === "tree" ? 500 : 400 }}>{entryName}</span>
      {oid && (
        <span style={{
          fontFamily: "var(--mono)", fontSize: 10,
          color: "var(--muted-2)", letterSpacing: "0.03em",
        }}>
          oid {oid.slice(0, 7)}
        </span>
      )}
    </Link>
  );
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
