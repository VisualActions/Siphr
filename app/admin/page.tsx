"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Dot } from "@/components/Primitives";

type Overview = {
  users: {
    total: number;
    verified: number;
    recent: {
      username: string;
      fingerprint: string;
      verified: boolean;
      verifiedAs: string | null;
      verifiedKind: string | null;
      createdAt: string;
    }[];
  };
  repos: {
    total: number;
    privateCount: number;
    publicCount: number;
    featuredCount: number;
  };
  objects: { objectCount: number; totalBytes: number };
  recentRepos: {
    id: string;
    owner: string;
    name: string;
    visibility: "private" | "public";
    featured: boolean;
    featuredTag: string | null;
    createdAt: string;
  }[];
};

const TOKEN_KEY = "siphr:admin_token";

export default function AdminPage() {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [authed, setAuthed] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUser(localStorage.getItem("siphr:current_user"));
    const cached = localStorage.getItem(TOKEN_KEY) ?? "";
    if (cached) {
      setToken(cached);
    }
  }, []);

  const loadOverview = useCallback(async (presented: string) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/overview", {
        headers: { authorization: `Bearer ${presented}` },
      });
      if (res.status === 401) {
        setErr("invalid admin token");
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error(`server: ${res.status}`);
      const j = (await res.json()) as Overview;
      setOverview(j);
      setAuthed(true);
      localStorage.setItem(TOKEN_KEY, presented);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "load failed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (token && !authed) {
      void loadOverview(token);
    }
  }, [token, authed, loadOverview]);

  // Block clients that aren't signed in as siphr from even seeing the form.
  if (user !== null && user !== "siphr") {
    return (
      <OperatorChrome>
        <main style={{ padding: "64px 32px", textAlign: "center" }}>
          <div className="eyebrow" style={{ color: "#a08762", marginBottom: 10 }}>↳ access denied</div>
          <h1 className="serif" style={{ fontSize: 36, color: "#fff" }}>
            This console is restricted to the <em style={{ color: "var(--copper)" }}>siphr</em> operator account.
          </h1>
          <p style={{ marginTop: 14, color: "#a08762", fontFamily: "var(--mono)", fontSize: 13 }}>
            ↳ signed in as <span style={{ color: "#fff" }}>{user}</span>
          </p>
          <Link href="/" style={{
            display: "inline-block", marginTop: 22,
            padding: "10px 18px", borderRadius: 6,
            background: "var(--copper)", color: "#fff",
            fontSize: 13, fontWeight: 500,
          }}>← back to siphr</Link>
        </main>
      </OperatorChrome>
    );
  }

  if (!authed || !overview) {
    return (
      <OperatorChrome>
        <main style={{ padding: "64px 32px", maxWidth: 540, margin: "0 auto" }}>
          <div className="eyebrow" style={{ color: "var(--copper-2)", marginBottom: 10 }}>↳ operator console</div>
          <h1 className="serif" style={{ fontSize: 36, color: "#fff", letterSpacing: "-0.015em" }}>
            Paste the admin token to <em style={{ color: "var(--copper)" }}>unlock.</em>
          </h1>
          <p style={{ marginTop: 14, color: "#a08762", fontSize: 14, lineHeight: 1.6 }}>
            The token is held in <code style={{ color: "#e8d9b8" }}>SIPHR_ADMIN_TOKEN</code> on the server. The
            console can&apos;t read user content even with this token — that&apos;s the design, not a bug.
          </p>

          <div style={{ marginTop: 28 }}>
            <div className="eyebrow" style={{ color: "#806c4a", marginBottom: 6 }}>admin token</div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="paste token"
              style={{
                width: "100%", height: 42,
                background: "#0f0d0a", color: "#e8d9b8",
                border: "1px solid #2a2520", borderRadius: 6,
                padding: "0 14px", fontFamily: "var(--mono)", fontSize: 13,
              }}
            />
            {err && (
              <div style={{
                marginTop: 12, padding: "8px 12px", borderRadius: 5,
                background: "rgba(138,42,31,0.15)", color: "#d97a4a",
                fontFamily: "var(--mono)", fontSize: 12,
              }}>{err}</div>
            )}
            <button
              onClick={() => loadOverview(token)}
              disabled={!token || busy}
              style={{
                marginTop: 14, height: 38, padding: "0 18px",
                background: "var(--copper)", color: "#fff",
                border: 0, borderRadius: 6, fontWeight: 500,
                cursor: token ? "pointer" : "not-allowed",
                opacity: token ? 1 : 0.5,
              }}
            >
              {busy ? "verifying…" : "unlock console"}
            </button>
          </div>
        </main>
      </OperatorChrome>
    );
  }

  return (
    <OperatorChrome onLock={() => {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setAuthed(false);
      setOverview(null);
    }}>
      <Console
        token={token}
        overview={overview}
        refresh={() => loadOverview(token)}
      />
    </OperatorChrome>
  );
}

