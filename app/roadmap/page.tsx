import Link from "next/link";
import TopNav from "@/components/TopNav";

export const metadata = {
  title: "Roadmap — Siphr",
  description: "Honest about what's built, what's next, what's not planned.",
};

export default function RoadmapPage() {
  return (
    <>
      <TopNav active="security" />
      <main>
        {/* HEAD ---------------------------------------------------- */}
        <section style={{ padding: "64px 6vw 36px", maxWidth: 1280, margin: "0 auto" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>↳ /roadmap · honest about what ships when</div>
          <h1 className="serif" style={{ fontSize: 76, lineHeight: 0.98, letterSpacing: "-0.025em" }}>
            What&apos;s <em style={{ color: "var(--copper)" }}>built</em>,<br />
            what&apos;s <em style={{ color: "var(--copper)" }}>next</em>,<br />
            what&apos;s <em style={{ color: "var(--copper)" }}>not planned.</em>
          </h1>
          <p style={{ marginTop: 22, fontSize: 16.5, maxWidth: 720, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Siphr is being built in the open. This page tracks the work against the cryptographic claims on the
            rest of the site. If a claim isn&apos;t shipped yet, it&apos;s marked
            <span style={{
              background: "var(--amber-bg)", color: "#7a5a16",
              padding: "0 6px", borderRadius: 3,
              fontFamily: "var(--mono)", fontSize: 13, margin: "0 4px",
            }}>planned</span>
            and tied to a phase below. No vapor.
          </p>

          <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
            <RoadHeadStat label="phase shipping now" value="0.2" sub="repo create + browser-side commits" tone="copper" />
            <RoadHeadStat label="phase in progress" value="0.3" sub="real file-tree browse + collaborator wrap" />
            <RoadHeadStat label="public 1.0 target" value="Q4 26" sub="after independent audit" />
            <RoadHeadStat label="source" value="github" sub="VisualActions/Siphr" tone="moss" />
          </div>
        </section>

        {/* THE NOW BAR --------------------------------------------- */}
        <section style={{ padding: "0 6vw 40px", maxWidth: 1280, margin: "0 auto" }}>
          <div className="card" style={{
            padding: "22px 26px",
            background: "var(--paper-2)",
            borderLeft: "3px solid var(--copper)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 8, color: "var(--copper)" }}>
                  ↳ today · v0.2 (browser-side commits)
                </div>
                <h2 className="serif" style={{ fontSize: 32, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  You can sign up, generate a real keypair, create a repo, and commit files from the browser.
                </h2>
                <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 720 }}>
                  Smart-HTTP transport for plain <code>git push</code> is shipping in v0.3&ndash;v0.4. Today,
                  private repos use the in-browser editor and folder-drop paths — every byte encrypted in the
                  tab before upload.
                </p>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", lineHeight: 1.7, textAlign: "right" }}>
                ↳ live at · siphr.vercel.app<br />
                ↳ source ·{" "}
                <a href="https://github.com/VisualActions/Siphr" target="_blank" rel="noreferrer" style={{ color: "var(--copper)" }}>
                  github.com/VisualActions/Siphr
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* PHASES -------------------------------------------------- */}
        <section style={{ padding: "8px 6vw 56px", maxWidth: 1280, margin: "0 auto" }}>
          <Phase
            n="00"
            label="v0.1 scaffold"
            status="shipped"
            headline="Crypto, identity, and a place to put things"
            blurb="The cryptographic plumbing is real. Object writes go to Supabase; the server holds public material only."
            shipped={[
              "WebCrypto identity: P-256 ECDH keypair generated client-side",
              "Passphrase-wrapped private key (PBKDF2-SHA256 · 600k iter · AES-GCM)",
              "Stable public-key fingerprints (SHA-256 of canonical JWK)",
              "Repo-key wrap/unwrap (ECDH + AES-GCM)",
              "Per-object AES-256-GCM with fresh nonce",
              "Postgres schema (users / repos / refs / objects) via Supabase",
              "Signup flow that actually wraps your private key locally",
              "Dashboard reads /api/users + /api/repos (real data)",
              "Cross-device sign-in via encrypted identity blob",
            ]}
            notes="lib/crypto.ts is the source of truth. Everything else gets to assume these primitives work."
            designs={["01 Landing", "02 Key Ceremony", "04 Dashboard", "05 Transparency (illustrative)"]}
          />

          <Phase
            n="01"
            label="v0.2 · browser-side commits"
            status="shipped"
            headline="The first real commit, end-to-end encrypted in the tab"
            blurb="The repo-create UI generates a fresh AES-256 repo key in the browser, wraps it to your public key, and stores ciphertext only. The empty-repo page is a real working in-browser editor."
            shipped={[
              "/repos/new matches artboard 08 (step rail, name-availability, segmented visibility)",
              "Toggle grid for commits/branches/issues/filenames + rotation cadence",
              "Live server-view preview updates as toggles flip",
              "isomorphic-git over Lightning FS in the browser",
              "In-browser file editor with a working commit button",
              "Folder drop via File System Access API · default-skip .git/.env/node_modules/",
              "Each loose object encrypted with the repo key before PUT",
              "Refs advance server-side after the upload finishes",
              "/admin operator console + /featured curation",
            ]}
            designs={["08 Create a repo", "09 Quick setup (paths 01 + 02)", "06 Featured", "07 Operator"]}
          />

          <Phase
            n="02"
            label="v0.3 — v0.4 · real transport"
            status="in-progress"
            headline="git clone + git push for public repos · v0.4 includes a private-repo helper"
            blurb="Smart-HTTP discovery returns 403 for private today; v0.3 implements the real upload-pack + receive-pack for public repos so plain `git push` works end-to-end. v0.4 ships a native helper for private."
            planned={[
              "Smart-HTTP upload-pack (real packfile streaming) for public repos",
              "Smart-HTTP receive-pack with object validation for public repos",
              "File browser hooked to real objects (currently only public-repo tree is real)",
              "Amend / multi-commit support in the browser editor",
              "Native siphr-helper binary · intercepts plain push for private repos",
              "Per-commit signing with Ed25519 keys (separate keypair from the ECDH one)",
            ]}
            notes={<>HTTPS only. SSH is not planned — keys live in the browser, not <code>~/.ssh</code>.</>}
            designs={["03 Repo page (with real objects)", "09 Quick setup paths 03 + 04"]}
            eta="Q2 — Q3 2026"
          />

          <Phase
            n="03"
            label="v0.5 — v0.6 · collaboration"
            status="planned"
            headline="More than one key per repo"
            blurb="The wrap-to-recipient primitives already work for one person. This phase ships them for multi-collaborator repos and the painful case (revocation)."
            planned={[
              "Invite by public-key fingerprint · pending-invite handshake",
              "Wrap repo key to each accepted collaborator client-side",
              "Revoke → rotate repo key → re-encrypt every object on next push",
              "Issues / PRs with encrypted bodies (per-thread sub-key)",
              "Ed25519 signing for commit signatures",
              "Web of trust: mark another fingerprint as verified out-of-band",
            ]}
            designs={["03 Repo page (collaborator list)", "06 Featured (multi-org model)"]}
            eta="Q3 2026"
          />

          <Phase
            n="04"
            label="v0.7 — v0.8 · trust & verifiability"
            status="planned"
            headline="Make 'verify, don't trust' actually verifiable"
            blurb="A privacy product without verifiable claims is just a sticker. This phase ships the things that turn the marketing page into evidence."
            planned={[
              "Recovery codes (8-word BIP-39-style) generated at signup",
              "Public-key transparency log · append-only · Merkle witness",
              "Reproducible build pipeline · published build hash · external reproducers",
              "/transparency wired to real data (currently illustrative)",
              "Per-repo audit log of key-events (add, rotate, revoke)",
              "AGPL-3.0 license on the repo (committed)",
            ]}
            designs={["05 Transparency", "02 Key Ceremony (recovery-words step 4)"]}
            eta="Q3 — Q4 2026"
          />

          <Phase
            n="05"
            label="v1.0 · public launch"
            status="planned"
            headline="Audit, then doors open"
            blurb="An audit before launch isn't a flex — it's the only reason a stranger should trust the marketing page. Deliberately no fixed date."
            planned={[
              "External crypto + threat-model audit (Trail of Bits or similar)",
              "Public bug bounty",
              "Operator console live (lib/admin.ts already scaffolded)",
              "Featured-projects program: surface verified orgs publicly",
              "Status page · uptime SLO published · honest about incidents",
              "Pricing committed (free for public + 1 private; paid for orgs)",
            ]}
            designs={["06 Featured", "07 Operator console"]}
            eta="Q4 2026 — Q1 2027 · audit-dependent"
          />

          <Phase
            n="06"
            label="v1.1+ · ecosystem"
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

        {/* THE DELIBERATE ABSENCES ---------------------------------- */}
        <section style={{ padding: "0 6vw 64px", maxWidth: 1280, margin: "0 auto" }}>
          <div className="card" style={{ padding: "28px 30px 24px", background: "var(--paper-2)" }}>
            <div className="eyebrow" style={{ marginBottom: 10, color: "var(--rust)" }}>
              ↳ things we won&apos;t build · listed here so you don&apos;t wait for them
            </div>
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

        {/* HELP CARDS ---------------------------------------------- */}
        <section style={{ padding: "0 6vw 80px", maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            <HelpCard
              label="USE IT"
              title="Try the scaffold."
              body="Sign up. Make a repo. Lose your passphrase on purpose and confirm we can't recover it. File issues."
              cta="siphr.vercel.app"
              href="/"
            />
            <HelpCard
              label="REVIEW IT"
              title="Audit the crypto."
              body="lib/crypto.ts is ~280 lines. Read it. Tell us what's wrong. The threat model wins from being wrong loudly and early."
              cta="lib/crypto.ts"
              href="https://github.com/VisualActions/Siphr/blob/main/lib/crypto.ts"
            />
            <HelpCard
              label="REPRODUCE IT"
              title="Build it yourself."
              body="When v0.8 ships, we'll publish a build hash. Until then: clone, build, diff. Any mismatch is interesting."
              cta="github.com/VisualActions/Siphr"
              href="https://github.com/VisualActions/Siphr"
            />
          </div>

          <div style={{
            marginTop: 32, paddingTop: 18, borderTop: "1px solid var(--line)",
            display: "flex", justifyContent: "space-between",
            fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)",
            flexWrap: "wrap", gap: 16,
          }}>
            <span>↳ last updated · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            <span>↳ this page is in the repo · edit it via pull request</span>
          </div>
        </section>
      </main>
    </>
  );
}

// ============================================================

type Status = "shipped" | "in-progress" | "planned" | "later";

function RoadHeadStat({
  label, value, sub, tone,
}: { label: string; value: string; sub: string; tone?: "copper" | "moss" }) {
  const color = tone === "copper" ? "var(--copper)" : tone === "moss" ? "var(--moss)" : "var(--ink)";
  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div className="serif" style={{ fontSize: 32, lineHeight: 1, color }}>{value}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function Phase({
  n, label, status, headline, blurb, shipped, planned, notExplored, designs, notes, eta,
}: {
  n: string; label: string; status: Status;
  headline: string; blurb: string;
  shipped?: string[]; planned?: string[]; notExplored?: string[];
  designs?: string[]; notes?: React.ReactNode; eta?: string;
}) {
  const meta: Record<Status, { color: string; bg: string; text: string }> = {
    shipped:       { color: "var(--moss)",   bg: "var(--moss-bg)",   text: "✓ shipped" },
    "in-progress": { color: "var(--copper)", bg: "var(--copper-bg)", text: "● in progress" },
    planned:       { color: "#9a6700",       bg: "var(--amber-bg)",  text: "○ planned" },
    later:         { color: "var(--muted)",  bg: "var(--paper-2)",   text: "·· later" },
  };
  const m = meta[status];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 24, marginBottom: 36 }}>
      <div>
        <div className="serif" style={{ fontSize: 52, color: "var(--muted-2)", letterSpacing: "-0.03em", lineHeight: 1 }}>{n}</div>
        <div style={{
          marginTop: 12, fontFamily: "var(--mono)", fontSize: 10,
          color: m.color, letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "3px 8px", background: m.bg, borderRadius: 3,
          display: "inline-block",
        }}>{m.text}</div>
      </div>

      <div className="card" style={{ padding: "26px 28px 24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
          <div className="eyebrow">{label}</div>
          {eta && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>↳ target · {eta}</span>}
        </div>
        <h3 className="serif" style={{ fontSize: 26, letterSpacing: "-0.015em", marginBottom: 10, lineHeight: 1.15 }}>{headline}</h3>
        <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 18, maxWidth: 800 }}>{blurb}</p>

        {shipped && <List items={shipped} prefix="✓" color="var(--moss)" />}
        {planned && <List items={planned} prefix="○" color={status === "in-progress" ? "var(--copper)" : "#9a6700"} />}
        {notExplored && <div style={{ marginTop: 12 }}><List items={notExplored} prefix="✗" color="var(--rust)" /></div>}

        {notes && (
          <div style={{
            marginTop: 14, padding: "10px 12px",
            background: "var(--paper-2)", borderRadius: 5,
            fontFamily: "var(--mono)", fontSize: 11.5,
            color: "var(--muted)", lineHeight: 1.55,
          }}>
            ↳ {notes}
          </div>
        )}

        {designs && (
          <div style={{
            marginTop: 16, paddingTop: 14,
            borderTop: "1px dashed var(--line)",
          }}>
            <span style={{
              fontFamily: "var(--mono)", fontSize: 10,
              color: "var(--muted)", letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>design coverage · </span>
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

function List({
  items, prefix, color,
}: { items: string[]; prefix: string; color: string }) {
  return (
    <ul style={{
      listStyle: "none", padding: 0, margin: 0,
      display: "grid", gridTemplateColumns: "1fr 1fr",
      gap: "6px 24px",
    }}>
      {items.map((it, i) => (
        <li key={i} style={{
          display: "grid", gridTemplateColumns: "16px 1fr",
          gap: 8, alignItems: "start", padding: "3px 0",
          fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5,
        }}>
          <span style={{ color, fontFamily: "var(--mono)", fontSize: 12 }}>{prefix}</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function NotPlanned({ title, why }: { title: string; why: string }) {
  return (
    <div>
      <div style={{
        fontSize: 14, fontWeight: 500,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ color: "var(--rust)", fontFamily: "var(--mono)" }}>✗</span>
        {title}
      </div>
      <p style={{
        marginTop: 4, fontSize: 13, color: "var(--ink-2)",
        lineHeight: 1.55, paddingLeft: 22,
      }}>{why}</p>
    </div>
  );
}

function HelpCard({
  label, title, body, cta, href,
}: {
  label: string; title: string; body: string; cta: string; href: string;
}) {
  const isExternal = href.startsWith("http");
  const content = (
    <div className="card" style={{
      padding: "22px 22px 18px", display: "flex", flexDirection: "column",
      gap: 10, height: "100%",
    }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--copper)", letterSpacing: "0.12em" }}>{label}</div>
      <h3 className="serif" style={{ fontSize: 24, letterSpacing: "-0.015em" }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, flex: 1 }}>{body}</p>
      <div style={{
        marginTop: 4, paddingTop: 12, borderTop: "1px dashed var(--line)",
        fontFamily: "var(--mono)", fontSize: 11, color: "var(--copper)",
      }}>↳ {cta}</div>
    </div>
  );
  return isExternal ? (
    <a href={href} target="_blank" rel="noreferrer">{content}</a>
  ) : (
    <Link href={href}>{content}</Link>
  );
}
