import Link from "next/link";
import TopNav from "@/components/TopNav";

export default function HomePage() {
  return (
    <>
      <TopNav />
      <main>
        <section
          className="border-b"
          style={{
            background:
              "linear-gradient(180deg, #f6f8fa 0%, #ffffff 100%)",
          }}
        >
          <div className="mx-auto max-w-[1012px] px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1]">
                Code hosting that <span style={{ color: "#1f883d" }}>can't read your code.</span>
              </h1>
              <p className="mt-6 text-lg text-[color:var(--color-fg-muted)] max-w-xl">
                Siphr is GitHub for people who actually want privacy. Public
                repos work like any other forge. Private repos are
                end-to-end encrypted with keys that live on your machine —
                we only ever hold ciphertext.
              </p>
              <form
                action="/signup"
                className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md"
              >
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  className="input"
                  style={{ height: 40 }}
                />
                <Link href="/signup" className="btn btn-primary" style={{ height: 40 }}>
                  Sign up for Siphr
                </Link>
              </form>
              <div className="mt-6 flex items-center gap-4 text-sm text-[color:var(--color-fg-muted)]">
                <span className="flex items-center gap-1.5">
                  <CheckIcon /> Free for personal use
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckIcon /> Open source
                </span>
              </div>
            </div>

            <div className="hidden md:block">
              <CodeMockup />
            </div>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto max-w-[1012px] px-4 py-16">
            <h2 className="text-3xl font-semibold mb-2">How it's different from GitHub</h2>
            <p className="text-[color:var(--color-fg-muted)] mb-10">
              Same workflow. Different threat model. Your code isn't readable by us — by design, not by policy.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Feature
                icon={<LockIcon />}
                title="Per-repo encryption keys"
                body="Every repo gets its own 256-bit AES key. The key is wrapped to each collaborator's public key. We never hold a master key."
              />
              <Feature
                icon={<KeyIcon />}
                title="Keys live with you"
                body="Generated in your browser at signup. Passphrase-wrapped locally. We see your public key, never your private one."
              />
              <Feature
                icon={<ShieldIcon />}
                title="Zero data collection"
                body="No analytics, no tracking, no training on your code. The privacy policy is what the code does."
              />
            </div>
          </div>
        </section>

        <section className="border-b" style={{ background: "var(--color-canvas-subtle)" }}>
          <div className="mx-auto max-w-[1012px] px-4 py-16">
            <h2 className="text-3xl font-semibold mb-8">What you can do</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ["Host private repositories", "All the GitHub workflow — clone, branch, PR — over ciphertext."],
                ["Add and remove collaborators", "Wrap the repo key to their key. Remove = rotate."],
                ["Browse files in the web UI", "Decrypted in your browser, never on our server."],
                ["Open issues and pull requests", "Encrypted at rest. Diffs computed client-side."],
                ["Publish a public repo", "Stored as plaintext like any forge. Same workflow, none of the surveillance."],
                ["Audit the source", "Open source. The privacy claim is verifiable."],
              ].map(([t, b]) => (
                <div
                  key={t}
                  className="flex gap-3 items-start p-4 rounded-md"
                  style={{ background: "#fff", border: "1px solid var(--color-border-muted)" }}
                >
                  <div className="mt-0.5" style={{ color: "#1f883d" }}><CheckCircle /></div>
                  <div>
                    <div className="font-semibold">{t}</div>
                    <div className="text-sm text-[color:var(--color-fg-muted)]">{b}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-[1012px] px-4 py-20 text-center">
            <h2 className="text-3xl font-semibold mb-4">Built for people who shouldn't have to trust their host</h2>
            <p className="text-[color:var(--color-fg-muted)] mb-8 max-w-xl mx-auto">
              Whether you're working on a passion project, a startup, or something nobody else needs to see — Siphr makes "private" mean private.
            </p>
            <Link href="/signup" className="btn btn-primary" style={{ height: 40, padding: "0 24px" }}>
              Get started for free
            </Link>
          </div>
        </section>

        <footer className="border-t" style={{ background: "var(--color-canvas-subtle)" }}>
          <div className="mx-auto max-w-[1012px] px-4 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-[color:var(--color-fg-muted)]">
            <div>© 2026 Siphr · Open source</div>
            <div className="flex gap-6 mt-3 md:mt-0">
              <Link href="/security">How it works</Link>
              <Link href="/explore">Explore</Link>
              <a href="https://github.com/creedmanvr/Siphr" target="_blank" rel="noreferrer">Source</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="p-5 rounded-md" style={{ border: "1px solid var(--color-border-muted)" }}>
      <div className="mb-3" style={{ color: "#1f883d" }}>{icon}</div>
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-sm text-[color:var(--color-fg-muted)] leading-relaxed">{body}</div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="#1f883d" aria-hidden>
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}
function CheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.75.75 0 0 0-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4.5-4.5Z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 4a4 4 0 1 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm6.5 2V4a2.5 2.5 0 0 0-5 0v2Z" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M10.5 0a5.5 5.5 0 0 0-5.39 6.6L.22 11.49a.75.75 0 0 0-.22.53V15c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-1h1c.55 0 1-.45 1-1v-1h1c.2 0 .39-.08.53-.22L9.4 10.39A5.5 5.5 0 1 0 10.5 0Zm1.5 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M7.46.71a.75.75 0 0 1 1.08 0l5.25 5.5c.13.14.21.33.21.52v1.6c0 4.18-2.97 7.79-7.04 8.65a.75.75 0 0 1-.42 0C2.47 16.12-.5 12.5-.5 8.33V6.73c0-.19.07-.38.21-.52L7.46.71Z" />
    </svg>
  );
}
function CodeMockup() {
  return (
    <div className="rounded-md overflow-hidden" style={{ boxShadow: "0 12px 28px rgba(140,149,159,0.25)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: "#f6f8fa", borderBottom: "1px solid var(--color-border)" }}>
        <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        <span className="ml-3 text-xs font-mono text-[color:var(--color-fg-muted)]">siphr / your-private-repo</span>
      </div>
      <div className="p-4 text-xs font-mono" style={{ background: "#fff" }}>
        <div className="text-[color:var(--color-fg-muted)]">$ git push siphr main</div>
        <div className="mt-2">Encrypting objects: <span style={{ color: "#1f883d" }}>100%</span> (32/32)</div>
        <div>Wrapping repo key for 1 collaborator...</div>
        <div>Uploading ciphertext to siphr.dev...</div>
        <div className="mt-2" style={{ color: "#1f883d" }}>✓ pushed 32 encrypted objects (20.0 KB)</div>
        <div className="mt-3 text-[color:var(--color-fg-muted)]">
          Server stored: <span className="text-[color:var(--color-fg)]">opaque ciphertext</span>
        </div>
        <div className="text-[color:var(--color-fg-muted)]">
          Server can read: <span style={{ color: "#cf222e" }}>nothing</span>
        </div>
      </div>
    </div>
  );
}
