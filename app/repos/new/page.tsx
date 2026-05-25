"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";

export default function NewRepoPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(localStorage.getItem("siphr:current_user"));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!user) throw new Error("Not signed in.");
      let wrappedKeys: Record<string, unknown> = {};
      let repoKey: Uint8Array | null = null;
      if (visibility === "private") {
        const { generateRepoKey, wrapRepoKey } = await import("@/lib/crypto");
        repoKey = await generateRepoKey();
        const usersRes = await fetch(`/api/users/${user}`);
        if (!usersRes.ok) throw new Error("Could not load your public key");
        const me = await usersRes.json();
        const wrapped = await wrapRepoKey(repoKey, me.publicKeyJwk);
        wrappedKeys = { [user]: wrapped };
      }
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ owner: user, name, visibility, wrappedKeys }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Server error");
      if (repoKey) {
        sessionStorage.setItem(`siphr:repokey:${j.id}`, btoa(String.fromCharCode(...repoKey)));
      }
      router.push(`/${user}/${name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-[768px] px-4 py-8">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-semibold">Create a new repository</h1>
          <p className="text-sm text-[color:var(--color-fg-muted)] mt-1">
            A fresh 256-bit repo key will be generated in this browser and wrapped to your public key.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Owner / Repository name *</label>
            <div className="flex items-center gap-2">
              <div className="btn btn-sm" style={{ pointerEvents: "none" }}>
                {user ?? "you"}
              </div>
              <span className="text-xl text-[color:var(--color-fg-muted)]">/</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="hello-world"
                className="input font-mono"
                style={{ maxWidth: 300 }}
              />
            </div>
            <div className="text-sm text-[color:var(--color-fg-muted)] mt-2">
              Great repository names are short and memorable. Need inspiration? How about <em>{["humble-tortoise", "fluffy-cipher", "studious-octopus"][Math.floor(Math.random() * 3)]}</em>?
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Description <span className="text-[color:var(--color-fg-muted)] font-normal">(optional)</span></label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="A short description"
            />
            <div className="text-xs text-[color:var(--color-fg-muted)] mt-1">
              Descriptions are encrypted with the repo key for private repos.
            </div>
          </div>

          <div className="space-y-3">
            <VisibilityOption
              selected={visibility === "private"}
              onClick={() => setVisibility("private")}
              icon="🔒"
              title="Private — end-to-end encrypted"
              body="A fresh 256-bit repo key is generated in this browser and wrapped to your public key. Siphr stores ciphertext and cannot read this repository."
            />
            <VisibilityOption
              selected={visibility === "public"}
              onClick={() => setVisibility("public")}
              icon="🌍"
              title="Public"
              body="Stored as plaintext, like a normal forge. Anyone can read it. Siphr still won't track who views or analytics what."
            />
          </div>

          {error && <div className="text-sm" style={{ color: "#cf222e" }}>{error}</div>}

          <div className="flex items-center gap-3 pt-2 border-t">
            <button type="submit" disabled={busy || !name || !user} className="btn btn-primary">
              {busy ? "Creating repository…" : "Create repository"}
            </button>
            <Link href="/dashboard" className="btn">Cancel</Link>
          </div>
        </form>
      </main>
    </>
  );
}

function VisibilityOption({
  selected,
  onClick,
  icon,
  title,
  body,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-3 rounded-md flex items-start gap-3"
      style={{
        border: selected ? "1px solid var(--color-accent)" : "1px solid var(--color-border-muted)",
        background: selected ? "var(--color-accent-subtle)" : "var(--color-canvas)",
      }}
    >
      <div className="text-xl">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-sm text-[color:var(--color-fg-muted)]">{body}</div>
      </div>
      <input
        type="radio"
        checked={selected}
        readOnly
        className="mt-1.5"
      />
    </button>
  );
}
