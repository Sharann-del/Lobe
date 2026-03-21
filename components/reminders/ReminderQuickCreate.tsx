"use client";

import { useCallback, useRef, useState } from "react";
import { format } from "date-fns";
import { Clock, Palette, Repeat, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
  Input,
  Button,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useRemindersStore } from "@/lib/stores/remindersStore";
import { ReminderColorPicker } from "@/components/reminders/ReminderColorPicker";
import type {
  ReminderColor,
  ReminderInsert,
  RecurrenceFrequency,
} from "@/lib/types/reminders";

interface ReminderQuickCreateProps {
  date: Date;
  startTime?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

const QUICK_RECURRENCE: { label: string; value: RecurrenceFrequency | null }[] = [
  { label: "No repeat", value: null },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export function ReminderQuickCreate({
  date,
  startTime,
  open,
  onOpenChange,
  children,
  className,
}: ReminderQuickCreateProps): React.ReactElement {
  const createEvent = useRemindersStore((s) => s.createEvent);
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [color, setColor] = useState<ReminderColor>("blue");
  const [timeStart, setTimeStart] = useState(startTime ?? "");
  const [timeEnd, setTimeEnd] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);

  const reset = useCallback(() => {
    setTitle("");
    setColor("blue");
    setTimeStart(startTime ?? "");
    setTimeEnd("");
    setRecurrence(null);
    setShowColorPicker(false);
    setShowRecurrence(false);
  }, [startTime]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;

    const insert: ReminderInsert = {
      workspace_id: "",
      user_id: "",
      title: title.trim(),
      date: format(date, "yyyy-MM-dd"),
      start_time: timeStart || null,
      end_time: timeEnd || null,
      is_checked: false,
      color,
      recurrence_rule: recurrence
        ? {
            frequency: recurrence,
            interval: 1,
            days_of_week: [],
            end_date: null,
            count: null,
          }
        : null,
    };

    await createEvent(insert);
    reset();
    onOpenChange(false);
  }, [title, date, timeStart, timeEnd, color, recurrence, createEvent, reset, onOpenChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
      }
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    },
    [handleSubmit, onOpenChange]
  );

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset();
        onOpenChange(nextOpen);
      }}
    >
      <PopoverTrigger asChild className={className}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {format(date, "EEE, MMM d")}
            </span>
            <PopoverClose
              className="rounded-[var(--radius-sm)] p-0.5 text-[var(--text-tertiary)] transition-colors duration-fast hover:text-[var(--text-primary)]"
            >
              <X size={14} />
            </PopoverClose>
          </div>

          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reminder title…"
            className="h-9 text-sm"
          />

          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-1.5">
              <Clock size={14} className="shrink-0 text-[var(--text-tertiary)]" />
              <input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className={cn(
                  "h-7 w-[88px] rounded-[var(--radius-sm)] border border-[var(--border-default)]",
                  "bg-[var(--bg-2)] px-2 text-xs text-[var(--text-primary)]",
                  "focus:border-[var(--border-strong)] focus:outline-none"
                )}
              />
              <span className="text-xs text-[var(--text-tertiary)]">–</span>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className={cn(
                  "h-7 w-[88px] rounded-[var(--radius-sm)] border border-[var(--border-default)]",
                  "bg-[var(--bg-2)] px-2 text-xs text-[var(--text-primary)]",
                  "focus:border-[var(--border-strong)] focus:outline-none"
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker((v) => !v);
                setShowRecurrence(false);
              }}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] px-2",
                "text-xs text-[var(--text-secondary)]",
                "transition-colors duration-fast hover:bg-[var(--bg-3)]"
              )}
            >
              <Palette size={14} />
              <span className="capitalize">{color}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowRecurrence((v) => !v);
                setShowColorPicker(false);
              }}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] px-2",
                "text-xs text-[var(--text-secondary)]",
                "transition-colors duration-fast hover:bg-[var(--bg-3)]"
              )}
            >
              <Repeat size={14} />
              <span>{recurrence ?? "No repeat"}</span>
            </button>
          </div>

          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="overflow-hidden"
              >
                <ReminderColorPicker value={color} onChange={setColor} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showRecurrence && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-0.5">
                  {QUICK_RECURRENCE.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setRecurrence(opt.value);
                        setShowRecurrence(false);
                      }}
                      className={cn(
                        "rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs",
                        "transition-colors duration-fast",
                        recurrence === opt.value
                          ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-2)]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={!title.trim()}
            className="w-full"
          >
            Create reminder
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
