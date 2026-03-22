"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

interface CellUrlProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

function faviconUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    return `/api/favicon?domain=${encodeURIComponent(hostname)}`;
  } catch {
    return null;
  }
}

export function CellUrl({
  value,
  onChange,
  readOnly,
  className,
}: CellUrlProps): React.ReactElement {
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
    if (draft !== value) onChange(draft);
  }, [draft, value, onChange]);

  const favicon = value ? faviconUrl(value) : null;

  if (readOnly || !editing) {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-1.5 px-2 py-1",
          !readOnly && "cursor-text",
          className
        )}
        onDoubleClick={() => !readOnly && setEditing(true)}
      >
        {value ? (
          <>
            {favicon && (
              <img
                src={favicon}
                alt=""
                className="h-3.5 w-3.5 shrink-0 rounded-[2px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <Tooltip content={value}>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="truncate text-sm text-[var(--color-blue)] underline decoration-[var(--color-blue)]/30 hover:decoration-[var(--color-blue)]"
              >
                {stripProtocol(value)}
              </a>
            </Tooltip>
            <ExternalLink
              size={12}
              className="shrink-0 text-[var(--text-tertiary)]"
            />
          </>
        ) : (
          <span className="text-sm text-[var(--text-placeholder)]">
            {readOnly ? "—" : "Empty"}
          </span>
        )}
      </div>
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
      placeholder="https://…"
      className={cn(
        "h-full w-full bg-transparent px-2 py-1 text-sm text-[var(--text-primary)]",
        "outline-none ring-1 ring-inset ring-[var(--accent)]",
        "rounded-[var(--radius-sm)]",
        className
      )}
    />
  );
}
