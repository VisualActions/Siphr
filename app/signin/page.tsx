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
      const raw = localStorage.getItem(`siphr:identity:${username}`);
      if (!raw) {
        throw new Error(
          "No local identity for that username in this browser. Sign in on the device you signed up on, or restore from a recovery code."
        );
      }
      const encrypted = JSON.parse(raw) as EncryptedIdentity;
      const id = await decryptIdentity(encrypted, passphrase);
      await fingerprint(id.publicKeyJwk);
      localStorage.setItem("siphr:current_user", username);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
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
          </form>
          <div className="box p-4 mt-4 text-center text-sm">
            New to Siphr? <Link href="/signup">Create an account</Link>
          </div>
        </div>
      </main>
    </>
  );
}
