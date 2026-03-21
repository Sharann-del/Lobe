"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { RelationPicker } from "@/components/views/shared/RelationPicker";
import type { RelationValue } from "@/lib/types/properties";

interface CellRelationProps {
  value: RelationValue[];
  entries?: RelationValue[];
  onChange?: (relations: RelationValue[]) => void;
  onNavigate?: (pageId: string) => void;
  readOnly?: boolean;
  className?: string;
}

export function CellRelation({
  value,
  entries = [],
  onChange,
  onNavigate,
  readOnly,
  className,
}: CellRelationProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  const display = (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 px-2 py-1",
        className
      )}
    >
      {value.length > 0 ? (
        value.map((rel) => (
          <button
            key={rel.page_id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.(rel.page_id);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-[var(--radius-sm)]",
              "bg-[var(--bg-3)] px-1.5 py-0.5",
              "text-xs text-[var(--text-primary)]",
              "transition-colors duration-fast hover:bg-[var(--bg-4)]"
            )}
          >
            {rel.icon ? (
              <span className="text-[10px]">{rel.icon}</span>
            ) : (
              <FileText size={10} className="text-[var(--text-tertiary)]" />
            )}
            <span className="max-w-[120px] truncate">{rel.title}</span>
          </button>
        ))
      ) : (
        <span className="text-sm text-[var(--text-placeholder)]">
          {readOnly ? "—" : "Empty"}
        </span>
      )}
    </div>
  );

  if (readOnly || !onChange) return display;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center",
            "transition-colors duration-fast hover:bg-[var(--bg-3)]"
          )}
        >
          {display}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <RelationPicker
          entries={entries}
          selected={value}
          onChange={onChange}
          onNavigate={onNavigate}
        />
      </PopoverContent>
    </Popover>
  );
}
