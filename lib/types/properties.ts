import type { BadgeColor } from "@/components/ui/Badge";

export const PROPERTY_VALUE_TYPES = [
  "text",
  "number",
  "date",
  "boolean",
  "select",
  "multi_select",
  "status",
  "relation",
  "url",
  "email",
  "phone",
  "person",
  "file",
  "checkbox",
  "formula",
  "rollup",
  "created_time",
  "last_edited_time",
  "created_by",
  "last_edited_by",
  "location",
] as const;

export type PropertyValueType = (typeof PROPERTY_VALUE_TYPES)[number];

export interface SelectOption {
  id: string;
  name: string;
  color: BadgeColor;
}

export type StatusGroup = "not_started" | "in_progress" | "done";

export interface StatusOption {
  id: string;
  name: string;
  color: BadgeColor;
  group: StatusGroup;
}

export type NumberFormat =
  | "plain"
  | "comma"
  | "percent"
  | "usd"
  | "eur"
  | "inr"
  | "custom";

export interface NumberConfig {
  format: NumberFormat;
  decimals: number;
  prefix: string;
  suffix: string;
  showProgressBar: boolean;
  min: number;
  max: number;
}

export const DEFAULT_NUMBER_CONFIG: NumberConfig = {
  format: "plain",
  decimals: 0,
  prefix: "",
  suffix: "",
  showProgressBar: false,
  min: 0,
  max: 100,
};

export type DateFormat = "friendly" | "iso" | "relative";

export interface DateConfig {
  includeTime: boolean;
  timeZone: string | null;
  dateFormat: DateFormat;
  endDate: boolean;
  reminder: ReminderSetting | null;
}

export interface ReminderSetting {
  amount: number;
  unit: "minutes" | "hours" | "days";
}

export const DEFAULT_DATE_CONFIG: DateConfig = {
  includeTime: false,
  timeZone: null,
  dateFormat: "friendly",
  endDate: false,
  reminder: null,
};

export interface RelationConfig {
  targetDatabaseId: string;
  bidirectional: boolean;
}

export type AggregationType =
  | "count"
  | "count_unique"
  | "count_all"
  | "percent_empty"
  | "percent_not_empty"
  | "sum"
  | "avg"
  | "median"
  | "min"
  | "max"
  | "range"
  | "show_original"
  | "count_per_group";

export interface RollupConfig {
  relationPropertyId: string;
  targetPropertyId: string;
  aggregation: AggregationType;
}

export interface FormulaConfig {
  expression: string;
  ast: unknown;
}

export interface PropertySchema {
  id: string;
  workspace_id: string;
  name: string;
  type: PropertyValueType;
  options: SelectOption[];
  icon: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageProperty {
  id: string;
  page_id: string;
  key: string;
  value_type: PropertyValueType;
  value: unknown;
  created_at: string;
}

export interface PersonValue {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface FileValue {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface RelationValue {
  page_id: string;
  title: string;
  icon: string | null;
}

/** Stored JSON for `location` property type (map + geocoding). */
export interface LocationValue {
  address: string;
  lat: number;
  lng: number;
  place_name: string;
  city?: string;
  country?: string;
}

export type SortDirection = "asc" | "desc";

export interface ColumnSort {
  propertyId: string;
  direction: SortDirection;
}

export interface ColumnConfig {
  propertyId: string;
  width: number;
  visible: boolean;
  order: number;
}

export interface GroupConfig {
  propertyId: string | null;
  collapsed: Record<string, boolean>;
}

export const DEFAULT_COLUMN_WIDTH = 180;
export const MIN_COLUMN_WIDTH = 80;
export const TITLE_COLUMN_WIDTH = 280;
export const CHECKBOX_COLUMN_WIDTH = 36;

export const READ_ONLY_TYPES: PropertyValueType[] = [
  "formula",
  "rollup",
  "created_time",
  "last_edited_time",
  "created_by",
  "last_edited_by",
];
