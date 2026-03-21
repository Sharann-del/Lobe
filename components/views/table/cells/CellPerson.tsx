"use client";

import { useState } from "react";
import { Avatar, Tooltip, Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { PersonPicker } from "@/components/views/shared/PersonPicker";
import type { PersonValue } from "@/lib/types/properties";

interface CellPersonProps {
  value: PersonValue[];
  members?: PersonValue[];
  onChange?: (people: PersonValue[]) => void;
  multi?: boolean;
  readOnly?: boolean;
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

export function CellPerson({
  value,
  members = [],
  onChange,
  multi = true,
  readOnly,
  className,
}: CellPersonProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  const display = (
    <div className={cn("flex items-center gap-1 px-2 py-1", className)}>
      {value.length > 0 ? (
        value.map((person) => (
          <Tooltip key={person.id} content={person.name}>
            <div className="flex items-center gap-1">
              <Avatar
                src={person.avatar_url}
                fallback={initials(person.name)}
                className="h-5 w-5 text-[9px]"
              />
              {value.length === 1 && (
                <span className="truncate text-xs text-[var(--text-primary)]">
                  {person.name}
                </span>
              )}
            </div>
          </Tooltip>
        ))
      ) : (
        <span className="text-sm text-[var(--text-placeholder)]">
          {readOnly ? "—" : "Empty"}
        </span>
      )}
    </div>
  );

  if (readOnly || !onChange) return display;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center",
            "transition-colors duration-fast hover:bg-[var(--bg-3)]"
          )}
        >
          {display}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <PersonPicker
          members={members}
          selected={value}
          onChange={(people) => {
            onChange(people);
            if (!multi) setOpen(false);
          }}
          multi={multi}
        />
      </PopoverContent>
    </Popover>
  );
}
