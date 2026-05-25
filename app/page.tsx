import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <header className="flex items-center justify-between mb-24">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-mono text-sm tracking-tight">siphr</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-[color:var(--color-muted)]">
          <Link href="/security" className="hover:text-white">how it works</Link>
          <Link href="/signup" className="hover:text-white">sign up</Link>
          <Link
            href="/signin"
            className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 hover:border-white/30"
          >
            sign in
          </Link>
        </nav>
      </header>

      <section className="space-y-8">
        <h1 className="text-5xl font-medium leading-[1.05] tracking-tight">
          Code hosting that{" "}
          <span className="text-[color:var(--color-accent)]">can't read your code.</span>
        </h1>
        <p className="text-lg text-[color:var(--color-muted)] max-w-xl">
          Siphr is an end-to-end encrypted git forge. Your private repos are
          encrypted with keys that live on your machine. We host the ciphertext.
          We can't read it. Not the team. Not a subpoena. Not us.
        </p>
        <div className="flex items-center gap-3 pt-4">
          <Link
            href="/signup"
            className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"
          >
            Create an account
          </Link>
          <Link
            href="/security"
            className="rounded-md border border-[color:var(--color-border)] px-5 py-2.5 text-sm hover:border-white/30"
          >
            Read the threat model
          </Link>
        </div>
      </section>

      <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          title="Per-repo keys"
          body="Every repo gets its own 256-bit symmetric key. The key is wrapped to each collaborator's public key, never to a master key we hold."
        />
        <Card
          title="Client-side everything"
          body="Encryption, decryption, diffs, and merges happen in your browser or CLI. The server only shuffles ciphertext."
        />
        <Card
          title="No telemetry"
          body="No analytics, no training on your code, no tracking. The privacy policy is what the code does, not a promise we made."
        />
      </section>

      <footer className="mt-32 pt-8 border-t border-[color:var(--color-border)] flex items-center justify-between text-xs text-[color:var(--color-muted)]">
        <span>siphr — open source, audit it yourself</span>
        <span className="font-mono">v0.1</span>
      </footer>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)] p-5">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="text-sm text-[color:var(--color-muted)] leading-relaxed">{body}</div>
    </div>
  );
}

function Logo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10 L9 13 L14 7" stroke="var(--color-accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
