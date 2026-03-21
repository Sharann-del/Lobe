"use client";

import { MapPin, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { LocationMapEntry } from "./location-entries";

export interface LocationSidePanelProps {
  entries: LocationMapEntry[];
  totalCount: number;
  highlightedId: string | null;
  onHighlight: (_pageId: string) => void;
  onOpenPage: (_pageId: string) => void;
  className?: string;
}

export function LocationSidePanel({
  entries,
  totalCount,
  highlightedId,
  onHighlight,
  onOpenPage,
  className,
}: LocationSidePanelProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex w-[280px] shrink-0 flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-1)]",
        className
      )}
    >
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-1">
          {entries.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-[var(--text-tertiary)]">
              No matching entries
            </p>
          )}
          {entries.map((e) => {
            const active = e.page.id === highlightedId;
            return (
              <div
                key={e.page.id}
                className={cn(
                  "flex flex-col gap-1 rounded-[var(--radius-sm)] p-2",
                  "transition-colors duration-fast",
                  active
                    ? "bg-[var(--color-blue-muted)]"
                    : "hover:bg-[var(--bg-2)]"
                )}
              >
                <button
                  type="button"
                  onClick={() => onHighlight(e.page.id)}
                  className="flex w-full items-start gap-2 text-left"
                >
                  <span className="shrink-0 text-base leading-none">
                    {e.page.icon ?? (
                      <MapPin
                        size={16}
                        className="text-[var(--text-tertiary)]"
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                      {e.label}
                    </span>
                    {e.quickProps.slice(0, 2).map((p) => (
                      <span
                        key={p.name}
                        className="mt-0.5 block truncate text-[10px] text-[var(--text-tertiary)]"
                      >
                        {p.name}: {p.value}
                      </span>
                    ))}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPage(e.page.id)}
                  className={cn(
                    "flex items-center gap-1 self-start rounded-[var(--radius-sm)] px-1.5 py-0.5",
                    "text-[10px] text-[var(--text-secondary)]",
                    "transition-colors duration-fast hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <ExternalLink size={12} />
                  Open
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t border-[var(--border-subtle)] px-2 py-1.5 text-[10px] text-[var(--text-tertiary)]">
        {entries.length === totalCount
          ? `${entries.length} on map`
          : `${entries.length} of ${totalCount} shown`}
      </div>
    </div>
  );
}
