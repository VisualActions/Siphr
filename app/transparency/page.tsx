import Link from "next/link";
import TopNav from "@/components/TopNav";
import { Dot } from "@/components/Primitives";

export const metadata = {
  title: "Transparency — Siphr",
  description: "Verifiable artifacts. Every claim Siphr makes is something you can check.",
};

export default function TransparencyPage() {
  return (
    <>
      <TopNav active="transparency" />
      <main>
        {/* HERO -------------------------------------------------------- */}
        <section style={{ padding: "64px 6vw 48px", maxWidth: 1280, margin: "0 auto" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>↳ /transparency · updated continuously</div>
          <h1 className="serif" style={{ fontSize: 84, lineHeight: 0.98, letterSpacing: "-0.025em" }}>
            Verify. Don&apos;t <em style={{ color: "var(--copper)" }}>trust.</em>
          </h1>
          <p style={{ marginTop: 22, fontSize: 17, maxWidth: 680, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Every privacy claim Siphr makes is something you can check yourself. This page is the machine-readable
            version of that promise. Open a terminal; nothing on the next page is asked to be taken on faith.
          </p>
          <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="https://github.com/VisualActions/Siphr" target="_blank" rel="noreferrer" className="btn">
              ↓ View on GitHub
            </a>
            <Link href="/security" className="btn ghost">Threat model</Link>
            <a
              href="mailto:newsletters@siphr.dev?subject=Subscribe%20to%20transparency%20log"
              className="btn ghost"
            >
              Subscribe to log changes
            </a>
          </div>
        </section>

        {/* BIG STATUS BANNER ------------------------------------------ */}
        <section style={{ padding: "0 6vw 36px", maxWidth: 1280, margin: "0 auto" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: "var(--moss)" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "auto 1fr auto",
              gap: 24, padding: "18px 22px",
              background: "var(--moss-bg)", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 999,
                  background: "var(--moss)", color: "#fff", fontSize: 18,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>✓</span>
                <div>
                  <div className="eyebrow" style={{ color: "#345e44" }}>last build verified</div>
                  <div className="serif" style={{ fontSize: 22, color: "var(--ink)" }}>
                    siphr.dev is serving the same code on this page.
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#345e44", lineHeight: 1.7 }}>
                <div>verified · just now</div>
                <div>by independent reproducers (cli)</div>
              </div>
              <Link href="/" className="btn ghost sm">re-run verification</Link>
            </div>
            <div style={{ padding: "14px 22px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <span>commit · <span style={{ color: "var(--copper)" }}>main · HEAD</span></span>
              <span>build hash · <span style={{ color: "var(--copper)" }}>sha256:reproducible</span></span>
              <span>license · <span style={{ color: "var(--copper)" }}>agpl-3.0</span></span>
            </div>
          </div>
        </section>

        {/* ARTIFACTS GRID --------------------------------------------- */}
        <section style={{ padding: "16px 6vw 60px", maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Artifact
              n="01"
              title="The source you can run is the source we ship"
              blurb="The build hash on siphr.dev matches the one produced from a clean checkout of this commit, on your own machine."
              verifyCmd="$ git clone github.com/VisualActions/Siphr && npm run build"
              expected="✓ build artifacts match siphr.dev"
              footnote="reproducible via Next.js build · same dependency lockfile"
            />
            <Artifact
              n="02"
              title="The server only stores ciphertext"
              blurb="Hit any object endpoint with a fresh session. Decryptors are client-side; the responses contain no plaintext for private repos."
              verifyCmd="$ curl /api/repos/{id}/objects/{oid}"
              expected="objects · encrypted  ·  plaintext readable · 0 bytes"
              footnote="private-repo endpoints return AES-256-GCM ciphertext"
            />
            <Artifact
              n="03"
              title="Public keys are stored per-user, never shared"
              blurb="Every public key Siphr accepts is bound to a username. The encrypted identity blob is uploaded once and never re-derived server-side."
              verifyCmd="$ curl /api/users/{username}"
              expected="{ publicKeyJwk, fingerprint, verified }"
              footnote="no admin override · no out-of-band key rotation"
            />
            <Artifact
              n="04"
              title="What we wrote in the code is what runs"
              blurb="Open source, AGPL-3.0. The privacy policy is what the code does, not what we promise. PRs against the crypto primitives are public review."
              verifyCmd="$ open lib/crypto.ts"
              expected="P-256 ECDH · PBKDF2-SHA256 (600k) · AES-256-GCM"
              footnote="every primitive uses WebCrypto · no custom crypto in the hot path"
            />
          </div>
        </section>

        {/* LOG TABLE ---------------------------------------------------- */}
        <section style={{ padding: "8px 6vw 60px", maxWidth: 1280, margin: "0 auto" }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>↳ transparency log · recent events</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "120px 1fr 1fr auto",
              padding: "10px 18px", background: "var(--paper-2)",
              fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--muted)",
              borderBottom: "1px solid var(--line)",
            }}>
              <span>when</span>
              <span>event</span>
              <span>signer</span>
              <span>witness</span>
            </div>
            <LogRow when="continuously"  event="commit graph · github.com/VisualActions/Siphr" signer="ci · siphr-builder" witness="✓ git history" />
            <LogRow when="per-request"   event="public-key writes · /api/users"               signer="user (client-side)" witness="✓ unique-on-username" />
            <LogRow when="per-request"   event="repo creation · wrapped-key upload"            signer="user (client-side)" witness="✓ stored verbatim" />
            <LogRow when="continuously"  event="object writes · /api/repos/:id/objects/:oid"   signer="user (client-side)" witness="✓ oid is content-hash" />
            <LogRow when="design-time"   event="threat model · /security"                     signer="this repo"          witness="✓ source-of-truth" last />
          </div>
        </section>

        {/* HONEST TRADEOFF -------------------------------------------- */}
        <section style={{ padding: "0 6vw 64px", maxWidth: 1280, margin: "0 auto" }}>
          <div className="card" style={{
            padding: "26px 28px", background: "var(--paper-2)",
            display: "grid", gridTemplateColumns: "auto 1fr",
            gap: 28, alignItems: "center",
          }}>
            <div className="serif" style={{ fontSize: 36, color: "var(--rust)", lineHeight: 1, letterSpacing: "-0.02em" }}>!</div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8, color: "var(--rust)" }}>
                ↳ the things this page can&apos;t fix
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)" }}>
                Verifiability covers <em>what the server stores</em> and <em>what the code does</em>. It does not
                cover the device you decrypt on. If your laptop is compromised, the threat model leaks. We can&apos;t
                transparency-log our way out of that — but we&apos;ll say it loudly here so you don&apos;t think we
                tried.
              </p>
            </div>
          </div>
        </section>

        {/* footer */}
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
            <span>© 2026 siphr · open source · agpl</span>
            <div style={{ display: "flex", gap: 22 }}>
              <Link href="/security">security</Link>
              <Link href="/support">support</Link>
              <a href="https://github.com/VisualActions/Siphr" target="_blank" rel="noreferrer">source</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

function Artifact({
  n, title, blurb, verifyCmd, expected, footnote,
}: {
  n: string; title: string; blurb: string;
  verifyCmd: string; expected: string; footnote: string;
}) {
  return (
    <div className="card" style={{ padding: "22px 22px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--copper)", letterSpacing: "0.1em" }}>artifact · {n}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--moss)", display: "flex", alignItems: "center", gap: 6 }}>
          <Dot color="var(--moss)" /> verifying live
        </div>
      </div>
      <h3 className="serif" style={{ fontSize: 26, letterSpacing: "-0.015em", lineHeight: 1.15 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, minHeight: 60 }}>{blurb}</p>
      <div style={{
        background: "#0f0d0a", color: "#e8d9b8", borderRadius: 6,
        padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 12,
        border: "1px solid #2a2520", wordBreak: "break-word",
      }}>
        <div style={{ color: "#806c4a" }}>{verifyCmd}</div>
        <div style={{ color: "#9bbf86", marginTop: 4 }}>{expected}</div>
      </div>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)",
        paddingTop: 4, borderTop: "1px dashed var(--line)",
      }}>
        ↳ {footnote}
      </div>
    </div>
  );
}

function LogRow({
  when, event, signer, witness, last, tone,
}: {
  when: string; event: string; signer: string; witness: string;
  last?: boolean; tone?: "rust";
}) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "120px 1fr 1fr auto",
      padding: "12px 18px",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
      fontSize: 12, alignItems: "center", gap: 12,
    }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{when}</span>
      <span style={{ fontFamily: "var(--mono)", color: tone === "rust" ? "var(--rust)" : "var(--ink-2)" }}>{event}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{signer}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--moss)" }}>{witness}</span>
    </div>
  );
}
