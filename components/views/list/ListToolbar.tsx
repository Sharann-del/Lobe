"use client";

import {
  AlignJustify,
  ArrowDownUp,
  Calendar,
  Layers,
  List,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { PROPERTY_TYPE_ICONS } from "@/lib/views/property-icons";
import type { PropertySchema, PropertyValueType } from "@/lib/types/properties";
import type { ListDensity } from "@/lib/stores/listViewStore";

const GROUPABLE_TYPES: PropertyValueType[] = [
  "select",
  "multi_select",
  "person",
];

interface ListToolbarProps {
  schemas: PropertySchema[];
  subtitlePropertyId: string | null;
  statusPropertyId: string | null;
  datePropertyId: string | null;
  groupByPropertyId: string | null;
  sortPropertyId: string | null;
  density: ListDensity;
  onSubtitleChange: (id: string | null) => void;
  onStatusChange: (id: string | null) => void;
  onDateChange: (id: string | null) => void;
  onGroupByChange: (id: string | null) => void;
  onSortChange: (id: string) => void;
  onDensityChange: (d: ListDensity) => void;
  className?: string;
}

export function ListToolbar({
  schemas,
  subtitlePropertyId,
  statusPropertyId,
  datePropertyId,
  groupByPropertyId,
  sortPropertyId,
  density,
  onSubtitleChange,
  onStatusChange,
  onDateChange,
  onGroupByChange,
  onSortChange,
  onDensityChange,
  className,
}: ListToolbarProps): React.ReactElement {
  const textSchemas = schemas.filter(
    (s) => s.type === "text" || s.type === "number" || s.type === "url"
  );
  const selectSchemas = schemas.filter(
    (s) => s.type === "select" || s.type === "multi_select"
  );
  const dateSchemas = schemas.filter(
    (s) =>
      s.type === "date" ||
      s.type === "created_time" ||
      s.type === "last_edited_time"
  );
  const groupableSchemas = schemas.filter((s) =>
    GROUPABLE_TYPES.includes(s.type)
  );

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 border-b border-[var(--border-subtle)] px-4 py-1.5",
        className
      )}
    >
      {/* Subtitle */}
      <SchemaPicker
        label="Subtitle"
        icon={<AlignJustify size={14} />}
        schemas={textSchemas}
        activeId={subtitlePropertyId}
        onChange={onSubtitleChange}
      />

      {/* Status */}
      <SchemaPicker
        label="Status"
        icon={<Tag size={14} />}
        schemas={selectSchemas}
        activeId={statusPropertyId}
        onChange={onStatusChange}
      />

      {/* Date */}
      <SchemaPicker
        label="Date"
        icon={<Calendar size={14} />}
        schemas={dateSchemas}
        activeId={datePropertyId}
        onChange={onDateChange}
      />

      {/* Group by */}
      <SchemaPicker
        label="Group"
        icon={<Layers size={14} />}
        schemas={groupableSchemas}
        activeId={groupByPropertyId}
        onChange={onGroupByChange}
      />

      {/* Sort */}
      <SchemaPicker
        label="Sort"
        icon={<ArrowDownUp size={14} />}
        schemas={schemas}
        activeId={sortPropertyId}
        onChange={(id) => {
          if (id) onSortChange(id);
        }}
      />

      <div className="flex-1" />

      {/* Density toggle */}
      <div className="flex items-center rounded-[var(--radius-md)] bg-[var(--bg-2)] p-0.5">
        <button
          type="button"
          onClick={() => onDensityChange("compact")}
          className={cn(
            "rounded-[var(--radius-sm)] p-1 transition-all duration-fast",
            density === "compact"
              ? "bg-[var(--bg-4)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDensityChange("comfortable")}
          className={cn(
            "rounded-[var(--radius-sm)] p-1 transition-all duration-fast",
            density === "comfortable"
              ? "bg-[var(--bg-4)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
        >
          <AlignJustify size={14} />
        </button>
      </div>
    </div>
  );
}

function SchemaPicker({
  label,
  icon,
  schemas,
  activeId,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  schemas: PropertySchema[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}): React.ReactElement {
  const active = schemas.find((s) => s.id === activeId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] px-2",
            "text-xs transition-colors duration-fast",
            activeId
              ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-3)]"
          )}
        >
          {icon}
          {label}
          {active && (
            <span className="font-medium text-[var(--accent)]">
              {active.name}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activeId && (
          <>
            <DropdownMenuItem onClick={() => onChange(null)}>
              None
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {schemas.map((s) => {
          const Icon = PROPERTY_TYPE_ICONS[s.type];
          return (
            <DropdownMenuItem
              key={s.id}
              onClick={() => onChange(s.id)}
              className={cn(s.id === activeId && "bg-[var(--bg-3)]")}
            >
              <Icon size={14} />
              {s.name}
            </DropdownMenuItem>
          );
        })}
        {schemas.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-[var(--text-tertiary)]">
            No matching properties
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
