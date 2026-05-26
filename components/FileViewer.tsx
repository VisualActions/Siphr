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
      <div className="box-row text-sm" style={{ color: "#cf222e" }}>
        Could not load file: {error}
      </div>
    );
  }
  if (!data) {
    return <div className="box-row text-sm text-[color:var(--color-fg-muted)]">Loading…</div>;
  }

  const lines = data.content?.split("\n") ?? [];

  return (
    <div className="box">
      <div
        className="box-row flex items-center justify-between gap-3"
        style={{ background: "var(--color-canvas-subtle)" }}
      >
        <div className="text-sm text-[color:var(--color-fg-muted)]">
          {lines.length} {lines.length === 1 ? "line" : "lines"}
          <span className="mx-2">·</span>
          {(data.size / 1024).toFixed(1)} KB
          {data.language && (
            <>
              <span className="mx-2">·</span>
              <span className="font-mono">{data.language}</span>
            </>
          )}
        </div>
        <a
          href={`/api/repos/by-name/${owner}/${name}/blob?ref=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}`}
          className="text-xs"
          target="_blank"
          rel="noreferrer"
        >
          Raw
        </a>
      </div>
      {data.binary ? (
        <div className="box-row text-sm text-[color:var(--color-fg-muted)]">
          Binary file — {data.size} bytes. Use raw download.
        </div>
      ) : (
        <pre
          className="overflow-auto text-xs leading-5 font-mono"
          style={{ margin: 0 }}
        >
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i}>
                  <td
                    className="select-none text-[color:var(--color-fg-subtle)] text-right pr-4 pl-3"
                    style={{
                      borderRight: "1px solid var(--color-border-muted)",
                      width: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {i + 1}
                  </td>
                  <td className="pl-3 pr-3" style={{ whiteSpace: "pre" }}>
                    {line || " "}
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
