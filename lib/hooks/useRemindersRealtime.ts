"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRemindersStore } from "@/lib/stores/remindersStore";

export function useRemindersRealtime(workspaceId: string | null): void {
  useEffect(() => {
    if (!workspaceId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`reminders:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reminder_events",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          useRemindersStore.getState().fetchEvents();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [workspaceId]);
}
