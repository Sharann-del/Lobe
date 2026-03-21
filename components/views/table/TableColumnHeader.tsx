"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTableViewStore } from "@/lib/stores/tableViewStore";
import { PROPERTY_TYPE_ICONS } from "@/lib/views/property-icons";
import { ColumnHeaderMenu } from "./ColumnHeaderMenu";
import type { PropertySchema, SortDirection } from "@/lib/types/properties";
import { MIN_COLUMN_WIDTH } from "@/lib/types/properties";

interface TableColumnHeaderProps {
  schema: PropertySchema;
  width: number;
  sortDirection: SortDirection | null;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  className?: string;
}

export function TableColumnHeader({
  schema,
  width,
  sortDirection,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  className,
}: TableColumnHeaderProps): React.ReactElement {
  const toggleSort = useTableViewStore((s) => s.toggleSort);
  const setSort = useTableViewStore((s) => s.setSort);
  const setColumnWidth = useTableViewStore((s) => s.setColumnWidth);
  const toggleColumnVisibility = useTableViewStore((s) => s.toggleColumnVisibility);
  const deleteSchema = useTableViewStore((s) => s.deleteSchema);

  const [resizing, setResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  const Icon = PROPERTY_TYPE_ICONS[schema.type];

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      const handleMove = (ev: MouseEvent): void => {
        const delta = ev.clientX - startXRef.current;
        setColumnWidth(schema.id, Math.max(MIN_COLUMN_WIDTH, startWidthRef.current + delta));
      };

      const handleUp = (): void => {
        setResizing(false);
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [width, schema.id, setColumnWidth]
  );

  const handleSort = useCallback(
    (direction: SortDirection) => {
      setSort(schema.id, direction);
    },
    [schema.id, setSort]
  );

  return (
    <ColumnHeaderMenu
      onSort={handleSort}
      onHide={() => toggleColumnVisibility(schema.id)}
      onRename={() => {/* TODO: inline rename */}}
      onDelete={() => void deleteSchema(schema.id)}
    >
      <div
        className={cn(
          "group relative flex h-8 shrink-0 select-none items-center gap-1.5 border-r border-[var(--border-subtle)]",
          "bg-[var(--bg-1)] px-2",
          "transition-colors duration-fast",
          resizing && "bg-[var(--bg-2)]",
          className
        )}
        style={{ width }}
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(index);
        }}
        onDragEnd={onDragEnd}
      >
        <Icon size={14} className="shrink-0 text-[var(--text-tertiary)]" />
        <button
          type="button"
          onClick={() => toggleSort(schema.id)}
          className="flex min-w-0 flex-1 items-center gap-1 truncate text-xs font-medium text-[var(--text-secondary)]"
        >
          <span className="truncate">{schema.name}</span>
          {sortDirection === "asc" && (
            <ArrowUp size={12} className="shrink-0 text-[var(--accent)]" />
          )}
          {sortDirection === "desc" && (
            <ArrowDown size={12} className="shrink-0 text-[var(--accent)]" />
          )}
        </button>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className={cn(
            "absolute -right-px top-0 z-10 h-full w-1 cursor-col-resize",
            "opacity-0 transition-opacity duration-fast group-hover:opacity-100",
            resizing && "opacity-100 bg-[var(--accent)]"
          )}
        />
      </div>
    </ColumnHeaderMenu>
  );
}
