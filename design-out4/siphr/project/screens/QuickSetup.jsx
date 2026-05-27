// Quick Setup — browser-first reality. No SSH (not planned). No `siphr` CLI
// (also not planned by the team). Three real paths today:
//   1. Create / upload files in the browser — encryption happens before upload
//   2. Drop a local folder onto the page — same browser-side encrypt → push
//   3. Use plain `git push` to siphr.dev — but only for PUBLIC repos
// A fourth path (native helper for private repos) is marked PLANNED so the
// reader doesn't think it works today.

function ScreenQuickSetup({ theme = "light" }) {
  return (
    <div className={`siphr-surface ${theme}`} style={{ width: 1280, minHeight: 1480 }}>
      <TopNav user="r" theme={theme} />

      {/* Empty-repo header ---------------------------------------------- */}
      <section style={{ padding: "20px 56px 0", borderBottom: "1px solid var(--line)", background: "var(--paper-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <FingerprintSigil seed="r ciphertext-kitchen new" size={22} />
          <span style={{ fontSize: 18 }}>r</span>
          <span style={{ color: "var(--muted-2)", fontSize: 18 }}>/</span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>ciphertext-kitchen</span>
          <Pill variant="encrypted">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><LockGlyphSm /> private · e2ee</span>
          </Pill>
          <Pill>↳ created just now</Pill>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="btn ghost sm">↑ Watch</button>
            <button className="btn ghost sm">⌥ Fork</button>
            <button className="btn sm">⌃ Clone url</button>
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <Tabs
            active="code"
            items={[
              { key: "code", label: "code", dot: true },
              { key: "issues", label: "issues", count: 0 },
              { key: "pulls", label: "pull requests", count: 0 },
              { key: "keys", label: "keys", count: 1 },
              { key: "audit", label: "audit log" },
              { key: "settings", label: "settings" },
            ]}
          />
        </div>
      </section>

      <main style={{ padding: "32px 56px 80px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>
        {/* MAIN COLUMN */}
        <section>
          {/* Welcome */}
          <div className="card" style={{ padding: "22px 24px", marginBottom: 22, borderLeft: "3px solid var(--copper)" }}>
            <div className="eyebrow" style={{ marginBottom: 6, color: "var(--copper)" }}>↳ your repo is ready · repo key generated locally</div>
            <h2 className="serif" style={{ fontSize: 30, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Quick setup.
            </h2>
            <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 740 }}>
              An AES-256 key for this repo lives only in this browser tab. It's wrapped to your public key
              fingerprint <code style={{ fontFamily: "var(--mono)", color: "var(--copper)" }}>5f9a c218 ab30 d7e6</code>.
              For private repos, encryption has to happen in a client that holds the key — which today means
              <strong> this browser</strong>.
            </p>
            <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--paper-2)", borderRadius: 5, fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-2)" }}>
              ↳ clone URL · <span style={{ color: "var(--copper)" }}>https://siphr.dev/r/r/ciphertext-kitchen.git</span>
              <button className="btn ghost xs" style={{ marginLeft: 14, verticalAlign: "middle" }}>⎘ copy</button>
              <span style={{ marginLeft: 12, color: "var(--muted)" }}>· https only · no ssh</span>
            </div>
          </div>

          {/* PATH 1 — in browser */}
          <PathBlock
            n="01"
            title="Add files in the browser"
            sub="encryption happens on this tab · zero plaintext leaves your machine"
            badge={{ text: "available now", tone: "moss" }}
          >
            <BrowserPath
              steps={[
                { icon: "+", label: "Create a new file",         hint: "open the in-page editor · everything you type stays in this tab until you commit" },
                { icon: "↑", label: "Upload files",              hint: "drag a folder anywhere on the page · or pick from your filesystem" },
                { icon: "✎", label: "Edit existing files inline", hint: "available once you have at least one commit" },
                { icon: "⌥", label: "Commit (with a message)",    hint: "the message itself is encrypted with the repo key before upload" },
              ]}
            />
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button className="btn copper sm">+ Create your first file</button>
              <button className="btn ghost sm">↑ Upload a folder</button>
            </div>
          </PathBlock>

          {/* PATH 2 — drop a local folder */}
          <PathBlock
            n="02"
            title="Drop a local folder onto this page"
            sub="works for an existing project · we scan it, encrypt each file, then push as a single first commit"
            badge={{ text: "available now", tone: "moss" }}
          >
            <DropZone />
            <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7 }}>
              <li>· every file is encrypted in this tab with the repo key before the first byte leaves</li>
              <li>· dotfiles (.git, .env, .DS_Store, node_modules/) are skipped by default — preview before commit</li>
              <li>· no history rewrite · this counts as a fresh first commit · push existing history is path 04</li>
            </ul>
          </PathBlock>

          {/* PATH 3 — plain git push, PUBLIC ONLY */}
          <PathBlock
            n="03"
            title="…or push from the terminal — public repos only"
            sub="plain `git push` over HTTPS works · but it sends plaintext, so this path is disabled for private repos"
            badge={{ text: "available now · public repos", tone: "amber" }}
          >
            <Term lines={[
              { cmd: "git", args: ["remote", "add", "origin", "https://siphr.dev/r/r/ciphertext-kitchen.git"] },
              { cmd: "git", args: ["branch", { flag: "-M" }, "main"] },
              { cmd: "git", args: ["push", { flag: "-u" }, "origin", "main"], annot: "← plaintext push · siphr.dev refuses this for private repos" },
            ]} />
            <Caveat>
              <strong>This repo is private (e2ee), so plain <code>git push</code> will be rejected</strong> at
              the server with <code>403 — encrypted-only-endpoint</code>. The server has no way to encrypt the
              pack for you without your key, and we won't accept plaintext at rest.
              Use path 01, 02, or — when ready — 04.
            </Caveat>
          </PathBlock>

          {/* PATH 4 — native helper, PLANNED */}
          <PathBlock
            n="04"
            title="Push from the terminal for private repos"
            sub="a small native helper that does the encryption that the browser does today · planned"
            badge={{ text: "planned · v0.4 — v0.5", tone: "copper" }}
          >
            <Term lines={[
              { comment: "future · siphr-helper signs each pack with your wrapped key" },
              { cmd: "git", args: ["push", "origin", "main"], annot: "← interceptor encrypts before the network layer" },
            ]} />
            <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--paper-2)", borderRadius: 5, fontSize: 13, color: "var(--ink-2)" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--copper)", marginRight: 10 }}>roadmap</span>
              SSH is <em>not</em> planned — keys live in the browser, not <code>~/.ssh</code>. The terminal
              experience we'd ship is a tiny encryption helper, not a new transport. See the
              <a style={{ color: "var(--copper)", marginLeft: 4 }}>roadmap →</a>
            </div>
          </PathBlock>

          {/* Pro tip */}
          <div className="card" style={{ marginTop: 22, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, background: "var(--paper-2)" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--copper)", letterSpacing: "0.1em", textTransform: "uppercase" }}>↳ pro tip</span>
            <span style={{ fontSize: 13, color: "var(--ink-2)" }}>
              Until path 04 ships, the recommended flow for private repos is the in-browser editor (path 01) or
              the drag-and-drop folder (path 02). Both are real today and produce real encrypted commits.
            </span>
          </div>
        </section>

        {/* RIGHT RAIL */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* keys */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>↳ keys for this repo · 1</div>
            <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
              <CollabMini seed="r owner 5f9a" name="r" fp="5f9a c218 ab30 d7e6" role="owner" last />
            </div>
            <button className="btn ghost sm" style={{ marginTop: 10, width: "100%", justifyContent: "center" }}>
              + invite by public key
            </button>
            <div className="field-hint" style={{ marginTop: 8 }}>
              ↳ collaborator key-wrapping ships in v0.5 — invites are queued until then
            </div>
          </div>

          {/* What works today */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>↳ today, in this tab</div>
            <div className="card flat" style={{ padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 11.5, lineHeight: 1.9 }}>
              <Capability k="repo key wrap"        v="works" tone="moss" />
              <Capability k="encrypt files"        v="works" tone="moss" />
              <Capability k="commit in browser"    v="works" tone="moss" />
              <Capability k="decrypt + browse"     v="works" tone="moss" />
              <Capability k="plain git push"       v="public only" tone="amber" />
              <Capability k="multi-collaborator"   v="v0.5" tone="muted" />
              <Capability k="native helper"        v="v0.4 — v0.5" tone="muted" />
              <Capability k="ssh"                   v="not planned" tone="rust" last />
            </div>
          </div>

          {/* What the server has so far */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>↳ what siphr.dev holds · so far</div>
            <div className="card flat" style={{ padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 11.5, lineHeight: 1.85 }}>
              <KVMini k="objects"      v="0" />
              <KVMini k="ciphertext"   v="0 bytes" />
              <KVMini k="wrapped keys" v="1 fingerprint" />
              <KVMini k="repo oid"     v="(public) 0x9a4f c2b8" />
              <KVMini k="server can read" v="0 bytes" tone="rust" last />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

// ---- bits ---------------------------------------------------------------
function PathBlock({ n, title, sub, badge, children }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--copper)", letterSpacing: "0.08em" }}>{n}</span>
        <h3 className="serif" style={{ fontSize: 22, letterSpacing: "-0.015em" }}>{title}</h3>
        {badge && <PathBadge {...badge} />}
      </div>
      <p className="field-hint" style={{ marginBottom: 12 }}>{sub}</p>
      {children}
    </div>
  );
}

function PathBadge({ text, tone }) {
  const map = {
    moss:   { bg: "var(--moss-bg)",   fg: "var(--moss)" },
    amber:  { bg: "var(--amber-bg)",  fg: "#7a5a16" },
    copper: { bg: "var(--copper-bg)", fg: "var(--copper)" },
    rust:   { bg: "#f4d9d4",          fg: "var(--rust)" },
  }[tone] || { bg: "var(--paper-2)", fg: "var(--muted)" };
  return (
    <span style={{
      fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 3,
      background: map.bg, color: map.fg,
    }}>{text}</span>
  );
}

function BrowserPath({ steps }) {
  return (
    <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 14,
          alignItems: "center", padding: "14px 18px",
          borderBottom: i === steps.length - 1 ? "none" : "1px solid var(--line-2)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 5,
            background: "var(--copper-bg)", color: "var(--copper)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600,
          }}>{s.icon}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.hint}</div>
          </div>
          <button className="btn ghost xs">go →</button>
        </div>
      ))}
    </div>
  );
}

