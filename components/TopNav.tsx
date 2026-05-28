"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { FingerprintSigil, Pill } from "./Primitives";

type Props = {
  active?: "explore" | "featured" | "security" | "transparency" | "settings" | null;
};

export default function TopNav({ active = null }: Props) {
  const [user, setUser] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [orgs, setOrgs] = useState<{ name: string; displayName: string | null }[]>([]);
  const { theme, setTheme } = useTheme();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const appearanceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("siphr:current_user");
    setUser(u);
    if (u) {
      // Lazy: only load orgs when we have a user. Failures are silent —
      // not having orgs is the common case and shouldn't break the nav.
      fetch(`/api/orgs?user=${encodeURIComponent(u)}`)
        .then((r) => (r.ok ? r.json() : { orgs: [] }))
        .then((j) =>
          setOrgs(
            (j.orgs ?? []).map(
              (o: { name: string; displayName: string | null }) => ({
                name: o.name,
                displayName: o.displayName,
              })
            )
          )
        )
        .catch(() => setOrgs([]));
    }
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (appearanceRef.current && !appearanceRef.current.contains(e.target as Node)) {
        setAppearanceOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function signOut() {
    // Revoke the server-side session, clear local hints, hard-navigate so
    // any in-flight state is reset.
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch { /* fall through and still clear local */ }
    localStorage.removeItem("siphr:current_user");
    window.location.href = "/";
  }

  const linkColor = (k: typeof active) =>
    active === k ? "#fff" : "rgba(255,255,255,0.55)";

  return (
    <header className="siphr-topnav">
      <Link href={user ? "/dashboard" : "/"} className="brand">
        <span className="brand-dot" />
        <span>SIPHR</span>
      </Link>

      <SearchBox />

      <nav className="navlinks">
        <Link href="/explore" style={{ color: linkColor("explore") }}>explore</Link>
        <Link href="/featured" style={{ color: linkColor("featured") }}>featured</Link>
        <Link href="/security" style={{ color: linkColor("security") }}>security</Link>
        <Link href="/transparency" style={{ color: linkColor("transparency") }}>verify</Link>
      </nav>

      <div className="right">
        {/* Appearance toggle — always visible, signed in or not */}
        <div style={{ position: "relative" }} ref={appearanceRef}>
          <button
            onClick={() => setAppearanceOpen((v) => !v)}
            aria-label="appearance"
            title="appearance"
            style={{
              width: 26, height: 26, borderRadius: 2,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.7)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? <MoonGlyph /> : <SunGlyph />}
          </button>
          {appearanceOpen && (
            <AppearancePopover
              theme={theme}
              setTheme={(t) => { setTheme(t); }}
            />
          )}
        </div>

        {user ? (
          <>
            <Link
              href="/repos/new"
              title="new repository"
              style={{
                color: "#fff", display: "inline-flex", alignItems: "center",
                justifyContent: "center", width: 26, height: 26, borderRadius: 2,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
              </svg>
            </Link>
            <div style={{ position: "relative" }} ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="avatar"
                aria-label="account"
              >
                {user[0]?.toUpperCase()}
              </button>
              {menuOpen && (
                <div
                  style={{
                    position: "absolute", right: 0, top: 34, width: 240, zIndex: 30,
                    background: "var(--panel)", color: "var(--ink)",
                    border: "1px solid var(--line)", borderRadius: "var(--r-md)",
                    boxShadow: "0 12px 32px -16px rgba(0,0,0,0.6)",
                    padding: "4px 0",
                  }}
                >
                  <div style={{
                    padding: "8px 12px", fontFamily: "var(--mono)", fontSize: 11,
                    color: "var(--muted)", borderBottom: "1px solid var(--line-2)",
                    letterSpacing: "0.04em",
                  }}>
                    SIGNED IN AS <span style={{ color: "var(--ink)" }}>{user}</span>
                  </div>
                  <MenuLink href={`/${user}`}>your profile</MenuLink>
                  <MenuLink href="/dashboard">your repositories</MenuLink>
                  <MenuLink href="/settings">settings</MenuLink>
                  <MenuLink href="/transparency">verification log</MenuLink>
                  {user === "siphr" && (
                    <MenuLink href="/admin">
                      <span style={{ color: "var(--phosphor)" }}>operator console →</span>
                    </MenuLink>
                  )}

                  {/* Orgs section — only shown when the user belongs to any or
                      we want to surface the new-org affordance. */}
                  <div style={{ height: 1, background: "var(--line-2)", margin: "4px 0" }} />
                  <div style={{
                    padding: "6px 12px 4px", fontFamily: "var(--mono)", fontSize: 10,
                    color: "var(--muted)", letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}>
                    organizations
                  </div>
                  {orgs.length === 0 ? (
                    <div style={{ padding: "4px 12px 6px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted-2)" }}>
                      not in any yet
                    </div>
                  ) : (
                    orgs.map((o) => (
                      <MenuLink key={o.name} href={`/org/${o.name}`}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                          {o.displayName || o.name}
                        </span>
                      </MenuLink>
                    ))
                  )}
                  <MenuLink href="/orgs/new">
                    <span style={{ color: "var(--phosphor)" }}>+ new organization</span>
                  </MenuLink>

                  <div style={{ height: 1, background: "var(--line-2)", margin: "4px 0" }} />
                  <button
                    onClick={signOut}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "8px 12px", fontSize: 13, background: "transparent",
                      border: 0, color: "var(--ink)", cursor: "pointer",
                    }}
                  >
                    sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/signin" style={{
              fontFamily: "var(--mono)", fontSize: 11.5,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>sign in</Link>
            <Link href="/signup" style={{
              display: "inline-flex", alignItems: "center", height: 26,
              padding: "0 12px", borderRadius: 2,
              background: "var(--phosphor)", color: "var(--phosphor-ink)",
              fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              create key
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: "block", padding: "8px 12px", fontSize: 13,
      color: "var(--ink)",
    }}>
      {children}
    </Link>
  );
}

function AppearancePopover({
  theme, setTheme,
}: { theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void }) {
  return (
    <div
      style={{
        position: "absolute", right: 0, top: 34, width: 240, zIndex: 30,
        background: "var(--panel)", color: "var(--ink)",
        border: "1px solid var(--line)", borderRadius: "var(--r-md)",
        boxShadow: "0 12px 32px -16px rgba(0,0,0,0.6)",
        padding: "4px 0",
      }}
    >
      <div style={{
        padding: "8px 12px",
        fontFamily: "var(--mono)", fontSize: 11,
        color: "var(--muted)", borderBottom: "1px solid var(--line-2)",
        letterSpacing: "0.1em", textTransform: "uppercase",
      }}>
        APPEARANCE
      </div>
      <ThemeRow active={theme === "dark"} onClick={() => setTheme("dark")} label="dark · instrument" hint="default · phosphor-on-black" glyph={<MoonGlyph />} />
      <ThemeRow active={theme === "light"} onClick={() => setTheme("light")} label="light · clinical" hint="white · graph-paper" glyph={<SunGlyph />} />
      <div style={{ height: 1, background: "var(--line-2)", margin: "4px 0" }} />
      <Link
        href="/settings"
        style={{
          display: "block", padding: "8px 12px",
          fontFamily: "var(--mono)", fontSize: 11,
          color: "var(--muted)", letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >more settings →</Link>
    </div>
  );
}

function ThemeRow({
  active, onClick, label, hint, glyph,
}: {
  active: boolean; onClick: () => void;
  label: string; hint: string; glyph: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left",
        display: "grid", gridTemplateColumns: "22px 1fr auto",
        gap: 10, alignItems: "center",
        padding: "8px 12px",
        background: "transparent", color: "var(--ink)",
        border: 0, cursor: "pointer",
      }}
    >
      <span style={{
        width: 18, height: 18, display: "inline-flex",
        alignItems: "center", justifyContent: "center",
        color: active ? "var(--phosphor)" : "var(--muted)",
      }}>{glyph}</span>
      <span>
        <span style={{ fontSize: 13, fontWeight: 500, display: "block" }}>{label}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)" }}>{hint}</span>
      </span>
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
    </button>
  );
}

function MoonGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6 1.5a.75.75 0 0 1 .75.75v.25c.66.12 1.28.37 1.83.71a.75.75 0 1 1-.83 1.25 5 5 0 1 0 4.79 4.79.75.75 0 0 1 1.25-.83c.34.55.59 1.17.71 1.83h.25a.75.75 0 0 1 0 1.5h-.25A6.5 6.5 0 1 1 5.25 2.5V2.25A.75.75 0 0 1 6 1.5Z" />
    </svg>
  );
}

function SunGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 0v2M8 14v2M0 8h2M14 8h2M2.3 2.3l1.4 1.4M12.3 12.3l1.4 1.4M2.3 13.7l1.4-1.4M12.3 3.7l1.4-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================
// SearchBox — live cross-entity search with `/` shortcut
// ============================================================

type SearchUser = {
  username: string;
  fingerprint: string;
  verified: boolean;
  verifiedAs: string | null;
  verifiedKind: string | null;
};
type SearchRepo = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  description: string | null;
  featured: boolean;
};
type SearchResult = { users: SearchUser[]; repos: SearchRepo[] };

function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult>({ users: [], repos: [] });
  const [hl, setHl] = useState(0); // highlighted result index
  const inputRef = useRef<HTMLInputElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // `/` focuses the input (unless something else has focus)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (!q.trim()) {
      setResults({ users: [], repos: [] });
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal })
        .then((r) => r.ok ? r.json() : { users: [], repos: [] })
        .then((j: SearchResult) => {
          setResults(j);
          setHl(0);
        })
        .catch(() => {});
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const flat: { kind: "user" | "repo"; ref: SearchUser | SearchRepo }[] = [
    ...results.users.map((u) => ({ kind: "user" as const, ref: u })),
    ...results.repos.map((r) => ({ kind: "repo" as const, ref: r })),
  ];

  function go(idx: number) {
    const item = flat[idx];
    if (!item) return;
    if (item.kind === "user") {
      router.push(`/${(item.ref as SearchUser).username}`);
    } else {
      const r = item.ref as SearchRepo;
      router.push(`/${r.owner}/${r.name}`);
    }
    setQ("");
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div ref={boxRef} className="search" style={{ position: "relative", padding: 0 }}>
      <svg
        width="11" height="11" viewBox="0 0 16 16" fill="currentColor"
        style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.6, pointerEvents: "none" }}
      >
        <path d="M10.68 11.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z" />
      </svg>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setHl((h) => Math.min(h + 1, flat.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setHl((h) => Math.max(h - 1, 0)); }
          if (e.key === "Enter") { e.preventDefault(); go(hl); }
        }}
        placeholder="jump to user or repo —"
        spellCheck={false}
        autoComplete="off"
        style={{
          flex: 1, height: "100%", padding: "0 32px 0 30px",
          background: "transparent", border: 0, outline: "none",
          color: "#fff", fontFamily: "var(--mono)", fontSize: 11.5,
          letterSpacing: 0,
        }}
      />
      <kbd style={{
        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
        fontFamily: "var(--mono)", fontSize: 9.5, opacity: 0.7,
        padding: "1px 5px", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 2, pointerEvents: "none",
      }}>/</kbd>

      {open && (q.trim().length > 0) && (
        <SearchDropdown q={q} results={results} hl={hl} setHl={setHl} go={go} />
      )}
    </div>
  );
}

