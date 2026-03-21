"use client";

import { Avatar, Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { PersonValue } from "@/lib/types/properties";

interface CellPersonProps {
  value: PersonValue[];
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
  readOnly: _readOnly,
  className,
}: CellPersonProps): React.ReactElement {
  if (value.length === 0) {
    return (
      <div className={cn("px-2 py-1", className)}>
        <span className="text-sm text-[var(--text-placeholder)]">—</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 px-2 py-1", className)}>
      {value.map((person) => (
        <Tooltip key={person.id} content={person.name}>
          <Avatar
            src={person.avatar_url}
            fallback={initials(person.name)}
            className="h-5 w-5 text-[9px]"
          />
        </Tooltip>
      ))}
    </div>
  );
}
