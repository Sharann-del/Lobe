"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useSidePanelWorkspace } from "@/components/side-panel/SidePanelContext";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { cn } from "@/lib/utils";

export interface SidePanelPinnedProps {
  collapsed?: boolean;
  className?: string;
}

export function SidePanelPinned({
  collapsed,
  className,
}: SidePanelPinnedProps) {
  const { workspaceSlug } = useSidePanelWorkspace();
  const pinnedNodeIds = useSectionTreeStore((s) => s.pinnedNodeIds);
  const nodesById = useSectionTreeStore((s) => s.nodesById);

  if (collapsed) {
    return null;
  }

  const rows = pinnedNodeIds
    .map((id) => nodesById[id])
    .filter(
      (p): p is NonNullable<typeof p> =>
        p !== undefined && !p.is_deleted
    );

  if (rows.length === 0) {
    return (
      <p
        className={cn(
          "px-2 py-1 text-[12px] text-[var(--text-tertiary)]",
          className
        )}
      >
        Star pages to pin them here.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {rows.map((p) => (
        <Link
          key={p.id}
          href={`/${workspaceSlug}/${p.id}`}
          className={cn(
            "flex h-8 items-center gap-2 rounded-[var(--radius-sm)] px-2",
            "text-[13px] text-[var(--text-secondary)]",
            "transition-colors duration-fast hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]"
          )}
        >
          <Star size={16} className="shrink-0 text-[var(--text-tertiary)]" />
          <span className="min-w-0 flex-1 truncate">{p.title}</span>
        </Link>
      ))}
    </div>
  );
}
