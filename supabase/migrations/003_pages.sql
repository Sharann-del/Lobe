-- Pages, custom properties, property schemas; tree helpers and soft delete.

-- ---------------------------------------------------------------------------
-- Types (shared property field kinds)
-- ---------------------------------------------------------------------------

CREATE DOMAIN public.property_value_type AS TEXT
  CHECK (
    VALUE IN (
      'text',
      'number',
      'date',
      'boolean',
      'select',
      'multi_select',
      'relation',
      'url',
      'email',
      'phone',
      'person',
      'file',
      'checkbox',
      'formula',
      'rollup',
      'created_time',
      'last_edited_time',
      'created_by',
      'last_edited_by'
    )
  );

COMMENT ON DOMAIN public.property_value_type IS
  'Allowed property schema / property value kinds (Notion-style).';

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.pages (id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  title TEXT NOT NULL DEFAULT 'Untitled',
  icon TEXT,
  icon_type TEXT NOT NULL DEFAULT 'emoji'
    CHECK (icon_type IN ('emoji', 'image', 'lucide')),
  cover_url TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_slug TEXT,
  sort_order DOUBLE PRECISION NOT NULL DEFAULT 0,
  -- True "GENERATED" depth from parent chain is not supported in PG; maintained by triggers below.
  depth INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pages_no_self_parent CHECK (parent_id IS DISTINCT FROM id),
  CONSTRAINT pages_published_slug_when_published CHECK (
    (NOT is_published) OR (published_slug IS NOT NULL AND length(trim(published_slug)) > 0)
  )
);

COMMENT ON TABLE public.pages IS 'Hierarchical pages per workspace; soft delete and optional public publish.';
COMMENT ON COLUMN public.pages.depth IS 'Distance from root (parent_id IS NULL); maintained by triggers, not user-editable.';
COMMENT ON COLUMN public.pages.content IS 'Block editor JSON (e.g. BlockNote / Tiptap).';

CREATE UNIQUE INDEX pages_published_slug_unique
  ON public.pages (published_slug)
  WHERE published_slug IS NOT NULL;

CREATE INDEX pages_workspace_parent_idx ON public.pages (workspace_id, parent_id);
CREATE INDEX pages_workspace_deleted_idx ON public.pages (workspace_id, is_deleted);

-- Full-text search: title + JSON stringification of content
CREATE INDEX pages_title_content_fts_idx ON public.pages
  USING gin (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(content::text, '')
    )
  );

CREATE TABLE public.page_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages (id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value_type public.property_value_type NOT NULL,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page_id, key)
);

COMMENT ON TABLE public.page_properties IS 'Per-page custom property values; key aligns with property_schemas.name when typed.';

CREATE INDEX page_properties_page_id_idx ON public.page_properties (page_id);

CREATE TABLE public.property_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.property_value_type NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

COMMENT ON TABLE public.property_schemas IS 'Workspace-level property definitions; options for select/multi_select as [{id,name,color}].';

CREATE INDEX property_schemas_workspace_id_idx ON public.property_schemas (workspace_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_pages_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER pages_set_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_pages_updated_at();

CREATE OR REPLACE FUNCTION public.handle_property_schemas_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER property_schemas_set_updated_at
  BEFORE UPDATE ON public.property_schemas
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_property_schemas_updated_at();

-- ---------------------------------------------------------------------------
-- Parent must live in the same workspace
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pages_enforce_parent_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.pages p
      WHERE p.id = NEW.parent_id
        AND p.workspace_id = NEW.workspace_id
    ) THEN
      RAISE EXCEPTION 'pages: parent_id must reference a page in the same workspace';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER pages_enforce_parent_workspace_ins
  BEFORE INSERT ON public.pages
  FOR EACH ROW
  EXECUTE PROCEDURE public.pages_enforce_parent_workspace();

CREATE TRIGGER pages_enforce_parent_workspace_upd
  BEFORE UPDATE OF parent_id, workspace_id ON public.pages
  FOR EACH ROW
  EXECUTE PROCEDURE public.pages_enforce_parent_workspace();

