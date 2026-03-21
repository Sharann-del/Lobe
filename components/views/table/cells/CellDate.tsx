"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface CellDateProps {
  value: string | null;
  onChange: (value: string | null) => void;
  readOnly?: boolean;
  className?: string;
}

export function CellDate({
  value,
  onChange,
  readOnly,
  className,
}: CellDateProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.showPicker?.();
    }
  }, [editing]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value || null;
      onChange(next);
      setEditing(false);
    },
    [onChange]
  );

  const formatted = value
    ? format(parseISO(value), "MMM d, yyyy")
    : null;

  if (readOnly || !editing) {
    return (
      <span
        className={cn(
          "block w-full truncate px-2 py-1 text-sm",
          formatted
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-placeholder)]",
          !readOnly && "cursor-pointer",
          className
        )}
        onClick={() => !readOnly && setEditing(true)}
      >
        {formatted ?? (readOnly ? "—" : "Empty")}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="date"
      value={value ?? ""}
      onChange={handleChange}
      onBlur={() => setEditing(false)}
      className={cn(
        "h-full w-full bg-transparent px-2 py-1 text-sm text-[var(--text-primary)]",
        "outline-none ring-1 ring-inset ring-[var(--accent)]",
        "rounded-[var(--radius-sm)]",
        className
      )}
    />
  );
}
