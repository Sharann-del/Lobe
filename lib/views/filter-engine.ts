import type { FilterRule } from "@/lib/types/filters";
import type { PageProperty } from "@/lib/types/properties";

function getPropertyValue(
  properties: PageProperty[],
  propertyId: string
): unknown {
  return properties.find((p) => p.key === propertyId)?.value ?? null;
}

function isEmpty(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (val === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

function evaluateRule(val: unknown, rule: FilterRule): boolean {
  const { operator, value: filterVal } = rule;

  switch (operator) {
    case "is_empty":
      return isEmpty(val);
    case "is_not_empty":
      return !isEmpty(val);

    case "is":
      if (typeof val === "boolean") return val === filterVal;
      return String(val ?? "") === String(filterVal ?? "");
    case "is_not":
      return String(val ?? "") !== String(filterVal ?? "");

    case "contains": {
      if (Array.isArray(val)) {
        return val.some((v) => String(v) === String(filterVal));
      }
      return String(val ?? "")
        .toLowerCase()
        .includes(String(filterVal ?? "").toLowerCase());
    }
    case "not_contains": {
      if (Array.isArray(val)) {
        return !val.some((v) => String(v) === String(filterVal));
      }
      return !String(val ?? "")
        .toLowerCase()
        .includes(String(filterVal ?? "").toLowerCase());
    }

    case "starts_with":
      return String(val ?? "")
        .toLowerCase()
        .startsWith(String(filterVal ?? "").toLowerCase());
    case "ends_with":
      return String(val ?? "")
        .toLowerCase()
        .endsWith(String(filterVal ?? "").toLowerCase());

    case "gt":
      return Number(val) > Number(filterVal);
    case "lt":
      return Number(val) < Number(filterVal);
    case "gte":
      return Number(val) >= Number(filterVal);
    case "lte":
      return Number(val) <= Number(filterVal);

    case "before":
      return new Date(String(val)).getTime() < new Date(String(filterVal)).getTime();
    case "after":
      return new Date(String(val)).getTime() > new Date(String(filterVal)).getTime();
    case "between": {
      const [start, end] = (filterVal as [string, string]) ?? ["", ""];
      const t = new Date(String(val)).getTime();
      return t >= new Date(start).getTime() && t <= new Date(end).getTime();
    }

    default:
      return true;
  }
}

export function applyFilters(
  properties: PageProperty[],
  rules: FilterRule[]
): boolean {
  if (rules.length === 0) return true;

  let result = true;

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const val = getPropertyValue(properties, rule.propertyId);
    const match = evaluateRule(val, rule);

    if (i === 0) {
      result = match;
    } else if (rule.conjunction === "or") {
      result = result || match;
    } else {
      result = result && match;
    }
  }

  return result;
}
