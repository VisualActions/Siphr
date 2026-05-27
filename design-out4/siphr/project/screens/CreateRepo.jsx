// Create a new repo — Siphr flavor. Same shape as the GitHub form the user
// shared, but every option is reframed around the encryption boundary:
// repo-key generation, who can decrypt, which fields are encrypted, etc.

function ScreenCreateRepo({ theme = "light" }) {
  return (
    <div className={`siphr-surface ${theme}`} style={{ width: 1280, minHeight: 1380 }}>
      <TopNav user="r" theme={theme} />

      <main style={{ padding: "44px 80px 80px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Page head */}
        <div style={{ marginBottom: 36 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>↳ /new · create a new repo</div>
          <h1 className="serif" style={{ fontSize: 44, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            New repository.
          </h1>
          <p style={{ marginTop: 12, fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 720 }}>
            Source &amp; history for a project. <em>Private</em> repos are end-to-end encrypted by default — the
            options below decide which keys can decrypt, and how much metadata stays in the clear.&nbsp;
            <span style={{ color: "var(--copper)" }}>Required fields marked *</span>.
          </p>
          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>↳ have a project elsewhere?</span>
            <a style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--copper)" }}>import a repository →</a>
            <a style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--copper)", marginLeft: 10 }}>or convert a local folder →</a>
          </div>
        </div>

        {/* SECTION 1 — General */}
        <Section n="01" title="General" active>
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 14 }}>
            <div>
              <div className="field-label">Owner *</div>
              <div className="select" style={{ marginTop: 8, height: 38, padding: "0 32px 0 10px" }}>
                <FingerprintSigil seed="r owner 5f9a" size={20} />
                <span style={{ fontFamily: "var(--sans)", fontWeight: 500 }}>r</span>
                <span style={{ position: "absolute", right: 10, color: "var(--muted)" }}>▾</span>
              </div>
              <div className="field-hint">your personal namespace</div>
            </div>
            <div>
              <div className="field-label">
                Repository name *
                <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--moss)" }}>✓ ciphertext-kitchen is available</span>
              </div>
              <input className="text-input" style={{ marginTop: 8 }} defaultValue="ciphertext-kitchen" />
              <div className="field-hint">
                great names are short &amp; memorable · suggestion · <span style={{ color: "var(--copper)" }}>recipe-vault</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div className="field-label">Description</div>
            <textarea className="textarea" style={{ marginTop: 8 }} defaultValue="Encrypted recipes for the family server."></textarea>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span className="field-hint">
                ↳ encrypted with the repo key by default · uncheck to keep visible in the repo card
              </span>
              <span className="field-hint">36 / 350 characters</span>
            </div>
          </div>
        </Section>

        {/* SECTION 2 — Encryption (Siphr-specific) */}
        <Section n="02" title="Encryption" subtitle="who can read this repo, and what siphr.dev gets to see">
          <Block>
            <BlockRow
              title="Visibility *"
              hint="public is plaintext at rest (like normal git) · private is end-to-end encrypted"
              right={<Segmented options={["Public · plaintext", "Private · e2ee"]} active={1} />}
            />
            <BlockRow
              title="Repo encryption key"
              hint="we generate a fresh AES-256 key in your browser · or paste one you already trust"
              right={<select className="select" style={{ minWidth: 240 }}><option>generate a new key · recommended</option></select>}
            />
            <BlockRow
              title="Wrap the repo key to"
              hint="every fingerprint listed below will be able to decrypt · add more later from /keys"
              right={<button className="btn ghost sm">+ add by public key</button>}
              children={
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 0 }}>
                  <WrappedKeyRow seed="r owner 5f9a" name="r"     fp="5f9a c218 ab30 d7e6" tag="you · owner" />
                  <WrappedKeyRow seed="alice 19"    name="alice"  fp="d3aa f681 02bc 4a91" tag="maintainer" />
                  <WrappedKeyRow seed="0xj0e"       name="0xj0e"  fp="7d2e 88c5 1f0a b73c" tag="contributor" last />
                </div>
              }
            />
            <BlockRow
              title="Also encrypt these fields"
              hint="extra metadata that leaves siphr.dev in plaintext if you turn it off"
              right={null}
              children={
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <ToggleRow label="commit messages"     on hint="default · subpoena-resistant" />
                  <ToggleRow label="branch names"        on hint="default" />
                  <ToggleRow label="issue + pr bodies"   on hint="default · separate key per thread" />
                  <ToggleRow label="filenames in tree"   on hint="default · plaintext oids only" />
                </div>
              }
            />
            <BlockRow
              title="Key rotation cadence"
              hint="automatic rotation if a collaborator key is revoked · also rotates on this schedule"
              right={<select className="select" style={{ minWidth: 200 }}><option>every 90 days · recommended</option></select>}
              last
            />
          </Block>

          {/* Live preview — "this is what siphr.dev will store" */}
          <div style={{ marginTop: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>↳ preview · what siphr.dev will see for this repo</div>
            <ServerView
              title="POST /api/repos · r/ciphertext-kitchen"
              lines={[
                { k: "owner",        v: "r",                                  type: "plain" },
                { k: "repo oid",     v: "(assigned at creation · public)",     type: "plain" },
                { k: "visibility",   v: "private · e2ee",                      type: "plain" },
                { k: "wrapped keys", v: "3 (you · alice · 0xj0e)",             type: "plain" },
                { k: "rotation",     v: "90d auto + on revocation",            type: "plain" },
                { k: "description",  v: "(redacted · encrypted to repo key)",  type: "none" },
                { k: "files",        v: "(redacted · all blobs ciphertext)",   type: "none" },
                { k: "commits",      v: "(redacted · messages encrypted)",     type: "none" },
              ]}
            />
          </div>
        </Section>

        {/* SECTION 3 — Initialize */}
        <Section n="03" title="Initialize" subtitle="optional scaffolding · all of this will be encrypted">
          <Block>
            <SwitchRow
              title="Add a README"
              hint="a longer description for your project · gets the same encryption as the rest"
              on
            />
            <SwitchRow
              title="Add .gitignore"
              hint=".gitignore tells git what not to track"
              right={<select className="select" style={{ minWidth: 180 }}><option>node · default</option></select>}
            />
            <SwitchRow
              title="Add a license"
              hint="how others can use your code if you ever publish"
              right={<select className="select" style={{ minWidth: 180 }}><option>none</option></select>}
            />
            <SwitchRow
              title="Add an empty SECURITY.md"
              hint="encourages signed reports · references your fingerprint"
              last
            />
          </Block>
        </Section>

        {/* Action bar */}
        <div style={{ marginTop: 36, display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1px solid var(--line)" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
            ↳ pressing create will generate a fresh AES-256 repo key in this browser tab
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn ghost">cancel</button>
            <button className="btn copper">
              Create &amp; generate keys
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- bits -----------------------------------------------------------------
function Section({ n, title, subtitle, active, children }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 18, marginBottom: 32 }}>
      <div className={`step-rail ${active ? "active" : ""}`}>
        <div className="num">{n.replace(/^0/, "")}</div>
        <div className="line" />
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
          <h2 className="serif" style={{ fontSize: 24, letterSpacing: "-0.015em" }}>{title}</h2>
          {subtitle && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>· {subtitle}</span>}
        </div>
        {children}
      </div>
    </section>
  );
}

function Block({ children }) {
  return <div className="card" style={{ overflow: "hidden" }}>{children}</div>;
}

function BlockRow({ title, hint, right, children, last }) {
  return (
    <div style={{ padding: "16px 18px", borderBottom: last ? "none" : "1px solid var(--line-2)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 18, alignItems: "center" }}>
        <div>
          <div className="field-label">{title}</div>
          <div className="field-hint" style={{ marginTop: 2 }}>{hint}</div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function SwitchRow({ title, hint, right, on, last }) {
  return (
    <div style={{ padding: "14px 18px", borderBottom: last ? "none" : "1px solid var(--line-2)", display: "grid", gridTemplateColumns: "1fr auto", gap: 18, alignItems: "center" }}>
      <div>
        <div className="field-label">{title}</div>
        <div className="field-hint" style={{ marginTop: 2 }}>{hint}</div>
      </div>
      {right || <span className={`switch ${on ? "on" : ""}`} />}
    </div>
  );
}

function ToggleRow({ label, hint, on }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--paper-2)", borderRadius: 5 }}>
      <span className={`switch ${on ? "on" : ""}`} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13 }}>{label}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{hint}</div>
      </div>
    </div>
  );
}

function Segmented({ options, active }) {
  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: 5, overflow: "hidden", fontFamily: "var(--mono)", fontSize: 11 }}>
      {options.map((o, i) => (
        <button key={o} style={{
          padding: "8px 14px",
          background: i === active ? "var(--ink)" : "transparent",
          color: i === active ? "var(--paper)" : "var(--ink)",
          border: "none",
          borderLeft: i === 0 ? "none" : "1px solid var(--line)",
        }}>{o}</button>
      ))}
    </div>
  );
}

function WrappedKeyRow({ seed, name, fp, tag, last }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr auto auto",
      gap: 12,
      padding: "10px 12px",
      borderBottom: last ? "none" : "1px solid var(--line-2)",
      alignItems: "center",
      background: "var(--paper-2)",
      borderRadius: 5,
      marginBottom: last ? 0 : 6,
    }}>
      <FingerprintSigil seed={seed} size={28} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>fp {fp}</div>
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", border: "1px solid var(--line)", padding: "2px 7px", borderRadius: 999 }}>{tag}</span>
      <button className="btn ghost xs">remove</button>
    </div>
  );
}

window.ScreenCreateRepo = ScreenCreateRepo;