// ============================================================
// Operator chrome — dark, distinct from user-facing
// ============================================================

function OperatorChrome({
  children, onLock,
}: { children: React.ReactNode; onLock?: () => void }) {
  return (
    <div style={{ background: "#171510", minHeight: "100vh", color: "var(--paper)" }}>
      <header style={{
        background: "#0f0d0a", color: "var(--paper)",
        height: 56, display: "flex", alignItems: "center",
        padding: "0 28px", gap: 24,
        borderBottom: "1px solid #2a2520",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontFamily: "var(--mono)", fontSize: 15, fontWeight: 600,
          letterSpacing: "0.04em",
        }}>
          <SiphrMark size={20} />
          <span>siphr</span>
          <span style={{ color: "#806c4a" }}>/</span>
          <span style={{ color: "var(--copper-2)" }}>operator</span>
        </div>
        <div style={{
          display: "flex", gap: 18, fontFamily: "var(--mono)",
          fontSize: 12, color: "#a08762", marginLeft: 8,
        }}>
          <span style={{ color: "#f4f0e6" }}>overview</span>
        </div>
        <div style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: 14,
          fontFamily: "var(--mono)", fontSize: 11, color: "#a08762",
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Dot color="#9bbf86" /> all systems · nominal
          </span>
          {onLock && (
            <button
              onClick={onLock}
              style={{
                background: "transparent", color: "#a08762",
                border: "1px solid #2a2520", padding: "4px 10px",
                borderRadius: 4, fontFamily: "var(--mono)", fontSize: 11,
              }}
            >
              lock
            </button>
          )}
          <Link href="/" style={{
            background: "var(--copper)", width: 28, height: 28,
            borderRadius: 999, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            fontWeight: 600, color: "#fff", fontSize: 12,
          }}>O</Link>
        </div>
      </header>
      {children}
    </div>
  );
}

// ============================================================
// Full console — the dashboard once the token unlocks it
// ============================================================

