"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import type { NodeRow } from "@/lib/types/nodes";

function rowFromPayload(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>
): NodeRow | null {
  const row = payload.new && Object.keys(payload.new).length > 0
    ? payload.new
    : payload.old;
  if (!row || typeof row !== "object") {
    return null;
  }
  return row as unknown as NodeRow;
}

/**
 * Subscribes to `public.pages` for the active workspace.
 * Enable replication for `pages` in Supabase Dashboard → Database → Replication.
 */
export function useNodesRealtime(workspaceId: string | null): void {
  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`pages:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pages",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const store = useSectionTreeStore.getState();
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string } | null;
            if (oldRow?.id) {
              store.removeNodeLocal(oldRow.id);
            }
            return;
          }
          const row = rowFromPayload(
            payload as RealtimePostgresChangesPayload<Record<string, unknown>>
          );
          if (row) {
            store.upsertNode(row);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [workspaceId]);
}
