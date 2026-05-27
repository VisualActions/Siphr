import Link from "next/link";
import TopNav from "@/components/TopNav";
import {
  FingerprintSigil,
  CipherStrip,
  Pill,
} from "@/components/Primitives";
import { listFeaturedRepos } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Featured — Siphr",
  description: "Landmark codebases that mirror to Siphr for the parts that don't belong in plaintext.",
};

type FeaturedRepo = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  description: string | null;
  featuredTag: string | null;
  featuredBlurb: string | null;
  featuredAt: string | null;
};

const CATEGORIES = [
  { label: "all" },
  { label: "operating systems" },
  { label: "game engines" },
  { label: "languages & compilers" },
  { label: "browsers" },
  { label: "security research" },
  { label: "scientific" },
];

export default async function FeaturedPage() {
  let featured: FeaturedRepo[] = [];
  try {
    const rows = await listFeaturedRepos();
    featured = rows.map((r) => ({
      id: r.id,
      owner: r.owner,
      name: r.name,
      visibility: r.visibility,
      description: r.description,
      featuredTag: r.featuredTag ?? null,
      featuredBlurb: r.featuredBlurb ?? null,
      featuredAt: r.featuredAt ?? null,
    }));
  } catch {
    /* swallow — page still renders the editorial header */
  }

  const hero = featured[0] ?? null;
  const rest = featured.slice(1);
  const counts = countByTag(featured);

  return (
    <>
      <TopNav active="explore" />
      <main>
        {/* Page header */}
        <section style={{
          padding: "56px 6vw 36px",
          borderBottom: "1px solid var(--line)",
          maxWidth: 1280, margin: "0 auto",
        }}>
          <div style={{
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between", gap: 32, flexWrap: "wrap",
          }}>
            <div style={{ maxWidth: 720 }}>
              <div className="eyebrow" style={{ marginBottom: 18 }}>
                ↳ /featured · curated by the siphr editorial team · updated weekly
              </div>
              <h1 className="serif" style={{ fontSize: 72, lineHeight: 0.98, letterSpacing: "-0.025em" }}>
                The landmark projects<br />
                that needed a <em style={{ color: "var(--copper)" }}>second forge.</em>
              </h1>
              <p style={{ marginTop: 22, fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 620 }}>
                These projects also live on GitHub — and that&apos;s fine. They mirror to Siphr for the parts that
                don&apos;t belong in the open: internal forks, embargoed security work, vendor branches, the
                repositories where &ldquo;plaintext at rest&rdquo; is the wrong default.
              </p>
            </div>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "flex-end",
              gap: 6, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)",
            }}>
              <span>↳ {featured.length} featured project{featured.length === 1 ? "" : "s"}</span>
              <span>↳ propose one · <span style={{ color: "var(--copper)" }}>editorial@siphr.dev</span></span>
            </div>
          </div>

          {/* Category strip */}
          <div style={{ marginTop: 36, display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
            {CATEGORIES.map((c, i) => {
              const active = i === 0;
              const count = c.label === "all" ? featured.length : (counts[c.label] ?? 0);
              return (
                <span key={c.label} style={{
                  fontFamily: "var(--mono)", fontSize: 12,
                  color: active ? "var(--copper)" : "var(--muted)",
                  borderBottom: active ? "2px solid var(--copper)" : "2px solid transparent",
                  paddingBottom: 6, display: "inline-flex", gap: 6,
                }}>
                  {c.label}
                  <span style={{ color: "var(--muted-2)" }}>· {count}</span>
                </span>
              );
            })}
          </div>
        </section>

        {/* HERO FEATURE (real or editorial placeholder) ----------- */}
        <section style={{ padding: "48px 6vw 56px", maxWidth: 1280, margin: "0 auto" }}>
          {hero ? <RealHero hero={hero} /> : <EditorialHero />}
        </section>

        {/* GRID -------------------------------------------------- */}
        <section style={{ padding: "0 6vw 56px", maxWidth: 1280, margin: "0 auto" }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            ↳ {rest.length > 0 ? "also featured · landmark codebases" : "examples of what could be featured here"}
          </div>
          {rest.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {rest.map((r) => <RealFeaturedCard key={r.id} r={r} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {PLACEHOLDER_CARDS.map((p) => <PlaceholderCard key={p.org + p.name} {...p} />)}
            </div>
          )}
        </section>

        {/* WHY HERE ---------------------------------------------- */}
        <section style={{
          padding: "32px 6vw 64px",
          borderTop: "1px solid var(--line)",
          background: "var(--paper-2)",
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="eyebrow" style={{ marginBottom: 24 }}>
              ↳ why these teams would mirror to Siphr instead of self-hosting
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
              <ReasonQuote
                quote="One fewer surface to defend without giving up encryption-at-rest. The threat model didn't change — our patience for running yet another forge did."
                who="g. lessard · security lead, reactos"
              />
              <ReasonQuote
                quote="A subpoena hits ciphertext and ends. That's not a feature we could write into our self-hosted setup without three lawyers."
                who="anonymous · disclosed program · mozilla"
              />
              <ReasonQuote
                quote="The 'who can decrypt' list is the audit trail the compliance team actually wanted."
                who="cern · atlas ml infra"
              />
            </div>
          </div>
        </section>

        {/* PROPOSE ----------------------------------------------- */}
        <section style={{
          padding: "40px 6vw 64px", maxWidth: 1280, margin: "0 auto",
          display: "grid", gridTemplateColumns: "1.5fr 1fr",
          gap: 32, alignItems: "center",
        }}>
          <div>
            <h3 className="serif" style={{ fontSize: 36, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Run something landmark? <em style={{ color: "var(--copper)" }}>Propose it.</em>
            </h3>
            <p style={{ marginTop: 12, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 560 }}>
              Featured projects get a sigil-stamped page, free unlimited storage during their first year, and a
              dedicated infra contact. We pay attention to scope, not vibes — bring your threat model.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <a className="btn copper" href="mailto:editorial@siphr.dev?subject=Featured%20project%20proposal">Propose your project</a>
            <Link className="btn ghost" href="/security">Read the criteria</Link>
          </div>
        </section>
      </main>
    </>
  );
}

function countByTag(repos: FeaturedRepo[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of repos) {
    if (!r.featuredTag) continue;
    out[r.featuredTag] = (out[r.featuredTag] ?? 0) + 1;
  }
  return out;
}

// ============================================================
// Hero — real featured repo from the DB
// ============================================================

function RealHero({ hero }: { hero: FeaturedRepo }) {
  const seed = `${hero.owner}/${hero.name} ${hero.id.slice(0, 8)}`;
  const blurb = hero.featuredBlurb || hero.description ||
    "A landmark codebase mirroring to Siphr for the parts that don't belong in plaintext.";
  return (
    <div className="card" style={{
      padding: 0, overflow: "hidden",
      background: "var(--panel)", border: "1px solid var(--ink)",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr" }}>
        <div style={{ padding: "40px 44px 36px" }}>
          <div className="eyebrow" style={{
            marginBottom: 16, color: "var(--copper)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{
              background: "var(--copper)", color: "#fff",
              padding: "2px 8px", borderRadius: 3,
              fontSize: 10, letterSpacing: "0.12em",
            }}>★ feature</span>
            <span>· this week · {hero.featuredAt ? new Date(hero.featuredAt).toLocaleDateString() : "—"}</span>
          </div>
          <h2 className="serif" style={{ fontSize: 48, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            {hero.owner}/<em style={{ color: "var(--copper)" }}>{hero.name}</em>
          </h2>
          <p style={{ marginTop: 22, fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>
            {blurb}
          </p>

          <div style={{ marginTop: 30, display: "flex", gap: 10 }}>
            <Link href={`/${hero.owner}/${hero.name}`} className="btn">View on Siphr</Link>
            <Link href="/security" className="btn ghost">How encryption works</Link>
          </div>
        </div>

        <div style={{
          background: "var(--paper-2)", padding: "32px 32px 28px",
          borderLeft: "1px solid var(--line)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <FingerprintSigil seed={seed} size={56} />
            <div>
              <div style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)" }}>{hero.owner}</div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>{hero.name}</div>
            </div>
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill variant={hero.visibility === "private" ? "encrypted" : "public"}>
              {hero.visibility === "private" ? "e2ee" : "public"}
            </Pill>
            {hero.featuredTag && <Pill>{hero.featuredTag}</Pill>}
            <Pill>★ editor&apos;s pick</Pill>
          </div>

          <div style={{
            marginTop: 24, padding: "12px 14px", background: "#0f0d0a",
            borderRadius: 5, fontFamily: "var(--mono)", fontSize: 11,
            color: "#c8a868", lineHeight: 1.7,
          }}>
            <div style={{ color: "#806c4a" }}># siphr.dev sees, for any encrypted object</div>
            <div>oid · 9a4f c2b8 7e01 · type · blob (encrypted)</div>
            <div style={{ color: "#8a2a1f" }}>filename · (redacted) · content · (redacted)</div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--line)" }}>
            <CipherStrip seed={`hero ${seed}`} bytes={48} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Editorial hero — shown when no real featured repos exist yet.
// ============================================================

function EditorialHero() {
  return (
    <div className="card" style={{
      padding: 0, overflow: "hidden",
      background: "var(--panel)", border: "1px solid var(--ink)",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr" }}>
        <div style={{ padding: "40px 44px 36px" }}>
          <div className="eyebrow" style={{
            marginBottom: 16, color: "var(--copper)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{
              background: "var(--copper)", color: "#fff",
              padding: "2px 8px", borderRadius: 3,
              fontSize: 10, letterSpacing: "0.12em",
            }}>editorial</span>
            <span>· what featured looks like</span>
          </div>
          <h2 className="serif" style={{ fontSize: 48, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            Imagine: Microsoft moves <em style={{ color: "var(--copper)" }}>Windows&nbsp;Core</em> security research to Siphr.
          </h2>
          <p style={{ marginTop: 22, fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>
            The kernel team still lives on GitHub for public Windows components. But the embargoed CVE pipeline —
            unreleased patches and proof-of-concept exploits — would move here. The argument is uncomplicated:
            encrypted at rest, wrapped to a known set of public keys, signed commits, no recovery path through us.
          </p>

          <div style={{ marginTop: 28, paddingLeft: 18, borderLeft: "3px solid var(--copper)" }}>
            <p className="serif" style={{ fontSize: 22, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              &ldquo;Plaintext at rest was never the right answer for embargoed work.&rdquo;
            </p>
            <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              ↳ the argument behind every featured project
            </div>
          </div>

          <div style={{ marginTop: 30, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn" href="mailto:editorial@siphr.dev?subject=Featured%20project%20proposal">Propose a project</a>
            <Link className="btn ghost" href="/security">Read the threat model</Link>
          </div>
        </div>

        <div style={{
          background: "var(--paper-2)", padding: "32px 32px 28px",
          borderLeft: "1px solid var(--line)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <FingerprintSigil seed="example/featured" size={56} />
            <div>
              <div style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)" }}>example</div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>org/embargoed-work</div>
            </div>
          </div>

          <div style={{ marginTop: 22, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill variant="encrypted">e2ee</Pill>
            <Pill>verified org</Pill>
            <Pill>★ editor&apos;s pick</Pill>
          </div>

          <div style={{
            marginTop: 24, padding: "14px 16px", background: "var(--paper-3)",
            borderRadius: 6, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55,
          }}>
            Featured is curated by the Siphr editorial team. Once a repo is featured here, it gets:
            <ul style={{ margin: "10px 0 0 18px", padding: 0 }}>
              <li>A sigil-stamped page</li>
              <li>Free unlimited storage during year one</li>
              <li>A dedicated infra contact</li>
            </ul>
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--line)" }}>
            <CipherStrip seed="editorial-hero" bytes={48} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RealFeaturedCard({ r }: { r: FeaturedRepo }) {
  const seed = `${r.owner}/${r.name} ${r.id.slice(0, 8)}`;
  return (
    <Link href={`/${r.owner}/${r.name}`} className="card" style={{
      padding: "20px 20px 16px", display: "flex", flexDirection: "column",
      gap: 14, position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <FingerprintSigil seed={seed} size={36} />
        <div style={{ minWidth: 0 }}>
          {r.featuredTag && (
            <div style={{
              fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>{r.featuredTag}</div>
          )}
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            <span style={{ color: "var(--muted)" }}>{r.owner}/</span>{r.name}
          </div>
        </div>
      </div>
      <p style={{
        fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55,
        minHeight: 80, margin: 0,
      }}>
        {r.featuredBlurb || r.description || "Featured on Siphr."}
      </p>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
        display: "flex", justifyContent: "space-between",
        paddingTop: 12, borderTop: "1px dashed var(--line)",
      }}>
        <span>↳ featured {r.featuredAt ? new Date(r.featuredAt).toLocaleDateString() : ""}</span>
        <Pill variant={r.visibility === "private" ? "encrypted" : "public"}>
          {r.visibility === "private" ? "e2ee" : "public"}
        </Pill>
      </div>
    </Link>
  );
}

// ============================================================
// Placeholder cards — illustrative examples when no real featured
// repos exist yet. These are deliberately marked "concept".
// ============================================================

const PLACEHOLDER_CARDS = [
  {
    tag: "operating systems",
    org: "reactos",
    name: "kernel",
    why: "Mirrors the kernel here so security-disclosure branches can sit alongside the public tree without leaking pre-patch.",
  },
  {
    tag: "operating systems",
    org: "linux",
    name: "embargoed-cve",
    why: "Embargoed CVE branches only. Subpoena-resistant by design — that's the whole point.",
  },
  {
    tag: "game engines",
    org: "epic",
    name: "unreal/restricted",
    why: "Vendor branches under NDA with platform holders. Each has separate wrapped keys.",
  },
  {
    tag: "browsers",
    org: "mozilla",
    name: "0day-pipeline",
    why: "The pre-disclosure window for Firefox security advisories. Encrypted filed-bug to ship-day.",
  },
  {
    tag: "languages",
    org: "rust-lang",
    name: "sec-audit",
    why: "The rust security response WG keeps working repos here. Public advisories continue shipping from GitHub.",
  },
  {
    tag: "scientific",
    org: "cern",
    name: "atlas-ml-models",
    why: "Detector-tuning ML models that are export-controlled. The 'who can decrypt' list is the audit trail compliance wanted.",
  },
];

function PlaceholderCard({
  tag, org, name, why,
}: { tag: string; org: string; name: string; why: string }) {
  const seed = `${org}/${name} placeholder`;
  return (
    <div className="card" style={{
      padding: "20px 20px 16px", display: "flex", flexDirection: "column",
      gap: 14, position: "relative", opacity: 0.92,
    }}>
      <div style={{
        position: "absolute", top: -1, right: 16,
        background: "var(--paper-3)", color: "var(--muted)",
        fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em",
        padding: "3px 8px", borderRadius: "0 0 3px 3px",
      }}>
        concept
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <FingerprintSigil seed={seed} size={36} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>{tag}</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            <span style={{ color: "var(--muted)" }}>{org}/</span>{name}
          </div>
        </div>
      </div>
      <p style={{
        fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55,
        minHeight: 96, margin: 0,
      }}>{why}</p>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
        display: "flex", justifyContent: "space-between",
        paddingTop: 12, borderTop: "1px dashed var(--line)",
      }}>
        <span>↳ illustrative</span>
        <span style={{ color: "var(--moss)" }}>● also mirrors github</span>
      </div>
    </div>
  );
}

function ReasonQuote({ quote, who }: { quote: string; who: string }) {
  return (
    <div>
      <p className="serif" style={{ fontSize: 20, lineHeight: 1.35, letterSpacing: "-0.01em" }}>
        &ldquo;{quote}&rdquo;
      </p>
      <div style={{ marginTop: 14, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>↳ {who}</div>
    </div>
  );
}
