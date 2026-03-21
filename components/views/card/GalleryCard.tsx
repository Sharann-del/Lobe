"use client";

import { useMemo } from "react";
import {
  Copy,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  Badge,
  type BadgeColor,
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
  PropertySchema,
  SelectOption,
} from "@/lib/types/properties";
import {
  openStreetMapStaticThumbnailUrl,
  parseLocationValue,
} from "@/lib/location/location-value";
import type { CardSize, ImageFit } from "@/lib/stores/cardViewStore";

interface GalleryCardProps {
  page: PageRow;
  properties: PageProperty[];
  badgeSchemas: PropertySchema[];
  /** First location-type schema (map thumbnail under title when set). */
  locationSchema?: PropertySchema | null;
  cardSize: CardSize;
  imageFit: ImageFit;
  onOpen: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  className?: string;
}

const COVER_HEIGHTS: Record<CardSize, string> = {
  small: "h-24",
  medium: "h-36",
  large: "h-48",
};

const PLACEHOLDER_COLORS = [
  "var(--color-blue-muted)",
  "var(--color-purple-muted)",
  "var(--color-teal-muted)",
  "var(--color-green-muted)",
  "var(--color-orange-muted)",
  "var(--color-pink-muted)",
];

function pickPlaceholderColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length]!;
}

export function GalleryCard({
  page,
  properties,
  badgeSchemas,
  locationSchema,
  cardSize,
  imageFit,
  onOpen,
  onDuplicate,
  onDelete,
  className,
}: GalleryCardProps): React.ReactElement {
  const propMap = useMemo(() => {
    const map = new Map<string, PageProperty>();
    for (const p of properties) map.set(p.key, p);
    return map;
  }, [properties]);

  const badges = useMemo(() => {
    const result: { key: string; label: string; color: string }[] = [];

    for (const schema of badgeSchemas) {
      const prop = propMap.get(schema.name);
      if (!prop?.value) continue;

      if (schema.type === "select") {
        const opt = schema.options.find(
          (o: SelectOption) => o.id === prop.value || o.name === prop.value
        );
        if (opt) {
          result.push({
            key: schema.id,
            label: opt.name,
            color: opt.color,
          });
        }
      } else if (schema.type === "multi_select" && Array.isArray(prop.value)) {
        for (const val of prop.value as string[]) {
          const opt = schema.options.find(
            (o: SelectOption) => o.id === val || o.name === val
          );
          if (opt) {
            result.push({
              key: `${schema.id}-${opt.id}`,
              label: opt.name,
              color: opt.color,
            });
          }
        }
      }
    }

    return result.slice(0, 3);
  }, [badgeSchemas, propMap]);

  const locationValue = useMemo(() => {
    if (!locationSchema) return null;
    const prop = propMap.get(locationSchema.name);
    return parseLocationValue(prop?.value);
  }, [locationSchema, propMap]);

  const coverUrl = page.cover_url;
  const hasCover = Boolean(coverUrl);

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-[var(--radius-lg)]",
        "border border-[var(--border-subtle)] bg-[var(--bg-1)]",
        "transition-all duration-fast",
        "hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)]",
        className
      )}
      onClick={() => onOpen(page.id)}
    >
      {/* Cover area */}
      <div className={cn("relative w-full", COVER_HEIGHTS[cardSize])}>
        {hasCover ? (
          <img
            src={coverUrl!}
            alt=""
            className={cn(
              "h-full w-full",
              imageFit === "cover" ? "object-cover" : "object-contain"
            )}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: pickPlaceholderColor(page.id) }}
          >
            {page.icon ? (
              <span className="text-3xl">{page.icon}</span>
            ) : (
              <FileText size={32} className="text-[var(--text-tertiary)]" />
            )}
          </div>
        )}

        {/* Hover actions */}
        <div
          className="absolute right-1.5 top-1.5 opacity-0 transition-opacity duration-fast group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)]",
                  "bg-[var(--bg-0)]/80 text-[var(--text-primary)] backdrop-blur-sm",
                  "transition-colors duration-fast hover:bg-[var(--bg-0)]"
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

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-2.5">
        {locationValue && (
          <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
            <img
              src={openStreetMapStaticThumbnailUrl(
                locationValue.lat,
                locationValue.lng,
                400,
                120
              )}
              alt=""
              className="h-20 w-full object-cover"
            />
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {hasCover && page.icon && (
            <span className="shrink-0 text-sm">{page.icon}</span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
            {page.title || "Untitled"}
          </span>
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {badges.map((b) => (
              <Badge
                key={b.key}
                color={b.color as BadgeColor}
                className="text-[10px]"
              >
                {b.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
