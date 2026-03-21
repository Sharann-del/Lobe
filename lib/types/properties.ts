import type { BadgeColor } from "@/components/ui/Badge";

export const PROPERTY_VALUE_TYPES = [
  "text",
  "number",
  "date",
  "boolean",
  "select",
  "multi_select",
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

export type NumberFormat = "plain" | "currency" | "percent";

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
