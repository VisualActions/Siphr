"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import VerifiedBadge from "@/components/VerifiedBadge";

type User = {
  username: string;
  publicKeyJwk: JsonWebKey;
  fingerprint: string;
  createdAt: string;
  verified?: boolean;
  verifiedAs?: string | null;
  verifiedKind?: "org" | "individual" | "bot" | null;
};

type Repo = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  createdAt: string;
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ owner: string }>;
}) {
  const { owner } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${owner}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((j) => j && setUser(j));
    fetch(`/api/repos?user=${encodeURIComponent(owner)}`)
      .then((r) => r.json())
      .then((j) => setRepos((j.repos ?? []).filter((r: Repo) => r.owner === owner)));
  }, [owner]);

  if (notFound) {
    return (
      <>
        <TopNav />
        <main className="mx-auto max-w-[1012px] px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-2">404</h1>
          <p className="text-[color:var(--color-fg-muted)]">No such user.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-[1280px] px-4 py-8 grid md:grid-cols-[296px_1fr] gap-8">
        <aside>
          <div
            className="rounded-full flex items-center justify-center font-bold mb-4"
            style={{ width: 260, height: 260, background: "#0969da", color: "#fff", fontSize: 100 }}
          >
            {owner[0]?.toUpperCase()}
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            {user?.verifiedAs || owner}
            <VerifiedBadge
              username={owner}
              verified={user?.verified}
              verifiedAs={user?.verifiedAs}
              verifiedKind={user?.verifiedKind}
              size={20}
            />
          </h1>
          <p className="text-lg text-[color:var(--color-fg-muted)]">@{owner}</p>
          {user && (
            <>
              <p className="text-sm text-[color:var(--color-fg-muted)] mt-4">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-6">
                <div className="text-xs text-[color:var(--color-fg-muted)] mb-1">Public key fingerprint</div>
                <div className="font-mono text-xs p-2 rounded" style={{ background: "var(--color-canvas-subtle)" }}>
                  {user.fingerprint}
                </div>
                <div className="text-xs text-[color:var(--color-fg-muted)] mt-2">
                  Verify this fingerprint out-of-band before adding {owner} as a collaborator on a private repo.
                </div>
              </div>
            </>
          )}
        </aside>

        <section>
          <h2 className="font-semibold mb-3">
            Repositories <span className="badge ml-1">{repos.length}</span>
          </h2>
          <div className="box">
            {repos.length === 0 ? (
              <div className="box-row text-sm text-[color:var(--color-fg-muted)]">
                No public repositories.
              </div>
            ) : (
              repos.map((r) => (
                <div key={r.id} className="box-row">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/${r.owner}/${r.name}`} className="font-semibold">
                      {r.name}
                    </Link>
                    <span className={`badge ${r.visibility === "private" ? "badge-private" : ""}`}>
                      {r.visibility}
                    </span>
                  </div>
                  <div className="text-xs text-[color:var(--color-fg-muted)]">
                    Updated {new Date(r.createdAt).toLocaleDateString()}
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
