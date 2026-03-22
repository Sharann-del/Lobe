"use client";

import { Users } from "lucide-react";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { cn } from "@/lib/utils";

export interface SidePanelSharedProps {
  collapsed?: boolean;
  className?: string;
}

/** Placeholder until shared/collab tables back this list. */
export function SidePanelShared({
  collapsed,
  className,
}: SidePanelSharedProps) {
  const sharedNodeIds = useSectionTreeStore((s) => s.sharedNodeIds);

  if (collapsed) {
    return null;
  }

  if (sharedNodeIds.length === 0) {
    return (
      <p
        className={cn(
          "flex items-start gap-2 px-2 py-1 text-[12px] text-[var(--text-tertiary)]",
          className
        )}
      >
        <Users
          size={16}
          className="mt-0.5 shrink-0 text-[var(--text-tertiary)]"
        />
        Nothing shared with you yet.
      </p>
    );
  }

  return null;
}
