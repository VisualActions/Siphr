"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { FingerprintSigil, Pill } from "@/components/Primitives";

type Repo = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  description: string | null;
  createdAt: string;
};

export default function ExplorePage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/repos")
      .then((r) => r.json())
      .then((j) => {
        setRepos((j.repos ?? []).filter((r: Repo) => r.visibility === "public"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <TopNav active="explore" />
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 6vw 80px" }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>↳ explore · public repositories</div>
        <h1 className="serif" style={{ fontSize: 56, letterSpacing: "-0.025em" }}>
          The public side of <em style={{ color: "var(--copper)" }}>Siphr.</em>
        </h1>
        <p style={{ marginTop: 16, fontSize: 16, color: "var(--ink-2)", maxWidth: 640 }}>
          These are the repositories people chose to host as plaintext. Same workflow as any forge, none of the
          surveillance.
        </p>

        <div style={{ marginTop: 36 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: "32px 22px", fontFamily: "var(--mono)", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
                loading…
              </div>
            ) : repos.length === 0 ? (
              <div style={{ padding: "48px 22px", textAlign: "center" }}>
                <p className="serif" style={{ fontSize: 22, marginBottom: 8 }}>
                  No public repositories yet. Be the first.
                </p>
                <Link href="/repos/new" className="btn copper" style={{ marginTop: 14 }}>create a public repo</Link>
              </div>
            ) : (
              repos.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    padding: "16px 22px",
                    borderBottom: i === repos.length - 1 ? "none" : "1px solid var(--line-2)",
                    display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center",
                  }}
                >
                  <FingerprintSigil seed={`${r.owner}/${r.name} ${r.id.slice(0, 6)}`} size={36} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Link href={`/${r.owner}/${r.name}`} style={{ fontSize: 15, fontWeight: 600 }}>
                        {r.owner}/{r.name}
                      </Link>
                      <Pill variant="public">public</Pill>
                    </div>
                    {r.description && (
                      <p style={{ marginTop: 4, fontSize: 13, color: "var(--ink-2)" }}>{r.description}</p>
                    )}
                    <div style={{ marginTop: 4, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                      ↳ created {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Link href={`/${r.owner}/${r.name}`} className="btn ghost sm">view →</Link>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
