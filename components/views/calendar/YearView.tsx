"use client";

import { useMemo } from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils/cn";
import type { CalendarItem } from "@/lib/types/calendar";

const MINI_DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

interface YearViewProps {
  year: number;
  items: CalendarItem[];
  onDayClick: (date: Date) => void;
  className?: string;
}

export function YearView({
  year,
  items,
  onDayClick,
  className,
}: YearViewProps): React.ReactElement {
  const eventDates = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      set.add(item.date);
    }
    return set;
  }, [items]);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)),
    [year]
  );

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-6 overflow-y-auto p-6 lg:grid-cols-4",
        className
      )}
    >
      {months.map((monthDate) => (
        <MiniMonth
          key={monthDate.getMonth()}
          monthDate={monthDate}
          eventDates={eventDates}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  );
}

function MiniMonth({
  monthDate,
  eventDates,
  onDayClick,
}: {
  monthDate: Date;
  eventDates: Set<string>;
  onDayClick: (date: Date) => void;
}): React.ReactElement {
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const result: Date[][] = [];
    let current = calStart;
    while (current <= calEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(addDays(current, i));
      }
      result.push(week);
      current = addDays(current, 7);
    }
    return result;
  }, [monthDate]);

  return (
    <div className="flex flex-col">
      {/* Month label */}
      <span className="mb-2 text-xs font-semibold text-[var(--text-primary)]">
        {format(monthDate, "MMMM")}
      </span>

      {/* Day headers */}
      <div className="mb-0.5 grid grid-cols-7 gap-0">
        {MINI_DAY_NAMES.map((name, i) => (
          <span
            key={i}
            className="text-center text-[9px] text-[var(--text-tertiary)]"
          >
            {name}
          </span>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-0">
          {week.map((day) => {
            const inMonth = isSameMonth(day, monthDate);
            const today = isToday(day);
            const dateStr = format(day, "yyyy-MM-dd");
            const hasEvent = eventDates.has(dateStr);

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onDayClick(day)}
                className={cn(
                  "relative flex h-6 w-full items-center justify-center text-[10px]",
                  "transition-colors duration-fast",
                  inMonth
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)] opacity-40",
                  today && "font-bold",
                  "hover:bg-[var(--bg-3)] rounded-[var(--radius-sm)]"
                )}
              >
                {today ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg-0)]">
                    {format(day, "d")}
                  </span>
                ) : (
                  format(day, "d")
                )}
                {hasEvent && !today && (
                  <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
