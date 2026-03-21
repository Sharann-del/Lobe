"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import type { PageRow } from "@/lib/types/pages";

function rowFromPayload(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>
): PageRow | null {
  const row = payload.new && Object.keys(payload.new).length > 0
    ? payload.new
    : payload.old;
  if (!row || typeof row !== "object") {
    return null;
  }
  return row as unknown as PageRow;
}

/**
 * Subscribes to `public.pages` for the active workspace.
 * Enable replication for `pages` in Supabase Dashboard → Database → Replication.
 */
export function usePagesRealtime(workspaceId: string | null): void {
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
          const store = usePageTreeStore.getState();
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string } | null;
            if (oldRow?.id) {
              store.removePageLocal(oldRow.id);
            }
            return;
          }
          const row = rowFromPayload(
            payload as RealtimePostgresChangesPayload<Record<string, unknown>>
          );
          if (row) {
            store.upsertPage(row);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [workspaceId]);
}
