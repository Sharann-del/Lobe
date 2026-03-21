"use client";

import { EyeOff, Layers, Tag } from "lucide-react";
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
import { CardDisplayConfig } from "./CardDisplayConfig";
import type { PropertySchema, PropertyValueType } from "@/lib/types/properties";
import type { CardDisplayField } from "@/lib/stores/kanbanViewStore";

const GROUPABLE_TYPES: PropertyValueType[] = [
  "select",
  "multi_select",
  "person",
];

interface KanbanToolbarProps {
  schemas: PropertySchema[];
  groupByPropertyId: string | null;
  subGroupByPropertyId: string | null;
  hideEmptyGroups: boolean;
  cardDisplayFields: CardDisplayField[];
  onGroupByChange: (propertyId: string | null) => void;
  onSubGroupByChange: (propertyId: string | null) => void;
  onHideEmptyToggle: () => void;
  onToggleCardField: (propertyId: string) => void;
  className?: string;
}

export function KanbanToolbar({
  schemas,
  groupByPropertyId,
  subGroupByPropertyId,
  hideEmptyGroups,
  cardDisplayFields,
  onGroupByChange,
  onSubGroupByChange,
  onHideEmptyToggle,
  onToggleCardField,
  className,
}: KanbanToolbarProps): React.ReactElement {
  const groupableSchemas = schemas.filter((s) =>
    GROUPABLE_TYPES.includes(s.type)
  );

  const activeGroupSchema = schemas.find((s) => s.id === groupByPropertyId);
  const activeSubGroupSchema = schemas.find(
    (s) => s.id === subGroupByPropertyId
  );

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 border-b border-[var(--border-subtle)] px-4 py-1.5",
        className
      )}
    >
      {/* Group by */}
      <GroupByPicker
        label="Group"
        icon={<Tag size={14} />}
        schemas={groupableSchemas}
        activeId={groupByPropertyId}
        excludeId={subGroupByPropertyId}
        onChange={onGroupByChange}
      />

      {/* Sub-group by */}
      <GroupByPicker
        label="Sub-group"
        icon={<Layers size={14} />}
        schemas={groupableSchemas}
        activeId={subGroupByPropertyId}
        excludeId={groupByPropertyId}
        onChange={onSubGroupByChange}
      />

      {/* Hide empty */}
      <button
        type="button"
        onClick={onHideEmptyToggle}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] px-2",
          "text-xs transition-colors duration-fast",
          hideEmptyGroups
            ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-3)]"
        )}
      >
        <EyeOff size={14} />
        Hide empty
      </button>

      <div className="flex-1" />

      {/* Card display config */}
      <CardDisplayConfig
        schemas={schemas}
        fields={cardDisplayFields}
        onToggle={onToggleCardField}
      />
    </div>
  );
}

function GroupByPicker({
  label,
  icon,
  schemas,
  activeId,
  excludeId,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  schemas: PropertySchema[];
  activeId: string | null;
  excludeId: string | null;
  onChange: (id: string | null) => void;
}): React.ReactElement {
  const active = schemas.find((s) => s.id === activeId);
  const available = schemas.filter((s) => s.id !== excludeId);

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
        <DropdownMenuLabel>{label} by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activeId && (
          <>
            <DropdownMenuItem onClick={() => onChange(null)}>
              None
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {available.map((s) => {
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
        {available.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-[var(--text-tertiary)]">
            No groupable properties
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
