import { geocodePlace } from "../geo/nominatim";
import { exaSearch, formatExaHits } from "../providers/exa";
import { callClaude, getApiKey, getModel } from "./anthropic";
import { estimateCostUsd } from "./types";

const MAP_SEARCH_SYSTEM = `You help place a Guatemala trip location on a map. Given a user query and optional Exa web results, reply with ONLY raw JSON:
{
  "name": "Short place name for the map pin",
  "geocodeQuery": "Specific search string for OpenStreetMap geocoding in Guatemala",
  "notes": "One line about the place",
  "sourceUrl": "Best source URL from results or null"
}

Rules:
- geocodeQuery must be concrete: include town/region (Antigua, Panajachel, Lake Atitlán, etc.)
- Do not invent coordinates
- If unsure, prefer well-known spelling for Guatemala`;

export interface MapPlaceResult {
  name: string;
  lat: number;
  lng: number;
  notes?: string;
  sourceUrl?: string;
  address?: string;
  usedExa: boolean;
  usage?: { input_tokens: number; output_tokens: number };
  costUsd?: number;
}

function parseMapJson(text: string): {
  name?: string;
  geocodeQuery?: string;
  notes?: string;
  sourceUrl?: string;
} | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(raw) as {
      name?: string;
      geocodeQuery?: string;
      notes?: string;
      sourceUrl?: string;
    };
  } catch {
    return null;
  }
}

export async function runMapPlaceSearch(
  query: string,
  env: Record<string, string | undefined>,
): Promise<MapPlaceResult> {
  const q = query.trim();
  if (!q) throw new Error("query required");

  let totalUsage = { input_tokens: 0, output_tokens: 0 };
  let usedExa = false;

  const direct = await geocodePlace(q);
  if (direct) {
    return {
      name: q,
      lat: direct.lat,
      lng: direct.lng,
      address: direct.displayName,
      notes: direct.displayName,
      usedExa: false,
    };
  }

  const exaHits = await exaSearch(
    { query: `${q} Guatemala location`, numResults: 6 },
    env,
  );
  usedExa = Boolean(exaHits?.length);

  let geocodeQuery = q;
  let name = q;
  let notes: string | undefined;
  let sourceUrl: string | undefined;

  const apiKey = getApiKey(env);
  if (apiKey && exaHits?.length) {
    const block = formatExaHits(exaHits);
    const result = await callClaude(
      apiKey,
      getModel(env),
      MAP_SEARCH_SYSTEM,
      [
        {
          role: "user",
          content: `User query: "${q}"\n\nExa results:\n${block}\n\nReturn JSON only.`,
        },
      ],
      400,
    );
    totalUsage = {
      input_tokens: totalUsage.input_tokens + result.usage.input_tokens,
      output_tokens: totalUsage.output_tokens + result.usage.output_tokens,
    };
    const parsed = parseMapJson(result.text);
    if (parsed?.geocodeQuery) geocodeQuery = parsed.geocodeQuery;
    if (parsed?.name) name = parsed.name;
    notes = parsed?.notes;
    sourceUrl = parsed?.sourceUrl ?? exaHits[0]?.url;
  } else if (exaHits?.[0]) {
    notes = exaHits[0].snippet.slice(0, 160);
    sourceUrl = exaHits[0].url;
  }

  const geocoded = await geocodePlace(geocodeQuery);
  if (!geocoded) {
    throw new Error(`Couldn't find "${q}" on the map. Try a more specific name + town.`);
  }

  return {
    name,
    lat: geocoded.lat,
    lng: geocoded.lng,
    notes: notes ?? geocoded.displayName,
    address: geocoded.displayName,
    sourceUrl,
    usedExa,
    usage: totalUsage.input_tokens || totalUsage.output_tokens ? totalUsage : undefined,
    costUsd: totalUsage.input_tokens ? estimateCostUsd(totalUsage) : undefined,
  };
}
