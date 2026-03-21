"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { RelationValue } from "@/lib/types/properties";

interface CellRelationProps {
  value: RelationValue[];
  readOnly?: boolean;
  onNavigate?: (pageId: string) => void;
  className?: string;
}

export function CellRelation({
  value,
  readOnly: _readOnly,
  onNavigate,
  className,
}: CellRelationProps): React.ReactElement {
  if (value.length === 0) {
    return (
      <div className={cn("px-2 py-1", className)}>
        <span className="text-sm text-[var(--text-placeholder)]">—</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1 px-2 py-1", className)}>
      {value.map((rel) => (
        <button
          key={rel.page_id}
          type="button"
          onClick={() => onNavigate?.(rel.page_id)}
          className={cn(
            "inline-flex items-center gap-1 rounded-[var(--radius-sm)]",
            "bg-[var(--bg-3)] px-1.5 py-0.5",
            "text-xs text-[var(--text-primary)]",
            "transition-colors duration-fast hover:bg-[var(--bg-4)]"
          )}
        >
          {rel.icon ? (
            <span className="text-[10px]">{rel.icon}</span>
          ) : (
            <FileText size={10} className="text-[var(--text-tertiary)]" />
          )}
          <span className="max-w-[120px] truncate">{rel.title}</span>
        </button>
      ))}
    </div>
  );
}
