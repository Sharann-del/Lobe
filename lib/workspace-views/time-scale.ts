import { addDays, differenceInCalendarDays, endOfDay, startOfDay } from "date-fns";

export type TimeZoom = "day" | "week" | "month" | "quarter" | "year";

export const TIME_ZOOM_LEVELS: readonly TimeZoom[] = [
  "day",
  "week",
  "month",
  "quarter",
  "year",
] as const;

export const TIME_ZOOM_LABELS: Record<TimeZoom, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  year: "Year",
};

/** Horizontal scale: wider = more zoomed in (fewer days visible per 100px). */
export function pixelsPerDayForZoom(zoom: TimeZoom): number {
  switch (zoom) {
    case "day":
      return 72;
    case "week":
      return 36;
    case "month":
      return 14;
    case "quarter":
      return 6;
    case "year":
      return 2.2;
    default:
      return 14;
  }
}

/** Total timeline width in pixels (scrollable range). */
export function timelineWidthPx(zoom: TimeZoom): number {
  const ppd = pixelsPerDayForZoom(zoom);
  return Math.round(ppd * 365 * 12);
}

/** `origin` = start of timeline at x=0. */
export function msToX(ms: number, originMs: number, zoom: TimeZoom): number {
  const ppd = pixelsPerDayForZoom(zoom);
  const days = (ms - originMs) / 86400000;
  return days * ppd;
}

export function xToMs(x: number, originMs: number, zoom: TimeZoom): number {
  const ppd = pixelsPerDayForZoom(zoom);
  const days = x / ppd;
  return originMs + days * 86400000;
}

export function startOfTimelineOrigin(today: Date = new Date()): number {
  return startOfDay(addDays(today, -365 * 5)).getTime();
}

export function formatAxisTick(ms: number, zoom: TimeZoom): string {
  const d = new Date(ms);
  if (zoom === "day" || zoom === "week") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  if (zoom === "month" || zoom === "quarter") {
    return d.toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
  }
  return d.getFullYear().toString();
}

/** Pixel width of one calendar day at current zoom (for “today” band). */
export function dayBandWidthPx(zoom: TimeZoom): number {
  return pixelsPerDayForZoom(zoom);
}

/** Start of local calendar day in ms. */
export function startOfLocalDayMs(ms: number): number {
  return startOfDay(new Date(ms)).getTime();
}

/** Days from origin to `ms` (fractional). */
export function dayOffsetFromOrigin(ms: number, originMs: number): number {
  return (ms - originMs) / 86400000;
}

/** Snap `ms` to start of local day. */
export function snapToDay(ms: number): number {
  return startOfLocalDayMs(ms);
}

export function calendarDaysSpan(startMs: number, endMs: number): number {
  return Math.max(
    1,
    differenceInCalendarDays(new Date(endMs), new Date(startMs)) + 1
  );
}

export function msAtEndOfDay(startMs: number): number {
  return endOfDay(new Date(startMs)).getTime();
}
