"use client";

import { useState, useMemo } from "react";
import { Search, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { RelationValue } from "@/lib/types/properties";

interface RelationPickerProps {
  entries: RelationValue[];
  selected: RelationValue[];
  onChange: (relations: RelationValue[]) => void;
  onNavigate?: (pageId: string) => void;
  className?: string;
}

export function RelationPicker({
  entries,
  selected,
  onChange,
  onNavigate,
  className,
}: RelationPickerProps): React.ReactElement {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const q = query.toLowerCase();
    return entries.filter((e) => e.title.toLowerCase().includes(q));
  }, [entries, query]);

  const selectedIds = new Set(selected.map((r) => r.page_id));

  function toggle(entry: RelationValue): void {
    if (selectedIds.has(entry.page_id)) {
      onChange(selected.filter((r) => r.page_id !== entry.page_id));
    } else {
      onChange([...selected, entry]);
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5">
        <Search size={12} className="shrink-0 text-[var(--text-tertiary)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search entries…"
          className="flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {selected.map((rel) => (
            <span
              key={rel.page_id}
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--bg-3)] px-1.5 py-0.5 text-xs"
            >
              <button
                type="button"
                onClick={() => onNavigate?.(rel.page_id)}
                className="flex items-center gap-1 hover:underline"
              >
                {rel.icon ? (
                  <span className="text-[10px]">{rel.icon}</span>
                ) : (
                  <FileText size={10} className="text-[var(--text-tertiary)]" />
                )}
                <span className="max-w-[100px] truncate">{rel.title}</span>
              </button>
              <button
                type="button"
                onClick={() => toggle(rel)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-40 overflow-y-auto">
        {filtered.map((entry) => (
          <button
            key={entry.page_id}
            type="button"
            onClick={() => toggle(entry)}
            className={cn(
              "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
              "transition-colors duration-fast hover:bg-[var(--bg-3)]",
              selectedIds.has(entry.page_id) && "bg-[var(--bg-3)]"
            )}
          >
            {entry.icon ? (
              <span className="text-sm">{entry.icon}</span>
            ) : (
              <FileText size={14} className="shrink-0 text-[var(--text-tertiary)]" />
            )}
            <span className="truncate text-xs text-[var(--text-primary)]">
              {entry.title}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-[var(--text-tertiary)]">
            No entries found
          </p>
        )}
      </div>
    </div>
  );
}
