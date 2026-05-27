// Landing v3 — "cryptographic instrument" reskin.
// Dark surfaces, IBM Plex Sans + Mono (no serif at all), one phosphor accent.
// Anti-editorial: no italic copper emphasis, no warm cream paper.

function ScreenLanding({ theme = "dark" }) {
  return (
    <div className={`siphr-surface ${theme}`} style={{ width: 1280 }}>
      <TopNav user="r" theme={theme} />

      {/* HERO ------------------------------------------------------------- */}
      <section style={{ padding: "0 56px", position: "relative", overflow: "hidden", borderBottom: "1px solid var(--line)" }}>
        {/* top instrument bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 32, borderBottom: "1px solid var(--line)", margin: "0 -56px", padding: "0 56px", color: "var(--muted-2)", fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          <span>siphr v0.1.4 · open beta · audit ↗ trail of bits 2026-q3</span>
          <span style={{ display: "flex", gap: 18 }}>
            <span><span style={{ color: "var(--mint)" }}>●</span> us-east-1</span>
            <span><span style={{ color: "var(--mint)" }}>●</span> eu-west-1</span>
            <span>tor ↗ siphr7…onion</span>
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 64, alignItems: "start", padding: "72px 0 64px" }}>
          {/* LEFT — headline + claim */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 36, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, background: "var(--phosphor)", boxShadow: "0 0 10px rgba(192,250,58,0.7)" }} />
                rfc/0001 — protocol spec
              </span>
              <span style={{ color: "var(--line)" }}>│</span>
              <span>commit a4f9.b22e</span>
            </div>

            <h1 className="display" style={{ fontSize: 96, lineHeight: 0.95 }}>
              Code hosting<br />
              <span style={{ color: "var(--muted)" }}>we </span>
              <span style={{ color: "var(--phosphor)" }}>can't</span>
              <span style={{ color: "var(--muted)" }}> read.</span>
            </h1>

            <div style={{ display: "flex", alignItems: "stretch", marginTop: 64, gap: 0, borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
              <div style={{ flex: 1, padding: "20px 24px 20px 0", borderRight: "1px solid var(--line)" }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>↳ public</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
                  works like any forge. plaintext, indexed, searchable.
                </div>
              </div>
              <div style={{ flex: 1, padding: "20px 24px" }}>
                <div className="eyebrow phosphor" style={{ marginBottom: 6 }}>↳ private</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink)", lineHeight: 1.55 }}>
                  end-to-end encrypted. keys live on your machine.<br />
                  we hold ciphertext, public keys, wrapped keys we can't unwrap.
                </div>
              </div>
            </div>

            <p style={{ marginTop: 28, fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.8, color: "var(--muted)", letterSpacing: "0.01em" }}>
              <span style={{ color: "var(--signal)" }}>{">"}</span> not the team. not a subpoena. not us.
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 36 }}>
              <button className="btn primary">
                generate your key
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button className="btn ghost">read the threat model →</button>
            </div>

            {/* micro-receipts row */}
            <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderTop: "1px solid var(--line)" }}>
              {[
                { k: "keypair", v: "in browser" },
                { k: "passphrase", v: "never sent" },
                { k: "analytics", v: "none" },
              ].map((r, i) => (
                <div key={i} style={{ padding: "14px 16px 14px 0", borderRight: i < 2 ? "1px solid var(--line)" : "none", paddingLeft: i === 0 ? 0 : 16 }}>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>{r.k}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)" }}>{r.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — instrument panel: your view vs server view */}
          <div style={{ position: "sticky", top: 24 }}>
            <div className="panel" style={{ padding: 0, overflow: "hidden", borderRadius: 0 }}>
              {/* panel header */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--line)", background: "var(--panel-2)" }}>
                <div style={{ flex: 1, padding: "9px 14px", fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mint)", borderRight: "1px solid var(--line)" }}>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: "var(--mint)", marginRight: 8, verticalAlign: "middle" }} />
                  ch.1 — your browser · cleartext
                </div>
                <div style={{ flex: 1, padding: "9px 14px", fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--signal)" }}>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: "var(--signal)", marginRight: 8, verticalAlign: "middle" }} />
                  ch.2 — siphr server · sees
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {/* cleartext */}
                <div style={{ padding: "16px 16px", borderRight: "1px solid var(--line)", fontFamily: "var(--mono)", fontSize: 11.5, lineHeight: 1.85 }}>
                  <div style={{ color: "var(--muted-2)" }}># src/auth.ts</div>
                  <div><span style={{ color: "var(--phosphor)" }}>export</span> <span style={{ color: "var(--ink-2)" }}>async</span> <span style={{ color: "var(--mint)" }}>function</span> <span style={{ color: "var(--ink)" }}>signIn</span>(</div>
                  <div>&nbsp;&nbsp;email: <span style={{ color: "var(--amber)" }}>string</span>,</div>
                  <div>&nbsp;&nbsp;passphrase: <span style={{ color: "var(--amber)" }}>string</span></div>
                  <div>) {"{"}</div>
                  <div>&nbsp;&nbsp;<span style={{ color: "var(--phosphor)" }}>const</span> key = <span style={{ color: "var(--phosphor)" }}>await</span></div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;deriveKey(passphrase);</div>
                  <div>&nbsp;&nbsp;<span style={{ color: "var(--phosphor)" }}>return</span> unwrap(key, blob);</div>
                  <div>{"}"}</div>
                </div>

                {/* ciphertext */}
                <div style={{ padding: "16px 16px", background: "var(--terminal-bg)", fontFamily: "var(--mono)", fontSize: 10.5, lineHeight: 1.85, wordBreak: "break-all", color: "var(--muted)" }}>
                  <div style={{ color: "var(--muted-2)" }}># obj/7c93…e0a1.bin</div>
                  <div style={{ color: "var(--phosphor)" }}>9a4f c2b8 7e01 d3aa f681</div>
                  <div style={{ color: "var(--phosphor)" }}>02bc 4a91 7d2e 88c5 1f0a</div>
                  <div style={{ color: "var(--phosphor)" }}>b73c 9d6e 4271 a05b f8d4</div>
                  <div style={{ color: "var(--phosphor)" }}>6c19 ae83 50fb 21d7 9c0e</div>
                  <div style={{ color: "var(--phosphor)" }}>47b2 d815 90a3 6e2c b148</div>
                  <div style={{ color: "var(--signal)", marginTop: 4, fontSize: 10 }}>↳ aes-256-gcm · nonce e8…42</div>
                </div>
              </div>

              {/* panel footer — readouts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid var(--line)", background: "var(--panel-2)" }}>
                {[
                  { l: "size", v: "4.2 KiB → 4.3 KiB" },
                  { l: "wrap", v: "3 collaborators" },
                  { l: "verified", v: <span style={{ color: "var(--phosphor)" }}>↗ tlog</span> },
                ].map((r, i) => (
                  <div key={i} style={{ padding: "8px 12px", borderRight: i < 2 ? "1px solid var(--line)" : "none", fontFamily: "var(--mono)", fontSize: 10.5 }}>
                    <div style={{ color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 9.5, marginBottom: 2 }}>{r.l}</div>
                    <div style={{ color: "var(--ink-2)" }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* fingerprint readout below the panel */}
            <div style={{ marginTop: 18, padding: "12px 14px", border: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 14 }}>
              <FingerprintSigil seed="r@siphr 5f9a c218 ab30" size={42} />
              <div style={{ flex: 1 }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>your fingerprint</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>5f9a c218 ab30 d7e6 · 88f1 a204</div>
              </div>
              <button className="btn ghost xs">verify</button>
            </div>
          </div>
        </div>

        {/* cipher strip ornament */}
        <div style={{ margin: "0 -56px", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "9px 56px", background: "var(--panel-2)" }}>
          <CipherStrip seed="hero-strip" bytes={180} />
        </div>
      </section>

      {/* THREAT MODEL DIAGRAM --------------------------------------------- */}
      <section style={{ padding: "96px 56px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
          <div className="eyebrow">↳ §2 · the whole pitch, in one diagram</div>
          <div className="eyebrow">read left → right</div>
        </div>
        <h2 className="display" style={{ fontSize: 56, marginBottom: 12 }}>
          Three boxes. One <span style={{ color: "var(--phosphor)" }}>cryptographic boundary</span>.
        </h2>
        <p style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--muted)", maxWidth: 720, marginBottom: 56, lineHeight: 1.7 }}>
          Between box 2 and box 3 is the wall — once data crosses it, it is unreadable<br />
          without a key the server has never seen and cannot produce.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: 0, alignItems: "stretch" }}>
          <Box1 />
          <Arrow label="encrypt" />
          <Box2 />
          <Arrow label="store" stop />
          <Box3 />
        </div>
      </section>

      {/* VS GITHUB --------------------------------------------------------- */}
      <section style={{ padding: "96px 56px", borderBottom: "1px solid var(--line)" }}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>↳ §3 · side by side</div>
        <h2 className="display" style={{ fontSize: 56, marginBottom: 40 }}>
          Same git. Different <span style={{ color: "var(--phosphor)" }}>threat model</span>.
        </h2>

        <div className="panel" style={{ overflow: "hidden", borderRadius: 0 }}>
          <ComparisonRow head row={["", "siphr", "github", "self-hosted gitea"]} />
          <ComparisonRow row={["source code at rest", { v: "encrypted · per-repo key", t: "good" }, "plaintext", "plaintext"]} />
          <ComparisonRow row={["who can read your private repo", { v: "you + collaborators", t: "good" }, "staff with access", "your sysadmin"]} />
          <ComparisonRow row={["subpoena response", { v: "ciphertext · useless", t: "good" }, "plaintext code", "plaintext code"]} />
          <ComparisonRow row={["commit messages", { v: "encrypted", t: "good" }, "plaintext + indexed", "plaintext"]} />
          <ComparisonRow row={["search across repos", "client-side · slower", { v: "fast server-side", t: "neutral" }, "fast server-side"]} />
          <ComparisonRow row={["lost passphrase recovery", { v: "you. recovery codes only.", t: "warn" }, "email reset", "email reset"]} />
          <ComparisonRow row={["price for private repos", "free during beta", "free / 4 / 21", "your hosting"]} last />
        </div>

        <p style={{ marginTop: 18, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted-2)" }}>
          // honest about the tradeoffs. lost-passphrase recovery is the price of "we can't read it either."
        </p>
      </section>

      {/* THREE PILLARS ----------------------------------------------------- */}
      <section style={{ padding: "96px 56px" }}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>↳ §4 · the spec, in three claims</div>
        <h2 className="display" style={{ fontSize: 56, marginBottom: 48 }}>
          How it works.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, border: "1px solid var(--line)" }}>
          <Pillar
            n="01"
            title="Per-repo keys"
            body="Every repo gets its own random 256-bit AES key. The repo key is wrapped to each collaborator's public key. We never hold a master."
            footer="aes-256-gcm · fresh nonce per object"
          />
          <Pillar
            n="02"
            title="Keys live with you"
            body="Generated in your browser at signup. Passphrase-wrapped locally with PBKDF2-SHA256 at 600k iterations. We see your public key, never your private one."
            footer="p-256 ecdh · pbkdf2-sha256 · 600k"
            mid
          />
          <Pillar
            n="03"
            title="Verify, don't trust"
            body="Open source. Reproducible build. Public-key transparency log. Every claim on this page is checkable from the command line in &lt;2 minutes."
            footer="↳ /transparency"
          />
        </div>
      </section>

      {/* FOOTER ------------------------------------------------------------ */}
      <footer style={{ padding: "28px 56px", borderTop: "1px solid var(--line)", background: "var(--panel-2)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted-2)", fontFamily: "var(--mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        <div style={{ display: "flex", gap: 14 }}>
          <span>© 2026 siphr</span>
          <span>·</span>
          <span>agpl-3.0</span>
          <span>·</span>
          <span>build a4f9.b22e</span>
          <span>·</span>
          <span style={{ color: "var(--mint)" }}>● all systems</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <a>security</a>
          <a>tlog</a>
          <a>source</a>
          <a>status</a>
          <a>↗ tor</a>
        </div>
      </footer>
    </div>
  );
}

/* --- Threat-model boxes -------------------------------------------------- */
function Box1() {
  return (
    <div style={{ padding: "22px 22px 18px", background: "var(--panel)", border: "1px solid var(--line)" }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>box 1 — you</div>
      <h3 className="display" style={{ fontSize: 26, marginBottom: 12 }}>Your machine</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.85, color: "var(--ink-2)" }}>
        <li>· passphrase</li>
        <li>· private key (wrapped)</li>
        <li>· repo keys (in memory)</li>
        <li>· plaintext source</li>
      </ul>
      <div className="hr" style={{ margin: "16px 0" }} />
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--mint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>✓ can read everything</div>
    </div>
  );
}
function Box2() {
  return (
    <div style={{ padding: "22px 22px 18px", background: "var(--panel)", border: "1px solid var(--line)" }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>box 2 — the wire</div>
      <h3 className="display" style={{ fontSize: 26, marginBottom: 12 }}>Ciphertext in flight</h3>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--phosphor)", lineHeight: 1.85, wordBreak: "break-all" }}>
        9a4f c2b8 7e01 d3aa f681<br />02bc 4a91 7d2e 88c5 1f0a<br />b73c 9d6e 4271 a05b f8d4
      </div>
      <div className="hr" style={{ margin: "16px 0" }} />
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>tls + aes-256-gcm</div>
    </div>
  );
}
function Box3() {
  return (
    <div style={{ padding: "22px 22px 18px", background: "var(--terminal-bg)", border: "1px solid var(--signal)", position: "relative" }}>
      <div className="eyebrow" style={{ marginBottom: 14, color: "var(--signal)" }}>box 3 — siphr.dev · wall</div>
      <h3 className="display" style={{ fontSize: 26, marginBottom: 12 }}>The server</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.85, color: "var(--phosphor)" }}>
        <li>· public keys</li>
        <li>· encrypted object blobs</li>
        <li>· wrapped repo keys</li>
        <li>· refs · commit oids</li>
      </ul>
      <div style={{ height: 1, background: "var(--line)", margin: "16px 0" }} />
      <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--signal)", letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1.7 }}>
        ✗ can't read source<br />
        ✗ can't unwrap keys<br />
        ✗ can't decrypt commits
      </div>
    </div>
  );
}

