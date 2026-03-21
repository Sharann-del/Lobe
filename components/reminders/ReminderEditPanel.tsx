"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Check,
  Clock,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useRemindersStore } from "@/lib/stores/remindersStore";
import { ReminderColorPicker } from "@/components/reminders/ReminderColorPicker";
import { RecurrenceScopeDialog } from "@/components/reminders/RecurrenceScopeDialog";
import { formatRecurrenceLabel } from "@/lib/reminders/recurrence";
import type {
  RecurrenceEditScope,
  RecurrenceFrequency,
  ReminderColor,
  ReminderEvent,
  ReminderUpdate,
} from "@/lib/types/reminders";

interface ReminderEditPanelProps {
  eventId: string | null;
  occurrenceDate?: string;
  open: boolean;
  onClose: () => void;
  className?: string;
}

const FREQUENCIES: { label: string; value: RecurrenceFrequency | null }[] = [
  { label: "Does not repeat", value: null },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export function ReminderEditPanel({
  eventId,
  occurrenceDate,
  open,
  onClose,
  className,
}: ReminderEditPanelProps): React.ReactElement {
  const event = useRemindersStore((s) =>
    eventId ? s.eventsById[eventId] ?? null : null
  );
  const updateEvent = useRemindersStore((s) => s.updateEvent);
  const deleteEvent = useRemindersStore((s) => s.deleteEvent);
  const toggleChecked = useRemindersStore((s) => s.toggleChecked);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [color, setColor] = useState<ReminderColor>("blue");
  const [frequency, setFrequency] = useState<RecurrenceFrequency | null>(null);
  const [interval, setInterval] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [endDate, setEndDate] = useState("");
  const [count, setCount] = useState<number | null>(null);

  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "delete" | null>(null);

  useEffect(() => {
    if (!event) return;
    setTitle(event.title);
    setDate(event.date);
    setStartTime(event.start_time ?? "");
    setEndTime(event.end_time ?? "");
    setColor(event.color);
    if (event.recurrence_rule) {
      setFrequency(event.recurrence_rule.frequency);
      setInterval(event.recurrence_rule.interval);
      setDaysOfWeek(event.recurrence_rule.days_of_week);
      setEndDate(event.recurrence_rule.end_date ?? "");
      setCount(event.recurrence_rule.count);
    } else {
      setFrequency(null);
      setInterval(1);
      setDaysOfWeek([]);
      setEndDate("");
      setCount(null);
    }
  }, [event]);

  const buildUpdate = useCallback((): ReminderUpdate => {
    const update: ReminderUpdate = {
      title,
      date,
      start_time: startTime || null,
      end_time: endTime || null,
      color,
    };
    if (frequency) {
      update.recurrence_rule = {
        frequency,
        interval,
        days_of_week: daysOfWeek,
        end_date: endDate || null,
        count,
      };
    } else {
      update.recurrence_rule = null;
    }
    return update;
  }, [title, date, startTime, endTime, color, frequency, interval, daysOfWeek, endDate, count]);

  const handleSave = useCallback(
    async (scope: RecurrenceEditScope = "all") => {
      if (!eventId) return;
      await updateEvent(eventId, buildUpdate(), scope, occurrenceDate);
      onClose();
    },
    [eventId, buildUpdate, updateEvent, occurrenceDate, onClose]
  );

  const handleDelete = useCallback(
    async (scope: RecurrenceEditScope = "all") => {
      if (!eventId) return;
      await deleteEvent(eventId, scope, occurrenceDate);
      onClose();
    },
    [eventId, deleteEvent, occurrenceDate, onClose]
  );

  const handleSaveClick = useCallback(() => {
    if (event?.recurrence_rule) {
      setPendingAction("save");
      setScopeDialogOpen(true);
    } else {
      void handleSave("all");
    }
  }, [event, handleSave]);

  const handleDeleteClick = useCallback(() => {
    if (event?.recurrence_rule) {
      setPendingAction("delete");
      setScopeDialogOpen(true);
    } else {
      void handleDelete("all");
    }
  }, [event, handleDelete]);

  const handleScopeSelect = useCallback(
    (scope: RecurrenceEditScope) => {
      if (pendingAction === "save") {
        void handleSave(scope);
      } else if (pendingAction === "delete") {
        void handleDelete(scope);
      }
      setPendingAction(null);
    },
    [pendingAction, handleSave, handleDelete]
  );

  const toggleDay = useCallback(
    (day: number) => {
      setDaysOfWeek((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    },
    []
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={cn(
                "fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col",
                "border-l border-[var(--border-subtle)] bg-[var(--bg-1)]",
                "shadow-[var(--shadow-lg)]",
                className
              )}
            >
              <PanelHeader
                event={event}
                onClose={onClose}
                onToggleCheck={() => eventId && void toggleChecked(eventId)}
              />

              <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
                <FieldGroup label="Title">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Reminder title…"
                  />
                </FieldGroup>

                <FieldGroup label="Date">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={cn(
                        "h-8 flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)]",
                        "bg-[var(--bg-2)] px-3 text-sm text-[var(--text-primary)]",
                        "focus:border-[var(--border-strong)] focus:outline-none"
                      )}
                    />
                  </div>
                </FieldGroup>

                <FieldGroup label="Time">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={cn(
                        "h-8 w-[110px] rounded-[var(--radius-sm)] border border-[var(--border-default)]",
                        "bg-[var(--bg-2)] px-3 text-sm text-[var(--text-primary)]",
                        "focus:border-[var(--border-strong)] focus:outline-none"
                      )}
                    />
                    <span className="text-xs text-[var(--text-tertiary)]">to</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={cn(
                        "h-8 w-[110px] rounded-[var(--radius-sm)] border border-[var(--border-default)]",
                        "bg-[var(--bg-2)] px-3 text-sm text-[var(--text-primary)]",
                        "focus:border-[var(--border-strong)] focus:outline-none"
                      )}
                    />
                  </div>
                </FieldGroup>

                <FieldGroup label="Color">
                  <ReminderColorPicker value={color} onChange={setColor} />
                </FieldGroup>

                <FieldGroup label="Repeat">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Repeat size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                      <select
                        value={frequency ?? ""}
                        onChange={(e) =>
                          setFrequency(
                            (e.target.value as RecurrenceFrequency) || null
                          )
                        }
                        className={cn(
                          "h-8 flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)]",
                          "bg-[var(--bg-2)] px-2 text-sm text-[var(--text-primary)]",
                          "focus:border-[var(--border-strong)] focus:outline-none"
                        )}
                      >
                        {FREQUENCIES.map((f) => (
                          <option key={f.label} value={f.value ?? ""}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {frequency && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="flex flex-col gap-2 overflow-hidden pl-6"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-secondary)]">Every</span>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={interval}
                            onChange={(e) => setInterval(Math.max(1, Number(e.target.value)))}
                            className={cn(
                              "h-7 w-14 rounded-[var(--radius-sm)] border border-[var(--border-default)]",
                              "bg-[var(--bg-2)] px-2 text-center text-xs text-[var(--text-primary)]",
                              "focus:border-[var(--border-strong)] focus:outline-none"
                            )}
                          />
                          <span className="text-xs text-[var(--text-secondary)]">
                            {frequency === "daily" && (interval > 1 ? "days" : "day")}
                            {frequency === "weekly" && (interval > 1 ? "weeks" : "week")}
                            {frequency === "monthly" && (interval > 1 ? "months" : "month")}
                            {frequency === "yearly" && (interval > 1 ? "years" : "year")}
                          </span>
                        </div>

                        {frequency === "weekly" && (
                          <DayOfWeekPicker selected={daysOfWeek} onToggle={toggleDay} />
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-secondary)]">Ends</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={cn(
                              "h-7 flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)]",
                              "bg-[var(--bg-2)] px-2 text-xs text-[var(--text-primary)]",
                              "focus:border-[var(--border-strong)] focus:outline-none"
                            )}
                            placeholder="Never"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </FieldGroup>

                {event?.recurrence_rule && (
                  <div className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                    {formatRecurrenceLabel(event.recurrence_rule)}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] p-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="gap-1.5"
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveClick}>
                  Save
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <RecurrenceScopeDialog
        open={scopeDialogOpen}
        onOpenChange={setScopeDialogOpen}
        onSelect={handleScopeSelect}
        actionLabel={pendingAction === "delete" ? "Delete" : "Save"}
      />
    </>
  );
}

function PanelHeader({
  event,
  onClose,
  onToggleCheck,
}: {
  event: ReminderEvent | null;
  onClose: () => void;
  onToggleCheck: () => void;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
      {event && (
        <button
          type="button"
          onClick={onToggleCheck}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border",
            "transition-colors duration-fast",
            event.is_checked
              ? "border-transparent"
              : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
          )}
          style={
            event.is_checked
              ? {
                  borderColor: `var(--color-${event.color})`,
                  backgroundColor: `var(--color-${event.color})`,
                }
              : undefined
          }
        >
          {event.is_checked && <Check size={12} className="text-white" />}
        </button>
      )}
      <span className="flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
        {event?.title || "Edit reminder"}
      </span>
      {event?.date && (
        <span className="text-xs text-[var(--text-secondary)]">
          {format(parseISO(event.date), "MMM d, yyyy")}
        </span>
      )}
      <button
        type="button"
        onClick={onClose}
        className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] transition-colors duration-fast hover:text-[var(--text-primary)]"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--text-tertiary)]">{label}</span>
      {children}
    </div>
  );
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function DayOfWeekPicker({
  selected,
  onToggle,
}: {
  selected: number[];
  onToggle: (day: number) => void;
}): React.ReactElement {
  return (
    <div className="flex gap-1">
      {DAY_LABELS.map((label, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onToggle(i)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
            "transition-colors duration-fast",
            selected.includes(i)
              ? "bg-[var(--accent)] text-[var(--bg-0)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-3)]"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
