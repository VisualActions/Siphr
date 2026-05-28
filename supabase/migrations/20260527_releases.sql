-- v0.4e: Releases + binary assets.
--
-- release_assets is reserved for v0.4e.2 (Vercel Blob uploads). Today we
-- only ship metadata releases — tag, name, body, target_oid.

CREATE TABLE IF NOT EXISTS public.releases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id       uuid NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
  tag_name      text NOT NULL,
  name          text,
  body          text NOT NULL DEFAULT '',
  target_oid    text NOT NULL CHECK (target_oid ~ '^[a-f0-9]{40}$'),
  author        text NOT NULL REFERENCES public.users(username),
  draft         boolean NOT NULL DEFAULT false,
  prerelease    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  UNIQUE (repo_id, tag_name)
);

CREATE INDEX IF NOT EXISTS releases_repo_idx
  ON public.releases (repo_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.release_assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id   uuid NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  filename     text NOT NULL,
  size_bytes   bigint NOT NULL,
  content_type text,
  blob_url     text NOT NULL,
  sha256       text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS release_assets_release_idx
  ON public.release_assets (release_id);

ALTER TABLE public.releases       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_assets ENABLE ROW LEVEL SECURITY;
