// Roadmap — grounded in the actual codebase. Phases from "what already
// ships" through MVP, collaboration, verifiability, public launch, ecosystem.
// Each design from this canvas is tagged with the phase that would ship it,
// so the user can see how the mocks line up against real work.

function ScreenRoadmap({ theme = "dark" }) {
  return (
    <div className={`siphr-surface ${theme}`} style={{ width: 1280, minHeight: 2300 }}>
      <TopNav user="r" active="security" theme={theme} />

      {/* HEAD ------------------------------------------------------------- */}
      <section style={{ padding: "64px 80px 36px" }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>↳ /roadmap · honest about what ships when</div>
        <h1 className="serif" style={{ fontSize: 80, lineHeight: 0.98, letterSpacing: "-0.025em" }}>
          What's <em style={{ color: "var(--copper)" }}>built</em>,<br />
          what's <em style={{ color: "var(--copper)" }}>next</em>,<br />
          what's <em style={{ color: "var(--copper)" }}>not planned.</em>
        </h1>
        <p style={{ marginTop: 22, fontSize: 16.5, maxWidth: 720, color: "var(--ink-2)", lineHeight: 1.55 }}>
          Siphr is being built in the open. This page tracks the work against the cryptographic claims on the
          rest of the site. If a claim isn't shipped yet, it's marked
          <span style={{ background: "var(--amber-bg)", color: "#7a5a16", padding: "0 6px", borderRadius: 3, fontFamily: "var(--mono)", fontSize: 13, margin: "0 4px" }}>planned</span>
          and tied to a phase below. No vapor.
        </p>

        {/* Big-picture stats */}
        <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          <RoadHeadStat label="phase shipping now"      value="0.1"    sub="scaffold + identity" tone="copper" />
          <RoadHeadStat label="phase in progress"        value="0.2"    sub="repo create with wrap" />
          <RoadHeadStat label="public 1.0 target"        value="Q4 26"  sub="after independent audit" />
          <RoadHeadStat label="commits in last 30d"      value="142"    sub="see /transparency" tone="moss" />
        </div>
      </section>

      {/* THE NOW BAR ----------------------------------------------------- */}
      <section style={{ padding: "0 80px 40px" }}>
        <div className="card" style={{ padding: "22px 26px", background: "var(--paper-2)", borderLeft: "3px solid var(--copper)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 28, alignItems: "center" }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8, color: "var(--copper)" }}>↳ today · v0.1 (scaffold)</div>
              <h2 className="serif" style={{ fontSize: 32, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                You can sign up, generate a real keypair, and create a repo record.
              </h2>
              <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 720 }}>
                You can't yet push code to it. The transport layer (git over HTTPS, encrypted in the browser
                before upload) is what phase v0.2–0.4 is for. That's the next thing being built.
              </p>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", lineHeight: 1.7, textAlign: "right" }}>
              ↳ commit · a4f9b22e<br />
              ↳ live at · siphr.vercel.app<br />
              ↳ source · <span style={{ color: "var(--copper)" }}>github.com/VisualActions/Siphr</span>
            </div>
          </div>
        </div>
      </section>

      {/* PHASES TIMELINE ------------------------------------------------- */}
      <section style={{ padding: "8px 80px 56px" }}>
        <Phase
          n="00"
          label="v0.1 scaffold"
          status="shipped"
          headline="Crypto, identity, and a place to put things"
          blurb="Most of the cryptographic plumbing is real. What's missing is the transport on top — pushing actual git objects and getting them back."
          shipped={[
            "WebCrypto identity: P-256 ECDH keypair generated client-side",
            "Passphrase-wrapped private key (PBKDF2-SHA256 · 600k iter · AES-GCM)",
            "Stable public-key fingerprints (SHA-256 of canonical JWK)",
            "Repo-key wrap/unwrap primitives (ECDH + AES-GCM)",
            "Per-object encrypt/decrypt with the repo key (AES-256-GCM · fresh nonce)",
            "Postgres schema for users / repos / refs / objects (via Supabase)",
            "Signup flow that actually wraps your private key locally",
            "Dashboard reads /api/users + /api/repos (real data)",
            "Featured + verified-org flags exist in DB · waiting on UI",
          ]}
          notes="lib/crypto.ts is the source of truth. Everything else gets to assume these primitives work."
          designs={["01 Landing", "02 Key Ceremony", "04 Dashboard", "05 Transparency (page, not yet live data)"]}
        />

        <Phase
          n="01"
          label="v0.2 — v0.4 MVP: a repo you can use"
          status="in-progress"
          headline="The hard part — actually shipping ciphertext over the wire"
          blurb="A repo isn't a repo until you can push to it. This phase wires browser-side git on top of the encryption primitives that already exist."
          planned={[
            "Repo-create UI generates AES-256 repo key + wraps to your pub (no server round-trip with the key)",
            "Git smart-HTTP endpoints — POST encrypted packs in, GET encrypted objects out",
            "isomorphic-git in the browser does the actual push / fetch / clone",
            "File browser hooked to real objects (currently reads mock data)",
            "In-browser file editor + commit (no terminal required for v1)",
            "Public repos: plaintext path, same transport, no encryption step",
            "siphr.dev/r/{owner}/{name}.git → real git remote (HTTPS only · no SSH)",
          ]}
          notes={<>HTTPS only. SSH isn't planned — keys live in the browser, not in <code>~/.ssh</code>. The CLI is a community goal, not on the team roadmap.</>}
          designs={["08 Create a repo", "09 Quick setup (browser paths)", "03 Repo page (with real objects)"]}
          eta="Q2 — Q3 2026"
        />

        <Phase
          n="02"
          label="v0.5 — v0.6 Collaboration"
          status="planned"
          headline="More than one key per repo"
          blurb="The wrap-to-recipient primitives already work for one person. This phase makes them real for multi-collaborator repos and the painful case (revocation)."
          planned={[
            "Invite by public-key fingerprint · pending-invite handshake",
            "Wrap repo key to each accepted collaborator client-side",
            "Revoke a collaborator → rotate repo key → re-encrypt every object on next push",
            "Issues / PRs with encrypted bodies (each thread has its own sub-key)",
            "Ed25519 signing keys for commit signatures (separate from ECDH key)",
            "Web of trust: mark another fingerprint as 'verified' (out-of-band)",
          ]}
          designs={["03 Repo page (collaborator list)", "06 Featured (multi-org collaboration model)"]}
          eta="Q3 2026"
        />

        <Phase
          n="03"
          label="v0.7 — v0.8 Trust & verifiability"
          status="planned"
          headline="Make 'verify, don't trust' actually verifiable"
          blurb="A privacy product without verifiable claims is just a sticker. This phase ships the things that turn the marketing page into evidence."
          planned={[
            "Recovery codes (8-word BIP-39-style) generated at signup · the only escape hatch",
            "Public-key transparency log · append-only · Merkle witness",
            "Reproducible build pipeline · published build hash · external reproducers",
            "/transparency wired to real data (currently illustrative)",
            "Per-repo audit log of key-events (add, rotate, revoke)",
            "Open-source release under AGPL (currently TBD)",
          ]}
          designs={["05 Transparency", "02 Key Ceremony (recovery-words step 4)"]}
          eta="Q3 — Q4 2026"
        />

        <Phase
          n="04"
          label="v1.0 Public launch"
          status="planned"
          headline="Audit, then doors open"
          blurb="An audit before launch isn't a flex — it's the only reason a stranger should trust the marketing page. The roadmap deliberately doesn't put a date on this."
          planned={[
            "External crypto + threat-model audit (Trail of Bits or similar)",
            "Public bug bounty",
            "Operator console live (lib/admin.ts is already scaffolded)",
            "Featured-projects program: surface verified-orgs publicly",
            "Status page · uptime SLO published · honest about incidents",
            "Pricing committed (free for public + 1 private; paid for orgs)",
          ]}
          designs={["06 Featured", "07 Operator console"]}
          eta="Q4 2026 — Q1 2027 · audit-dependent"
        />

        <Phase
          n="05"
          label="v1.1+ Ecosystem"
          status="later"
          headline="The things that come after a launch worth caring about"
          blurb="Deliberately listed last. None of these matter if v0.4–v0.8 aren't real."
          planned={[
            "Native git helper (encrypts on push) · community could ship this earlier",
            "Mobile-friendly browse (read-only first)",
            "GitHub mirror import · 'send my embargoed branch to Siphr' flow",
            "Webhooks (signed, scoped to public-key holders only)",
            "Org accounts with key-hierarchy (admin keys delegate to repo keys)",
            "Languages other than English in the UI",
          ]}
          notExplored={[
            "SSH transport — not planned · keys live in the browser, not ~/.ssh",
            "Federated forge protocol (ForgeFed) — deferred · not enough adopters yet",
            "AI-anything — out of scope on purpose · 'we can't read it' includes us",
          ]}
        />
      </section>

      {/* WHAT WE'RE NOT BUILDING ---------------------------------------- */}
      <section style={{ padding: "0 80px 64px" }}>
        <div className="card" style={{ padding: "28px 30px 24px", background: "var(--paper-2)" }}>
          <div className="eyebrow" style={{ marginBottom: 10, color: "var(--rust)" }}>↳ things we won't build · listed here so you don't wait for them</div>
          <h2 className="serif" style={{ fontSize: 32, letterSpacing: "-0.02em", marginBottom: 18 }}>
            The deliberate absences.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 32px" }}>
            <NotPlanned
              title="SSH transport"
              why="Private keys live in the browser. We don't want a copy in ~/.ssh — that would double the attack surface for no security gain."
            />
            <NotPlanned
              title="Email-based password reset"
              why="If we could reset your access by email, we could be compelled to. The whole pitch breaks. Recovery codes only."
            />
            <NotPlanned
              title="Server-side search across private repos"
              why="The server holds ciphertext. Searching it is impossible without a key — by design. Search is client-side."
            />
            <NotPlanned
              title="An LLM trained on your code"
              why="'We can't read it either' has to include us. Inference-time access is reading."
            />
          </div>
        </div>
      </section>

      {/* HOW TO HELP ---------------------------------------------------- */}
      <section style={{ padding: "0 80px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
          <HelpCard
            label="USE IT"
            title="Try the scaffold."
            body="Sign up. Make a placeholder repo. Lose your passphrase on purpose and confirm we can't recover it. File issues."
            cta="siphr.vercel.app"
          />
          <HelpCard
            label="REVIEW IT"
            title="Audit the crypto."
            body="lib/crypto.ts is 200 lines. Read it. Tell us what's wrong. The threat model wins from being wrong loudly and early."
            cta="github.com/VisualActions/Siphr/blob/main/lib/crypto.ts"
          />
          <HelpCard
            label="REPRODUCE IT"
            title="Build it yourself."
            body="When v0.8 ships, we'll publish a build hash. Until then: clone, build, diff. Any mismatch is interesting."
            cta="github.com/VisualActions/Siphr"
          />
        </div>

        <div style={{ marginTop: 32, paddingTop: 18, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
          <span>↳ last updated · 19 may 2026</span>
          <span>↳ this page is part of the repo · edit it via pull request</span>
        </div>
      </section>
    </div>
  );
}

// ---- bits ---------------------------------------------------------------
function RoadHeadStat({ label, value, sub, tone }) {
  const color = tone === "copper" ? "var(--copper)" : tone === "moss" ? "var(--moss)" : "var(--ink)";
  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div className="serif" style={{ fontSize: 36, lineHeight: 1, color }}>{value}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function Phase({ n, label, status, headline, blurb, shipped, planned, notExplored, designs, notes, eta }) {
  const statusMeta = {
    "shipped":     { color: "var(--moss)",   bg: "var(--moss-bg)",   text: "✓ shipped" },
    "in-progress": { color: "var(--copper)", bg: "var(--copper-bg)", text: "● in progress" },
    "planned":     { color: "#9a6700",       bg: "var(--amber-bg)",  text: "○ planned" },
    "later":       { color: "var(--muted)",  bg: "var(--paper-2)",   text: "·· later" },
  }[status];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 24, marginBottom: 36, position: "relative" }}>
      {/* rail */}
      <div style={{ position: "relative" }}>
        <div className="serif" style={{ fontSize: 56, color: "var(--muted-2)", letterSpacing: "-0.03em", lineHeight: 1 }}>{n}</div>
        <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 10, color: statusMeta.color, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", background: statusMeta.bg, borderRadius: 3, display: "inline-block" }}>
          {statusMeta.text}
        </div>
      </div>

      {/* body */}
      <div className="card" style={{ padding: "26px 28px 24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
          <div className="eyebrow">{label}</div>
          {eta && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>↳ target · {eta}</span>}
        </div>
        <h3 className="serif" style={{ fontSize: 28, letterSpacing: "-0.015em", marginBottom: 10, lineHeight: 1.15 }}>{headline}</h3>
        <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 18, maxWidth: 800 }}>{blurb}</p>

        {shipped && (
          <List items={shipped} prefix="✓" prefixColor="var(--moss)" />
        )}
        {planned && (
          <List items={planned} prefix="○" prefixColor={status === "in-progress" ? "var(--copper)" : "#9a6700"} />
        )}
        {notExplored && (
          <div style={{ marginTop: 12 }}>
            <List items={notExplored} prefix="✗" prefixColor="var(--rust)" />
          </div>
        )}

        {notes && (
          <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--paper-2)", borderRadius: 5, fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", lineHeight: 1.55 }}>
            ↳ {notes}
          </div>
        )}

        {designs && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--line)" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>design coverage · </span>
            {designs.map((d, i) => (
              <span key={d} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--copper)" }}>
                {i > 0 && <span style={{ color: "var(--muted-2)" }}> · </span>}
                {d}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function List({ items, prefix, prefixColor }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: 8, alignItems: "start", padding: "3px 0", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
          <span style={{ color: prefixColor, fontFamily: "var(--mono)", fontSize: 12 }}>{prefix}</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function NotPlanned({ title, why }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--rust)", fontFamily: "var(--mono)" }}>✗</span>
        {title}
      </div>
      <p style={{ marginTop: 4, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, paddingLeft: 22 }}>{why}</p>
    </div>
  );
}

function HelpCard({ label, title, body, cta }) {
  return (
    <div className="card" style={{ padding: "22px 22px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--copper)", letterSpacing: "0.12em" }}>{label}</div>
      <h3 className="serif" style={{ fontSize: 24, letterSpacing: "-0.015em" }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, flex: 1 }}>{body}</p>
      <div style={{ marginTop: 4, paddingTop: 12, borderTop: "1px dashed var(--line)", fontFamily: "var(--mono)", fontSize: 11, color: "var(--copper)" }}>↳ {cta}</div>
    </div>
  );
}

window.ScreenRoadmap = ScreenRoadmap;
