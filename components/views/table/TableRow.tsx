"use client";

import { useCallback, useMemo } from "react";
import { Check, Copy, ExternalLink, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useTableViewStore } from "@/lib/stores/tableViewStore";
import { PropertyCell } from "./PropertyCell";
import type { PageRow } from "@/lib/types/pages";
import type {
  ColumnConfig,
  PageProperty,
  PropertySchema,
} from "@/lib/types/properties";

interface TableRowProps {
  page: PageRow;
  schemas: PropertySchema[];
  columns: ColumnConfig[];
  properties: PageProperty[];
  selected: boolean;
  onOpen: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onNavigateRelation?: (pageId: string) => void;
  className?: string;
}

export function TableRow({
  page,
  schemas,
  columns,
  properties,
  selected,
  onOpen,
  onDuplicate,
  onDelete,
  onNavigateRelation,
  className,
}: TableRowProps): React.ReactElement {
  const toggleRowSelection = useTableViewStore((s) => s.toggleRowSelection);
  const updatePropertyValue = useTableViewStore((s) => s.updatePropertyValue);

  const schemaMap = useMemo(() => {
    const map = new Map<string, PropertySchema>();
    for (const s of schemas) map.set(s.id, s);
    return map;
  }, [schemas]);

  const propMap = useMemo(() => {
    const map = new Map<string, PageProperty>();
    for (const p of properties) map.set(p.key, p);
    return map;
  }, [properties]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const handleCellChange = useCallback(
    (schemaName: string, schemaType: string, value: unknown) => {
      void updatePropertyValue(page.id, schemaName, schemaType, value);
    },
    [page.id, updatePropertyValue]
  );

  return (
    <div
      className={cn(
        "group flex border-b border-[var(--border-subtle)]",
        "transition-colors duration-fast",
        "hover:bg-[var(--bg-2)]",
        selected && "bg-[var(--color-blue-muted)]",
        className
      )}
    >
      {/* Checkbox column */}
      <div
        className="sticky left-0 z-10 flex shrink-0 items-center justify-center border-r border-[var(--border-subtle)] bg-inherit"
        style={{ width: 36 }}
      >
        <button
          type="button"
          onClick={() => toggleRowSelection(page.id)}
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-[3px] border",
            "transition-all duration-fast",
            selected
              ? "border-[var(--accent)] bg-[var(--accent)]"
              : "border-[var(--border-default)] opacity-0 group-hover:opacity-100"
          )}
        >
          {selected && <Check size={10} className="text-[var(--bg-0)]" />}
        </button>
      </div>

      {/* Title column — frozen */}
      <div
        className="sticky left-[36px] z-10 flex shrink-0 items-center gap-2 border-r border-[var(--border-subtle)] bg-inherit px-2 py-1"
        style={{ width: 280 }}
      >
        <span className="shrink-0 text-sm">
          {page.icon ?? <FileText size={14} className="text-[var(--text-tertiary)]" />}
        </span>
        <button
          type="button"
          onClick={() => onOpen(page.id)}
          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-[var(--text-primary)] hover:underline"
        >
          {page.title || "Untitled"}
        </button>

        {/* Row actions — visible on hover */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-fast group-hover:opacity-100">
          <RowActionsMenu
            onOpen={() => onOpen(page.id)}
            onDuplicate={() => onDuplicate(page.id)}
            onDelete={() => onDelete(page.id)}
          />
        </div>
      </div>

      {/* Property columns */}
      {visibleColumns.map((col) => {
        const schema = schemaMap.get(col.propertyId);
        if (!schema) return null;
        const prop = propMap.get(schema.name);
        const value = prop?.value ?? null;

        return (
          <div
            key={col.propertyId}
            className="flex shrink-0 items-center border-r border-[var(--border-subtle)]"
            style={{ width: col.width }}
          >
            <PropertyCell
              schema={schema}
              value={value}
              onChange={(v) => handleCellChange(schema.name, schema.type, v)}
              onNavigate={onNavigateRelation}
              className="w-full"
            />
          </div>
        );
      })}
    </div>
  );
}

function RowActionsMenu({
  onOpen,
  onDuplicate,
  onDelete,
}: {
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}): React.ReactElement {
  return (
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
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onOpen}>
          <ExternalLink size={14} />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy size={14} />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={onDelete}>
          <Trash2 size={14} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
