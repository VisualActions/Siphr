"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { FingerprintSigil, Pill, Dot } from "@/components/Primitives";

type Repo = {
  id: string;
  name: string;
  owner: string;
  visibility: "private" | "public";
  createdAt: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    const u = localStorage.getItem("siphr:current_user");
    setUser(u);
    if (u) {
      fetch(`/api/users/${encodeURIComponent(u)}`)
        .then((r) => r.json())
        .then((j) => setFingerprint(j?.fingerprint ?? null))
        .catch(() => {});
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
        <main style={{ maxWidth: 1012, margin: "0 auto", padding: "64px 6vw" }}>
          <p className="serif" style={{ fontSize: 28 }}>
            Not signed in. <Link href="/signin" style={{ color: "var(--copper)" }}>sign in →</Link>
          </p>
        </main>
      </>
    );
  }

  const seed = `${user}@siphr ${fingerprint ?? "pending"}`;
  const fpShort = fingerprint ? formatFp(fingerprint).slice(0, 19) : "pending…";
  const ciphertextRepos = repos.filter((r) => r.visibility === "private").length;
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <>
      <TopNav />
      <main style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "32px 6vw 64px",
        display: "grid", gridTemplateColumns: "300px 1fr", gap: 32,
      }}>
        {/* SIDEBAR -------------------------------------------------- */}
        <aside>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <FingerprintSigil seed={seed} size={48} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{user}</div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: 11,
                color: "var(--muted)", whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis",
              }}>{fpShort}</div>
            </div>
          </div>

          {/* key session */}
          <div className="card flat" style={{ padding: 14, background: "var(--paper-2)", marginBottom: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>↳ key state · this session</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Dot color="var(--moss)" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>unlocked</span>
              <span style={{
                marginLeft: "auto", fontFamily: "var(--mono)",
                fontSize: 11, color: "var(--muted)",
              }}>in this tab</span>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              private key never leaves the browser
            </div>
          </div>

          {/* Repo list */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div className="eyebrow">↳ your repos · {repos.length}</div>
            <Link href="/repos/new" className="btn xs" style={{ height: 22 }}>+ new</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {repos.length === 0 ? (
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", padding: "8px 4px" }}>
                no repositories yet.
              </div>
            ) : (
              repos.map((r) => (
                <Link
                  key={r.id}
                  href={`/${r.owner}/${r.name}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 10, alignItems: "center",
                    padding: "8px 10px", borderRadius: 5,
                  }}
                >
                  <FingerprintSigil seed={`${r.owner}/${r.name} ${r.id.slice(0, 6)}`} size={20} />
                  <span style={{ fontSize: 13 }}>{r.name}</span>
                  <span style={{
                    fontFamily: "var(--mono)", fontSize: 10,
                    color: r.visibility === "private" ? "#9a6700" : "var(--moss)",
                  }}>
                    {r.visibility === "private" ? "e2ee" : "public"}
                  </span>
                </Link>
              ))
            )}
          </div>

          <div className="hr" style={{ margin: "22px 0" }} />

          <div className="eyebrow" style={{ marginBottom: 10 }}>↳ what you can do</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <li>· create a private repo (e2ee)</li>
            <li>· publish a public repo</li>
            <li>· browse, decrypt, push from this browser</li>
            <li>· rotate repo keys per-collaborator</li>
          </ul>
        </aside>

        {/* MAIN ---------------------------------------------------- */}
        <section>
          {/* welcome card */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>↳ session · {today}</div>
                <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.015em", lineHeight: 1.1 }}>
                  Welcome back, <em style={{ color: "var(--copper)" }}>{user}.</em>
                </h1>
                <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)", maxWidth: 480 }}>
                  Your private key is loaded in this browser. {ciphertextRepos === 0 ? "Create a private repo and we'll wrap its key to yours." : `${ciphertextRepos} ${ciphertextRepos === 1 ? "repo is" : "repos are"} decryptable from this session.`}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                <span>↳ key in memory only</span>
                <span>↳ no server-side session</span>
                <span style={{ color: "var(--moss)" }}>✓ public key only · uploaded once</span>
              </div>
            </div>
            <div style={{ padding: "0 26px 18px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, borderTop: "1px solid var(--line)", paddingTop: 18 }}>
              <Metric label="repos" value={String(repos.length)} sub={`${ciphertextRepos} private · ${repos.length - ciphertextRepos} public`} />
              <Metric label="ciphertext repos" value={String(ciphertextRepos)} sub="server cannot read" tone="moss" />
              <Metric label="wrapped key count" value={String(ciphertextRepos)} sub="one per repo" />
              <Metric label="fingerprint" value={fingerprint ? fpShort.slice(0, 9) : "—"} sub={fingerprint ? "verify on /transparency" : "ready when keys load"} tone="copper" />
            </div>
          </div>

          {/* repos grid */}
          <div className="eyebrow" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span>↳ your repos</span>
            <Link href="/repos/new" style={{ color: "var(--copper)", fontSize: 10 }}>+ new repo →</Link>
          </div>
          {repos.length === 0 ? (
            <div className="card" style={{ padding: "36px 26px", textAlign: "center" }}>
              <p className="serif" style={{ fontSize: 22, marginBottom: 10 }}>
                Start with a key ceremony, then a repository.
              </p>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
                A fresh 256-bit repo key will be generated in this browser and wrapped to your public key.
              </p>
              <Link href="/repos/new" className="btn copper">create your first repo</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 30 }}>
              {repos.map((r) => <RepoCard key={r.id} r={r} />)}
            </div>
          )}

          {/* activity */}
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            ↳ encrypted activity · only events you have keys for
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {repos.length === 0 ? (
              <div style={{ padding: "22px 26px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
                no activity yet · activity is encrypted to your key · the server can only see that &ldquo;something happened&rdquo;
              </div>
            ) : (
              repos.slice(0, 4).map((r) => (
                <FeedRow
                  key={r.id}
                  who={user} seed={seed}
                  event={<>created <code>{r.owner}/{r.name}</code> · {r.visibility === "private" ? "wrapped repo key to your public key" : "public, plaintext"}</>}
                  when={timeAgo(r.createdAt)}
                  tail={r.visibility === "private" ? "↳ aes-256-gcm repo key · server sees ciphertext only" : "↳ plaintext like any forge · siphr still won't track viewers"}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function RepoCard({ r }: { r: Repo }) {
  const seed = `${r.owner}/${r.name} ${r.id.slice(0, 6)}`;
  return (
    <Link href={`/${r.owner}/${r.name}`} className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <FingerprintSigil seed={seed} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{r.owner}/{r.name}</span>
            <Pill variant={r.visibility === "private" ? "encrypted" : "public"}>
              {r.visibility === "private" ? "e2ee" : "public"}
            </Pill>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
            ↳ created {timeAgo(r.createdAt)}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "10px 12px", background: "var(--paper-2)", borderRadius: 5, fontFamily: "var(--mono)", fontSize: 11 }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>storage</div>
          <div style={{ marginTop: 2 }}>{r.visibility === "private" ? "ciphertext" : "plaintext"}</div>
        </div>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>server sees</div>
          <div style={{ marginTop: 2, color: r.visibility === "private" ? "var(--rust)" : "var(--moss)" }}>
            {r.visibility === "private" ? "0 plain" : "all (intent)"}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "moss" | "copper" }) {
  const color = tone === "moss" ? "var(--moss)" : tone === "copper" ? "var(--copper)" : "var(--ink)";
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      <div className="serif" style={{ fontSize: 32, lineHeight: 1, color }}>{value}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function FeedRow({
  who, seed, event, when, tail, tone, last,
}: {
  who: string; seed: string; event: React.ReactNode;
  when: string; tail: string;
  tone?: "warn"; last?: boolean;
}) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14,
      alignItems: "start", padding: "16px 20px",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
    }}>
      <FingerprintSigil seed={seed} size={28} />
      <div>
        <div style={{ fontSize: 13 }}>
          <strong>{who}</strong> <span style={{ color: "var(--ink-2)" }}>{event}</span>
        </div>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 10,
          color: tone === "warn" ? "#9a6700" : "var(--muted)",
          marginTop: 4,
        }}>{tail}</div>
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{when}</span>
    </div>
  );
}

function formatFp(fp: string): string {
  return fp.replace(/(.{4})/g, "$1 ").trim();
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