function Console({
  token, overview, refresh,
}: { token: string; overview: Overview; refresh: () => void }) {
  return (
    <main style={{ padding: "28px 32px 60px" }}>
      {/* Operator pledge banner */}
      <div style={{
        marginBottom: 24, padding: "14px 20px",
        border: "1px solid #2a2520",
        borderLeft: "3px solid var(--copper)",
        background: "rgba(255,255,255,0.02)",
        borderRadius: 4, display: "flex",
        justifyContent: "space-between", alignItems: "center", gap: 24,
        flexWrap: "wrap",
      }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--copper-2)" }}>
            ↳ operator pledge · displayed here every session
          </div>
          <div className="serif" style={{ fontSize: 22, marginTop: 4, color: "#fff", letterSpacing: "-0.01em" }}>
            You can&apos;t read user content from this console. Not even with two keys. That&apos;s the design — not a bug.
          </div>
        </div>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 11, color: "#a08762",
          lineHeight: 1.7, textAlign: "right", whiteSpace: "nowrap",
        }}>
          ↳ surface · admin overview<br />
          ↳ enforced by · server build hash<br />
          ↳ verified · this session
        </div>
      </div>

      {/* Fleet metrics */}
      <section style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ color: "#a08762", marginBottom: 12 }}>↳ fleet · live</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          <OpStat label="encrypted blobs stored" value={overview.objects.objectCount.toLocaleString()} sub="content-hashed objects" />
          <OpStat label="ciphertext at rest" value={formatBytes(overview.objects.totalBytes)} sub="that's it — that's the data" />
          <OpStat label="key holders" value={overview.users.total.toLocaleString()} sub={`${overview.users.verified} verified`} />
          <OpStat label="repos · private / public" value={`${overview.repos.privateCount} · ${overview.repos.publicCount}`} sub={`${overview.repos.featuredCount} featured`} tone="moss" />
          <OpStat label="total repos" value={overview.repos.total.toLocaleString()} sub="across all users" />
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 22 }}>
        {/* LEFT — things the operator CAN see and do */}
        <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <OpPanel
            eyebrow="↳ recent accounts"
            title="What you can see"
            titleColor="#9bbf86"
          >
            {overview.users.recent.length === 0 ? (
              <EmptyPanel>no signups yet</EmptyPanel>
            ) : (
              overview.users.recent.map((u, i) => (
                <UserRow
                  key={u.username}
                  token={token}
                  user={u}
                  last={i === overview.users.recent.length - 1}
                  onChange={refresh}
                />
              ))
            )}
          </OpPanel>

          <OpPanel
            eyebrow="↳ recent repos · feature or revoke"
            title="Recent repositories"
            titleColor="#9bbf86"
          >
            {overview.recentRepos.length === 0 ? (
              <EmptyPanel>no repos yet</EmptyPanel>
            ) : (
              overview.recentRepos.map((r, i) => (
                <RepoRow
                  key={r.id}
                  token={token}
                  repo={r}
                  last={i === overview.recentRepos.length - 1}
                  onChange={refresh}
                />
              ))
            )}
          </OpPanel>
        </section>

        {/* RIGHT — things the operator CANNOT see */}
        <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <OpPanel
            eyebrow="↳ user-content surface · for proof, not for use"
            title="What you can't see"
            titleColor="#d97a4a"
            accent="#3a1f17"
          >
            <CantSeeRow label="repo names (private)" />
            <CantSeeRow label="file contents" />
            <CantSeeRow label="commit messages" />
            <CantSeeRow label="branch names" />
            <CantSeeRow label="issue / pr text" />
            <CantSeeRow label="collaborator list per private repo" subtle />
            <CantSeeRow label="search across user data" subtle last />
            <div style={{
              padding: "12px 16px", fontFamily: "var(--mono)", fontSize: 11,
              color: "#a08762", borderTop: "1px solid #2a2520", lineHeight: 1.7,
            }}>
              ↳ enforced cryptographically · not by access control<br />
              ↳ deploying an operator console that could read this would{" "}
              <span style={{ color: "var(--copper-2)" }}>change the build hash</span> · break the transparency log
            </div>
          </OpPanel>

          <OpPanel
            eyebrow="↳ sampled repo · what the admin payload contains"
            title="GET /api/admin/overview"
            titleColor="#d97a4a"
            accent="#3a1f17"
          >
            <div style={{
              padding: "14px 18px",
              display: "grid", gridTemplateColumns: "auto 1fr",
              gap: "8px 18px", fontFamily: "var(--mono)", fontSize: 12,
            }}>
              <KVAdmin k="total repos" v={String(overview.repos.total)} />
              <KVAdmin k="ciphertext" v={formatBytes(overview.objects.totalBytes)} />
              <KVAdmin k="objects" v={overview.objects.objectCount.toLocaleString()} />
              <KVAdmin k="users" v={String(overview.users.total)} />
              <KVAdmin k="featured" v={String(overview.repos.featuredCount)} />
              <KVAdmin k="repo names (private)" v={<Redacted />} />
              <KVAdmin k="readme content" v={<Redacted wide />} />
              <KVAdmin k="commit graph (private)" v={<Redacted />} />
            </div>
            <div style={{
              padding: "10px 18px", background: "#0f0d0a",
              borderTop: "1px solid #2a2520", fontFamily: "var(--mono)",
              fontSize: 11, color: "#a08762",
            }}>
              ↳ no &ldquo;decrypt&rdquo; button anywhere in this binary
            </div>
          </OpPanel>
        </section>
      </div>

      {/* Bottom — honest powers strip */}
      <section style={{ marginTop: 24 }}>
        <div style={{
          border: "1px solid #5c2a1f",
          background: "rgba(138,42,31,0.08)",
          borderRadius: 6, padding: "18px 22px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            <div className="serif" style={{ fontSize: 36, color: "var(--rust)", lineHeight: 1 }}>!</div>
            <div style={{ flex: 1 }}>
              <div className="eyebrow" style={{ marginBottom: 6, color: "var(--rust)" }}>
                ↳ the powers we do have · listed openly
              </div>
              <h3 className="serif" style={{ fontSize: 24, color: "#fff", letterSpacing: "-0.01em" }}>
                Things the operator can still do.
              </h3>
              <div style={{
                marginTop: 14,
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "10px 24px",
                fontFamily: "var(--mono)", fontSize: 12,
                color: "#e8d9b8", lineHeight: 1.65,
              }}>
                <div>↳ <strong style={{ color: "#fff" }}>verify orgs/users</strong> — mark accounts as verified. Logged.</div>
                <div>↳ <strong style={{ color: "#fff" }}>feature repos</strong> — promote to /featured. Logged.</div>
                <div>↳ <strong style={{ color: "#fff" }}>refuse service</strong> — block an account or repo. Logged.</div>
                <div>↳ <strong style={{ color: "#fff" }}>ship new code</strong> — every release re-hashes; mismatch detectable.</div>
                <div style={{ color: "#9bbf86" }}>✗ cannot decrypt user content · cannot grant decrypt to self · cannot impersonate keys</div>
                <div style={{ color: "#9bbf86" }}>✗ cannot suppress transparency log entries · cannot retro-edit history</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// Sub-components
// ============================================================

function UserRow({
  token, user, last, onChange,
}: {
  token: string;
  user: Overview["users"]["recent"][number];
  last?: boolean;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [as, setAs] = useState(user.verifiedAs ?? "");
  const [kind, setKind] = useState<"org" | "individual" | "bot">(
    (user.verifiedKind as "org" | "individual" | "bot") ?? "org"
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function applyVerify(verified: boolean) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: user.username,
          verified,
          verifiedAs: verified ? as || user.username : undefined,
          verifiedKind: verified ? kind : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `server ${res.status}`);
      }
      setOpen(false);
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ borderBottom: last ? "none" : "1px solid #1f1c17" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "auto 1fr auto auto",
        gap: 14, padding: "11px 18px", alignItems: "center",
      }}>
        <Dot color={user.verified ? "#9bbf86" : "#806c4a"} />
        <div>
          <div style={{ fontSize: 13, color: "#fff" }}>
            {user.username}
            {user.verified && (
              <span style={{ color: "#9bbf86", marginLeft: 8, fontSize: 11, fontFamily: "var(--mono)" }}>
                · verified {user.verifiedKind ? `(${user.verifiedKind})` : ""}
              </span>
            )}
          </div>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10, color: "#a08762",
            marginTop: 2, letterSpacing: "0.04em",
          }}>
            fp {user.fingerprint} · joined {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>
        <span style={{
          fontFamily: "var(--mono)", fontSize: 10, color: "#a08762",
        }}>{user.verifiedAs ?? "—"}</span>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "transparent", color: "#e8d9b8",
            border: "1px solid #2a2520", borderRadius: 4,
            padding: "4px 10px", fontFamily: "var(--mono)", fontSize: 11,
          }}
        >
          {open ? "close" : "verify"}
        </button>
      </div>
      {open && (
        <div style={{
          padding: "10px 18px 14px", background: "#0a0907",
          display: "grid", gridTemplateColumns: "1fr 140px auto auto",
          gap: 8, alignItems: "center",
        }}>
          <input
            value={as}
            onChange={(e) => setAs(e.target.value)}
            placeholder="display name e.g. Microsoft"
            style={{
              background: "#0f0d0a", color: "#e8d9b8",
              border: "1px solid #2a2520", borderRadius: 4,
              padding: "6px 10px", fontFamily: "var(--mono)", fontSize: 12,
            }}
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "org" | "individual" | "bot")}
            style={{
              background: "#0f0d0a", color: "#e8d9b8",
              border: "1px solid #2a2520", borderRadius: 4,
              padding: "6px 10px", fontFamily: "var(--mono)", fontSize: 12,
            }}
          >
            <option value="org">org</option>
            <option value="individual">individual</option>
            <option value="bot">bot</option>
          </select>
          <button
            onClick={() => applyVerify(true)}
            disabled={busy}
            style={{
              background: "var(--copper)", color: "#fff", border: 0,
              padding: "6px 12px", borderRadius: 4,
              fontFamily: "var(--mono)", fontSize: 12,
            }}
          >verify</button>
          {user.verified && (
            <button
              onClick={() => applyVerify(false)}
              disabled={busy}
              style={{
                background: "transparent", color: "#d97a4a",
                border: "1px solid #5c2a1f",
                padding: "6px 12px", borderRadius: 4,
                fontFamily: "var(--mono)", fontSize: 12,
              }}
            >revoke</button>
          )}
          {err && (
            <div style={{
              gridColumn: "1 / -1", marginTop: 4,
              fontFamily: "var(--mono)", fontSize: 11, color: "#d97a4a",
            }}>{err}</div>
          )}
        </div>
      )}
    </div>
  );
}

