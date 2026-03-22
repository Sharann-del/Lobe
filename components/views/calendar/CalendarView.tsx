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
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { useGridViewStore } from "@/lib/stores/gridViewStore";
import { ReminderQuickCreate } from "@/components/reminders/ReminderQuickCreate";
import { ReminderEditPanel } from "@/components/reminders/ReminderEditPanel";
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
import type { NodeRow } from "@/lib/types/nodes";

const EMPTY_IDS: string[] = [];

export interface CalendarViewProps {
  workspaceId: string;
  sectionNodeId: string;
  userId: string;
  onOpenPage: (pageId: string) => void;
  className?: string;
}

export function CalendarView({
  workspaceId,
  sectionNodeId,
  userId,
  onOpenPage,
  className,
}: CalendarViewProps): React.ReactElement {
  const [viewType, setViewType] = useState<CalendarViewType>("week");
  const [focusDate, setFocusDate] = useState<Date>(() => startOfDay(new Date()));
  const [quickCreateDate, setQuickCreateDate] = useState<Date | null>(null);
  const [quickCreateTime, setQuickCreateTime] = useState<string | undefined>();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editingOccurrenceDate, setEditingOccurrenceDate] = useState<string | undefined>(
    undefined
  );

  const setTableContext = useGridViewStore((s) => s.setContext);
  const fetchSchemas = useGridViewStore((s) => s.fetchSchemas);
  const fetchProperties = useGridViewStore((s) => s.fetchProperties);
  const schemas = useGridViewStore((s) => s.schemas);
  const propertiesByNode = useGridViewStore((s) => s.propertiesByNode);

  const nodesById = useSectionTreeStore((s) => s.nodesById);
  const childIdsByParent = useSectionTreeStore((s) => s.childIdsByParent);
  const childIds = useMemo(
    () =>
      childIdsByParent[sectionNodeId] ??
      childIdsByParent["root"] ??
      EMPTY_IDS,
    [childIdsByParent, sectionNodeId]
  );

  const eventsById = useRemindersStore((s) => s.eventsById);
  const getOccurrencesForRange = useRemindersStore(
    (s) => s.getOccurrencesForRange
  );
  const updateReminder = useRemindersStore((s) => s.updateEvent);

  useEffect(() => {
    setTableContext(workspaceId, sectionNodeId);
    void fetchSchemas();
  }, [workspaceId, sectionNodeId, setTableContext, fetchSchemas]);

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
      .map((id) => nodesById[id])
      .filter((p): p is NodeRow => !!p && !p.is_deleted);

    if (dateSchema) {
      for (const page of pages) {
        const props = propertiesByNode[page.id] ?? [];
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
    nodesById,
    propertiesByNode,
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
      if (item.reminderId) {
        setEditingReminderId(item.reminderId);
        setEditingOccurrenceDate(item.occurrenceDate ?? undefined);
        return;
      }
      if (item.pageId) {
        onOpenPage(item.pageId);
      }
    },
    [onOpenPage]
  );

  const handleEventDrop = useCallback(
    (itemId: string, newDate: string, newTime: string) => {
      const parsed = parseReminderItemId(itemId);
      if (parsed) {
        void updateReminder(
          parsed.reminderId,
          { date: newDate, start_time: newTime },
          parsed.occurrenceDate ? "this" : "all",
          parsed.occurrenceDate ?? undefined
        );
      }
    },
    [updateReminder]
  );

  const handleEventResize = useCallback(
    (itemId: string, newEndTime: string) => {
      const parsed = parseReminderItemId(itemId);
      if (parsed) {
        void updateReminder(
          parsed.reminderId,
          { end_time: newEndTime },
          parsed.occurrenceDate ? "this" : "all",
          parsed.occurrenceDate ?? undefined
        );
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

      <ReminderEditPanel
        eventId={editingReminderId}
        occurrenceDate={editingOccurrenceDate}
        open={editingReminderId !== null}
        onClose={() => {
          setEditingReminderId(null);
          setEditingOccurrenceDate(undefined);
        }}
      />
    </div>
  );
}

function parseReminderItemId(
  itemId: string
): { reminderId: string; occurrenceDate: string | null } | null {
  const match =
    /^reminder-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-(\d{4}-\d{2}-\d{2}))?$/i.exec(
      itemId
    );
  if (!match) return null;
  return {
    reminderId: match[1] ?? "",
    occurrenceDate: match[2] ?? null,
  };
}
