"use client";

import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Avatar,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { PageRow } from "@/lib/types/pages";
import type {
  PageProperty,
  PersonValue,
  PropertySchema,
  SelectOption,
} from "@/lib/types/properties";
import type { CardDisplayField } from "@/lib/stores/kanbanViewStore";

interface KanbanCardProps {
  page: PageRow;
  properties: PageProperty[];
  schemas: PropertySchema[];
  displayFields: CardDisplayField[];
  onOpen: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  className?: string;
}

export function KanbanCard({
  page,
  properties,
  schemas,
  displayFields,
  onOpen,
  onDuplicate,
  onDelete,
  className,
}: KanbanCardProps): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id, data: { type: "card", page } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const propMap = useMemo(() => {
    const map = new Map<string, PageProperty>();
    for (const p of properties) map.set(p.key, p);
    return map;
  }, [properties]);

  const schemaMap = useMemo(() => {
    const map = new Map<string, PropertySchema>();
    for (const s of schemas) map.set(s.id, s);
    return map;
  }, [schemas]);

  const visibleFields = useMemo(
    () => displayFields.filter((f) => f.visible),
    [displayFields]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(page.id)}
      className={cn(
        "group relative cursor-pointer rounded-[var(--radius-md)]",
        "border border-[var(--border-subtle)] bg-[var(--bg-1)]",
        "p-2.5 shadow-[var(--shadow-sm)]",
        "transition-all duration-fast",
        "hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)]",
        isDragging && "z-50 opacity-50 shadow-[var(--shadow-lg)]",
        className
      )}
    >
      {/* Title row */}
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-sm">
          {page.icon ?? (
            <FileText size={14} className="text-[var(--text-tertiary)]" />
          )}
        </span>
        <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-[var(--text-primary)]">
          {page.title || "Untitled"}
        </span>

        {/* Hover actions */}
        <div
          className="shrink-0 opacity-0 transition-opacity duration-fast group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <CardActionsMenu
            onOpen={() => onOpen(page.id)}
            onDuplicate={() => onDuplicate(page.id)}
            onDelete={() => onDelete(page.id)}
          />
        </div>
      </div>

      {/* Property previews */}
      {visibleFields.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {visibleFields.map((field) => {
            const schema = schemaMap.get(field.propertyId);
            if (!schema) return null;
            const prop = propMap.get(schema.name);
            const value = prop?.value ?? null;
            if (value === null || value === undefined) return null;
            return (
              <CardPropertyPreview
                key={field.propertyId}
                schema={schema}
                value={value}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function CardPropertyPreview({
  schema,
  value,
}: {
  schema: PropertySchema;
  value: unknown;
}): React.ReactElement | null {
  switch (schema.type) {
    case "select": {
      const opt = schema.options.find(
        (o: SelectOption) => o.id === value || o.name === value
      );
      if (!opt) return null;
      return <Badge color={opt.color}>{opt.name}</Badge>;
    }

    case "multi_select": {
      const ids = (value as string[]) ?? [];
      const opts = schema.options.filter(
        (o: SelectOption) => ids.includes(o.id) || ids.includes(o.name)
      );
      if (opts.length === 0) return null;
      return (
        <>
          {opts.map((o: SelectOption) => (
            <Badge key={o.id} color={o.color}>
              {o.name}
            </Badge>
          ))}
        </>
      );
    }

    case "person":
    case "created_by":
    case "last_edited_by": {
      const people = (value as PersonValue[]) ?? [];
      if (people.length === 0) return null;
      return (
        <div className="flex -space-x-1">
          {people.slice(0, 3).map((p) => (
            <Avatar
              key={p.id}
              src={p.avatar_url}
              fallback={p.name.slice(0, 2).toUpperCase()}
              className="h-5 w-5 border border-[var(--bg-1)] text-[8px]"
            />
          ))}
          {people.length > 3 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-4)] text-[8px] text-[var(--text-secondary)]">
              +{people.length - 3}
            </span>
          )}
        </div>
      );
    }

    case "date": {
      const dateStr = value as string;
      if (!dateStr) return null;
      return (
        <span className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
          <Calendar size={10} />
          {format(parseISO(dateStr), "MMM d")}
        </span>
      );
    }

    case "checkbox":
    case "boolean": {
      const checked = Boolean(value);
      return (
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-[3px] border",
            checked
              ? "border-[var(--accent)] bg-[var(--accent)]"
              : "border-[var(--border-default)]"
          )}
        >
          {checked && <Check size={10} className="text-[var(--bg-0)]" />}
        </span>
      );
    }

    case "number": {
      return (
        <span className="text-[11px] tabular-nums text-[var(--text-secondary)]">
          {String(value)}
        </span>
      );
    }

    default:
      return null;
  }
}

function CardActionsMenu({
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
      <DropdownMenuContent align="end" sideOffset={4}>
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
