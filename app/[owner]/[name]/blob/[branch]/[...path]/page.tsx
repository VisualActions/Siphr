"use client";

import Link from "next/link";
import { use } from "react";
import TopNav from "@/components/TopNav";
import FileViewer from "@/components/FileViewer";
import { FingerprintSigil } from "@/components/Primitives";

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
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 6vw 80px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          marginBottom: 24, paddingBottom: 18, borderBottom: "1px solid var(--line)",
        }}>
          <FingerprintSigil seed={`${owner}/${name}`} size={24} />
          <Link href={`/${owner}`} style={{ fontSize: 18 }}>{owner}</Link>
          <span style={{ fontSize: 18, color: "var(--muted-2)" }}>/</span>
          <Link href={`/${owner}/${name}`} style={{ fontSize: 18, fontWeight: 600 }}>{name}</Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <button className="btn ghost sm" style={{ fontFamily: "var(--mono)" }}>↳ {branch}</button>
          <Breadcrumb owner={owner} name={name} branch={branch} segments={segments} />
        </div>

        <FileViewer owner={owner} name={name} branch={branch} path={fullPath} />
      </main>
    </>
  );
}

function Breadcrumb({
  owner, name, branch, segments,
}: {
  owner: string; name: string; branch: string; segments: string[];
}) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "var(--mono)" }}>
      <Link href={`/${owner}/${name}/tree/${branch}`} style={{ fontWeight: 600 }}>{name}</Link>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const ancestor = segments.slice(0, i).join("/");
        const dirHref = `/${owner}/${name}/tree/${branch}${ancestor ? "/" + ancestor : ""}`;
        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--muted-2)" }}>/</span>
            {isLast ? (
              <span style={{ fontWeight: 600 }}>{seg}</span>
            ) : (
              <Link href={`${dirHref}/${seg}`.replace(/\/+/g, "/")}>{seg}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
