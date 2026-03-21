-- Page dependencies for Gantt/Timeline view
-- "from_page_id must finish before to_page_id can start"

CREATE TABLE IF NOT EXISTS public.page_dependencies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  from_page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  to_page_id   uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  dep_type     text NOT NULL DEFAULT 'finish_to_start'
    CHECK (dep_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT no_self_dependency CHECK (from_page_id <> to_page_id),
  CONSTRAINT unique_dependency UNIQUE (from_page_id, to_page_id)
);

CREATE INDEX idx_page_deps_workspace ON public.page_dependencies(workspace_id);
CREATE INDEX idx_page_deps_from      ON public.page_dependencies(from_page_id);
CREATE INDEX idx_page_deps_to        ON public.page_dependencies(to_page_id);

ALTER TABLE public.page_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members can view dependencies"
  ON public.page_dependencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = page_dependencies.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "workspace members can insert dependencies"
  ON public.page_dependencies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = page_dependencies.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "workspace members can delete dependencies"
  ON public.page_dependencies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = page_dependencies.workspace_id
        AND wm.user_id = auth.uid()
    )
  );
