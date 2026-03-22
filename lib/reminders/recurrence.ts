import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
} from "date-fns";
import type {
  RecurrenceRule,
  ReminderEvent,
  ReminderOccurrence,
} from "@/lib/types/reminders";

function advanceByFrequency(
  d: Date,
  frequency: RecurrenceRule["frequency"],
  interval: number
): Date {
  switch (frequency) {
    case "daily":
      return addDays(d, interval);
    case "weekly":
      return addWeeks(d, interval);
    case "monthly":
      return addMonths(d, interval);
    case "yearly":
      return addYears(d, interval);
  }
}

/**
 * Expand a recurring event into occurrences within [rangeStart, rangeEnd].
 * Non-recurring events return a single occurrence if within range.
 */
export function expandOccurrences(
  event: ReminderEvent,
  rangeStart: Date,
  rangeEnd: Date
): ReminderOccurrence[] {
  const rule = event.recurrence_rule;
  const eventDate = parseISO(event.date);

  if (!rule) {
    if (
      (isSameDay(eventDate, rangeStart) || isAfter(eventDate, rangeStart)) &&
      (isSameDay(eventDate, rangeEnd) || isBefore(eventDate, rangeEnd))
    ) {
      return [
        {
          event,
          occurrenceDate: event.date,
          isOriginal: true,
        },
      ];
    }
    return [];
  }

  const occurrences: ReminderOccurrence[] = [];
  let current = eventDate;
  let count = 0;
  const maxCount = rule.count ?? 365;
  const ruleEnd = rule.end_date ? parseISO(rule.end_date) : null;
  const hasDaysFilter =
    rule.frequency === "weekly" && rule.days_of_week.length > 0;
  const excludedDates = new Set(rule.excluded_dates ?? []);

  while (count < maxCount) {
    if (ruleEnd && isAfter(current, ruleEnd)) {
      break;
    }
    if (isAfter(current, rangeEnd)) {
      break;
    }

    const matchesDay =
      !hasDaysFilter || rule.days_of_week.includes(getDay(current));

    if (
      matchesDay &&
      !excludedDates.has(format(current, "yyyy-MM-dd")) &&
      (isSameDay(current, rangeStart) || isAfter(current, rangeStart)) &&
      (isSameDay(current, rangeEnd) || isBefore(current, rangeEnd))
    ) {
      occurrences.push({
        event,
        occurrenceDate: format(current, "yyyy-MM-dd"),
        isOriginal: isSameDay(current, eventDate),
      });
    }

    if (hasDaysFilter) {
      current = addDays(current, 1);
      if (getDay(current) === (rule.days_of_week[0] ?? 0)) {
        count += 1;
        if (rule.interval > 1) {
          current = addWeeks(current, rule.interval - 1);
        }
      }
    } else {
      current = advanceByFrequency(current, rule.frequency, rule.interval);
      count += 1;
    }
  }

  return occurrences;
}

/**
 * Expand multiple events into a flat sorted list of occurrences for a date range.
 */
export function expandAllOccurrences(
  events: ReminderEvent[],
  rangeStart: Date,
  rangeEnd: Date
): ReminderOccurrence[] {
  const all: ReminderOccurrence[] = [];
  for (const event of events) {
    all.push(...expandOccurrences(event, rangeStart, rangeEnd));
  }
  return all.sort((a, b) => {
    const dateCmp = a.occurrenceDate.localeCompare(b.occurrenceDate);
    if (dateCmp !== 0) return dateCmp;
    const aTime = a.event.start_time ?? "";
    const bTime = b.event.start_time ?? "";
    return aTime.localeCompare(bTime);
  });
}

export function formatRecurrenceLabel(rule: RecurrenceRule | null): string {
  if (!rule) return "Does not repeat";
  const interval = rule.interval;
  const freq = rule.frequency;

  if (interval === 1) {
    switch (freq) {
      case "daily":
        return "Every day";
      case "weekly":
        return rule.days_of_week.length > 0
          ? `Weekly on ${formatDaysOfWeek(rule.days_of_week)}`
          : "Every week";
      case "monthly":
        return "Every month";
      case "yearly":
        return "Every year";
    }
  }

  switch (freq) {
    case "daily":
      return `Every ${interval} days`;
    case "weekly":
      return `Every ${interval} weeks`;
    case "monthly":
      return `Every ${interval} months`;
    case "yearly":
      return `Every ${interval} years`;
  }
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDaysOfWeek(days: number[]): string {
  return days
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d] ?? "")
    .filter(Boolean)
    .join(", ");
}
