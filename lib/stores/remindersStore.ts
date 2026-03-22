import { create } from "zustand";
import { format, addDays, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { expandAllOccurrences } from "@/lib/reminders/recurrence";
import type {
  RecurrenceEditScope,
  RecurrenceRule,
  ReminderColor,
  ReminderEvent,
  ReminderInsert,
  ReminderOccurrence,
  ReminderUpdate,
} from "@/lib/types/reminders";

interface RemindersState {
  workspaceId: string | null;
  userId: string | null;
  eventsById: Record<string, ReminderEvent>;
  lastSyncError: string | null;
  loading: boolean;

  setContext: (workspaceId: string | null, userId: string | null) => void;
  hydrateFromRows: (rows: ReminderEvent[]) => void;
  upsertEvent: (event: ReminderEvent) => void;
  removeEventLocal: (id: string) => void;

  fetchEvents: () => Promise<void>;
  createEvent: (insert: ReminderInsert) => Promise<string | null>;
  updateEvent: (
    id: string,
    update: ReminderUpdate,
    scope?: RecurrenceEditScope,
    occurrenceDate?: string
  ) => Promise<void>;
  deleteEvent: (
    id: string,
    scope?: RecurrenceEditScope,
    occurrenceDate?: string
  ) => Promise<void>;
  toggleChecked: (id: string) => Promise<void>;
  reschedule: (id: string, newDate: string) => Promise<void>;

  getOccurrencesForRange: (
    rangeStart: Date,
    rangeEnd: Date
  ) => ReminderOccurrence[];
  getTodayAndUpcoming: (limit?: number) => ReminderOccurrence[];

  clearSyncError: () => void;
}

function allEvents(state: RemindersState): ReminderEvent[] {
  return Object.values(state.eventsById);
}

export const useRemindersStore = create<RemindersState>()((set, get) => ({
  workspaceId: null,
  userId: null,
  eventsById: {},
  lastSyncError: null,
  loading: false,

  setContext: (workspaceId, userId) => {
    set({ workspaceId, userId });
  },

  hydrateFromRows: (rows) => {
    const eventsById: Record<string, ReminderEvent> = {};
    for (const row of rows) {
      eventsById[row.id] = row;
    }
    set({ eventsById });
  },

  upsertEvent: (event) => {
    set((state) => ({
      eventsById: { ...state.eventsById, [event.id]: event },
    }));
  },

  removeEventLocal: (id) => {
    set((state) => {
      const next = { ...state.eventsById };
      delete next[id];
      return { eventsById: next };
    });
  },

  fetchEvents: async () => {
    const { workspaceId } = get();
    if (!workspaceId) return;

    set({ loading: true });
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("reminder_events")
        .select("*, recurrence_rules(*)")
        .eq("workspace_id", workspaceId)
        .order("date", { ascending: true });

      if (error) throw error;

      const events: ReminderEvent[] = (data ?? []).map(normalizeRow);
      get().hydrateFromRows(events);
    } catch (e) {
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to fetch reminders",
      });
    } finally {
      set({ loading: false });
    }
  },

  createEvent: async (insert) => {
    const { workspaceId, userId } = get();
    if (!workspaceId || !userId) return null;

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("reminder_events")
        .insert({
          workspace_id: insert.workspace_id ?? workspaceId,
          user_id: insert.user_id ?? userId,
          title: insert.title,
          date: insert.date,
          start_time: insert.start_time,
          end_time: insert.end_time,
          is_checked: insert.is_checked,
          color: insert.color,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      let recurrenceRule: RecurrenceRule | null = null;
      if (insert.recurrence_rule) {
        const { data: rrData, error: rrError } = await supabase
          .from("recurrence_rules")
          .insert({
            event_id: data.id,
            frequency: insert.recurrence_rule.frequency,
            interval: insert.recurrence_rule.interval,
            days_of_week: insert.recurrence_rule.days_of_week,
            end_date: insert.recurrence_rule.end_date,
            count: insert.recurrence_rule.count,
          })
          .select()
          .single();

        if (rrError) throw rrError;
        recurrenceRule = rrData as RecurrenceRule;
      }

      const event: ReminderEvent = {
        ...(data as ReminderEvent),
        recurrence_rule: recurrenceRule,
      };
      get().upsertEvent(event);
      return event.id;
    } catch (e) {
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to create reminder",
      });
      return null;
    }
  },

  updateEvent: async (id, update, scope = "all", occurrenceDate) => {
    const prev = get().eventsById[id];
    if (!prev) return;

    if (scope === "all" || !prev.recurrence_rule) {
      const optimistic: ReminderEvent = {
        ...prev,
        ...update,
        recurrence_rule: update.recurrence_rule !== undefined
          ? (update.recurrence_rule as RecurrenceRule | null)
          : prev.recurrence_rule,
      };
      get().upsertEvent(optimistic);

      const supabase = createClient();
      try {
        const { recurrence_rule: _rr, ...eventUpdate } = update;
        const { error } = await supabase
          .from("reminder_events")
          .update(eventUpdate)
          .eq("id", id);
        if (error) throw error;

        if (update.recurrence_rule !== undefined) {
          if (prev.recurrence_rule) {
            const { error: deleteRuleError } = await supabase
              .from("recurrence_rules")
              .delete()
              .eq("event_id", id);
            if (deleteRuleError) throw deleteRuleError;
          }
          if (update.recurrence_rule) {
            const { data: rrData, error: rrError } = await supabase
              .from("recurrence_rules")
              .insert({
                event_id: id,
                frequency: update.recurrence_rule.frequency,
                interval: update.recurrence_rule.interval,
                days_of_week: update.recurrence_rule.days_of_week,
                end_date: update.recurrence_rule.end_date,
                count: update.recurrence_rule.count,
              })
              .select()
              .single();
            if (rrError) throw rrError;
            get().upsertEvent({
              ...optimistic,
              recurrence_rule: rrData as RecurrenceRule,
            });
          }
        }
      } catch (e) {
        get().upsertEvent(prev);
        set({
          lastSyncError:
            e instanceof Error ? e.message : "Failed to update reminder",
        });
      }
      return;
    }

    if (scope === "this" && occurrenceDate) {
      await splitSingleOccurrence(get, set, prev, occurrenceDate, update);
      return;
    }

    if (scope === "this_and_following" && occurrenceDate) {
      await splitFromOccurrence(get, set, prev, occurrenceDate, update);
    }
  },

  deleteEvent: async (id, scope = "all", occurrenceDate) => {
    const prev = get().eventsById[id];
    if (!prev) return;

    if (scope === "all" || !prev.recurrence_rule) {
      get().removeEventLocal(id);
      const supabase = createClient();
      try {
        const { error } = await supabase
          .from("reminder_events")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (e) {
        get().upsertEvent(prev);
        set({
          lastSyncError:
            e instanceof Error ? e.message : "Failed to delete reminder",
        });
      }
      return;
    }

    if (scope === "this" && occurrenceDate && prev.recurrence_rule) {
      await excludeOccurrence(get, set, prev, occurrenceDate);
      return;
    }

    if (scope === "this_and_following" && occurrenceDate && prev.recurrence_rule) {
      const supabase = createClient();
      try {
        const dayBefore = format(addDays(new Date(occurrenceDate), -1), "yyyy-MM-dd");
        const { error } = await supabase
          .from("recurrence_rules")
          .update({ end_date: dayBefore })
          .eq("event_id", id);
        if (error) throw error;
        get().upsertEvent({
          ...prev,
          recurrence_rule: { ...prev.recurrence_rule, end_date: dayBefore },
        });
      } catch (e) {
        set({
          lastSyncError:
            e instanceof Error ? e.message : "Failed to update recurrence",
        });
      }
    }
  },

  toggleChecked: async (id) => {
    const prev = get().eventsById[id];
    if (!prev) return;

    const next = { ...prev, is_checked: !prev.is_checked };
    get().upsertEvent(next);

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("reminder_events")
        .update({ is_checked: next.is_checked })
        .eq("id", id);
      if (error) throw error;
    } catch (e) {
      get().upsertEvent(prev);
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to toggle reminder",
      });
    }
  },

  reschedule: async (id, newDate) => {
    const prev = get().eventsById[id];
    if (!prev) return;

    const next = { ...prev, date: newDate };
    get().upsertEvent(next);

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("reminder_events")
        .update({ date: newDate })
        .eq("id", id);
      if (error) throw error;
    } catch (e) {
      get().upsertEvent(prev);
      set({
        lastSyncError:
          e instanceof Error ? e.message : "Failed to reschedule reminder",
      });
    }
  },

  getOccurrencesForRange: (rangeStart, rangeEnd) => {
    return expandAllOccurrences(allEvents(get()), rangeStart, rangeEnd);
  },

  getTodayAndUpcoming: (limit = 20) => {
    const today = startOfDay(new Date());
    const end = addDays(today, 30);
    return expandAllOccurrences(allEvents(get()), today, end).slice(0, limit);
  },

  clearSyncError: () => set({ lastSyncError: null }),
}));

