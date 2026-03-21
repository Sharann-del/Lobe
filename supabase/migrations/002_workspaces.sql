-- Workspaces, membership, invites.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  icon_type TEXT NOT NULL DEFAULT 'emoji'
    CHECK (icon_type IN ('emoji', 'image')),
  cover_url TEXT,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.workspaces IS 'Top-level workspace container; pages live under a workspace.';

CREATE INDEX workspaces_owner_id_idx ON public.workspaces (owner_id);

CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role TEXT NOT NULL
    CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'commenter')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

COMMENT ON TABLE public.workspace_members IS 'Membership and role per workspace.';

CREATE INDEX workspace_members_user_id_idx ON public.workspace_members (user_id);
CREATE INDEX workspace_members_workspace_id_idx ON public.workspace_members (workspace_id);

CREATE TABLE public.workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL
    CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'commenter')),
  -- gen_random_bytes requires pgcrypto; use built-in UUIDs instead (64 hex chars)
  token TEXT NOT NULL UNIQUE DEFAULT replace(
    gen_random_uuid()::text || gen_random_uuid()::text,
    '-',
    ''
  ),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.workspace_invites IS 'Pending email invites to join a workspace.';

CREATE INDEX workspace_invites_workspace_id_idx ON public.workspace_invites (workspace_id);
CREATE INDEX workspace_invites_email_idx ON public.workspace_invites (lower(email));

-- ---------------------------------------------------------------------------
-- updated_at on workspaces
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_workspaces_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER workspaces_set_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_workspaces_updated_at();

-- ---------------------------------------------------------------------------
-- RLS helpers (SECURITY DEFINER — bypass member table RLS safely)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = _workspace_id
      AND wm.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.workspace_member_role(_workspace_id uuid, _user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wm.role
  FROM public.workspace_members wm
  WHERE wm.workspace_id = _workspace_id
    AND wm.user_id = _user_id
  LIMIT 1;
$$;

-- For future pages RLS: editor+ can mutate content; viewer+ can read.
CREATE OR REPLACE FUNCTION public.workspace_can_edit_content(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = _workspace_id
      AND wm.user_id = _user_id
      AND wm.role IN ('owner', 'admin', 'editor')
  );
$$;

CREATE OR REPLACE FUNCTION public.workspace_can_view_content(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_workspace_member(_workspace_id, _user_id);
$$;

-- ---------------------------------------------------------------------------
-- RPC: list workspaces for the current user
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_workspaces(_user_id uuid)
RETURNS SETOF public.workspaces
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.*
  FROM public.workspaces w
  INNER JOIN public.workspace_members wm ON wm.workspace_id = w.id
  WHERE wm.user_id = _user_id
    AND _user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- RPC: create workspace + owner row atomically (bypasses RLS)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  p_name text,
  p_slug text,
  p_user_id uuid
)
RETURNS public.workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  w public.workspaces;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'create_workspace_with_owner: user_id must match authenticated user';
  END IF;

  v_slug := lower(trim(p_slug));
  IF v_slug = '' OR v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'create_workspace_with_owner: invalid slug (lowercase letters, digits, hyphens only)';
  END IF;

  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (trim(p_name), v_slug, p_user_id)
  RETURNING * INTO w;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (w.id, p_user_id, 'owner');

  RETURN w;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS — workspaces
-- Visible to members only; owner full control; admin can update settings.
-- ---------------------------------------------------------------------------

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select_member"
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(id, auth.uid()));

-- No INSERT policy: clients use create_workspace_with_owner (SECURITY DEFINER).

CREATE POLICY "workspaces_update_owner_admin"
  ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING (
    public.workspace_member_role(id, auth.uid()) IN ('owner', 'admin')
  )
  WITH CHECK (
    public.workspace_member_role(id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "workspaces_delete_owner"
  ON public.workspaces
  FOR DELETE
  TO authenticated
  USING (public.workspace_member_role(id, auth.uid()) = 'owner');

-- ---------------------------------------------------------------------------
-- RLS — workspace_members
-- Owner: all; admin: manage members; members see roster.
-- ---------------------------------------------------------------------------

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_select_member"
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "workspace_members_insert_owner_admin"
  ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.workspace_member_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "workspace_members_update_owner_admin"
  ON public.workspace_members
  FOR UPDATE
  TO authenticated
  USING (
    public.workspace_member_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  )
  WITH CHECK (
    public.workspace_member_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "workspace_members_delete_owner_admin_or_self"
  ON public.workspace_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.workspace_member_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

-- ---------------------------------------------------------------------------
-- RLS — workspace_invites (owner + admin)
-- ---------------------------------------------------------------------------

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_invites_select_owner_admin"
  ON public.workspace_invites
  FOR SELECT
  TO authenticated
  USING (
    public.workspace_member_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "workspace_invites_insert_owner_admin"
  ON public.workspace_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.workspace_member_role(workspace_id, auth.uid()) IN ('owner', 'admin')
      AND created_by = auth.uid()
  );

CREATE POLICY "workspace_invites_update_owner_admin"
  ON public.workspace_invites
  FOR UPDATE
  TO authenticated
  USING (
    public.workspace_member_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  )
  WITH CHECK (
    public.workspace_member_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "workspace_invites_delete_owner_admin"
  ON public.workspace_invites
  FOR DELETE
  TO authenticated
  USING (
    public.workspace_member_role(workspace_id, auth.uid()) IN ('owner', 'admin')
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT SELECT, UPDATE, DELETE ON TABLE public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.workspace_invites TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_workspaces(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(text, text, uuid) TO authenticated;

COMMENT ON FUNCTION public.get_user_workspaces(uuid) IS 'Returns workspaces the user is a member of; _user_id must equal auth.uid().';

COMMENT ON FUNCTION public.create_workspace_with_owner(text, text, uuid) IS 'Creates a workspace and owner membership; p_user_id must equal auth.uid().';

COMMENT ON FUNCTION public.workspace_can_edit_content(uuid, uuid) IS 'For future pages RLS: owner, admin, or editor.';

COMMENT ON FUNCTION public.workspace_can_view_content(uuid, uuid) IS 'For future pages RLS: any member (viewer+).';
