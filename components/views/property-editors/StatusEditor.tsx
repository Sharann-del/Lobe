"use client";

import { useState, useCallback } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { ColorPicker } from "@/components/views/shared/ColorPicker";
import { cn } from "@/lib/utils/cn";
import type { StatusOption, StatusGroup } from "@/lib/types/properties";
import type { BadgeColor } from "@/components/ui/Badge";

interface StatusEditorProps {
  options: StatusOption[];
  onChange: (options: StatusOption[]) => void;
  className?: string;
}

const GROUP_LABELS: Record<StatusGroup, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

const GROUP_ORDER: StatusGroup[] = ["not_started", "in_progress", "done"];

const GROUP_DEFAULTS: Record<StatusGroup, BadgeColor> = {
  not_started: "gray",
  in_progress: "blue",
  done: "green",
};

export function StatusEditor({
  options,
  onChange,
  className,
}: StatusEditorProps): React.ReactElement {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState<StatusGroup>("not_started");
  const [newName, setNewName] = useState("");

  const addOption = useCallback(() => {
    if (!newName.trim()) return;
    const opt: StatusOption = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      color: GROUP_DEFAULTS[newGroup],
      group: newGroup,
    };
    onChange([...options, opt]);
    setNewName("");
  }, [newName, newGroup, options, onChange]);

  const updateOption = useCallback(
    (id: string, patch: Partial<StatusOption>) => {
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

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {GROUP_ORDER.map((group) => {
        const items = options.filter((o) => o.group === group);
        return (
          <div key={group} className="flex flex-col gap-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              {GROUP_LABELS[group]}
            </p>

            {items.map((opt) => (
              <div
                key={opt.id}
                className={cn(
                  "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-1 py-1",
                  "transition-colors duration-fast hover:bg-[var(--bg-3)]"
                )}
              >
                <GripVertical
                  size={12}
                  className="shrink-0 text-[var(--text-placeholder)]"
                />

                {editingId === opt.id ? (
                  <div className="flex flex-1 flex-col gap-1.5">
                    <input
                      value={opt.name}
                      onChange={(e) =>
                        updateOption(opt.id, { name: e.target.value })
                      }
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setEditingId(null)
                      }
                      autoFocus
                      className="flex-1 rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <ColorPicker
                        value={opt.color}
                        onChange={(c) => updateOption(opt.id, { color: c })}
                      />
                      <select
                        value={opt.group}
                        onChange={(e) =>
                          updateOption(opt.id, {
                            group: e.target.value as StatusGroup,
                          })
                        }
                        className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] outline-none"
                      >
                        {GROUP_ORDER.map((g) => (
                          <option key={g} value={g}>
                            {GROUP_LABELS[g]}
                          </option>
                        ))}
                      </select>
                    </div>
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
        );
      })}

      <div className="flex items-center gap-1.5 border-t border-[var(--border-subtle)] pt-2">
        <select
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value as StatusGroup)}
          className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-1.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none"
        >
          {GROUP_ORDER.map((g) => (
            <option key={g} value={g}>
              {GROUP_LABELS[g]}
            </option>
          ))}
        </select>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addOption()}
          placeholder="New status…"
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
