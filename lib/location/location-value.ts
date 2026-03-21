import type { LocationValue } from "@/lib/types/properties";

export function isLocationValue(value: unknown): value is LocationValue {
  if (value === null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.lat === "number" &&
    typeof o.lng === "number" &&
    Number.isFinite(o.lat) &&
    Number.isFinite(o.lng) &&
    typeof o.place_name === "string" &&
    typeof o.address === "string"
  );
}

export function parseLocationValue(value: unknown): LocationValue | null {
  return isLocationValue(value) ? value : null;
}

/** Table cell: prefer City, Country when available. */
export function formatLocationTableDisplay(v: LocationValue): string {
  if (v.city && v.country) {
    return `${v.city}, ${v.country}`;
  }
  if (v.city) return v.city;
  if (v.country) return v.country;
  return v.place_name || v.address || "—";
}

/** Static map thumbnail (no Mapbox token required). */
export function openStreetMapStaticThumbnailUrl(
  lat: number,
  lng: number,
  width: number,
  height: number
): string {
  const w = Math.min(640, Math.max(64, Math.round(width)));
  const h = Math.min(640, Math.max(64, Math.round(height)));
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=${w}x${h}&maptype=mapnik`;
}
