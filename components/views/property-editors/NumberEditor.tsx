"use client";

import { cn } from "@/lib/utils/cn";
import type { NumberConfig, NumberFormat } from "@/lib/types/properties";
import { DEFAULT_NUMBER_CONFIG } from "@/lib/types/properties";

interface NumberEditorProps {
  config: Partial<NumberConfig>;
  onChange: (config: Partial<NumberConfig>) => void;
  className?: string;
}

const FORMAT_OPTIONS: { value: NumberFormat; label: string }[] = [
  { value: "plain", label: "Plain" },
  { value: "comma", label: "Number (1,000)" },
  { value: "percent", label: "Percent (%)" },
  { value: "usd", label: "US Dollar ($)" },
  { value: "eur", label: "Euro (€)" },
  { value: "inr", label: "Indian Rupee (₹)" },
  { value: "custom", label: "Custom" },
];

export function NumberEditor({
  config,
  onChange,
  className,
}: NumberEditorProps): React.ReactElement {
  const c = { ...DEFAULT_NUMBER_CONFIG, ...config };

  function update(patch: Partial<NumberConfig>): void {
    onChange({ ...config, ...patch });
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Format
        </label>
        <select
          value={c.format}
          onChange={(e) => update({ format: e.target.value as NumberFormat })}
          className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none"
        >
          {FORMAT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Decimal places
        </label>
        <input
          type="number"
          min={0}
          max={10}
          value={c.decimals}
          onChange={(e) => update({ decimals: Number(e.target.value) })}
          className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none"
        />
      </div>

      {c.format === "custom" && (
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Prefix
            </label>
            <input
              value={c.prefix}
              onChange={(e) => update({ prefix: e.target.value })}
              placeholder="$"
              className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Suffix
            </label>
            <input
              value={c.suffix}
              onChange={(e) => update({ suffix: e.target.value })}
              placeholder="kg"
              className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={c.showProgressBar}
            onChange={(e) => update({ showProgressBar: e.target.checked })}
            className="accent-[var(--accent)]"
          />
          Show progress bar
        </label>
      </div>

      {c.showProgressBar && (
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Min
            </label>
            <input
              type="number"
              value={c.min}
              onChange={(e) => update({ min: Number(e.target.value) })}
              className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Max
            </label>
            <input
              type="number"
              value={c.max}
              onChange={(e) => update({ max: Number(e.target.value) })}
              className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
