"use client";

import { WORKSPACE_VIEW_LABELS } from "@/lib/types/workspace-views";
import type { WorkspaceViewSharedProps } from "./workspace-view-shared";
import { cn } from "@/lib/utils";

export default function TreeWorkspaceView({
  className,
}: WorkspaceViewSharedProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-8",
        "text-center text-sm text-[var(--text-secondary)]",
        className
      )}
    >
      <p className="font-medium text-[var(--text-primary)]">
        {WORKSPACE_VIEW_LABELS.tree}
      </p>
      <p className="max-w-md text-xs text-[var(--text-tertiary)]">
        Workspace view placeholder — outline (Task 3.4).
      </p>
    </div>
  );
}
