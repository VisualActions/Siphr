"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";

type Props = {
  active?: "explore" | "featured" | "security" | "transparency" | "settings" | null;
};

export default function TopNav({ active = null }: Props) {
  const [user, setUser] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const appearanceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setUser(localStorage.getItem("siphr:current_user"));
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

  function signOut() {
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

      <div className="search">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.6 }}>
          <path d="M10.68 11.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z" />
        </svg>
        <span>jump_to —</span>
        <kbd style={{
          marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 9.5,
          opacity: 0.7, padding: "1px 5px",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2,
        }}>/</kbd>
      </div>

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
