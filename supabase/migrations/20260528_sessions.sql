-- v0.4p1: Server-side sessions.
--
-- users gains scrypt(auth) hash + salt. On signup the browser sends the
-- passphrase along with the encrypted_identity; the server hashes it and
-- stores the result. The hash never leaves the server; the passphrase only
-- crosses the wire over HTTPS at signin/signup time.
--
-- Existing users without auth_hash auto-enroll on their next signin: the
-- old browser-only flow verified the passphrase by decrypting the identity
-- locally, so we accept the first signin as-is and write the hash then.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_hash text,
  ADD COLUMN IF NOT EXISTS auth_salt text;

CREATE TABLE IF NOT EXISTS public.sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_username text NOT NULL REFERENCES public.users(username) ON DELETE CASCADE,
  token_hash    text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz,
  user_agent    text,
  ip            text
);

CREATE INDEX IF NOT EXISTS sessions_user_idx
  ON public.sessions (user_username, expires_at);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx
  ON public.sessions (expires_at) WHERE revoked_at IS NULL;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