function RepoRow({
  token, repo, last, onChange,
}: {
  token: string;
  repo: Overview["recentRepos"][number];
  last?: boolean;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState(repo.featuredTag ?? "");
  const [blurb, setBlurb] = useState("");
  const [rank, setRank] = useState(10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function apply(featured: boolean) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/featured", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: repo.id,
          featured,
          tag: featured ? tag || null : null,
          blurb: featured ? blurb || null : null,
          rank: featured ? rank : null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `server ${res.status}`);
      }
      setOpen(false);
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ borderBottom: last ? "none" : "1px solid #1f1c17" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "auto 1fr auto auto",
        gap: 14, padding: "11px 18px", alignItems: "center",
      }}>
        <Dot color={repo.featured ? "var(--copper)" : repo.visibility === "private" ? "#e8c766" : "#9bbf86"} />
        <div>
          <div style={{ fontSize: 13, color: "#fff" }}>
            {repo.owner}/{repo.name}
            {repo.featured && (
              <span style={{
                color: "var(--copper-2)", marginLeft: 8,
                fontFamily: "var(--mono)", fontSize: 11,
              }}>· ★ featured{repo.featuredTag ? ` · ${repo.featuredTag}` : ""}</span>
            )}
          </div>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10, color: "#a08762", marginTop: 2,
          }}>
            {repo.visibility} · created {new Date(repo.createdAt).toLocaleDateString()}
          </div>
        </div>
        <Link
          href={`/${repo.owner}/${repo.name}`}
          style={{
            fontFamily: "var(--mono)", fontSize: 11, color: "#a08762",
          }}
        >view ↗</Link>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "transparent", color: "#e8d9b8",
            border: "1px solid #2a2520", borderRadius: 4,
            padding: "4px 10px", fontFamily: "var(--mono)", fontSize: 11,
          }}
        >
          {open ? "close" : repo.featured ? "edit" : "feature"}
        </button>
      </div>
      {open && (
        <div style={{
          padding: "10px 18px 14px", background: "#0a0907",
          display: "grid", gridTemplateColumns: "1fr 1fr 80px auto auto",
          gap: 8, alignItems: "center",
        }}>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="tag e.g. operating systems"
            style={dark}
          />
          <input
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            placeholder="editorial blurb (one sentence)"
            style={dark}
          />
          <input
            type="number"
            value={rank}
            onChange={(e) => setRank(Number(e.target.value))}
            placeholder="rank"
            style={dark}
          />
          <button
            onClick={() => apply(true)}
            disabled={busy}
            style={{
              background: "var(--copper)", color: "#fff", border: 0,
              padding: "6px 12px", borderRadius: 4,
              fontFamily: "var(--mono)", fontSize: 12,
            }}
          >★ feature</button>
          {repo.featured && (
            <button
              onClick={() => apply(false)}
              disabled={busy}
              style={{
                background: "transparent", color: "#d97a4a",
                border: "1px solid #5c2a1f",
                padding: "6px 12px", borderRadius: 4,
                fontFamily: "var(--mono)", fontSize: 12,
              }}
            >unfeature</button>
          )}
          {err && (
            <div style={{
              gridColumn: "1 / -1", marginTop: 4,
              fontFamily: "var(--mono)", fontSize: 11, color: "#d97a4a",
            }}>{err}</div>
          )}
        </div>
      )}
    </div>
  );
}

