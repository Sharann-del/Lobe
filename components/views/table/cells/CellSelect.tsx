"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronDown, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Badge,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { SelectOption } from "@/lib/types/properties";
import type { BadgeColor } from "@/components/ui/Badge";

const INLINE_COLORS: BadgeColor[] = [
  "blue",
  "green",
  "orange",
  "purple",
  "red",
  "teal",
  "yellow",
  "pink",
  "gray",
];

interface CellSelectProps {
  value: string | null;
  options: SelectOption[];
  onChange: (value: string | null) => void;
  onCreateOption?: (option: SelectOption) => void;
  readOnly?: boolean;
  className?: string;
}

export function CellSelect({
  value,
  options,
  onChange,
  onCreateOption,
  readOnly,
  className,
}: CellSelectProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.id === value);

  const filtered = search.trim()
    ? options.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const exactMatch = options.some(
    (o) => o.name.toLowerCase() === search.trim().toLowerCase()
  );

  const handleCreate = useCallback(() => {
    if (!search.trim() || exactMatch) return;
    const newOpt: SelectOption = {
      id: crypto.randomUUID(),
      name: search.trim(),
      color: INLINE_COLORS[options.length % INLINE_COLORS.length],
    };
    onCreateOption?.(newOpt);
    onChange(newOpt.id);
    setSearch("");
    setOpen(false);
  }, [search, exactMatch, options.length, onCreateOption, onChange]);

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
      <PopoverContent className="w-56 p-1" align="start">
        <div className="flex flex-col gap-0.5">
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !exactMatch && search.trim()) {
                handleCreate();
              }
            }}
            placeholder="Search or create…"
            className="mb-1 rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
          />

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

          {filtered.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.id);
                setSearch("");
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

          {search.trim() && !exactMatch && onCreateOption && (
            <button
              type="button"
              onClick={handleCreate}
              className={cn(
                "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5",
                "text-xs text-[var(--accent)]",
                "transition-colors duration-fast hover:bg-[var(--bg-3)]"
              )}
            >
              <Plus size={12} />
              Create &ldquo;{search.trim()}&rdquo;
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