function normalizeRow(row: Record<string, unknown>): ReminderEvent {
  const rules = row.recurrence_rules as RecurrenceRule[] | null;
  const recurrenceMeta =
    (row.recurrence_rule as { excluded_dates?: string[] } | null) ?? null;
  const primaryRule = rules && rules.length > 0 ? rules[0]! : null;
  return {
    id: row.id as string,
    workspace_id: row.workspace_id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    date: row.date as string,
    start_time: (row.start_time as string) ?? null,
    end_time: (row.end_time as string) ?? null,
    is_checked: row.is_checked as boolean,
    color: row.color as ReminderColor,
    recurrence_rule: primaryRule
      ? { ...primaryRule, excluded_dates: recurrenceMeta?.excluded_dates ?? [] }
      : null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/**
 * For "edit this occurrence only": end the original series before this date,
 * create a one-off event for this occurrence with the update applied,
 * and create a new series starting after this occurrence.
 */
async function splitSingleOccurrence(
  get: () => RemindersState,
  set: (partial: Partial<RemindersState> | ((s: RemindersState) => Partial<RemindersState>)) => void,
  event: ReminderEvent,
  occurrenceDate: string,
  update: ReminderUpdate
): Promise<void> {
  const supabase = createClient();
  try {
    const existingExcluded = event.recurrence_rule?.excluded_dates ?? [];
    const nextExcluded = Array.from(new Set([...existingExcluded, occurrenceDate]));
    const { error: excludeError } = await supabase
      .from("reminder_events")
      .update({ recurrence_rule: { excluded_dates: nextExcluded } })
      .eq("id", event.id);
    if (excludeError) throw excludeError;

    get().upsertEvent({
      ...event,
      recurrence_rule: event.recurrence_rule
        ? { ...event.recurrence_rule, excluded_dates: nextExcluded }
        : null,
    });

    const oneOff: ReminderInsert = {
      title: update.title ?? event.title,
      date: update.date ?? occurrenceDate,
      start_time: update.start_time !== undefined ? update.start_time : event.start_time,
      end_time: update.end_time !== undefined ? update.end_time : event.end_time,
      is_checked: update.is_checked ?? event.is_checked,
      color: (update.color ?? event.color) as ReminderColor,
      recurrence_rule: null,
    };

    const { data, error } = await supabase
      .from("reminder_events")
      .insert({
        workspace_id: oneOff.workspace_id,
        user_id: oneOff.user_id,
        title: oneOff.title,
        date: oneOff.date,
        start_time: oneOff.start_time,
        end_time: oneOff.end_time,
        is_checked: oneOff.is_checked,
        color: oneOff.color,
      })
      .select()
      .single();
    if (error) throw error;
    if (data) {
      get().upsertEvent({ ...(data as ReminderEvent), recurrence_rule: null });
    }
  } catch (e) {
    set({
      lastSyncError:
        e instanceof Error ? e.message : "Failed to split occurrence",
    });
  }
}

async function splitFromOccurrence(
  get: () => RemindersState,
  set: (partial: Partial<RemindersState> | ((s: RemindersState) => Partial<RemindersState>)) => void,
  event: ReminderEvent,
  occurrenceDate: string,
  update: ReminderUpdate
): Promise<void> {
  const supabase = createClient();
  const rule = event.recurrence_rule;
  if (!rule) return;

  try {
    const dayBefore = format(addDays(new Date(occurrenceDate), -1), "yyyy-MM-dd");
    const { error: truncateError } = await supabase
      .from("recurrence_rules")
      .update({ end_date: dayBefore })
      .eq("event_id", event.id);
    if (truncateError) throw truncateError;

    get().upsertEvent({
      ...event,
      recurrence_rule: { ...rule, end_date: dayBefore },
    });

    const nextRule = update.recurrence_rule ?? {
      frequency: rule.frequency,
      interval: rule.interval,
      days_of_week: rule.days_of_week,
      end_date: rule.end_date,
      count: rule.count,
    };

    const newInsert: ReminderInsert = {
      title: update.title ?? event.title,
      date: update.date ?? occurrenceDate,
      start_time: update.start_time !== undefined ? update.start_time : event.start_time,
      end_time: update.end_time !== undefined ? update.end_time : event.end_time,
      is_checked: update.is_checked ?? event.is_checked,
      color: (update.color ?? event.color) as ReminderColor,
      recurrence_rule: nextRule,
    };

    await get().createEvent(newInsert);
  } catch (e) {
    set({
      lastSyncError:
        e instanceof Error ? e.message : "Failed to split series",
    });
  }
}

async function excludeOccurrence(
  get: () => RemindersState,
  set: (partial: Partial<RemindersState> | ((s: RemindersState) => Partial<RemindersState>)) => void,
  event: ReminderEvent,
  occurrenceDate: string
): Promise<void> {
  const supabase = createClient();
  try {
    const existing = (event.recurrence_rule as RecurrenceRule & { excluded_dates?: string[] }) ?? {};
    const excluded = Array.from(
      new Set([...(existing.excluded_dates ?? []), occurrenceDate])
    );
    const { error } = await supabase
      .from("reminder_events")
      .update({ recurrence_rule: { ...event.recurrence_rule, excluded_dates: excluded } })
      .eq("id", event.id);
    if (error) throw error;
    get().upsertEvent({
      ...event,
      recurrence_rule: event.recurrence_rule
        ? { ...event.recurrence_rule, excluded_dates: excluded }
        : null,
    });
  } catch (e) {
    set({
      lastSyncError:
        e instanceof Error ? e.message : "Failed to exclude occurrence",
    });
  }
}
