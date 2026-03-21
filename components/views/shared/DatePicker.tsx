"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  eachDayOfInterval,
} from "date-fns";
import { cn } from "@/lib/utils/cn";

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  endDate?: Date | null;
  onEndDateChange?: (date: Date | null) => void;
  showEndDate?: boolean;
  className?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  value,
  onChange,
  endDate,
  onEndDateChange,
  showEndDate = false,
  className,
}: DatePickerProps): React.ReactElement {
  const [viewMonth, setViewMonth] = useState(
    () => value ?? new Date()
  );
  const [selectingEnd, setSelectingEnd] = useState(false);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewMonth]);

  const handleDayClick = useCallback(
    (day: Date) => {
      if (showEndDate && selectingEnd) {
        onEndDateChange?.(day);
        setSelectingEnd(false);
      } else {
        onChange(day);
        if (showEndDate) setSelectingEnd(true);
      }
    },
    [showEndDate, selectingEnd, onChange, onEndDateChange]
  );

  const isInRange = useCallback(
    (day: Date): boolean => {
      if (!value || !endDate) return false;
      return day >= value && day <= endDate;
    },
    [value, endDate]
  );

  return (
    <div className={cn("w-64 select-none", className)}>
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="rounded-[var(--radius-sm)] p-1 transition-colors duration-fast hover:bg-[var(--bg-3)]"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="rounded-[var(--radius-sm)] p-1 transition-colors duration-fast hover:bg-[var(--bg-3)]"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="flex h-7 items-center justify-center text-[10px] font-medium text-[var(--text-tertiary)]"
          >
            {d}
          </div>
        ))}

        {days.map((day, i) => {
          const inMonth = isSameMonth(day, viewMonth);
          const selected = value && isSameDay(day, value);
          const selectedEnd = endDate && isSameDay(day, endDate);
          const today = isToday(day);
          const inRange = isInRange(day);

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(day)}
              className={cn(
                "flex h-7 w-full items-center justify-center rounded-[var(--radius-sm)] text-xs",
                "transition-colors duration-fast",
                !inMonth && "text-[var(--text-placeholder)]",
                inMonth && "text-[var(--text-primary)]",
                today && !selected && "font-semibold text-[var(--accent)]",
                inRange && "bg-[var(--accent)]/10",
                (selected || selectedEnd) &&
                  "bg-[var(--accent)] text-white font-medium",
                !(selected || selectedEnd) && "hover:bg-[var(--bg-3)]"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-2">
        <button
          type="button"
          onClick={() => onChange(new Date())}
          className="text-xs text-[var(--accent)] transition-colors duration-fast hover:underline"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            onEndDateChange?.(null);
          }}
          className="text-xs text-[var(--text-tertiary)] transition-colors duration-fast hover:underline"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
