"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePagesRealtime } from "@/lib/hooks/usePagesRealtime";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import type { PageRow } from "@/lib/types/pages";
import { SidebarActionsProvider } from "@/components/sidebar/sidebar-actions-context";
import { SidebarFavorites } from "@/components/sidebar/SidebarFavorites";
import {
  SidebarHeader,
  type SidebarWorkspaceOption,
} from "@/components/sidebar/SidebarHeader";
import { SidebarMoveDialog } from "@/components/sidebar/SidebarMoveDialog";
import { SidebarNewPage } from "@/components/sidebar/SidebarNewPage";
import { SidebarPageTree } from "@/components/sidebar/SidebarPageTree";
import { SidebarPrivate } from "@/components/sidebar/SidebarPrivate";
import { SidebarSearch } from "@/components/sidebar/SidebarSearch";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { SidebarSettings } from "@/components/sidebar/SidebarSettings";
import { SidebarShared } from "@/components/sidebar/SidebarShared";
import { SidebarTrash } from "@/components/sidebar/SidebarTrash";
import { SidebarUiProvider } from "@/components/sidebar/sidebar-ui-context";
import { SidebarReminders } from "@/components/reminders/SidebarReminders";
import { ScrollArea } from "@/components/ui";
import { useRemindersStore } from "@/lib/stores/remindersStore";
import { useRemindersRealtime } from "@/lib/hooks/useRemindersRealtime";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "lobe-sidebar-collapsed";

export interface SidebarRootProps {
  workspaces: SidebarWorkspaceOption[];
  activeWorkspaceId: string;
  userId: string;
  onWorkspaceChange?: (_workspaceId: string) => void;
  onCreateWorkspace?: () => void;
  className?: string;
}

export function SidebarRoot({
  workspaces,
  activeWorkspaceId,
  userId: _userId,
  onWorkspaceChange,
  onCreateWorkspace,
  className,
}: SidebarRootProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [movePageId, setMovePageId] = useState<string | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(COLLAPSED_KEY);
      if (v === "1") {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const onToggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);

  useEffect(() => {
    usePageTreeStore.getState().setWorkspaceId(activeWorkspaceId);
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!activeWorkspaceId) {
      return;
    }
    let cancelled = false;
    const run = async (): Promise<void> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("workspace_id", activeWorkspaceId)
        .order("sort_order", { ascending: true });
      if (cancelled) {
        return;
      }
      if (error) {
        console.error("SidebarRoot: failed to load pages", error.message);
        return;
      }
      usePageTreeStore.getState().hydrateFromPages((data ?? []) as PageRow[]);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId]);

  usePagesRealtime(activeWorkspaceId);

  useEffect(() => {
    if (!activeWorkspaceId || !_userId) return;
    useRemindersStore.getState().setContext(activeWorkspaceId, _userId);
    void useRemindersStore.getState().fetchEvents();
  }, [activeWorkspaceId, _userId]);

  useRemindersRealtime(activeWorkspaceId);

  const openMoveDialog = useCallback((pageId: string) => {
    setMovePageId(pageId);
    setMoveOpen(true);
  }, []);

  if (!activeWs) {
    return null;
  }

  return (
    <>
      <SidebarActionsProvider value={{ openMoveDialog }}>
        <aside
          className={cn(
            "flex h-full shrink-0 flex-col overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--bg-1)]",
            "transition-[width] duration-default ease-out",
            collapsed ? "w-[52px]" : "w-[240px]",
            className
          )}
          data-collapsed={collapsed ? "true" : "false"}
        >
          <SidebarUiProvider collapsed={collapsed}>
          <SidebarHeader
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
            onSelectWorkspace={onWorkspaceChange}
            onCreateWorkspace={onCreateWorkspace}
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-2 px-1.5 py-2">
              {!collapsed && (
                <SidebarSearch onTrigger={() => undefined} collapsed={false} />
              )}
              {collapsed && (
                <SidebarSearch collapsed className="justify-center" />
              )}

              <SidebarSection
                label="Favorites"
                storageKey="favorites"
                collapsed={collapsed}
              >
                <SidebarFavorites collapsed={collapsed} />
              </SidebarSection>

              <SidebarSection
                label="Reminders"
                storageKey="reminders"
                collapsed={collapsed}
              >
                <SidebarReminders collapsed={collapsed} />
              </SidebarSection>

              <SidebarSection
                label="Private"
                storageKey="private"
                collapsed={collapsed}
              >
                <SidebarPrivate collapsed={collapsed} />
              </SidebarSection>

              <SidebarSection
                label="Shared"
                storageKey="shared"
                defaultOpen={false}
                collapsed={collapsed}
              >
                <SidebarShared collapsed={collapsed} />
              </SidebarSection>

              <SidebarSection label="Pages" storageKey="pages" collapsed={collapsed}>
                <SidebarPageTree />
              </SidebarSection>

              <SidebarSection
                label="Trash"
                storageKey="trash"
                defaultOpen={false}
                collapsed={collapsed}
              >
                <SidebarTrash collapsed={collapsed} />
              </SidebarSection>
            </div>
          </ScrollArea>

          <div className="mt-auto flex flex-col gap-1 border-t border-[var(--border-subtle)] px-1.5 py-2">
            <SidebarNewPage collapsed={collapsed} />
            <SidebarSettings collapsed={collapsed} />
          </div>
          </SidebarUiProvider>
        </aside>

        <SidebarMoveDialog
          pageId={movePageId}
          open={moveOpen}
          onOpenChange={(open) => {
            setMoveOpen(open);
            if (!open) {
              setMovePageId(null);
            }
          }}
        />
      </SidebarActionsProvider>
    </>
  );
}
