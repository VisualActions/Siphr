import Link from "next/link";
import TopNav from "@/components/TopNav";

export const metadata = {
  title: "Why plain git push is refused on private repos — Siphr",
};

export default function WhyNoPlainPushPage() {
  return (
    <>
      <TopNav active="security" />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 6vw 80px" }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>↳ /docs/why-no-plain-push</div>
        <h1 className="serif" style={{ fontSize: 56, letterSpacing: "-0.025em", lineHeight: 1.02 }}>
          Why the server returns <em style={{ color: "var(--copper)" }}>403</em> to plain git push on private repos.
        </h1>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 18, fontSize: 15, lineHeight: 1.65, color: "var(--ink-2)" }}>
          <p>
            The whole pitch of Siphr is &ldquo;the server can&apos;t read your code.&rdquo; A plain
            <code> git push</code> sends plaintext blobs and commit messages over the wire — the server would
            have to either store them as-is (defeating the pitch) or encrypt them itself (which requires
            holding your repo key, also defeating the pitch).
          </p>

          <p>
            So for private repos, the smart-HTTP endpoint at
            <code> /{`{owner}/{name}`}.git</code> returns:
          </p>

          <pre style={{
            background: "#0f0d0a", color: "#e8d9b8",
            padding: "14px 16px", borderRadius: 6,
            border: "1px solid #2a2520", fontFamily: "var(--mono)",
            fontSize: 13, lineHeight: 1.6,
          }}>{`HTTP/1.1 403 Forbidden
content-type: text/plain
x-siphr-policy: encrypted-only

encrypted-only-endpoint · see /docs/why-no-plain-push`}</pre>

          <h2 className="serif" style={{ fontSize: 28, marginTop: 12, letterSpacing: "-0.015em" }}>
            What you can do today
          </h2>
          <ul style={{ paddingLeft: 22, lineHeight: 1.85 }}>
            <li><strong>In-browser editor</strong> — open the empty repo page and use path 01.</li>
            <li><strong>Drop a folder</strong> — drag from your desktop into path 02.</li>
            <li><strong>Plain git push</strong> works for <em>public</em> repos. They&apos;re plaintext at rest by design — same as any forge.</li>
          </ul>

          <h2 className="serif" style={{ fontSize: 28, marginTop: 12, letterSpacing: "-0.015em" }}>
            What&apos;s coming
          </h2>
          <p>
            A tiny native helper that does the encryption the browser does today, but sitting between
            <code> git</code> and the wire. That ships as part of v0.4&ndash;v0.5 — see <Link href="/roadmap" style={{ color: "var(--copper)" }}>/roadmap</Link>.
            SSH is not planned; private keys live in the browser, not <code>~/.ssh</code>.
          </p>
        </div>
      </main>
    </>
  );
}
