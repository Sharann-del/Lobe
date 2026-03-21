"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Tooltip, TooltipProvider } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import {
  CALENDAR_VIEWS,
  CALENDAR_VIEW_LABELS,
  type CalendarViewType,
} from "@/lib/types/calendar";

interface CalendarBaseProps {
  rangeLabel: string;
  activeView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  className?: string;
}

export function CalendarBase({
  rangeLabel,
  activeView,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  className,
}: CalendarBaseProps): React.ReactElement {
  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-1.5",
          className
        )}
      >
        {/* Navigation */}
        <div className="flex items-center gap-0.5">
          <Tooltip content="Previous">
            <Button variant="ghost" size="sm" onClick={onPrev}>
              <ChevronLeft size={16} />
            </Button>
          </Tooltip>
          <Tooltip content="Next">
            <Button variant="ghost" size="sm" onClick={onNext}>
              <ChevronRight size={16} />
            </Button>
          </Tooltip>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToday}
          className="text-xs"
        >
          Today
        </Button>

        {/* Date range label */}
        <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--text-primary)]">
          {rangeLabel}
        </span>

        {/* View switcher */}
        <div className="flex items-center rounded-[var(--radius-md)] bg-[var(--bg-2)] p-0.5">
          {CALENDAR_VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => onViewChange(view)}
              className={cn(
                "rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium",
                "transition-all duration-fast",
                activeView === view
                  ? "bg-[var(--bg-4)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {CALENDAR_VIEW_LABELS[view]}
            </button>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
