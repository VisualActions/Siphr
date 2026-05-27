// Admin / operator dashboard — internal Siphr operator view.
// The whole conceit: dramatize what the operator CAN see (infra health,
// ciphertext stats, signing log) versus what they CANNOT (any plaintext).
// Every "user content" pane explicitly shows the redacted state.

function ScreenAdmin({ theme = "dark" }) {
  return (
    <div className={`siphr-surface ${theme}`} style={{ width: 1280, minHeight: 1500 }}>
      {/* Operator chrome — bespoke, distinct from the user-facing TopNav, but with the same appearance popover */}
      <header style={{ background: "#0f0d0a", color: "var(--paper)", height: 56, display: "flex", alignItems: "center", padding: "0 28px", gap: 24, borderBottom: "1px solid #2a2520", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--mono)", fontSize: 15, fontWeight: 600, letterSpacing: "0.04em" }}>
          <SiphrMark size={20} />
          <span>siphr</span>
          <span style={{ color: "#806c4a" }}>/</span>
          <span style={{ color: "var(--copper-2)" }}>operator</span>
        </div>
        <div style={{ display: "flex", gap: 18, fontFamily: "var(--mono)", fontSize: 12, color: "#a08762", marginLeft: 8 }}>
          <a style={{ color: "#f4f0e6" }}>overview</a>
          <a>fleet</a>
          <a>signing</a>
          <a>transparency log</a>
          <a>abuse</a>
          <a>billing</a>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, fontFamily: "var(--mono)", fontSize: 11, color: "#a08762" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Dot color="#9bbf86" /> all systems · nominal
          </span>
          <span style={{ borderLeft: "1px solid #2a2520", paddingLeft: 14 }}>oncall · @j.tan</span>
          <span style={{ background: "var(--copper)", width: 28, height: 28, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 600, color: "#fff" }}>O</span>
        </div>
        <AppearancePopover theme={theme} />
      </header>

      <main style={{ padding: "28px 32px 60px", color: "var(--paper)" }}>
        {/* Top banner — the prime directive, repeated for operators */}
        <div style={{ marginBottom: 24, padding: "14px 20px", border: "1px solid #2a2520", borderLeft: "3px solid var(--copper)", background: "rgba(255,255,255,0.02)", borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--copper-2)" }}>operator pledge · displayed here every session</div>
            <div className="serif" style={{ fontSize: 24, marginTop: 4, color: "#fff", letterSpacing: "-0.01em" }}>
              You can't read user content from this console. Not even with two keys. That's the design — not a bug.
            </div>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#a08762", lineHeight: 1.7, textAlign: "right", whiteSpace: "nowrap" }}>
            ↳ build · a4f9b22e<br />
            ↳ enforced by · server build hash<br />
            ↳ verified · 4 min ago
          </div>
        </div>

        {/* Top row — fleet metrics */}
        <section style={{ marginBottom: 24 }}>
          <div className="eyebrow" style={{ color: "#a08762", marginBottom: 12 }}>↳ fleet · last 24h</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            <OpStat label="encrypted blobs stored" value="48.2M" sub="+ 312k today" />
            <OpStat label="ciphertext at rest" value="14.7 TB" sub="that's it — that's the data" />
            <OpStat label="active key holders" value="129,408" sub="last 24h auth events" />
            <OpStat label="repos created today" value="1,204" sub="all e2ee by default" />
            <OpStat label="server p99 latency" value="42 ms" sub="git over https" tone="moss" />
          </div>
        </section>

        {/* Two-column main: left = "can see", right = "can't see / things that prove it" */}
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 22 }}>
          {/* LEFT — things the operator CAN see and do */}
          <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <OpPanel
              eyebrow="↳ what the operator console exposes"
              title="What you can see"
              titleColor="#9bbf86"
            >
              {/* Health rows */}
              <HealthRow label="signing service (ct log)"  status="healthy" detail="last root · b1d4 0c7e · 3 min ago" />
              <HealthRow label="object storage · us-east"  status="healthy" detail="14.2 TB · 0 failed writes / 24h" />
              <HealthRow label="object storage · eu-west"  status="healthy" detail="6.8 TB · 0 failed writes / 24h" />
              <HealthRow label="auth · webauthn relying"   status="healthy" detail="42ms p99 · 96.4% success" />
              <HealthRow label="hsm cluster · key 0xae21"  status="degraded" detail="2 of 4 nodes attesting — investigating" />
              <HealthRow label="reproducible build runner" status="healthy" detail="12 of 12 reproducers green" last />
            </OpPanel>

            <OpPanel
              eyebrow="↳ ops queue · last 7 days"
              title="Pending operator actions"
              titleColor="#9bbf86"
            >
              <OpsQueueRow
                priority="P1"
                what="rotate signing key 0xae21 (90-day rotation due)"
                who="auto · routine"
                when="due in 6h"
              />
              <OpsQueueRow
                priority="P2"
                what="onboard featured project · cern/atlas-ml-models"
                who="d. okafor"
                when="this week"
              />
              <OpsQueueRow
                priority="P3"
                what="publish q2 audit report (trail of bits)"
                who="legal · review pending"
                when="2 weeks"
              />
              <OpsQueueRow
                priority="P4"
                what="annual co-signer rotation (sigstore witness)"
                who="auto · routine"
                when="next quarter"
                last
              />
            </OpPanel>

            <OpPanel
              eyebrow="↳ abuse pipeline · live"
              title="Abuse reports today"
              titleColor="#9bbf86"
            >
              <AbuseRow
                cat="DMCA"
                state="processed"
                caseRef="ABUSE-19f4"
                note="account suspended · we returned the ciphertext oid list to claimant · we cannot return plaintext, and said so"
              />
              <AbuseRow
                cat="CSAM hash match"
                state="processed"
                caseRef="ABUSE-19f5"
                note="NCMEC: blob hashes shared (ciphertext only) · account suspended · jurisdictional escalation triggered"
              />
              <AbuseRow
                cat="subpoena"
                state="responded"
                caseRef="LEG-2026-3a"
                note="returned: public key, login timestamps, encrypted object set · returned: 0 bytes plaintext"
                tone="warn"
              />
              <AbuseRow
                cat="terms violation · network abuse"
                state="processed"
                caseRef="ABUSE-19f6"
                note="repo namespace suspended · ciphertext quarantined for 30d then purged"
                last
              />
            </OpPanel>
          </section>

          {/* RIGHT — things the operator CANNOT see, made visible as redaction */}
          <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <OpPanel
              eyebrow="↳ user-content surface · for proof, not for use"
              title="What you can't see"
              titleColor="#d97a4a"
              accent="#3a1f17"
            >
              <CantSeeRow label="repo names (private)"   />
              <CantSeeRow label="file contents"          />
              <CantSeeRow label="commit messages"        />
              <CantSeeRow label="branch names"           />
              <CantSeeRow label="issue / pr text"        />
              <CantSeeRow label="collaborator list per private repo" subtle />
              <CantSeeRow label="search across user data" subtle last />
              <div style={{ padding: "12px 16px", fontFamily: "var(--mono)", fontSize: 11, color: "#a08762", borderTop: "1px solid #2a2520", lineHeight: 1.7 }}>
                ↳ enforced cryptographically · not by access control<br />
                ↳ deploying an operator console that could read this would <span style={{ color: "var(--copper-2)" }}>change the build hash</span> · break the transparency log · be witnessed publicly
              </div>
            </OpPanel>

            {/* What a random repo looks like to admin */}
            <OpPanel
              eyebrow="↳ random sampled repo · clicked from the fleet"
              title="GET /admin/repos/0x9a4fc2b8 — peek"
              titleColor="#d97a4a"
              accent="#3a1f17"
            >
              <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 18px", fontFamily: "var(--mono)", fontSize: 12 }}>
                <KVAdmin k="repo oid"      v="0x9a4f c2b8 7e01 d3aa" />
                <KVAdmin k="created"        v="2026-04-18 · 14:22 UTC" />
                <KVAdmin k="region"         v="us-east-1" />
                <KVAdmin k="objects"        v="412" />
                <KVAdmin k="ciphertext"     v="4.2 MB" />
                <KVAdmin k="wrapped keys"   v="6 collaborator keys (fingerprints only)" />
                <KVAdmin k="latest push"    v="38 seconds ago" />
                <KVAdmin k="owner email"   v={<span className="redacted" style={{ display: "inline-block", padding: "0 28px" }}>redacted</span>} redact />
                <KVAdmin k="repo name"     v={<span className="redacted" style={{ display: "inline-block", padding: "0 52px" }}>redacted</span>} redact />
                <KVAdmin k="readme"        v={<span className="redacted" style={{ display: "inline-block", padding: "0 80px" }}>redacted</span>} redact />
              </div>
              <div style={{ padding: "10px 18px", background: "#0f0d0a", borderTop: "1px solid #2a2520", fontFamily: "var(--mono)", fontSize: 11, color: "#a08762" }}>
                ↳ above is the entire admin payload · no "decrypt" button anywhere in this binary
              </div>
            </OpPanel>

            <OpPanel
              eyebrow="↳ transparency log · public, append-only"
              title="Log entries written this hour"
              titleColor="#9bbf86"
            >
              <LogMini when="00:42" what="root advanced · b1d4 0c7e" who="ct-signer" />
              <LogMini when="00:38" what="key added · @r2-d2 c218 ab30 d7e6" who="self-signed" />
              <LogMini when="00:31" what="abuse action · ciphertext purge · ABUSE-19f5" who="op · @j.tan" />
              <LogMini when="00:14" what="build hash published · a4f9 b22e" who="ci · siphr-builder" />
              <LogMini when="00:02" what="co-signer witness · sigstore · ok" who="ext · sigstore.dev" last />
            </OpPanel>
          </section>
        </div>

        {/* Bottom — the kill switch. Every operator dashboard should be honest about its powers. */}
        <section style={{ marginTop: 24 }}>
          <div style={{ border: "1px solid #5c2a1f", background: "rgba(138,42,31,0.08)", borderRadius: 6, padding: "18px 22px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
              <div className="serif" style={{ fontSize: 36, color: "var(--rust)", lineHeight: 1 }}>⚠</div>
              <div style={{ flex: 1 }}>
                <div className="eyebrow" style={{ marginBottom: 6, color: "var(--rust)" }}>↳ the powers we do have · listed openly</div>
                <h3 className="serif" style={{ fontSize: 24, color: "#fff", letterSpacing: "-0.01em" }}>
                  Things the operator can still do — and the transparency log it forces.
                </h3>
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", fontFamily: "var(--mono)", fontSize: 12, color: "#e8d9b8", lineHeight: 1.65 }}>
                  <div>↳ <strong style={{ color: "#fff" }}>refuse service</strong> — block an account or repo. Logged publicly.</div>
                  <div>↳ <strong style={{ color: "#fff" }}>purge ciphertext</strong> — delete blobs (e.g. abuse). Logged publicly.</div>
                  <div>↳ <strong style={{ color: "#fff" }}>ship new code</strong> — every release re-hashes; mismatch detectable.</div>
                  <div>↳ <strong style={{ color: "#fff" }}>add collaborators to platform repos</strong> — own org keys only.</div>
                  <div style={{ color: "#9bbf86" }}>✗ cannot decrypt user content · cannot grant decrypt to self · cannot impersonate keys</div>
                  <div style={{ color: "#9bbf86" }}>✗ cannot suppress transparency log entries · cannot retro-edit history</div>
                </div>
                <button className="btn ghost sm" style={{ marginTop: 18, background: "transparent", color: "#e8d9b8", borderColor: "#5c2a1f" }}>
                  read the full operator powers spec →
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// helpers ------------------------------------------------------------------

function OpStat({ label, value, sub, tone }) {
  return (
    <div style={{ background: "#0f0d0a", border: "1px solid #2a2520", borderRadius: 5, padding: "14px 16px" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#806c4a", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div className="serif" style={{ fontSize: 30, lineHeight: 1, marginTop: 8, color: tone === "moss" ? "#9bbf86" : "#fff" }}>{value}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#a08762", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function OpPanel({ eyebrow, title, titleColor, accent, children }) {
  return (
    <div style={{ background: accent || "#0f0d0a", border: `1px solid ${accent ? "#5c3a1f" : "#2a2520"}`, borderRadius: 6, overflow: "hidden" }}>
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #2a2520" }}>
        <div className="eyebrow" style={{ color: "#a08762", marginBottom: 6 }}>{eyebrow}</div>
        <h3 className="serif" style={{ fontSize: 22, color: titleColor || "#fff", letterSpacing: "-0.01em" }}>{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function HealthRow({ label, status, detail, last }) {
  const colors = {
    healthy: "#9bbf86",
    degraded: "#e8c766",
    down: "#d97a4a",
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, padding: "11px 18px", borderBottom: last ? "none" : "1px solid #1f1c17", alignItems: "center" }}>
      <Dot color={colors[status]} />
      <div>
        <div style={{ fontSize: 13, color: "#fff" }}>{label}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#a08762", marginTop: 2 }}>{detail}</div>
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: colors[status], textTransform: "uppercase", letterSpacing: "0.1em" }}>{status}</span>
    </div>
  );
}

function OpsQueueRow({ priority, what, who, when, last }) {
  const pColors = { P1: "#d97a4a", P2: "#e8c766", P3: "#a08762", P4: "#a08762" };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 14, padding: "11px 18px", borderBottom: last ? "none" : "1px solid #1f1c17", alignItems: "center" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: pColors[priority], border: `1px solid ${pColors[priority]}`, padding: "1px 7px", borderRadius: 3 }}>{priority}</span>
      <span style={{ fontSize: 13, color: "#fff" }}>{what}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#a08762" }}>{who}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#a08762", minWidth: 90, textAlign: "right" }}>{when}</span>
    </div>
  );
}

function AbuseRow({ cat, state, caseRef, note, last, tone }) {
  return (
    <div style={{ padding: "12px 18px", borderBottom: last ? "none" : "1px solid #1f1c17" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "1px 7px", borderRadius: 3, background: tone === "warn" ? "#3a2a17" : "#1f2a1c", color: tone === "warn" ? "#e8c766" : "#9bbf86", letterSpacing: "0.08em" }}>{cat}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#a08762" }}>{caseRef}</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "#9bbf86" }}>✓ {state}</span>
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#e8d9b8", lineHeight: 1.55 }}>{note}</div>
    </div>
  );
}

function CantSeeRow({ label, subtle, last }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 18, padding: "10px 18px", borderBottom: last ? "none" : "1px solid #1f1c17", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: subtle ? "#a08762" : "#e8d9b8" }}>{label}</span>
      <span className="redacted" style={{ display: "inline-block", padding: "0 36px", height: 18 }}>redacted</span>
    </div>
  );
}

function KVAdmin({ k, v, redact }) {
  return (
    <>
      <span style={{ color: "#806c4a", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", paddingTop: 3, whiteSpace: "nowrap" }}>{k}</span>
      <span style={{ color: redact ? "transparent" : "#e8d9b8" }}>{v}</span>
    </>
  );
}

function LogMini({ when, what, who, last }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 14, padding: "10px 18px", borderBottom: last ? "none" : "1px solid #1f1c17", alignItems: "center" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#806c4a" }}>{when}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#e8d9b8" }}>{what}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#a08762" }}>{who}</span>
    </div>
  );
}

window.ScreenAdmin = ScreenAdmin;
