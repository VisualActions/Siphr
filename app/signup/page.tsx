"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    if (!/^[a-z0-9_-]{3,32}$/.test(username)) {
      setError("Username must be 3-32 chars: a-z, 0-9, _, -");
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

      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
      setStep("form");
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <a href="/" className="text-sm text-[color:var(--color-muted)] hover:text-white">
        ← back
      </a>
      <h1 className="mt-6 text-3xl font-medium tracking-tight">Create an account</h1>
      <p className="mt-2 text-sm text-[color:var(--color-muted)]">
        Your keys are generated in this browser. The passphrase never leaves it.
      </p>

      {step === "done" && fp && (
        <div className="mt-8 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)] p-5">
          <div className="text-sm font-medium mb-1">Identity created</div>
          <div className="text-xs text-[color:var(--color-muted)]">Fingerprint</div>
          <div className="font-mono text-sm mt-1">{fp}</div>
          <div className="mt-3 text-xs text-[color:var(--color-muted)]">
            Redirecting to your dashboard…
          </div>
        </div>
      )}

      {step !== "done" && (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field
            label="username"
            value={username}
            onChange={setUsername}
            placeholder="alex"
            disabled={step === "generating"}
            autoComplete="username"
          />
          <Field
            label="passphrase"
            value={passphrase}
            onChange={setPassphrase}
            type="password"
            placeholder="at least 12 characters"
            disabled={step === "generating"}
            autoComplete="new-password"
          />
          <Field
            label="confirm passphrase"
            value={confirm}
            onChange={setConfirm}
            type="password"
            disabled={step === "generating"}
            autoComplete="new-password"
          />

          {error && (
            <div className="text-sm text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={step === "generating"}
            className="w-full rounded-md bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50"
          >
            {step === "generating" ? "Generating keys…" : "Create account"}
          </button>

          <p className="text-xs text-[color:var(--color-muted)] leading-relaxed pt-2">
            If you lose this passphrase, your private repos are unrecoverable.
            That's the same property that means we can't hand them over either.
          </p>
        </form>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-[color:var(--color-muted)] mb-1.5 font-mono">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm placeholder:text-[color:var(--color-muted)]/60 focus:outline-none focus:border-white/30"
      />
    </label>
  );
}
