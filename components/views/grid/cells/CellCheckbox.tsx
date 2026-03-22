"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CellCheckboxProps {
  value: boolean;
  onChange: (value: boolean) => void;
  readOnly?: boolean;
  className?: string;
}

export function CellCheckbox({
  value,
  onChange,
  readOnly,
  className,
}: CellCheckboxProps): React.ReactElement {
  return (
    <div className={cn("flex items-center justify-center px-2 py-1", className)}>
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(!value)}
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-[3px] border",
          "transition-colors duration-fast",
          value
            ? "border-[var(--accent)] bg-[var(--accent)]"
            : "border-[var(--border-default)] hover:border-[var(--border-strong)]",
          readOnly && "cursor-default opacity-60"
        )}
      >
        {value && <Check size={10} className="text-[var(--bg-0)]" />}
      </button>
    </div>
  );
}
