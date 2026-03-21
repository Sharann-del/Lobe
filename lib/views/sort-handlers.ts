import type { PropertyValueType, PersonValue, RelationValue, StatusOption } from "@/lib/types/properties";

type Comparator = (a: unknown, b: unknown) => number;

function nullsLast(a: unknown, b: unknown): number | null {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return null;
}

const textCompare: Comparator = (a, b) => {
  const n = nullsLast(a, b);
  if (n !== null) return n;
  return String(a).localeCompare(String(b));
};

const numberCompare: Comparator = (a, b) => {
  const n = nullsLast(a, b);
  if (n !== null) return n;
  return (a as number) - (b as number);
};

const boolCompare: Comparator = (a, b) => {
  return Number(Boolean(a)) - Number(Boolean(b));
};

const dateCompare: Comparator = (a, b) => {
  const n = nullsLast(a, b);
  if (n !== null) return n;
  return new Date(a as string).getTime() - new Date(b as string).getTime();
};

const selectCompare: Comparator = (a, b) => {
  const n = nullsLast(a, b);
  if (n !== null) return n;
  return String(a).localeCompare(String(b));
};

const multiSelectCompare: Comparator = (a, b) => {
  const aArr = (a as string[] | null) ?? [];
  const bArr = (b as string[] | null) ?? [];
  return aArr.length - bArr.length || aArr.join(",").localeCompare(bArr.join(","));
};

const personCompare: Comparator = (a, b) => {
  const aName = ((a as PersonValue[] | null) ?? [])[0]?.name ?? "";
  const bName = ((b as PersonValue[] | null) ?? [])[0]?.name ?? "";
  return aName.localeCompare(bName);
};

const relationCompare: Comparator = (a, b) => {
  const aLen = ((a as RelationValue[] | null) ?? []).length;
  const bLen = ((b as RelationValue[] | null) ?? []).length;
  return aLen - bLen;
};

const STATUS_GROUP_ORDER: Record<string, number> = {
  not_started: 0,
  in_progress: 1,
  done: 2,
};

export function createStatusCompare(
  statusOptions: StatusOption[]
): Comparator {
  return (a, b) => {
    const n = nullsLast(a, b);
    if (n !== null) return n;
    const aOpt = statusOptions.find((o) => o.id === a);
    const bOpt = statusOptions.find((o) => o.id === b);
    const aGroup = STATUS_GROUP_ORDER[aOpt?.group ?? "not_started"] ?? 0;
    const bGroup = STATUS_GROUP_ORDER[bOpt?.group ?? "not_started"] ?? 0;
    return aGroup - bGroup || String(a).localeCompare(String(b));
  };
}

const COMPARATORS: Record<PropertyValueType, Comparator> = {
  text: textCompare,
  number: numberCompare,
  date: dateCompare,
  boolean: boolCompare,
  select: selectCompare,
  multi_select: multiSelectCompare,
  status: selectCompare,
  relation: relationCompare,
  url: textCompare,
  email: textCompare,
  phone: textCompare,
  person: personCompare,
  file: (a, b) => {
    const aLen = (Array.isArray(a) ? a.length : 0);
    const bLen = (Array.isArray(b) ? b.length : 0);
    return aLen - bLen;
  },
  checkbox: boolCompare,
  formula: numberCompare,
  rollup: numberCompare,
  created_time: dateCompare,
  last_edited_time: dateCompare,
  created_by: personCompare,
  last_edited_by: personCompare,
  location: textCompare,
};

export function getComparator(type: PropertyValueType): Comparator {
  return COMPARATORS[type] ?? textCompare;
}
