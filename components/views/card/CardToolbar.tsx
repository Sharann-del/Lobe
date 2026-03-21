"use client";

import { Grid2X2, Layers, Maximize2, Minimize2, Tag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { PROPERTY_TYPE_ICONS } from "@/lib/views/property-icons";
import type { PropertySchema, PropertyValueType } from "@/lib/types/properties";
import type {
  CardSize,
  ColumnCount,
  ImageFit,
} from "@/lib/stores/cardViewStore";

const COLUMN_OPTIONS: ColumnCount[] = [2, 3, 4, 5];
const SIZE_OPTIONS: { value: CardSize; label: string }[] = [
  { value: "small", label: "S" },
  { value: "medium", label: "M" },
  { value: "large", label: "L" },
];

const GROUPABLE_TYPES: PropertyValueType[] = [
  "select",
  "multi_select",
  "person",
];

const BADGE_TYPES: PropertyValueType[] = [
  "select",
  "multi_select",
  "person",
  "date",
  "checkbox",
];

interface CardToolbarProps {
  schemas: PropertySchema[];
  columns: ColumnCount;
  cardSize: CardSize;
  imageFit: ImageFit;
  badgePropertyIds: string[];
  groupByPropertyId: string | null;
  onColumnsChange: (c: ColumnCount) => void;
  onCardSizeChange: (s: CardSize) => void;
  onImageFitChange: (f: ImageFit) => void;
  onToggleBadge: (id: string) => void;
  onGroupByChange: (id: string | null) => void;
  className?: string;
}

export function CardToolbar({
  schemas,
  columns,
  cardSize,
  imageFit,
  badgePropertyIds,
  groupByPropertyId,
  onColumnsChange,
  onCardSizeChange,
  onImageFitChange,
  onToggleBadge,
  onGroupByChange,
  className,
}: CardToolbarProps): React.ReactElement {
  const groupableSchemas = schemas.filter((s) =>
    GROUPABLE_TYPES.includes(s.type)
  );
  const badgeSchemas = schemas.filter((s) => BADGE_TYPES.includes(s.type));

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 border-b border-[var(--border-subtle)] px-4 py-1.5",
        className
      )}
    >
      {/* Columns */}
      <div className="flex items-center gap-0.5 rounded-[var(--radius-md)] bg-[var(--bg-2)] p-0.5">
        {COLUMN_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onColumnsChange(c)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)]",
              "text-[10px] font-medium transition-all duration-fast",
              columns === c
                ? "bg-[var(--bg-4)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Card size */}
      <div className="flex items-center gap-0.5 rounded-[var(--radius-md)] bg-[var(--bg-2)] p-0.5">
        {SIZE_OPTIONS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onCardSizeChange(s.value)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)]",
              "text-[10px] font-medium transition-all duration-fast",
              cardSize === s.value
                ? "bg-[var(--bg-4)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Image fit */}
      <Tooltip
        content={
          imageFit === "cover"
            ? "Switch to fit image"
            : "Switch to crop image"
        }
      >
        <button
          type="button"
          onClick={() =>
            onImageFitChange(imageFit === "cover" ? "contain" : "cover")
          }
          className={cn(
            "flex h-7 items-center gap-1 rounded-[var(--radius-sm)] px-2",
            "text-xs text-[var(--text-secondary)] transition-colors duration-fast",
            "hover:bg-[var(--bg-3)]"
          )}
        >
          {imageFit === "cover" ? (
            <Minimize2 size={14} />
          ) : (
            <Maximize2 size={14} />
          )}
          {imageFit === "cover" ? "Crop" : "Fit"}
        </button>
      </Tooltip>

      {/* Badge properties */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-7 items-center gap-1 rounded-[var(--radius-sm)] px-2",
              "text-xs text-[var(--text-secondary)] transition-colors duration-fast",
              "hover:bg-[var(--bg-3)]"
            )}
          >
            <Tag size={14} />
            Badges
            {badgePropertyIds.length > 0 && (
              <span className="text-[var(--accent)]">
                {badgePropertyIds.length}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4}>
          <DropdownMenuLabel>Card badges (max 3)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {badgeSchemas.map((s) => {
            const Icon = PROPERTY_TYPE_ICONS[s.type];
            const active = badgePropertyIds.includes(s.id);
            return (
              <DropdownMenuItem
                key={s.id}
                onClick={() => onToggleBadge(s.id)}
                className={cn(active && "bg-[var(--bg-3)]")}
              >
                <Icon size={14} />
                {s.name}
                {active && (
                  <span className="ml-auto text-[10px] text-[var(--accent)]">
                    ON
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
          {badgeSchemas.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-[var(--text-tertiary)]">
              No badge-compatible properties
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Group by */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-7 items-center gap-1 rounded-[var(--radius-sm)] px-2",
              "text-xs transition-colors duration-fast",
              groupByPropertyId
                ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-3)]"
            )}
          >
            <Layers size={14} />
            Group
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4}>
          <DropdownMenuLabel>Group by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {groupByPropertyId && (
            <>
              <DropdownMenuItem onClick={() => onGroupByChange(null)}>
                None
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {groupableSchemas.map((s) => {
            const Icon = PROPERTY_TYPE_ICONS[s.type];
            return (
              <DropdownMenuItem
                key={s.id}
                onClick={() => onGroupByChange(s.id)}
                className={cn(
                  s.id === groupByPropertyId && "bg-[var(--bg-3)]"
                )}
              >
                <Icon size={14} />
                {s.name}
              </DropdownMenuItem>
            );
          })}
          {groupableSchemas.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-[var(--text-tertiary)]">
              No groupable properties
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      <span className="text-[10px] text-[var(--text-tertiary)]">
        <Grid2X2 size={12} className="mr-1 inline" />
        Gallery
      </span>
    </div>
  );
}
