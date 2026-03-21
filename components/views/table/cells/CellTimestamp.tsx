"use client";

import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface CellTimestampProps {
  value: string | null;
  className?: string;
}

export function CellTimestamp({
  value,
  className,
}: CellTimestampProps): React.ReactElement {
  const formatted = value
    ? format(parseISO(value), "MMM d, yyyy h:mm a")
    : "—";

  return (
    <span
      className={cn(
        "block truncate px-2 py-1 text-sm text-[var(--text-secondary)]",
        className
      )}
    >
      {formatted}
    </span>
  );
}
