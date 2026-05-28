-- v0.4d: Pull requests + comments.
--
-- Numbering is per-repo via repo_counters.next_pr (independent of issues).
-- Merge is fast-forward only in v0.4; richer merge strategies in v0.5.

ALTER TABLE public.repo_counters
  ADD COLUMN IF NOT EXISTS next_pr int NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.next_pr_number(p_repo_id uuid)
RETURNS int AS $$
DECLARE
  n int;
BEGIN
  INSERT INTO public.repo_counters (repo_id, next_pr) VALUES (p_repo_id, 2)
  ON CONFLICT (repo_id) DO UPDATE SET next_pr = public.repo_counters.next_pr + 1
  RETURNING next_pr - 1 INTO n;
  RETURN n;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.pull_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id           uuid NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
  number            int  NOT NULL,
  author            text NOT NULL REFERENCES public.users(username),
  title             text NOT NULL,
  body              text NOT NULL DEFAULT '',
  state             text NOT NULL DEFAULT 'open'
    CHECK (state IN ('open', 'closed', 'merged')),
  head_ref          text NOT NULL,
  base_ref          text NOT NULL,
  head_oid          text NOT NULL CHECK (head_oid ~ '^[a-f0-9]{40}$'),
  base_oid          text NOT NULL CHECK (base_oid ~ '^[a-f0-9]{40}$'),
  merge_commit_oid  text CHECK (merge_commit_oid IS NULL OR merge_commit_oid ~ '^[a-f0-9]{40}$'),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  closed_at         timestamptz,
  merged_at         timestamptz,
  merged_by         text REFERENCES public.users(username),
  UNIQUE (repo_id, number)
);

CREATE INDEX IF NOT EXISTS pulls_repo_idx
  ON public.pull_requests (repo_id, state, created_at DESC);

CREATE TABLE IF NOT EXISTS public.pr_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id       uuid NOT NULL REFERENCES public.pull_requests(id) ON DELETE CASCADE,
  author      text NOT NULL REFERENCES public.users(username),
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  edited_at   timestamptz
);

CREATE INDEX IF NOT EXISTS pr_comments_pr_idx
  ON public.pr_comments (pr_id, created_at);

ALTER TABLE public.pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_comments   ENABLE ROW LEVEL SECURITY;
