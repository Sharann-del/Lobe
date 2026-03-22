"use client";

import { useCallback, useEffect } from "react";
import {
  Activity,
  Brain,
  Clock,
  Globe,
  ListTree,
  Map,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useSidePanelWorkspace } from "@/components/side-panel/SidePanelContext";
import { useWorkspaceViewStore } from "@/lib/stores/workspaceViewStore";
import {
  WORKSPACE_VIEW_LABELS,
  WORKSPACE_VIEW_TYPES,
  type WorkspaceViewType,
} from "@/lib/types/workspace-views";
import { cn } from "@/lib/utils";

const VIEW_ICONS: Record<WorkspaceViewType, LucideIcon> = {
  space: Globe,
  time: Clock,
  mind: Brain,
  tree: ListTree,
  focus: Target,
  atlas: Map,
  pulse: Activity,
};

export function WorkspaceViewBar({
  className,
}: {
  className?: string;
}): React.ReactElement {
  const { workspaceName } = useSidePanelWorkspace();
  const activeView = useWorkspaceViewStore((s) => s.activeView);
  const setActiveView = useWorkspaceViewStore((s) => s.setActiveView);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      const n = Number.parseInt(e.key, 10);
      if (Number.isNaN(n) || n < 1 || n > 7) return;
      e.preventDefault();
      const view = WORKSPACE_VIEW_TYPES[n - 1];
      if (view) setActiveView(view);
    },
    [setActiveView]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <header
      className={cn(
        "flex h-10 shrink-0 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-1)] px-3",
        className
      )}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <span className="truncate text-sm font-medium text-[var(--text-primary)]">
          Lobe
        </span>
        <span className="truncate text-xs text-[var(--text-tertiary)]">
          / {workspaceName}
        </span>
      </div>

      <nav
        className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto"
        aria-label="Workspace views"
      >
        {WORKSPACE_VIEW_TYPES.map((view) => {
          const isActive = activeView === view;
          const Icon = VIEW_ICONS[view];
          return (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1.5",
                "text-xs font-medium transition-colors duration-fast",
                isActive
                  ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-2)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon
                size={14}
                className={cn(
                  "shrink-0",
                  isActive
                    ? "text-[var(--text-secondary)]"
                    : "text-[var(--text-tertiary)]"
                )}
                aria-hidden
              />
              {WORKSPACE_VIEW_LABELS[view]}
            </button>
          );
        })}
      </nav>

      <div className="w-24 shrink-0" aria-hidden />
    </header>
  );
}
