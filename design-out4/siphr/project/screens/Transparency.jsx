// Transparency — "verify, don't trust". The page that turns the privacy
// claim into something you can check from the command line.

function ScreenTransparency({ theme = "dark" }) {
  return (
    <div className={`siphr-surface ${theme}`} style={{ width: 1280, minHeight: 1180 }}>
      <TopNav user="r" active="transparency" theme={theme} />

      {/* Hero */}
      <section style={{ padding: "64px 80px 48px" }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>↳ /transparency · updated continuously</div>
        <h1 className="serif" style={{ fontSize: 84, lineHeight: 0.98, letterSpacing: "-0.025em" }}>
          Verify. Don't <em style={{ color: "var(--copper)" }}>trust.</em>
        </h1>
        <p style={{ marginTop: 22, fontSize: 17, maxWidth: 680, color: "var(--ink-2)", lineHeight: 1.55 }}>
          Every privacy claim Siphr makes is something you can check yourself. This page is the
          machine-readable version of that promise. Open a terminal; nothing on the next page is asked to be
          taken on faith.
        </p>
        <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn">↓ Download `siphr verify`</button>
          <button className="btn ghost">View on GitHub</button>
          <button className="btn ghost">Subscribe to log changes (rss)</button>
        </div>
      </section>

      {/* Big status banner */}
      <section style={{ padding: "0 80px 36px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: "var(--moss)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, padding: "18px 22px", background: "var(--moss-bg)", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 36, height: 36, borderRadius: 999, background: "var(--moss)", color: "#fff", fontSize: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>✓</span>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#345e44" }}>last build verified</div>
                <div className="serif" style={{ fontSize: 22, color: "var(--ink)" }}>siphr.dev is serving the same code on this page.</div>
              </div>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#345e44", lineHeight: 1.7 }}>
              <div>verified · 4 min ago</div>
              <div>by 12 independent reproducers</div>
            </div>
            <button className="btn ghost sm">re-run verification</button>
          </div>
          <div style={{ padding: "14px 22px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span>commit · <span style={{ color: "var(--copper)" }}>a4f9b22e</span> tagged v0.1.4</span>
            <span>build hash · <span style={{ color: "var(--copper)" }}>sha256:7c93…e0a1</span></span>
            <span>signed by · <span style={{ color: "var(--copper)" }}>r@siphr 5f9a c218 ab30</span></span>
          </div>
        </div>
      </section>

      {/* 4 verifiable artifacts grid */}
      <section style={{ padding: "16px 80px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <Artifact
            n="01"
            title="The source you can run is the source we ship"
            blurb="The build hash on siphr.dev matches the one produced from a clean checkout of this commit, on your own machine."
            verifyCmd="$ siphr verify build a4f9b22e"
            expected="✓ build hash matches siphr.dev (sha256:7c93…e0a1)"
            footnote="reproducible via Bazel · 14 reproducers in the last 7 days"
          />

          <Artifact
            n="02"
            title="The server only stores ciphertext"
            blurb="Hit any object endpoint with a fresh session. Decryptors are client-side; the responses contain no plaintext."
            verifyCmd="$ siphr inspect repo r/siphr --as-server"
            expected="objects · 142  ·  plaintext readable · 0 bytes"
            footnote="endpoint surface area documented in /api/spec.json"
          />

          <Artifact
            n="03"
            title="Public keys are append-only and signed"
            blurb="Every public key Siphr has accepted is in a Merkle log. You can witness it; if we ever try to add a key after the fact, the log breaks publicly."
            verifyCmd="$ siphr ct witness --since 2026-05-19"
            expected="✓ 4,212 entries · root b1d4…0c7e · consistent"
            footnote="merkle tree · ct-style witness protocol · monitored by Sigstore"
          />

          <Artifact
            n="04"
            title="What an outside audit actually found"
            blurb="Third-party review of crypto + threat model. The full report is public, including the things they didn't love."
            verifyCmd="$ open audit-2026q2.pdf"
            expected="Trail of Bits, jun 2026 · 2 high, 4 medium, all fixed"
            footnote="next audit · scheduled q4 2026 · funded by Open Tech Fund"
          />
        </div>
      </section>

      {/* Transparency log (mini timeline) */}
      <section style={{ padding: "8px 80px 60px" }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>↳ public-key transparency log · last 7 days</div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr auto", padding: "10px 18px", background: "var(--paper-2)", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>
            <span>when</span>
            <span>event</span>
            <span>signed by</span>
            <span>witness</span>
          </div>
          <LogRow when="just now" event="key added · @r 5f9a c218 ab30 d7e6"   signer="siphr ct"  witness="✓ sigstore · ✓ rekor" />
          <LogRow when="14 min ago" event="repo key rotated · r/siphr"          signer="r"         witness="✓ co-signed by alice"  />
          <LogRow when="2 h ago"   event="collaborator removed · m. left"      signer="r"         witness="✓ rotation receipt"   />
          <LogRow when="6 h ago"   event="server build · sha256:7c93…e0a1"      signer="ci · siphr-builder" witness="✓ 12 reproducers" />
          <LogRow when="1 d ago"   event="key revoked · @maria 9c2e …fb47"     signer="@maria · maria-recovery" witness="✓ revocation entry" tone="rust" />
          <LogRow when="2 d ago"   event="audit log root advanced · b1d4…0c7e" signer="siphr ct"  witness="✓ consistency proof" last />
        </div>
      </section>

      {/* Honest tradeoff strip */}
      <section style={{ padding: "0 80px 64px" }}>
        <div className="card" style={{ padding: "26px 28px", background: "var(--paper-2)", display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "center" }}>
          <div className="serif" style={{ fontSize: 36, color: "var(--rust)", lineHeight: 1, letterSpacing: "-0.02em" }}>!</div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8, color: "var(--rust)" }}>↳ the things this page can't fix</div>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)" }}>
              Verifiability covers <em>what the server stores</em> and <em>what the code does</em>. It does not
              cover the device you decrypt on. If your laptop is compromised, the threat model leaks. We can't
              transparency-log our way out of that — but we'll say it loudly here so you don't think we tried.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Artifact({ n, title, blurb, verifyCmd, expected, footnote }) {
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
      <div style={{ background: "#0f0d0a", color: "#e8d9b8", borderRadius: 6, padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 12, border: "1px solid #2a2520" }}>
        <div style={{ color: "#806c4a" }}>{verifyCmd}</div>
        <div style={{ color: "#9bbf86", marginTop: 4 }}>{expected}</div>
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", paddingTop: 4, borderTop: "1px dashed var(--line)" }}>
        ↳ {footnote}
      </div>
    </div>
  );
}

function LogRow({ when, event, signer, witness, last, tone }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "120px 1fr 1fr auto",
      padding: "12px 18px",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
      fontSize: 12,
      alignItems: "center",
      gap: 12,
    }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{when}</span>
      <span style={{ fontFamily: "var(--mono)", color: tone === "rust" ? "var(--rust)" : "var(--ink-2)" }}>{event}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{signer}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--moss)" }}>{witness}</span>
    </div>
  );
}

window.ScreenTransparency = ScreenTransparency;
