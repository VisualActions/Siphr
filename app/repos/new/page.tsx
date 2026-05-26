"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import {
  FingerprintSigil,
  ServerView,
} from "@/components/Primitives";

type Avail = "idle" | "checking" | "yes" | "no" | "invalid";

const NAME_SUGGESTIONS = [
  "ciphertext-kitchen",
  "wrapped-secrets",
  "ledger-of-things",
  "field-notes",
  "siphr-playground",
  "scratchpad",
];

export default function NewRepoPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [pubKey, setPubKey] = useState<JsonWebKey | null>(null);
  const [pubFp, setPubFp] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [keyMode, setKeyMode] = useState<"generate" | "paste">("generate");

  const [encCommits, setEncCommits] = useState(true);
  const [encBranches, setEncBranches] = useState(true);
  const [encIssues, setEncIssues] = useState(true);
  const [encFilenames, setEncFilenames] = useState(true);
  const [rotation, setRotation] = useState<"30d" | "90d" | "180d" | "never">("90d");

  const [addReadme, setAddReadme] = useState(true);
  const [gitignore, setGitignore] = useState("none");
  const [license, setLicense] = useState("none");
  const [securityMd, setSecurityMd] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avail, setAvail] = useState<Avail>("idle");
  const [suggestion] = useState(
    () => NAME_SUGGESTIONS[Math.floor(Math.random() * NAME_SUGGESTIONS.length)]
  );

  useEffect(() => {
    const u = localStorage.getItem("siphr:current_user");
    setUser(u);
    if (u) {
      fetch(`/api/users/${u}`)
        .then((r) => r.json())
        .then((j) => {
          setPubKey(j.publicKeyJwk ?? null);
          setPubFp(j.fingerprint ?? null);
        })
        .catch(() => {});
    }
  }, []);

  // Debounced availability check
  useEffect(() => {
    if (!user || !name) {
      setAvail("idle");
      return;
    }
    if (!/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(name) || /-$/.test(name)) {
      setAvail("invalid");
      return;
    }
    setAvail("checking");
    const t = setTimeout(() => {
      fetch(`/api/repos/check-name?owner=${encodeURIComponent(user)}&name=${encodeURIComponent(name)}`)
        .then((r) => r.json())
        .then((j) => setAvail(j.available ? "yes" : "no"))
        .catch(() => setAvail("idle"));
    }, 280);
    return () => clearTimeout(t);
  }, [user, name]);

  const fpFormatted = useMemo(
    () => (pubFp ? pubFp.replace(/(.{4})/g, "$1 ").trim() : "—"),
    [pubFp]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!user) throw new Error("Not signed in.");
      if (avail !== "yes") throw new Error("Pick an available repository name.");
      let wrappedKeys: Record<string, unknown> = {};
      let repoKey: Uint8Array | null = null;
      if (visibility === "private") {
        if (!pubKey) throw new Error("Could not load your public key.");
        const { generateRepoKey, wrapRepoKey } = await import("@/lib/crypto");
        repoKey = await generateRepoKey();
        const wrapped = await wrapRepoKey(repoKey, pubKey);
        wrappedKeys = { [user]: wrapped };
      }
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner: user,
          name,
          visibility,
          description: description || null,
          wrappedKeys,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Server error");
      if (repoKey) {
        // Stays in this tab only — wrapped copy lives on the server, plaintext does not.
        sessionStorage.setItem(
          `siphr:repokey:${j.id}`,
          btoa(String.fromCharCode(...repoKey))
        );
      }
      // Pass initial-init flags via sessionStorage; the empty-state page reads them.
      sessionStorage.setItem(
        `siphr:init:${j.id}`,
        JSON.stringify({
          addReadme,
          gitignore: gitignore === "none" ? null : gitignore,
          license: license === "none" ? null : license,
          securityMd,
        })
      );
      router.push(`/${user}/${name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setBusy(false);
    }
  }

  // Server-view preview lines update as toggles flip
  const previewLines = [
    { k: "owner", v: user ?? "—", type: "plain" as const },
    { k: "name", v: visibility === "public" || !encFilenames ? name || "—" : "(can be public, your call)", type: "plain" as const },
    { k: "visibility", v: visibility === "public" ? "public · plaintext" : "private · e2ee", type: "plain" as const },
    {
      k: "wrapped keys",
      v: visibility === "public" ? "n/a (plaintext)" : `1 (you${pubFp ? ` · ${pubFp.slice(0, 4)}…${pubFp.slice(-4)}` : ""})`,
      type: "plain" as const,
    },
    {
      k: "rotation",
      v:
        visibility === "public"
          ? "n/a"
          : rotation === "never"
          ? "manual only"
          : `${rotation} auto + on revocation`,
      type: "plain" as const,
    },
    visibility === "private"
      ? {
          k: "description",
          v:
            description
              ? "(redacted · encrypted to repo key)"
              : "(empty)",
          type: "none" as const,
        }
      : { k: "description", v: description || "(empty)", type: "plain" as const },
    visibility === "private"
      ? { k: "files", v: "(redacted · all blobs ciphertext)", type: "none" as const }
      : { k: "files", v: "plaintext blobs · public", type: "plain" as const },
    visibility === "private" && encCommits
      ? { k: "commits", v: "(redacted · messages encrypted)", type: "none" as const }
      : { k: "commits", v: "plaintext commit messages", type: "plain" as const },
    visibility === "private" && encBranches
      ? { k: "branches", v: "(redacted · branch names encrypted)", type: "none" as const }
      : { k: "branches", v: "plaintext branch names", type: "plain" as const },
  ];

  return (
    <>
      <TopNav />
      <main style={{ padding: "44px 6vw 80px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Head */}
        <div style={{ marginBottom: 36 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>↳ /new · create a new repo</div>
          <h1 className="serif" style={{ fontSize: 44, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            New repository.
          </h1>
          <p style={{ marginTop: 12, fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 720 }}>
            Source &amp; history for a project. <em>Private</em> repos are end-to-end encrypted by default — the
            options below decide which keys can decrypt, and how much metadata stays in the clear.&nbsp;
            <span style={{ color: "var(--copper)" }}>Required fields marked *</span>.
          </p>
        </div>

        <form onSubmit={onSubmit}>
          {/* SECTION 1 — General */}
          <SectionRail n="01" title="General" active>
            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 14 }}>
              <div>
                <FieldLabel>Owner *</FieldLabel>
                <div style={{
                  marginTop: 8, height: 38, display: "flex", alignItems: "center",
                  gap: 8, padding: "0 32px 0 10px", position: "relative",
                  border: "1px solid var(--line)", borderRadius: 5,
                  background: "#fffdf7", fontSize: 13,
                }}>
                  {user && <FingerprintSigil seed={`${user}@siphr ${pubFp ?? ""}`} size={20} />}
                  <span style={{ fontWeight: 500 }}>{user ?? "you"}</span>
                  <span style={{ position: "absolute", right: 10, color: "var(--muted)" }}>▾</span>
                </div>
                <FieldHint>your personal namespace</FieldHint>
              </div>
              <div>
                <FieldLabel>
                  Repository name *
                  <span style={{ marginLeft: "auto" }}>
                    <AvailBadge avail={avail} />
                  </span>
                </FieldLabel>
                <input
                  className="input mono"
                  style={{ marginTop: 8 }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-encrypted-thing"
                  autoComplete="off"
                  spellCheck={false}
                />
                <FieldHint>
                  great names are short &amp; memorable · suggestion ·{" "}
                  <button
                    type="button"
                    onClick={() => setName(suggestion)}
                    style={{
                      color: "var(--copper)", background: "transparent",
                      border: 0, padding: 0, fontFamily: "var(--mono)",
                      fontSize: 11, cursor: "pointer",
                    }}
                  >{suggestion}</button>
                </FieldHint>
              </div>
            </div>

            <div style={{ marginTop: 22 }}>
              <FieldLabel>Description</FieldLabel>
              <textarea
                rows={2}
                maxLength={350}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description"
                style={{
                  marginTop: 8, width: "100%",
                  border: "1px solid var(--line)", borderRadius: 5,
                  padding: "10px 14px", fontFamily: "var(--sans)", fontSize: 14,
                  background: "#fffdf7", resize: "vertical",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <FieldHint>
                  ↳ for private repos: encrypted with the repo key by default
                </FieldHint>
                <FieldHint>{description.length} / 350 characters</FieldHint>
              </div>
            </div>
          </SectionRail>

          {/* SECTION 2 — Encryption */}
          <SectionRail
            n="02"
            title="Encryption"
            subtitle="who can read this repo, and what siphr.dev gets to see"
          >
            <Block>
              <BlockRow
                title="Visibility *"
                hint="public is plaintext at rest (like normal git) · private is end-to-end encrypted"
                right={
                  <Segmented
                    options={[
                      { label: "Public · plaintext", value: "public" },
                      { label: "Private · e2ee", value: "private" },
                    ]}
                    value={visibility}
                    onChange={(v) => setVisibility(v as "private" | "public")}
                  />
                }
              />
              {visibility === "private" && (
                <>
                  <BlockRow
                    title="Repo encryption key"
                    hint="we generate a fresh AES-256 key in your browser · or paste one you already trust"
                    right={
                      <select
                        value={keyMode}
                        onChange={(e) => setKeyMode(e.target.value as "generate" | "paste")}
                        style={{
                          minWidth: 240, height: 32, padding: "0 30px 0 12px",
                          background: "#fffdf7", border: "1px solid var(--line)",
                          borderRadius: 5, fontFamily: "var(--mono)", fontSize: 12,
                        }}
                      >
                        <option value="generate">generate a new key · recommended</option>
                        <option value="paste" disabled>paste an existing key · v0.4</option>
                      </select>
                    }
                  />
                  <BlockRow
                    title="Wrap the repo key to"
                    hint="every fingerprint listed below will be able to decrypt · add more later from /keys"
                    right={
                      <button
                        type="button"
                        disabled
                        className="btn ghost sm"
                        title="Collaborator key-wrapping ships in v0.5"
                        style={{ opacity: 0.5, cursor: "not-allowed" }}
                      >
                        + add by public key
                      </button>
                    }
                  >
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                      {user && (
                        <WrappedKeyRow
                          seed={`${user}@siphr ${pubFp ?? ""}`}
                          name={user}
                          fp={fpFormatted}
                          tag="you · owner"
                        />
                      )}
                    </div>
                    <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)" }}>
                      ↳ collaborator key-wrapping ships in v0.5 · see <Link href="/roadmap" style={{ color: "var(--copper)" }}>/roadmap</Link>
                    </div>
                  </BlockRow>
                  <BlockRow
                    title="Also encrypt these fields"
                    hint="extra metadata that leaves siphr.dev in plaintext if you turn it off"
                  >
                    <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Toggle on={encCommits} setOn={setEncCommits} label="commit messages" hint="default · subpoena-resistant" />
                      <Toggle on={encBranches} setOn={setEncBranches} label="branch names" hint="default" />
                      <Toggle on={encIssues} setOn={setEncIssues} label="issue + pr bodies" hint="default · separate key per thread" />
                      <Toggle on={encFilenames} setOn={setEncFilenames} label="filenames in tree" hint="default · plaintext oids only" />
                    </div>
                  </BlockRow>
                  <BlockRow
                    title="Key rotation cadence"
                    hint="automatic rotation if a collaborator key is revoked · also rotates on this schedule"
                    right={
                      <select
                        value={rotation}
                        onChange={(e) => setRotation(e.target.value as "30d" | "90d" | "180d" | "never")}
                        style={{
                          minWidth: 200, height: 32, padding: "0 30px 0 12px",
                          background: "#fffdf7", border: "1px solid var(--line)",
                          borderRadius: 5, fontFamily: "var(--mono)", fontSize: 12,
                        }}
                      >
                        <option value="30d">every 30 days</option>
                        <option value="90d">every 90 days · recommended</option>
                        <option value="180d">every 180 days</option>
                        <option value="never">on revocation only</option>
                      </select>
                    }
                    last
                  />
                </>
              )}
              {visibility === "public" && (
                <BlockRow
                  title="Public storage"
                  hint="contents are stored plaintext, like any forge · Siphr still won't track viewers"
                  right={null}
                  last
                />
              )}
            </Block>

            <div style={{ marginTop: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                ↳ preview · what siphr.dev will see for this repo
              </div>
              <ServerView
                title={`POST /api/repos · ${user ?? "you"}/${name || "your-repo"}`}
                lines={previewLines}
              />
            </div>
          </SectionRail>

          {/* SECTION 3 — Initialize */}
          <SectionRail
            n="03"
            title="Initialize"
            subtitle="optional scaffolding · for private repos, all of this will be encrypted"
          >
            <Block>
              <SwitchRow
                title="Add a README"
                hint="a longer description for your project · same encryption as the rest"
                on={addReadme}
                setOn={setAddReadme}
              />
              <SwitchRow
                title="Add .gitignore"
                hint=".gitignore tells git what not to track"
                right={
                  <select
                    value={gitignore}
                    onChange={(e) => setGitignore(e.target.value)}
                    style={{
                      minWidth: 180, height: 32, padding: "0 30px 0 12px",
                      background: "#fffdf7", border: "1px solid var(--line)",
                      borderRadius: 5, fontFamily: "var(--mono)", fontSize: 12,
                    }}
                  >
                    <option value="none">none</option>
                    <option value="node">node · default</option>
                    <option value="python">python</option>
                    <option value="rust">rust</option>
                    <option value="go">go</option>
                  </select>
                }
              />
              <SwitchRow
                title="Add a license"
                hint="how others can use your code if you ever publish"
                right={
                  <select
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    style={{
                      minWidth: 180, height: 32, padding: "0 30px 0 12px",
                      background: "#fffdf7", border: "1px solid var(--line)",
                      borderRadius: 5, fontFamily: "var(--mono)", fontSize: 12,
                    }}
                  >
                    <option value="none">none</option>
                    <option value="mit">MIT</option>
                    <option value="apache-2.0">Apache 2.0</option>
                    <option value="agpl-3.0">AGPL 3.0</option>
                  </select>
                }
              />
              <SwitchRow
                title="Add an empty SECURITY.md"
                hint="encourages signed reports · references your fingerprint"
                on={securityMd}
                setOn={setSecurityMd}
                last
              />
            </Block>
          </SectionRail>

          {/* Action bar */}
          {error && (
            <div style={{
              marginTop: 14, padding: "10px 12px", borderRadius: 6,
              background: "rgba(138,42,31,0.08)", color: "var(--rust)",
              fontSize: 13, fontFamily: "var(--mono)",
            }}>{error}</div>
          )}

          <div style={{
            marginTop: 36, paddingTop: 24,
            display: "flex", justifyContent: "space-between",
            alignItems: "center", borderTop: "1px solid var(--line)",
            gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              {visibility === "private"
                ? "↳ pressing create will generate a fresh AES-256 repo key in this browser tab"
                : "↳ public repos are stored plaintext · no repo key generated"}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/dashboard" className="btn ghost">cancel</Link>
              <button
                type="submit"
                disabled={busy || avail !== "yes" || !user}
                className="btn copper"
                style={{ opacity: busy || avail !== "yes" || !user ? 0.55 : 1 }}
              >
                {busy
                  ? "creating repo…"
                  : visibility === "private"
                  ? "Create & generate keys"
                  : "Create repository"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}

// ============================================================
// helpers
// ============================================================

function SectionRail({
  n, title, subtitle, active, children,
}: {
  n: string; title: string; subtitle?: string;
  active?: boolean; children: React.ReactNode;
}) {
  return (
    <section style={{
      display: "grid", gridTemplateColumns: "44px 1fr",
      gap: 18, marginBottom: 32,
    }}>
      <div style={{ position: "relative" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 999,
          border: `1.5px solid ${active ? "var(--copper)" : "var(--line)"}`,
          background: active ? "var(--copper-bg)" : "transparent",
          color: active ? "var(--copper)" : "var(--muted)",
          fontFamily: "var(--mono)", fontWeight: 600, fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{n.replace(/^0/, "")}</div>
        <div style={{
          position: "absolute", top: 38, left: 16, bottom: -32,
          width: 1, background: "var(--line)",
        }} />
      </div>
      <div>
        <div style={{
          display: "flex", alignItems: "baseline", gap: 12,
          marginBottom: 12, flexWrap: "wrap",
        }}>
          <h2 className="serif" style={{ fontSize: 24, letterSpacing: "-0.015em" }}>{title}</h2>
          {subtitle && (
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              · {subtitle}
            </span>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return <div className="card" style={{ overflow: "hidden" }}>{children}</div>;
}

function BlockRow({
  title, hint, right, children, last,
}: {
  title: string; hint: string;
  right?: React.ReactNode; children?: React.ReactNode; last?: boolean;
}) {
  return (
    <div style={{
      padding: "16px 18px",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto",
        gap: 18, alignItems: "center",
      }}>
        <div>
          <FieldLabel>{title}</FieldLabel>
          <FieldHint style={{ marginTop: 2 }}>{hint}</FieldHint>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function SwitchRow({
  title, hint, on, setOn, right, last,
}: {
  title: string; hint: string;
  on?: boolean; setOn?: (v: boolean) => void;
  right?: React.ReactNode; last?: boolean;
}) {
  return (
    <div style={{
      padding: "14px 18px",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
      display: "grid", gridTemplateColumns: "1fr auto",
      gap: 18, alignItems: "center",
    }}>
      <div>
        <FieldLabel>{title}</FieldLabel>
        <FieldHint style={{ marginTop: 2 }}>{hint}</FieldHint>
      </div>
      {right ?? (
        <Switch on={!!on} onClick={() => setOn?.(!on)} />
      )}
    </div>
  );
}

function Switch({ on, onClick }: { on: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={{
        width: 38, height: 22, borderRadius: 999,
        background: on ? "var(--copper)" : "var(--line)",
        border: 0, position: "relative", cursor: "pointer",
        transition: "background 0.12s",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: on ? 18 : 2,
        width: 18, height: 18, borderRadius: 999, background: "#fffdf7",
        transition: "left 0.12s",
      }} />
    </button>
  );
}

function Toggle({
  on, setOn, label, hint,
}: {
  on: boolean; setOn: (v: boolean) => void;
  label: string; hint: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px", background: "var(--paper-2)",
      borderRadius: 5,
    }}>
      <Switch on={on} onClick={() => setOn(!on)} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13 }}>{label}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{hint}</div>
      </div>
    </div>
  );
}

function Segmented({
  options, value, onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{
      display: "inline-flex", border: "1px solid var(--line)",
      borderRadius: 5, overflow: "hidden",
      fontFamily: "var(--mono)", fontSize: 11,
    }}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          style={{
            padding: "8px 14px",
            background: value === o.value ? "var(--ink)" : "transparent",
            color: value === o.value ? "var(--paper)" : "var(--ink)",
            border: "none",
            borderLeft: i === 0 ? "none" : "1px solid var(--line)",
            cursor: "pointer",
          }}
        >{o.label}</button>
      ))}
    </div>
  );
}

function WrappedKeyRow({
  seed, name, fp, tag,
}: {
  seed: string; name: string; fp: string; tag: string;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap: 12, padding: "10px 12px", alignItems: "center",
      background: "var(--paper-2)", borderRadius: 5,
    }}>
      <FingerprintSigil seed={seed} size={28} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
          letterSpacing: "0.04em",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>fp {fp}</div>
      </div>
      <span style={{
        fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
        border: "1px solid var(--line)", padding: "2px 7px", borderRadius: 999,
      }}>{tag}</span>
    </div>
  );
}

function AvailBadge({ avail }: { avail: Avail }) {
  if (avail === "yes") return <Badge color="var(--moss)">✓ available</Badge>;
  if (avail === "no") return <Badge color="var(--rust)">✗ taken</Badge>;
  if (avail === "invalid") return <Badge color="#9a6700">! invalid</Badge>;
  if (avail === "checking") return <Badge color="var(--muted)">…</Badge>;
  return null;
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--mono)", fontSize: 11, color,
      letterSpacing: "0.02em",
    }}>{children}</span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 500, display: "flex",
      alignItems: "center", gap: 6,
    }}>{children}</div>
  );
}

function FieldHint({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontFamily: "var(--mono)", fontSize: 11,
      color: "var(--muted)", marginTop: 6,
      ...style,
    }}>{children}</div>
  );
}
