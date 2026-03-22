"use client";

import { useCallback, useMemo, useState } from "react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { Bell, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useRemindersStore } from "@/lib/stores/remindersStore";
import { ReminderEditPanel } from "@/components/reminders/ReminderEditPanel";
import { reminderColorVar, type ReminderColor } from "@/lib/types/reminders";
import type { ReminderOccurrence } from "@/lib/types/reminders";

interface SidePanelRemindersProps {
  collapsed?: boolean;
  className?: string;
}

export function SidePanelReminders({
  collapsed,
  className,
}: SidePanelRemindersProps): React.ReactElement {
  const eventsById = useRemindersStore((s) => s.eventsById);
  const getTodayAndUpcoming = useRemindersStore((s) => s.getTodayAndUpcoming);
  const occurrences = useMemo(() => getTodayAndUpcoming(15), [eventsById, getTodayAndUpcoming]);
  const toggleChecked = useRemindersStore((s) => s.toggleChecked);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCheck = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      void toggleChecked(id);
    },
    [toggleChecked]
  );

  if (collapsed) {
    return (
      <div className={cn("flex flex-col items-center gap-0.5", className)}>
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)]">
          <Bell size={16} />
        </div>
      </div>
    );
  }

  if (occurrences.length === 0) {
    return (
      <div className={cn("px-2 py-1 text-xs text-[var(--text-tertiary)]", className)}>
        No upcoming reminders
      </div>
    );
  }

  const grouped = groupByDateLabel(occurrences);

  return (
    <>
      <div className={cn("flex flex-col gap-1", className)}>
        {grouped.map(({ label, items }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="px-2 text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
              {label}
            </span>
            <AnimatePresence>
              {items.map((occ) => (
                <SidebarReminderItem
                  key={`${occ.event.id}-${occ.occurrenceDate}`}
                  occurrence={occ}
                  onCheck={handleCheck}
                  onEdit={setEditingId}
                />
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <ReminderEditPanel
        eventId={editingId}
        open={editingId !== null}
        onClose={() => setEditingId(null)}
      />
    </>
  );
}

function SidebarReminderItem({
  occurrence,
  onCheck,
  onEdit,
}: {
  occurrence: ReminderOccurrence;
  onCheck: (e: React.MouseEvent, id: string) => void;
  onEdit: (id: string) => void;
}): React.ReactElement {
  const { event } = occurrence;
  const color = event.color as ReminderColor;

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.12 }}
      onClick={() => onEdit(event.id)}
      className={cn(
        "group flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1",
        "text-left transition-colors duration-fast hover:bg-[var(--bg-3)]"
      )}
    >
      <button
        type="button"
        onClick={(e) => onCheck(e, event.id)}
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[2px] border",
          "transition-colors duration-fast",
          event.is_checked
            ? "border-transparent"
            : "border-[var(--border-default)] group-hover:border-[var(--border-strong)]"
        )}
        style={
          event.is_checked
            ? { borderColor: reminderColorVar(color), backgroundColor: reminderColorVar(color) }
            : undefined
        }
      >
        {event.is_checked && <Check size={8} className="text-white" />}
      </button>

      <span
        className={cn(
          "min-w-0 flex-1 truncate text-xs",
          event.is_checked
            ? "text-[var(--text-tertiary)] line-through"
            : "text-[var(--text-primary)]"
        )}
      >
        {event.title || "Untitled"}
      </span>

      {event.start_time && (
        <span className="shrink-0 text-[10px] text-[var(--text-tertiary)]">
          {formatTimeSidebar(event.start_time)}
        </span>
      )}

      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: reminderColorVar(color) }}
      />
    </motion.button>
  );
}

interface DateGroup {
  label: string;
  items: ReminderOccurrence[];
}

function groupByDateLabel(occurrences: ReminderOccurrence[]): DateGroup[] {
  const map = new Map<string, ReminderOccurrence[]>();
  for (const occ of occurrences) {
    const d = parseISO(occ.occurrenceDate);
    let label: string;
    if (isToday(d)) {
      label = "Today";
    } else if (isTomorrow(d)) {
      label = "Tomorrow";
    } else {
      label = format(d, "EEE, MMM d");
    }
    const list = map.get(label) ?? [];
    list.push(occ);
    map.set(label, list);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function formatTimeSidebar(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (h === undefined || m === undefined) return time;
  const suffix = h >= 12 ? "p" : "a";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}
