"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Badge,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { StatusOption, StatusGroup } from "@/lib/types/properties";

interface CellStatusProps {
  value: string | null;
  options: StatusOption[];
  onChange: (value: string | null) => void;
  readOnly?: boolean;
  className?: string;
}

const GROUP_LABELS: Record<StatusGroup, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

const GROUP_ORDER: StatusGroup[] = ["not_started", "in_progress", "done"];

function StatusIndicator({
  group,
  className,
}: {
  group: StatusGroup;
  className?: string;
}): React.ReactElement {
  const colors: Record<StatusGroup, string> = {
    not_started: "border-[var(--text-tertiary)]",
    in_progress: "border-[var(--color-blue)] border-t-transparent",
    done: "bg-[var(--color-green)] border-[var(--color-green)]",
  };

  return (
    <span
      className={cn(
        "inline-block h-3 w-3 shrink-0 rounded-full border-2",
        colors[group],
        group === "in_progress" && "animate-spin",
        className
      )}
      style={
        group === "in_progress"
          ? { animationDuration: "1.5s" }
          : undefined
      }
    />
  );
}

export function CellStatus({
  value,
  options,
  onChange,
  readOnly,
  className,
}: CellStatusProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: options.filter((o) => o.group === group),
  }));

  if (readOnly) {
    return (
      <div className={cn("flex items-center gap-1.5 px-2 py-1", className)}>
        {selected ? (
          <>
            <StatusIndicator group={selected.group} />
            <Badge color={selected.color}>{selected.name}</Badge>
          </>
        ) : (
          <span className="text-sm text-[var(--text-placeholder)]">—</span>
        )}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-1.5 px-2 py-1",
            "transition-colors duration-fast hover:bg-[var(--bg-3)]",
            className
          )}
        >
          {selected ? (
            <>
              <StatusIndicator group={selected.group} />
              <Badge color={selected.color}>{selected.name}</Badge>
            </>
          ) : (
            <span className="text-sm text-[var(--text-placeholder)]">
              Empty
            </span>
          )}
          <ChevronDown
            size={12}
            className="ml-auto shrink-0 text-[var(--text-tertiary)]"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="flex flex-col gap-1">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={cn(
                "rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs",
                "text-[var(--text-secondary)] transition-colors duration-fast hover:bg-[var(--bg-3)]"
              )}
            >
              Clear
            </button>
          )}

          {grouped.map(
            ({ group, label, items }) =>
              items.length > 0 && (
                <div key={group}>
                  <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    {label}
                  </p>
                  {items.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onChange(opt.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
                        "transition-colors duration-fast hover:bg-[var(--bg-3)]",
                        opt.id === value && "bg-[var(--bg-3)]"
                      )}
                    >
                      <StatusIndicator group={opt.group} />
                      <Badge color={opt.color}>{opt.name}</Badge>
                    </button>
                  ))}
                </div>
              )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
