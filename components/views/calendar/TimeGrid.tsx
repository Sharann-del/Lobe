"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { CalendarEventBlock } from "./CalendarEventBlock";
import {
  HOURS,
  HOUR_HEIGHT_PX,
  formatHourLabel,
  minutesToPx,
  timeToMinutes,
  type CalendarItem,
} from "@/lib/types/calendar";

interface TimeGridColumn {
  date: Date;
  dateStr: string;
  label: string;
  items: CalendarItem[];
  allDayItems: CalendarItem[];
}

interface TimeGridProps {
  columns: TimeGridColumn[];
  onSlotClick: (date: string, time: string) => void;
  onEventClick: (item: CalendarItem) => void;
  onEventDrop?: (itemId: string, newDate: string, newTime: string) => void;
  onEventResize?: (itemId: string, newEndTime: string) => void;
  className?: string;
}

export function TimeGrid({
  columns,
  onSlotClick,
  onEventClick,
  onEventDrop,
  onEventResize,
  className,
}: TimeGridProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nowMinutes, setNowMinutes] = useState(getCurrentMinutes);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const scrollTo = Math.max(0, minutesToPx(nowMinutes) - 200);
      el.scrollTop = scrollTo;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMinutes(getCurrentMinutes());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleSlotClick = useCallback(
    (dateStr: string, hour: number) => {
      const time = `${String(hour).padStart(2, "0")}:00`;
      onSlotClick(dateStr, time);
    },
    [onSlotClick]
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent, item: CalendarItem) => {
      e.preventDefault();
      e.stopPropagation();
      const startY = e.clientY;
      setDragState({
        itemId: item.id,
        originalDate: item.date,
        originalTime: item.startTime ?? "00:00",
        startY,
        currentY: startY,
      });
    },
    []
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, item: CalendarItem) => {
      e.preventDefault();
      e.stopPropagation();
      setResizeState({
        itemId: item.id,
        startY: e.clientY,
        currentY: e.clientY,
        originalEndMinutes: item.endTime
          ? timeToMinutes(item.endTime)
          : timeToMinutes(item.startTime ?? "00:00") + 60,
      });
    },
    []
  );

  useEffect(() => {
    if (!dragState && !resizeState) return;

    const handleMove = (e: MouseEvent): void => {
      if (dragState) {
        setDragState((prev) =>
          prev ? { ...prev, currentY: e.clientY } : null
        );
      }
      if (resizeState) {
        setResizeState((prev) =>
          prev ? { ...prev, currentY: e.clientY } : null
        );
      }
    };

    const handleUp = (e: MouseEvent): void => {
      if (dragState && onEventDrop) {
        const deltaY = dragState.currentY - dragState.startY;
        const deltaMinutes = Math.round(deltaY / (HOUR_HEIGHT_PX / 60));
        const snapped = snapTo15(
          timeToMinutes(dragState.originalTime) + deltaMinutes
        );
        const newTime = minutesToTimeStr(snapped);
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const dateContainer =
          target instanceof HTMLElement
            ? target.closest<HTMLElement>("[data-timegrid-date]")
            : null;
        const newDate = dateContainer?.dataset.timegridDate ?? dragState.originalDate;
        onEventDrop(dragState.itemId, newDate, newTime);
      }
      if (resizeState && onEventResize) {
        const deltaY = resizeState.currentY - resizeState.startY;
        const deltaMinutes = Math.round(deltaY / (HOUR_HEIGHT_PX / 60));
        const snapped = snapTo15(
          resizeState.originalEndMinutes + deltaMinutes
        );
        const newEnd = minutesToTimeStr(Math.max(snapped, 15));
        onEventResize(resizeState.itemId, newEnd);
      }
      setDragState(null);
      setResizeState(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragState, resizeState, onEventDrop, onEventResize]);

  const hasAllDay = columns.some((c) => c.allDayItems.length > 0);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Column headers */}
      <div className="flex border-b border-[var(--border-subtle)]">
        <div className="w-14 shrink-0" />
        {columns.map((col) => {
          const today = isToday(col.date);
          return (
            <div
              key={col.dateStr}
              className={cn(
                "flex flex-1 flex-col items-center py-1.5",
                "border-l border-[var(--border-subtle)]"
              )}
            >
              <span className="text-[10px] font-medium uppercase text-[var(--text-tertiary)]">
                {format(col.date, "EEE")}
              </span>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  today
                    ? "bg-[var(--accent)] text-[var(--bg-0)]"
                    : "text-[var(--text-primary)]"
                )}
              >
                {format(col.date, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {hasAllDay && (
        <div className="flex border-b border-[var(--border-subtle)]">
          <div className="flex w-14 shrink-0 items-center justify-end pr-2">
            <span className="text-[10px] text-[var(--text-tertiary)]">
              All day
            </span>
          </div>
          {columns.map((col) => (
            <div
              key={`allday-${col.dateStr}`}
              className="flex flex-1 flex-col gap-0.5 border-l border-[var(--border-subtle)] p-0.5"
            >
              {col.allDayItems.map((item) => (
                <CalendarEventBlock
                  key={item.id}
                  item={item}
                  onClick={() => onEventClick(item)}
                  variant="bar"
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Time grid body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="relative flex" style={{ height: 24 * HOUR_HEIGHT_PX }}>
          {/* Hour labels */}
          <div className="relative w-14 shrink-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)]"
                style={{ top: hour * HOUR_HEIGHT_PX }}
              >
                {hour > 0 ? formatHourLabel(hour) : ""}
              </div>
            ))}
          </div>

          {/* Columns */}
          {columns.map((col) => (
            <TimeGridColumnSlots
              key={col.dateStr}
              column={col}
              dragState={dragState}
              resizeState={resizeState}
              onSlotClick={handleSlotClick}
              onEventClick={onEventClick}
              onDragStart={handleDragStart}
              onResizeStart={handleResizeStart}
            />
          ))}

          {/* Current time indicator */}
          {columns.some((c) => isToday(c.date)) && (
            <CurrentTimeIndicator
              nowMinutes={nowMinutes}
              columns={columns}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TimeGridColumnSlots({
  column,
  dragState,
  resizeState,
  onSlotClick,
  onEventClick,
  onDragStart,
  onResizeStart,
}: {
  column: TimeGridColumn;
  dragState: DragState | null;
  resizeState: ResizeState | null;
  onSlotClick: (dateStr: string, hour: number) => void;
  onEventClick: (item: CalendarItem) => void;
  onDragStart: (e: React.MouseEvent, item: CalendarItem) => void;
  onResizeStart: (e: React.MouseEvent, item: CalendarItem) => void;
}): React.ReactElement {
  const timedItems = column.items.filter((i) => !i.isAllDay);

  return (
    <div
      className="relative flex-1 border-l border-[var(--border-subtle)]"
      data-timegrid-date={column.dateStr}
    >
      {/* Hour slot backgrounds */}
      {HOURS.map((hour) => (
        <div
          key={hour}
          className={cn(
            "absolute left-0 right-0 cursor-pointer border-b border-[var(--border-subtle)]",
            "transition-colors duration-fast hover:bg-[var(--bg-2)]"
          )}
          style={{
            top: hour * HOUR_HEIGHT_PX,
            height: HOUR_HEIGHT_PX,
          }}
          onClick={() => onSlotClick(column.dateStr, hour)}
        >
          <div
            className="absolute left-0 right-0 border-b border-dotted border-[var(--border-subtle)]"
            style={{ top: HOUR_HEIGHT_PX / 2 }}
          />
        </div>
      ))}

      {/* Timed events */}
      {timedItems.map((item) => {
        const startMin = item.startTime
          ? timeToMinutes(item.startTime)
          : 0;
        const endMin = item.endTime
          ? timeToMinutes(item.endTime)
          : startMin + 60;
        const top = minutesToPx(startMin);
        let height = minutesToPx(endMin - startMin);

        const isDragging = dragState?.itemId === item.id;
        const isResizing = resizeState?.itemId === item.id;

        let dragOffset = 0;
        if (isDragging && dragState) {
          dragOffset = dragState.currentY - dragState.startY;
        }

        let resizeExtra = 0;
        if (isResizing && resizeState) {
          resizeExtra = resizeState.currentY - resizeState.startY;
        }

        height = Math.max(height + resizeExtra, minutesToPx(15));

        return (
          <div
            key={item.id}
            className="absolute left-0 right-0"
            style={{
              top: top + dragOffset,
              height,
              zIndex: isDragging || isResizing ? 20 : 10,
            }}
          >
            <CalendarEventBlock
              item={item}
              onClick={() => onEventClick(item)}
              variant="timed"
              style={{ height: "100%" }}
              className={cn(
                "cursor-grab",
                isDragging && "cursor-grabbing opacity-80 shadow-[var(--shadow-lg)]"
              )}
            />
            {/* Drag handle (whole event) */}
            <div
              className="absolute inset-0 cursor-grab"
              onMouseDown={(e) => onDragStart(e, item)}
            />
            {/* Resize handle (bottom edge) */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-2 cursor-s-resize",
                "opacity-0 transition-opacity duration-fast",
                "hover:opacity-100"
              )}
              onMouseDown={(e) => onResizeStart(e, item)}
            >
              <div className="mx-auto mt-0.5 h-1 w-8 rounded-full bg-[var(--border-strong)]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CurrentTimeIndicator({
  nowMinutes,
  columns,
}: {
  nowMinutes: number;
  columns: TimeGridColumn[];
}): React.ReactElement | null {
  const todayIdx = columns.findIndex((c) => isToday(c.date));
  if (todayIdx < 0) return null;

  const top = minutesToPx(nowMinutes);
  const colCount = columns.length;
  const leftPercent = ((todayIdx) / colCount) * 100;
  const widthPercent = (1 / colCount) * 100;

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        top,
        left: `calc(56px + ${leftPercent}%)`,
        width: `${widthPercent}%`,
      }}
    >
      <div className="relative flex items-center">
        <div className="h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[var(--color-red)]" />
        <div className="h-px flex-1 bg-[var(--color-red)]" />
      </div>
    </div>
  );
}

interface DragState {
  itemId: string;
  originalDate: string;
  originalTime: string;
  startY: number;
  currentY: number;
}

interface ResizeState {
  itemId: string;
  startY: number;
  currentY: number;
  originalEndMinutes: number;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function snapTo15(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

function minutesToTimeStr(minutes: number): string {
  const clamped = Math.max(0, Math.min(minutes, 23 * 60 + 45));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type { TimeGridColumn };
