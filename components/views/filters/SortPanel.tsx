"use client";

import { useCallback } from "react";
import { Plus, X, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ColumnSort, SortDirection, PropertySchema } from "@/lib/types/properties";

interface SortPanelProps {
  sorts: ColumnSort[];
  properties: PropertySchema[];
  onChange: (sorts: ColumnSort[]) => void;
  className?: string;
}

export function SortPanel({
  sorts,
  properties,
  onChange,
  className,
}: SortPanelProps): React.ReactElement {
  const usedIds = new Set(sorts.map((s) => s.propertyId));
  const available = properties.filter((p) => !usedIds.has(p.id));

  const addSort = useCallback(() => {
    const prop = available[0];
    if (!prop) return;
    onChange([...sorts, { propertyId: prop.id, direction: "asc" }]);
  }, [available, sorts, onChange]);

  const updateSort = useCallback(
    (index: number, patch: Partial<ColumnSort>) => {
      const next = [...sorts];
      const prev = next[index];
      if (!prev) return;
      next[index] = {
        propertyId: patch.propertyId ?? prev.propertyId,
        direction: patch.direction ?? prev.direction,
      };
      onChange(next);
    },
    [sorts, onChange]
  );

  const removeSort = useCallback(
    (index: number) => {
      onChange(sorts.filter((_, i) => i !== index));
    },
    [sorts, onChange]
  );

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {sorts.length === 0 && (
        <p className="px-1 py-2 text-center text-xs text-[var(--text-tertiary)]">
          No sorts applied
        </p>
      )}

      {sorts.map((sort, i) => {
        const prop = properties.find((p) => p.id === sort.propertyId);
        return (
          <div key={`${sort.propertyId}-${i}`} className="flex items-center gap-1.5">
            <GripVertical
              size={12}
              className="shrink-0 text-[var(--text-placeholder)]"
            />

            <select
              value={sort.propertyId}
              onChange={(e) =>
                updateSort(i, { propertyId: e.target.value })
              }
              className="min-w-[100px] flex-1 rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
            >
              {prop && (
                <option value={prop.id}>{prop.name}</option>
              )}
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() =>
                updateSort(i, {
                  direction:
                    sort.direction === "asc" ? "desc" : "asc",
                })
              }
              className={cn(
                "flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1",
                "text-xs text-[var(--text-secondary)]",
                "transition-colors duration-fast hover:bg-[var(--bg-3)]"
              )}
            >
              {sort.direction === "asc" ? (
                <>
                  <ArrowUp size={12} /> Ascending
                </>
              ) : (
                <>
                  <ArrowDown size={12} /> Descending
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => removeSort(i)}
              className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] transition-colors duration-fast hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      {available.length > 0 && (
        <button
          type="button"
          onClick={addSort}
          className={cn(
            "flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1",
            "text-xs text-[var(--accent)]",
            "transition-colors duration-fast hover:bg-[var(--bg-3)]"
          )}
        >
          <Plus size={12} />
          Add sort
        </button>
      )}

      {sorts.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className={cn(
            "flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1",
            "text-xs text-[var(--text-tertiary)]",
            "transition-colors duration-fast hover:bg-[var(--bg-3)]"
          )}
        >
          <X size={12} />
          Clear all
        </button>
      )}
    </div>
  );
}
