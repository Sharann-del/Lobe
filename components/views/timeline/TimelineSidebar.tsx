"use client";

import { ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ROW_HEIGHT_PX, SIDEBAR_WIDTH_PX } from "@/lib/types/timeline";
import type { TimelineBarData } from "@/lib/types/timeline";

interface TimelineSidebarGroup {
  key: string;
  label: string;
  collapsed: boolean;
  bars: TimelineBarData[];
}

interface TimelineSidebarProps {
  groups: TimelineSidebarGroup[] | null;
  flatBars: TimelineBarData[];
  onToggleGroup: (key: string) => void;
  onOpenPage: (pageId: string) => void;
  className?: string;
}

export function TimelineSidebar({
  groups,
  flatBars,
  onToggleGroup,
  onOpenPage,
  className,
}: TimelineSidebarProps): React.ReactElement {
  return (
    <div
      className={cn(
        "shrink-0 overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--bg-1)]",
        className
      )}
      style={{ width: SIDEBAR_WIDTH_PX }}
    >
      {groups
        ? groups.map((group) => (
            <div key={group.key}>
              {/* Group header */}
              <button
                type="button"
                onClick={() => onToggleGroup(group.key)}
                className={cn(
                  "flex w-full items-center gap-1.5 px-2",
                  "text-left text-[11px] font-semibold uppercase tracking-wide",
                  "text-[var(--text-secondary)]",
                  "transition-colors duration-fast hover:bg-[var(--bg-2)]"
                )}
                style={{ height: ROW_HEIGHT_PX }}
              >
                <ChevronRight
                  size={12}
                  className={cn(
                    "shrink-0 transition-transform duration-fast",
                    !group.collapsed && "rotate-90"
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{group.label}</span>
                <span className="shrink-0 text-[10px] text-[var(--text-tertiary)]">
                  {group.bars.length}
                </span>
              </button>

              {/* Group rows */}
              {!group.collapsed &&
                group.bars.map((bar) => (
                  <SidebarRow
                    key={bar.pageId}
                    bar={bar}
                    onOpen={() => onOpenPage(bar.pageId)}
                  />
                ))}
            </div>
          ))
        : flatBars.map((bar) => (
            <SidebarRow
              key={bar.pageId}
              bar={bar}
              onOpen={() => onOpenPage(bar.pageId)}
            />
          ))}
    </div>
  );
}

function SidebarRow({
  bar,
  onOpen,
}: {
  bar: TimelineBarData;
  onOpen: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-1.5 px-3",
        "text-left text-xs text-[var(--text-primary)]",
        "transition-colors duration-fast hover:bg-[var(--bg-2)]"
      )}
      style={{ height: ROW_HEIGHT_PX }}
    >
      {bar.icon ? (
        <span className="shrink-0 text-sm">{bar.icon}</span>
      ) : (
        <FileText size={12} className="shrink-0 text-[var(--text-tertiary)]" />
      )}
      <span className="min-w-0 flex-1 truncate">{bar.title}</span>
    </button>
  );
}

export type { TimelineSidebarGroup };
