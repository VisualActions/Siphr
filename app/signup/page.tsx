"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { FingerprintSigil } from "@/components/Primitives";
import {
  encryptIdentity,
  fingerprint,
  generateIdentity,
} from "@/lib/crypto";

type Step = "form" | "generating" | "done";

const STAGES = ["entropy", "keygen", "wrap", "encrypt", "store"] as const;
type Stage = typeof STAGES[number];

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [stage, setStage] = useState<Stage>("entropy");
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
    setStage("entropy");

    try {
      await new Promise((r) => setTimeout(r, 320));
      setStage("keygen");
      const identity = await generateIdentity();
      setStage("wrap");
      const fpHex = await fingerprint(identity.publicKeyJwk);
      setFp(fpHex);
      const encrypted = await encryptIdentity(identity, passphrase);
      setStage("encrypt");
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
      setStage("store");
      localStorage.setItem(`siphr:identity:${username}`, JSON.stringify(encrypted));
      localStorage.setItem("siphr:current_user", username);
      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
      setStep("form");
    }
  }

  return (
    <>
      <TopNav />
      <main style={{ padding: "56px 6vw 80px" }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 0.85fr)",
          gap: 56,
        }}>
          {/* LEFT — the ceremony itself */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              ↳ step {step === "form" ? "01" : "02"} of 04 · creating your account
            </div>
            <h1 className="serif" style={{ fontSize: 56, letterSpacing: "-0.025em", lineHeight: 1.02 }}>
              {step === "done" ? (
                <>Your identity is <em style={{ color: "var(--copper)" }}>live.</em></>
              ) : step === "generating" ? (
                <>Generating your <em style={{ color: "var(--copper)" }}>identity.</em></>
              ) : (
                <>Choose a <em style={{ color: "var(--copper)" }}>handle</em> and a passphrase.</>
              )}
            </h1>
            <p style={{ marginTop: 16, fontSize: 16, color: "var(--ink-2)", maxWidth: 560 }}>
              {step === "done" ? (
                <>Welcome to Siphr. Your private key lives in this browser only — we never see it.</>
              ) : (
                <>This happens in your browser. No part of this transaction leaves your machine. Sit with it — the
                key being generated right now is the one we&apos;ll wrap your repo keys to, forever.</>
              )}
            </p>

            <StepIndicator step={step} stage={stage} />

            <form onSubmit={onSubmit}>
              <div className="card" style={{ marginTop: 36, padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr" }}>
                  {/* sigil column */}
                  <div style={{
                    padding: "32px 32px 28px",
                    borderRight: "1px solid var(--line)",
                    background: "var(--paper-2)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    minWidth: 240,
                  }}>
                    <div style={{ position: "relative" }}>
                      <FingerprintSigil
                        seed={fp ?? (username ? `${username}@siphr ${username}` : "siphr-pending")}
                        size={160}
                      />
                      {step === "generating" && (
                        <div style={{
                          position: "absolute", inset: -8,
                          border: "1px dashed var(--copper)",
                          borderRadius: 8, pointerEvents: "none",
                        }} />
                      )}
                    </div>
                    <div style={{
                      marginTop: 22, fontFamily: "var(--mono)", fontSize: 10,
                      letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)",
                    }}>
                      {fp ? "fingerprint" : "fingerprint emerging"}
                    </div>
                    <div style={{
                      marginTop: 8, fontFamily: "var(--mono)", fontSize: 14,
                      fontWeight: 600, letterSpacing: "0.04em",
                    }}>
                      {fp ? formatFp(fp).slice(0, 19) : "· · · · · · · · · ·"}
                    </div>
                    {fp && (
                      <div style={{
                        marginTop: 2, fontFamily: "var(--mono)", fontSize: 11,
                        color: "var(--muted-2)",
                      }}>
                        {formatFp(fp).slice(20)}
                      </div>
                    )}
                  </div>

                  {/* form column */}
                  <div style={{ padding: "26px 32px" }}>
                    <div className="eyebrow" style={{ marginBottom: 16 }}>
                      {step === "form" ? "what we need" : "what's happening"}
                    </div>

                    {step === "form" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <Field
                          label="username"
                          hint="3–32 chars · letters, numbers, _, -"
                        >
                          <input
                            className="input mono"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            placeholder="r"
                          />
                        </Field>
                        <Field
                          label="passphrase"
                          hint="12+ chars · wraps your private key locally · never sent"
                        >
                          <input
                            type="password"
                            className="input mono"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            autoComplete="new-password"
                            placeholder="••••••••••••"
                          />
                        </Field>
                        <Field label="confirm passphrase">
                          <input
                            type="password"
                            className="input mono"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="new-password"
                          />
                        </Field>

                        {error && (
                          <div style={{
                            padding: "10px 12px", borderRadius: 6,
                            background: "rgba(138,42,31,0.08)", color: "var(--rust)",
                            fontSize: 13, fontFamily: "var(--mono)",
                          }}>{error}</div>
                        )}

                        <div className="hr" style={{ margin: "8px 0 4px" }} />

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div className="eyebrow">what siphr.dev will see</div>
                            <div style={{ marginTop: 6, fontFamily: "var(--mono)", fontSize: 12 }}>
                              public key only · <span style={{ color: "var(--moss)" }}>nothing else</span>
                            </div>
                          </div>
                          <button type="submit" className="btn copper">
                            generate identity
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <CeremonyStep
                          state={stageState("entropy", stage, step)}
                          label="collected 256 bits of entropy from this device"
                          detail="crypto.getRandomValues · ~3 ms"
                        />
                        <CeremonyStep
                          state={stageState("keygen", stage, step)}
                          label="generated P-256 ECDH keypair"
                          detail="public key fingerprint shown left"
                        />
                        <CeremonyStep
                          state={stageState("wrap", stage, step)}
                          label="wrapping private key with your passphrase"
                          detail="pbkdf2-sha256 · 600,000 iterations"
                        />
                        <CeremonyStep
                          state={stageState("encrypt", stage, step)}
                          label="encrypting wrapped key with AES-256-GCM"
                          detail=""
                        />
                        <CeremonyStep
                          state={stageState("store", stage, step)}
                          label="storing in this browser's local key store"
                          detail="never transmitted; backed up only by you"
                        />
                      </ul>
                    )}
                  </div>
                </div>

                {/* progress bar */}
                <div style={{ height: 4, background: "var(--paper-2)", position: "relative", overflow: "hidden" }}>
                  <div style={{
                    width: progressPct(step, stage),
                    height: "100%", background: "var(--copper)",
                    transition: "width 0.35s ease-out",
                  }} />
                </div>
              </div>
            </form>

            <div style={{ marginTop: 18, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", display: "flex", gap: 18, flexWrap: "wrap" }}>
              <span>↳ this takes a moment on purpose</span>
              <span>↳ everything runs in this tab</span>
              <span>↳ open devtools, you&apos;ll see only the public-key upload</span>
            </div>
          </div>

          {/* RIGHT — editorial side rail */}
          <aside style={{ paddingTop: 40 }}>
            <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 28 }}>
              <div className="eyebrow" style={{ marginBottom: 14 }}>↳ why we make you sit through this</div>
              <p className="serif" style={{ fontSize: 22, lineHeight: 1.32, letterSpacing: "-0.012em" }}>
                Most signups want to be invisible. This one wants to be remembered.
              </p>
              <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.65, color: "var(--ink-2)" }}>
                The private key being generated right now is the one thing that lets you read your code on Siphr.
                If you lose your passphrase, the data is unrecoverable — to you, and to anyone demanding it.
                That&apos;s the property doing the work.
              </p>

              <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 16px", fontSize: 13, lineHeight: 1.55 }}>
                <RowKV k="curve" v="P-256 (NIST SECG)" />
                <RowKV k="kdf" v="PBKDF2-SHA256, 600,000 iter" />
                <RowKV k="wrap" v="AES-256-GCM" />
                <RowKV k="entropy" v="crypto.getRandomValues" />
                <RowKV k="storage" v="localStorage + server blob" />
                <RowKV k="server sees" v={<span style={{ color: "var(--moss)" }}>public key only</span>} />
              </div>

              <div style={{
                marginTop: 32, padding: 16, background: "var(--amber-bg)",
                border: "1px solid rgba(184,138,36,0.35)", borderRadius: 6,
              }}>
                <div className="eyebrow" style={{ color: "#7a5a16", marginBottom: 8 }}>
                  ! the next page matters
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: "#5c4612" }}>
                  After signup, sign in from another device using the same username + passphrase — the encrypted
                  identity blob comes from the server, but only your passphrase can unlock it. <strong>If you forget
                  it, we can&apos;t reissue it.</strong>
                </p>
              </div>

              <div style={{ marginTop: 22, fontSize: 13, color: "var(--muted)" }}>
                Already have a key? <a href="/signin" style={{ color: "var(--copper)", textDecoration: "underline" }}>Sign in.</a>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function formatFp(fp: string): string {
  return fp.replace(/(.{4})/g, "$1 ").trim();
}

