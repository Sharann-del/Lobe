"use client";

import { Copy, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useTableViewStore } from "@/lib/stores/tableViewStore";

interface BulkActionsBarProps {
  onDuplicate: (pageIds: string[]) => void;
  onDelete: (pageIds: string[]) => void;
  className?: string;
}

export function BulkActionsBar({
  onDuplicate,
  onDelete,
  className,
}: BulkActionsBarProps): React.ReactElement {
  const selectedRowIds = useTableViewStore((s) => s.selectedRowIds);
  const deselectAll = useTableViewStore((s) => s.deselectAll);
  const ids = Object.keys(selectedRowIds);
  const count = ids.length;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 48, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={cn(
            "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3",
            "rounded-[var(--radius-lg)] border border-[var(--border-default)]",
            "bg-[var(--bg-1)] px-4 py-2 shadow-[var(--shadow-lg)]",
            className
          )}
        >
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {count} selected
          </span>

          <div className="h-4 w-px bg-[var(--border-default)]" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(ids)}
            className="gap-1.5"
          >
            <Copy size={14} />
            Duplicate
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(ids)}
            className="gap-1.5 text-[var(--color-red)] hover:text-[var(--color-red)]"
          >
            <Trash2 size={14} />
            Delete
          </Button>

          <div className="h-4 w-px bg-[var(--border-default)]" />

          <button
            type="button"
            onClick={deselectAll}
            className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] transition-colors duration-fast hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
