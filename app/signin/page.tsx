"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";
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
      // Try local cache first (avoids a round-trip on the device you signed up on).
      let encrypted: EncryptedIdentity | null = null;
      const raw = localStorage.getItem(`siphr:identity:${username}`);
      if (raw) {
        encrypted = JSON.parse(raw) as EncryptedIdentity;
      } else {
        // Fall back to the server's copy — works on any browser/device.
        const res = await fetch(`/api/users/${encodeURIComponent(username)}/identity`);
        if (res.status === 404) throw new Error("No account with that username.");
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        const j = await res.json();
        encrypted = j.encryptedIdentity as EncryptedIdentity;
      }

      if (!encrypted) throw new Error("Could not load identity.");

      const id = await decryptIdentity(encrypted, passphrase);
      await fingerprint(id.publicKeyJwk);

      // Cache locally for fast sign-ins next time.
      localStorage.setItem(`siphr:identity:${username}`, JSON.stringify(encrypted));
      localStorage.setItem("siphr:current_user", username);
      router.push("/dashboard");
    } catch (err) {
      // AES-GCM auth failure throws an OperationError — translate to a clearer message.
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
      <main style={{ background: "var(--color-canvas-subtle)", minHeight: "calc(100vh - 64px)" }}>
        <div className="mx-auto max-w-[320px] pt-12 pb-12">
          <h1 className="text-2xl text-center font-light mb-6">Sign in to Siphr</h1>
          <form onSubmit={onSubmit} className="box p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Passphrase</label>
                <a href="/security#recovery" className="text-xs">Lost passphrase?</a>
              </div>
              <input
                type="password"
                className="input"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && <div className="text-sm" style={{ color: "#cf222e" }}>{error}</div>}
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary w-full"
              style={{ height: 36 }}
            >
              {busy ? "Unwrapping key…" : "Sign in"}
            </button>
            <p className="text-xs text-[color:var(--color-fg-muted)] leading-relaxed">
              Your encrypted identity is fetched from Siphr; the passphrase that unwraps it never leaves this browser.
            </p>
          </form>
          <div className="box p-4 mt-4 text-center text-sm">
            New to Siphr? <Link href="/signup">Create an account</Link>
          </div>
        </div>
      </main>
    </>
  );
}
