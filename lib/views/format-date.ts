import { format, parseISO, formatDistanceToNow } from "date-fns";
import type { DateConfig, DateFormat } from "@/lib/types/properties";
import { DEFAULT_DATE_CONFIG } from "@/lib/types/properties";

export function formatDateValue(
  iso: string | null | undefined,
  config: Partial<DateConfig> = {}
): string {
  if (!iso) return "";
  const c = { ...DEFAULT_DATE_CONFIG, ...config };
  const date = parseISO(iso);

  return formatSingleDate(date, c.dateFormat, c.includeTime);
}

function formatSingleDate(
  date: Date,
  fmt: DateFormat,
  includeTime: boolean
): string {
  switch (fmt) {
    case "iso":
      return includeTime
        ? format(date, "yyyy-MM-dd HH:mm")
        : format(date, "yyyy-MM-dd");
    case "relative":
      return formatDistanceToNow(date, { addSuffix: true });
    case "friendly":
    default:
      return includeTime
        ? format(date, "MMM d, yyyy h:mm a")
        : format(date, "MMM d, yyyy");
  }
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  config: Partial<DateConfig> = {}
): string {
  const s = formatDateValue(start, config);
  const e = formatDateValue(end, config);
  if (!s) return "";
  if (!e) return s;
  return `${s} → ${e}`;
}
