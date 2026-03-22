"use client";

import {
  ArrowDown,
  ArrowUp,
  EyeOff,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui";
import type { SortDirection } from "@/lib/types/properties";

interface ColumnHeaderMenuProps {
  children: React.ReactNode;
  onSort: (direction: SortDirection) => void;
  onHide: () => void;
  onRename: () => void;
  onDelete: () => void;
  className?: string;
}

export function ColumnHeaderMenu({
  children,
  onSort,
  onHide,
  onRename,
  onDelete,
  className,
}: ColumnHeaderMenuProps): React.ReactElement {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild className={className}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onSort("asc")}>
          <ArrowUp size={14} />
          Sort ascending
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onSort("desc")}>
          <ArrowDown size={14} />
          Sort descending
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onRename}>
          <Pencil size={14} />
          Rename property
        </ContextMenuItem>
        <ContextMenuItem onClick={onHide}>
          <EyeOff size={14} />
          Hide in view
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem destructive onClick={onDelete}>
          <Trash2 size={14} />
          Delete property
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
