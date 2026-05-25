"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";

type Repo = {
  id: string;
  name: string;
  owner: string;
  visibility: "private" | "public";
  createdAt: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<string | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("siphr:current_user");
    setUser(u);
    if (u) {
      fetch(`/api/repos?user=${encodeURIComponent(u)}`)
        .then((r) => r.json())
        .then((j) => setRepos(j.repos ?? []))
        .catch(() => {});
    }
  }, []);

  if (!user) {
    return (
      <>
        <TopNav />
        <main className="mx-auto max-w-[1012px] px-4 py-16">
          <p className="text-[color:var(--color-fg-muted)]">
            Not signed in. <Link href="/signin">Sign in</Link>.
          </p>
        </main>
      </>
    );
  }

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-[1280px] grid md:grid-cols-[296px_1fr] gap-6 px-4 py-6">
        <aside>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Top repositories</h2>
            <Link href="/repos/new" className="btn btn-sm btn-primary">
              <span className="text-[14px] leading-none">+</span> New
            </Link>
          </div>
          <input
            placeholder="Find a repository…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input mb-3"
            style={{ height: 32 }}
          />
          {filtered.length === 0 ? (
            <div className="text-sm text-[color:var(--color-fg-muted)] py-2">
              {repos.length === 0 ? "No repositories yet." : "No matches."}
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-sm">
                  <Avatar name={r.owner} size={20} />
                  <Link href={`/${r.owner}/${r.name}`} className="truncate">
                    {r.owner}/{r.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <h2 className="text-sm font-semibold mb-3">Recent activity</h2>
            <div className="text-sm text-[color:var(--color-fg-muted)]">
              Activity feeds are E2EE and only visible to repo collaborators.
            </div>
          </div>
        </aside>

        <section>
          <div className="box mb-4">
            <div className="box-row">
              <h1 className="text-lg font-semibold mb-1">Home</h1>
              <p className="text-sm text-[color:var(--color-fg-muted)]">
                Welcome back, <strong>{user}</strong>. Your keys are loaded in this browser. Public activity from accounts you follow shows up here.
              </p>
            </div>
            <div className="box-row" style={{ background: "var(--color-canvas-subtle)" }}>
              <div className="flex gap-3 items-start">
                <div className="text-2xl" aria-hidden>🔒</div>
                <div>
                  <div className="font-semibold mb-1">Your code stays yours</div>
                  <p className="text-sm text-[color:var(--color-fg-muted)]">
                    Every push from this browser is encrypted with your repo key before it leaves. The server stores ciphertext — there is no admin "view-as" mode because there is no plaintext to view.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="box">
            <div className="box-row flex items-center justify-between">
              <h2 className="font-semibold">Your repositories</h2>
              <Link href="/repos/new" className="btn btn-sm">New repository</Link>
            </div>
            {repos.length === 0 ? (
              <div className="box-row text-center text-[color:var(--color-fg-muted)] py-12">
                <p className="mb-3">You don't have any repositories yet.</p>
                <Link href="/repos/new" className="btn btn-primary">Create your first repository</Link>
              </div>
            ) : (
              repos.map((r) => (
                <div key={r.id} className="box-row">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/${r.owner}/${r.name}`} className="font-semibold">
                      {r.owner}/{r.name}
                    </Link>
                    <span className={`badge ${r.visibility === "private" ? "badge-private" : ""}`}>
                      {r.visibility}
                    </span>
                  </div>
                  <div className="text-xs text-[color:var(--color-fg-muted)] flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <LockSm /> end-to-end encrypted
                    </span>
                    <span>updated {timeAgo(r.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        background: "#0969da",
        color: "#fff",
        fontSize: Math.round(size * 0.5),
      }}
    >
      {name[0]?.toUpperCase()}
    </span>
  );
}

function LockSm() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 4a4 4 0 1 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm6.5 2V4a2.5 2.5 0 0 0-5 0v2Z" />
    </svg>
  );
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
