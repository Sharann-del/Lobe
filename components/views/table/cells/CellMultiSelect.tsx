"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Badge,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { SelectOption } from "@/lib/types/properties";

interface CellMultiSelectProps {
  value: string[];
  options: SelectOption[];
  onChange: (value: string[]) => void;
  readOnly?: boolean;
  className?: string;
}

export function CellMultiSelect({
  value,
  options,
  onChange,
  readOnly,
  className,
}: CellMultiSelectProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => value.includes(o.id));

  const toggleOption = (optId: string): void => {
    const next = value.includes(optId)
      ? value.filter((v) => v !== optId)
      : [...value, optId];
    onChange(next);
  };

  const content = (
    <div className={cn("flex flex-wrap items-center gap-1 px-2 py-1", className)}>
      {selected.length > 0 ? (
        selected.map((opt) => (
          <Badge key={opt.id} color={opt.color}>
            {opt.name}
          </Badge>
        ))
      ) : (
        <span className="text-sm text-[var(--text-placeholder)]">
          {readOnly ? "—" : "Empty"}
        </span>
      )}
    </div>
  );

  if (readOnly) return content;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-1",
            "transition-colors duration-fast hover:bg-[var(--bg-3)]"
          )}
        >
          {content}
          <ChevronDown
            size={12}
            className="mr-2 shrink-0 text-[var(--text-tertiary)]"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="flex flex-col gap-0.5">
          {options.map((opt) => {
            const isSelected = value.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleOption(opt.id)}
                className={cn(
                  "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left",
                  "transition-colors duration-fast hover:bg-[var(--bg-3)]"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border",
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-[var(--border-default)]"
                  )}
                >
                  {isSelected && <Check size={10} className="text-[var(--bg-0)]" />}
                </span>
                <Badge color={opt.color}>{opt.name}</Badge>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
