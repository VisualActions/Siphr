export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 space-y-12">
      <header>
        <a href="/" className="text-sm text-[color:var(--color-muted)] hover:text-white">
          ← back
        </a>
        <h1 className="mt-6 text-4xl font-medium tracking-tight">How Siphr works</h1>
        <p className="mt-4 text-[color:var(--color-muted)]">
          The whole pitch rests on one rule: every key that can decrypt your
          code lives on your machine. The server has public keys, ciphertext,
          and wrapped keys it can't unwrap.
        </p>
      </header>

      <Section title="Identity">
        <p>
          When you sign up, your browser generates a P-256 ECDH keypair. The
          public key is uploaded to Siphr. The private key is encrypted with a
          key derived from your passphrase (PBKDF2-SHA256, 600,000 iterations)
          using AES-GCM and stored in your browser. We never see the passphrase
          or the unwrapped private key.
        </p>
      </Section>

      <Section title="Repository keys">
        <p>
          Every repo has its own random 256-bit symmetric key (the "repo key").
          For each collaborator the repo key is wrapped via ECDH with their
          public key plus an ephemeral keypair, producing a self-contained
          blob the server stores but can't open.
        </p>
        <p>
          Adding a collaborator means wrapping the repo key for their public
          key. Removing one means rotating the key and re-encrypting changed
          objects forward.
        </p>
      </Section>

      <Section title="Git objects">
        <p>
          Blobs, trees, and commits are encrypted with the repo key using
          AES-256-GCM (fresh nonce per object) before they leave your machine.
          The server sees object IDs and ciphertext. It doesn't see filenames,
          file contents, commit messages, or author info inside the encrypted
          commit object.
        </p>
      </Section>

      <Section title="Merges, diffs, code search">
        <p>
          All happen client-side. Your browser pulls down the ciphertext it
          needs, decrypts with the repo key it already holds, runs the
          operation, encrypts the result, and pushes it back. The server is a
          dumb store.
        </p>
      </Section>

      <Section title="The honest tradeoff">
        <p>
          If you lose your passphrase and your recovery codes, your private
          repos are gone. We can't recover them — that's the same property
          that means we can't hand them over either. We'd rather build a real
          recovery flow than a backdoor.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="text-[color:var(--color-muted)] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
