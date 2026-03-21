import type { PageRow } from "@/lib/types/pages";
import type { PageProperty, PropertySchema } from "@/lib/types/properties";

export function comparePropertyValues(
  a: unknown,
  b: unknown,
  _type: string
): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }

  return String(a).localeCompare(String(b));
}

/**
 * Database child rows for the current table context, in table sort order.
 * (Filters can be applied here when the table view gains filter state.)
 */
export function getSortedDatabaseRows(
  childIds: string[],
  pagesById: Record<string, PageRow | undefined>,
  propertiesByPage: Record<string, PageProperty[]>,
  schemaMap: Map<string, PropertySchema>,
  sort: { propertyId: string; direction: "asc" | "desc" } | null
): PageRow[] {
  const pages = childIds
    .map((id) => pagesById[id])
    .filter((p): p is PageRow => !!p && !p.is_deleted);

  if (!sort) return pages;

  const schema = schemaMap.get(sort.propertyId);
  if (!schema) return pages;

  return [...pages].sort((a, b) => {
    const aProps = propertiesByPage[a.id] ?? [];
    const bProps = propertiesByPage[b.id] ?? [];
    const aVal = aProps.find((p) => p.key === schema.name)?.value;
    const bVal = bProps.find((p) => p.key === schema.name)?.value;
    const cmp = comparePropertyValues(aVal, bVal, schema.type);
    return sort.direction === "asc" ? cmp : -cmp;
  });
}
