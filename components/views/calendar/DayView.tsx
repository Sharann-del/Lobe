"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { TimeGrid, type TimeGridColumn } from "./TimeGrid";
import type { CalendarItem } from "@/lib/types/calendar";

interface DayViewProps {
  date: Date;
  items: CalendarItem[];
  onSlotClick: (date: string, time: string) => void;
  onEventClick: (item: CalendarItem) => void;
  onEventDrop?: (itemId: string, newDate: string, newTime: string) => void;
  onEventResize?: (itemId: string, newEndTime: string) => void;
  className?: string;
}

export function DayView({
  date,
  items,
  onSlotClick,
  onEventClick,
  onEventDrop,
  onEventResize,
  className,
}: DayViewProps): React.ReactElement {
  const columns = useMemo((): TimeGridColumn[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayItems = items.filter((i) => i.date === dateStr);
    return [
      {
        date,
        dateStr,
        label: format(date, "EEEE"),
        items: dayItems.filter((i) => !i.isAllDay),
        allDayItems: dayItems.filter((i) => i.isAllDay),
      },
    ];
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
