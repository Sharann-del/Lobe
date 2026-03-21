"use client";

import { FunctionSquare } from "lucide-react";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

interface CellFormulaProps {
  value: unknown;
  className?: string;
}

export function CellFormula({
  value,
  className,
}: CellFormulaProps): React.ReactElement {
  const display = value !== null && value !== undefined ? String(value) : "—";

  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1", className)}>
      <Tooltip content="Computed formula value">
        <FunctionSquare size={12} className="shrink-0 text-[var(--color-purple)]" />
      </Tooltip>
      <span className="truncate text-sm text-[var(--text-secondary)]">
        {display}
      </span>
    </div>
  );
}
