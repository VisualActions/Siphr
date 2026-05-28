-- v0.4c: Issues, comments, labels.
--
-- Issue numbering is per-repo (`siphr/repo#42`), allocated by the
-- next_issue_number RPC which serializes via the repo_counters table.

CREATE TABLE IF NOT EXISTS public.repo_counters (
  repo_id   uuid PRIMARY KEY REFERENCES public.repos(id) ON DELETE CASCADE,
  next_issue int NOT NULL DEFAULT 1
);

CREATE OR REPLACE FUNCTION public.next_issue_number(p_repo_id uuid)
RETURNS int AS $$
DECLARE
  n int;
BEGIN
  INSERT INTO public.repo_counters (repo_id, next_issue) VALUES (p_repo_id, 2)
  ON CONFLICT (repo_id) DO UPDATE SET next_issue = public.repo_counters.next_issue + 1
  RETURNING next_issue - 1 INTO n;
  RETURN n;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.issues (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id     uuid NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
  number      int  NOT NULL,
  author      text NOT NULL REFERENCES public.users(username),
  title       text NOT NULL,
  body        text NOT NULL DEFAULT '',
  state       text NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'closed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  closed_at   timestamptz,
  closed_by   text REFERENCES public.users(username),
  UNIQUE (repo_id, number)
);

CREATE INDEX IF NOT EXISTS issues_repo_idx ON public.issues (repo_id, state, created_at DESC);
CREATE INDEX IF NOT EXISTS issues_author_idx ON public.issues (author);

CREATE TABLE IF NOT EXISTS public.issue_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author      text NOT NULL REFERENCES public.users(username),
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  edited_at   timestamptz
);

CREATE INDEX IF NOT EXISTS issue_comments_issue_idx
  ON public.issue_comments (issue_id, created_at);

CREATE TABLE IF NOT EXISTS public.labels (
  repo_id     uuid NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL DEFAULT '#888888',
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (repo_id, name)
);

CREATE TABLE IF NOT EXISTS public.issue_labels (
  issue_id   uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  label_name text NOT NULL,
  PRIMARY KEY (issue_id, label_name)
);

ALTER TABLE public.repo_counters    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_labels     ENABLE ROW LEVEL SECURITY;
