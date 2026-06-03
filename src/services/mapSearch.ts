export interface MapPlaceSearchResult {
  name: string;
  lat: number;
  lng: number;
  notes?: string;
  address?: string;
  sourceUrl?: string;
}

export async function mapPlaceSearch(query: string): Promise<MapPlaceSearchResult> {
  const res = await fetch("/api/map-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = (await res.json()) as MapPlaceSearchResult & { error?: string };
  if (!res.ok) throw new Error(data.error || "Map search failed");
  return data;
}
