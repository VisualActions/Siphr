-- v0.4f: Orgs, teams, RBAC.
--
-- The "owner" of a repo is now a free-text namespace that may resolve to
-- either a user or an org. We DO NOT enforce the FK on repos.owner because
-- of this — application code is responsible for confirming the owner exists
-- in exactly one of the two namespaces.
--
-- Existing repos all reference users(username) so dropping the FK does not
-- orphan any rows.

CREATE TABLE IF NOT EXISTS public.orgs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text UNIQUE NOT NULL,
  display_name  text,
  description   text,
  avatar_url    text,
  billing_email text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orgs_name_check
    CHECK (name ~ '^[A-Za-z0-9_][A-Za-z0-9_-]{1,30}[A-Za-z0-9_]$' OR name ~ '^[A-Za-z0-9_]{3}$')
);

CREATE TABLE IF NOT EXISTS public.org_members (
  org_id        uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_username text NOT NULL REFERENCES public.users(username) ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_username)
);

CREATE INDEX IF NOT EXISTS org_members_user_idx
  ON public.org_members (user_username);

CREATE TABLE IF NOT EXISTS public.teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

CREATE TABLE IF NOT EXISTS public.team_members (
  team_id       uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_username text NOT NULL REFERENCES public.users(username) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_username)
);

-- Per-repo grants. principal_type='user' -> principal_id is users.username.
-- principal_type='team' -> principal_id is teams.id (as text).
CREATE TABLE IF NOT EXISTS public.repo_collaborators (
  repo_id        uuid NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
  principal_type text NOT NULL CHECK (principal_type IN ('user', 'team')),
  principal_id   text NOT NULL,
  permission     text NOT NULL CHECK (permission IN ('read', 'write', 'maintain', 'admin')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (repo_id, principal_type, principal_id)
);

CREATE INDEX IF NOT EXISTS repo_collaborators_principal_idx
  ON public.repo_collaborators (principal_type, principal_id);

-- Drop the strict user FK on repos.owner so orgs can also own repos. We
-- keep validation in application code (createRepo).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'repos_owner_fkey'
  ) THEN
    ALTER TABLE public.repos DROP CONSTRAINT repos_owner_fkey;
  END IF;
END $$;

ALTER TABLE public.orgs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repo_collaborators ENABLE ROW LEVEL SECURITY;
