"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";

type Repo = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  createdAt: string;
};

export default function ExplorePage() {
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    fetch("/api/repos")
      .then((r) => r.json())
      .then((j) => setRepos(j.repos ?? []));
  }, []);

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-[1012px] px-4 py-8">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-semibold">Explore</h1>
          <p className="text-sm text-[color:var(--color-fg-muted)] mt-1">
            Public repositories. The repo key is published — anyone can decrypt the contents.
          </p>
        </div>
        <div className="box">
          {repos.length === 0 ? (
            <div className="box-row text-center text-[color:var(--color-fg-muted)] py-12">
              No public repositories yet. Be the first.
            </div>
          ) : (
            repos.map((r) => (
              <div key={r.id} className="box-row">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/${r.owner}/${r.name}`} className="font-semibold">
                    {r.owner}/{r.name}
                  </Link>
                  <span className="badge">public</span>
                </div>
                <div className="text-xs text-[color:var(--color-fg-muted)]">
                  Created {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
