"use client";

import { useState, useCallback } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { ColorPicker } from "@/components/views/shared/ColorPicker";
import { cn } from "@/lib/utils/cn";
import type { SelectOption } from "@/lib/types/properties";
import type { BadgeColor } from "@/components/ui/Badge";

interface SelectEditorProps {
  options: SelectOption[];
  onChange: (options: SelectOption[]) => void;
  className?: string;
}

const DEFAULT_COLORS: BadgeColor[] = [
  "blue",
  "green",
  "orange",
  "purple",
  "red",
  "teal",
  "yellow",
  "pink",
  "gray",
];

export function SelectEditor({
  options,
  onChange,
  className,
}: SelectEditorProps): React.ReactElement {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const addOption = useCallback(() => {
    if (!newName.trim()) return;
    const opt: SelectOption = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      color:
        DEFAULT_COLORS[options.length % DEFAULT_COLORS.length] ?? "gray",
    };
    onChange([...options, opt]);
    setNewName("");
  }, [newName, options, onChange]);

  const updateOption = useCallback(
    (id: string, patch: Partial<SelectOption>) => {
      onChange(
        options.map((o) => (o.id === id ? { ...o, ...patch } : o))
      );
    },
    [options, onChange]
  );

  const removeOption = useCallback(
    (id: string) => {
      onChange(options.filter((o) => o.id !== id));
    },
    [options, onChange]
  );

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === idx) return;
      const reordered = [...options];
      const [moved] = reordered.splice(dragIdx, 1);
      if (moved === undefined) return;
      reordered.splice(idx, 0, moved);
      onChange(reordered);
      setDragIdx(idx);
    },
    [dragIdx, options, onChange]
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-xs font-medium text-[var(--text-secondary)]">
        Options
      </p>

      <div className="flex flex-col gap-1">
        {options.map((opt, idx) => (
          <div
            key={opt.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={() => setDragIdx(null)}
            className={cn(
              "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-1 py-1",
              "transition-colors duration-fast hover:bg-[var(--bg-3)]",
              dragIdx === idx && "opacity-50"
            )}
          >
            <GripVertical
              size={12}
              className="shrink-0 cursor-grab text-[var(--text-placeholder)]"
            />

            {editingId === opt.id ? (
              <div className="flex flex-1 flex-col gap-1.5">
                <input
                  value={opt.name}
                  onChange={(e) =>
                    updateOption(opt.id, { name: e.target.value })
                  }
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                  autoFocus
                  className="flex-1 rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
                />
                <ColorPicker
                  value={opt.color}
                  onChange={(c) => updateOption(opt.id, { color: c })}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingId(opt.id)}
                className="flex-1 text-left"
              >
                <Badge color={opt.color}>{opt.name}</Badge>
              </button>
            )}

            <button
              type="button"
              onClick={() => removeOption(opt.id)}
              className="shrink-0 text-[var(--text-placeholder)] transition-colors duration-fast hover:text-[var(--color-red)]"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addOption()}
          placeholder="New option…"
          className="flex-1 rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
        />
        <button
          type="button"
          onClick={addOption}
          disabled={!newName.trim()}
          className={cn(
            "rounded-[var(--radius-sm)] p-1.5",
            "text-[var(--accent)] transition-colors duration-fast hover:bg-[var(--bg-3)]",
            !newName.trim() && "opacity-40"
          )}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
