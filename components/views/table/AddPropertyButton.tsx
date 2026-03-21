"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Input,
  Button,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useTableViewStore } from "@/lib/stores/tableViewStore";
import { PROPERTY_TYPE_ICONS, PROPERTY_TYPE_LABELS } from "@/lib/views/property-icons";
import type { PropertyValueType } from "@/lib/types/properties";

const CREATABLE_TYPES: PropertyValueType[] = [
  "text",
  "number",
  "select",
  "multi_select",
  "date",
  "checkbox",
  "person",
  "url",
  "email",
  "phone",
  "file",
  "relation",
  "location",
];

interface AddPropertyButtonProps {
  className?: string;
}

export function AddPropertyButton({
  className,
}: AddPropertyButtonProps): React.ReactElement {
  const createSchema = useTableViewStore((s) => s.createSchema);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyValueType>("text");

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    await createSchema(name.trim(), type);
    setName("");
    setType("text");
    setOpen(false);
  }, [name, type, createSchema]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 shrink-0 items-center gap-1 border-r border-[var(--border-subtle)]",
            "bg-[var(--bg-1)] px-3",
            "text-xs text-[var(--text-tertiary)]",
            "transition-colors duration-fast hover:bg-[var(--bg-2)] hover:text-[var(--text-secondary)]",
            className
          )}
        >
          <Plus size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex flex-col gap-2 p-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Property name"
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreate();
            }}
            autoFocus
          />

          <div className="flex max-h-[200px] flex-col gap-0.5 overflow-y-auto">
            {CREATABLE_TYPES.map((t) => {
              const Icon = PROPERTY_TYPE_ICONS[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs",
                    "transition-colors duration-fast",
                    type === t
                      ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-2)]"
                  )}
                >
                  <Icon size={14} />
                  {PROPERTY_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>

          <Button
            size="sm"
            onClick={() => void handleCreate()}
            disabled={!name.trim()}
            className="w-full"
          >
            Add property
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
