"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import VerifiedBadge from "@/components/VerifiedBadge";
import FileBrowser from "@/components/FileBrowser";

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
        <main className="mx-auto max-w-[1012px] px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-2">404</h1>
          <p className="text-[color:var(--color-fg-muted)]">
            That repository doesn't exist, or you don't have access.
          </p>
        </main>
      </>
    );
  }

  if (!info) {
    return (
      <>
        <TopNav />
        <main className="mx-auto max-w-[1280px] px-4 py-16">
          <div className="text-[color:var(--color-fg-muted)]">Loading…</div>
        </main>
      </>
    );
  }

  const isOwner = user === info.owner;
  const isPublic = info.visibility === "public";

  return (
    <>
      <TopNav />
      <main>
        <section className="border-b" style={{ background: "var(--color-canvas-subtle)" }}>
          <div className="mx-auto max-w-[1280px] px-4 pt-6 pb-0">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <RepoIcon />
              <Link href={`/${info.owner}`} className="text-lg font-normal">
                {info.owner}
              </Link>
              <VerifiedBadge username={info.owner} size={16} />
              <span className="text-lg text-[color:var(--color-fg-muted)]">/</span>
              <Link href={`/${info.owner}/${info.name}`} className="text-lg font-semibold">
                {info.name}
              </Link>
              <span className={`badge ${info.visibility === "private" ? "badge-private" : ""}`}>
                {info.visibility}
              </span>
              {!isPublic && (
                <span
                  className="badge"
                  style={{
                    borderColor: "rgba(212, 167, 44, 0.4)",
                    color: "#9a6700",
                    background: "#fff8c5",
                  }}
                >
                  end-to-end encrypted
                </span>
              )}
            </div>
            <div className="flex gap-4 items-end overflow-x-auto">
              <Tab name="Code" active icon={<CodeIcon />} />
              <Tab name="Issues" count={0} icon={<IssueIcon />} />
              <Tab name="Pull requests" count={0} icon={<PullIcon />} />
              <Tab name="Actions" icon={<GearIcon />} />
              {isOwner && <Tab name="Settings" icon={<GearIcon />} />}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1280px] px-4 py-6 grid lg:grid-cols-[1fr_296px] gap-6">
          <section>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button className="btn btn-sm">
                <BranchIcon /> {info.defaultBranch}
              </button>
              <span className="text-sm text-[color:var(--color-fg-muted)]">
                1 branch · 0 tags
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Link
                  href={`/${info.owner}/${info.name}/tree/${info.defaultBranch}`}
                  className="btn btn-sm"
                >
                  Go to file
                </Link>
                <button className="btn btn-sm btn-primary">Code</button>
              </div>
            </div>

            {!isPublic && !hasKey && info.objectCount > 0 && (
              <div
                className="rounded-md p-4 mb-4 flex items-start gap-3"
                style={{
                  background: "#fff8c5",
                  border: "1px solid rgba(212, 167, 44, 0.4)",
                }}
              >
                <div className="mt-0.5" style={{ color: "#9a6700" }}>
                  <LockSm />
                </div>
                <div className="text-sm">
                  <div className="font-semibold mb-0.5">
                    Repo contents are encrypted in this browser
                  </div>
                  <p className="text-[color:var(--color-fg-muted)]">
                    {isOwner
                      ? "Decryption hasn't happened on this session yet."
                      : "You're not a collaborator. The owner needs to wrap the repo key to your public key."}
                  </p>
                </div>
              </div>
            )}

            <div className="box">
              {info.objectCount === 0 ? (
                <div className="box-row text-center text-[color:var(--color-fg-muted)] py-10">
                  This repository is empty. Push your first commit:
                  <div
                    className="mt-3 font-mono text-xs text-left max-w-md mx-auto p-3 rounded"
                    style={{ background: "var(--color-canvas-subtle)" }}
                  >
                    git remote add siphr https://siphr.dev/{info.owner}/{info.name}.git
                    <br />
                    git push siphr {info.defaultBranch}
                  </div>
                </div>
              ) : isPublic ? (
                <FileBrowser
                  owner={info.owner}
                  name={info.name}
                  branch={info.defaultBranch}
                  path=""
                />
              ) : (
                <div className="box-row text-sm text-[color:var(--color-fg-muted)]">
                  🔒 Encrypted file tree — decryptable client-side with a wrapped repo key.
                </div>
              )}
            </div>

            {readme && (
              <div className="box mt-4">
                <div className="box-row" style={{ background: "var(--color-canvas-subtle)" }}>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <span>📖</span> README.md
                  </div>
                </div>
                <div className="box-row">
                  <Markdown text={readme} />
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-[color:var(--color-fg-muted)]">
                {info.description
                  ? info.description
                  : isPublic
                  ? "Public repository. Stored as plaintext, like a normal forge — anyone can read it."
                  : "Private repository. Only collaborators with a wrapped repo key can decrypt the contents."}
              </p>
              <div className="mt-4 text-sm space-y-2">
                {!isPublic ? (
                  <>
                    <div className="flex items-center gap-2 text-[color:var(--color-fg-muted)]">
                      <LockSm /> Encrypted with AES-256-GCM
                    </div>
                    <div className="flex items-center gap-2 text-[color:var(--color-fg-muted)]">
                      <KeySm /> {info.collaborators.length} collaborator
                      {info.collaborators.length === 1 ? "" : "s"} can decrypt
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-[color:var(--color-fg-muted)]">
                    <span aria-hidden>🌍</span> Open to anyone — no view tracking
                  </div>
                )}
                <div className="flex items-center gap-2 text-[color:var(--color-fg-muted)]">
                  <ClockSm /> Created {new Date(info.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Storage on server</h3>
              <div className="text-sm">
                <Stat label="Objects" value={info.objectCount.toString()} />
                <Stat
                  label={isPublic ? "Plaintext" : "Ciphertext"}
                  value={`${(info.cipherBytes / 1024).toFixed(1)} KB`}
                />
                {!isPublic && (
                  <Stat label="Plaintext" value="0 B" valueColor="#cf222e" />
                )}
              </div>
            </div>

            {info.collaborators.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Collaborators</h3>
                <ul className="space-y-2 text-sm">
                  {info.collaborators.map((c) => (
                    <li key={c} className="flex items-center gap-2">
                      <Avatar name={c} />
                      <Link href={`/${c}`}>{c}</Link>
                      <VerifiedBadge username={c} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}

function Markdown({ text }: { text: string }) {
  // Minimal renderer: headings + code fences + paragraphs.
  const blocks: React.ReactNode[] = [];
  const lines = text.split("\n");
  let inCode = false;
  let codeBuf: string[] = [];
  let paraBuf: string[] = [];
  let i = 0;

  const flushPara = () => {
    if (!paraBuf.length) return;
    blocks.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed mb-3">
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
            className="text-xs font-mono p-3 rounded mb-3 overflow-auto"
            style={{ background: "var(--color-canvas-subtle)" }}
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
      const Tag = (`h${Math.min(level + 1, 6)}` as keyof React.JSX.IntrinsicElements);
      blocks.push(
        <Tag
          key={`h-${i}`}
          className="font-semibold mt-4 mb-2"
          style={{ fontSize: level === 1 ? "1.5rem" : level === 2 ? "1.25rem" : "1rem" }}
        >
          {text}
        </Tag>
      );
    } else if (line.trim() === "") {
      flushPara();
    } else if (/^[-*]\s/.test(line)) {
      flushPara();
      blocks.push(
        <li key={`li-${i}`} className="text-sm ml-5 list-disc mb-1">
          {renderInline(line.replace(/^[-*]\s+/, ""))}
        </li>
      );
    } else {
      paraBuf.push(line);
    }
    i++;
  }
  flushPara();
  return <div className="markdown-body">{blocks}</div>;
}

function renderInline(s: string): React.ReactNode {
  // very small subset: `code` + **bold** + [text](url)
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
        <code key={key++} className="font-mono text-xs px-1 rounded" style={{ background: "var(--color-canvas-subtle)" }}>
          {earliest[1]}
        </code>
      );
    } else if (earliest === linkM) {
      parts.push(
        <a key={key++} href={earliest[2]} target="_blank" rel="noreferrer">
          {earliest[1]}
        </a>
      );
    } else if (earliest === boldM) {
      parts.push(
        <strong key={key++}>{earliest[1]}</strong>
      );
    }
    rest = rest.slice(earliest.index! + earliest[0].length);
  }
  return parts;
}

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-[color:var(--color-border-muted)] last:border-b-0">
      <span className="text-[color:var(--color-fg-muted)]">{label}</span>
      <span className="font-mono" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
    </div>
  );
}

function Tab({
  name,
  active,
  count,
  icon,
}: {
  name: string;
  active?: boolean;
  count?: number;
  icon: React.ReactNode;
}) {
  return (
    <span
      className="flex items-center gap-2 px-3 pb-3 text-sm"
      style={{
        color: active ? "var(--color-fg)" : "var(--color-fg-muted)",
        fontWeight: active ? 600 : 400,
        borderBottom: active ? "2px solid #fd8c73" : "2px solid transparent",
        marginBottom: -1,
      }}
    >
      {icon}
      {name}
      {count !== undefined && <span className="badge" style={{ fontSize: 11 }}>{count}</span>}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold"
      style={{ width: 20, height: 20, background: "#0969da", color: "#fff", fontSize: 11 }}
    >
      {name[0]?.toUpperCase()}
    </span>
  );
}

function RepoIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.69 1.72.75.75 0 1 1-1.05 1.07A2.5 2.5 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.5 2.5 0 0 1 4.5 9h8Z" /></svg>; }
function CodeIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8l-3.72-3.72a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.749.749 0 0 1 .734-.215.749.749 0 0 1 .326 1.275L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.47 8.53a.75.75 0 0 1 0-1.06Z" /></svg>; }
function IssueIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" /></svg>; }
function PullIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Z" /></svg>; }
function GearIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>; }
function BranchIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z" /></svg>; }
function LockSm() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M4 4a4 4 0 1 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm6.5 2V4a2.5 2.5 0 0 0-5 0v2Z" /></svg>; }
function KeySm() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M10.5 0a5.5 5.5 0 0 0-5.39 6.6L.22 11.49a.75.75 0 0 0-.22.53V15c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-1h1c.55 0 1-.45 1-1v-1h1c.2 0 .39-.08.53-.22L9.4 10.39A5.5 5.5 0 1 0 10.5 0Z" /></svg>; }
function ClockSm() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z" /></svg>; }
