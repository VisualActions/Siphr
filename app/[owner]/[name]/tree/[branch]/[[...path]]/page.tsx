"use client";

import Link from "next/link";
import { use } from "react";
import TopNav from "@/components/TopNav";
import FileBrowser from "@/components/FileBrowser";

export default function TreePage({
  params,
}: {
  params: Promise<{ owner: string; name: string; branch: string; path?: string[] }>;
}) {
  const { owner, name, branch, path } = use(params);
  const fullPath = (path ?? []).map(decodeURIComponent).join("/");
  const segments = (path ?? []).map(decodeURIComponent);

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-[1280px] px-4 py-6">
        <RepoHeader owner={owner} name={name} />

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <button className="btn btn-sm">
            <BranchIcon /> {branch}
          </button>
          <Breadcrumb owner={owner} name={name} branch={branch} segments={segments} />
          <div className="ml-auto flex gap-2">
            <Link href={`/${owner}/${name}/find/${branch}`} className="btn btn-sm">Go to file</Link>
            <button className="btn btn-sm btn-primary">Code</button>
          </div>
        </div>

        <div className="box">
          <FileBrowser owner={owner} name={name} branch={branch} path={fullPath} />
        </div>
      </main>
    </>
  );
}

function RepoHeader({ owner, name }: { owner: string; name: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-6 pb-4 border-b">
      <RepoIcon />
      <Link href={`/${owner}`} className="text-lg">{owner}</Link>
      <span className="text-lg text-[color:var(--color-fg-muted)]">/</span>
      <Link href={`/${owner}/${name}`} className="text-lg font-semibold">{name}</Link>
    </div>
  );
}

function Breadcrumb({
  owner,
  name,
  branch,
  segments,
}: {
  owner: string;
  name: string;
  branch: string;
  segments: string[];
}) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link href={`/${owner}/${name}/tree/${branch}`} className="font-semibold">
        {name}
      </Link>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const upTo = segments.slice(0, i + 1).join("/");
        return (
          <span key={i} className="flex items-center gap-1">
            <span className="text-[color:var(--color-fg-muted)]">/</span>
            {isLast ? (
              <span className="font-semibold">{seg}</span>
            ) : (
              <Link href={`/${owner}/${name}/tree/${branch}/${upTo}`}>{seg}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function RepoIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.69 1.72.75.75 0 1 1-1.05 1.07A2.5 2.5 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.5 2.5 0 0 1 4.5 9h8Z" /></svg>; }
function BranchIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" /></svg>; }
