import { NextResponse } from "next/server";
import type { LocationValue } from "@/lib/types/properties";

export const dynamic = "force-dynamic";

function parseCoord(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const lat = parseCoord(searchParams.get("lat"));
  const lng = parseCoord(searchParams.get("lng"));
  if (lat == null || lng == null) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN;

  try {
    if (token) {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`,
        { next: { revalidate: 0 } }
      );
      if (!res.ok) throw new Error("Mapbox reverse geocode failed");
      const data = (await res.json()) as {
        features?: Array<{ place_name: string; place_type?: string[] }>;
      };
      const f = data.features?.[0];
      if (!f) {
        return NextResponse.json({ location: null as null });
      }
      const loc: LocationValue = {
        address: f.place_name,
        lat,
        lng,
        place_name: f.place_name,
      };
      return NextResponse.json({ location: loc });
    }

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "LobeApp/1.0 (https://github.com/lobe)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error("Nominatim reverse failed");
    const r = (await res.json()) as {
      display_name?: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        country?: string;
      };
    };
    const display = r.display_name ?? `${lat}, ${lng}`;
    const city =
      r.address?.city ?? r.address?.town ?? r.address?.village ?? undefined;
    const country = r.address?.country;
    const loc: LocationValue = {
      address: display,
      lat,
      lng,
      place_name: display,
      city,
      country,
    };
    return NextResponse.json({ location: loc });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reverse geocode failed" },
      { status: 502 }
    );
  }
}
