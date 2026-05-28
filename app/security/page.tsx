import TopNav from "@/components/TopNav";
import Link from "next/link";

export const metadata = {
  title: "Threat model — Siphr",
};

export default function SecurityPage() {
  return (
    <>
      <TopNav active="security" />
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "64px 6vw 80px" }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>↳ how siphr works</div>
        <h1 className="serif" style={{ fontSize: 64, letterSpacing: "-0.025em", lineHeight: 1.02 }}>
          The threat model, <em style={{ color: "var(--copper)" }}>in plain English.</em>
        </h1>
        <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)" }}>
          The whole pitch rests on one rule: every key that can decrypt your code lives on your machine. The
          server has public keys, ciphertext, and wrapped keys it can&apos;t unwrap.
        </p>

        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 32 }}>
          <Section title="Two storage modes">
            <p>
              <strong>Public repos</strong> are stored as plaintext — same as any other forge. Anyone can clone or
              browse them. We don&apos;t track who reads what.
            </p>
            <p>
              <strong>Private repos</strong> are end-to-end encrypted. The server holds ciphertext objects +
              per-collaborator wrapped keys it can&apos;t unwrap. Everything below applies to private repos.
            </p>
          </Section>

          <Section title="Identity">
            <p>
              When you sign up, your browser generates a P-256 ECDH keypair. The public key is uploaded to Siphr.
              The private key is encrypted with a key derived from your passphrase (PBKDF2-SHA256, 600,000 iterations)
              using AES-GCM and stored in your browser. We never see the passphrase or the unwrapped private key.
            </p>
          </Section>

          <Section title="Repository keys">
            <p>
              Every repo has its own random 256-bit symmetric key (the &ldquo;repo key&rdquo;). For each collaborator
              the repo key is wrapped via ECDH with their public key plus an ephemeral keypair, producing a
              self-contained blob the server stores but can&apos;t open.
            </p>
            <p>
              Adding a collaborator means wrapping the repo key for their public key. Removing one means rotating
              the key and re-encrypting changed objects forward.
            </p>
          </Section>

          <Section title="Git objects">
            <p>
              Blobs, trees, and commits are encrypted with the repo key using AES-256-GCM (fresh nonce per object)
              before they leave your machine. The server sees object IDs and ciphertext. It doesn&apos;t see
              filenames, file contents, commit messages, or author info inside the encrypted commit object.
            </p>
          </Section>

          <Section title="Merges, diffs, code search">
            <p>
              All happen client-side. Your browser pulls down the ciphertext it needs, decrypts with the repo key
              it already holds, runs the operation, encrypts the result, and pushes it back. The server is a dumb
              store.
            </p>
          </Section>

          <Section title="Verified accounts">
            <p>
              Usernames are ASCII-only <code>A-Z a-z 0-9 _ -</code> so Unicode lookalike attacks (Cyrillic
              {" "}<code>а</code> in <code>microsoft</code>) can&apos;t even get registered.
            </p>
            <p>
              On top of that, well-known orgs and individuals get a verified badge. The badge means Siphr confirmed
              out-of-band that the holder of this account is who they claim. Before adding someone as a collaborator
              on a private repo, also verify their <strong>public key fingerprint</strong> on their profile
              out-of-band — that&apos;s the actual key the repo key gets wrapped to.
            </p>
          </Section>

          <Section title="The honest tradeoff" id="recovery">
            <p>
              If you lose your passphrase, your private repos are gone. We can&apos;t recover them — that&apos;s
              the same property that means we can&apos;t hand them over either. We&apos;d rather build a real
              recovery flow than a backdoor.
            </p>
          </Section>

          <Section title="Contact" id="contact">
            <p>
              These are the only mailboxes that speak for Siphr. Anything that claims to be Siphr from a
              different domain is not us.
            </p>
            <ul style={{
              listStyle: "none", padding: 0, margin: 0,
              display: "flex", flexDirection: "column", gap: 10,
              fontFamily: "var(--mono)", fontSize: 13,
            }}>
              <ContactRow
                addr="support@siphr.dev"
                purpose="general questions, bug reports, account help"
              />
              <ContactRow
                addr="editorial@siphr.dev"
                purpose="propose your project for /featured · curated weekly"
              />
              <ContactRow
                addr="newsletters@siphr.dev"
                purpose="subscribe to transparency-log + release-note digests"
              />
              <ContactRow
                addr="noreply@siphr.dev"
                purpose="automated mail from us only · do not reply"
                noLink
              />
            </ul>
          </Section>
        </div>

        <div
          style={{
            marginTop: 36, padding: "16px 18px", borderRadius: 6,
            background: "var(--paper-2)", border: "1px solid var(--line)",
            fontSize: 13, color: "var(--ink-2)",
          }}
        >
          ↳ source code: <a href="https://github.com/VisualActions/Siphr" target="_blank" rel="noreferrer" style={{ color: "var(--copper)" }}>github.com/VisualActions/Siphr</a> · <Link href="/transparency" style={{ color: "var(--copper)" }}>verify the claims</Link>
        </div>
      </main>
    </>
  );
}

function ContactRow({
  addr, purpose, noLink,
}: { addr: string; purpose: string; noLink?: boolean }) {
  return (
    <li style={{
      display: "grid", gridTemplateColumns: "minmax(0, 220px) 1fr",
      gap: 14, alignItems: "baseline",
    }}>
      {noLink ? (
        <span style={{ color: "var(--muted)" }}>{addr}</span>
      ) : (
        <a
          href={`mailto:${addr}`}
          style={{ color: "var(--phosphor)" }}
        >{addr}</a>
      )}
      <span style={{ color: "var(--ink-2)", fontFamily: "var(--sans)" }}>
        {purpose}
      </span>
    </li>
  );
}

function Section({
  title, id, children,
}: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id}>
      <h2 className="serif" style={{ fontSize: 28, marginBottom: 12, letterSpacing: "-0.015em" }}>{title}</h2>
      <div style={{
        color: "var(--ink-2)", lineHeight: 1.65, fontSize: 14,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {children}
      </div>
    </section>
  );
}
