"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { dateToPixel, pixelToDate } from "@/lib/views/timeline-utils";
import { ROW_HEIGHT_PX, type TimelineZoom } from "@/lib/types/timeline";
import type { TimelineBarData } from "@/lib/types/timeline";

interface TimelineBarProps {
  bar: TimelineBarData;
  origin: Date;
  zoom: TimelineZoom;
  rowIndex: number;
  onClick: () => void;
  onDateChange: (pageId: string, startDate: string, endDate: string) => void;
  onDependencyDragStart?: (pageId: string) => void;
  onDependencyDragEnd?: (pageId: string) => void;
  className?: string;
}

export function TimelineBar({
  bar,
  origin,
  zoom,
  rowIndex,
  onClick,
  onDateChange,
  onDependencyDragStart,
  onDependencyDragEnd,
  className,
}: TimelineBarProps): React.ReactElement | null {
  const barRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    type: "move" | "resize-start" | "resize-end";
    startX: number;
    currentX: number;
  } | null>(null);

  if (!bar.startDate) return null;

  const startPx = dateToPixel(bar.startDate, origin, zoom);
  const endPx = bar.endDate
    ? dateToPixel(bar.endDate, origin, zoom)
    : startPx + 60;
  const barWidth = Math.max(endPx - startPx, 20);

  let offsetX = 0;
  let adjustedWidth = barWidth;

  if (dragState) {
    const delta = dragState.currentX - dragState.startX;
    if (dragState.type === "move") {
      offsetX = delta;
    } else if (dragState.type === "resize-start") {
      offsetX = delta;
      adjustedWidth = barWidth - delta;
    } else if (dragState.type === "resize-end") {
      adjustedWidth = barWidth + delta;
    }
  }

  adjustedWidth = Math.max(adjustedWidth, 20);

  const top = rowIndex * ROW_HEIGHT_PX + 6;
  const height = ROW_HEIGHT_PX - 12;

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: MouseEvent): void => {
      setDragState((prev) =>
        prev ? { ...prev, currentX: e.clientX } : null
      );
    };

    const handleUp = (): void => {
      if (dragState) {
        const delta = dragState.currentX - dragState.startX;
        if (Math.abs(delta) > 2) {
          const newStartPx = dragState.type === "move"
            ? startPx + delta
            : dragState.type === "resize-start"
              ? startPx + delta
              : startPx;
          const newEndPx = dragState.type === "move"
            ? endPx + delta
            : dragState.type === "resize-end"
              ? endPx + delta
              : endPx;

          const newStart = pixelToDate(newStartPx, origin, zoom);
          const newEnd = pixelToDate(newEndPx, origin, zoom);
          onDateChange(
            bar.pageId,
            format(newStart, "yyyy-MM-dd"),
            format(newEnd, "yyyy-MM-dd")
          );
        }
      }
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragState, startPx, endPx, origin, zoom, bar.pageId, onDateChange]);

  const handleMoveStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({ type: "move", startX: e.clientX, currentX: e.clientX });
  }, []);

  const handleResizeStartLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      type: "resize-start",
      startX: e.clientX,
      currentX: e.clientX,
    });
  }, []);

  const handleResizeStartRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      type: "resize-end",
      startX: e.clientX,
      currentX: e.clientX,
    });
  }, []);

  const handleDepDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDependencyDragStart?.(bar.pageId);
    },
    [bar.pageId, onDependencyDragStart]
  );

  return (
    <div
      ref={barRef}
      data-bar-id={bar.pageId}
      className={cn(
        "group absolute flex items-center overflow-hidden rounded-[var(--radius-sm)]",
        "cursor-grab select-none",
        "transition-shadow duration-fast",
        "hover:shadow-[var(--shadow-md)]",
        dragState && "z-20 cursor-grabbing shadow-[var(--shadow-lg)]",
        className
      )}
      style={{
        left: startPx + offsetX,
        top,
        width: adjustedWidth,
        height,
        backgroundColor: `color-mix(in srgb, ${bar.colorVar} 25%, var(--bg-2))`,
        borderLeft: `3px solid ${bar.colorVar}`,
      }}
      onClick={(e) => {
        if (!dragState) {
          e.stopPropagation();
          onClick();
        }
      }}
      onMouseDown={handleMoveStart}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-w-resize opacity-0 transition-opacity duration-fast group-hover:opacity-100"
        onMouseDown={handleResizeStartLeft}
      />

      {/* Bar content */}
      <div className="flex min-w-0 flex-1 items-center gap-1 px-2">
        {bar.icon ? (
          <span className="shrink-0 text-[10px]">{bar.icon}</span>
        ) : (
          <FileText
            size={10}
            className="shrink-0 text-[var(--text-tertiary)]"
          />
        )}
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[var(--text-primary)]">
          {bar.title}
        </span>
      </div>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 z-10 h-full w-1.5 cursor-e-resize opacity-0 transition-opacity duration-fast group-hover:opacity-100"
        onMouseDown={handleResizeStartRight}
      />

      {/* Dependency drag handle (right edge circle) */}
      <div
        className={cn(
          "absolute -right-1.5 top-1/2 z-20 flex h-3 w-3 -translate-y-1/2 items-center justify-center",
          "rounded-full border border-[var(--border-strong)] bg-[var(--bg-1)]",
          "cursor-crosshair opacity-0 transition-opacity duration-fast",
          "group-hover:opacity-100"
        )}
        onMouseDown={handleDepDragStart}
        onMouseUp={() => onDependencyDragEnd?.(bar.pageId)}
      />
    </div>
  );
}