function SearchDropdown({
  q, results, hl, setHl, go,
}: {
  q: string; results: SearchResult;
  hl: number; setHl: (h: number) => void;
  go: (i: number) => void;
}) {
  const total = results.users.length + results.repos.length;
  return (
    <div
      style={{
        position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)",
        background: "var(--panel)", color: "var(--ink)",
        border: "1px solid var(--line)", borderRadius: "var(--r-md)",
        boxShadow: "0 12px 32px -16px rgba(0,0,0,0.6)",
        zIndex: 40, padding: "4px 0", minWidth: 380,
      }}
    >
      {total === 0 ? (
        <div style={{
          padding: "16px 14px", fontFamily: "var(--mono)", fontSize: 12,
          color: "var(--muted)", textAlign: "center",
        }}>
          no matches for &ldquo;{q}&rdquo;
        </div>
      ) : (
        <>
          {results.users.length > 0 && (
            <>
              <div style={{
                padding: "6px 14px", fontFamily: "var(--mono)", fontSize: 10.5,
                color: "var(--muted)", letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                USERS · {results.users.length}
              </div>
              {results.users.map((u, i) => (
                <SearchRow
                  key={`u-${u.username}`}
                  active={hl === i}
                  onHover={() => setHl(i)}
                  onClick={() => go(i)}
                >
                  <FingerprintSigil seed={`${u.username}@siphr ${u.fingerprint}`} size={22} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13 }}>
                      {u.username}
                      {u.verified && (
                        <span style={{
                          marginLeft: 8, fontFamily: "var(--mono)", fontSize: 10,
                          color: "var(--mint)",
                        }}>✓ verified</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)" }}>
                      fp {u.fingerprint.slice(0, 16)}…
                    </div>
                  </div>
                </SearchRow>
              ))}
            </>
          )}
          {results.repos.length > 0 && (
            <>
              <div style={{
                padding: "6px 14px", marginTop: results.users.length > 0 ? 4 : 0,
                fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)",
                letterSpacing: "0.1em", textTransform: "uppercase",
                borderTop: results.users.length > 0 ? "1px solid var(--line-2)" : undefined,
                paddingTop: results.users.length > 0 ? 8 : 6,
              }}>
                REPOS · {results.repos.length}
              </div>
              {results.repos.map((r, i) => {
                const idx = results.users.length + i;
                return (
                  <SearchRow
                    key={`r-${r.id}`}
                    active={hl === idx}
                    onHover={() => setHl(idx)}
                    onClick={() => go(idx)}
                  >
                    <FingerprintSigil seed={`${r.owner}/${r.name} ${r.id.slice(0, 6)}`} size={22} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                        <span><span style={{ color: "var(--muted)" }}>{r.owner}/</span>{r.name}</span>
                        {r.featured && <Pill>★ featured</Pill>}
                        <Pill variant="public">public</Pill>
                      </div>
                      {r.description && (
                        <div style={{
                          fontSize: 11.5, color: "var(--muted)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{r.description}</div>
                      )}
                    </div>
                  </SearchRow>
                );
              })}
            </>
          )}
        </>
      )}
      <div style={{
        padding: "6px 14px", borderTop: "1px solid var(--line-2)",
        fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted-2)",
        letterSpacing: "0.06em",
      }}>
        ↳ press <kbd style={{ fontFamily: "inherit", color: "var(--ink)" }}>↑↓</kbd> to navigate · <kbd style={{ fontFamily: "inherit", color: "var(--ink)" }}>enter</kbd> to open · <kbd style={{ fontFamily: "inherit", color: "var(--ink)" }}>esc</kbd> to close
      </div>
    </div>
  );
}

function SearchRow({
  active, onHover, onClick, children,
}: {
  active: boolean; onHover: () => void;
  onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      style={{
        width: "100%", textAlign: "left",
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 14px",
        background: active ? "var(--panel-2)" : "transparent",
        color: "var(--ink)",
        border: 0, cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
