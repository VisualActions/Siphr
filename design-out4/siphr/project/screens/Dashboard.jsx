// Dashboard — homepage when signed in. Shows session-aware key status,
// repos with their sigils, and an "encrypted activity feed" that emphasizes
// that the server can't see the contents — only the events.

function ScreenDashboard({ theme = "dark" }) {
  const repos = [
    { name: "siphr",       seed: "r/siphr 5f9a",      vis: "private", ciphertext: "284.6 KB", commits: 142, collab: 3, when: "2h"  },
    { name: "harness",     seed: "r/harness c218",    vis: "private", ciphertext: "1.2 MB",   commits: 412, collab: 2, when: "1d"  },
    { name: "notes",       seed: "r/notes ab30",      vis: "private", ciphertext: "44.1 KB",  commits: 89,  collab: 1, when: "5d"  },
    { name: "siphr-docs",  seed: "r/docs d7e6",       vis: "public",  ciphertext: "12.0 KB",  commits: 18,  collab: 4, when: "1w"  },
  ];

  return (
    <div className={`siphr-surface ${theme}`} style={{ width: 1280, minHeight: 900 }}>
      <TopNav user="r" theme={theme} />

      <main style={{ padding: "32px 56px 64px", display: "grid", gridTemplateColumns: "300px 1fr", gap: 32 }}>
        {/* SIDEBAR */}
        <aside>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <FingerprintSigil seed="r@siphr 5f9a c218 ab30 d7e6 8b41" size={48} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>r</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>5f9a c218 ab30 d7e6</div>
            </div>
          </div>

          {/* Key status card */}
          <div className="card flat" style={{ padding: "14px 14px", background: "var(--paper-2)", marginBottom: 22 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
              ↳ key state · this session
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Dot color="var(--moss)" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>unlocked</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>14m ago</span>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>auto-locks in 46m of idle</div>
            <button className="btn ghost xs" style={{ marginTop: 10, width: "100%", justifyContent: "center" }}>
              re-lock now
            </button>
          </div>

          {/* Repo list */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div className="eyebrow">↳ your repos · 4</div>
            <button className="btn xs" style={{ height: 22 }}>+ new</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {repos.map((r) => (
              <a key={r.name} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 5, background: r.name === "siphr" ? "var(--paper-3)" : "transparent" }}>
                <FingerprintSigil seed={r.seed} size={20} />
                <span style={{ fontSize: 13, fontWeight: r.name === "siphr" ? 500 : 400 }}>{r.name}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: r.vis === "private" ? "#9a6700" : "var(--moss)" }}>
                  {r.vis === "private" ? "e2ee" : "public"}
                </span>
              </a>
            ))}
          </div>

          <div className="hr" style={{ margin: "22px 0" }} />

          <div className="eyebrow" style={{ marginBottom: 10 }}>↳ keys you trust · 7</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {["alice","0xj0e","tess","sam","wren","kit","mira"].map((n) => (
              <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <FingerprintSigil seed={`trusted ${n}`} size={26} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)" }}>{n}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <section>
          {/* Welcome strip */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center", background: "#fffdf7" }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>↳ session · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
                <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.015em", lineHeight: 1.1 }}>
                  Welcome back, <em style={{ color: "var(--copper)" }}>r.</em>
                </h1>
                <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)", maxWidth: 480 }}>
                  Your private key is loaded in this browser. 3 repos are decryptable from this session — the
                  rest are sitting as ciphertext.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                <span>↳ device · macbook pro 16"</span>
                <span>↳ key in memory only · never on disk plaintext</span>
                <span style={{ color: "var(--moss)" }}>✓ no server-side session</span>
              </div>
            </div>
            <div style={{ padding: "0 26px 18px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, borderTop: "1px solid var(--line)", paddingTop: 18, marginTop: 0 }}>
              <Metric label="commits this week" value="34" sub="across 3 repos" />
              <Metric label="pushed ciphertext" value="612 KB" sub="server cannot read" tone="moss" />
              <Metric label="key rotations" value="2" sub="after m. left" />
              <Metric label="open prs awaiting you" value="2" sub="encrypted diffs" />
            </div>
          </div>

          {/* Repos grid */}
          <div className="eyebrow" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span>↳ your repos</span>
            <a style={{ color: "var(--copper)", fontSize: 10 }}>see all →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 30 }}>
            {repos.slice(0, 4).map((r) => (
              <RepoCard key={r.name} repo={r} />
            ))}
          </div>

          {/* Encrypted activity feed */}
          <div className="eyebrow" style={{ marginBottom: 12 }}>↳ encrypted activity · only events you have keys for</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <FeedRow
              who="alice" whoSigil="alice 19"
              event={<>pushed <span style={{ color: "var(--copper)" }}>3 commits</span> to <code>r/siphr</code> · main</>}
              when="14 min ago"
              tail="↳ decrypted locally · 12ms · no server-side rendering"
            />
            <FeedRow
              who="0xj0e" whoSigil="0xj0e"
              event={<>opened pr <code>#27</code> · "harness: replace base32 with base58"</>}
              when="2 h ago"
              tail="↳ pr description encrypted to 3 keys · including yours"
            />
            <FeedRow
              who="r" whoSigil="r owner"
              event={<>rotated the repo key for <code>r/siphr</code> after removing <code>m. left</code></>}
              when="2 d ago"
              tail="↳ re-wrapped 142 objects · ~280 KB ciphertext re-uploaded"
              tone="warn"
            />
            <FeedRow
              who="tess" whoSigil="tess"
              event={<>verified your public-key fingerprint over signal</>}
              when="3 d ago"
              tail="↳ adds tess to your trusted-keys table · prevents key-substitution"
              last
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, sub, tone }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      <div className="serif" style={{ fontSize: 32, lineHeight: 1, color: tone === "moss" ? "var(--moss)" : "var(--ink)" }}>{value}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function RepoCard({ repo }) {
  return (
    <div className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <FingerprintSigil seed={repo.seed} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>r/{repo.name}</span>
            <Pill variant={repo.vis === "private" ? "encrypted" : "public"}>{repo.vis === "private" ? "e2ee" : "public"}</Pill>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
            ↳ updated {repo.when} · {repo.collab} {repo.collab === 1 ? "key" : "keys"}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "10px 12px", background: "var(--paper-2)", borderRadius: 5, fontFamily: "var(--mono)", fontSize: 11 }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>commits</div>
          <div style={{ marginTop: 2 }}>{repo.commits}</div>
        </div>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>{repo.vis === "private" ? "ciphertext" : "plaintext"}</div>
          <div style={{ marginTop: 2 }}>{repo.ciphertext}</div>
        </div>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>server sees</div>
          <div style={{ marginTop: 2, color: repo.vis === "private" ? "var(--rust)" : "var(--moss)" }}>
            {repo.vis === "private" ? "0 plain" : "all (intent)"}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedRow({ who, whoSigil, event, when, tail, tone, last }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "start", padding: "16px 20px", borderBottom: last ? "none" : "1px solid var(--line-2)" }}>
      <FingerprintSigil seed={whoSigil} size={28} />
      <div>
        <div style={{ fontSize: 13 }}>
          <strong>{who}</strong> <span style={{ color: "var(--ink-2)" }}>{event}</span>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: tone === "warn" ? "#9a6700" : "var(--muted)", marginTop: 4 }}>{tail}</div>
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{when}</span>
    </div>
  );
}

window.ScreenDashboard = ScreenDashboard;
