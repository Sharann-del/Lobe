"use client";

import { useMemo } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { TimeGrid, type TimeGridColumn } from "./TimeGrid";
import type { CalendarItem } from "@/lib/types/calendar";

interface WeekViewProps {
  date: Date;
  items: CalendarItem[];
  onSlotClick: (date: string, time: string) => void;
  onEventClick: (item: CalendarItem) => void;
  onEventDrop?: (itemId: string, newDate: string, newTime: string) => void;
  onEventResize?: (itemId: string, newEndTime: string) => void;
  className?: string;
}

export function WeekView({
  date,
  items,
  onSlotClick,
  onEventClick,
  onEventDrop,
  onEventResize,
  className,
}: WeekViewProps): React.ReactElement {
  const columns = useMemo((): TimeGridColumn[] => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dayItems = items.filter((item) => item.date === dateStr);
      return {
        date: d,
        dateStr,
        label: format(d, "EEE d"),
        items: dayItems.filter((item) => !item.isAllDay),
        allDayItems: dayItems.filter((item) => item.isAllDay),
      };
    });
  }, [date, items]);

  return (
    <TimeGrid
      columns={columns}
      onSlotClick={onSlotClick}
      onEventClick={onEventClick}
      onEventDrop={onEventDrop}
      onEventResize={onEventResize}
      className={className}
    />
  );
}
