"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from "@/components/ui";
import type { RecurrenceEditScope } from "@/lib/types/reminders";
import { cn } from "@/lib/utils/cn";

interface RecurrenceScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (scope: RecurrenceEditScope) => void;
  actionLabel?: string;
  className?: string;
}

const SCOPES: { value: RecurrenceEditScope; label: string }[] = [
  { value: "this", label: "This event" },
  { value: "this_and_following", label: "This and following events" },
  { value: "all", label: "All events" },
];

export function RecurrenceScopeDialog({
  open,
  onOpenChange,
  onSelect,
  actionLabel = "Save",
  className,
}: RecurrenceScopeDialogProps): React.ReactElement {
  const [selected, setSelected] = useState<RecurrenceEditScope>("this");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-sm", className)}>
        <DialogHeader>
          <DialogTitle>Edit recurring event</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1 py-3">
          {SCOPES.map((scope) => (
            <button
              key={scope.value}
              type="button"
              onClick={() => setSelected(scope.value)}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm",
                "transition-colors duration-fast",
                selected === scope.value
                  ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-2)]"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  selected === scope.value
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : "border-[var(--border-default)]"
                )}
              >
                {selected === scope.value && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--bg-0)]" />
                )}
              </span>
              {scope.label}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSelect(selected);
              onOpenChange(false);
            }}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
