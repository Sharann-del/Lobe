"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Copy, ExternalLink, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { NodeRow } from "@/lib/types/nodes";
import type {
  NodeProperty,
  PropertySchema,
  SelectOption,
} from "@/lib/types/properties";
import type { StreamDensity } from "@/lib/stores/streamViewStore";
import type { BadgeColor } from "@/components/ui/Badge";

interface ListItemProps {
  page: NodeRow;
  properties: NodeProperty[];
  subtitleSchema: PropertySchema | null;
  statusSchema: PropertySchema | null;
  dateSchema: PropertySchema | null;
  density: StreamDensity;
  onOpen: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  className?: string;
}

const STATUS_DOT_COLORS: Record<BadgeColor, string> = {
  red: "bg-[var(--color-red)]",
  orange: "bg-[var(--color-orange)]",
  yellow: "bg-[var(--color-yellow)]",
  green: "bg-[var(--color-green)]",
  teal: "bg-[var(--color-teal)]",
  blue: "bg-[var(--color-blue)]",
  purple: "bg-[var(--color-purple)]",
  pink: "bg-[var(--color-pink)]",
  gray: "bg-[var(--color-gray)]",
};

export function ListItem({
  page,
  properties,
  subtitleSchema,
  statusSchema,
  dateSchema,
  density,
  onOpen,
  onDuplicate,
  onDelete,
  className,
}: ListItemProps): React.ReactElement {
  const propMap = useMemo(() => {
    const map = new Map<string, NodeProperty>();
    for (const p of properties) map.set(p.key, p);
    return map;
  }, [properties]);

  const subtitle = useMemo(() => {
    if (!subtitleSchema) return null;
    const prop = propMap.get(subtitleSchema.name);
    if (!prop?.value) return null;
    return String(prop.value);
  }, [subtitleSchema, propMap]);

  const statusOption = useMemo((): SelectOption | null => {
    if (!statusSchema) return null;
    const prop = propMap.get(statusSchema.name);
    if (!prop?.value) return null;
    return (
      statusSchema.options.find(
        (o) => o.id === prop.value || o.name === prop.value
      ) ?? null
    );
  }, [statusSchema, propMap]);

  const dateStr = useMemo(() => {
    if (!dateSchema) return null;
    const prop = propMap.get(dateSchema.name);
    if (!prop?.value || typeof prop.value !== "string") return null;
    try {
      return format(parseISO(prop.value as string), "MMM d");
    } catch {
      return null;
    }
  }, [dateSchema, propMap]);

  const isCompact = density === "compact";

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-3 border-b border-[var(--border-subtle)]",
        "transition-colors duration-fast",
        "hover:bg-[var(--bg-2)]",
        isCompact ? "px-3 py-1.5" : "px-4 py-2.5",
        className
      )}
      onClick={() => onOpen(page.id)}
    >
      {/* Status dot */}
      {statusOption && (
        <span
          className={cn(
            "shrink-0 rounded-full",
            isCompact ? "h-2 w-2" : "h-2.5 w-2.5",
            STATUS_DOT_COLORS[statusOption.color]
          )}
        />
      )}

      {/* Icon */}
      <span className={cn("shrink-0", isCompact ? "text-sm" : "text-base")}>
        {page.icon ?? (
          <FileText
            size={isCompact ? 14 : 16}
            className="text-[var(--text-tertiary)]"
          />
        )}
      </span>

      {/* Title + subtitle */}
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-medium text-[var(--text-primary)]",
            isCompact ? "text-xs" : "text-sm"
          )}
        >
          {page.title || "Untitled"}
        </span>
        {subtitle && !isCompact && (
          <span className="mt-0.5 block truncate text-[11px] text-[var(--text-secondary)]">
            {subtitle}
          </span>
        )}
      </div>

      {/* Date */}
      {dateStr && (
        <span
          className={cn(
            "shrink-0 tabular-nums text-[var(--text-tertiary)]",
            isCompact ? "text-[10px]" : "text-xs"
          )}
        >
          {dateStr}
        </span>
      )}

      {/* Actions */}
      <div
        className="shrink-0 opacity-0 transition-opacity duration-fast group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)]",
                "text-[var(--text-tertiary)] transition-colors duration-fast",
                "hover:bg-[var(--bg-4)] hover:text-[var(--text-primary)]"
              )}
            >
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem onClick={() => onOpen(page.id)}>
              <ExternalLink size={14} />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(page.id)}>
              <Copy size={14} />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => onDelete(page.id)}>
              <Trash2 size={14} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
