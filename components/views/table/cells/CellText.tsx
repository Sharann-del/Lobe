"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface CellTextProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

export function CellText({
  value,
  onChange,
  readOnly,
  className,
}: CellTextProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value) {
      onChange(draft);
    }
  }, [draft, value, onChange]);

  if (readOnly || !editing) {
    return (
      <span
        className={cn(
          "block w-full truncate px-2 py-1 text-sm text-[var(--text-primary)]",
          !value && "text-[var(--text-placeholder)]",
          !readOnly && "cursor-text",
          className
        )}
        onDoubleClick={() => !readOnly && setEditing(true)}
      >
        {value || (readOnly ? "—" : "Empty")}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      className={cn(
        "h-full w-full bg-transparent px-2 py-1 text-sm text-[var(--text-primary)]",
        "outline-none ring-1 ring-inset ring-[var(--accent)]",
        "rounded-[var(--radius-sm)]",
        className
      )}
    />
  );
}
