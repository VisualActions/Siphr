"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import { ServerView } from "@/components/Primitives";

/**
 * /support — opens a pre-filled draft to support@siphr.dev in the user's
 * own mail client. By design there is no server inbox in the middle: the
 * page is static, the submit is a `mailto:` link, and nothing leaves the
 * browser until the user hits send.
 *
 * The form puts a routing tag in the subject line and tacks an opt-in
 * diagnostic block onto the body so support has the cross-reference fields
 * (fingerprint, repo oid, browser) without us being able to read the
 * underlying repo.
 */

const TO = "support@siphr.dev";

const CATEGORIES = [
  { id: "key",     label: "Key / recovery", hint: "lost passphrase · recovery codes · re-wrap" },
  { id: "repo",    label: "Repo / push",   hint: "git transport · refs · decrypt errors" },
  { id: "billing", label: "Billing",       hint: "orgs · invoices · plan changes" },
  { id: "abuse",   label: "Abuse",         hint: "report a public repo · org takeover" },
  { id: "sec",     label: "Security",      hint: "see signed-disclosure panel →" },
  { id: "other",   label: "Something else", hint: "" },
] as const;

type CatId = typeof CATEGORIES[number]["id"];

export default function SupportPage() {
  const [cat, setCat] = useState<CatId>("repo");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(
    "What I tried:\n  \n\nWhat happened:\n  \n\nWhat I expected:\n  "
  );
  const [fp, setFp] = useState("");
  const [attachDiag, setAttachDiag] = useState(true);
  const [attachRepo] = useState(false);
  const [signedInUser, setSignedInUser] = useState<string | null>(null);
  const [ua, setUa] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("siphr:current_user");
    setSignedInUser(u);
    setUa(typeof navigator !== "undefined" ? navigator.userAgent : "");
    if (u) {
      fetch(`/api/users/${encodeURIComponent(u)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j?.fingerprint && setFp(j.fingerprint))
        .catch(() => {});
    }
  }, []);

  const diag = useMemo(() => {
    const ts = new Date().toISOString();
    return [
      "---",
      "sent from /support · do not edit below this line",
      `ts            ${ts}`,
      `client        siphr-web · 0.4`,
      `ua            ${shortUA(ua)}`,
      `signed in     ${signedInUser ?? "no"}`,
      `fingerprint   ${attachDiag && fp ? fp : "(omitted)"}`,
      `repo          ${attachRepo ? "(opt-in)" : "(omitted)"}`,
      "---",
    ].join("\n");
  }, [ua, signedInUser, fp, attachDiag, attachRepo]);

  const finalBody = `${body}\n\n${diag}`;
  const finalSubject = subject.trim()
    ? `[${cat}] ${subject.trim()}`
    : `[${cat}] (no subject)`;
  const mailto =
    `mailto:${TO}` +
    `?subject=${encodeURIComponent(finalSubject)}` +
    `&body=${encodeURIComponent(finalBody)}`;

  return (
    <>
      <TopNav active="security" />
      <main style={{ padding: "44px 6vw 80px", maxWidth: 1180, margin: "0 auto" }}>
        {/* HEAD */}
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>↳ /support · get a human</div>
          <h1 className="display" style={{ fontSize: 64, lineHeight: 0.98, letterSpacing: "-0.03em" }}>
            Get help.<br />
            <span style={{ color: "var(--phosphor)" }}>Bring the context</span> we can&apos;t see.
          </h1>
          <p style={{ marginTop: 18, fontSize: 15, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 760 }}>
            Because your repos are end-to-end encrypted, we genuinely can&apos;t open them and look. That&apos;s
            a feature. The cost: when something breaks, the most useful person in the room is <em>you</em>. Fill
            this out and it&apos;ll open your mail client with a draft to{" "}
            <span style={{ fontFamily: "var(--mono)", color: "var(--phosphor)" }}>{TO}</span>.
            Nothing is sent through a Siphr inbox.
          </p>
        </div>

        {/* MAIN GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, alignItems: "start" }}>
          {/* LEFT — the form */}
          <div>
            {/* category */}
            <FormSection n="01" title="What's wrong" subtitle="picks the routing tag on the subject line">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {CATEGORIES.map((c) => {
                  const active = c.id === cat;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCat(c.id)}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        border: `1px solid ${active ? "var(--phosphor)" : "var(--line)"}`,
                        background: active ? "var(--phosphor-bg)" : "transparent",
                        borderRadius: 2,
                        color: "var(--ink)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 500 }}>
                        <span style={{
                          width: 10, height: 10,
                          border: `1px solid ${active ? "var(--phosphor)" : "var(--line)"}`,
                          background: active ? "var(--phosphor)" : "transparent",
                          borderRadius: 1, flex: "0 0 auto",
                        }} />
                        {c.label}
                      </span>
                      {c.hint && (
                        <span style={{
                          fontFamily: "var(--mono)", fontSize: 10.5,
                          color: "var(--muted-2)", letterSpacing: "0.02em", paddingLeft: 18,
                        }}>{c.hint}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </FormSection>

            {/* subject + body */}
            <FormSection n="02" title="What you'd tell a friend" subtitle="more useful than a stack trace">
              <div className="field-label">Subject</div>
              <input
                className="text-input"
                style={{ marginTop: 8, fontFamily: "var(--sans)" }}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="One-line summary"
                maxLength={140}
              />
              <div className="field-label" style={{ marginTop: 16 }}>Describe it</div>
              <textarea
                className="textarea"
                style={{
                  marginTop: 8, minHeight: 168,
                  fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.6,
                }}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div className="field-hint" style={{ marginTop: 6 }}>
                ↳ markdown ok · please don&apos;t paste private keys or passphrases · we&apos;ll ask you to rotate if you do
              </div>
            </FormSection>

            {/* context toggles */}
            <FormSection n="03" title="Context to share" subtitle="opt-in · stays in plaintext in the email body">
              <div className="card" style={{ overflow: "hidden" }}>
                <CtxRow
                  title="Your public-key fingerprint"
                  hint="lets us cross-reference rate-limit / auth logs · still ciphertext from our side"
                  right={
                    fp ? (
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-2)" }}>
                        {fp}
                      </span>
                    ) : (
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                        sign in to attach
                      </span>
                    )
                  }
                  toggle={attachDiag && !!fp}
                  onToggle={() => fp && setAttachDiag(!attachDiag)}
                />
                <CtxRow
                  title="Browser & client version"
                  hint="auto-detected from this session"
                  right={
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-2)" }}>
                      {shortUA(ua)}
                    </span>
                  }
                  toggle
                  forced
                  last
                />
              </div>
            </FormSection>

            {/* preview */}
            <FormSection n="04" title="Preview" subtitle="exactly what will be drafted in your mail client">
              <ServerView
                title={`MAIL → ${TO}`}
                lines={[
                  { k: "to",        v: TO,                                                  type: "plain" },
                  { k: "from",      v: "(your default mail account)",                       type: "plain" },
                  { k: "subject",   v: finalSubject,                                        type: "hex"   },
                  { k: "route",     v: "direct · no siphr.dev relay · no server inbox",     type: "plain" },
                  { k: "body",      v: previewLine(body),                                   type: "plain" },
                  {
                    k: "diag",
                    v: `fp ${attachDiag && fp ? "✓" : "✗"} · ua ✓`,
                    type: "plain",
                  },
                  { k: "repo body", v: "(not attached · still ciphertext on the server)",   type: "none"  },
                ]}
              />

              <div style={{
                marginTop: 22, paddingTop: 22,
                borderTop: "1px solid var(--line)",
                display: "flex", justifyContent: "space-between",
                alignItems: "center", gap: 18, flexWrap: "wrap",
              }}>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 11,
                  color: "var(--muted)", maxWidth: 380, lineHeight: 1.6,
                }}>
                  ↳ opens your default mail client with this draft addressed to{" "}
                  <span style={{ color: "var(--phosphor)" }}>{TO}</span><br />
                  ↳ typical first reply · &lt;1 business day · faster for billing &amp; abuse
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <CopyDraftButton subject={finalSubject} body={finalBody} />
                  <a className="btn primary" href={mailto}>
                    Send to {TO}
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </a>
                </div>
              </div>
            </FormSection>
          </div>

          {/* RIGHT — sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20 }}>
            {/* security disclosure */}
            <div className="card" style={{ padding: "18px 18px 16px", borderTop: "2px solid var(--signal)" }}>
              <div className="eyebrow" style={{ color: "var(--signal)", marginBottom: 6 }}>
                ↳ found a vulnerability?
              </div>
              <h3 style={{ fontSize: 18, letterSpacing: "-0.015em", marginBottom: 6 }}>
                Use signed disclosure.
              </h3>
              <p style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
                Don&apos;t put crypto bugs in this form. Mail a PGP-encrypted report to the security key below — we
                acknowledge within 24h and post-mortem publicly after the fix.
              </p>
              <a
                href="mailto:security@siphr.dev?subject=Vulnerability%20report"
                style={{
                  display: "block", marginTop: 10,
                  padding: "10px 12px", background: "var(--terminal-bg)", borderRadius: 2,
                  textDecoration: "none",
                }}
              >
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}>security@siphr.dev</div>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 11, color: "var(--phosphor-2)",
                  marginTop: 4, letterSpacing: "0.04em", wordBreak: "break-all",
                }}>
                  pgp · /.well-known/security.txt
                </div>
              </a>
            </div>

            {/* self-serve */}
            <div className="card" style={{ padding: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>↳ before you write</div>
              <SelfServe
                label="github"
                href="https://github.com/VisualActions/Siphr/issues"
                to="github.com/VisualActions/Siphr/issues"
                hint="bugs the team has acknowledged"
              />
              <SelfServe
                label="threat model"
                href="/security"
                to="/security"
                hint="what siphr can and can't do for you"
              />
              <SelfServe
                label="verify"
                href="/transparency"
                to="/transparency"
                hint="check the privacy claims yourself"
              />
              <SelfServe
                label="roadmap"
                href="/roadmap"
                to="/roadmap"
                hint={`current version · v0.4`}
                last
              />
            </div>

            {/* candor */}
            <div className="card" style={{ padding: 18, background: "var(--panel-2)" }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>↳ candor</div>
              <Helps tone="mint" t="Resetting your password — if you set up recovery codes (v0.7)." />
              <Helps tone="mint" t="Rotating a leaked collaborator key (you push the rotation, we don't)." />
              <Helps tone="mint" t="Account merges, org transfers, billing fixes." />
              <div className="hr dashed" style={{ margin: "10px 0" }} />
              <Helps tone="signal" t="Recovering files when you've lost both passphrase and recovery codes — impossible by design." />
              <Helps tone="signal" t="Reading your private repo on your behalf — we don't have a key." />
              <Helps tone="signal" t="Bypassing the encryption wall — same reason." />
            </div>

            <div style={{
              fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted-2)",
              letterSpacing: "0.04em", lineHeight: 1.7, padding: "0 4px",
            }}>
              ↳ /support is a static page · this form runs entirely in your browser<br />
              ↳ nothing is logged until your mail client actually sends
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function previewLine(body: string): string {
  const first = body.split("\n").find((l) => l.trim().length > 0) ?? "";
  return first.length > 56 ? `${first.slice(0, 56)}…` : first || "(empty)";
}

function shortUA(ua: string): string {
  if (!ua) return "(detecting)";
  // Very rough one-line UA — full string goes into the mail body anyway.
  const m =
    /Firefox\/[\d.]+/.exec(ua) ??
    /Chrome\/[\d.]+/.exec(ua) ??
    /Version\/[\d.]+.*Safari/.exec(ua);
  return m ? m[0] : ua.slice(0, 60);
}

function FormSection({
  n, title, subtitle, children,
}: { n: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={{
      display: "grid", gridTemplateColumns: "44px 1fr",
      gap: 18, marginBottom: 28,
    }}>
      <div style={{ position: "relative" }}>
        <div style={{
          width: 24, height: 24, borderRadius: 0,
          border: "1px solid var(--phosphor)",
          background: "var(--phosphor)",
          color: "var(--phosphor-ink)",
          fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>{n.replace(/^0/, "")}</div>
        <div style={{ position: "absolute", top: 26, left: 11, bottom: -28, width: 1, background: "var(--line)" }} />
      </div>
      <div>
        <div style={{
          display: "flex", alignItems: "baseline",
          gap: 12, marginBottom: 14, flexWrap: "wrap",
        }}>
          <h2 style={{ fontSize: 22, letterSpacing: "-0.015em" }}>{title}</h2>
          {subtitle && (
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              · {subtitle}
            </span>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function CtxRow({
  title, hint, right, toggle, onToggle, forced, last,
}: {
  title: string;
  hint: string;
  right?: React.ReactNode;
  toggle: boolean;
  onToggle?: () => void;
  forced?: boolean;
  last?: boolean;
}) {
  return (
    <div style={{
      padding: "14px 16px",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap: 14,
      alignItems: "center",
    }}>
      <span
        onClick={forced ? undefined : onToggle}
        className={`switch ${toggle ? "on" : ""}`}
        style={{ cursor: forced ? "default" : "pointer", opacity: forced ? 0.7 : 1 }}
      />
      <div>
        <div className="field-label" style={{
          textTransform: "none", letterSpacing: 0,
          fontSize: 13, color: "var(--ink)",
        }}>
          {title}
          {forced && (
            <span style={{
              fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
              marginLeft: 8, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>· always included</span>
          )}
        </div>
        <div className="field-hint" style={{ marginTop: 2 }}>{hint}</div>
      </div>
      {right}
    </div>
  );
}

function SelfServe({
  label, href, to, hint, last,
}: {
  label: string; href: string; to: string; hint: string; last?: boolean;
}) {
  const External = href.startsWith("http");
  const inner = (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr auto",
      gap: 10, alignItems: "center",
      padding: "10px 0",
      borderBottom: last ? "none" : "1px dashed var(--line)",
    }}>
      <div>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 11,
          color: "var(--phosphor)", letterSpacing: "0.04em",
        }}>↳ {to}</div>
        <div className="field-hint" style={{ marginTop: 2 }}>{hint}</div>
      </div>
      <span style={{
        fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
        letterSpacing: "0.1em", textTransform: "uppercase",
      }}>{label}</span>
    </div>
  );
  return External ? (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
      {inner}
    </a>
  ) : (
    <Link href={href} style={{ color: "inherit", textDecoration: "none" }}>
      {inner}
    </Link>
  );
}

function Helps({ tone, t }: { tone: "mint" | "signal"; t: string }) {
  const color = tone === "mint" ? "var(--mint)" : "var(--signal)";
  const glyph = tone === "mint" ? "✓" : "✗";
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "16px 1fr",
      gap: 8, padding: "4px 0", alignItems: "start",
    }}>
      <span style={{ fontFamily: "var(--mono)", color, fontSize: 12 }}>{glyph}</span>
      <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55 }}>{t}</span>
    </div>
  );
}

function CopyDraftButton({ subject, body }: { subject: string; body: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const text = `To: ${TO}\nSubject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — ignore */ }
  }
  return (
    <button type="button" className="btn ghost" onClick={copy}>
      {copied ? "✓ copied" : "copy as draft"}
    </button>
  );
}
