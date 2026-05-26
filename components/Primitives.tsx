import type { CSSProperties, ReactNode } from "react";

/* ============================================================================
 * Crypto-y primitives — sigils, ciphertext strips, server-view blocks, pills.
 * These are the recurring visual motifs that make encryption *visible* instead
 * of just described.
 * ========================================================================= */

function seedHash(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function seededRng(seed: string | number): () => number {
  let s = typeof seed === "string" ? seedHash(seed) : seed >>> 0;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 0xffffffff;
  };
}

/** 5x5 mirrored deterministic identicon derived from any seed string. */
export function FingerprintSigil({
  seed = "siphr",
  size = 56,
  palette,
}: {
  seed?: string;
  size?: number;
  palette?: string[];
}) {
  const cells = 5;
  const rng = seededRng(seed);
  const pal = palette ?? [
    "#b25927", "#1f5c3a", "#e8c766", "#1a1814",
    "#7a5c3a", "#c97a4a", "#3b4a3f", "#8a2a1f",
  ];
  const grid: { x: number; y: number; c: string | null }[] = [];
  const mid = Math.floor(cells / 2);
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x <= mid; x++) {
      const r = rng();
      const c = r < 0.32 ? null : pal[Math.floor(r * pal.length)];
      grid.push({ x, y, c });
      if (x !== mid) grid.push({ x: cells - 1 - x, y, c });
    }
  }
  const cell = size / cells;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", borderRadius: 4 }}>
      <rect width={size} height={size} fill="#fffdf7" />
      {grid.map((g, i) =>
        g.c ? (
          <rect key={i} x={g.x * cell + 1} y={g.y * cell + 1} width={cell - 2} height={cell - 2} fill={g.c} rx={1} />
        ) : null
      )}
    </svg>
  );
}

export function cipherBytes(seed: string, n = 80): string {
  const rng = seededRng(seed);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(Math.floor(rng() * 256).toString(16).padStart(2, "0"));
  }
  return out.join(" ");
}

export function CipherStrip({
  seed = "x",
  bytes = 80,
  style,
}: {
  seed?: string;
  bytes?: number;
  style?: CSSProperties;
}) {
  return <div className="cipher-strip" style={style}>{cipherBytes(seed, bytes)}</div>;
}

type ServerViewLine = {
  k?: string;
  v: ReactNode;
  type: "hex" | "none" | "plain";
};

export function ServerView({
  title = "what the server actually stores",
  lines,
  style,
}: {
  title?: string;
  lines: ServerViewLine[];
  style?: CSSProperties;
}) {
  return (
    <div className="server-view" style={style}>
      <div className="label">{title}</div>
      {lines.map((l, i) => (
        <div key={i}>
          {l.k && <span style={{ color: "#806c4a", display: "inline-block", minWidth: 110 }}>{l.k}</span>}
          {l.type === "hex"   && <span className="hex">{l.v}</span>}
          {l.type === "none"  && <span className="none">{l.v}</span>}
          {l.type === "plain" && <span>{l.v}</span>}
        </div>
      ))}
    </div>
  );
}

export function Pill({
  children,
  variant = "default",
  style,
}: {
  children: ReactNode;
  variant?: "default" | "encrypted" | "public" | "solid";
  style?: CSSProperties;
}) {
  return <span className={`pill ${variant === "default" ? "" : variant}`} style={style}>{children}</span>;
}

export function SiphrMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="19" height="19" rx="4" fill="#b25927" />
      <path d="M6.5 11 L9.5 14 L15.5 8" stroke="#fffdf7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="11" r="6.5" stroke="#fffdf7" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
}

export function Dot({ color = "var(--moss)", size = 7 }: { color?: string; size?: number }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 999,
      background: color, display: "inline-block", flex: "0 0 auto",
    }} />
  );
}

export type TabItem = { key: string; label: string; count?: number; dot?: boolean; href?: string };

export function Tabs({ items, active }: { items: TabItem[]; active: string }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
      {items.map((it) => {
        const isActive = it.key === active;
        const tab = (
          <span style={{
            padding: "10px 16px",
            fontFamily: "var(--mono)",
            fontSize: 12,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: isActive ? "var(--ink)" : "var(--muted)",
            borderBottom: isActive ? "2px solid var(--copper)" : "2px solid transparent",
            marginBottom: -1,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}>
            <span>{it.label}</span>
            {it.count !== undefined && (
              <span style={{
                background: isActive ? "var(--copper-bg)" : "var(--paper-2)",
                color: isActive ? "var(--copper)" : "var(--muted)",
                padding: "1px 7px",
                borderRadius: 999,
                fontSize: 10,
              }}>{it.count}</span>
            )}
            {it.dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--copper)" }} />}
          </span>
        );
        return it.href ? (
          <a key={it.key} href={it.href}>{tab}</a>
        ) : (
          <span key={it.key}>{tab}</span>
        );
      })}
    </div>
  );
}

export function LockGlyph({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 4a4 4 0 1 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm6.5 2V4a2.5 2.5 0 0 0-5 0v2Z" />
    </svg>
  );
}

export function ArrowGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
