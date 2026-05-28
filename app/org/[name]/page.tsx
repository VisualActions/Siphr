"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import TopNav from "@/components/TopNav";
import { FingerprintSigil } from "@/components/Primitives";

type Org = {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  createdAt: string;
};

type Member = {
  orgId: string;
  username: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
};

type RepoSummary = {
  id: string;
  name: string;
  visibility: "public" | "private";
  description: string | null;
  createdAt: string;
};

export default function OrgPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const [data, setData] = useState<{ org: Org; members: Member[]; repos: RepoSummary[] } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const [newMember, setNewMember] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(localStorage.getItem("siphr:current_user"));
    fetch(`/api/orgs/${encodeURIComponent(name)}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((j) => j && setData(j));
  }, [name]);

  const myRole = data?.members.find((m) => m.username === currentUser)?.role;
  const canManage = myRole === "owner" || myRole === "admin";

  async function refresh() {
    const r = await fetch(`/api/orgs/${encodeURIComponent(name)}`);
    const j = await r.json();
    setData(j);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMember.trim() || !currentUser) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/orgs/${encodeURIComponent(name)}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor: currentUser,
          username: newMember.trim(),
          role: newMemberRole,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "add failed");
      setNewMember("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "add failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(username: string) {
    if (!currentUser) return;
    if (!confirm(`Remove ${username} from ${name}?`)) return;
    try {
      const r = await fetch(
        `/api/orgs/${encodeURIComponent(name)}/members?actor=${encodeURIComponent(currentUser)}&username=${encodeURIComponent(username)}`,
        { method: "DELETE" }
      );
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "remove failed");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "remove failed");
    }
  }

  if (notFound) {
    return (
      <>
        <TopNav />
        <main style={{ maxWidth: 1012, margin: "0 auto", padding: "64px 6vw", textAlign: "center" }}>
          <h1 className="serif" style={{ fontSize: 80, color: "var(--copper)" }}>404</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>org not found</p>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <TopNav />
        <main style={{ maxWidth: 1012, margin: "0 auto", padding: "64px 6vw", fontFamily: "var(--mono)", color: "var(--muted)" }}>
          loading…
        </main>
      </>
    );
  }

  const { org, members, repos } = data;

  return (
    <>
      <TopNav />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "44px 6vw 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <FingerprintSigil seed={`org/${org.name}`} size={48} />
          <div>
            <div className="eyebrow">↳ /org/{org.name}</div>
            <h1 className="serif" style={{ fontSize: 36, letterSpacing: "-0.015em" }}>
              {org.displayName || org.name}
            </h1>
            {org.description && (
              <p style={{ marginTop: 4, fontSize: 14, color: "var(--ink-2)" }}>
                {org.description}
              </p>
            )}
          </div>
        </div>

        <div style={{
          marginTop: 36, display: "grid",
          gridTemplateColumns: "1fr 360px", gap: 32,
        }}>
          {/* Repos */}
          <section>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 14,
            }}>
              <h2 style={{ fontSize: 18, letterSpacing: "-0.01em" }}>
                Repositories <span style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 13 }}>· {repos.length}</span>
              </h2>
              {canManage && (
                <Link
                  href={`/repos/new?owner=${encodeURIComponent(org.name)}`}
                  className="btn ghost sm"
                >
                  + new repo
                </Link>
              )}
            </div>
            {repos.length === 0 ? (
              <div className="card" style={{
                padding: "24px 16px",
                fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)",
                textAlign: "center",
              }}>
                ↳ no repos yet
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {repos.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/${org.name}/${r.name}`}
                      className="card"
                      style={{
                        display: "block", padding: "14px 16px",
                        textDecoration: "none", color: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</span>
                        <span className="pill" style={{ fontSize: 10 }}>
                          {r.visibility}
                        </span>
                      </div>
                      {r.description && (
                        <p style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink-2)" }}>
                          {r.description}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Members */}
          <aside>
            <h2 style={{ fontSize: 18, letterSpacing: "-0.01em", marginBottom: 14 }}>
              Members <span style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 13 }}>· {members.length}</span>
            </h2>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {members.map((m) => (
                <div
                  key={m.username}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 10, alignItems: "center",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--line-2)",
                  }}
                >
                  <FingerprintSigil seed={`${m.username}@siphr`} size={24} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.username}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)" }}>
                      {m.role}
                    </div>
                  </div>
                  {canManage && m.username !== currentUser && (
                    <button
                      type="button"
                      className="btn ghost xs"
                      onClick={() => removeMember(m.username)}
                      style={{ color: "var(--signal)" }}
                    >
                      remove
                    </button>
                  )}
                </div>
              ))}

              {canManage && (
                <form onSubmit={addMember} style={{
                  padding: "12px 14px",
                  display: "grid", gridTemplateColumns: "1fr 100px auto", gap: 6,
                  background: "var(--panel-2)",
                }}>
                  <input
                    className="input"
                    type="text"
                    placeholder="username"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as "admin" | "member")}
                    style={{
                      height: 34, padding: "0 22px 0 8px",
                      background: "var(--panel)", border: "1px solid var(--line)",
                      borderRadius: 2, fontFamily: "var(--mono)", fontSize: 11,
                    }}
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                  <button
                    type="submit"
                    className="btn primary sm"
                    disabled={busy || !newMember.trim()}
                  >{busy ? "…" : "add"}</button>
                </form>
              )}

              {error && (
                <div style={{
                  padding: "8px 14px",
                  color: "var(--signal)", fontFamily: "var(--mono)", fontSize: 11,
                  background: "color-mix(in oklab, var(--signal) 10%, transparent)",
                }}>{error}</div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
