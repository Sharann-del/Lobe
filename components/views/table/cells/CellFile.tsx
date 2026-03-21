"use client";

import { Paperclip } from "lucide-react";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { FileValue } from "@/lib/types/properties";

interface CellFileProps {
  value: FileValue[];
  readOnly?: boolean;
  className?: string;
}

function isImage(type: string): boolean {
  return type.startsWith("image/");
}

export function CellFile({
  value,
  readOnly: _readOnly,
  className,
}: CellFileProps): React.ReactElement {
  if (value.length === 0) {
    return (
      <div className={cn("px-2 py-1", className)}>
        <span className="text-sm text-[var(--text-placeholder)]">—</span>
      </div>
    );
  }

  const images = value.filter((f) => isImage(f.type));
  const others = value.filter((f) => !isImage(f.type));

  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1", className)}>
      {images.slice(0, 3).map((file, i) => (
        <Tooltip key={i} content={file.name}>
          <img
            src={file.url}
            alt={file.name}
            className="h-5 w-5 rounded-[2px] object-cover"
          />
        </Tooltip>
      ))}
      {others.length > 0 && (
        <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <Paperclip size={12} />
          {value.length}
        </span>
      )}
      {images.length > 3 && (
        <span className="text-xs text-[var(--text-tertiary)]">
          +{images.length - 3}
        </span>
      )}
    </div>
  );
}