-- ---------------------------------------------------------------------------
-- Depth: compute from parent chain (triggers; not a PG GENERATED column)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pages_compute_row_depth(_parent_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _parent_id IS NULL THEN 0
    ELSE COALESCE((SELECT p.depth + 1 FROM public.pages p WHERE p.id = _parent_id), -1)
  END;
$$;

CREATE OR REPLACE FUNCTION public.pages_refresh_subtree_depth(p_root_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  WITH RECURSIVE sub AS (
    SELECT
      pg.id,
      pg.parent_id,
      public.pages_compute_row_depth(pg.parent_id) AS new_depth
    FROM public.pages pg
    WHERE pg.id = p_root_id
    UNION ALL
    SELECT
      c.id,
      c.parent_id,
      s.new_depth + 1
    FROM public.pages c
    INNER JOIN sub s ON c.parent_id = s.id
  )
  UPDATE public.pages pg
  SET depth = sub.new_depth
  FROM sub
  WHERE pg.id = sub.id
    AND pg.depth IS DISTINCT FROM sub.new_depth;
END;
$$;

CREATE OR REPLACE FUNCTION public.pages_before_insert_update_depth()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_depth integer;
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.parent_id IS DISTINCT FROM OLD.parent_id) THEN
    v_depth := public.pages_compute_row_depth(NEW.parent_id);
    IF v_depth < 0 THEN
      RAISE EXCEPTION 'pages: parent_id % not found in workspace', NEW.parent_id;
    END IF;
    NEW.depth := v_depth;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER pages_set_depth_before_insert
  BEFORE INSERT ON public.pages
  FOR EACH ROW
  EXECUTE PROCEDURE public.pages_before_insert_update_depth();

CREATE TRIGGER pages_set_depth_before_parent_update
  BEFORE UPDATE OF parent_id ON public.pages
  FOR EACH ROW
  EXECUTE PROCEDURE public.pages_before_insert_update_depth();

CREATE OR REPLACE FUNCTION public.pages_after_depth_or_parent_refresh_subtree()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.pages_refresh_subtree_depth(NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN
    PERFORM public.pages_refresh_subtree_depth(NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER pages_refresh_subtree_after_insert
  AFTER INSERT ON public.pages
  FOR EACH ROW
  EXECUTE PROCEDURE public.pages_after_depth_or_parent_refresh_subtree();

CREATE TRIGGER pages_refresh_subtree_after_parent_change
  AFTER UPDATE OF parent_id ON public.pages
  FOR EACH ROW
  WHEN (NEW.parent_id IS DISTINCT FROM OLD.parent_id)
  EXECUTE PROCEDURE public.pages_after_depth_or_parent_refresh_subtree();

-- ---------------------------------------------------------------------------
-- RLS helpers for pages
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.workspace_is_owner_or_admin(_workspace_id uuid, _user_id uuid)
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
      AND wm.role IN ('owner', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- RPC: page tree (respects RLS when used as SECURITY INVOKER)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_page_tree(p_workspace_id uuid)
RETURNS SETOF public.pages
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH RECURSIVE tree AS (
    SELECT p.*
    FROM public.pages p
    WHERE p.workspace_id = p_workspace_id
      AND p.parent_id IS NULL
    UNION ALL
    SELECT c.*
    FROM public.pages c
    INNER JOIN tree t ON c.parent_id = t.id
  )
  SELECT * FROM tree;
$$;

COMMENT ON FUNCTION public.get_page_tree(uuid) IS
  'Recursive page list for a workspace; depth column is stored on each row. Subject to RLS on pages.';

-- ---------------------------------------------------------------------------
-- RPC: soft delete / restore (SECURITY DEFINER)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.soft_delete_page(p_page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace uuid;
BEGIN
  SELECT workspace_id INTO v_workspace
  FROM public.pages
  WHERE id = p_page_id;

  IF v_workspace IS NULL THEN
    RAISE EXCEPTION 'soft_delete_page: page not found';
  END IF;

  IF NOT public.workspace_can_edit_content(v_workspace, auth.uid()) THEN
    RAISE EXCEPTION 'soft_delete_page: forbidden';
  END IF;

  WITH RECURSIVE sub AS (
    SELECT id FROM public.pages WHERE id = p_page_id
    UNION ALL
    SELECT c.id
    FROM public.pages c
    INNER JOIN sub s ON c.parent_id = s.id
  )
  UPDATE public.pages p
  SET
    is_deleted = TRUE,
    deleted_at = COALESCE(p.deleted_at, NOW())
  FROM sub
  WHERE p.id = sub.id
    AND p.is_deleted = FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_page(p_page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace uuid;
BEGIN
  SELECT workspace_id INTO v_workspace
  FROM public.pages
  WHERE id = p_page_id;

  IF v_workspace IS NULL THEN
    RAISE EXCEPTION 'restore_page: page not found';
  END IF;

  IF NOT public.workspace_is_owner_or_admin(v_workspace, auth.uid()) THEN
    RAISE EXCEPTION 'restore_page: only owner or admin can restore';
  END IF;

  WITH RECURSIVE sub AS (
    SELECT id FROM public.pages WHERE id = p_page_id
    UNION ALL
    SELECT c.id
    FROM public.pages c
    INNER JOIN sub s ON c.parent_id = s.id
  )
  UPDATE public.pages p
  SET
    is_deleted = FALSE,
    deleted_at = NULL
  FROM sub
  WHERE p.id = sub.id
    AND p.is_deleted = TRUE;
END;
$$;

COMMENT ON FUNCTION public.soft_delete_page(uuid) IS
  'Marks page and all descendants as deleted; requires editor+ on workspace.';
COMMENT ON FUNCTION public.restore_page(uuid) IS
  'Restores page and descendants from soft delete; requires owner or admin.';

-- ---------------------------------------------------------------------------
-- RLS — pages
-- ---------------------------------------------------------------------------

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Authenticated: workspace members; hide soft-deleted from non–owner/admin.
CREATE POLICY "pages_select_authenticated"
  ON public.pages
  FOR SELECT
  TO authenticated
  USING (
    public.is_workspace_member(workspace_id, auth.uid())
    AND (
      NOT is_deleted
      OR public.workspace_is_owner_or_admin(workspace_id, auth.uid())
    )
  );

-- Public read for published, non-deleted pages.
CREATE POLICY "pages_select_anon_published"
  ON public.pages
  FOR SELECT
  TO anon
  USING (
    is_published = TRUE
    AND is_deleted = FALSE
  );

CREATE POLICY "pages_insert_editor"
  ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.workspace_can_edit_content(workspace_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "pages_update_editor"
  ON public.pages
  FOR UPDATE
  TO authenticated
  USING (
    public.workspace_can_edit_content(workspace_id, auth.uid())
    AND (
      NOT is_deleted
      OR public.workspace_is_owner_or_admin(workspace_id, auth.uid())
    )
  )
  WITH CHECK (
    public.workspace_can_edit_content(workspace_id, auth.uid())
    AND (
      NOT is_deleted
      OR public.workspace_is_owner_or_admin(workspace_id, auth.uid())
    )
  );

CREATE POLICY "pages_delete_editor"
  ON public.pages
  FOR DELETE
  TO authenticated
  USING (
    public.workspace_can_edit_content(workspace_id, auth.uid())
  );

-- ---------------------------------------------------------------------------
-- RLS — page_properties (via parent page workspace)
-- ---------------------------------------------------------------------------

ALTER TABLE public.page_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_properties_select"
  ON public.page_properties
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = page_properties.page_id
        AND public.is_workspace_member(pg.workspace_id, auth.uid())
        AND (
          NOT pg.is_deleted
          OR public.workspace_is_owner_or_admin(pg.workspace_id, auth.uid())
        )
    )
  );

CREATE POLICY "page_properties_insert_editor"
  ON public.page_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = page_properties.page_id
        AND public.workspace_can_edit_content(pg.workspace_id, auth.uid())
        AND NOT pg.is_deleted
    )
  );

CREATE POLICY "page_properties_update_editor"
  ON public.page_properties
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = page_properties.page_id
        AND public.workspace_can_edit_content(pg.workspace_id, auth.uid())
        AND NOT pg.is_deleted
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = page_properties.page_id
        AND public.workspace_can_edit_content(pg.workspace_id, auth.uid())
        AND NOT pg.is_deleted
    )
  );

CREATE POLICY "page_properties_delete_editor"
  ON public.page_properties
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = page_properties.page_id
        AND public.workspace_can_edit_content(pg.workspace_id, auth.uid())
        AND NOT pg.is_deleted
    )
  );

-- ---------------------------------------------------------------------------
-- RLS — property_schemas
-- ---------------------------------------------------------------------------

ALTER TABLE public.property_schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_schemas_select_member"
  ON public.property_schemas
  FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "property_schemas_insert_editor"
  ON public.property_schemas
  FOR INSERT
  TO authenticated
  WITH CHECK (public.workspace_can_edit_content(workspace_id, auth.uid()));

CREATE POLICY "property_schemas_update_editor"
  ON public.property_schemas
  FOR UPDATE
  TO authenticated
  USING (public.workspace_can_edit_content(workspace_id, auth.uid()))
  WITH CHECK (public.workspace_can_edit_content(workspace_id, auth.uid()));

CREATE POLICY "property_schemas_delete_editor"
  ON public.property_schemas
  FOR DELETE
  TO authenticated
  USING (public.workspace_can_edit_content(workspace_id, auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pages TO authenticated;
GRANT SELECT ON TABLE public.pages TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.page_properties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.property_schemas TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_page_tree(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.soft_delete_page(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_page(uuid) TO authenticated;
