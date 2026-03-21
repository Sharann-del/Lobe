"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { cn } from "@/lib/utils/cn";
import { useRemindersStore } from "@/lib/stores/remindersStore";
import { usePageTreeStore } from "@/lib/stores/pageTreeStore";
import { useTableViewStore } from "@/lib/stores/tableViewStore";
import { ReminderQuickCreate } from "@/components/reminders/ReminderQuickCreate";
import { CalendarBase } from "./CalendarBase";
import { DayView } from "./DayView";
import { TwoDayView } from "./TwoDayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { YearView } from "./YearView";
import {
  pageEventToCalendarItem,
  reminderToCalendarItem,
  type CalendarItem,
  type CalendarViewType,
} from "@/lib/types/calendar";
import type { PageRow } from "@/lib/types/pages";

const EMPTY_IDS: string[] = [];

export interface CalendarViewProps {
  workspaceId: string;
  databasePageId: string;
  userId: string;
  onOpenPage: (pageId: string) => void;
  className?: string;
}

export function CalendarView({
  workspaceId,
  databasePageId,
  userId,
  onOpenPage,
  className,
}: CalendarViewProps): React.ReactElement {
  const [viewType, setViewType] = useState<CalendarViewType>("week");
  const [focusDate, setFocusDate] = useState<Date>(() => startOfDay(new Date()));
  const [quickCreateDate, setQuickCreateDate] = useState<Date | null>(null);
  const [quickCreateTime, setQuickCreateTime] = useState<string | undefined>();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const setTableContext = useTableViewStore((s) => s.setContext);
  const fetchSchemas = useTableViewStore((s) => s.fetchSchemas);
  const fetchProperties = useTableViewStore((s) => s.fetchProperties);
  const schemas = useTableViewStore((s) => s.schemas);
  const propertiesByPage = useTableViewStore((s) => s.propertiesByPage);

  const pagesById = usePageTreeStore((s) => s.pagesById);
  const childIdsByParent = usePageTreeStore((s) => s.childIdsByParent);
  const childIds = useMemo(
    () =>
      childIdsByParent[databasePageId] ??
      childIdsByParent["root"] ??
      EMPTY_IDS,
    [childIdsByParent, databasePageId]
  );

  const eventsById = useRemindersStore((s) => s.eventsById);
  const getOccurrencesForRange = useRemindersStore(
    (s) => s.getOccurrencesForRange
  );
  const rescheduleReminder = useRemindersStore((s) => s.reschedule);
  const updateReminder = useRemindersStore((s) => s.updateEvent);

  useEffect(() => {
    setTableContext(workspaceId, databasePageId);
    void fetchSchemas();
  }, [workspaceId, databasePageId, setTableContext, fetchSchemas]);

  const childIdsKey = childIds.join(",");
  useEffect(() => {
    if (childIds.length > 0) {
      void fetchProperties(childIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childIdsKey]);

  const dateSchema = useMemo(
    () => schemas.find((s) => s.type === "date") ?? null,
    [schemas]
  );

  const { rangeStart, rangeEnd } = useMemo(() => {
    switch (viewType) {
      case "year":
        return {
          rangeStart: startOfYear(focusDate),
          rangeEnd: endOfYear(focusDate),
        };
      case "month":
        return {
          rangeStart: startOfWeek(startOfMonth(focusDate), { weekStartsOn: 0 }),
          rangeEnd: endOfWeek(endOfMonth(focusDate), { weekStartsOn: 0 }),
        };
      case "week":
        return {
          rangeStart: startOfWeek(focusDate, { weekStartsOn: 0 }),
          rangeEnd: endOfWeek(focusDate, { weekStartsOn: 0 }),
        };
      case "2day":
        return {
          rangeStart: startOfDay(focusDate),
          rangeEnd: addDays(startOfDay(focusDate), 2),
        };
      case "day":
        return {
          rangeStart: startOfDay(focusDate),
          rangeEnd: addDays(startOfDay(focusDate), 1),
        };
    }
  }, [viewType, focusDate]);

  const calendarItems = useMemo((): CalendarItem[] => {
    const result: CalendarItem[] = [];

    const pages = childIds
      .map((id) => pagesById[id])
      .filter((p): p is PageRow => !!p && !p.is_deleted);

    if (dateSchema) {
      for (const page of pages) {
        const props = propertiesByPage[page.id] ?? [];
        const dateProp = props.find((p) => p.key === dateSchema.name);
        const item = pageEventToCalendarItem(
          page,
          dateProp,
          "var(--accent)"
        );
        if (item) result.push(item);
      }
    }

    const reminderOccs = getOccurrencesForRange(rangeStart, rangeEnd);
    for (const occ of reminderOccs) {
      result.push(reminderToCalendarItem(occ));
    }

    return result;
  }, [
    childIds,
    pagesById,
    propertiesByPage,
    dateSchema,
    getOccurrencesForRange,
    rangeStart,
    rangeEnd,
    eventsById,
  ]);

  const rangeLabel = useMemo((): string => {
    switch (viewType) {
      case "year":
        return format(focusDate, "yyyy");
      case "month":
        return format(focusDate, "MMMM yyyy");
      case "week": {
        const ws = startOfWeek(focusDate, { weekStartsOn: 0 });
        const we = endOfWeek(focusDate, { weekStartsOn: 0 });
        return ws.getMonth() === we.getMonth()
          ? `${format(ws, "MMM d")} – ${format(we, "d, yyyy")}`
          : `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
      }
      case "2day":
        return `${format(focusDate, "MMM d")} – ${format(addDays(focusDate, 1), "MMM d, yyyy")}`;
      case "day":
        return format(focusDate, "EEEE, MMMM d, yyyy");
    }
  }, [viewType, focusDate]);

  const handlePrev = useCallback(() => {
    setFocusDate((d) => {
      switch (viewType) {
        case "year":
          return subYears(d, 1);
        case "month":
          return subMonths(d, 1);
        case "week":
          return subWeeks(d, 1);
        case "2day":
          return subDays(d, 2);
        case "day":
          return subDays(d, 1);
      }
    });
  }, [viewType]);

  const handleNext = useCallback(() => {
    setFocusDate((d) => {
      switch (viewType) {
        case "year":
          return addYears(d, 1);
        case "month":
          return addMonths(d, 1);
        case "week":
          return addWeeks(d, 1);
        case "2day":
          return addDays(d, 2);
        case "day":
          return addDays(d, 1);
      }
    });
  }, [viewType]);

  const handleToday = useCallback(() => {
    setFocusDate(startOfDay(new Date()));
  }, []);

  const handleSlotClick = useCallback(
    (dateStr: string, time: string) => {
      setQuickCreateDate(new Date(dateStr + "T00:00:00"));
      setQuickCreateTime(time);
      setQuickCreateOpen(true);
    },
    []
  );

  const handleEventClick = useCallback(
    (item: CalendarItem) => {
      if (item.pageId) {
        onOpenPage(item.pageId);
      }
    },
    [onOpenPage]
  );

  const handleEventDrop = useCallback(
    (itemId: string, _newDate: string, newTime: string) => {
      if (itemId.startsWith("reminder-")) {
        const parts = itemId.replace("reminder-", "").split("-");
        const reminderId = parts.slice(0, 5).join("-");
        void updateReminder(reminderId, { start_time: newTime });
      }
    },
    [updateReminder]
  );

  const handleEventResize = useCallback(
    (itemId: string, newEndTime: string) => {
      if (itemId.startsWith("reminder-")) {
        const parts = itemId.replace("reminder-", "").split("-");
        const reminderId = parts.slice(0, 5).join("-");
        void updateReminder(reminderId, { end_time: newEndTime });
      }
    },
    [updateReminder]
  );

  const handleDayClick = useCallback(
    (date: Date) => {
      setFocusDate(date);
      setViewType("day");
    },
    []
  );

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <CalendarBase
        rangeLabel={rangeLabel}
        activeView={viewType}
        onViewChange={setViewType}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />

      <div className="relative flex-1 overflow-hidden">
        {viewType === "year" && (
          <YearView
            year={focusDate.getFullYear()}
            items={calendarItems}
            onDayClick={handleDayClick}
            className="h-full"
          />
        )}

        {viewType === "month" && (
          <MonthView
            date={focusDate}
            items={calendarItems}
            onSlotClick={handleSlotClick}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
            className="h-full"
          />
        )}

        {viewType === "week" && (
          <WeekView
            date={focusDate}
            items={calendarItems}
            onSlotClick={handleSlotClick}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            className="h-full"
          />
        )}

        {viewType === "2day" && (
          <TwoDayView
            date={focusDate}
            items={calendarItems}
            onSlotClick={handleSlotClick}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            className="h-full"
          />
        )}

        {viewType === "day" && (
          <DayView
            date={focusDate}
            items={calendarItems}
            onSlotClick={handleSlotClick}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            className="h-full"
          />
        )}
      </div>

      {/* Quick-create popover anchored to a hidden trigger */}
      {quickCreateDate && (
        <ReminderQuickCreate
          date={quickCreateDate}
          startTime={quickCreateTime}
          open={quickCreateOpen}
          onOpenChange={(open) => {
            setQuickCreateOpen(open);
            if (!open) setQuickCreateDate(null);
          }}
        >
          <span className="pointer-events-none fixed left-1/2 top-1/2 h-0 w-0" />
        </ReminderQuickCreate>
      )}
    </div>
  );
}
