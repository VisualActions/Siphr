-- v0.4b: Personal Access Tokens for HTTPS git auth.
--
-- Tokens are issued as `siphr_pat_<base64url(32 bytes)>`. Only the SHA-256
-- of the token is stored; the plaintext token is shown to the user once at
-- creation time and never recoverable thereafter.

CREATE TABLE IF NOT EXISTS public.personal_access_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_username text NOT NULL REFERENCES public.users(username) ON DELETE CASCADE,
  name          text NOT NULL,
  token_hash    text NOT NULL UNIQUE,
  prefix        text NOT NULL,
  scopes        text[] NOT NULL DEFAULT ARRAY['repo']::text[],
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,
  expires_at    timestamptz
);

CREATE INDEX IF NOT EXISTS personal_access_tokens_user_idx
  ON public.personal_access_tokens (user_username);

ALTER TABLE public.personal_access_tokens ENABLE ROW LEVEL SECURITY;
-- No policies: the service role (used by our API) bypasses RLS; the anon
-- key can't see or create tokens.
