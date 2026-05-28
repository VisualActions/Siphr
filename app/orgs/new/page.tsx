"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";

export default function NewOrgPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(localStorage.getItem("siphr:current_user"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!currentUser) {
      setError("sign in to create an org");
      return;
    }
    if (!name.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/orgs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          displayName: displayName.trim() || null,
          description: description.trim() || null,
          founder: currentUser,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "create failed");
      router.push(`/org/${j.org.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
      setBusy(false);
    }
  }

  return (
    <>
      <TopNav />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "44px 6vw 80px" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>↳ /orgs/new</div>
        <h1 className="serif" style={{ fontSize: 44, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
          New organization.
        </h1>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>
          A namespace for company repos with shared collaborators. You&apos;ll be
          the founding owner; add others from the org page.
        </p>

        {!currentUser && (
          <div className="card" style={{ marginTop: 26, padding: 16 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
              ↳ <Link href="/signin" style={{ color: "var(--phosphor)" }}>sign in</Link> to continue
            </div>
          </div>
        )}

        {currentUser && (
          <form onSubmit={submit} style={{ marginTop: 30 }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Handle *</label>
              <input
                className="input mono"
                style={{ marginTop: 8 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="acmecorp"
                autoComplete="off"
                spellCheck={false}
                maxLength={32}
              />
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                ↳ used in urls · must not collide with a user handle
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Display name</label>
              <input
                className="input"
                style={{ marginTop: 8 }}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ACME Corporation"
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="optional short description"
                style={{
                  marginTop: 8, width: "100%",
                  border: "1px solid var(--line)", borderRadius: 2,
                  padding: "10px 14px", fontFamily: "var(--sans)", fontSize: 13.5,
                  background: "var(--panel)", resize: "vertical",
                }}
              />
            </div>

            {error && (
              <div style={{
                marginTop: 8, padding: "8px 12px", borderRadius: 2,
                background: "color-mix(in oklab, var(--signal) 10%, transparent)",
                color: "var(--signal)", fontFamily: "var(--mono)", fontSize: 12,
              }}>{error}</div>
            )}

            <div style={{
              marginTop: 30, display: "flex",
              justifyContent: "flex-end", gap: 10,
            }}>
              <Link href="/dashboard" className="btn ghost">cancel</Link>
              <button
                type="submit"
                className="btn primary"
                disabled={busy || !name.trim()}
                style={{ opacity: busy || !name.trim() ? 0.55 : 1 }}
              >
                {busy ? "creating…" : "create org"}
              </button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
