"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { QUICK_EMOJIS } from "@/components/side-panel/constants";
import { cn } from "@/lib/utils";

export interface NodeIconPickerProps {
  children: React.ReactNode;
  value: string | null;
  onPick: (_emoji: string) => void;
  className?: string;
}

export function NodeIconPicker({
  children,
  value,
  onPick,
  className,
}: NodeIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(value ?? "");
        }
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-56 p-2", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-6 gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={cn(
                "flex h-8 items-center justify-center rounded-[var(--radius-sm)]",
                "text-base transition-colors duration-fast hover:bg-[var(--bg-3)]"
              )}
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <label className="mt-2 block text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Custom
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                const ch = Array.from(draft.trim())[0];
                if (ch) {
                  onPick(ch);
                  setOpen(false);
                }
              }
            }}
            placeholder="Paste emoji"
            className={cn(
              "mt-1 h-8 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)]",
              "bg-[var(--bg-0)] px-2 text-xs text-[var(--text-primary)] outline-none",
              "focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
            )}
          />
        </label>
      </PopoverContent>
    </Popover>
  );
}
