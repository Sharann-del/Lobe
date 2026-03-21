"use client";

import { Eye, EyeOff, Settings2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { PROPERTY_TYPE_ICONS } from "@/lib/views/property-icons";
import type { PropertySchema } from "@/lib/types/properties";
import type { CardDisplayField } from "@/lib/stores/kanbanViewStore";

interface CardDisplayConfigProps {
  schemas: PropertySchema[];
  fields: CardDisplayField[];
  onToggle: (propertyId: string) => void;
  className?: string;
}

export function CardDisplayConfig({
  schemas,
  fields,
  onToggle,
  className,
}: CardDisplayConfigProps): React.ReactElement {
  const schemaMap = new Map(schemas.map((s) => [s.id, s]));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] px-2",
            "text-xs text-[var(--text-secondary)]",
            "transition-colors duration-fast",
            "hover:bg-[var(--bg-3)]",
            className
          )}
        >
          <Settings2 size={14} />
          Properties
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4} className="w-56">
        <div className="flex flex-col gap-0.5">
          <span className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
            Card properties
          </span>
          {fields.map((field) => {
            const schema = schemaMap.get(field.propertyId);
            if (!schema) return null;
            const Icon = PROPERTY_TYPE_ICONS[schema.type];
            return (
              <button
                key={field.propertyId}
                type="button"
                onClick={() => onToggle(field.propertyId)}
                className={cn(
                  "flex h-7 items-center gap-2 rounded-[var(--radius-sm)] px-2",
                  "text-xs transition-colors duration-fast",
                  "hover:bg-[var(--bg-3)]",
                  field.visible
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)]"
                )}
              >
                <Icon size={14} />
                <span className="min-w-0 flex-1 truncate text-left">
                  {schema.name}
                </span>
                {field.visible ? (
                  <Eye size={12} className="text-[var(--accent)]" />
                ) : (
                  <EyeOff size={12} />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
