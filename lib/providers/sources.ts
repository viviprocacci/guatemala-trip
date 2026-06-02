import type { SearchType } from "../ai/search";
import type { GatherSourcesResult, HotelSearchParams } from "./types";
import { gatherDiscovery } from "./discovery";
import { gatherHotelSources } from "./hotels";
import { tavilySearch } from "../ai/anthropic";

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function gatherSearchSources(
  opts: {
    query: string;
    type: SearchType;
    tripStart?: string;
    location?: string;
  },
  env: Record<string, string | undefined>,
): Promise<GatherSourcesResult> {
  const tripEnd = opts.tripStart ? addDays(opts.tripStart, 4) : undefined;
  const hotelParams: HotelSearchParams = {
    query: opts.query,
    checkIn: opts.tripStart,
    checkOut: tripEnd,
    location: opts.location ?? inferLocation(opts.query),
  };

  if (opts.type === "hotel") {
    return gatherHotelSources(hotelParams, env);
  }

  const discovery = await gatherDiscovery(
    {
      query: opts.query,
      tripStart: opts.tripStart,
      location: hotelParams.location,
    },
    env,
  );

  const blocks: GatherSourcesResult["blocks"] = [];
  const sourcesUsed = { exa: false, expedia: false, booking: false, tavily: false };

  if (discovery?.hits.length) {
    sourcesUsed.exa = true;
    blocks.push({
      label: "Exa — activities & discovery",
      provider: "exa",
      hits: discovery.hits,
    });
  }

  if (opts.type === "general") {
    const hotels = await gatherHotelSources(
      { ...hotelParams, query: `${opts.query} OR ${hotelParams.location ?? "Antigua Guatemala"} hotel` },
      env,
    );
    for (const b of hotels.blocks) {
      blocks.push(b);
      sourcesUsed[b.provider] = true;
    }
  }

  if (!blocks.length) {
    const tavily = await tavilySearch(
      `${opts.query} Guatemala travel ${opts.tripStart ?? ""}`,
      env,
    );
    if (tavily) {
      sourcesUsed.tavily = true;
      return {
        blocks: [
          {
            label: "Web search (Tavily fallback)",
            provider: "tavily",
            hits: [{ title: "Web results", snippet: tavily, source: "tavily" }],
          },
        ],
        text: tavily,
        sourcesUsed,
      };
    }
  }

  const text =
    blocks.length > 0
      ? blocks
          .map((b) => `### ${b.label}\n${b.hits.map((h) => `- ${h.title}: ${h.snippet}${h.priceHint ? ` (${h.priceHint})` : ""}${h.url ? `\n  ${h.url}` : ""}`).join("\n")}`)
          .join("\n\n")
      : "No live provider results — use curated app data and typical Guatemala pricing.";

  return { blocks, text, sourcesUsed };
}

function inferLocation(query: string): string | undefined {
  const q = query.toLowerCase();
  if (/atitl|lake|panajachel|santa cruz|san marcos/i.test(q)) return "Lake Atitlán";
  if (/acatenango|fuego|hike/i.test(q)) return "Acatenango";
  if (/antigua/i.test(q)) return "Antigua Guatemala";
  if (/gua|airport/i.test(q)) return "Guatemala City";
  return undefined;
}
