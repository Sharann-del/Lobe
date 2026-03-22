"use client";

import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const PREFIX = "lobe-sidebar-section-";

export interface SidePanelSectionProps {
  label: string;
  storageKey: string;
  defaultOpen?: boolean;
  collapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SidePanelSection({
  label,
  storageKey,
  defaultOpen = true,
  collapsed,
  children,
  className,
}: SidePanelSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${PREFIX}${storageKey}`);
      if (raw === "0") {
        setOpen(false);
      }
      if (raw === "1") {
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`${PREFIX}${storageKey}`, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [storageKey]);

  if (collapsed) {
    return <div className={cn("flex flex-col gap-0.5", className)}>{children}</div>;
  }

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex h-7 w-full items-center gap-1 rounded-[var(--radius-sm)] px-2",
          "text-[11px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]",
          "transition-colors duration-fast hover:text-[var(--text-secondary)]"
        )}
      >
        <ChevronRight
          size={14}
          className={cn(
            "shrink-0 text-[var(--text-tertiary)] transition-transform duration-fast",
            open && "rotate-90"
          )}
        />
        <span className="truncate">{label}</span>
      </button>
      {open ? children : null}
    </div>
  );
}
