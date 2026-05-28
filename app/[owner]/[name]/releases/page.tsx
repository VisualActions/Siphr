"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import TopNav from "@/components/TopNav";

type Release = {
  id: string;
  tagName: string;
  name: string | null;
  body: string;
  targetOid: string;
  author: string;
  draft: boolean;
  prerelease: boolean;
  createdAt: string;
  publishedAt: string | null;
};

type RepoMin = { id: string; owner: string; name: string; defaultBranch: string };

export default function ReleasesPage({
  params,
}: { params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = use(params);
  const [repo, setRepo] = useState<RepoMin | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tagName, setTagName] = useState("");
  const [relName, setRelName] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh(repoId: string) {
    const r = await fetch(`/api/repos/${repoId}/releases`, { cache: "no-store" });
    const j = await r.json();
    setReleases(j.releases ?? []);
  }

  useEffect(() => {
    setCurrentUser(localStorage.getItem("siphr:current_user"));
    (async () => {
      const r = await fetch(`/api/repos/by-name/${owner}/${name}`);
      const j = await r.json();
      setRepo({ id: j.id, owner: j.owner, name: j.name, defaultBranch: j.defaultBranch });
      setTarget(j.defaultBranch ? `refs/heads/${j.defaultBranch}` : "");
      await refresh(j.id);
    })();
  }, [owner, name]);

  async function createRelease(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !repo) return;
    if (!tagName.trim() || !target.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/repos/${repo.id}/releases`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          author: currentUser,
          tagName: tagName.trim(),
          name: relName.trim() || null,
          body,
          target: target.trim(),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "create failed");
      setTagName(""); setRelName(""); setBody("");
      setShowNew(false);
      await refresh(repo.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(tag: string) {
    if (!currentUser || !repo) return;
    if (!confirm(`Delete release ${tag}?`)) return;
    try {
      const r = await fetch(
        `/api/repos/${repo.id}/releases/${encodeURIComponent(tag)}?actor=${encodeURIComponent(currentUser)}`,
        { method: "DELETE" }
      );
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "delete failed");
      }
      await refresh(repo.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "delete failed");
    }
  }

  if (!repo) {
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
          · releases
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.015em" }}>Releases</h1>
          {currentUser && (
            <button
              type="button"
              className="btn primary sm"
              onClick={() => setShowNew((v) => !v)}
            >{showNew ? "cancel" : "+ draft release"}</button>
          )}
        </div>

        {showNew && (
          <form onSubmit={createRelease} className="card" style={{ marginTop: 18, padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)" }}>TAG</label>
                <input
                  className="input mono"
                  style={{ marginTop: 6 }}
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="v0.1.0"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)" }}>TARGET REF or OID</label>
                <input
                  className="input mono"
                  style={{ marginTop: 6 }}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="refs/heads/main"
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)" }}>NAME (optional)</label>
              <input
                className="input"
                style={{ marginTop: 6 }}
                value={relName}
                onChange={(e) => setRelName(e.target.value)}
                placeholder="initial release"
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)" }}>RELEASE NOTES</label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="what's in this release"
                style={{
                  marginTop: 6, width: "100%",
                  border: "1px solid var(--line)", borderRadius: 2,
                  padding: "10px 14px", fontFamily: "var(--sans)", fontSize: 13.5,
                  background: "var(--panel)", resize: "vertical",
                }}
              />
            </div>
            {error && (
              <div style={{
                marginTop: 10, padding: "8px 10px",
                color: "var(--signal)", fontFamily: "var(--mono)", fontSize: 12,
                background: "color-mix(in oklab, var(--signal) 10%, transparent)", borderRadius: 2,
              }}>{error}</div>
            )}
            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn ghost sm" onClick={() => setShowNew(false)}>cancel</button>
              <button type="submit" className="btn primary sm" disabled={busy || !tagName.trim()}>
                {busy ? "publishing…" : "publish release"}
              </button>
            </div>
          </form>
        )}

        <ul style={{ listStyle: "none", padding: 0, marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {releases.length === 0 && (
            <li className="card" style={{
              padding: "32px 16px", textAlign: "center",
              fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)",
            }}>↳ no releases yet</li>
          )}
          {releases.map((rel) => (
            <li key={rel.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>
                    {rel.name || rel.tagName}
                  </h2>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span>tag {rel.tagName}</span>
                    <span>by {rel.author}</span>
                    <span>target {rel.targetOid.slice(0, 7)}</span>
                    <span>{new Date(rel.createdAt).toLocaleDateString()}</span>
                    {rel.prerelease && <span style={{ color: "var(--amber)" }}>pre-release</span>}
                    {rel.draft && <span style={{ color: "var(--muted)" }}>draft</span>}
                  </div>
                </div>
                {currentUser && (
                  <button
                    type="button"
                    className="btn ghost xs"
                    style={{ color: "var(--signal)" }}
                    onClick={() => remove(rel.tagName)}
                  >delete</button>
                )}
              </div>
              {rel.body && (
                <pre style={{
                  marginTop: 12, padding: "10px 12px",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.6,
                  background: "var(--panel-2)", borderRadius: 2,
                }}>{rel.body}</pre>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
