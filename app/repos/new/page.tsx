"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { FingerprintSigil, LockGlyph } from "@/components/Primitives";

export default function NewRepoPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(localStorage.getItem("siphr:current_user"));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!user) throw new Error("Not signed in.");
      let wrappedKeys: Record<string, unknown> = {};
      let repoKey: Uint8Array | null = null;
      if (visibility === "private") {
        const { generateRepoKey, wrapRepoKey } = await import("@/lib/crypto");
        repoKey = await generateRepoKey();
        const usersRes = await fetch(`/api/users/${user}`);
        if (!usersRes.ok) throw new Error("Could not load your public key");
        const me = await usersRes.json();
        const wrapped = await wrapRepoKey(repoKey, me.publicKeyJwk);
        wrappedKeys = { [user]: wrapped };
      }
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ owner: user, name, visibility, wrappedKeys, description: description || null }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Server error");
      if (repoKey) {
        sessionStorage.setItem(`siphr:repokey:${j.id}`, btoa(String.fromCharCode(...repoKey)));
      }
      router.push(`/${user}/${name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <>
      <TopNav />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 6vw" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>↳ new repository</div>
        <h1 className="serif" style={{ fontSize: 48, letterSpacing: "-0.02em" }}>
          Generate a <em style={{ color: "var(--copper)" }}>repo key</em> and a repository.
        </h1>
        <p style={{ marginTop: 14, fontSize: 15, color: "var(--ink-2)", maxWidth: 560 }}>
          For private repos, a fresh 256-bit AES key is generated in this browser and wrapped to your public key.
          The server only ever sees ciphertext.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 36 }}>
          <div className="card" style={{ padding: 22, marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>owner / repository</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 14px", border: "1px solid var(--line)",
                borderRadius: 6, fontFamily: "var(--mono)", fontSize: 13,
                background: "var(--paper-2)",
              }}>
                {user && <FingerprintSigil seed={`${user}@siphr`} size={16} />}
                {user ?? "you"}
              </span>
              <span style={{ fontSize: 22, color: "var(--muted-2)" }}>/</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="hello-world"
                className="input mono"
                style={{ maxWidth: 340 }}
              />
            </div>
            <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              ↳ short, memorable, mostly lowercase
            </div>
          </div>

          <div className="card" style={{ padding: 22, marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>description (optional)</div>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="a short description"
            />
            <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              ↳ descriptions for private repos are encrypted at rest
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
            <VisibilityOption
              selected={visibility === "private"}
              onClick={() => setVisibility("private")}
              title="private — end-to-end encrypted"
              body="A fresh 256-bit AES key is generated in this browser and wrapped to your public key. Siphr stores ciphertext only."
              tag="aes-256-gcm · pbkdf2 · ecdh wrap"
            />
            <VisibilityOption
              selected={visibility === "public"}
              onClick={() => setVisibility("public")}
              title="public"
              body="Stored as plaintext, like any forge. Anyone can read it. Siphr still won't track who views."
              tag="plaintext storage"
              variant="public"
            />
          </div>

          {error && (
            <div style={{
              padding: "10px 12px", marginBottom: 14, borderRadius: 6,
              background: "rgba(138,42,31,0.08)", color: "var(--rust)",
              fontSize: 13, fontFamily: "var(--mono)",
            }}>{error}</div>
          )}

          <div style={{ display: "flex", gap: 12, alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <button type="submit" disabled={busy || !name || !user} className="btn copper">
              {busy ? "creating repository…" : "create repository"}
            </button>
            <Link href="/dashboard" className="btn ghost">cancel</Link>
          </div>
        </form>
      </main>
    </>
  );
}

function VisibilityOption({
  selected, onClick, title, body, tag, variant = "private",
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  body: string;
  tag: string;
  variant?: "private" | "public";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left",
        padding: "16px 18px", borderRadius: 6,
        display: "flex", gap: 16, alignItems: "flex-start",
        border: selected ? "1px solid var(--copper)" : "1px solid var(--line)",
        background: selected ? "var(--copper-bg)" : "#fffdf7",
        cursor: "pointer", transition: "border 0.12s, background 0.12s",
      }}
    >
      <div style={{
        marginTop: 2, color: variant === "private" ? "#7a5a16" : "var(--moss)",
      }}>
        {variant === "private" ? <LockGlyph size={16} /> : <GlobeGlyph />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{body}</div>
        <div style={{
          marginTop: 8, fontFamily: "var(--mono)", fontSize: 11,
          color: "var(--muted)",
        }}>↳ {tag}</div>
      </div>
      <input type="radio" checked={selected} readOnly style={{ marginTop: 6 }} />
    </button>
  );
}

function GlobeGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm6.5 8a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z" />
      <path d="M0 8h16M8 0v16" stroke="currentColor" strokeWidth="0.8" fill="none" />
    </svg>
  );
}
