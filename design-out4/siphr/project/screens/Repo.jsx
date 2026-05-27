// Repo page — encryption as primitive. Shows collaborator keys, a "what
// the server actually stores" toggle, key-rotation audit, and the file tree
// with ciphertext oids alongside filenames.

function ScreenRepo({ theme = "dark" }) {
  const files = [
    { kind: "dir",  name: "app",         msg: "wire signin flow",            when: "2h",  oid: "9a4f c2b8 7e01 d3aa" },
    { kind: "dir",  name: "components",  msg: "extract VerifiedBadge",       when: "2h",  oid: "02bc 4a91 7d2e 88c5" },
    { kind: "dir",  name: "lib",         msg: "crypto: wrap/unwrap helpers", when: "1d",  oid: "b73c 9d6e 4271 a05b" },
    { kind: "file", name: ".gitignore",  msg: "init",                        when: "4d",  oid: "6c19 ae83 50fb 21d7" },
    { kind: "file", name: "README.md",   msg: "honest tradeoffs section",    when: "2h",  oid: "47b2 d815 90a3 6e2c" },
    { kind: "file", name: "package.json", msg: "next 16, react 19",          when: "5d",  oid: "f681 ae0c 8d12 4471" },
    { kind: "file", name: "tsconfig.json", msg: "init",                      when: "5d",  oid: "1f0a 35d8 e2bc 7c19" },
  ];

  return (
    <div className={`siphr-surface ${theme}`} style={{ width: 1280, minHeight: 1100 }}>
      <TopNav user="r" theme={theme} />

      {/* Repo header strip */}
      <section style={{ background: "var(--paper-2)", borderBottom: "1px solid var(--line)", padding: "20px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <RepoIconSmall />
          <span style={{ fontSize: 18 }}>r</span>
          <span style={{ color: "var(--muted-2)", fontSize: 18 }}>/</span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>siphr</span>
          <Pill variant="encrypted">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <LockGlyph /> private · e2ee
            </span>
          </Pill>
          <Pill>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Dot color="var(--moss)" /> decrypted in this session
            </span>
          </Pill>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="btn ghost sm">↑ Watch · 12</button>
            <button className="btn ghost sm">⌥ Fork · 3</button>
            <button className="btn sm">⌃ Clone</button>
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <Tabs
            active="code"
            items={[
              { key: "code", label: "code" },
              { key: "issues", label: "issues", count: 4 },
              { key: "pulls", label: "pull requests", count: 2 },
              { key: "keys", label: "keys", dot: true },
              { key: "audit", label: "audit log" },
              { key: "settings", label: "settings" },
            ]}
          />
        </div>
      </section>

      <main style={{ padding: "24px 56px 80px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>
        {/* MAIN COLUMN */}
        <section>
          {/* Branch + view toggle row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <button className="btn ghost sm" style={{ fontFamily: "var(--mono)" }}>
              ↳ main
            </button>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
              1 branch · 0 tags
            </span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 0, border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden", fontFamily: "var(--mono)", fontSize: 11 }}>
              <button style={{ padding: "6px 12px", background: "var(--ink)", color: "var(--paper)", border: "none" }}>your view</button>
              <button style={{ padding: "6px 12px", background: "transparent", color: "var(--ink)", border: "none", borderLeft: "1px solid var(--line)" }}>server view ⇄</button>
            </div>
          </div>

          {/* Latest commit row */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12, background: "var(--paper-2)", fontSize: 13 }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--copper)", color: "#fff", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>r</span>
              <strong>r</strong>
              <span style={{ color: "var(--ink-2)" }}>signed: wire signin flow</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--moss)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Dot color="var(--moss)" /> signature verifies · key 5f9a…d7e6
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>2h ago</span>
            </div>

            {/* File rows */}
            {files.map((f, i) => (
              <FileRow key={i} f={f} last={i === files.length - 1} />
            ))}
          </div>

          {/* "What the server actually sees" reveal */}
          <div style={{ marginTop: 24 }}>
            <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span>↳ what siphr.dev stores for this repo</span>
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              <span style={{ color: "var(--muted-2)" }}>tap to verify with `siphr inspect`</span>
            </div>
            <ServerView
              title="GET /api/repos/r/siphr/objects/47b2d815"
              lines={[
                { k: "oid",        v: "47b2 d815 90a3 6e2c b148 ed05 3a90 7f1a", type: "hex" },
                { k: "type",       v: "blob (encrypted)",                          type: "plain" },
                { k: "size",       v: "2,318 bytes ciphertext",                    type: "plain" },
                { k: "nonce",      v: "e8 42 9c 17 0a b3 d5 51 fb 7e 06 c2",       type: "hex" },
                { k: "wrapped_to", v: "3 collaborator keys",                       type: "plain" },
                { k: "filename",   v: "(redacted — encrypted into the object)",     type: "none" },
                { k: "content",    v: "(redacted — server cannot decrypt)",         type: "none" },
              ]}
            />
          </div>

          {/* README preview */}
          <div className="card" style={{ marginTop: 24, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", background: "var(--paper-2)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>README.md</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--moss)" }}>↳ decrypted client-side · 4ms</span>
            </div>
            <div style={{ padding: "22px 24px", maxHeight: 240, overflow: "hidden", position: "relative" }}>
              <h3 className="serif" style={{ fontSize: 26, marginBottom: 6 }}>Siphr</h3>
              <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 14 }}>Code hosting that can't read your code.</p>
              <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                Siphr is an end-to-end encrypted git forge. Private repos are encrypted with keys that live on
                the user's machine. The server stores ciphertext, public keys, and wrapped repo keys it can't
                unwrap. Not the team, not a subpoena, not us.
              </p>
              <div style={{ position: "absolute", inset: "auto 0 0 0", height: 60, background: "linear-gradient(180deg, transparent, #fffdf7)" }} />
            </div>
          </div>
        </section>

        {/* RIGHT RAIL */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* About */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>about</div>
            <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
              The forge that hosts itself. v0.1 scaffold, working signup + e2ee repo creation.
            </p>
            <div style={{ marginTop: 14, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", lineHeight: 1.85 }}>
              <div>↳ aes-256-gcm</div>
              <div>↳ 3 collaborators can decrypt</div>
              <div>↳ created 21 may 2026</div>
            </div>
          </div>

          {/* Collaborators with sigils */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
              <span>↳ keys that can decrypt</span>
              <a style={{ color: "var(--copper)", fontFamily: "var(--mono)", fontSize: 10 }}>manage →</a>
            </div>
            <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
              <Collab seed="r owner" name="r"      fp="5f9a c218 ab30 d7e6" role="owner" when="2h"  />
              <Collab seed="alice 19"  name="alice" fp="d3aa f681 02bc 4a91" role="maintainer" when="2d" />
              <Collab seed="0xj0e"     name="0xj0e" fp="7d2e 88c5 1f0a b73c" role="contributor" when="1w" last />
            </div>
            <button className="btn ghost sm" style={{ marginTop: 10, width: "100%", justifyContent: "center" }}>
              + invite by public key
            </button>
          </div>

          {/* Storage */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>↳ what the server holds</div>
            <div className="card flat" style={{ padding: "12px 14px" }}>
              <KV k="objects"        v="142" />
              <KV k="ciphertext"     v="284.6 KB" />
              <KV k="wrapped keys"   v="3" />
              <KV k="plaintext server can read" v="0 bytes" tone="rust" last />
            </div>
          </div>

          {/* Audit */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>↳ recent key events</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12, lineHeight: 1.6 }}>
              <AuditEvent when="2h" text={<>commit signed by <code>r</code> · <span style={{ color: "var(--moss)" }}>verified</span></>} />
              <AuditEvent when="2d" text={<><code>alice</code> added · repo key wrapped to her public key</>} />
              <AuditEvent when="1w" text={<>repo key rotated after <code>m. left</code> removed</>} tone="warn" />
              <AuditEvent when="3w" text={<>repo created · 256-bit aes key generated</>} />
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

// ---- helpers
function FileRow({ f, last }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1.3fr 2fr auto auto",
      gap: 14,
      alignItems: "center",
      padding: "10px 14px",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
      fontSize: 13,
    }}>
      <span style={{ color: f.kind === "dir" ? "var(--copper)" : "var(--muted)" }}>
        {f.kind === "dir" ? "📁" : "·"}
      </span>
      <span style={{ fontWeight: f.kind === "dir" ? 500 : 400 }}>{f.name}</span>
      <span style={{ color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.msg}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted-2)", letterSpacing: "0.03em" }}>oid {f.oid}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{f.when}</span>
    </div>
  );
}

function Collab({ seed, name, fp, role, when, last }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap: 12,
      padding: "12px 14px",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
      alignItems: "center",
    }}>
      <FingerprintSigil seed={seed} size={38} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", padding: "1px 6px", border: "1px solid var(--line)", borderRadius: 999 }}>{role}</span>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted-2)", letterSpacing: "0.04em" }}>fp {fp}</div>
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted-2)" }}>{when}</span>
    </div>
  );
}

function KV({ k, v, tone, last }) {
  const color = tone === "rust" ? "var(--rust)" : "var(--ink)";
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "7px 0",
      borderBottom: last ? "none" : "1px dashed var(--line)",
      fontSize: 12,
    }}>
      <span style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>{k}</span>
      <span style={{ fontFamily: "var(--mono)", color }}>{v}</span>
    </div>
  );
}

function AuditEvent({ when, text, tone }) {
  return (
    <li style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, padding: "8px 0", borderBottom: "1px dashed var(--line)" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: tone === "warn" ? "#9a6700" : "var(--muted)", width: 30, paddingTop: 2 }}>{when}</span>
      <span style={{ color: "var(--ink-2)" }}>{text}</span>
    </li>
  );
}

function RepoIconSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="var(--copper)" aria-hidden>
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.69 1.72.75.75 0 1 1-1.05 1.07A2.5 2.5 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.5 2.5 0 0 1 4.5 9h8Z" />
    </svg>
  );
}
function LockGlyph() {
  return <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M4 4a4 4 0 1 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm6.5 2V4a2.5 2.5 0 0 0-5 0v2Z" /></svg>;
}

window.ScreenRepo = ScreenRepo;
