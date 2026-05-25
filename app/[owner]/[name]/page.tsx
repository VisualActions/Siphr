"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import VerifiedBadge from "@/components/VerifiedBadge";

type RepoInfo = {
  id: string;
  owner: string;
  name: string;
  visibility: "private" | "public";
  createdAt: string;
  collaborators: string[];
  objectCount: number;
  cipherBytes: number;
};

export default function RepoPage({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}) {
  const { owner, name } = use(params);
  const [info, setInfo] = useState<RepoInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"code" | "issues" | "pulls" | "actions" | "settings">("code");
  const [user, setUser] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);

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
      .then((j) => {
        if (j) setInfo(j);
      });
  }, [owner, name]);

  useEffect(() => {
    if (info) setHasKey(!!sessionStorage.getItem(`siphr:repokey:${info.id}`));
  }, [info]);

  if (notFound) {
    return (
      <>
        <TopNav />
        <main className="mx-auto max-w-[1012px] px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-2">404</h1>
          <p className="text-[color:var(--color-fg-muted)]">
            That repository doesn't exist, or you don't have access. Siphr can't reveal whether a private repo exists if you don't hold a wrapped key for it.
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

  return (
    <>
      <TopNav />
      <main>
        <section className="border-b" style={{ background: "var(--color-canvas-subtle)" }}>
          <div className="mx-auto max-w-[1280px] px-4 pt-6 pb-0">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <RepoIcon />
              <Link href={`/${info.owner}`} className="text-lg font-normal">{info.owner}</Link>
              <VerifiedBadge username={info.owner} size={16} />
              <span className="text-lg text-[color:var(--color-fg-muted)]">/</span>
              <Link href={`/${info.owner}/${info.name}`} className="text-lg font-semibold">{info.name}</Link>
              <span className={`badge ${info.visibility === "private" ? "badge-private" : ""}`}>
                {info.visibility}
              </span>
              {info.visibility === "private" && (
                <span className="badge" style={{ borderColor: "rgba(212, 167, 44, 0.4)", color: "#9a6700", background: "#fff8c5" }}>
                  end-to-end encrypted
                </span>
              )}
            </div>
            <div className="flex gap-4 items-end">
              <Tab name="Code" active={tab === "code"} onClick={() => setTab("code")} icon={<CodeIcon />} />
              <Tab name="Issues" count={0} active={tab === "issues"} onClick={() => setTab("issues")} icon={<IssueIcon />} />
              <Tab name="Pull requests" count={0} active={tab === "pulls"} onClick={() => setTab("pulls")} icon={<PullIcon />} />
              <Tab name="Actions" active={tab === "actions"} onClick={() => setTab("actions")} icon={<GearIcon />} />
              {isOwner && (
                <Tab name="Settings" active={tab === "settings"} onClick={() => setTab("settings")} icon={<GearIcon />} />
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1280px] px-4 py-6 grid lg:grid-cols-[1fr_296px] gap-6">
          <section>
            {tab === "code" && (
              <CodeTab info={info} hasKey={hasKey} isOwner={isOwner} />
            )}
            {tab === "issues" && <EmptyTab title="No issues yet" body="Issues are encrypted at rest with the repo key. Open one when you've got something to track." />}
            {tab === "pulls" && <EmptyTab title="No pull requests" body="Diffs and merges happen client-side. PRs travel as ciphertext." />}
            {tab === "actions" && <EmptyTab title="Actions" body="Self-hosted runners can decrypt the repo key from a wrapped deploy key. Hosted runners would break the threat model." />}
            {tab === "settings" && <SettingsTab info={info} />}
          </section>

          <aside className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-[color:var(--color-fg-muted)]">
                {info.visibility === "private"
                  ? "Private repository. Only collaborators with a wrapped repo key can decrypt the contents."
                  : "Public repository. Stored as plaintext, like a normal forge — anyone can read it."}
              </p>
              <div className="mt-4 text-sm space-y-2">
                {info.visibility === "private" ? (
                  <>
                    <div className="flex items-center gap-2 text-[color:var(--color-fg-muted)]">
                      <LockSm /> Encrypted with AES-256-GCM
                    </div>
                    <div className="flex items-center gap-2 text-[color:var(--color-fg-muted)]">
                      <KeySm /> {info.collaborators.length} collaborator{info.collaborators.length === 1 ? "" : "s"} can decrypt
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-[color:var(--color-fg-muted)]">
                    <span aria-hidden>🌍</span> Open to anyone — no analytics, no view tracking
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
                <div className="flex justify-between py-1 border-b border-[color:var(--color-border-muted)]">
                  <span className="text-[color:var(--color-fg-muted)]">Objects</span>
                  <span className="font-mono">{info.objectCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[color:var(--color-border-muted)]">
                  <span className="text-[color:var(--color-fg-muted)]">
                    {info.visibility === "private" ? "Ciphertext" : "Plaintext"}
                  </span>
                  <span className="font-mono">{(info.cipherBytes / 1024).toFixed(1)} KB</span>
                </div>
                {info.visibility === "private" && (
                  <div className="flex justify-between py-1">
                    <span className="text-[color:var(--color-fg-muted)]">Plaintext on server</span>
                    <span className="font-mono" style={{ color: "#cf222e" }}>0 B</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Collaborators</h3>
              <ul className="space-y-2 text-sm">
                {info.collaborators.map((c) => (
                  <li key={c} className="flex items-center gap-2">
                    <Avatar name={c} />
                    <Link href={`/${c}`}>{c}</Link>
                  </li>
                ))}
              </ul>
              {isOwner && (
                <Link href={`/${info.owner}/${info.name}/settings/access`} className="text-sm block mt-3">
                  Manage access →
                </Link>
              )}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function CodeTab({ info, hasKey, isOwner }: { info: RepoInfo; hasKey: boolean; isOwner: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button className="btn btn-sm">
          <BranchIcon /> main
        </button>
        <span className="text-sm text-[color:var(--color-fg-muted)]">
          1 branch · 0 tags
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn btn-sm"><CodeIcon /> Go to file</button>
          <button className="btn btn-sm btn-primary"><DownloadIcon /> Code</button>
        </div>
      </div>

      {info.visibility === "private" && !hasKey && info.objectCount > 0 && (
        <div
          className="rounded-md p-4 mb-4 flex items-start gap-3"
          style={{ background: "#fff8c5", border: "1px solid rgba(212, 167, 44, 0.4)" }}
        >
          <div className="mt-0.5" style={{ color: "#9a6700" }}><LockSm /></div>
          <div className="text-sm">
            <div className="font-semibold mb-0.5">Repo contents are encrypted in this browser</div>
            <p className="text-[color:var(--color-fg-muted)]">
              {isOwner
                ? "You created this repo on another device or session. To view files, the wrapped repo key from your identity needs to be unwrapped here."
                : "You're not a collaborator yet. The owner needs to wrap the repo key to your public key for you to see file contents."}
            </p>
          </div>
        </div>
      )}

      <div className="box">
        <div className="box-row flex items-center gap-3" style={{ background: "var(--color-canvas-subtle)" }}>
          <Avatar name={info.owner} />
          <span className="font-semibold text-sm">{info.owner}</span>
          <span className="text-sm text-[color:var(--color-fg-muted)]">pushed {info.objectCount} encrypted objects</span>
          <span className="ml-auto text-xs font-mono text-[color:var(--color-fg-muted)]" title="encrypted commit hash">
            ciphertext
          </span>
        </div>
        {info.objectCount === 0 ? (
          <div className="box-row text-center text-[color:var(--color-fg-muted)] py-10">
            This repository is empty. Push your first commit with:
            <div className="mt-3 font-mono text-xs text-left max-w-md mx-auto p-3 rounded" style={{ background: "var(--color-canvas-subtle)" }}>
              git remote add siphr https://siphr.dev/{info.owner}/{info.name}.git<br />
              git push siphr main
            </div>
          </div>
        ) : info.visibility === "public" ? (
          <>
            <FileRow icon="📁" name="README.md" subtitle={`${info.cipherBytes >>> 0} B`} />
            <FileRow icon="📁" name="src/" subtitle={`${info.objectCount} objects total`} />
            <FileRow icon="📁" name="(file tree)" subtitle="public, browsable, plaintext" />
          </>
        ) : (
          <>
            <FileRow icon="🔒" name="(encrypted file tree)" subtitle="decryptable client-side with a wrapped repo key" />
            <FileRow icon="🔒" name="(encrypted blob)" subtitle={`${info.objectCount - 1} more objects`} />
          </>
        )}
      </div>

      <div className="box mt-4">
        <div className="box-row" style={{ background: "var(--color-canvas-subtle)" }}>
          <div className="font-semibold text-sm">README.md</div>
        </div>
        <div className="box-row">
          <p className="text-sm text-[color:var(--color-fg-muted)]">
            {info.visibility === "public"
              ? "README renders here, served straight from plaintext object storage."
              : hasKey
              ? "README would render here, decrypted in your browser from the ciphertext on the server."
              : "🔒 README is encrypted. It will render here once you hold a wrapped repo key."}
          </p>
        </div>
      </div>
    </div>
  );
}

function FileRow({ icon, name, subtitle }: { icon: string; name: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t border-[color:var(--color-border-muted)] hover:bg-[color:var(--color-canvas-subtle)]">
      <span aria-hidden>{icon}</span>
      <span className="text-sm font-mono">{name}</span>
      <span className="ml-auto text-xs text-[color:var(--color-fg-muted)]">{subtitle}</span>
    </div>
  );
}

function EmptyTab({ title, body }: { title: string; body: string }) {
  return (
    <div className="box">
      <div className="box-row text-center py-12">
        <div className="text-lg font-semibold mb-2">{title}</div>
        <p className="text-sm text-[color:var(--color-fg-muted)] max-w-md mx-auto">{body}</p>
      </div>
    </div>
  );
}

function SettingsTab({ info }: { info: RepoInfo }) {
  return (
    <div className="space-y-4">
      <div className="box">
        <div className="box-row">
          <h3 className="font-semibold mb-1">Repository name</h3>
          <input className="input max-w-md" defaultValue={info.name} />
        </div>
        <div className="box-row">
          <h3 className="font-semibold mb-2">Visibility</h3>
          <p className="text-sm text-[color:var(--color-fg-muted)] mb-3">
            Making a repo public publishes the repo key. The encryption pipeline stays the same; anyone can decrypt.
          </p>
          <button className="btn btn-sm">Change visibility</button>
        </div>
        <div className="box-row">
          <h3 className="font-semibold mb-2">Rotate repo key</h3>
          <p className="text-sm text-[color:var(--color-fg-muted)] mb-3">
            Generates a new repo key, re-wraps it for current collaborators, and re-encrypts new objects forward. Used after removing access.
          </p>
          <button className="btn btn-sm">Rotate key</button>
        </div>
      </div>
      <div className="box" style={{ borderColor: "#cf222e" }}>
        <div className="box-row">
          <h3 className="font-semibold mb-2" style={{ color: "#cf222e" }}>Danger zone</h3>
          <button className="btn btn-sm" style={{ color: "#cf222e", borderColor: "#cf222e" }}>Delete this repository</button>
        </div>
      </div>
    </div>
  );
}

function Tab({
  name,
  active,
  onClick,
  count,
  icon,
}: {
  name: string;
  active: boolean;
  onClick: () => void;
  count?: number;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 pb-3 text-sm relative"
      style={{
        color: active ? "var(--color-fg)" : "var(--color-fg-muted)",
        fontWeight: active ? 600 : 400,
        borderBottom: active ? "2px solid #fd8c73" : "2px solid transparent",
        marginBottom: -1,
      }}
    >
      {icon}
      {name}
      {count !== undefined && (
        <span className="badge" style={{ fontSize: 11 }}>{count}</span>
      )}
    </button>
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
function PullIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" /></svg>; }
function GearIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" /></svg>; }
function BranchIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" /></svg>; }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z" /><path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z" /></svg>; }
function LockSm() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M4 4a4 4 0 1 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm6.5 2V4a2.5 2.5 0 0 0-5 0v2Z" /></svg>; }
function KeySm() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M10.5 0a5.5 5.5 0 0 0-5.39 6.6L.22 11.49a.75.75 0 0 0-.22.53V15c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-1h1c.55 0 1-.45 1-1v-1h1c.2 0 .39-.08.53-.22L9.4 10.39A5.5 5.5 0 1 0 10.5 0Zm1.5 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" /></svg>; }
function ClockSm() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z" /></svg>; }
