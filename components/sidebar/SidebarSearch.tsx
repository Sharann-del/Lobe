"use client";

import { Search } from "lucide-react";
import { Kbd } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface SidebarSearchProps {
  onTrigger?: () => void;
  collapsed?: boolean;
  className?: string;
}

export function SidebarSearch({
  onTrigger,
  collapsed,
  className,
}: SidebarSearchProps) {
  return (
    <button
      type="button"
      onClick={onTrigger}
      className={cn(
        "group flex h-8 w-full items-center gap-2 rounded-[var(--radius-sm)] px-2",
        "text-left text-xs text-[var(--text-secondary)]",
        "transition-colors duration-fast hover:bg-[var(--bg-3)] hover:text-[var(--text-primary)]",
        collapsed && "justify-center px-0",
        className
      )}
    >
      <Search size={16} className="shrink-0 opacity-80" />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">Search</span>
          <Kbd className="hidden opacity-0 transition-opacity group-hover:opacity-100 sm:inline-flex">
            ⌘K
          </Kbd>
        </>
      )}
    </button>
  );
}
