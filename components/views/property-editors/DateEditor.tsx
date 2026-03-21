"use client";

import { cn } from "@/lib/utils/cn";
import type { DateConfig, DateFormat, ReminderSetting } from "@/lib/types/properties";
import { DEFAULT_DATE_CONFIG } from "@/lib/types/properties";

interface DateEditorProps {
  config: Partial<DateConfig>;
  onChange: (config: Partial<DateConfig>) => void;
  className?: string;
}

const FORMAT_OPTIONS: { value: DateFormat; label: string; example: string }[] = [
  { value: "friendly", label: "Friendly", example: "Mar 21, 2026" },
  { value: "iso", label: "ISO", example: "2026-03-21" },
  { value: "relative", label: "Relative", example: "3 days ago" },
];

const REMINDER_PRESETS: { label: string; setting: ReminderSetting }[] = [
  { label: "30 minutes before", setting: { amount: 30, unit: "minutes" } },
  { label: "1 hour before", setting: { amount: 1, unit: "hours" } },
  { label: "1 day before", setting: { amount: 1, unit: "days" } },
  { label: "3 days before", setting: { amount: 3, unit: "days" } },
  { label: "1 week before", setting: { amount: 7, unit: "days" } },
];

export function DateEditor({
  config,
  onChange,
  className,
}: DateEditorProps): React.ReactElement {
  const c = { ...DEFAULT_DATE_CONFIG, ...config };

  function update(patch: Partial<DateConfig>): void {
    onChange({ ...config, ...patch });
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Format
        </label>
        <div className="flex flex-col gap-0.5">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ dateFormat: opt.value })}
              className={cn(
                "flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left",
                "transition-colors duration-fast hover:bg-[var(--bg-3)]",
                c.dateFormat === opt.value && "bg-[var(--bg-3)]"
              )}
            >
              <span className="text-xs text-[var(--text-primary)]">
                {opt.label}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {opt.example}
              </span>
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={c.includeTime}
          onChange={(e) => update({ includeTime: e.target.checked })}
          className="accent-[var(--accent)]"
        />
        Include time
      </label>

      <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={c.endDate}
          onChange={(e) => update({ endDate: e.target.checked })}
          className="accent-[var(--accent)]"
        />
        End date (date range)
      </label>

      {c.includeTime && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            Time zone
          </label>
          <select
            value={c.timeZone ?? ""}
            onChange={(e) =>
              update({ timeZone: e.target.value || null })
            }
            className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none"
          >
            <option value="">Local</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern</option>
            <option value="America/Chicago">Central</option>
            <option value="America/Denver">Mountain</option>
            <option value="America/Los_Angeles">Pacific</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Asia/Kolkata">India (IST)</option>
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Reminder
        </label>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => update({ reminder: null })}
            className={cn(
              "rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs",
              "transition-colors duration-fast hover:bg-[var(--bg-3)]",
              !c.reminder && "bg-[var(--bg-3)] text-[var(--text-primary)]",
              c.reminder && "text-[var(--text-secondary)]"
            )}
          >
            None
          </button>
          {REMINDER_PRESETS.map((preset) => {
            const active =
              c.reminder?.amount === preset.setting.amount &&
              c.reminder?.unit === preset.setting.unit;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => update({ reminder: preset.setting })}
                className={cn(
                  "rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs",
                  "transition-colors duration-fast hover:bg-[var(--bg-3)]",
                  active && "bg-[var(--bg-3)] text-[var(--text-primary)]",
                  !active && "text-[var(--text-secondary)]"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
