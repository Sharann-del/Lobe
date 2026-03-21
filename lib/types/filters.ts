import type { PropertyValueType } from "./properties";

export type FilterOperator =
  | "is"
  | "is_not"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "before"
  | "after"
  | "between";

export type FilterConjunction = "and" | "or";

export interface FilterRule {
  id: string;
  propertyId: string;
  propertyType: PropertyValueType;
  operator: FilterOperator;
  value: unknown;
  conjunction: FilterConjunction;
}

const TEXT_OPS: FilterOperator[] = [
  "is",
  "is_not",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "is_empty",
  "is_not_empty",
];

const NUMBER_OPS: FilterOperator[] = [
  "is",
  "is_not",
  "gt",
  "lt",
  "gte",
  "lte",
  "is_empty",
  "is_not_empty",
];

const DATE_OPS: FilterOperator[] = [
  "is",
  "is_not",
  "before",
  "after",
  "between",
  "is_empty",
  "is_not_empty",
];

const SELECT_OPS: FilterOperator[] = [
  "is",
  "is_not",
  "is_empty",
  "is_not_empty",
];

const MULTI_SELECT_OPS: FilterOperator[] = [
  "contains",
  "not_contains",
  "is_empty",
  "is_not_empty",
];

const BOOL_OPS: FilterOperator[] = ["is"];

const RELATION_OPS: FilterOperator[] = [
  "contains",
  "not_contains",
  "is_empty",
  "is_not_empty",
];

const FILE_OPS: FilterOperator[] = ["is_empty", "is_not_empty"];

export const OPERATORS_BY_TYPE: Record<PropertyValueType, FilterOperator[]> = {
  text: TEXT_OPS,
  number: NUMBER_OPS,
  date: DATE_OPS,
  boolean: BOOL_OPS,
  select: SELECT_OPS,
  multi_select: MULTI_SELECT_OPS,
  status: SELECT_OPS,
  relation: RELATION_OPS,
  url: TEXT_OPS,
  email: TEXT_OPS,
  phone: TEXT_OPS,
  person: RELATION_OPS,
  file: FILE_OPS,
  checkbox: BOOL_OPS,
  formula: NUMBER_OPS,
  rollup: NUMBER_OPS,
  created_time: DATE_OPS,
  last_edited_time: DATE_OPS,
  created_by: RELATION_OPS,
  last_edited_by: RELATION_OPS,
  location: TEXT_OPS,
};

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  is: "is",
  is_not: "is not",
  contains: "contains",
  not_contains: "does not contain",
  starts_with: "starts with",
  ends_with: "ends with",
  is_empty: "is empty",
  is_not_empty: "is not empty",
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
  before: "is before",
  after: "is after",
  between: "is between",
};

export const NO_VALUE_OPERATORS: FilterOperator[] = [
  "is_empty",
  "is_not_empty",
];
