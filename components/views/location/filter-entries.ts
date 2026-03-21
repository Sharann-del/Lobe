import type { LocationMapEntry } from "./location-entries";

export function filterLocationEntries(
  list: LocationMapEntry[],
  query: string
): LocationMapEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((e) => {
    const hay = `${e.label} ${e.page.title} ${e.quickProps.map((p) => `${p.name} ${p.value}`).join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}
