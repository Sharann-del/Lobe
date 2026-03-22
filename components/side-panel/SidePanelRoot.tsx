"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNodesRealtime } from "@/lib/hooks/useNodesRealtime";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import type { NodeRow } from "@/lib/types/nodes";
import { SidePanelActionsProvider } from "@/components/side-panel/side-panel-actions-context";
import { SidePanelPinned } from "@/components/side-panel/SidePanelPinned";
import {
  SidePanelHeader,
  type SidePanelWorkspaceOption,
} from "@/components/side-panel/SidePanelHeader";
import { SidePanelMoveDialog } from "@/components/side-panel/SidePanelMoveDialog";
import { SidePanelNewArticle } from "@/components/side-panel/SidePanelNewArticle";
import { SidePanelNodeTree } from "@/components/side-panel/SidePanelNodeTree";
import { SidePanelPrivate } from "@/components/side-panel/SidePanelPrivate";
import { SidePanelSearch } from "@/components/side-panel/SidePanelSearch";
import { SidePanelSection } from "@/components/side-panel/SidePanelSection";
import { SidePanelSettings } from "@/components/side-panel/SidePanelSettings";
import { SidePanelShared } from "@/components/side-panel/SidePanelShared";
import { SidePanelTrash } from "@/components/side-panel/SidePanelTrash";
import { SidePanelUiProvider } from "@/components/side-panel/side-panel-ui-context";
import { SidePanelReminders } from "@/components/reminders/SidePanelReminders";
import { ScrollArea } from "@/components/ui";
import { useRemindersStore } from "@/lib/stores/remindersStore";
import { useRemindersRealtime } from "@/lib/hooks/useRemindersRealtime";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "lobe-sidebar-collapsed";

export interface SidePanelRootProps {
  workspaces: SidePanelWorkspaceOption[];
  activeWorkspaceId: string;
  userId: string;
  onWorkspaceChange?: (_workspaceId: string) => void;
  onCreateWorkspace?: () => void;
  className?: string;
}

export function SidePanelRoot({
  workspaces,
  activeWorkspaceId,
  userId: _userId,
  onWorkspaceChange,
  onCreateWorkspace,
  className,
}: SidePanelRootProps) {
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
    useSectionTreeStore.getState().setWorkspaceId(activeWorkspaceId);
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
        console.error("SidePanelRoot: failed to load pages", error.message);
        return;
      }
      useSectionTreeStore.getState().hydrateFromNodes((data ?? []) as NodeRow[]);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId]);

  useNodesRealtime(activeWorkspaceId);

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
      <SidePanelActionsProvider value={{ openMoveDialog }}>
        <aside
          className={cn(
            "flex h-full shrink-0 flex-col overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--bg-1)]",
            "transition-[width] duration-default ease-out",
            collapsed ? "w-[52px]" : "w-[240px]",
            className
          )}
          data-collapsed={collapsed ? "true" : "false"}
        >
          <SidePanelUiProvider collapsed={collapsed}>
          <SidePanelHeader
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
                <SidePanelSearch onTrigger={() => undefined} collapsed={false} />
              )}
              {collapsed && (
                <SidePanelSearch collapsed className="justify-center" />
              )}

              <SidePanelSection
                label="Pinned"
                storageKey="pinned"
                collapsed={collapsed}
              >
                <SidePanelPinned collapsed={collapsed} />
              </SidePanelSection>

              <SidePanelSection
                label="Reminders"
                storageKey="reminders"
                collapsed={collapsed}
              >
                <SidePanelReminders collapsed={collapsed} />
              </SidePanelSection>

              <SidePanelSection
                label="Private"
                storageKey="private"
                collapsed={collapsed}
              >
                <SidePanelPrivate collapsed={collapsed} />
              </SidePanelSection>

              <SidePanelSection
                label="Shared"
                storageKey="shared"
                defaultOpen={false}
                collapsed={collapsed}
              >
                <SidePanelShared collapsed={collapsed} />
              </SidePanelSection>

              <SidePanelSection label="Articles" storageKey="articles" collapsed={collapsed}>
                <SidePanelNodeTree />
              </SidePanelSection>

              <SidePanelSection
                label="Trash"
                storageKey="trash"
                defaultOpen={false}
                collapsed={collapsed}
              >
                <SidePanelTrash collapsed={collapsed} />
              </SidePanelSection>
            </div>
          </ScrollArea>

          <div className="mt-auto flex flex-col gap-1 border-t border-[var(--border-subtle)] px-1.5 py-2">
            <SidePanelNewArticle collapsed={collapsed} />
            <SidePanelSettings collapsed={collapsed} />
          </div>
          </SidePanelUiProvider>
        </aside>

        <SidePanelMoveDialog
          pageId={movePageId}
          open={moveOpen}
          onOpenChange={(open) => {
            setMoveOpen(open);
            if (!open) {
              setMovePageId(null);
            }
          }}
        />
      </SidePanelActionsProvider>
    </>
  );
}
