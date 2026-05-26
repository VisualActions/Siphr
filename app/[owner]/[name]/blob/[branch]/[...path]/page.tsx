"use client";

import Link from "next/link";
import { use } from "react";
import TopNav from "@/components/TopNav";
import FileViewer from "@/components/FileViewer";

export default function BlobPage({
  params,
}: {
  params: Promise<{ owner: string; name: string; branch: string; path: string[] }>;
}) {
  const { owner, name, branch, path } = use(params);
  const segments = path.map(decodeURIComponent);
  const fullPath = segments.join("/");

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-[1280px] px-4 py-6">
        <div className="flex items-center gap-2 flex-wrap mb-6 pb-4 border-b">
          <Link href={`/${owner}`} className="text-lg">{owner}</Link>
          <span className="text-lg text-[color:var(--color-fg-muted)]">/</span>
          <Link href={`/${owner}/${name}`} className="text-lg font-semibold">{name}</Link>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <button className="btn btn-sm">{branch}</button>
          <Breadcrumb owner={owner} name={name} branch={branch} segments={segments} />
        </div>

        <FileViewer owner={owner} name={name} branch={branch} path={fullPath} />
      </main>
    </>
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
        const upTo = segments.slice(0, i).join("/");
        return (
          <span key={i} className="flex items-center gap-1">
            <span className="text-[color:var(--color-fg-muted)]">/</span>
            {isLast ? (
              <span className="font-semibold">{seg}</span>
            ) : (
              <Link href={`/${owner}/${name}/tree/${branch}${upTo ? "/" + upTo : ""}${upTo ? "/" : "/"}${seg}`.replace(/\/\/+/g, "/")}>
                {seg}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
