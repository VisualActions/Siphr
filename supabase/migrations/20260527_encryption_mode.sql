-- v0.4a: Server-side at-rest encryption for private repos.
--
-- Adds columns to `repos`. Pure additive — no destructive changes, no DROPs.
-- After this migration:
--   - existing public repos -> encryption_mode='none'
--   - existing private repos -> encryption_mode='e2ee' (preserves browser flow)
--   - new private repos default to 'server' (set by /api/repos POST)

ALTER TABLE public.repos
  ADD COLUMN IF NOT EXISTS encryption_mode text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS wrapped_dek bytea,
  ADD COLUMN IF NOT EXISTS key_source text NOT NULL DEFAULT 'master';

-- Constrain to known modes.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'repos_encryption_mode_check'
  ) THEN
    ALTER TABLE public.repos
      ADD CONSTRAINT repos_encryption_mode_check
      CHECK (encryption_mode IN ('none', 'server', 'e2ee'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'repos_key_source_check'
  ) THEN
    ALTER TABLE public.repos
      ADD CONSTRAINT repos_key_source_check
      CHECK (key_source IN ('master', 'byok'));
  END IF;
END $$;

-- Backfill existing rows: preserve current behavior for existing data.
UPDATE public.repos SET encryption_mode = 'e2ee'
  WHERE visibility = 'private' AND encryption_mode = 'none';
UPDATE public.repos SET encryption_mode = 'none'
  WHERE visibility = 'public' AND encryption_mode <> 'none';
