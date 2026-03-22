"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useGridViewStore } from "@/lib/stores/gridViewStore";
import { Badge, type BadgeColor } from "@/components/ui";

interface TableGroupHeaderProps {
  groupKey: string;
  label: string;
  count: number;
  color?: BadgeColor;
  collapsed: boolean;
  className?: string;
}

export function TableGroupHeader({
  groupKey,
  label,
  count,
  color,
  collapsed,
  className,
}: TableGroupHeaderProps): React.ReactElement {
  const toggleGroupCollapsed = useGridViewStore((s) => s.toggleGroupCollapsed);

  return (
    <button
      type="button"
      onClick={() => toggleGroupCollapsed(groupKey)}
      className={cn(
        "flex w-full items-center gap-2 border-b border-[var(--border-subtle)]",
        "bg-[var(--bg-2)] px-3 py-1.5",
        "transition-colors duration-fast hover:bg-[var(--bg-3)]",
        className
      )}
    >
      <ChevronRight
        size={14}
        className={cn(
          "shrink-0 text-[var(--text-tertiary)] transition-transform duration-fast",
          !collapsed && "rotate-90"
        )}
      />
      {color ? (
        <Badge color={color}>{label}</Badge>
      ) : (
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {label || "No value"}
        </span>
      )}
      <span className="text-xs text-[var(--text-tertiary)]">{count}</span>
    </button>
  );
}
