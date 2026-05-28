"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import VerifiedBadge from "@/components/VerifiedBadge";
import FileBrowser from "@/components/FileBrowser";
import QuickSetup from "@/components/QuickSetup";
import IssuesPanel from "@/components/IssuesPanel";
import PullsPanel from "@/components/PullsPanel";
import {
  FingerprintSigil,
  Pill,
  Dot,
  LockGlyph,
  ServerView,
} from "@/components/Primitives";

type RepoInfo = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  description: string | null;
  defaultBranch: string;
  createdAt: string;
  collaborators: string[];
  objectCount: number;
  cipherBytes: number;
  head: string | null;
};

export default function RepoPage({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}) {
  const { owner, name } = use(params);
  const [info, setInfo] = useState<RepoInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [readme, setReadme] = useState<string | null>(null);
  const [tab, setTab] = useState<"code" | "issues" | "pulls" | "keys" | "audit" | "settings">("code");
  const [watch, setWatch] = useState<{ watched: boolean; count: number }>({ watched: false, count: 0 });
  const [clonedCopied, setClonedCopied] = useState(false);
  const [counts, setCounts] = useState<{ openIssues: number; openPulls: number; releases: number }>({
    openIssues: 0, openPulls: 0, releases: 0,
  });

  useEffect(() => {
    setUser(localStorage.getItem("siphr:current_user"));
    fetch(`/api/repos/by-name/${owner}/${name}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((j) => j && setInfo(j));
  }, [owner, name]);

  // Watch state — session cookie identifies "you" server-side.
  useEffect(() => {
    if (!info) return;
    fetch(`/api/repos/${info.id}/watch`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setWatch(j))
      .catch(() => {});
  }, [info, user]);

  // Sidebar counts — issues, pulls, releases. Three parallel cheap GETs; all
  // ignored on failure so the page renders without them.
  useEffect(() => {
    if (!info) return;
    Promise.all([
      fetch(`/api/repos/${info.id}/issues?state=open`).then((r) => (r.ok ? r.json() : { issues: [] })),
      fetch(`/api/repos/${info.id}/pulls?state=open`).then((r) => (r.ok ? r.json() : { prs: [] })),
      fetch(`/api/repos/${info.id}/releases`).then((r) => (r.ok ? r.json() : { releases: [] })),
    ])
      .then(([is, ps, rs]) => {
        setCounts({
          openIssues: (is.issues ?? []).length,
          openPulls: (ps.prs ?? []).length,
          releases: (rs.releases ?? []).length,
        });
      })
      .catch(() => {});
  }, [info]);

  async function toggleWatch() {
    if (!info || !user) return;
    const method = watch.watched ? "DELETE" : "POST";
    const r = await fetch(`/api/repos/${info.id}/watch`, { method });
    if (r.ok) {
      setWatch((w) => ({
        watched: !w.watched,
        count: w.count + (w.watched ? -1 : 1),
      }));
    }
  }

  function copyClone() {
    if (!info) return;
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/${info.owner}/${info.name}.git`
      : `https://siphr.dev/${info.owner}/${info.name}.git`;
    navigator.clipboard.writeText(url).then(() => {
      setClonedCopied(true);
      setTimeout(() => setClonedCopied(false), 1500);
    }).catch(() => {});
  }

  useEffect(() => {
    if (!info) return;
    setHasKey(!!sessionStorage.getItem(`siphr:repokey:${info.id}`));
    if (info.visibility !== "public" || info.objectCount === 0) return;
    fetch(`/api/repos/by-name/${owner}/${name}/blob?ref=${info.defaultBranch}&path=README.md`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && !j.binary && setReadme(j.content ?? null))
      .catch(() => {});
  }, [info, owner, name]);

  if (notFound) {
    return (
      <>
        <TopNav />
        <main style={{ maxWidth: 1012, margin: "0 auto", padding: "64px 6vw", textAlign: "center" }}>
          <h1 className="serif" style={{ fontSize: 80, color: "var(--copper)" }}>404</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>
            that repository doesn&apos;t exist, or you don&apos;t have access.
          </p>
        </main>
      </>
    );
  }

  if (!info) {
    return (
      <>
        <TopNav />
        <main style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 6vw", fontFamily: "var(--mono)", color: "var(--muted)" }}>
          loading…
        </main>
      </>
    );
  }

  const isOwner = user === info.owner;
  const isPublic = info.visibility === "public";
  const repoSeed = `${info.owner}/${info.name} ${info.id.slice(0, 8)}`;
  const headShort = info.head ? info.head.slice(0, 8) : null;

  return (
    <>
      <TopNav />
      <main>
        {/* HEADER STRIP --------------------------------------------- */}
        <section style={{
          background: "var(--paper-2)",
          borderBottom: "1px solid var(--line)",
          padding: "20px 6vw 0",
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <FingerprintSigil seed={repoSeed} size={28} />
              <Link href={`/${info.owner}`} style={{ fontSize: 18 }}>{info.owner}</Link>
              <VerifiedBadge username={info.owner} size={16} />
              <span style={{ color: "var(--muted-2)", fontSize: 18 }}>/</span>
              <span style={{ fontSize: 18, fontWeight: 600 }}>{info.name}</span>
              <Pill variant={isPublic ? "public" : "encrypted"}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <LockGlyph /> {isPublic ? "public" : "private · e2ee"}
                </span>
              </Pill>
              {hasKey && (
                <Pill>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Dot color="var(--moss)" /> decrypted in this session
                  </span>
                </Pill>
              )}
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={toggleWatch}
                  disabled={!user}
                  title={user ? "" : "sign in to watch"}
                  className="btn ghost sm"
                  style={{
                    color: watch.watched ? "var(--phosphor)" : undefined,
                    borderColor: watch.watched ? "var(--phosphor)" : undefined,
                  }}
                >
                  {watch.watched ? "★" : "☆"} {watch.watched ? "Watching" : "Watch"} · {watch.count}
                </button>
                <button
                  type="button"
                  onClick={copyClone}
                  className="btn sm"
                >
                  {clonedCopied ? "✓ copied" : "⌃ Clone URL"}
                </button>
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <RepoTabStrip
                active={tab}
                onChange={setTab}
                isOwner={isOwner}
                isPrivate={!isPublic}
                collabCount={info.collaborators.length}
                openIssues={counts.openIssues}
                openPulls={counts.openPulls}
              />
            </div>
          </div>
        </section>

        <div style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "24px 6vw 80px",
          display: "grid", gridTemplateColumns: "1fr 320px", gap: 32,
        }}>
          {/* MAIN COLUMN ----------------------------------------- */}
          <section>
            {tab !== "code" && (
              <TabPanel
                tab={tab}
                info={info}
                isOwner={isOwner}
                isPublic={isPublic}
                currentUser={user}
              />
            )}
            {tab === "code" && (
              <>
            {/* branch row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <button className="btn ghost sm" style={{ fontFamily: "var(--mono)" }}>
                ↳ {info.defaultBranch}
              </button>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
                1 branch · {headShort ? `head ${headShort}` : "no commits yet"}
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {info.objectCount > 0 && (
                  <Link
                    href={`/${info.owner}/${info.name}/tree/${info.defaultBranch}`}
                    className="btn ghost sm"
                  >
                    Go to file
                  </Link>
                )}
              </div>
            </div>

            {/* private without key warning */}
            {!isPublic && !hasKey && info.objectCount > 0 && (
              <div style={{
                padding: 16, marginBottom: 16,
                background: "var(--amber-bg)",
                border: "1px solid rgba(184,138,36,0.35)",
                borderRadius: 6,
                display: "flex", gap: 12,
              }}>
                <div style={{ color: "#7a5a16", marginTop: 2 }}><LockGlyph size={14} /></div>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Repo contents are encrypted in this browser
                  </div>
                  <p style={{ color: "#5c4612" }}>
                    {isOwner
                      ? "Decryption hasn't happened on this session yet."
                      : "You're not a collaborator. The owner needs to wrap the repo key to your public key."}
                  </p>
                </div>
              </div>
            )}

            {/* file tree / quick-setup empty state */}
            {info.objectCount === 0 ? (
              <QuickSetup
                repo={{
                  id: info.id,
                  owner: info.owner,
                  name: info.name,
                  visibility: info.visibility,
                  defaultBranch: info.defaultBranch,
                }}
                authorName={user ?? info.owner}
                onCommitted={() => {
                  // Re-fetch to flip out of empty state.
                  fetch(`/api/repos/by-name/${owner}/${name}`)
                    .then((r) => (r.ok ? r.json() : null))
                    .then((j) => j && setInfo(j))
                    .catch(() => {});
                }}
              />
            ) : (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {isPublic ? (
                  <FileBrowser
                    owner={info.owner}
                    name={info.name}
                    branch={info.defaultBranch}
                    path=""
                  />
                ) : (
                  <div style={{ padding: "26px 22px", fontSize: 13, fontFamily: "var(--mono)", color: "var(--muted)" }}>
                    🔒 Encrypted file tree — decryptable client-side with a wrapped repo key.
                  </div>
                )}
              </div>
            )}

            {/* "what the server sees" reveal — private only */}
            {!isPublic && info.objectCount > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span>↳ what siphr.dev stores for this repo</span>
                  <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                  <span style={{ color: "var(--muted-2)" }}>endpoint surface · verifiable</span>
                </div>
                <ServerView
                  title={`GET /api/repos/${info.id.slice(0, 8)}/objects/{oid}`}
                  lines={[
                    { k: "type",        v: "blob (encrypted)",                       type: "plain" },
                    { k: "size",        v: `${info.cipherBytes.toLocaleString()} bytes ciphertext`, type: "plain" },
                    { k: "nonce",       v: "(unique per object · stored alongside)", type: "hex" },
                    { k: "wrapped_to",  v: `${info.collaborators.length} collaborator key(s)`,      type: "plain" },
                    { k: "filename",    v: "(redacted — encrypted into the object)", type: "none" },
                    { k: "content",     v: "(redacted — server cannot decrypt)",     type: "none" },
                  ]}
                />
              </div>
            )}

            {readme && (
              <div className="card" style={{ marginTop: 24, padding: 0, overflow: "hidden" }}>
                <div style={{
                  padding: "12px 18px", borderBottom: "1px solid var(--line)",
                  background: "var(--paper-2)",
                  display: "flex", justifyContent: "space-between", fontSize: 13,
                }}>
                  <span style={{ fontWeight: 600 }}>README.md</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--moss)" }}>
                    ↳ decrypted client-side
                  </span>
                </div>
                <div style={{ padding: "22px 24px" }}>
                  <Markdown text={readme} />
                </div>
              </div>
            )}
              </>
            )}
          </section>

          {/* RIGHT RAIL ----------------------------------------- */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>about</div>
              <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
                {info.description
                  ? info.description
                  : isPublic
                  ? "Public repository. Stored as plaintext, like any forge. Anyone can read it; Siphr still won't track viewers."
                  : "Private repository. Only collaborators with a wrapped repo key can decrypt the contents."}
              </p>
              <div style={{ marginTop: 14, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", lineHeight: 1.85 }}>
                <div>↳ {isPublic ? "plaintext storage" : "aes-256-gcm"}</div>
                <div>↳ {info.collaborators.length} {info.collaborators.length === 1 ? "key" : "keys"} can decrypt</div>
                <div>↳ created {new Date(info.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div>
              <div className="eyebrow" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                <span>↳ keys that can decrypt</span>
                {isOwner && (
                  <a style={{ color: "var(--copper)", fontFamily: "var(--mono)", fontSize: 10 }}>manage →</a>
                )}
              </div>
              <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
                {info.collaborators.length === 0 ? (
                  <div style={{ padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
                    {isPublic ? "public · no key needed" : "no collaborators wrapped"}
                  </div>
                ) : (
                  info.collaborators.map((c, i) => (
                    <Collab
                      key={c}
                      name={c}
                      seed={`collab ${c}`}
                      role={c === info.owner ? "owner" : "collaborator"}
                      last={i === info.collaborators.length - 1}
                    />
                  ))
                )}
              </div>
              {isOwner && !isPublic && (
                <button
                  className="btn ghost sm"
                  style={{ marginTop: 10, width: "100%", justifyContent: "center" }}
                >
                  + invite by public key
                </button>
              )}
            </div>

            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>↳ shortcuts</div>
              <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
                <Link
                  href={`/${info.owner}/${info.name}/releases`}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px",
                    color: "var(--ink)", textDecoration: "none",
                    fontFamily: "var(--mono)", fontSize: 12,
                  }}
                >
                  <span>releases</span>
                  <span style={{ color: "var(--muted)" }}>
                    {counts.releases} →
                  </span>
                </Link>
              </div>
            </div>

            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>↳ what the server holds</div>
              <div className="card flat" style={{ padding: "12px 14px" }}>
                <KV k="objects" v={info.objectCount.toString()} />
                <KV
                  k={isPublic ? "plaintext" : "ciphertext"}
                  v={`${(info.cipherBytes / 1024).toFixed(1)} KB`}
                />
                <KV k="wrapped keys" v={String(info.collaborators.length)} />
                <KV
                  k="server can read"
                  v={isPublic ? "all (public)" : "0 bytes"}
                  tone={isPublic ? undefined : "rust"}
                  last
                />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function Collab({
  name, seed, role, last,
}: { name: string; seed: string; role: string; last?: boolean }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto 1fr",
      gap: 12, padding: "12px 14px",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
      alignItems: "center",
    }}>
      <FingerprintSigil seed={seed} size={32} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link href={`/${name}`} style={{ fontSize: 13, fontWeight: 500 }}>{name}</Link>
          <VerifiedBadge username={name} size={12} />
          <span style={{
            fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
            padding: "1px 6px", border: "1px solid var(--line)", borderRadius: 999,
          }}>{role}</span>
        </div>
      </div>
    </div>
  );
}

function KV({ k, v, tone, last }: { k: string; v: string; tone?: "rust"; last?: boolean }) {
  const color = tone === "rust" ? "var(--rust)" : "var(--ink)";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 0",
      borderBottom: last ? "none" : "1px dashed var(--line)",
      fontSize: 12,
    }}>
      <span style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>{k}</span>
      <span style={{ fontFamily: "var(--mono)", color }}>{v}</span>
    </div>
  );
}

function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.split("\n");
  let inCode = false;
  let codeBuf: string[] = [];
  let paraBuf: string[] = [];
  let i = 0;

  const flushPara = () => {
    if (!paraBuf.length) return;
    blocks.push(
      <p key={`p-${i}`} style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", marginBottom: 12 }}>
        {renderInline(paraBuf.join(" "))}
      </p>
    );
    paraBuf = [];
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith("```")) {
      flushPara();
      if (inCode) {
        blocks.push(
          <pre
            key={`c-${i}`}
            style={{
              fontFamily: "var(--mono)", fontSize: 12,
              padding: 14, borderRadius: 6, marginBottom: 14,
              background: "#0f0d0a", color: "#e8d9b8",
              overflow: "auto",
            }}
          >
            {codeBuf.join("\n")}
          </pre>
        );
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
    } else if (inCode) {
      codeBuf.push(line);
    } else if (/^#{1,6}\s/.test(line)) {
      flushPara();
      const level = line.match(/^#+/)![0].length;
      const text = line.replace(/^#+\s*/, "");
      const fontSize = level === 1 ? 32 : level === 2 ? 24 : level === 3 ? 18 : 16;
      blocks.push(
        <h3
          key={`h-${i}`}
          className="serif"
          style={{ fontSize, marginTop: 18, marginBottom: 8, letterSpacing: "-0.015em" }}
        >
          {text}
        </h3>
      );
    } else if (line.trim() === "") {
      flushPara();
    } else if (/^[-*]\s/.test(line)) {
      flushPara();
      blocks.push(
        <li key={`li-${i}`} style={{ fontSize: 14, marginLeft: 22, listStyle: "disc", marginBottom: 4 }}>
          {renderInline(line.replace(/^[-*]\s+/, ""))}
        </li>
      );
    } else {
      paraBuf.push(line);
    }
    i++;
  }
  flushPara();
  return <>{blocks}</>;
}

function renderInline(s: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let rest = s;
  let key = 0;
  while (rest.length) {
    const codeM = rest.match(/`([^`]+)`/);
    const linkM = rest.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const boldM = rest.match(/\*\*([^*]+)\*\*/);
    const candidates = [codeM, linkM, boldM].filter(Boolean) as RegExpMatchArray[];
    if (!candidates.length) {
      parts.push(rest);
      break;
    }
    const earliest = candidates.reduce((a, b) => (a.index! < b.index! ? a : b));
    if (earliest.index! > 0) parts.push(rest.slice(0, earliest.index!));
    if (earliest === codeM) {
      parts.push(
        <code
          key={key++}
          style={{
            fontFamily: "var(--mono)", fontSize: 12,
            padding: "1px 5px", borderRadius: 3,
            background: "var(--paper-2)",
          }}
        >{earliest[1]}</code>
      );
    } else if (earliest === linkM) {
      parts.push(
        <a key={key++} href={earliest[2]} target="_blank" rel="noreferrer" style={{ color: "var(--copper)" }}>
          {earliest[1]}
        </a>
      );
    } else if (earliest === boldM) {
      parts.push(<strong key={key++}>{earliest[1]}</strong>);
    }
    rest = rest.slice(earliest.index! + earliest[0].length);
  }
  return parts;
}

// ============================================================
// Tab strip + panels
// ============================================================

type TabKey = "code" | "issues" | "pulls" | "keys" | "audit" | "settings";

function RepoTabStrip({
  active, onChange, isOwner, isPrivate, collabCount,
  openIssues, openPulls,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  isOwner: boolean;
  isPrivate: boolean;
  collabCount: number;
  openIssues: number;
  openPulls: number;
}) {
  const items: { key: TabKey; label: string; count?: number; dot?: boolean }[] = [
    { key: "code", label: "code" },
    { key: "issues", label: "issues", count: openIssues },
    { key: "pulls", label: "pull requests", count: openPulls },
    { key: "keys", label: "keys", count: collabCount, dot: isPrivate },
    { key: "audit", label: "audit" },
    ...(isOwner ? [{ key: "settings" as TabKey, label: "settings" }] : []),
  ];
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <button
            type="button"
            key={it.key}
            onClick={() => onChange(it.key)}
            style={{
              padding: "10px 16px",
              fontFamily: "var(--mono)", fontSize: 11.5,
              letterSpacing: "0.06em", textTransform: "uppercase",
              color: isActive ? "var(--ink)" : "var(--muted)",
              borderBottom: isActive ? "2px solid var(--phosphor)" : "2px solid transparent",
              marginBottom: -1,
              background: "transparent", border: 0,
              borderRadius: 0, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}
          >
            <span>{it.label}</span>
            {it.count !== undefined && (
              <span style={{
                background: isActive ? "var(--phosphor-bg)" : "var(--panel-2)",
                color: isActive ? "var(--phosphor)" : "var(--muted)",
                padding: "1px 7px", borderRadius: 2, fontSize: 10,
                fontFamily: "var(--mono)",
              }}>{it.count}</span>
            )}
            {it.dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--phosphor)" }} />}
          </button>
        );
      })}
    </div>
  );
}

function TabPanel({
  tab, info, isOwner, isPublic, currentUser,
}: {
  tab: Exclude<TabKey, "code">;
  info: RepoInfo;
  isOwner: boolean;
  isPublic: boolean;
  currentUser: string | null;
}) {
  if (tab === "issues") {
    return (
      <IssuesPanel
        repoId={info.id}
        owner={info.owner}
        name={info.name}
        currentUser={currentUser}
      />
    );
  }
  if (tab === "pulls") {
    return (
      <PullsPanel
        repoId={info.id}
        owner={info.owner}
        name={info.name}
      />
    );
  }
  if (tab === "keys") {
    return <KeysPanel info={info} isOwner={isOwner} isPublic={isPublic} />;
  }
  if (tab === "audit") {
    return <AuditPanel info={info} />;
  }
  if (tab === "settings") {
    return <RepoSettingsPanel info={info} isOwner={isOwner} />;
  }
  return null;
}

function EmptyPanel({
  title, body, eta,
}: { title: string; body: string; eta?: string }) {
  return (
    <div className="card" style={{ padding: "36px 28px", textAlign: "center" }}>
      <h2 className="display" style={{ fontSize: 28 }}>{title}</h2>
      <p style={{ marginTop: 10, fontSize: 14, color: "var(--ink-2)", maxWidth: 560, margin: "10px auto 0", lineHeight: 1.6 }}>
        {body}
      </p>
      {eta && (
        <div style={{ marginTop: 16 }}>
          <span className="pill" style={{ color: "var(--amber)", borderColor: "rgba(240,192,96,0.35)", background: "var(--amber-bg)" }}>
            planned · {eta}
          </span>
        </div>
      )}
      <Link href="/roadmap" className="btn ghost sm" style={{ marginTop: 22, display: "inline-flex" }}>
        view roadmap →
      </Link>
    </div>
  );
}

function KeysPanel({
  info, isOwner, isPublic,
}: { info: RepoInfo; isOwner: boolean; isPublic: boolean }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="eyebrow">↳ keys that can decrypt</div>
        {isOwner && !isPublic && (
          <button type="button" className="btn ghost xs" disabled title="invite-by-fingerprint ships in v0.5">
            + invite
          </button>
        )}
      </div>
      {info.collaborators.length === 0 ? (
        <div style={{ padding: "20px 18px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
          {isPublic ? "public · no key needed" : "no collaborators wrapped"}
        </div>
      ) : (
        info.collaborators.map((c, i) => (
          <Collab
            key={c}
            name={c}
            seed={`collab ${c}`}
            role={c === info.owner ? "owner" : "collaborator"}
            last={i === info.collaborators.length - 1}
          />
        ))
      )}
      <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line-2)", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
        ↳ collaborator key wrapping ships in v0.5 — see <Link href="/roadmap" style={{ color: "var(--phosphor)" }}>/roadmap</Link>
      </div>
    </div>
  );
}

function AuditPanel({ info }: { info: RepoInfo }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-2)" }}>
        <div className="eyebrow">↳ ref-update history · what siphr.dev observed</div>
      </div>
      <div style={{ padding: "14px 18px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.85 }}>
        <div>↳ repo created · {new Date(info.createdAt).toLocaleString()}</div>
        {info.head && <div>↳ HEAD → {info.head.slice(0, 12)}…</div>}
        <div>↳ objects on server · {info.objectCount.toLocaleString()}</div>
        <div>↳ ciphertext at rest · {(info.cipherBytes / 1024).toFixed(1)} KB</div>
      </div>
      <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line-2)", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
        ↳ a richer per-commit audit log (signing key, rotation events) ships with v0.5–v0.7
      </div>
    </div>
  );
}

function RepoSettingsPanel({ info, isOwner }: { info: RepoInfo; isOwner: boolean }) {
  if (!isOwner) {
    return <EmptyPanel title="Settings" body="Only the repo owner can change settings." />;
  }
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-2)" }}>
        <div className="eyebrow">↳ repository settings · {info.owner}/{info.name}</div>
      </div>
      <div style={{ padding: "14px 18px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.85 }}>
        <div>↳ visibility · {info.visibility}</div>
        <div>↳ default branch · {info.defaultBranch}</div>
        <div>↳ created · {new Date(info.createdAt).toLocaleDateString()}</div>
        <div>↳ description · {info.description ?? "(none)"}</div>
      </div>
      <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line-2)", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
        ↳ rename · transfer ownership · delete · ship in v0.5
      </div>
    </div>
  );
}
