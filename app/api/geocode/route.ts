import { NextResponse } from "next/server";
import type { GeocodeSuggestion } from "@/lib/location/geocode-types";

export const dynamic = "force-dynamic";

function mapboxSuggestions(
  data: {
    features?: Array<{
      id: string;
      place_name: string;
      center: [number, number];
      text?: string;
      context?: Array<{ id: string; text: string }>;
    }>;
  },
  query: string
): GeocodeSuggestion[] {
  const features = data.features ?? [];
  return features.slice(0, 8).map((f) => {
    const [lng, lat] = f.center;
    let city: string | undefined;
    let country: string | undefined;
    for (const c of f.context ?? []) {
      if (c.id.startsWith("place.")) city = c.text;
      if (c.id.startsWith("country.")) country = c.text;
    }
    return {
      id: f.id,
      label: f.place_name,
      location: {
        address: query.trim() || f.place_name,
        lat,
        lng,
        place_name: f.place_name,
        city,
        country,
      },
    };
  });
}

async function nominatimSearch(query: string): Promise<GeocodeSuggestion[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "LobeApp/1.0 (https://github.com/lobe)",
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error("Geocoding service unavailable");
  }

  const raw = (await res.json()) as Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      country?: string;
    };
  }>;

  return raw.map((r) => {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    const city =
      r.address?.city ?? r.address?.town ?? r.address?.village ?? undefined;
    const country = r.address?.country;
    return {
      id: String(r.place_id),
      label: r.display_name,
      location: {
        address: query.trim() || r.display_name,
        lat,
        lng,
        place_name: r.display_name,
        city,
        country,
      },
    };
  });
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] satisfies GeocodeSuggestion[] });
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN;

  try {
    if (token) {
      const enc = encodeURIComponent(q);
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${enc}.json?access_token=${token}&limit=8`,
        { next: { revalidate: 0 } }
      );
      if (!res.ok) {
        throw new Error("Mapbox geocode failed");
      }
      const data = (await res.json()) as Parameters<typeof mapboxSuggestions>[0];
      const suggestions = mapboxSuggestions(data, q);
      return NextResponse.json({ suggestions });
    }

    const suggestions = await nominatimSearch(q);
    return NextResponse.json({ suggestions });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Geocoding failed",
        suggestions: [],
      },
      { status: 502 }
    );
  }
}
