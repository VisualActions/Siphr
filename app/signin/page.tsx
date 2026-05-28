"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { FingerprintSigil } from "@/components/Primitives";
import { decryptIdentity, fingerprint, type EncryptedIdentity } from "@/lib/crypto";

export default function SigninPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let encrypted: EncryptedIdentity | null = null;
      const raw = localStorage.getItem(`siphr:identity:${username}`);
      if (raw) {
        encrypted = JSON.parse(raw) as EncryptedIdentity;
      } else {
        const res = await fetch(`/api/users/${encodeURIComponent(username)}/identity`);
        if (res.status === 404) throw new Error("No account with that username.");
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        const j = await res.json();
        encrypted = j.encryptedIdentity as EncryptedIdentity;
      }

      if (!encrypted) throw new Error("Could not load identity.");

      // Decrypt locally first — this proves the passphrase is correct in a
      // way the user immediately sees (wrong passphrase = clean error here,
      // not a confusing 401 from the server).
      const id = await decryptIdentity(encrypted, passphrase);
      await fingerprint(id.publicKeyJwk);

      // Establish a server session. Server hashes the passphrase with scrypt,
      // verifies (or enrolls if this is a legacy account), and sets an
      // httpOnly cookie. The passphrase only crosses the wire here, over HTTPS.
      const authRes = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, passphrase }),
      });
      if (!authRes.ok) {
        const j = await authRes.json().catch(() => ({}));
        throw new Error(j.error ?? `Sign-in failed (${authRes.status})`);
      }

      localStorage.setItem(`siphr:identity:${username}`, JSON.stringify(encrypted));
      localStorage.setItem("siphr:current_user", username);
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      setError(
        msg.includes("operation-specific reason") || msg.toLowerCase().includes("operation")
          ? "Wrong passphrase."
          : msg
      );
      setBusy(false);
    }
  }

  return (
    <>
      <TopNav />
      <main style={{ padding: "64px 6vw 80px", minHeight: "calc(100vh - 64px)" }}>
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-block", marginBottom: 14 }}>
              <FingerprintSigil seed={username || "siphr-pending"} size={72} />
            </div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>↳ unlock your identity</div>
            <h1 className="serif" style={{ fontSize: 36, letterSpacing: "-0.02em" }}>
              Sign in to <em style={{ color: "var(--copper)" }}>Siphr.</em>
            </h1>
          </div>

          <form onSubmit={onSubmit} className="card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>username</div>
              <input
                className="input mono"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <div className="eyebrow">passphrase</div>
                <a href="/security#recovery" style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--copper)" }}>
                  lost it?
                </a>
              </div>
              <input
                type="password"
                className="input mono"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••••••"
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 12px", marginBottom: 14, borderRadius: 6,
                background: "rgba(138,42,31,0.08)", color: "var(--rust)",
                fontSize: 13, fontFamily: "var(--mono)",
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn copper"
              style={{ width: "100%" }}
            >
              {busy ? "unwrapping key…" : "unlock"}
            </button>

            <p style={{
              marginTop: 14, fontSize: 12, lineHeight: 1.55,
              color: "var(--muted)", fontFamily: "var(--mono)",
            }}>
              ↳ encrypted identity is fetched from Siphr; the passphrase that unwraps it never leaves this browser.
            </p>
          </form>

          <div style={{
            marginTop: 14, padding: "14px 16px",
            textAlign: "center", fontSize: 13,
            border: "1px solid var(--line)", borderRadius: 6, background: "var(--panel)",
          }}>
            New to Siphr? <Link href="/signup" style={{ color: "var(--copper)", fontWeight: 500 }}>create an account →</Link>
          </div>
        </div>
      </main>
    </>
  );
}