const dark: React.CSSProperties = {
  background: "#0f0d0a", color: "#e8d9b8",
  border: "1px solid #2a2520", borderRadius: 4,
  padding: "6px 10px", fontFamily: "var(--mono)", fontSize: 12,
};

function OpStat({
  label, value, sub, tone,
}: { label: string; value: string; sub: string; tone?: "moss" }) {
  return (
    <div style={{
      background: "#0f0d0a", border: "1px solid #2a2520",
      borderRadius: 5, padding: "14px 16px",
    }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, color: "#806c4a",
        letterSpacing: "0.08em", textTransform: "uppercase",
      }}>{label}</div>
      <div className="serif" style={{
        fontSize: 28, lineHeight: 1, marginTop: 8,
        color: tone === "moss" ? "#9bbf86" : "#fff",
      }}>{value}</div>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, color: "#a08762", marginTop: 6,
      }}>{sub}</div>
    </div>
  );
}

function OpPanel({
  eyebrow, title, titleColor, accent, children,
}: {
  eyebrow: string; title: string;
  titleColor?: string; accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: accent ?? "#0f0d0a",
      border: `1px solid ${accent ? "#5c3a1f" : "#2a2520"}`,
      borderRadius: 6, overflow: "hidden",
    }}>
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #2a2520" }}>
        <div className="eyebrow" style={{ color: "#a08762", marginBottom: 6 }}>{eyebrow}</div>
        <h3 className="serif" style={{
          fontSize: 22, color: titleColor ?? "#fff", letterSpacing: "-0.01em",
        }}>{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function CantSeeRow({
  label, subtle, last,
}: { label: string; subtle?: boolean; last?: boolean }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr auto",
      gap: 18, padding: "10px 18px",
      borderBottom: last ? "none" : "1px solid #1f1c17",
      alignItems: "center",
    }}>
      <span style={{ fontSize: 13, color: subtle ? "#a08762" : "#e8d9b8" }}>{label}</span>
      <span className="redacted" style={{ display: "inline-block", padding: "0 36px", height: 18 }}>redacted</span>
    </div>
  );
}

function KVAdmin({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <span style={{
        color: "#806c4a", textTransform: "uppercase",
        fontSize: 10, letterSpacing: "0.1em",
        paddingTop: 3, whiteSpace: "nowrap",
      }}>{k}</span>
      <span style={{ color: "#e8d9b8" }}>{v}</span>
    </>
  );
}

function Redacted({ wide }: { wide?: boolean }) {
  return (
    <span className="redacted" style={{
      display: "inline-block",
      padding: wide ? "0 88px" : "0 36px",
      height: 14,
    }}>r</span>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: "16px 18px", fontFamily: "var(--mono)",
      fontSize: 12, color: "#a08762",
    }}>{children}</div>
  );
}

function SiphrMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="19" height="19" rx="4" fill="#b25927" />
      <path d="M6.5 11 L9.5 14 L15.5 8" stroke="var(--panel)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="11" r="6.5" stroke="var(--panel)" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
