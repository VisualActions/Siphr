// Shared crypto-y primitives: Topnav, Sigil, CipherStrip, ServerView, etc.
// Exported to window so other Babel script blocks can use them.

// --- Deterministic pseudo-random from string seed ----------------------------
function seedHash(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}
function seededRng(seed) {
  let s = typeof seed === "string" ? seedHash(seed) : seed >>> 0;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 0xffffffff;
  };
}

// --- FingerprintSigil — 5x5 deterministic colored grid sigil from a key ------
function FingerprintSigil({ seed = "siphr", size = 56, palette }) {
  const cells = 5;
  const rng = seededRng(seed);
  // bone, phosphor, mint, amber, signal — neutralized so the sigil reads as a fingerprint, not a flag
  const pal = palette || ["#c0fa3a", "#6ee7a8", "#f0c060", "#ff5544", "#ebe9dc", "#9aa392", "#4a5443", "#2a2e26"];
  const grid = [];
  // Symmetric (mirrored) sigil, like an identicon. Fill left half + middle col,
  // mirror to the right. Visually distinct, deterministic.
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
      <rect width={size} height={size} fill="#0a0c0a" />
      {grid.map((g, i) =>
        g.c ? (
          <rect key={i} x={g.x * cell + 1} y={g.y * cell + 1} width={cell - 2} height={cell - 2} fill={g.c} rx={1} />
        ) : null
      )}
    </svg>
  );
}

// --- CipherStrip — long row of monospaced hex bytes used as ornament ---------
function cipherBytes(seed, n = 80) {
  const rng = seededRng(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const b = Math.floor(rng() * 256);
    out.push(b.toString(16).padStart(2, "0"));
  }
  return out.join(" ");
}
function CipherStrip({ seed = "x", bytes = 80, style }) {
  return <div className="cipher-strip" style={style}>{cipherBytes(seed, bytes)}</div>;
}

// --- ServerView — fake "what the server actually stores" terminal block ------
function ServerView({ title = "what the server actually stores", lines, style }) {
  return (
    <div className="server-view" style={style}>
      <div className="label">{title}</div>
      {lines.map((l, i) => (
        <div key={i}>
          {l.k && <span style={{ color: "rgba(235,233,220,0.4)" }}>{l.k.padEnd(14, " ")}</span>}
          {l.type === "hex" && <span className="hex">{l.v}</span>}
          {l.type === "none" && <span className="none">{l.v}</span>}
          {l.type === "plain" && <span>{l.v}</span>}
        </div>
      ))}
    </div>
  );
}

// --- Pill / Badge helpers ----------------------------------------------------
function Pill({ children, variant = "default", style }) {
  return <span className={`pill ${variant === "default" ? "" : variant}`} style={style}>{children}</span>;
}

// --- SiphrMark — logomark, a small "wrapping" glyph --------------------------
function SiphrMark({ size = 22 }) {
  // square instrument-bezel mark with a phosphor inner cross — reads as a sealed container
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="1" y="1" width="20" height="20" rx="1" stroke="#c0fa3a" strokeWidth="1.2" fill="#0a0c0a" />
      <rect x="6" y="6" width="10" height="10" rx="0" fill="#c0fa3a" />
      <rect x="9" y="9" width="4" height="4" rx="0" fill="#0a0c0a" />
      {/* corner ticks */}
      <path d="M1 4 L1 1 L4 1 M18 1 L21 1 L21 4 M21 18 L21 21 L18 21 M4 21 L1 21 L1 18" stroke="#c0fa3a" strokeWidth="1" />
    </svg>
  );
}

