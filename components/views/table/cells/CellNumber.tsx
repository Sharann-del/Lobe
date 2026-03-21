"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { NumberConfig } from "@/lib/types/properties";
import { formatNumberValue, progressPercent } from "@/lib/views/format-number";

interface CellNumberProps {
  value: number | null;
  onChange: (value: number | null) => void;
  config?: Partial<NumberConfig>;
  readOnly?: boolean;
  className?: string;
}

export function CellNumber({
  value,
  onChange,
  config,
  readOnly,
  className,
}: CellNumberProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value?.toString() ?? "");
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const parsed = draft.trim() === "" ? null : Number(draft);
    if (parsed !== value && (parsed === null || !isNaN(parsed))) {
      onChange(parsed);
    }
  }, [draft, value, onChange]);

  const formatted = formatNumberValue(value, config);
  const showProgress = config?.showProgressBar && value !== null;

  if (readOnly || !editing) {
    return (
      <div
        className={cn("relative w-full", className)}
        onDoubleClick={() => !readOnly && setEditing(true)}
      >
        {showProgress && (
          <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-full bg-[var(--bg-3)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-150"
              style={{ width: `${progressPercent(value, config)}%` }}
            />
          </div>
        )}
        <span
          className={cn(
            "block w-full truncate px-2 py-1 text-right text-sm tabular-nums",
            value !== null
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-placeholder)]",
            !readOnly && "cursor-text"
          )}
        >
          {value !== null ? formatted : readOnly ? "—" : "Empty"}
        </span>
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setDraft(value?.toString() ?? "");
          setEditing(false);
        }
      }}
      className={cn(
        "h-full w-full bg-transparent px-2 py-1 text-right text-sm tabular-nums text-[var(--text-primary)]",
        "outline-none ring-1 ring-inset ring-[var(--accent)]",
        "rounded-[var(--radius-sm)]",
        className
      )}
    />
  );
}
