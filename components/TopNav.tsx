"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiphrMark } from "./Primitives";

type Props = { active?: "explore" | "featured" | "security" | "transparency" | null };

export default function TopNav({ active = null }: Props) {
  const [user, setUser] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(localStorage.getItem("siphr:current_user"));
  }, []);

  function signOut() {
    localStorage.removeItem("siphr:current_user");
    window.location.href = "/";
  }

  const linkColor = (k: typeof active) =>
    active === k ? "#fff" : "rgba(255,255,255,0.78)";

  return (
    <header className="siphr-topnav">
      <Link href={user ? "/dashboard" : "/"} className="brand">
        <SiphrMark size={20} />
        <span>siphr</span>
      </Link>

      <div className="search">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10.68 11.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z" />
        </svg>
        <span>search or jump to…</span>
        <span style={{
          marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10,
          opacity: 0.6, padding: "1px 5px",
          border: "1px solid rgba(255,255,255,0.2)", borderRadius: 3,
        }}>/</span>
      </div>

      <nav className="navlinks">
        <Link href="/explore" style={{ color: linkColor("explore") }}>explore</Link>
        <Link href="/featured" style={{ color: linkColor("featured") }}>featured</Link>
        <Link href="/security" style={{ color: linkColor("security") }}>security</Link>
        <Link href="/transparency" style={{ color: linkColor("transparency") }}>transparency</Link>
      </nav>

      <div className="right">
        {user ? (
          <>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
              key loaded
            </span>
            <Link
              href="/repos/new"
              title="new repository"
              style={{
                color: "#fff", display: "inline-flex", alignItems: "center",
                justifyContent: "center", width: 28, height: 28, borderRadius: 6,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
              </svg>
            </Link>
            <div style={{ position: "relative" }}>
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
                    position: "absolute", right: 0, top: 36, width: 220, zIndex: 20,
                    background: "#fffdf7", color: "var(--ink)",
                    border: "1px solid var(--line)", borderRadius: "var(--r-md)",
                    boxShadow: "0 12px 32px -16px rgba(26,24,20,0.4)",
                    padding: "6px 0",
                  }}
                >
                  <div style={{
                    padding: "8px 12px", fontSize: 12,
                    color: "var(--muted)", borderBottom: "1px solid var(--line-2)",
                  }}>
                    signed in as <span style={{ fontWeight: 600, color: "var(--ink)" }}>{user}</span>
                  </div>
                  <MenuLink href={`/${user}`}>your profile</MenuLink>
                  <MenuLink href="/dashboard">your repositories</MenuLink>
                  <MenuLink href="/transparency">transparency log</MenuLink>
                  {user === "siphr" && (
                    <MenuLink href="/admin">
                      <span style={{ color: "var(--copper)" }}>operator console →</span>
                    </MenuLink>
                  )}
                  <div style={{ height: 1, background: "var(--line-2)", margin: "4px 0" }} />
                  <button
                    onClick={signOut}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "6px 12px", fontSize: 13, background: "transparent",
                      border: 0, color: "var(--ink)",
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
            <Link href="/signin" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>sign in</Link>
            <Link href="/signup" style={{
              display: "inline-flex", alignItems: "center", height: 30,
              padding: "0 14px", borderRadius: 6,
              background: "var(--copper)", color: "#fff",
              fontSize: 13, fontWeight: 500,
            }}>
              create key
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) { // eslint-disable-line
  return (
    <Link href={href} style={{
      display: "block", padding: "6px 12px", fontSize: 13,
      color: "var(--ink)",
    }}>
      {children}
    </Link>
  );
}
