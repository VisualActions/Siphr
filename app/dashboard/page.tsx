"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      <main className="mx-auto max-w-2xl px-6 py-24">
        <p className="text-[color:var(--color-muted)]">
          Not signed in. <Link href="/signin" className="underline">Sign in</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex items-center justify-between mb-12">
        <div>
          <div className="text-xs text-[color:var(--color-muted)] font-mono">signed in as</div>
          <div className="text-xl font-medium">{user}</div>
        </div>
        <Link
          href="/repos/new"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          + new repo
        </Link>
      </header>

      <section>
        <h2 className="text-sm font-medium text-[color:var(--color-muted)] uppercase tracking-wider mb-4">
          your repos
        </h2>
        {repos.length === 0 ? (
          <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)] p-8 text-center text-sm text-[color:var(--color-muted)]">
            no repos yet. create one to get started.
          </div>
        ) : (
          <ul className="space-y-2">
            {repos.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/r/${r.owner}/${r.name}`}
                  className="block rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)] p-4 hover:border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm">
                      {r.owner}/{r.name}
                    </div>
                    <div className="text-xs text-[color:var(--color-muted)] font-mono">
                      {r.visibility}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
