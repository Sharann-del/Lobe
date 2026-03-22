"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CellEmailProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

export function CellEmail({
  value,
  onChange,
  readOnly,
  className,
}: CellEmailProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  }, [draft, value, onChange]);

  if (readOnly || !editing) {
    return (
      <div
        className={cn("flex w-full items-center gap-1.5 px-2 py-1", !readOnly && "cursor-text", className)}
        onDoubleClick={() => !readOnly && setEditing(true)}
      >
        {value ? (
          <>
            <Mail size={12} className="shrink-0 text-[var(--text-tertiary)]" />
            <span className="truncate text-sm text-[var(--text-primary)]">{value}</span>
          </>
        ) : (
          <span className="text-sm text-[var(--text-placeholder)]">{readOnly ? "—" : "Empty"}</span>
        )}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type="email"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      }}
      placeholder="name@example.com"
      className={cn(
        "h-full w-full bg-transparent px-2 py-1 text-sm text-[var(--text-primary)]",
        "outline-none ring-1 ring-inset ring-[var(--accent)] rounded-[var(--radius-sm)]",
        className
      )}
    />
  );
}
