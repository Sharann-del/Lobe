"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { NumberFormat } from "@/lib/types/properties";

interface CellNumberProps {
  value: number | null;
  onChange: (value: number | null) => void;
  format?: NumberFormat;
  readOnly?: boolean;
  className?: string;
}

function formatNumber(val: number | null, fmt: NumberFormat): string {
  if (val === null || val === undefined) return "";
  switch (fmt) {
    case "currency":
      return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "percent":
      return `${val}%`;
    default:
      return val.toLocaleString("en-US");
  }
}

export function CellNumber({
  value,
  onChange,
  format: fmt = "plain",
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

  if (readOnly || !editing) {
    return (
      <span
        className={cn(
          "block w-full truncate px-2 py-1 text-right text-sm tabular-nums",
          value !== null
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-placeholder)]",
          !readOnly && "cursor-text",
          className
        )}
        onDoubleClick={() => !readOnly && setEditing(true)}
      >
        {value !== null ? formatNumber(value, fmt) : readOnly ? "—" : "Empty"}
      </span>
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
