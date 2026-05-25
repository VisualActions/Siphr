# Siphr

Code hosting that can't read your code.

Siphr is an end-to-end encrypted git forge. Private repos are encrypted with
keys that live on the user's machine. The server stores ciphertext, public
keys, and wrapped repo keys it can't unwrap. Not the team, not a subpoena,
not us.

## How it works

- **Identity** — each user generates a P-256 ECDH keypair in their browser at
  signup. The private key is encrypted with a key derived from the user's
  passphrase (PBKDF2-SHA256, 600k iterations) and stored locally. The server
  only sees the public key + the opaque ciphertext blob.
- **Repo keys** — every repo gets its own random 256-bit AES key. The repo
  key is wrapped to each collaborator's public key via ECDH + an ephemeral
  keypair. Wrapping happens client-side.
- **Objects** — blobs, trees, and commits are encrypted with the repo key
  (AES-256-GCM, fresh nonce per object) before they leave the client.
- **Merges, diffs, search** — happen client-side. The server is a dumb store
  for ciphertext.

See `app/security/page.tsx` for the user-facing version of the threat model
and `lib/crypto.ts` for the primitives.

## Stack

- Next.js 16 App Router
- WebCrypto for primitives (no external crypto deps in the hot path)
- `isomorphic-git` for client-side git operations
- Filesystem-backed storage for v0.1 (swap for Postgres + Blob in prod)

## Status

v0.1 scaffold. Working:

- Landing + security pages
- Signup with client-side keypair generation and passphrase-wrapped private key
- Server stores only public keys + encrypted blobs
- Dashboard scaffold + repo creation API

Next:

- Signin (decrypt local identity)
- Repo creation UI with wrapped-key generation
- Git smart-HTTP transport that serves encrypted objects
- Browser-side commit/clone via `isomorphic-git` against encrypted objects
- Collaborator add/remove with repo-key rotation
- Recovery codes for lost-passphrase scenarios

## Dev

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## License

TBD. Will be open source so the privacy claims are auditable, not promises.
