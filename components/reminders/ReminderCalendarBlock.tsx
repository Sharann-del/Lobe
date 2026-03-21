"use client";

import { useCallback, useState } from "react";
import { Check, GripVertical, Repeat } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useRemindersStore } from "@/lib/stores/remindersStore";
import {
  reminderColorVar,
  reminderColorMutedVar,
  type ReminderColor,
} from "@/lib/types/reminders";
import type { ReminderOccurrence } from "@/lib/types/reminders";

interface ReminderCalendarBlockProps {
  occurrence: ReminderOccurrence;
  compact?: boolean;
  onEdit?: (eventId: string) => void;
  onDragStart?: (eventId: string, occurrenceDate: string) => void;
  className?: string;
}

export function ReminderCalendarBlock({
  occurrence,
  compact = false,
  onEdit,
  onDragStart,
  className,
}: ReminderCalendarBlockProps): React.ReactElement {
  const { event, occurrenceDate } = occurrence;
  const toggleChecked = useRemindersStore((s) => s.toggleChecked);
  const [pressing, setPressing] = useState(false);

  const handleCheck = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      void toggleChecked(event.id);
    },
    [event.id, toggleChecked]
  );

  const handleClick = useCallback(() => {
    onEdit?.(event.id);
  }, [event.id, onEdit]);

  const handleDragStart = useCallback(() => {
    onDragStart?.(event.id, occurrenceDate);
  }, [event.id, occurrenceDate, onDragStart]);

  const color = event.color as ReminderColor;
  const timeLabel = formatTimeRange(event.start_time, event.end_time);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.12 }}
      draggable
      onDragStart={handleDragStart}
      onMouseDown={() => setPressing(true)}
      onMouseUp={() => setPressing(false)}
      onMouseLeave={() => setPressing(false)}
      onClick={handleClick}
      className={cn(
        "group relative flex items-center gap-1.5 rounded-[var(--radius-sm)] px-1.5",
        "cursor-pointer select-none",
        "transition-colors duration-fast",
        "hover:bg-[var(--bg-3)]",
        pressing && "scale-[0.98]",
        compact ? "py-0.5" : "py-1",
        className
      )}
      style={{
        borderLeft: `3px solid ${reminderColorVar(color)}`,
        backgroundColor: event.is_checked
          ? "transparent"
          : reminderColorMutedVar(color),
      }}
    >
      <button
        type="button"
        onClick={handleCheck}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border",
          "transition-colors duration-fast",
          event.is_checked
            ? "border-[var(--border-strong)] bg-[var(--bg-4)]"
            : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
        )}
        style={
          event.is_checked
            ? { borderColor: reminderColorVar(color), backgroundColor: reminderColorVar(color) }
            : undefined
        }
        aria-label={event.is_checked ? "Uncheck reminder" : "Check reminder"}
      >
        {event.is_checked && <Check size={10} className="text-white" />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "truncate text-xs font-medium",
            event.is_checked
              ? "text-[var(--text-tertiary)] line-through"
              : "text-[var(--text-primary)]"
          )}
        >
          {event.title || "Untitled"}
        </span>
        {!compact && timeLabel && (
          <span className="truncate text-[10px] text-[var(--text-secondary)]">
            {timeLabel}
          </span>
        )}
      </div>

      {event.recurrence_rule && (
        <Repeat
          size={10}
          className="shrink-0 text-[var(--text-tertiary)]"
        />
      )}

      <GripVertical
        size={12}
        className={cn(
          "shrink-0 text-[var(--text-tertiary)] opacity-0",
          "transition-opacity duration-fast group-hover:opacity-100"
        )}
      />
    </motion.div>
  );
}

function formatTimeRange(
  start: string | null,
  end: string | null
): string | null {
  if (!start) return null;
  const s = formatTime(start);
  if (!end) return s;
  return `${s} – ${formatTime(end)}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (h === undefined || m === undefined) return time;
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}
