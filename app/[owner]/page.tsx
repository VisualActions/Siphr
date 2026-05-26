"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import VerifiedBadge from "@/components/VerifiedBadge";
import { FingerprintSigil, Pill } from "@/components/Primitives";

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
        <main style={{ maxWidth: 1012, margin: "0 auto", padding: "64px 6vw", textAlign: "center" }}>
          <h1 className="serif" style={{ fontSize: 80, color: "var(--copper)" }}>404</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>no such user.</p>
        </main>
      </>
    );
  }

  const seed = user ? `${owner}@siphr ${user.fingerprint}` : `${owner}@siphr`;
  const fpFormatted = user?.fingerprint?.replace(/(.{4})/g, "$1 ").trim();

  return (
    <>
      <TopNav />
      <main style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "40px 6vw 64px",
        display: "grid", gridTemplateColumns: "320px 1fr", gap: 40,
      }}>
        <aside>
          <div style={{ marginBottom: 18 }}>
            <FingerprintSigil seed={seed} size={260} />
          </div>
          <h1 className="serif" style={{
            fontSize: 36, letterSpacing: "-0.02em",
            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          }}>
            {user?.verifiedAs || owner}
            <VerifiedBadge
              username={owner}
              verified={user?.verified}
              verifiedAs={user?.verifiedAs}
              verifiedKind={user?.verifiedKind}
              size={22}
            />
          </h1>
          <p style={{ fontSize: 16, color: "var(--muted)", fontFamily: "var(--mono)" }}>@{owner}</p>
          {user && (
            <>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 14, fontFamily: "var(--mono)" }}>
                ↳ joined {new Date(user.createdAt).toLocaleDateString()}
              </p>
              <div style={{ marginTop: 22 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>↳ public key fingerprint</div>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 12, padding: "10px 12px",
                  borderRadius: 6, background: "#0f0d0a", color: "#e8d9b8",
                  border: "1px solid #2a2520", letterSpacing: "0.04em",
                }}>
                  {fpFormatted}
                </div>
                <div style={{
                  marginTop: 8, fontSize: 11, fontFamily: "var(--mono)",
                  color: "var(--muted)", lineHeight: 1.6,
                }}>
                  ↳ verify this fingerprint out-of-band before adding {owner} as a collaborator on a private repo.
                </div>
              </div>
            </>
          )}
        </aside>

        <section>
          <div className="eyebrow" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span>↳ repositories · {repos.length}</span>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {repos.length === 0 ? (
              <div style={{ padding: "22px 18px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
                no public repositories.
              </div>
            ) : (
              repos.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    padding: "14px 18px",
                    borderBottom: i === repos.length - 1 ? "none" : "1px solid var(--line-2)",
                    display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center",
                  }}
                >
                  <FingerprintSigil seed={`${r.owner}/${r.name} ${r.id.slice(0, 6)}`} size={28} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Link href={`/${r.owner}/${r.name}`} style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</Link>
                      <Pill variant={r.visibility === "private" ? "encrypted" : "public"}>
                        {r.visibility === "private" ? "e2ee" : "public"}
                      </Pill>
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      ↳ updated {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Link href={`/${r.owner}/${r.name}`} className="btn ghost xs">view →</Link>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}
