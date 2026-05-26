"use client";

import { useEffect, useState } from "react";

type BlobResponse = {
  ref: string;
  path: string;
  oid: string;
  size: number;
  binary: boolean;
  language: string;
  content?: string;
};

export default function FileViewer({
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
  const [data, setData] = useState<BlobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `/api/repos/by-name/${owner}/${name}/blob?ref=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error ?? `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((j: BlobResponse) => setData(j))
      .catch((e: Error) => setError(e.message));
  }, [owner, name, branch, path]);

  if (error) {
    return (
      <div style={{ padding: "12px 18px", fontSize: 13, color: "var(--rust)", fontFamily: "var(--mono)" }}>
        Could not load file: {error}
      </div>
    );
  }
  if (!data) {
    return <div style={{ padding: "12px 18px", fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)" }}>loading…</div>;
  }

  const lines = data.content?.split("\n") ?? [];

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "10px 14px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        gap: 12, background: "var(--paper-2)",
        borderBottom: "1px solid var(--line)",
        fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)",
      }}>
        <div>
          {lines.length} {lines.length === 1 ? "line" : "lines"}
          <span style={{ margin: "0 8px" }}>·</span>
          {(data.size / 1024).toFixed(1)} KB
          {data.language && (
            <>
              <span style={{ margin: "0 8px" }}>·</span>
              <span>{data.language}</span>
            </>
          )}
        </div>
        <a
          href={`/api/repos/by-name/${owner}/${name}/blob?ref=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}`}
          style={{ color: "var(--copper)" }}
          target="_blank"
          rel="noreferrer"
        >
          raw ↗
        </a>
      </div>
      {data.binary ? (
        <div style={{ padding: "20px 18px", fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)" }}>
          binary file — {data.size} bytes. use raw download.
        </div>
      ) : (
        <pre style={{ overflow: "auto", margin: 0, fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.55 }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i}>
                  <td
                    style={{
                      userSelect: "none",
                      color: "var(--muted-2)",
                      textAlign: "right",
                      padding: "0 12px 0 14px",
                      borderRight: "1px solid var(--line-2)",
                      width: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {i + 1}
                  </td>
                  <td style={{ padding: "0 14px", whiteSpace: "pre", color: "var(--ink)" }}>
                    {line || " "}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </pre>
      )}
    </div>
  );
}
