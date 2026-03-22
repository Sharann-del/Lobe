import type { NodeRow } from "@/lib/types/nodes";
import type { NodeProperty, PropertySchema } from "@/lib/types/properties";
import { parseLocationValue } from "@/lib/location/location-value";

export interface LocationMapEntry {
  page: NodeRow;
  locationPropertyKey: string;
  lat: number;
  lng: number;
  label: string;
  quickProps: { name: string; value: string }[];
}

export function buildLocationEntries(
  rows: NodeRow[],
  propertiesByNode: Record<string, NodeProperty[]>,
  locationSchema: PropertySchema,
  previewSchemas: PropertySchema[],
  maxQuick: number
): LocationMapEntry[] {
  const out: LocationMapEntry[] = [];
  const key = locationSchema.name;

  for (const page of rows) {
    const props = propertiesByNode[page.id] ?? [];
    const locProp = props.find((p) => p.key === key);
    const loc = parseLocationValue(locProp?.value);
    if (!loc) continue;

    const quickProps: { name: string; value: string }[] = [];
    for (const sch of previewSchemas) {
      if (sch.id === locationSchema.id) continue;
      if (quickProps.length >= maxQuick) break;
      const p = props.find((x) => x.key === sch.name);
      if (p?.value == null || p.value === "") continue;
      let display = "";
      if (sch.type === "select") {
        const opt = sch.options.find(
          (o) => o.id === p.value || o.name === p.value
        );
        display = opt?.name ?? String(p.value);
      } else if (typeof p.value === "string" || typeof p.value === "number") {
        display = String(p.value);
      } else {
        display = "…";
      }
      quickProps.push({ name: sch.name, value: display });
    }

    out.push({
      page,
      locationPropertyKey: key,
      lat: loc.lat,
      lng: loc.lng,
      label: page.title || loc.place_name || "Untitled",
      quickProps,
    });
  }

  return out;
}
