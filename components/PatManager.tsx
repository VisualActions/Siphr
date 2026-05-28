"use client";

import { useEffect, useState } from "react";

type PatSummary = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
};

/**
 * Personal Access Token management. Used in /settings for now.
 *
 * On token creation the plaintext is returned once and shown inline; once the
 * user dismisses that panel the plaintext is gone — they can revoke + reissue,
 * but never recover the secret.
 */
export default function PatManager({ user }: { user: string }) {
  const [pats, setPats] = useState<PatSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [expiry, setExpiry] = useState<"never" | "30d" | "90d" | "365d">("90d");
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<{ token: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function refresh() {
    setError(null);
    try {
      const r = await fetch(`/api/pats`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "load failed");
      setPats(j.pats ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
    }
  }

  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      let expiresAt: string | null = null;
      if (expiry !== "never") {
        const days = expiry === "30d" ? 30 : expiry === "90d" ? 90 : 365;
        expiresAt = new Date(Date.now() + days * 86400_000).toISOString();
      }
      const r = await fetch("/api/pats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // username is taken from the session cookie now
        body: JSON.stringify({ name: newName.trim(), expiresAt }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "create failed");
      setJustCreated({ token: j.token, name: j.pat.name });
      setNewName("");
      setExpiry("90d");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this token? Any tool using it will start failing immediately.")) return;
    try {
      const r = await fetch(
        `/api/pats/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "revoke failed");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "revoke failed");
    }
  }

  async function copyToken() {
    if (!justCreated) return;
    await navigator.clipboard.writeText(justCreated.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      {justCreated && (
        <div style={{
          padding: 14,
          background: "color-mix(in oklab, var(--phosphor) 10%, transparent)",
          border: "1px solid var(--phosphor)",
          borderRadius: 2,
          marginBottom: 14,
        }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--phosphor)", marginBottom: 8 }}>
            ↳ new token for &quot;{justCreated.name}&quot; · shown ONCE · copy it now
          </div>
          <div style={{
            display: "flex", gap: 8, alignItems: "stretch",
            fontFamily: "var(--mono)", fontSize: 12.5,
          }}>
            <code style={{
              flex: 1, padding: "8px 10px",
              background: "#050706", color: "var(--phosphor-2)",
              border: "1px solid var(--line)", borderRadius: 2,
              wordBreak: "break-all",
            }}>
              {justCreated.token}
            </code>
            <button type="button" className="btn ghost sm" onClick={copyToken}>
              {copied ? "✓ copied" : "copy"}
            </button>
            <button type="button" className="btn ghost sm" onClick={() => setJustCreated(null)}>
              dismiss
            </button>
          </div>
          <div style={{ marginTop: 10, fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)", lineHeight: 1.6 }}>
            ↳ use with git: <code>git clone https://{user}:&lt;token&gt;@siphr.app/owner/repo.git</code><br />
            once you dismiss this we cannot show it again. revoke + reissue if lost.
          </div>
        </div>
      )}

      <form onSubmit={create} style={{
        display: "grid", gridTemplateColumns: "1fr 160px auto", gap: 8,
        marginBottom: 14,
      }}>
        <input
          className="input"
          type="text"
          placeholder="token name · e.g. laptop, ci"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={64}
        />
        <select
          value={expiry}
          onChange={(e) => setExpiry(e.target.value as "never" | "30d" | "90d" | "365d")}
          style={{
            height: 34, padding: "0 28px 0 10px",
            background: "var(--panel)", border: "1px solid var(--line)",
            borderRadius: 2, fontFamily: "var(--mono)", fontSize: 12,
          }}
        >
          <option value="30d">expires 30d</option>
          <option value="90d">expires 90d · default</option>
          <option value="365d">expires 365d</option>
          <option value="never">never expires</option>
        </select>
        <button
          type="submit"
          className="btn primary"
          disabled={creating || !newName.trim()}
          style={{ opacity: creating || !newName.trim() ? 0.55 : 1 }}
        >
          {creating ? "issuing…" : "issue token"}
        </button>
      </form>

      {error && (
        <div style={{
          padding: "8px 10px", borderRadius: 2,
          background: "color-mix(in oklab, var(--signal) 12%, transparent)",
          color: "var(--signal)", fontFamily: "var(--mono)", fontSize: 12,
          marginBottom: 10,
        }}>{error}</div>
      )}

      {pats === null ? (
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>loading…</div>
      ) : pats.length === 0 ? (
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
          ↳ no tokens yet · issue one above to push/pull with HTTPS
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {pats.map((p) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 16, alignItems: "center",
                padding: "10px 12px",
                background: "var(--paper-2)",
                border: "1px solid var(--line-2)", borderRadius: 2,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)",
                  display: "flex", gap: 12, marginTop: 2,
                }}>
                  <span>{p.prefix}…</span>
                  <span>created {new Date(p.createdAt).toLocaleDateString()}</span>
                  <span>
                    {p.lastUsedAt
                      ? `last used ${new Date(p.lastUsedAt).toLocaleDateString()}`
                      : "never used"}
                  </span>
                  {p.expiresAt && (
                    <span>
                      expires {new Date(p.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <span className="pill">{p.scopes.join(", ")}</span>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => revoke(p.id)}
                style={{ color: "var(--signal)", borderColor: "rgba(255, 85, 68, 0.35)" }}
              >
                revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
