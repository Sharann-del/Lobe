"use client";

import {
  ChevronRight,
  EyeOff,
  MoreHorizontal,
  Palette,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { BadgeColor } from "@/components/ui/Badge";

interface KanbanColumnHeaderProps {
  label: string;
  color: BadgeColor | null;
  count: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAddCard: () => void;
  onHideColumn?: () => void;
  onDeleteOption?: () => void;
  className?: string;
}

const DOT_COLORS: Record<BadgeColor, string> = {
  red: "bg-[var(--color-red)]",
  orange: "bg-[var(--color-orange)]",
  yellow: "bg-[var(--color-yellow)]",
  green: "bg-[var(--color-green)]",
  teal: "bg-[var(--color-teal)]",
  blue: "bg-[var(--color-blue)]",
  purple: "bg-[var(--color-purple)]",
  pink: "bg-[var(--color-pink)]",
  gray: "bg-[var(--color-gray)]",
};

export function BoardColumnHeader({
  label,
  color,
  count,
  collapsed,
  onToggleCollapse,
  onAddCard,
  onHideColumn,
  onDeleteOption,
  className,
}: KanbanColumnHeaderProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex h-8 items-center gap-1.5 px-1.5",
        className
      )}
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
          "text-[var(--text-tertiary)] transition-all duration-fast",
          "hover:bg-[var(--bg-4)] hover:text-[var(--text-primary)]"
        )}
      >
        <ChevronRight
          size={14}
          className={cn(
            "transition-transform duration-fast",
            !collapsed && "rotate-90"
          )}
        />
      </button>

      {/* Color dot */}
      {color && (
        <span
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            DOT_COLORS[color]
          )}
        />
      )}

      {/* Label */}
      <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </span>

      {/* Count */}
      <span className="shrink-0 text-[11px] tabular-nums text-[var(--text-tertiary)]">
        {count}
      </span>

      {/* Add card */}
      <button
        type="button"
        onClick={onAddCard}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
          "text-[var(--text-tertiary)] transition-colors duration-fast",
          "hover:bg-[var(--bg-4)] hover:text-[var(--text-primary)]"
        )}
      >
        <Plus size={14} />
      </button>

      {/* Column menu */}
      <ColumnMenu
        onHide={onHideColumn}
        onDelete={onDeleteOption}
      />
    </div>
  );
}

function ColumnMenu({
  onHide,
  onDelete,
}: {
  onHide?: () => void;
  onDelete?: () => void;
}): React.ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
            "text-[var(--text-tertiary)] transition-colors duration-fast",
            "hover:bg-[var(--bg-4)] hover:text-[var(--text-primary)]"
          )}
        >
          <MoreHorizontal size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4}>
        {onHide && (
          <DropdownMenuItem onClick={onHide}>
            <EyeOff size={14} />
            Hide column
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={onDelete}>
              <Trash2 size={14} />
              Delete option
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
