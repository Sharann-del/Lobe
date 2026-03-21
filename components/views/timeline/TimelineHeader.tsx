"use client";

import { cn } from "@/lib/utils/cn";
import {
  COLUMN_WIDTH_PX,
  HEADER_HEIGHT_PX,
  type TimelineZoom,
} from "@/lib/types/timeline";
import type {
  TimelineColumn,
  TimelineHeaderGroup,
} from "@/lib/views/timeline-utils";

interface TimelineHeaderProps {
  columns: TimelineColumn[];
  groups: TimelineHeaderGroup[];
  zoom: TimelineZoom;
  className?: string;
}

export function TimelineHeader({
  columns,
  groups,
  zoom,
  className,
}: TimelineHeaderProps): React.ReactElement {
  const colWidth = COLUMN_WIDTH_PX[zoom];

  return (
    <div
      className={cn(
        "sticky top-0 z-20 border-b border-[var(--border-default)] bg-[var(--bg-1)]",
        className
      )}
      style={{ height: HEADER_HEIGHT_PX }}
    >
      {/* Top row: grouped labels */}
      <div className="flex h-1/2">
        {groups.map((g, i) => (
          <div
            key={`${g.label}-${i}`}
            className="flex items-center justify-center border-b border-r border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--text-secondary)]"
            style={{ width: g.span * colWidth }}
          >
            {g.label}
          </div>
        ))}
      </div>

      {/* Bottom row: individual columns */}
      <div className="flex h-1/2">
        {columns.map((col, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col items-center justify-center border-r border-[var(--border-subtle)]",
              col.isToday && "bg-[var(--accent-muted)]",
              col.isWeekend && "bg-[var(--bg-2)]"
            )}
            style={{ width: colWidth }}
          >
            <span className="text-[10px] font-medium text-[var(--text-primary)]">
              {col.label}
            </span>
            {col.subLabel && (
              <span className="text-[8px] text-[var(--text-tertiary)]">
                {col.subLabel}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
