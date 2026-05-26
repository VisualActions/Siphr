import Link from "next/link";
import TopNav from "@/components/TopNav";
import {
  ArrowGlyph,
  CipherStrip,
  Dot,
  FingerprintSigil,
} from "@/components/Primitives";
import type { ReactNode } from "react";

export default function HomePage() {
  return (
    <>
      <TopNav />
      <main>
        {/* HERO ----------------------------------------------------------- */}
        <section style={{ padding: "72px 6vw 56px", position: "relative", overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.05fr 1fr",
              gap: 56,
              alignItems: "start",
              maxWidth: 1280,
              margin: "0 auto",
            }}
            className="hero-grid"
          >
            <div>
              <div className="eyebrow" style={{ marginBottom: 28 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Dot color="var(--copper)" /> v0.1 · open beta · audit pending
                </span>
              </div>
              <h1 className="serif" style={{ fontSize: 88, lineHeight: 0.96, letterSpacing: "-0.025em" }}>
                Code hosting<br />
                that we <em style={{ color: "var(--copper)", fontStyle: "italic" }}>can&apos;t&nbsp;read.</em>
              </h1>
              <p style={{ marginTop: 28, fontSize: 17, lineHeight: 1.55, maxWidth: 520, color: "var(--ink-2)" }}>
                Public repos work like any forge. Private repos are end-to-end encrypted with keys that live on
                your machine. We hold ciphertext, public keys, and wrapped keys we can&apos;t unwrap.
                <span style={{ color: "var(--muted)" }}> Not the team. Not a subpoena. Not us.</span>
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
                <Link href="/signup" className="btn copper">
                  Generate your key
                  <ArrowGlyph />
                </Link>
                <Link href="/security" className="btn ghost">Read the threat model</Link>
              </div>
              <div style={{ marginTop: 28, display: "flex", gap: 24, fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", flexWrap: "wrap" }}>
                <span>↳ keypair generated in your browser</span>
                <span>↳ passphrase never sent</span>
                <span>↳ no analytics</span>
              </div>
            </div>

            {/* Hero visual: side-by-side reveal */}
            <div style={{ position: "relative" }}>
              <div
                className="card"
                style={{ padding: 0, overflow: "hidden", boxShadow: "0 18px 48px -20px rgba(26,24,20,0.25)" }}
              >
                <div style={{ display: "flex", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ flex: 1, padding: "10px 14px", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", borderRight: "1px solid var(--line)" }}>
                    <Dot color="var(--moss)" /> &nbsp;your browser
                  </div>
                  <div style={{ flex: 1, padding: "10px 14px", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", background: "#0f0d0a", color: "#806c4a" }}>
                    <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 999, background: "#8a2a1f", marginRight: 6 }} />
                    siphr server sees
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <div style={{ padding: "18px 16px", borderRight: "1px solid var(--line)", fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.85 }}>
                    <div style={{ color: "var(--muted)" }}># auth.ts</div>
                    <div><span style={{ color: "var(--copper)" }}>export</span> async <span style={{ color: "var(--moss)" }}>function</span> signIn(<br />&nbsp;&nbsp;email: string,<br />&nbsp;&nbsp;passphrase: string<br />){" {"}</div>
                    <div>&nbsp;&nbsp;const key = await<br />&nbsp;&nbsp;&nbsp;&nbsp;deriveKey(passphrase);</div>
                    <div>&nbsp;&nbsp;return <span style={{ color: "var(--copper)" }}>unwrap</span>(key, blob);</div>
                    <div>{"}"}</div>
                  </div>
                  <div style={{ padding: "18px 16px", background: "#0f0d0a", color: "#c8a868", fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.85, wordBreak: "break-all" }}>
                    <div style={{ color: "#806c4a" }}># 7c93…e0a1</div>
                    <div>9a4f c2b8 7e01 d3aa f681<br />02bc 4a91 7d2e 88c5 1f0a<br />b73c 9d6e 4271 a05b f8d4<br />6c19 ae83 50fb 21d7 9c0e<br />47b2 d815 90a3 6e2c b148</div>
                    <div style={{ color: "#8a2a1f", marginTop: 4 }}>↳ aes-256-gcm, nonce e8…42</div>
                  </div>
                </div>
                <div style={{ padding: "10px 14px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                  <span>blob → ciphertext</span>
                  <span style={{ color: "var(--moss)" }}>✓ wrapped to 3 collaborators</span>
                </div>
              </div>

              <div
                className="card"
                style={{
                  position: "absolute", right: -8, bottom: -32,
                  padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
                  boxShadow: "0 12px 32px -16px rgba(26,24,20,0.4)",
                }}
              >
                <FingerprintSigil seed="r@siphr 5f9a c218 ab30" size={48} />
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>your fingerprint</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600 }}>5f9a c218 ab30 d7e6</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 92, borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "10px 0", maxWidth: 1280, margin: "92px auto 0" }}>
            <CipherStrip seed="hero-strip" bytes={180} />
          </div>
        </section>

        {/* THREAT MODEL DIAGRAM ------------------------------------------ */}
        <section style={{ padding: "72px 6vw", background: "var(--paper-2)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>↳ the whole pitch, in one diagram</div>
            <h2 className="serif" style={{ fontSize: 44, marginBottom: 10, letterSpacing: "-0.02em" }}>
              Three boxes. One rule. <em style={{ color: "var(--copper)" }}>Every key lives with you.</em>
            </h2>
            <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 640, marginBottom: 40 }}>
              Read left-to-right. The cryptographic boundary is between box 2 and box 3 — once data crosses it,
              it is unreadable without a key the server has never seen.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", alignItems: "stretch", gap: 0 }}>
              <div className="card" style={{ padding: "22px 22px 18px", background: "#fffdf7" }}>
                <div className="eyebrow" style={{ marginBottom: 18 }}>box 1 — you</div>
                <h3 className="serif" style={{ fontSize: 26, marginBottom: 10 }}>Your machine</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, lineHeight: 1.7, color: "var(--ink-2)" }}>
                  <li>· passphrase</li>
                  <li>· private key (wrapped)</li>
                  <li>· repo keys (in memory)</li>
                  <li>· plaintext source</li>
                </ul>
                <div className="hr" style={{ margin: "16px 0" }} />
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--moss)" }}>✓ can read everything</div>
              </div>

              <Arrow label="encrypt" />

              <div className="card" style={{ padding: "22px 22px 18px", background: "#fffdf7" }}>
                <div className="eyebrow" style={{ marginBottom: 18 }}>box 2 — the wire</div>
                <h3 className="serif" style={{ fontSize: 26, marginBottom: 10 }}>Ciphertext in flight</h3>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", lineHeight: 1.7, wordBreak: "break-all" }}>
                  9a4f c2b8 7e01 d3aa f681<br />02bc 4a91 7d2e 88c5 1f0a<br />b73c 9d6e 4271 a05b f8d4
                </div>
                <div className="hr" style={{ margin: "16px 0" }} />
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>TLS + aes-256-gcm</div>
              </div>

              <Arrow label="store" />

              <div className="card" style={{ padding: "22px 22px 18px", background: "#0f0d0a", color: "#e8d9b8", borderColor: "#1a1814" }}>
                <div className="eyebrow" style={{ marginBottom: 18, color: "#806c4a" }}>box 3 — siphr.dev</div>
                <h3 className="serif" style={{ fontSize: 26, marginBottom: 10, color: "#fff" }}>The server</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, lineHeight: 1.7, color: "#c8a868" }}>
                  <li>· public keys</li>
                  <li>· encrypted object blobs</li>
                  <li>· wrapped repo keys</li>
                  <li>· refs (commit oids)</li>
                </ul>
                <div style={{ height: 1, background: "#2a2520", margin: "16px 0" }} />
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#8a2a1f" }}>✗ can&apos;t read source · can&apos;t unwrap keys · can&apos;t decrypt commits</div>
              </div>
            </div>
          </div>
        </section>

        {/* VS GITHUB ------------------------------------------------------ */}
        <section style={{ padding: "72px 6vw" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>↳ side by side</div>
            <h2 className="serif" style={{ fontSize: 44, marginBottom: 32, letterSpacing: "-0.02em" }}>
              Same git. Different threat model.
            </h2>

            <div className="card" style={{ overflow: "hidden" }}>
              <ComparisonRow head row={["", "siphr", "github", "self-hosted gitea"]} />
              <ComparisonRow row={["source code at rest", { v: "encrypted (per-repo key)", t: "good" }, "plaintext", "plaintext"]} />
              <ComparisonRow row={["who can read your private repo", { v: "you + collaborators", t: "good" }, "github staff with access", "your sysadmin"]} />
              <ComparisonRow row={["subpoena response", { v: "ciphertext, useless", t: "good" }, "plaintext code", "plaintext code"]} />
              <ComparisonRow row={["commit messages", { v: "encrypted", t: "good" }, "plaintext + indexed", "plaintext"]} />
              <ComparisonRow row={["search across your repos", "client-side, slower", { v: "fast server-side", t: "neutral" }, "fast server-side"]} />
              <ComparisonRow row={["lost passphrase recovery", { v: "you. recovery codes only.", t: "warn" }, "email reset", "email reset"]} />
              <ComparisonRow row={["price for private repos", "free during beta", "free / 4 / 21", "your hosting"]} last />
            </div>

            <p style={{ marginTop: 18, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              we&apos;ll be honest about the tradeoffs. lost-passphrase recovery is the price of &ldquo;we can&apos;t read it either.&rdquo;
            </p>
          </div>
        </section>

        {/* THREE PILLARS ------------------------------------------------- */}
        <section style={{ padding: "0 6vw 72px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, maxWidth: 1280, margin: "0 auto" }}>
            <Pillar
              n="01"
              title="Per-repo keys"
              body="Every repo gets its own random 256-bit AES key. The repo key is wrapped to each collaborator&apos;s public key. We never hold a master."
              footer="aes-256-gcm · fresh nonce per object"
            />
            <Pillar
              n="02"
              title="Keys live with you"
              body="Generated in your browser at signup. Passphrase-wrapped locally with PBKDF2-SHA256 at 600k iterations. We see your public key, never your private one."
              footer="p-256 ecdh · pbkdf2-sha256 · 600k"
            />
            <Pillar
              n="03"
              title="Verify, don't trust"
              body="Open source. Reproducible build. Public-key transparency log. Every claim on this page is checkable from the command line in <2 minutes."
              footer="↳ /transparency"
              footerHref="/transparency"
            />
          </div>
        </section>

        {/* FOOTER -------------------------------------------------------- */}
        <footer style={{
          padding: "32px 6vw", borderTop: "1px solid var(--line)",
          background: "var(--paper-2)",
        }}>
          <div style={{
            maxWidth: 1280, margin: "0 auto",
            display: "flex", justifyContent: "space-between",
            fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)",
            flexWrap: "wrap", gap: 16,
          }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span>© 2026 siphr</span>
              <span>·</span>
              <span>open source · agpl</span>
              <span>·</span>
              <span>build a4f9.b22e</span>
            </div>
            <div style={{ display: "flex", gap: 22 }}>
              <Link href="/security">security</Link>
              <Link href="/transparency">transparency log</Link>
              <a href="https://github.com/VisualActions/Siphr" target="_blank" rel="noreferrer">source</a>
              <Link href="/explore">explore</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "0 14px", minWidth: 90,
    }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em",
        textTransform: "uppercase", color: "var(--copper)", marginBottom: 4,
      }}>{label}</div>
      <svg width="80" height="14" viewBox="0 0 80 14" fill="none">
        <path d="M0 7 H 70" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="2 3" />
        <path d="M65 2 L 75 7 L 65 12" stroke="var(--ink)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

type Cell = string | { v: string; t?: "good" | "warn" | "neutral" };

function ComparisonRow({ row, head, last }: { row: Cell[]; head?: boolean; last?: boolean }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
      borderBottom: last ? "none" : "1px solid var(--line)",
      background: head ? "var(--paper-2)" : "transparent",
    }}>
      {row.map((cell, i) => {
        const isLabel = i === 0;
        const cellObj: { v: string; t?: "good" | "warn" | "neutral" } =
          typeof cell === "object" ? cell : { v: cell };
        const tone = cellObj.t;
        const color = head
          ? "var(--ink)"
          : isLabel
          ? "var(--ink)"
          : tone === "good"
          ? "var(--moss)"
          : tone === "warn"
          ? "#9a6700"
          : tone === "neutral"
          ? "var(--muted)"
          : "var(--ink-2)";
        return (
          <div key={i} style={{
            padding: "14px 18px",
            borderRight: i < row.length - 1 ? "1px solid var(--line)" : "none",
            fontFamily: head ? "var(--mono)" : isLabel ? "var(--sans)" : "var(--mono)",
            fontSize: head ? 11 : isLabel ? 14 : 12,
            fontWeight: head ? 600 : isLabel ? 500 : 400,
            textTransform: head ? "uppercase" : "none",
            letterSpacing: head ? "0.1em" : "normal",
            color,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {tone === "good" && !head && <span style={{ color: "var(--moss)" }}>✓</span>}
            {tone === "warn" && !head && <span style={{ color: "#9a6700" }}>!</span>}
            {cellObj.v}
          </div>
        );
      })}
    </div>
  );
}

function Pillar({
  n, title, body, footer, footerHref,
}: {
  n: string; title: string; body: string;
  footer: ReactNode; footerHref?: string;
}) {
  const footerEl = (
    <div style={{
      marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)",
      fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)",
    }}>{footer}</div>
  );
  return (
    <div className="card" style={{ padding: "28px 24px 22px" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", color: "var(--copper)" }}>{n}</div>
      <h3 className="serif" style={{ fontSize: 28, margin: "18px 0 12px", letterSpacing: "-0.015em" }}>{title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)", minHeight: 96 }}>{body}</p>
      {footerHref ? <Link href={footerHref}>{footerEl}</Link> : footerEl}
    </div>
  );
}
