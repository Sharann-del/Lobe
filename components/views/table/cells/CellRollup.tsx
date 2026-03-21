"use client";

import { Sigma } from "lucide-react";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { AggregationType } from "@/lib/types/properties";

interface CellRollupProps {
  value: unknown;
  aggregation?: AggregationType;
  className?: string;
}

const AGGREGATION_LABELS: Record<AggregationType, string> = {
  count: "Count",
  count_unique: "Unique",
  count_all: "All",
  percent_empty: "% Empty",
  percent_not_empty: "% Filled",
  sum: "Sum",
  avg: "Average",
  median: "Median",
  min: "Min",
  max: "Max",
  range: "Range",
  show_original: "Original",
  count_per_group: "Per group",
};

function formatRollupValue(val: unknown, agg?: AggregationType): string {
  if (val === null || val === undefined) return "—";

  if (agg === "percent_empty" || agg === "percent_not_empty") {
    return `${Number(val).toFixed(0)}%`;
  }

  if (
    agg === "sum" ||
    agg === "avg" ||
    agg === "median" ||
    agg === "min" ||
    agg === "max" ||
    agg === "range"
  ) {
    return typeof val === "number" ? val.toLocaleString() : String(val);
  }

  if (agg === "show_original" && Array.isArray(val)) {
    return val.map(String).join(", ");
  }

  return String(val);
}

export function CellRollup({
  value,
  aggregation,
  className,
}: CellRollupProps): React.ReactElement {
  const display = formatRollupValue(value, aggregation);
  const label = aggregation ? AGGREGATION_LABELS[aggregation] : "Rollup";

  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1", className)}>
      <Tooltip content={label}>
        <Sigma
          size={12}
          className="shrink-0 text-[var(--color-teal)]"
        />
      </Tooltip>
      <span className="truncate text-sm text-[var(--text-secondary)]">
        {display}
      </span>
    </div>
  );
}
