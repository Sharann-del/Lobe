-- Article templates: predefined structures for new articles.

CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID NOT NULL REFERENCES public.pages (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled template',
  icon TEXT,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  properties JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  is_global BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.templates IS
  'Predefined entry structures for database pages; content is BlockNote JSON, properties are default property values.';

CREATE INDEX templates_database_id_idx ON public.templates (database_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_templates_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER templates_set_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_templates_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select_member"
  ON public.templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = templates.database_id
        AND public.is_workspace_member(pg.workspace_id, auth.uid())
    )
  );

CREATE POLICY "templates_insert_editor"
  ON public.templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = templates.database_id
        AND public.workspace_can_edit_content(pg.workspace_id, auth.uid())
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "templates_update_editor"
  ON public.templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = templates.database_id
        AND public.workspace_can_edit_content(pg.workspace_id, auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = templates.database_id
        AND public.workspace_can_edit_content(pg.workspace_id, auth.uid())
    )
  );

CREATE POLICY "templates_delete_editor"
  ON public.templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = templates.database_id
        AND public.workspace_can_edit_content(pg.workspace_id, auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.templates TO authenticated;
