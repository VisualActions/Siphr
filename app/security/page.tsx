import TopNav from "@/components/TopNav";

export default function SecurityPage() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-[768px] px-4 py-12 space-y-10">
        <header className="border-b pb-6">
          <h1 className="text-3xl font-semibold">How Siphr works</h1>
          <p className="mt-2 text-[color:var(--color-fg-muted)]">
            The whole pitch rests on one rule: every key that can decrypt your code lives on your machine. The server has public keys, ciphertext, and wrapped keys it can't unwrap.
          </p>
        </header>

        <Section title="Two storage modes">
          <p>
            <strong>Public repos</strong> are stored as plaintext — same as any other forge. Anyone can clone or browse them. We don't analytics-track who reads what.
          </p>
          <p>
            <strong>Private repos</strong> are end-to-end encrypted. The server holds ciphertext objects + per-collaborator wrapped keys it can't unwrap. Everything below applies to private repos.
          </p>
        </Section>

        <Section title="Identity">
          <p>
            When you sign up, your browser generates a P-256 ECDH keypair. The public key is uploaded to Siphr. The private key is encrypted with a key derived from your passphrase (PBKDF2-SHA256, 600,000 iterations) using AES-GCM and stored in your browser. We never see the passphrase or the unwrapped private key.
          </p>
        </Section>

        <Section title="Repository keys">
          <p>
            Every repo has its own random 256-bit symmetric key (the "repo key"). For each collaborator the repo key is wrapped via ECDH with their public key plus an ephemeral keypair, producing a self-contained blob the server stores but can't open.
          </p>
          <p>
            Adding a collaborator means wrapping the repo key for their public key. Removing one means rotating the key and re-encrypting changed objects forward.
          </p>
        </Section>

        <Section title="Git objects">
          <p>
            Blobs, trees, and commits are encrypted with the repo key using AES-256-GCM (fresh nonce per object) before they leave your machine. The server sees object IDs and ciphertext. It doesn't see filenames, file contents, commit messages, or author info inside the encrypted commit object.
          </p>
        </Section>

        <Section title="Merges, diffs, code search">
          <p>
            All happen client-side. Your browser pulls down the ciphertext it needs, decrypts with the repo key it already holds, runs the operation, encrypts the result, and pushes it back. The server is a dumb store.
          </p>
        </Section>

        <Section title="Verified accounts">
          <p>
            Usernames are restricted to ASCII <code>a-z 0-9 _ -</code> so Unicode lookalike attacks (Cyrillic <code>а</code> in <code>microsoft</code>) can't get registered in the first place.
          </p>
          <p>
            On top of that, well-known orgs and individuals get a verified badge. The badge means Siphr confirmed out-of-band that the holder of this account is who they claim. Before adding someone as a collaborator on a private repo, also verify their <strong>public key fingerprint</strong> on their profile out-of-band — that's the actual key the repo key gets wrapped to.
          </p>
        </Section>

        <Section title="The honest tradeoff" id="recovery">
          <p>
            If you lose your passphrase and your recovery codes, your private repos are gone. We can't recover them — that's the same property that means we can't hand them over either. We'd rather build a real recovery flow than a backdoor.
          </p>
        </Section>

        <div
          className="rounded-md p-4 text-sm"
          style={{ background: "var(--color-canvas-subtle)", border: "1px solid var(--color-border-muted)" }}
        >
          Source code: <a href="https://github.com/creedmanvr/Siphr" target="_blank" rel="noreferrer">github.com/creedmanvr/Siphr</a> · The privacy claim is verifiable, not promised.
        </div>
      </main>
    </>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="text-[color:var(--color-fg-muted)] leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}
