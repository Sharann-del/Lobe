"use client";

import { useState, useMemo } from "react";
import { parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { DatePicker } from "@/components/views/shared/DatePicker";
import { formatDateValue, formatDateRange } from "@/lib/views/format-date";
import type { DateConfig } from "@/lib/types/properties";

interface DateValue {
  start: string;
  end?: string | null;
}

interface CellDateProps {
  value: string | DateValue | null;
  onChange: (value: string | DateValue | null) => void;
  config?: Partial<DateConfig>;
  readOnly?: boolean;
  className?: string;
}

function normalizeValue(
  val: string | DateValue | null
): { start: string | null; end: string | null } {
  if (!val) return { start: null, end: null };
  if (typeof val === "string") return { start: val, end: null };
  return { start: val.start, end: val.end ?? null };
}

export function CellDate({
  value,
  onChange,
  config,
  readOnly,
  className,
}: CellDateProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const { start, end } = normalizeValue(value);
  const showEndDate = config?.endDate ?? false;

  const formatted = useMemo(() => {
    if (showEndDate && end) {
      return formatDateRange(start, end, config);
    }
    return formatDateValue(start, config);
  }, [start, end, showEndDate, config]);

  const startDate = start ? parseISO(start) : null;
  const endDate = end ? parseISO(end) : null;

  function handleStartChange(d: Date | null): void {
    if (!d) {
      onChange(null);
      return;
    }
    const iso = d.toISOString();
    if (showEndDate) {
      onChange({ start: iso, end: end });
    } else {
      onChange(iso);
    }
  }

  function handleEndChange(d: Date | null): void {
    if (!start) return;
    onChange({ start, end: d?.toISOString() ?? null });
  }

  if (readOnly) {
    return (
      <span
        className={cn(
          "block w-full truncate px-2 py-1 text-sm",
          formatted
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-placeholder)]",
          className
        )}
      >
        {formatted || "—"}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "block w-full truncate px-2 py-1 text-left text-sm",
            formatted
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-placeholder)]",
            "transition-colors duration-fast hover:bg-[var(--bg-3)]",
            className
          )}
        >
          {formatted || "Empty"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <DatePicker
          value={startDate}
          onChange={handleStartChange}
          endDate={endDate}
          onEndDateChange={handleEndChange}
          showEndDate={showEndDate}
        />
      </PopoverContent>
    </Popover>
  );
}
