"use client";

import { useCallback } from "react";
import { Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useRemindersStore } from "@/lib/stores/remindersStore";
import type { CalendarItem } from "@/lib/types/calendar";

interface CalendarEventBlockProps {
  item: CalendarItem;
  onClick: () => void;
  variant?: "bar" | "dot" | "timed";
  style?: React.CSSProperties;
  className?: string;
}

export function CalendarEventBlock({
  item,
  onClick,
  variant = "bar",
  style,
  className,
}: CalendarEventBlockProps): React.ReactElement {
  const toggleChecked = useRemindersStore((s) => s.toggleChecked);

  const handleCheck = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.reminderId) {
        void toggleChecked(item.reminderId);
      }
    },
    [item.reminderId, toggleChecked]
  );

  if (variant === "dot") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          className
        )}
        style={{ backgroundColor: item.colorVar, ...style }}
        title={item.title}
      />
    );
  }

  if (variant === "timed") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group absolute left-1 right-1 overflow-hidden rounded-[var(--radius-sm)]",
          "border-l-2 px-1.5 py-0.5 text-left",
          "transition-all duration-fast",
          "hover:shadow-[var(--shadow-md)]",
          item.isChecked && "opacity-50",
          className
        )}
        style={{
          borderLeftColor: item.colorVar,
          backgroundColor: `color-mix(in srgb, ${item.colorVar} 15%, var(--bg-1))`,
          ...style,
        }}
      >
        <div className="flex items-center gap-1">
          {item.type === "reminder" && (
            <span
              onClick={handleCheck}
              className={cn(
                "flex h-3 w-3 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border",
                "transition-colors duration-fast",
                item.isChecked
                  ? "border-transparent"
                  : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
              )}
              style={
                item.isChecked
                  ? { backgroundColor: item.colorVar }
                  : undefined
              }
            >
              {item.isChecked && (
                <Check size={8} className="text-[var(--bg-0)]" />
              )}
            </span>
          )}
          {item.icon ? (
            <span className="shrink-0 text-[10px]">{item.icon}</span>
          ) : item.type === "page" ? (
            <FileText
              size={10}
              className="shrink-0 text-[var(--text-tertiary)]"
            />
          ) : null}
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[11px] font-medium leading-tight text-[var(--text-primary)]",
              item.isChecked && "line-through"
            )}
          >
            {item.title}
          </span>
        </div>
        {item.startTime && (
          <span className="text-[9px] text-[var(--text-tertiary)]">
            {formatTimeShort(item.startTime)}
            {item.endTime && ` – ${formatTimeShort(item.endTime)}`}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-1 overflow-hidden rounded-[var(--radius-sm)]",
        "px-1 py-0.5 text-left",
        "transition-all duration-fast",
        "hover:shadow-[var(--shadow-sm)]",
        item.isChecked && "opacity-50",
        className
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${item.colorVar} 15%, var(--bg-1))`,
        ...style,
      }}
    >
      {item.type === "reminder" && (
        <span
          onClick={handleCheck}
          className={cn(
            "flex h-3 w-3 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border",
            "transition-colors duration-fast",
            item.isChecked
              ? "border-transparent"
              : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
          )}
          style={
            item.isChecked
              ? { backgroundColor: item.colorVar }
              : undefined
          }
        >
          {item.isChecked && (
            <Check size={8} className="text-[var(--bg-0)]" />
          )}
        </span>
      )}
      {item.icon ? (
        <span className="shrink-0 text-[10px]">{item.icon}</span>
      ) : item.type === "page" ? (
        <FileText
          size={10}
          className="shrink-0 text-[var(--text-tertiary)]"
        />
      ) : (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: item.colorVar }}
        />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[11px] font-medium text-[var(--text-primary)]",
          item.isChecked && "line-through"
        )}
      >
        {item.title}
      </span>
    </button>
  );
}

function formatTimeShort(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const hour = h ?? 0;
  const minute = m ?? 0;
  const ampm = hour < 12 ? "a" : "p";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return minute === 0 ? `${h12}${ampm}` : `${h12}:${String(minute).padStart(2, "0")}${ampm}`;
}
