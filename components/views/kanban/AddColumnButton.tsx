"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import {
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { BadgeColor } from "@/components/ui/Badge";

const COLORS: BadgeColor[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "gray",
];

const COLOR_CLASSES: Record<BadgeColor, string> = {
  red: "bg-[var(--color-red)]",
  orange: "bg-[var(--color-orange)]",
  yellow: "bg-[var(--color-yellow)]",
  green: "bg-[var(--color-green)]",
  teal: "bg-[var(--color-teal)]",
  blue: "bg-[var(--color-blue)]",
  purple: "bg-[var(--color-purple)]",
  pink: "bg-[var(--color-pink)]",
  gray: "bg-[var(--color-gray)]",
};

interface AddColumnButtonProps {
  onAdd: (name: string, color: BadgeColor) => void;
  className?: string;
}

export function AddColumnButton({
  onAdd,
  className,
}: AddColumnButtonProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<BadgeColor>("gray");

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, color);
    setName("");
    setColor("gray");
    setOpen(false);
  }, [name, color, onAdd]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-[272px] shrink-0 items-center justify-center gap-1.5",
            "rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)]",
            "bg-[var(--bg-2)] py-3",
            "text-xs text-[var(--text-tertiary)]",
            "transition-colors duration-fast",
            "hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
            className
          )}
        >
          <Plus size={14} />
          Add column
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="w-64">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            New option
          </span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Option name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-5 w-5 rounded-full transition-all duration-fast",
                  COLOR_CLASSES[c],
                  c === color
                    ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-1)]"
                    : "opacity-60 hover:opacity-100"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className={cn(
              "flex h-7 items-center justify-center rounded-[var(--radius-sm)]",
              "bg-[var(--accent)] text-xs font-medium text-[var(--bg-0)]",
              "transition-opacity duration-fast",
              "disabled:opacity-40"
            )}
          >
            Add
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
