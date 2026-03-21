"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { PersonValue } from "@/lib/types/properties";

interface PersonPickerProps {
  members: PersonValue[];
  selected: PersonValue[];
  onChange: (people: PersonValue[]) => void;
  multi?: boolean;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PersonPicker({
  members,
  selected,
  onChange,
  multi = false,
  className,
}: PersonPickerProps): React.ReactElement {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return members;
    const q = query.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, query]);

  const selectedIds = new Set(selected.map((p) => p.id));

  function toggle(person: PersonValue): void {
    if (selectedIds.has(person.id)) {
      onChange(selected.filter((p) => p.id !== person.id));
    } else if (multi) {
      onChange([...selected, person]);
    } else {
      onChange([person]);
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5">
        <Search size={12} className="shrink-0 text-[var(--text-tertiary)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people…"
          className="flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--bg-3)] px-1.5 py-0.5 text-xs"
            >
              <Avatar
                src={p.avatar_url}
                fallback={initials(p.name)}
                className="h-3.5 w-3.5 text-[7px]"
              />
              {p.name}
              <button
                type="button"
                onClick={() => toggle(p)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-40 overflow-y-auto">
        {filtered.map((person) => (
          <button
            key={person.id}
            type="button"
            onClick={() => toggle(person)}
            className={cn(
              "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
              "transition-colors duration-fast hover:bg-[var(--bg-3)]",
              selectedIds.has(person.id) && "bg-[var(--bg-3)]"
            )}
          >
            <Avatar
              src={person.avatar_url}
              fallback={initials(person.name)}
              className="h-5 w-5 text-[9px]"
            />
            <span className="truncate text-xs text-[var(--text-primary)]">
              {person.name}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-[var(--text-tertiary)]">
            No members found
          </p>
        )}
      </div>
    </div>
  );
}
