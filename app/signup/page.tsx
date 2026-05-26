"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import {
  encryptIdentity,
  fingerprint,
  generateIdentity,
} from "@/lib/crypto";

type Step = "form" | "generating" | "done";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [fp, setFp] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (passphrase.length < 12) {
      setError("Passphrase must be at least 12 characters. There is no recovery.");
      return;
    }
    if (passphrase !== confirm) {
      setError("Passphrases don't match.");
      return;
    }
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(username)) {
      setError("Username must be 3–32 chars: letters, numbers, _, -");
      return;
    }
    if (/^-|-$/.test(username)) {
      setError("Username can't start or end with a dash.");
      return;
    }
    setStep("generating");
    try {
      const identity = await generateIdentity();
      const encrypted = await encryptIdentity(identity, passphrase);
      const fpHex = await fingerprint(identity.publicKeyJwk);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username,
          publicKeyJwk: identity.publicKeyJwk,
          encryptedIdentity: encrypted,
          fingerprint: fpHex,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(j.error ?? "Server error");
      }
      localStorage.setItem(`siphr:identity:${username}`, JSON.stringify(encrypted));
      localStorage.setItem("siphr:current_user", username);
      setFp(fpHex);
      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
      setStep("form");
    }
  }

  return (
    <>
      <TopNav />
      <main style={{ background: "var(--color-canvas-subtle)", minHeight: "calc(100vh - 64px)" }}>
        <div className="mx-auto max-w-[320px] pt-12 pb-12">
          <h1 className="text-2xl text-center font-light mb-6">Create your Siphr account</h1>

          {step === "done" && fp ? (
            <div className="box p-5 text-center">
              <div className="text-2xl mb-2">🔑</div>
              <div className="font-semibold mb-1">Identity created</div>
              <div className="text-xs text-[color:var(--color-fg-muted)] mt-3">Public key fingerprint</div>
              <div className="font-mono text-sm mt-1">{fp}</div>
              <div className="mt-4 text-sm text-[color:var(--color-fg-muted)]">
                Redirecting to your dashboard…
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="box p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={step === "generating"}
                  autoComplete="username"
                />
                <div className="text-xs text-[color:var(--color-fg-muted)] mt-1">
                  Letters, numbers, dashes, underscores. 3–32 chars.
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Passphrase</label>
                <input
                  type="password"
                  className="input"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  disabled={step === "generating"}
                  autoComplete="new-password"
                />
                <div className="text-xs text-[color:var(--color-fg-muted)] mt-1">
                  At least 12 characters. Wraps your private key locally — never sent to us.
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm passphrase</label>
                <input
                  type="password"
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={step === "generating"}
                  autoComplete="new-password"
                />
              </div>
              {error && <div className="text-sm" style={{ color: "#cf222e" }}>{error}</div>}
              <button
                type="submit"
                disabled={step === "generating"}
                className="btn btn-primary w-full"
                style={{ height: 36 }}
              >
                {step === "generating" ? "Generating keys…" : "Create account"}
              </button>
              <p className="text-xs text-[color:var(--color-fg-muted)] leading-relaxed">
                If you lose your passphrase, private repos are unrecoverable. That's the same property that means we can't hand them over either.
              </p>
            </form>
          )}

          <div className="box p-4 mt-4 text-center text-sm">
            Already have an account? <Link href="/signin">Sign in</Link>
          </div>
        </div>
      </main>
    </>
  );
}