function progressPct(step: Step, stage: Stage): string {
  if (step === "form") return "12%";
  if (step === "done") return "100%";
  const idx = STAGES.indexOf(stage);
  return `${20 + (idx / (STAGES.length - 1)) * 75}%`;
}

function stageState(
  s: Stage,
  current: Stage,
  step: Step
): "done" | "active" | "pending" {
  if (step === "done") return "done";
  const i = STAGES.indexOf(s);
  const j = STAGES.indexOf(current);
  if (i < j) return "done";
  if (i === j) return "active";
  return "pending";
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ marginTop: 6, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{hint}</div>}
    </label>
  );
}

function StepIndicator({ step, stage }: { step: Step; stage: Stage }) {
  type S = "pending" | "active" | "done";
  const passphraseState: S = step === "form" ? "active" : "done";
  const keygenState: S = step === "form" ? "pending" : step === "done" ? "done" : "active";
  const verifyState: S = step === "done" ? "active" : "pending";
  const recoveryState: S = "pending";
  return (
    <div style={{
      marginTop: 32, display: "flex", gap: 0,
      fontFamily: "var(--mono)", fontSize: 11,
      letterSpacing: "0.08em", textTransform: "uppercase",
    }}>
      <StepDot n="01" label="passphrase" state={passphraseState} />
      <StepLine state={passphraseState === "done" ? "done" : "pending"} />
      <StepDot n="02" label="keygen" state={keygenState} />
      <StepLine state={keygenState === "done" ? "done" : "pending"} />
      <StepDot n="03" label="verify" state={verifyState} />
      <StepLine state="pending" />
      <StepDot n="04" label="recovery" state={recoveryState} />
    </div>
  );
}

