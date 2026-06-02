import { isInGuatemala } from "./haversine";

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/** OpenStreetMap Nominatim — server-side only (rate limits + User-Agent). */
export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q.includes("Guatemala") ? q : `${q}, Guatemala`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "gt");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "GuatemalaTripPWA/1.0 (personal trip planner)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      lat?: string;
      lon?: string;
      display_name?: string;
    }[];

    const hit = data[0];
    if (!hit?.lat || !hit?.lon) return null;

    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInGuatemala(lat, lng)) {
      return null;
    }

    return {
      lat,
      lng,
      displayName: hit.display_name ?? q,
    };
  } catch {
    return null;
  }
}
