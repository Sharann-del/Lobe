"use client";

import { Calendar, Layers, Palette, Tag } from "lucide-react";
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
import {
  TIMELINE_ZOOM_LABELS,
  TIMELINE_ZOOM_LEVELS,
  type TimelineZoom,
} from "@/lib/types/timeline";
import type { PropertySchema, PropertyValueType } from "@/lib/types/properties";

const GROUPABLE_TYPES: PropertyValueType[] = [
  "select",
  "multi_select",
  "person",
];

interface TimelineToolbarProps {
  schemas: PropertySchema[];
  zoom: TimelineZoom;
  startDatePropertyId: string | null;
  endDatePropertyId: string | null;
  colorByPropertyId: string | null;
  groupByPropertyId: string | null;
  onZoomChange: (zoom: TimelineZoom) => void;
  onStartDateChange: (id: string | null) => void;
  onEndDateChange: (id: string | null) => void;
  onColorByChange: (id: string | null) => void;
  onGroupByChange: (id: string | null) => void;
  className?: string;
}

export function TimelineToolbar({
  schemas,
  zoom,
  startDatePropertyId,
  endDatePropertyId,
  colorByPropertyId,
  groupByPropertyId,
  onZoomChange,
  onStartDateChange,
  onEndDateChange,
  onColorByChange,
  onGroupByChange,
  className,
}: TimelineToolbarProps): React.ReactElement {
  const dateSchemas = schemas.filter(
    (s) => s.type === "date" || s.type === "created_time" || s.type === "last_edited_time"
  );
  const selectSchemas = schemas.filter(
    (s) => s.type === "select" || s.type === "multi_select"
  );
  const groupableSchemas = schemas.filter((s) =>
    GROUPABLE_TYPES.includes(s.type)
  );

  const startSchema = schemas.find((s) => s.id === startDatePropertyId);
  const endSchema = schemas.find((s) => s.id === endDatePropertyId);
  const colorSchema = schemas.find((s) => s.id === colorByPropertyId);
  const groupSchema = schemas.find((s) => s.id === groupByPropertyId);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 border-b border-[var(--border-subtle)] px-4 py-1.5",
        className
      )}
    >
      {/* Zoom switcher */}
      <div className="flex items-center rounded-[var(--radius-md)] bg-[var(--bg-2)] p-0.5">
        {TIMELINE_ZOOM_LEVELS.map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => onZoomChange(z)}
            className={cn(
              "rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-medium",
              "transition-all duration-fast",
              zoom === z
                ? "bg-[var(--bg-4)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {TIMELINE_ZOOM_LABELS[z]}
          </button>
        ))}
      </div>

      <div className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />

      {/* Start date picker */}
      <PropertyPicker
        label="Start"
        icon={<Calendar size={14} />}
        schemas={dateSchemas}
        activeId={startDatePropertyId}
        activeName={startSchema?.name}
        onChange={onStartDateChange}
      />

      {/* End date picker */}
      <PropertyPicker
        label="End"
        icon={<Calendar size={14} />}
        schemas={dateSchemas}
        activeId={endDatePropertyId}
        activeName={endSchema?.name}
        onChange={onEndDateChange}
      />

      <div className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />

      {/* Color by */}
      <PropertyPicker
        label="Color"
        icon={<Palette size={14} />}
        schemas={selectSchemas}
        activeId={colorByPropertyId}
        activeName={colorSchema?.name}
        onChange={onColorByChange}
      />

      {/* Group by */}
      <PropertyPicker
        label="Group"
        icon={<Layers size={14} />}
        schemas={groupableSchemas}
        activeId={groupByPropertyId}
        activeName={groupSchema?.name}
        onChange={onGroupByChange}
      />
    </div>
  );
}

function PropertyPicker({
  label,
  icon,
  schemas,
  activeId,
  activeName,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  schemas: PropertySchema[];
  activeId: string | null;
  activeName: string | undefined;
  onChange: (id: string | null) => void;
}): React.ReactElement {
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
          {activeName && (
            <span className="font-medium text-[var(--accent)]">
              {activeName}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4}>
        <DropdownMenuLabel>{label} property</DropdownMenuLabel>
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