function StepDot({ n, label, state }: { n: string; label: string; state: "pending" | "active" | "done" }) {
  const isActive = state === "active";
  const isDone = state === "done";
  const color = isDone ? "var(--moss)" : isActive ? "var(--copper)" : "var(--muted-2)";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 80 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 999,
        border: `1.5px solid ${color}`,
        background: isActive ? "var(--copper-bg)" : isDone ? "var(--moss-bg)" : "transparent",
        color, fontSize: 11, fontWeight: 600,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isDone ? "✓" : n.replace(/^0/, "")}
      </div>
      <div style={{ color, fontSize: 10 }}>{label}</div>
    </div>
  );
}

function StepLine({ state }: { state: "done" | "pending" }) {
  return <div style={{ flex: 1, height: 1, marginTop: 14, background: state === "done" ? "var(--moss)" : "var(--line)" }} />;
}

function CeremonyStep({
  state, label, detail,
}: { state: "pending" | "active" | "done"; label: string; detail?: string }) {
  const dotColor = state === "done" ? "var(--moss)" : state === "active" ? "var(--copper)" : "var(--muted-2)";
  const icon = state === "done" ? "✓" : state === "active" ? "⟳" : "○";
  return (
    <li style={{
      display: "grid", gridTemplateColumns: "auto 1fr", gap: 12,
      padding: "10px 0", borderBottom: "1px dashed var(--line)",
    }}>
      <div
        className={state === "active" ? "siphr-spin" : undefined}
        style={{
          width: 22, height: 22, borderRadius: 999,
          background: state === "active" ? "var(--copper-bg)" : "transparent",
          color: dotColor, fontFamily: "var(--mono)", fontWeight: 600, fontSize: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: state === "pending" ? "1px solid var(--line)" : "none",
        }}
      >{icon}</div>
      <div>
        <div style={{ fontSize: 14, color: state === "pending" ? "var(--muted)" : "var(--ink)" }}>{label}</div>
        {detail && <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{detail}</div>}
      </div>
    </li>
  );
}

function RowKV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", paddingTop: 2 }}>{k}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{v}</div>
    </>
  );
}