// --- Appearance popover — hangs below the gear, always rendered open so each
//     static artboard shows the toggle state it would have if the user opened it.
function AppearancePopover({ theme }) {
  const isLight = theme === "light";
  return (
    <div style={{
      position: "absolute",
      top: "100%",
      right: 16,
      marginTop: 8,
      width: 240,
      background: "#06080a",
      border: "1px solid rgba(192,250,58,0.25)",
      borderRadius: 3,
      boxShadow: "0 14px 36px -10px rgba(0,0,0,0.8)",
      padding: "10px 0 6px",
      fontFamily: "var(--mono)",
      color: "#ebe9dc",
      zIndex: 20,
    }}>
      {/* arrow */}
      <div style={{ position: "absolute", top: -5, right: 22, width: 9, height: 9, background: "#06080a", borderTop: "1px solid rgba(192,250,58,0.25)", borderLeft: "1px solid rgba(192,250,58,0.25)", transform: "rotate(45deg)" }} />

      <div style={{ padding: "0 14px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(235,233,220,0.08)", marginBottom: 6 }}>
        <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(235,233,220,0.5)" }}>appearance</span>
        <span style={{ fontSize: 10, letterSpacing: "0.08em", color: "rgba(235,233,220,0.35)" }}>⌘,</span>
      </div>

      {[
        { key: "light", label: "Light mode",  hint: "off-white surfaces" },
        { key: "dark",  label: "Dark mode",   hint: "instrument · default" },
      ].map((opt) => {
        const checked = (opt.key === "light") === isLight;
        return (
          <div key={opt.key} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 14px",
            background: checked ? "rgba(192,250,58,0.08)" : "transparent",
            cursor: "default",
          }}>
            <span style={{
              width: 14, height: 14, flex: "0 0 auto",
              border: `1px solid ${checked ? "#c0fa3a" : "rgba(235,233,220,0.3)"}`,
              background: checked ? "#c0fa3a" : "transparent",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              borderRadius: 2,
            }}>
              {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5 L4 7 L8 3" stroke="#0a0c0a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </span>
            <span style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: checked ? "#c0fa3a" : "#ebe9dc", fontWeight: 500 }}>{opt.label}</div>
              <div style={{ fontSize: 10, color: "rgba(235,233,220,0.4)", marginTop: 1, letterSpacing: "0.02em" }}>{opt.hint}</div>
            </span>
          </div>
        );
      })}

      <div style={{ borderTop: "1px solid rgba(235,233,220,0.08)", marginTop: 6, padding: "8px 14px 4px", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "rgba(235,233,220,0.4)" }}>follows system</span>
        <span className="switch" style={{ transform: "scale(0.85)", transformOrigin: "right center" }} />
      </div>
    </div>
  );
}

// --- TopNav shared chrome ----------------------------------------------------
function TopNav({ user = "you", searchPlaceholder = "search or jump to…", active, theme = "dark" }) {
  return (
    <header className="siphr-topnav" style={{ position: "relative" }}>
      <div className="brand">
        <SiphrMark size={20} />
        <span>siphr</span>
      </div>
      <div className="search">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M10.68 11.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z" /></svg>
        <span>{searchPlaceholder}</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, opacity: 0.6, padding: "1px 5px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 3 }}>/</span>
      </div>
      <nav className="navlinks">
        <a style={{ color: active === "explore" ? "var(--phosphor)" : "inherit" }}>explore</a>
        <a style={{ color: active === "security" ? "var(--phosphor)" : "inherit" }}>security</a>
        <a style={{ color: active === "transparency" ? "var(--phosphor)" : "inherit" }}>transparency</a>
      </nav>
      <div className="right">
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "rgba(235,233,220,0.55)", letterSpacing: "0.04em" }}>
          key loaded · 14m
        </span>
        {/* gear / settings — clearly an active surface so the open popover reads */}
        <button style={{
          width: 28, height: 28, padding: 0,
          background: "rgba(192,250,58,0.10)",
          border: "1px solid rgba(192,250,58,0.35)",
          borderRadius: 3,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "#c0fa3a", cursor: "default",
        }} aria-label="Settings">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.6 3.4l-1.13 1.13M4.53 11.47L3.4 12.6M12.6 12.6l-1.13-1.13M4.53 4.53L3.4 3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <span className="avatar">{user[0]?.toUpperCase()}</span>
      </div>

      <AppearancePopover theme={theme} />
    </header>
  );
}

// --- Tab strip --------------------------------------------------------------
function Tabs({ items, active }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <div key={it.key} style={{
            padding: "10px 16px",
            fontFamily: "var(--mono)",
            fontSize: 12,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: isActive ? "var(--ink)" : "var(--muted)",
            borderBottom: isActive ? "2px solid var(--phosphor)" : "2px solid transparent",
            marginBottom: -1,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span>{it.label}</span>
            {it.count !== undefined && <span style={{ background: isActive ? "var(--phosphor-bg)" : "var(--panel-2)", color: isActive ? "var(--phosphor)" : "var(--muted)", padding: "1px 7px", borderRadius: 2, fontSize: 10, fontWeight: 500 }}>{it.count}</span>}
            {it.dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--phosphor)", boxShadow: "0 0 8px rgba(192,250,58,0.7)" }} />}
          </div>
        );
      })}
    </div>
  );
}

// --- Status dot --------------------------------------------------------------
function Dot({ color = "var(--phosphor)", size = 7 }) {
  return <span style={{ width: size, height: size, borderRadius: 999, background: color, display: "inline-block", flex: "0 0 auto" }} />;
}

// Export
Object.assign(window, {
  FingerprintSigil,
  CipherStrip,
  AppearancePopover,
  cipherBytes,
  ServerView,
  Pill,
  SiphrMark,
  TopNav,
  Tabs,
  Dot,
  seededRng,
});
