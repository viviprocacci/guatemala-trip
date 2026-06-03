import { isInGuatemala } from "./haversine";

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/** OpenStreetMap Nominatim — server-side only (rate limits + User-Agent). */
const NOMINATIM_HEADERS = {
  "User-Agent": "GuatemalaTripPWA/1.0 (personal trip planner)",
  Accept: "application/json",
} as const;

type NominatimHit = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

function parseHit(hit: NominatimHit, fallback: string): GeocodeResult | null {
  if (!hit?.lat || !hit?.lon) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInGuatemala(lat, lng)) {
    return null;
  }
  return { lat, lng, displayName: hit.display_name ?? fallback };
}

async function nominatimSearch(
  q: string,
  limit: number,
  countryOnly = true,
): Promise<GeocodeResult[]> {
  const query = q.trim();
  if (!query) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query.includes("Guatemala") ? query : `${query}, Guatemala`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  if (countryOnly) url.searchParams.set("countrycodes", "gt");

  try {
    const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
    if (!res.ok) return [];

    const data = (await res.json()) as NominatimHit[];
    const out: GeocodeResult[] = [];
    for (const hit of data) {
      const parsed = parseHit(hit, query);
      if (parsed) out.push(parsed);
    }
    return out;
  } catch {
    return [];
  }
}

export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  const hits = await nominatimSearch(query, 1);
  return hits[0] ?? null;
}

/** Multiple Nominatim hits for autocomplete-style search (server-side only). */
export async function searchPlaces(query: string, limit = 5): Promise<GeocodeResult[]> {
  return nominatimSearch(query, limit);
}
