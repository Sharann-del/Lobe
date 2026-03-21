"use client";

import { cn } from "@/lib/utils/cn";
import type { RollupConfig, AggregationType, PropertySchema } from "@/lib/types/properties";

interface RollupEditorProps {
  config: Partial<RollupConfig>;
  relationProperties: PropertySchema[];
  targetProperties: PropertySchema[];
  onChange: (config: Partial<RollupConfig>) => void;
  className?: string;
}

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: "count", label: "Count" },
  { value: "count_unique", label: "Count unique" },
  { value: "count_all", label: "Count all" },
  { value: "percent_empty", label: "Percent empty" },
  { value: "percent_not_empty", label: "Percent not empty" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "median", label: "Median" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "range", label: "Range" },
  { value: "show_original", label: "Show original" },
  { value: "count_per_group", label: "Count per group" },
];

export function RollupEditor({
  config,
  relationProperties,
  targetProperties,
  onChange,
  className,
}: RollupEditorProps): React.ReactElement {
  function update(patch: Partial<RollupConfig>): void {
    onChange({ ...config, ...patch });
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Relation property
        </label>
        <select
          value={config.relationPropertyId ?? ""}
          onChange={(e) => update({ relationPropertyId: e.target.value })}
          className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none"
        >
          <option value="">Select a relation…</option>
          {relationProperties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {config.relationPropertyId && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            Property to aggregate
          </label>
          <select
            value={config.targetPropertyId ?? ""}
            onChange={(e) => update({ targetPropertyId: e.target.value })}
            className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none"
          >
            <option value="">Select a property…</option>
            {targetProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Aggregation
        </label>
        <select
          value={config.aggregation ?? "count"}
          onChange={(e) =>
            update({ aggregation: e.target.value as AggregationType })
          }
          className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none"
        >
          {AGGREGATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
