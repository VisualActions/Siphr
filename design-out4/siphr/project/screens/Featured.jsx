// Featured — landmark open-source projects on Siphr. Even projects whose
// canonical home is GitHub can be featured here for the parts they want
// encrypted (internal mirrors, security research, classified branches).

function ScreenFeatured({ theme = "dark" }) {
  return (
    <div className={`siphr-surface ${theme}`} style={{ width: 1280, minHeight: 1700 }}>
      <TopNav user="r" active="explore" theme={theme} />

      {/* Page header */}
      <section style={{ padding: "56px 80px 36px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 720 }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>↳ /featured · curated by the siphr editorial team · updated weekly</div>
            <h1 className="serif" style={{ fontSize: 76, lineHeight: 0.98, letterSpacing: "-0.025em" }}>
              The landmark projects<br />
              that needed a <em style={{ color: "var(--copper)" }}>second forge.</em>
            </h1>
            <p style={{ marginTop: 22, fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 620 }}>
              These projects also live on GitHub — and that's fine. They mirror to Siphr for the parts that
              don't belong in the open: internal forks, embargoed security work, vendor branches, the
              repositories where "plaintext at rest" is the wrong default.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
            <span>↳ 47 featured projects</span>
            <span>↳ 12 added this quarter</span>
            <span>↳ propose one · <span style={{ color: "var(--copper)" }}>editorial@siphr.dev</span></span>
          </div>
        </div>

        {/* Category strip */}
        <div style={{ marginTop: 36, display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
          {[
            { label: "all", count: 47, active: true },
            { label: "operating systems", count: 8 },
            { label: "game engines", count: 6 },
            { label: "languages & compilers", count: 9 },
            { label: "browsers", count: 4 },
            { label: "security research", count: 12 },
            { label: "scientific", count: 8 },
          ].map((c) => (
            <span key={c.label} style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: c.active ? "var(--copper)" : "var(--muted)",
              borderBottom: c.active ? "2px solid var(--copper)" : "2px solid transparent",
              paddingBottom: 6,
              display: "inline-flex",
              gap: 6,
            }}>
              {c.label}
              <span style={{ color: "var(--muted-2)" }}>· {c.count}</span>
            </span>
          ))}
        </div>
      </section>

      {/* HERO FEATURE — split layout, big-deal project */}
      <section style={{ padding: "48px 80px 56px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden", background: "#fffdf7", border: "1px solid var(--ink)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 0 }}>
            {/* Left — editorial */}
            <div style={{ padding: "40px 44px 36px" }}>
              <div className="eyebrow" style={{ marginBottom: 16, color: "var(--copper)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: "var(--copper)", color: "#fff", padding: "2px 8px", borderRadius: 3, fontSize: 10, letterSpacing: "0.12em" }}>★ feature</span>
                <span>· this week · 19 may 2026</span>
              </div>
              <h2 className="serif" style={{ fontSize: 52, letterSpacing: "-0.02em", lineHeight: 1.02 }}>
                Microsoft moves <em style={{ color: "var(--copper)" }}>Windows&nbsp;Core</em> security research to Siphr.
              </h2>
              <p style={{ marginTop: 22, fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>
                The kernel team still lives on GitHub for public Windows components. But the embargoed CVE
                pipeline — three years of unreleased patches and proof-of-concept exploits — moved here in
                March. The argument was uncomplicated: encrypted at rest, wrapped to a known set of public
                keys, signed commits, no recovery path through us.
              </p>

              {/* Quote */}
              <div style={{ marginTop: 28, paddingLeft: 18, borderLeft: "3px solid var(--copper)" }}>
                <p className="serif" style={{ fontSize: 22, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                  "Plaintext at rest was never the right answer for embargoed work.
                  This is the first forge where we didn't have to negotiate that."
                </p>
                <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                  ↳ d. wexler · principal pm, msrc · win/core-research-2026.12
                </div>
              </div>

              <div style={{ marginTop: 30, display: "flex", gap: 10 }}>
                <button className="btn">View on Siphr</button>
                <button className="btn ghost">Read the writeup</button>
              </div>
            </div>

            {/* Right — repo card */}
            <div style={{ background: "var(--paper-2)", padding: "32px 32px 28px", borderLeft: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <FingerprintSigil seed="microsoft windows-core" size={56} />
                <div>
                  <div style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)" }}>microsoft</div>
                  <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>windows-core/research</div>
                </div>
              </div>

              <div style={{ marginTop: 22, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Pill variant="encrypted">e2ee</Pill>
                <Pill variant="public">verified org</Pill>
                <Pill>kernel research</Pill>
                <Pill>2026.q1 onboarded</Pill>
              </div>

              <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontFamily: "var(--mono)" }}>
                <BigStat label="commits/wk" value="412" sub="last 4 weeks" />
                <BigStat label="ciphertext" value="14.2 GB" sub="server-side" />
                <BigStat label="key holders" value="38" sub="msrc + 3 partner labs" />
                <BigStat label="rotations" value="6" sub="this quarter" />
              </div>

              {/* Mini "what server sees" line */}
              <div style={{ marginTop: 24, padding: "12px 14px", background: "#0f0d0a", borderRadius: 5, fontFamily: "var(--mono)", fontSize: 11, color: "#c8a868", lineHeight: 1.7 }}>
                <div style={{ color: "#806c4a" }}># siphr.dev sees, for any of the 142,090 objects</div>
                <div>oid · 9a4f c2b8 7e01 · type · blob (encrypted)</div>
                <div style={{ color: "#8a2a1f" }}>filename · (redacted) · content · (redacted)</div>
              </div>

              {/* Decorative cipher strip */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--line)" }}>
                <CipherStrip seed="microsoft windows core" bytes={48} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GRID OF FEATURED */}
      <section style={{ padding: "0 80px 56px" }}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>↳ also featured · landmark codebases</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <FeaturedCard
            tag="operating systems"
            org="reactos"
            name="reactos/kernel"
            seed="reactos kernel"
            why="Mirrors the entire kernel here so security-disclosure branches can sit alongside the public tree without leaking pre-patch."
            commits="2.1k"
            keys="124"
            ciphertext="8.4 GB"
            since="2025.q3"
          />
          <FeaturedCard
            tag="operating systems"
            org="linux"
            name="kernel/embargoed"
            seed="linux kernel embargoed"
            why="Just the embargoed CVE branches. greg-kh holds the only owner key. Subpoena-resistant by design — that's the whole point."
            commits="318"
            keys="46"
            ciphertext="1.2 GB"
            since="2024.q4"
            featured
          />
          <FeaturedCard
            tag="game engines"
            org="epic"
            name="unreal/restricted"
            seed="unreal restricted"
            why="Vendor branches under NDA with platform holders. Sony, Nintendo, and a console maker that won't be named all have separate wrapped keys."
            commits="1.4k"
            keys="62"
            ciphertext="42.0 GB"
            since="2026.q1"
          />
          <FeaturedCard
            tag="browsers"
            org="mozilla"
            name="mozilla/0day-pipeline"
            seed="mozilla 0day"
            why="The pre-disclosure window for Firefox security advisories. Encrypted from filed-bug to ship-day. Zero plaintext at rest."
            commits="89"
            keys="22"
            ciphertext="612 MB"
            since="2025.q4"
          />
          <FeaturedCard
            tag="languages"
            org="rust-lang"
            name="rust/sec-audit"
            seed="rust sec audit"
            why="The rust security response WG keeps all of its working repos here. The public advisories continue to ship from rust-lang on GitHub."
            commits="217"
            keys="14"
            ciphertext="220 MB"
            since="2025.q1"
          />
          <FeaturedCard
            tag="scientific"
            org="cern"
            name="atlas/ml-models"
            seed="cern atlas ml"
            why="Detector-tuning ML models that are export-controlled. The 'who can decrypt' list is the audit trail the compliance team actually wanted."
            commits="76"
            keys="9"
            ciphertext="11.4 GB"
            since="2025.q2"
          />
        </div>
      </section>

      {/* WHY HERE — column of quotes */}
      <section style={{ padding: "32px 80px 64px", borderTop: "1px solid var(--line)", background: "var(--paper-2)" }}>
        <div className="eyebrow" style={{ marginBottom: 24 }}>↳ why these teams mirror here instead of self-hosting</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
          <ReasonQuote
            quote="We had a self-hosted forge. We were also the people patching it on a saturday. Siphr is one fewer surface to defend without giving up encryption-at-rest."
            who="g. lessard · security lead, reactos"
          />
          <ReasonQuote
            quote="The threat model didn't change — our patience for running yet another gitea instance did. Their transparency log is more aggressive than ours was."
            who="p. zhao · principal engineer, epic"
          />
          <ReasonQuote
            quote="A subpoena hits ciphertext and ends. That's not a feature we could write into our self-hosted setup without three lawyers."
            who="anonymous · disclosed program · mozilla"
          />
        </div>
      </section>

      {/* Propose strip */}
      <section style={{ padding: "40px 80px 64px", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32, alignItems: "center" }}>
        <div>
          <h3 className="serif" style={{ fontSize: 36, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Run something landmark? <em style={{ color: "var(--copper)" }}>Propose it.</em>
          </h3>
          <p style={{ marginTop: 12, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 560 }}>
            Featured projects get a sigil-stamped page, free unlimited storage during their first year, and a
            dedicated infra contact. We pay attention to scope, not vibes — bring your threat model.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn copper">Propose your project</button>
          <button className="btn ghost">Read the criteria</button>
        </div>
      </section>
    </div>
  );
}

// helpers ------------------------------------------------------------------
function BigStat({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
      <div className="serif" style={{ fontSize: 30, lineHeight: 1, color: "var(--ink)", marginTop: 4, fontFamily: "var(--serif)" }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function FeaturedCard({ tag, org, name, seed, why, commits, keys, ciphertext, since, featured }) {
  return (
    <div className="card" style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 14, position: "relative", background: featured ? "#fffdf7" : "#fffdf7", border: featured ? "1px solid var(--copper)" : "1px solid var(--line)" }}>
      {featured && (
        <div style={{ position: "absolute", top: -1, right: 16, background: "var(--copper)", color: "#fff", fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: "0 0 3px 3px" }}>
          ★ editor's pick
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <FingerprintSigil seed={seed} size={36} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{tag}</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            <span style={{ color: "var(--muted)" }}>{org}/</span>{name.split("/")[1]}
          </div>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55, minHeight: 96, margin: 0 }}>{why}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontFamily: "var(--mono)", fontSize: 11, paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
        <Mini k="commits" v={commits} />
        <Mini k="keys" v={keys} />
        <Mini k="cipher" v={ciphertext} />
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
        <span>↳ onboarded {since}</span>
        <span style={{ color: "var(--moss)" }}>● also mirrors github</span>
      </div>
    </div>
  );
}

function Mini({ k, v }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k}</div>
      <div style={{ marginTop: 2 }}>{v}</div>
    </div>
  );
}

function ReasonQuote({ quote, who }) {
  return (
    <div>
      <p className="serif" style={{ fontSize: 20, lineHeight: 1.35, letterSpacing: "-0.01em" }}>"{quote}"</p>
      <div style={{ marginTop: 14, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>↳ {who}</div>
    </div>
  );
}

window.ScreenFeatured = ScreenFeatured;
