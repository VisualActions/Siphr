"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { FingerprintSigil } from "@/components/Primitives";
import { useTheme } from "@/components/ThemeProvider";
import PatManager from "@/components/PatManager";

type User = {
  username: string;
  fingerprint: string;
  createdAt: string;
  verified?: boolean;
  verifiedAs?: string | null;
  verifiedKind?: "org" | "individual" | "bot" | null;
};

export default function SettingsPage() {
  const [user, setUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const { theme, setTheme } = useTheme();
  const [showFp, setShowFp] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("siphr:current_user");
    setUser(u);
    if (u) {
      fetch(`/api/users/${encodeURIComponent(u)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j && setProfile(j))
        .catch(() => {});
    }
  }, []);

  function signOut() {
    localStorage.removeItem("siphr:current_user");
    window.location.href = "/";
  }

  function relockKey() {
    if (!user) return;
    // Drop in-memory repo keys for the current session.
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith("siphr:repokey:"))
      .forEach((k) => sessionStorage.removeItem(k));
    window.location.reload();
  }

  const fpFormatted = profile?.fingerprint
    ? profile.fingerprint.replace(/(.{4})/g, "$1 ").trim()
    : "—";

  return (
    <>
      <TopNav active="settings" />
      <main style={{ padding: "48px 6vw 80px", maxWidth: 880, margin: "0 auto" }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>↳ /settings</div>
        <h1 className="display" style={{ fontSize: 56 }}>
          Settings.
        </h1>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 580 }}>
          Everything that affects how this browser tab talks to Siphr.
          Nothing on this page touches the server.
        </p>

        {/* APPEARANCE */}
        <Section n="01" title="Appearance">
          <Card>
            <Row
              label="Theme"
              hint="dark is the default · light is clinical white, never warm cream"
              right={null}
            >
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <ThemeOption
                  active={theme === "dark"}
                  onClick={() => setTheme("dark")}
                  label="dark · instrument"
                  hint="phosphor-on-black · default"
                  preview="dark"
                />
                <ThemeOption
                  active={theme === "light"}
                  onClick={() => setTheme("light")}
                  label="light · clinical"
                  hint="bone-on-white · graph paper"
                  preview="light"
                />
              </div>
            </Row>
            <Row
              label="Top nav"
              hint="the chrome stays in dark instrument language even when the page goes light · by design"
              right={<span className="pill">always dark</span>}
              last
            />
          </Card>
        </Section>

        {/* IDENTITY */}
        <Section n="02" title="Identity">
          {!user ? (
            <Card>
              <Row
                label="Not signed in"
                hint="create a keypair or sign in to manage your identity"
              >
                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                  <Link href="/signup" className="btn primary">create key</Link>
                  <Link href="/signin" className="btn ghost">sign in</Link>
                </div>
              </Row>
            </Card>
          ) : (
            <Card>
              <Row
                label="Signed in as"
                hint={profile ? `joined ${new Date(profile.createdAt).toLocaleDateString()}` : "loading…"}
                right={(
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {profile && <FingerprintSigil seed={`${user}@siphr ${profile.fingerprint}`} size={36} />}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 600 }}>{user}</div>
                      {profile?.verified && (
                        <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--mint)" }}>
                          ✓ verified {profile.verifiedKind ?? ""}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              />
              <Row
                label="Public-key fingerprint"
                hint="verify this out-of-band before someone adds you to a private repo"
                right={(
                  <button
                    type="button"
                    onClick={() => setShowFp((v) => !v)}
                    className="btn ghost sm"
                  >
                    {showFp ? "hide" : "show"}
                  </button>
                )}
              >
                {showFp && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px",
                    background: "#050706", color: "var(--phosphor-2)",
                    border: "1px solid var(--line)", borderRadius: 2,
                    fontFamily: "var(--mono)", fontSize: 12.5,
                    letterSpacing: "0.04em",
                  }}>
                    {fpFormatted}
                  </div>
                )}
              </Row>
              <Row
                label="Re-lock session keys"
                hint="drop unwrapped repo keys from this tab · you'll re-derive them on next access"
                right={(
                  <button
                    type="button"
                    onClick={relockKey}
                    className="btn ghost sm"
                  >
                    re-lock
                  </button>
                )}
              />
              <Row
                label="Sign out"
                hint="clears the current-user pointer · doesn't touch the encrypted identity blob"
                right={(
                  <button
                    type="button"
                    onClick={signOut}
                    className="btn ghost sm"
                    style={{ color: "var(--signal)", borderColor: "rgba(255, 85, 68, 0.35)" }}
                  >
                    sign out
                  </button>
                )}
                last
              />
            </Card>
          )}
        </Section>

        {/* PERSONAL ACCESS TOKENS */}
        {user && (
          <Section n="03" title="Personal access tokens">
            <Card>
              <Row
                label="Git over HTTPS"
                hint="paste the token as your password when git prompts · used like a GitHub PAT"
                right={null}
                last
              >
                <div style={{ marginTop: 14 }}>
                  <PatManager user={user} />
                </div>
              </Row>
            </Card>
          </Section>
        )}

        {/* DANGER */}
        <Section n={user ? "04" : "03"} title="The escape hatch">
          <Card>
            <Row
              label="Lost your passphrase"
              hint="Siphr can't reset it · that's the property doing the work · recovery codes ship in v0.7"
              right={<span className="pill danger">v0.7 — planned</span>}
              last
            />
          </Card>
          <p style={{
            marginTop: 14, fontFamily: "var(--mono)", fontSize: 11,
            color: "var(--muted)", lineHeight: 1.7,
          }}>
            ↳ see <Link href="/roadmap" style={{ color: "var(--phosphor)" }}>/roadmap</Link>{" "}
            for the full list of what does and does not ship later.
          </p>
        </Section>
      </main>
    </>
  );
}

function Section({
  n, title, children,
}: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 40 }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 12,
        marginBottom: 14, flexWrap: "wrap",
      }}>
        <span style={{
          fontFamily: "var(--mono)", fontSize: 11,
          color: "var(--muted)", letterSpacing: "0.14em",
        }}>{n}</span>
        <h2 style={{ fontSize: 22, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {children}
    </div>
  );
}

function Row({
  label, hint, right, children, last,
}: {
  label: string; hint: string;
  right?: React.ReactNode; children?: React.ReactNode; last?: boolean;
}) {
  return (
    <div style={{
      padding: "16px 18px",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto",
        gap: 18, alignItems: "center",
      }}>
        <div>
          <div className="field-label">{label}</div>
          <div className="field-hint" style={{ marginTop: 4 }}>{hint}</div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function ThemeOption({
  active, onClick, label, hint, preview,
}: {
  active: boolean; onClick: () => void;
  label: string; hint: string; preview: "dark" | "light";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left", padding: 0,
        background: "transparent",
        border: `1px solid ${active ? "var(--phosphor)" : "var(--line)"}`,
        borderRadius: 2,
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <div style={{
        background: preview === "dark" ? "#0a0c0a" : "#f4f4ef",
        padding: "14px 12px",
        borderBottom: "1px solid var(--line)",
      }}>
        <div style={{
          width: 36, height: 4, marginBottom: 6,
          background: preview === "dark" ? "#c0fa3a" : "#0a0c0a",
        }} />
        <div style={{
          width: "70%", height: 3, marginBottom: 5,
          background: preview === "dark" ? "rgba(235,233,220,0.4)" : "rgba(10,12,10,0.4)",
        }} />
        <div style={{
          width: "50%", height: 3,
          background: preview === "dark" ? "rgba(235,233,220,0.25)" : "rgba(10,12,10,0.25)",
        }} />
      </div>
      <div style={{
        padding: "8px 12px", display: "flex",
        alignItems: "center", justifyContent: "space-between", gap: 10,
        background: "var(--panel)",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)" }}>{hint}</div>
        </div>
        <span style={{
          width: 14, height: 14, borderRadius: 2,
          border: `1px solid ${active ? "var(--phosphor)" : "var(--line)"}`,
          background: active ? "var(--phosphor)" : "transparent",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          {active && (
            <svg width="9" height="9" viewBox="0 0 12 12">
              <path d="M2 6 L5 9 L10 3" stroke="var(--phosphor-ink)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </div>
    </button>
  );
}
