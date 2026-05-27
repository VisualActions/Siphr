// Key Ceremony — signup as a moment of consequence.
// Step 2 of 4: "Generating your identity". Shows in-progress keygen,
// emerging fingerprint sigil, and side panel of editorial copy.

function ScreenKeyCeremony({ theme = "dark" }) {
  return (
    <div className={`siphr-surface ${theme}`} style={{ width: 1280, minHeight: 900 }}>
      <TopNav user="r" theme={theme} />

      <main style={{ padding: "56px 80px 80px", display: "grid", gridTemplateColumns: "1.25fr 0.85fr", gap: 56 }}>
        {/* LEFT — the ceremony itself */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 18 }}>↳ step 02 of 04 · creating your account</div>
          <h1 className="serif" style={{ fontSize: 56, letterSpacing: "-0.025em", lineHeight: 1.02 }}>
            Generating your <em style={{ color: "var(--copper)" }}>identity.</em>
          </h1>
          <p style={{ marginTop: 16, fontSize: 16, color: "var(--ink-2)", maxWidth: 560 }}>
            This happens in your browser. No part of this transaction leaves your machine. Sit with it — the
            key being generated right now is the one we'll wrap your repo keys to, forever.
          </p>

          {/* Step indicator */}
          <div style={{ marginTop: 32, display: "flex", gap: 0, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <StepDot n="01" label="passphrase" state="done" />
            <StepLine state="done" />
            <StepDot n="02" label="keygen" state="active" />
            <StepLine state="pending" />
            <StepDot n="03" label="verify" state="pending" />
            <StepLine state="pending" />
            <StepDot n="04" label="recovery" state="pending" />
          </div>

          {/* The keygen card */}
          <div className="card" style={{ marginTop: 36, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 0 }}>
              {/* Sigil column */}
              <div style={{ padding: "32px 32px 28px", borderRight: "1px solid var(--line)", background: "var(--paper-2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 240 }}>
                <div style={{ position: "relative" }}>
                  <FingerprintSigil seed="r@siphr 5f9a c218 ab30 d7e6 8b41" size={160} />
                  {/* dashed scanning frame */}
                  <div style={{ position: "absolute", inset: -8, border: "1px dashed var(--copper)", borderRadius: 8, pointerEvents: "none" }} />
                </div>
                <div style={{ marginTop: 22, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)" }}>
                  fingerprint emerging
                </div>
                <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, letterSpacing: "0.04em" }}>
                  5f9a c218 ab30 d7e6
                </div>
                <div style={{ marginTop: 2, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted-2)" }}>8b41 0e7c · · · ·</div>
              </div>

              {/* Status column */}
              <div style={{ padding: "26px 32px 26px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>
                  what's happening
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  <CeremonyStep state="done"   label="collected 256 bits of entropy from this device"           detail="crypto.getRandomValues · ~3 ms" />
                  <CeremonyStep state="done"   label="generated P-256 ecdh keypair"                              detail="public key fingerprint shown left" />
                  <CeremonyStep state="active" label="wrapping private key with your passphrase"                 detail="pbkdf2-sha256 · 600,000 iterations · ~1.8s on this machine" />
                  <CeremonyStep state="pending" label="encrypting wrapped key with AES-256-GCM"                  detail="" />
                  <CeremonyStep state="pending" label="storing in this browser's local key store"                detail="never transmitted; backed up only by you" />
                </ul>

                <div className="hr" style={{ margin: "24px 0 18px" }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>
                      what siphr.dev will see when you sign in
                    </div>
                    <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)" }}>
                      public key only · <span style={{ color: "var(--moss)" }}>nothing else</span>
                    </div>
                  </div>
                  <button className="btn" disabled style={{ opacity: 0.5, cursor: "default" }}>
                    continue
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* progress bar */}
            <div style={{ height: 4, background: "var(--paper-2)", position: "relative", overflow: "hidden" }}>
              <div style={{ width: "62%", height: "100%", background: "var(--copper)" }} />
            </div>
          </div>

          {/* fine print */}
          <div style={{ marginTop: 18, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", display: "flex", gap: 18 }}>
            <span>↳ this takes ~2s on purpose</span>
            <span>↳ everything runs in this tab</span>
            <span>↳ open devtools, you'll see no network calls</span>
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
              The private key being generated right now is the one thing that lets you read your code on siphr.
              If you lose it and your recovery codes, the data is unrecoverable — to you, and to anyone
              demanding it. That's the property doing the work.
            </p>

            <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 16px", fontSize: 13, lineHeight: 1.55 }}>
              <RowKV k="curve" v="P-256 (NIST SECG)" />
              <RowKV k="kdf"   v="PBKDF2-SHA256, 600,000 iter" />
              <RowKV k="wrap"  v="AES-256-GCM" />
              <RowKV k="entropy" v="crypto.getRandomValues" />
              <RowKV k="storage" v="IndexedDB on this device" />
              <RowKV k="server sees" v={<span style={{ color: "var(--moss)" }}>public key only</span>} />
            </div>

            <div style={{ marginTop: 32, padding: 16, background: "var(--amber-bg)", border: "1px solid rgba(184,138,36,0.35)", borderRadius: 6 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7a5a16", marginBottom: 8 }}>
                ! next step matters
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "#5c4612" }}>
                In ~2 seconds you'll be asked to write down 8 recovery words. They're the only way back if you
                forget your passphrase. <strong>Don't skip them. We can't reissue them later.</strong>
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function StepDot({ n, label, state }) {
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
function StepLine({ state }) {
  return <div style={{ flex: 1, height: 1, marginTop: 14, background: state === "done" ? "var(--moss)" : "var(--line)" }} />;
}

function CeremonyStep({ state, label, detail }) {
  const dotColor = state === "done" ? "var(--moss)" : state === "active" ? "var(--copper)" : "var(--muted-2)";
  const icon = state === "done" ? "✓" : state === "active" ? "⟳" : "○";
  return (
    <li style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, padding: "10px 0", borderBottom: "1px dashed var(--line)" }}>
      <div style={{
        width: 22, height: 22, borderRadius: 999,
        background: state === "active" ? "var(--copper-bg)" : "transparent",
        color: dotColor, fontFamily: "var(--mono)", fontWeight: 600, fontSize: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: state === "pending" ? "1px solid var(--line)" : "none",
        animation: state === "active" ? "siphr-spin 1.5s linear infinite" : undefined,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 14, color: state === "pending" ? "var(--muted)" : "var(--ink)" }}>{label}</div>
        {detail && <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{detail}</div>}
      </div>
    </li>
  );
}

function RowKV({ k, v }) {
  return (
    <>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", paddingTop: 2 }}>{k}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{v}</div>
    </>
  );
}

// inject a tiny keyframes block
if (typeof document !== "undefined" && !document.getElementById("siphr-anim")) {
  const s = document.createElement("style");
  s.id = "siphr-anim";
  s.textContent = "@keyframes siphr-spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(s);
}

window.ScreenKeyCeremony = ScreenKeyCeremony;
