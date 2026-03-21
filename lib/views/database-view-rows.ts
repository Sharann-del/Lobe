import type { PageRow } from "@/lib/types/pages";
import type { PageProperty, PropertySchema, ColumnSort } from "@/lib/types/properties";
import type { FilterRule } from "@/lib/types/filters";
import { getComparator } from "./sort-handlers";
import { applyFilters } from "./filter-engine";

export function comparePropertyValues(
  a: unknown,
  b: unknown,
  type: string
): number {
  const cmp = getComparator(type as Parameters<typeof getComparator>[0]);
  return cmp(a, b);
}

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

  const cmp = getComparator(schema.type);

  return [...pages].sort((a, b) => {
    const aProps = propertiesByPage[a.id] ?? [];
    const bProps = propertiesByPage[b.id] ?? [];
    const aVal = aProps.find((p) => p.key === schema.name)?.value;
    const bVal = bProps.find((p) => p.key === schema.name)?.value;
    const result = cmp(aVal, bVal);
    return sort.direction === "asc" ? result : -result;
  });
}

export function getFilteredSortedDatabaseRows(
  childIds: string[],
  pagesById: Record<string, PageRow | undefined>,
  propertiesByPage: Record<string, PageProperty[]>,
  schemaMap: Map<string, PropertySchema>,
  filters: FilterRule[],
  sorts: ColumnSort[]
): PageRow[] {
  let pages = childIds
    .map((id) => pagesById[id])
    .filter((p): p is PageRow => !!p && !p.is_deleted);

  if (filters.length > 0) {
    pages = pages.filter((page) => {
      const props = propertiesByPage[page.id] ?? [];
      return applyFilters(props, filters);
    });
  }

  if (sorts.length === 0) return pages;

  return [...pages].sort((a, b) => {
    for (const sort of sorts) {
      const schema = schemaMap.get(sort.propertyId);
      if (!schema) continue;

      const cmp = getComparator(schema.type);
      const aProps = propertiesByPage[a.id] ?? [];
      const bProps = propertiesByPage[b.id] ?? [];
      const aVal = aProps.find((p) => p.key === schema.name)?.value;
      const bVal = bProps.find((p) => p.key === schema.name)?.value;
      const result = cmp(aVal, bVal);

      if (result !== 0) {
        return sort.direction === "asc" ? result : -result;
      }
    }
    return 0;
  });
}

export function groupDatabaseRows(
  rows: PageRow[],
  groupByPropertyId: string | null,
  propertiesByPage: Record<string, PageProperty[]>,
  schemaMap: Map<string, PropertySchema>
): Map<string, PageRow[]> {
  const groups = new Map<string, PageRow[]>();

  if (!groupByPropertyId) {
    groups.set("all", rows);
    return groups;
  }

  const schema = schemaMap.get(groupByPropertyId);
  if (!schema) {
    groups.set("all", rows);
    return groups;
  }

  for (const row of rows) {
    const props = propertiesByPage[row.id] ?? [];
    const val = props.find((p) => p.key === schema.name)?.value;
    const key = val != null ? String(val) : "No value";

    const existing = groups.get(key) ?? [];
    existing.push(row);
    groups.set(key, existing);
  }

  return groups;
}
