"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FingerprintSigil, Pill } from "./Primitives";

export type FeaturedRepo = {
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
  "all",
  "operating systems",
  "game engines",
  "languages & compilers",
  "browsers",
  "security research",
  "scientific",
];

export default function FeaturedFilter({
  featured,
}: { featured: FeaturedRepo[] }) {
  const [cat, setCat] = useState<string>("all");

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const r of featured) {
      if (!r.featuredTag) continue;
      out[r.featuredTag] = (out[r.featuredTag] ?? 0) + 1;
    }
    return out;
  }, [featured]);

  const filtered = useMemo(() => {
    if (cat === "all") return featured;
    return featured.filter((r) => r.featuredTag === cat);
  }, [featured, cat]);

  return (
    <>
      {/* Category strip */}
      <div style={{ marginTop: 36, display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
        {CATEGORIES.map((label) => {
          const active = cat === label;
          const count = label === "all" ? featured.length : (counts[label] ?? 0);
          return (
            <button
              type="button"
              key={label}
              onClick={() => setCat(label)}
              style={{
                fontFamily: "var(--mono)", fontSize: 12,
                color: active ? "var(--phosphor)" : "var(--muted)",
                borderBottom: active ? "2px solid var(--phosphor)" : "2px solid transparent",
                paddingBottom: 6, display: "inline-flex", gap: 6,
                background: "transparent", border: 0, borderBottomWidth: 2,
                borderBottomStyle: "solid",
                cursor: "pointer",
              }}
            >
              {label}
              <span style={{ color: "var(--muted-2)" }}>· {count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{ marginTop: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>
          ↳ {filtered.length > 0
            ? `${cat === "all" ? "featured" : cat} · ${filtered.length} ${filtered.length === 1 ? "project" : "projects"}`
            : `no featured projects in ${cat}`}
        </div>
        {filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {filtered.map((r) => <FeaturedCard key={r.id} r={r} />)}
          </div>
        )}
      </div>
    </>
  );
}

function FeaturedCard({ r }: { r: FeaturedRepo }) {
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