function Arrow({ label, stop }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 18px", minWidth: 96, position: "relative" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: stop ? "var(--signal)" : "var(--phosphor)", marginBottom: 6 }}>{label}</div>
      <svg width="80" height="14" viewBox="0 0 80 14" fill="none">
        <path d="M0 7 H 70" stroke="var(--ink-2)" strokeWidth="1" strokeDasharray="3 3" />
        <path d="M65 2 L 75 7 L 65 12" stroke="var(--ink-2)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {stop && (
        <div style={{ position: "absolute", right: -1, top: 0, bottom: 0, width: 2, background: "var(--signal)", boxShadow: "0 0 10px rgba(255,85,68,0.5)" }} />
      )}
    </div>
  );
}

function ComparisonRow({ row, head, last }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
      borderBottom: last ? "none" : "1px solid var(--line)",
      background: head ? "var(--panel-2)" : "transparent",
    }}>
      {row.map((cell, i) => {
        const isLabel = i === 0;
        const cellObj = typeof cell === "object" ? cell : { v: cell };
        const tone = cellObj.t;
        const color = head
          ? "var(--ink)"
          : isLabel
          ? "var(--ink)"
          : tone === "good"
          ? "var(--phosphor)"
          : tone === "warn"
          ? "var(--amber)"
          : tone === "neutral"
          ? "var(--muted)"
          : "var(--muted)";
        return (
          <div key={i} style={{
            padding: "16px 18px",
            borderRight: i < row.length - 1 ? "1px solid var(--line)" : "none",
            fontFamily: head ? "var(--mono)" : isLabel ? "var(--sans)" : "var(--mono)",
            fontSize: head ? 11 : isLabel ? 13.5 : 12.5,
            fontWeight: head ? 500 : isLabel ? 500 : 400,
            textTransform: head ? "uppercase" : "none",
            letterSpacing: head ? "0.14em" : "normal",
            color,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            {tone === "good" && !head && <span style={{ color: "var(--phosphor)" }}>✓</span>}
            {tone === "warn" && !head && <span style={{ color: "var(--amber)" }}>!</span>}
            {cellObj.v}
          </div>
        );
      })}
    </div>
  );
}

function Pillar({ n, title, body, footer, mid }) {
  return (
    <div style={{
      padding: "28px 24px 22px",
      background: "var(--panel)",
      borderLeft: mid ? "1px solid var(--line)" : "none",
      borderRight: mid ? "1px solid var(--line)" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.1em", color: "var(--phosphor)" }}>§{n}</div>
        <div style={{ width: 24, height: 1, background: "var(--phosphor)" }} />
      </div>
      <h3 className="display" style={{ fontSize: 28, marginBottom: 14 }}>{title}</h3>
      <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--ink-2)", minHeight: 96 }} dangerouslySetInnerHTML={{ __html: body }} />
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--line)", fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {footer}
      </div>
    </div>
  );
}

window.ScreenLanding = ScreenLanding;