function DropZone() {
  return (
    <div style={{
      border: "2px dashed var(--line)",
      borderRadius: 6,
      padding: "28px 24px",
      display: "flex",
      alignItems: "center",
      gap: 20,
      background: "var(--paper-2)",
    }}>
      <div style={{ width: 56, height: 56, borderRadius: 6, background: "var(--copper-bg)", color: "var(--copper)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 28 }}>↓</div>
      <div>
        <div className="serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>Drop a folder anywhere.</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
          ↳ chrome / firefox / safari · file system access api · everything stays in this tab
        </div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button className="btn ghost sm">Pick a folder</button>
        <button className="btn sm">Try with a sample</button>
      </div>
    </div>
  );
}

function Term({ lines }) {
  return (
    <div className="term">
      <button className="copy-btn">⎘ copy</button>
      {lines.map((l, i) => {
        if (l.comment) return <div key={i} className="comment"># {l.comment}</div>;
        return (
          <div key={i}>
            <span className="prompt">$</span>
            <span className="cmd">{l.cmd}</span>
            {l.args && l.args.map((a, j) => (
              <span key={j}>{" "}{
                typeof a === "string" ? <span style={{ color: "#e8d9b8" }}>{a}</span> :
                a.flag ? <span className="flag">{a.flag}</span> :
                a.str ? <span className="str">{a.str}</span> : null
              }</span>
            ))}
            {l.annot && <span style={{ marginLeft: 14 }} className="comment annot">{l.annot}</span>}
          </div>
        );
      })}
    </div>
  );
}

function Caveat({ children, tone }) {
  const bg = tone === "warn" ? "var(--amber-bg)" : "var(--copper-bg)";
  const fg = tone === "warn" ? "#7a5a16" : "#5c2a17";
  return (
    <div style={{ marginTop: 12, padding: "10px 14px", background: bg, borderRadius: 5, fontSize: 12.5, color: fg, lineHeight: 1.55 }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginRight: 8, fontWeight: 600 }}>
        ! heads up
      </span>
      {children}
    </div>
  );
}

function CollabMini({ seed, name, fp, role, last }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10,
      padding: "10px 12px", alignItems: "center",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
    }}>
      <FingerprintSigil seed={seed} size={26} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{name}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{fp}</div>
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", border: "1px solid var(--line)", padding: "1px 6px", borderRadius: 999 }}>{role}</span>
    </div>
  );
}

function Capability({ k, v, tone, last }) {
  const color = {
    moss: "var(--moss)",
    amber: "#9a6700",
    rust: "var(--rust)",
    muted: "var(--muted)",
  }[tone] || "var(--ink)";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "4px 0",
      borderBottom: last ? "none" : "1px dashed var(--line)",
    }}>
      <span style={{ color: "var(--muted)" }}>{k}</span>
      <span style={{ color }}>{v}</span>
    </div>
  );
}

function KVMini({ k, v, tone, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "5px 0",
      borderBottom: last ? "none" : "1px dashed var(--line)",
    }}>
      <span style={{ color: "var(--muted)" }}>{k}</span>
      <span style={{ color: tone === "rust" ? "var(--rust)" : "var(--ink)" }}>{v}</span>
    </div>
  );
}

function LockGlyphSm() {
  return <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M4 4a4 4 0 1 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm6.5 2V4a2.5 2.5 0 0 0-5 0v2Z" /></svg>;
}

window.ScreenQuickSetup = ScreenQuickSetup;
