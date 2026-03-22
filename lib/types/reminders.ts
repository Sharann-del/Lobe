export const REMINDER_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "gray",
] as const;

export type ReminderColor = (typeof REMINDER_COLORS)[number];

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrenceRule {
  id: string;
  event_id: string;
  frequency: RecurrenceFrequency;
  interval: number;
  days_of_week: number[];
  end_date: string | null;
  count: number | null;
  excluded_dates?: string[];
  created_at: string;
  updated_at: string;
}

export interface ReminderEvent {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_checked: boolean;
  color: ReminderColor;
  recurrence_rule: RecurrenceRule | null;
  created_at: string;
  updated_at: string;
}

export type ReminderInsert = Omit<
  ReminderEvent,
  "id" | "workspace_id" | "user_id" | "created_at" | "updated_at" | "recurrence_rule"
> & {
  id?: string;
  workspace_id?: string;
  user_id?: string;
  recurrence_rule?: Omit<RecurrenceRule, "id" | "event_id" | "created_at" | "updated_at"> | null;
};

export type ReminderUpdate = Partial<
  Omit<ReminderInsert, "workspace_id" | "user_id">
>;

export type RecurrenceEditScope = "this" | "this_and_following" | "all";

export interface ReminderOccurrence {
  event: ReminderEvent;
  occurrenceDate: string;
  isOriginal: boolean;
}

export function reminderColorVar(color: ReminderColor): string {
  return `var(--color-${color})`;
}

export function reminderColorMutedVar(color: ReminderColor): string {
  return `var(--color-${color}-muted)`;
}
