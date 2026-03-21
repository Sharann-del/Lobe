import type { PageRow } from "@/lib/types/pages";
import type { PageProperty } from "@/lib/types/properties";
import type { ReminderOccurrence } from "@/lib/types/reminders";

export const CALENDAR_VIEWS = [
  "year",
  "month",
  "week",
  "2day",
  "day",
] as const;

export type CalendarViewType = (typeof CALENDAR_VIEWS)[number];

export const CALENDAR_VIEW_LABELS: Record<CalendarViewType, string> = {
  year: "Year",
  month: "Month",
  week: "Week",
  "2day": "2 Day",
  day: "Day",
};

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const HOUR_HEIGHT_PX = 60;
export const QUARTER_HEIGHT_PX = HOUR_HEIGHT_PX / 4;

export interface CalendarPageEvent {
  page: PageRow;
  date: string;
  startTime: string | null;
  endTime: string | null;
  colorVar: string;
}

export interface CalendarItem {
  type: "page" | "reminder";
  id: string;
  title: string;
  icon: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  colorVar: string;
  isChecked: boolean;
  pageId: string | null;
  reminderId: string | null;
  isAllDay: boolean;
}

export function pageEventToCalendarItem(
  page: PageRow,
  dateProperty: PageProperty | undefined,
  colorVar: string
): CalendarItem | null {
  const dateVal = dateProperty?.value;
  if (!dateVal || typeof dateVal !== "string") return null;

  const datePart = dateVal.slice(0, 10);

  return {
    type: "page",
    id: `page-${page.id}`,
    title: page.title || "Untitled",
    icon: page.icon,
    date: datePart,
    startTime: null,
    endTime: null,
    colorVar,
    isChecked: false,
    pageId: page.id,
    reminderId: null,
    isAllDay: true,
  };
}

export function reminderToCalendarItem(
  occ: ReminderOccurrence
): CalendarItem {
  const e = occ.event;
  return {
    type: "reminder",
    id: `reminder-${e.id}-${occ.occurrenceDate}`,
    title: e.title,
    icon: null,
    date: occ.occurrenceDate,
    startTime: e.start_time,
    endTime: e.end_time,
    colorVar: `var(--color-${e.color})`,
    isChecked: e.is_checked,
    pageId: null,
    reminderId: e.id,
    isAllDay: !e.start_time,
  };
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT_PX;
}

export function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}
