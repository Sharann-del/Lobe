"use client";

import { Sigma } from "lucide-react";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

interface CellRollupProps {
  value: unknown;
  className?: string;
}

export function CellRollup({
  value,
  className,
}: CellRollupProps): React.ReactElement {
  const display = value !== null && value !== undefined ? String(value) : "—";

  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1", className)}>
      <Tooltip content="Aggregated rollup value">
        <Sigma size={12} className="shrink-0 text-[var(--color-teal)]" />
      </Tooltip>
      <span className="truncate text-sm text-[var(--text-secondary)]">
        {display}
      </span>
    </div>
  );
}
