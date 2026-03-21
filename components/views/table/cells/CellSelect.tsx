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
import type { SelectOption } from "@/lib/types/properties";

interface CellSelectProps {
  value: string | null;
  options: SelectOption[];
  onChange: (value: string | null) => void;
  readOnly?: boolean;
  className?: string;
}

export function CellSelect({
  value,
  options,
  onChange,
  readOnly,
  className,
}: CellSelectProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  if (readOnly) {
    return (
      <div className={cn("flex items-center px-2 py-1", className)}>
        {selected ? (
          <Badge color={selected.color}>{selected.name}</Badge>
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
            "flex w-full items-center gap-1 px-2 py-1",
            "transition-colors duration-fast hover:bg-[var(--bg-3)]",
            className
          )}
        >
          {selected ? (
            <Badge color={selected.color}>{selected.name}</Badge>
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
      <PopoverContent className="w-52 p-1" align="start">
        <div className="flex flex-col gap-0.5">
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
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left",
                "transition-colors duration-fast hover:bg-[var(--bg-3)]",
                opt.id === value && "bg-[var(--bg-3)]"
              )}
            >
              <Badge color={opt.color}>{opt.name}</Badge>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
