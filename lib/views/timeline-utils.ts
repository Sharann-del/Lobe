import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfQuarter,
  format,
  getQuarter,
  isSameDay,
  isWeekend,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { COLUMN_WIDTH_PX, type TimelineZoom } from "@/lib/types/timeline";

export interface TimelineColumn {
  date: Date;
  label: string;
  subLabel: string;
  isWeekend: boolean;
  isToday: boolean;
}

export interface TimelineHeaderGroup {
  label: string;
  span: number;
}

export function getTimelineOrigin(
  zoom: TimelineZoom,
  focusDate: Date
): Date {
  switch (zoom) {
    case "day":
      return addDays(startOfDay(focusDate), -14);
    case "week":
      return addWeeks(startOfWeek(focusDate, { weekStartsOn: 1 }), -4);
    case "month":
      return addMonths(startOfMonth(focusDate), -2);
    case "quarter":
      return addQuarters(startOfQuarter(focusDate), -1);
    case "year":
      return addYears(startOfYear(focusDate), -1);
  }
}

export function getTimelineColumns(
  zoom: TimelineZoom,
  origin: Date,
  count: number
): TimelineColumn[] {
  const today = startOfDay(new Date());

  switch (zoom) {
    case "day": {
      return Array.from({ length: count }, (_, i) => {
        const d = addDays(origin, i);
        return {
          date: d,
          label: format(d, "d"),
          subLabel: format(d, "EEE"),
          isWeekend: isWeekend(d),
          isToday: isSameDay(d, today),
        };
      });
    }
    case "week": {
      return Array.from({ length: count }, (_, i) => {
        const d = addWeeks(origin, i);
        return {
          date: d,
          label: `W${format(d, "w")}`,
          subLabel: format(d, "MMM d"),
          isWeekend: false,
          isToday: false,
        };
      });
    }
    case "month": {
      return Array.from({ length: count }, (_, i) => {
        const d = addMonths(origin, i);
        return {
          date: d,
          label: format(d, "MMM"),
          subLabel: format(d, "yyyy"),
          isWeekend: false,
          isToday: false,
        };
      });
    }
    case "quarter": {
      return Array.from({ length: count }, (_, i) => {
        const d = addQuarters(origin, i);
        return {
          date: d,
          label: `Q${getQuarter(d)}`,
          subLabel: format(d, "yyyy"),
          isWeekend: false,
          isToday: false,
        };
      });
    }
    case "year": {
      return Array.from({ length: count }, (_, i) => {
        const d = addYears(origin, i);
        return {
          date: d,
          label: format(d, "yyyy"),
          subLabel: "",
          isWeekend: false,
          isToday: false,
        };
      });
    }
  }
}

export function getHeaderGroups(
  zoom: TimelineZoom,
  columns: TimelineColumn[]
): TimelineHeaderGroup[] {
  if (columns.length === 0) return [];

  switch (zoom) {
    case "day": {
      const groups: TimelineHeaderGroup[] = [];
      let currentLabel = format(columns[0]!.date, "MMM yyyy");
      let span = 0;
      for (const col of columns) {
        const label = format(col.date, "MMM yyyy");
        if (label !== currentLabel) {
          groups.push({ label: currentLabel, span });
          currentLabel = label;
          span = 1;
        } else {
          span++;
        }
      }
      groups.push({ label: currentLabel, span });
      return groups;
    }
    case "week": {
      const groups: TimelineHeaderGroup[] = [];
      let currentLabel = format(columns[0]!.date, "MMM yyyy");
      let span = 0;
      for (const col of columns) {
        const label = format(col.date, "MMM yyyy");
        if (label !== currentLabel) {
          groups.push({ label: currentLabel, span });
          currentLabel = label;
          span = 1;
        } else {
          span++;
        }
      }
      groups.push({ label: currentLabel, span });
      return groups;
    }
    case "month":
    case "quarter": {
      const groups: TimelineHeaderGroup[] = [];
      let currentLabel = format(columns[0]!.date, "yyyy");
      let span = 0;
      for (const col of columns) {
        const label = format(col.date, "yyyy");
        if (label !== currentLabel) {
          groups.push({ label: currentLabel, span });
          currentLabel = label;
          span = 1;
        } else {
          span++;
        }
      }
      groups.push({ label: currentLabel, span });
      return groups;
    }
    case "year":
      return [{ label: "", span: columns.length }];
  }
}

export function dateToPixel(
  dateStr: string,
  origin: Date,
  zoom: TimelineZoom
): number {
  const d = parseISO(dateStr);
  const daysDiff = differenceInDays(d, origin);
  const colWidth = COLUMN_WIDTH_PX[zoom];

  switch (zoom) {
    case "day":
      return daysDiff * colWidth;
    case "week":
      return (daysDiff / 7) * colWidth;
    case "month":
      return (daysDiff / 30) * colWidth;
    case "quarter":
      return (daysDiff / 90) * colWidth;
    case "year":
      return (daysDiff / 365) * colWidth;
  }
}

export function pixelToDate(
  px: number,
  origin: Date,
  zoom: TimelineZoom
): Date {
  const colWidth = COLUMN_WIDTH_PX[zoom];
  let days: number;

  switch (zoom) {
    case "day":
      days = px / colWidth;
      break;
    case "week":
      days = (px / colWidth) * 7;
      break;
    case "month":
      days = (px / colWidth) * 30;
      break;
    case "quarter":
      days = (px / colWidth) * 90;
      break;
    case "year":
      days = (px / colWidth) * 365;
      break;
  }

  return addDays(origin, Math.round(days));
}

export function todayPixelOffset(
  origin: Date,
  zoom: TimelineZoom
): number {
  const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
  return dateToPixel(todayStr, origin, zoom);
}
