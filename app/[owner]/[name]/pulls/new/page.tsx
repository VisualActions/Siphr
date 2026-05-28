"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";

type RepoMin = {
  id: string;
  owner: string;
  name: string;
  defaultBranch: string;
};

type RefSummary = {
  name: string;
  oid: string;
  shortName: string;
};

export default function NewPullPage({
  params,
}: { params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = use(params);
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [repo, setRepo] = useState<RepoMin | null>(null);
  const [branches, setBranches] = useState<RefSummary[]>([]);
  const [baseRef, setBaseRef] = useState<string>("");
  const [headRef, setHeadRef] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(localStorage.getItem("siphr:current_user"));
    (async () => {
      const r = await fetch(`/api/repos/by-name/${owner}/${name}`);
      const repoJson = await r.json();
      setRepo({
        id: repoJson.id,
        owner: repoJson.owner,
        name: repoJson.name,
        defaultBranch: repoJson.defaultBranch,
      });
      const refsRes = await fetch(`/api/repos/${repoJson.id}/refs`);
      const refsJson = await refsRes.json();
      const heads = (refsJson.refs ?? [])
        .filter((rf: { name: string; oid: string | null }) =>
          rf.name.startsWith("refs/heads/") && rf.oid
        )
        .map((rf: { name: string; oid: string }) => ({
          name: rf.name,
          oid: rf.oid,
          shortName: rf.name.replace("refs/heads/", ""),
        }));
      setBranches(heads);
      setBaseRef(`refs/heads/${repoJson.defaultBranch}`);
    })();
  }, [owner, name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!currentUser) {
      setError("sign in to open a pull request");
      return;
    }
    if (!repo) return;
    if (!title.trim()) return;
    if (!baseRef || !headRef || baseRef === headRef) {
      setError("pick distinct head and base branches");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/repos/${repo.id}/pulls`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          author: currentUser,
          title: title.trim(),
          body,
          headRef,
          baseRef,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "create failed");
      router.push(`/${owner}/${name}/pulls/${j.pr.number}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
      setBusy(false);
    }
  }

  return (
    <>
      <TopNav />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "44px 6vw 80px" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          ↳{" "}
          <Link href={`/${owner}/${name}`} style={{ color: "var(--phosphor)" }}>
            {owner}/{name}
          </Link>{" "}
          · new pull request
        </div>
        <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.015em" }}>
          Open a pull request.
        </h1>

        {!currentUser && (
          <div className="card" style={{ marginTop: 22, padding: 14 }}>
            <Link href="/signin" style={{ color: "var(--phosphor)" }}>sign in</Link>{" "}
            to open one
          </div>
        )}

        {currentUser && (
          <form onSubmit={submit} style={{ marginTop: 26 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "end", marginBottom: 18 }}>
              <BranchSelect
                label="head (from)"
                value={headRef}
                onChange={setHeadRef}
                branches={branches}
              />
              <div style={{ paddingBottom: 8, fontFamily: "var(--mono)", color: "var(--muted)" }}>→</div>
              <BranchSelect
                label="base (into)"
                value={baseRef}
                onChange={setBaseRef}
                branches={branches}
              />
            </div>

            <input
              className="input"
              type="text"
              placeholder="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <textarea
              rows={6}
              placeholder="describe what's changing and why"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{
                marginTop: 10, width: "100%",
                border: "1px solid var(--line)", borderRadius: 2,
                padding: "10px 14px", fontFamily: "var(--sans)", fontSize: 13.5,
                background: "var(--panel)", resize: "vertical",
              }}
            />

            {error && (
              <div style={{
                marginTop: 12, padding: "8px 12px", borderRadius: 2,
                background: "color-mix(in oklab, var(--signal) 10%, transparent)",
                color: "var(--signal)", fontFamily: "var(--mono)", fontSize: 12,
              }}>{error}</div>
            )}

            <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Link href={`/${owner}/${name}?tab=pulls`} className="btn ghost">cancel</Link>
              <button
                type="submit"
                className="btn primary"
                disabled={busy || !title.trim() || !headRef || !baseRef}
              >{busy ? "opening…" : "open pull request"}</button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}

function BranchSelect({
  label, value, onChange, branches,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  branches: RefSummary[];
}) {
  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", height: 34, padding: "0 28px 0 10px",
          background: "var(--panel)", border: "1px solid var(--line)",
          borderRadius: 2, fontFamily: "var(--mono)", fontSize: 12,
        }}
      >
        <option value="">choose a branch…</option>
        {branches.map((b) => (
          <option key={b.name} value={b.name}>{b.shortName}</option>
        ))}
      </select>
    </div>
  );
}
