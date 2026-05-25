"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function TopNav() {
  const [user, setUser] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(localStorage.getItem("siphr:current_user"));
  }, []);

  function signOut() {
    localStorage.removeItem("siphr:current_user");
    window.location.href = "/";
  }

  return (
    <header
      className="border-b"
      style={{ background: "#24292f", borderColor: "#24292f" }}
    >
      <div className="mx-auto max-w-[1280px] px-4 h-16 flex items-center gap-4">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0" style={{ color: "#fff" }}>
          <SiphrMark />
          <span className="hidden sm:inline font-semibold text-white">Siphr</span>
        </Link>

        <div className="flex-1 max-w-[480px]">
          <div
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.16)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <SearchIcon />
            <span>Search or jump to…</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: "rgba(255,255,255,0.2)" }}>/</kbd>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
          <Link href="/explore" style={{ color: "inherit" }} className="hover:text-white no-underline">Explore</Link>
          <a href="/security" style={{ color: "inherit" }} className="hover:text-white no-underline">Security</a>
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <Link
                href="/repos/new"
                title="New"
                className="rounded-md p-1.5"
                style={{
                  color: "#fff",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                <PlusIcon />
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-8 h-8 rounded-full text-sm font-semibold flex items-center justify-center"
                  style={{ background: "#0969da", color: "#fff" }}
                  aria-label="account"
                >
                  {user[0]?.toUpperCase()}
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-10 w-56 rounded-md py-1 z-10"
                    style={{
                      background: "#fff",
                      border: "1px solid var(--color-border)",
                      boxShadow: "var(--color-shadow-md)",
                    }}
                  >
                    <div className="px-3 py-2 text-xs text-[color:var(--color-fg-muted)] border-b border-[color:var(--color-border-muted)]">
                      Signed in as <span className="font-semibold text-[color:var(--color-fg)]">{user}</span>
                    </div>
                    <Link href={`/${user}`} className="block px-3 py-1.5 text-sm hover:bg-[color:var(--color-canvas-subtle)] no-underline text-[color:var(--color-fg)]">Your profile</Link>
                    <Link href="/dashboard" className="block px-3 py-1.5 text-sm hover:bg-[color:var(--color-canvas-subtle)] no-underline text-[color:var(--color-fg)]">Your repositories</Link>
                    <Link href="/settings/keys" className="block px-3 py-1.5 text-sm hover:bg-[color:var(--color-canvas-subtle)] no-underline text-[color:var(--color-fg)]">Keys &amp; security</Link>
                    <div className="border-t border-[color:var(--color-border-muted)] my-1" />
                    <button
                      onClick={signOut}
                      className="block w-full text-left px-3 py-1.5 text-sm hover:bg-[color:var(--color-canvas-subtle)] text-[color:var(--color-fg)]"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/signin" className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>Sign in</Link>
              <Link href="/signup" className="btn btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function SiphrMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect x="3" y="3" width="22" height="22" rx="6" fill="#fff" />
      <path
        d="M9 14.5 L13 18 L19 10.5"
        stroke="#1f883d"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M10.68 11.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
    </svg>
  );
}
