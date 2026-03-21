"use client";

import { useCallback, useMemo, useState } from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils/cn";
import { CalendarEventBlock } from "./CalendarEventBlock";
import type { CalendarItem } from "@/lib/types/calendar";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_EVENTS = 3;

interface MonthViewProps {
  date: Date;
  items: CalendarItem[];
  onSlotClick: (date: string, time: string) => void;
  onEventClick: (item: CalendarItem) => void;
  onDayClick: (date: Date) => void;
  className?: string;
}

interface MonthWeek {
  days: MonthDay[];
}

interface MonthDay {
  date: Date;
  dateStr: string;
  inMonth: boolean;
  items: CalendarItem[];
}

export function MonthView({
  date,
  items,
  onSlotClick,
  onEventClick,
  onDayClick,
  className,
}: MonthViewProps): React.ReactElement {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const weeks = useMemo((): MonthWeek[] => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const itemsByDate = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const list = itemsByDate.get(item.date) ?? [];
      list.push(item);
      itemsByDate.set(item.date, list);
    }

    const result: MonthWeek[] = [];
    let current = calStart;

    while (current <= calEnd) {
      const week: MonthDay[] = [];
      for (let i = 0; i < 7; i++) {
        const d = addDays(current, i);
        const dateStr = format(d, "yyyy-MM-dd");
        week.push({
          date: d,
          dateStr,
          inMonth: isSameMonth(d, date),
          items: itemsByDate.get(dateStr) ?? [],
        });
      }
      result.push({ days: week });
      current = addDays(current, 7);
    }

    return result;
  }, [date, items]);

  const handleDayClick = useCallback(
    (day: MonthDay) => {
      onSlotClick(day.dateStr, "09:00");
    },
    [onSlotClick]
  );

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-[var(--border-subtle)]">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex flex-1 flex-col">
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="grid flex-1 grid-cols-7 border-b border-[var(--border-subtle)]"
          >
            {week.days.map((day) => {
              const today = isToday(day.date);
              const isExpanded = expandedDay === day.dateStr;
              const visibleItems = isExpanded
                ? day.items
                : day.items.slice(0, MAX_VISIBLE_EVENTS);
              const overflow = day.items.length - MAX_VISIBLE_EVENTS;

              return (
                <div
                  key={day.dateStr}
                  className={cn(
                    "flex min-h-[80px] flex-col border-r border-[var(--border-subtle)] p-0.5",
                    "cursor-pointer transition-colors duration-fast",
                    "hover:bg-[var(--bg-2)]",
                    !day.inMonth && "opacity-40"
                  )}
                  onClick={() => handleDayClick(day)}
                >
                  {/* Day number */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayClick(day.date);
                    }}
                    className={cn(
                      "mb-0.5 flex h-6 w-6 items-center justify-center self-end rounded-full text-xs",
                      "transition-colors duration-fast",
                      today
                        ? "bg-[var(--accent)] font-semibold text-[var(--bg-0)]"
                        : "font-medium text-[var(--text-primary)] hover:bg-[var(--bg-3)]"
                    )}
                  >
                    {format(day.date, "d")}
                  </button>

                  {/* Events */}
                  <div className="flex flex-col gap-px">
                    {visibleItems.map((item) => (
                      <CalendarEventBlock
                        key={item.id}
                        item={item}
                        onClick={() => onEventClick(item)}
                        variant="bar"
                      />
                    ))}
                    {!isExpanded && overflow > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDay(day.dateStr);
                        }}
                        className="px-1 text-left text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        +{overflow} more
                      </button>
                    )}
                    {isExpanded && overflow > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDay(null);
                        }}
                        className="px-1 text-left text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        Show less
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
