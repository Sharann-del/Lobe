import type { LocationValue } from "@/lib/types/properties";

export interface GeocodeSuggestion {
  id: string;
  label: string;
  location: Pick<LocationValue, "lat" | "lng" | "address" | "place_name" | "city" | "country">;
}
