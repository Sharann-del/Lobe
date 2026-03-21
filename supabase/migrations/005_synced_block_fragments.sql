-- Shared content for synced blocks (mirrors across pages via fragment UUID in editor JSON).

CREATE TABLE public.synced_block_fragments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.synced_block_fragments IS
  'BlockNote subtree JSON shared by multiple synced block instances in a workspace.';

CREATE INDEX synced_block_fragments_workspace_idx
  ON public.synced_block_fragments (workspace_id);

CREATE OR REPLACE FUNCTION public.handle_synced_block_fragments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER synced_block_fragments_set_updated_at
  BEFORE UPDATE ON public.synced_block_fragments
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_synced_block_fragments_updated_at();

ALTER TABLE public.synced_block_fragments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "synced_fragments_select_members"
  ON public.synced_block_fragments
  FOR SELECT
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "synced_fragments_insert_editors"
  ON public.synced_block_fragments
  FOR INSERT
  WITH CHECK (
    public.workspace_can_edit_content(workspace_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "synced_fragments_update_editors"
  ON public.synced_block_fragments
  FOR UPDATE
  USING (public.workspace_can_edit_content(workspace_id, auth.uid()))
  WITH CHECK (public.workspace_can_edit_content(workspace_id, auth.uid()));

CREATE POLICY "synced_fragments_delete_editors"
  ON public.synced_block_fragments
  FOR DELETE
  USING (public.workspace_can_edit_content(workspace_id, auth.uid()));
