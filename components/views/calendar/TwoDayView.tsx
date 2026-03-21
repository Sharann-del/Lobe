"use client";

import { useMemo } from "react";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { TimeGrid, type TimeGridColumn } from "./TimeGrid";
import type { CalendarItem } from "@/lib/types/calendar";

interface TwoDayViewProps {
  date: Date;
  items: CalendarItem[];
  onSlotClick: (date: string, time: string) => void;
  onEventClick: (item: CalendarItem) => void;
  onEventDrop?: (itemId: string, newDate: string, newTime: string) => void;
  onEventResize?: (itemId: string, newEndTime: string) => void;
  className?: string;
}

export function TwoDayView({
  date,
  items,
  onSlotClick,
  onEventClick,
  onEventDrop,
  onEventResize,
  className,
}: TwoDayViewProps): React.ReactElement {
  const columns = useMemo((): TimeGridColumn[] => {
    const days = [date, addDays(date, 1)];
    return days.map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      const dayItems = items.filter((i) => i.date === dateStr);
      return {
        date: d,
        dateStr,
        label: format(d, "EEE d"),
        items: dayItems.filter((i) => !i.isAllDay),
        allDayItems: dayItems.filter((i) => i.isAllDay),
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
