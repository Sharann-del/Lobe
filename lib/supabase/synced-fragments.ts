import type { SupabaseClient } from "@supabase/supabase-js";

export interface SyncedFragmentRow {
  id: string;
  workspace_id: string;
  blocks: unknown;
  updated_at: string;
}

export async function fetchSyncedFragment(
  supabase: SupabaseClient,
  fragmentId: string
): Promise<{ data: SyncedFragmentRow | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("synced_block_fragments")
      .select("id, workspace_id, blocks, updated_at")
      .eq("id", fragmentId)
      .maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return {
      data: data as SyncedFragmentRow | null,
      error: null,
    };
  } catch (e) {
    const err = e instanceof Error ? e : new Error("Unknown error");
    return { data: null, error: err };
  }
}

export async function createSyncedFragment(
  supabase: SupabaseClient,
  args: {
    workspaceId: string;
    userId: string;
    blocks: unknown;
  }
): Promise<{ id: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("synced_block_fragments")
      .insert({
        workspace_id: args.workspaceId,
        created_by: args.userId,
        blocks: args.blocks,
      })
      .select("id")
      .single();

    if (error) {
      return { id: null, error: new Error(error.message) };
    }
    const row = data as { id: string } | null;
    return { id: row?.id ?? null, error: null };
  } catch (e) {
    const err = e instanceof Error ? e : new Error("Unknown error");
    return { id: null, error: err };
  }
}

export async function updateSyncedFragmentBlocks(
  supabase: SupabaseClient,
  args: { fragmentId: string; blocks: unknown }
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from("synced_block_fragments")
      .update({ blocks: args.blocks })
      .eq("id", args.fragmentId);

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (e) {
    const err = e instanceof Error ? e : new Error("Unknown error");
    return { error: err };
  }
}
