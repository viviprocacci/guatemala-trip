import { createHash } from "crypto";
import type { HotelSearchParams, ProviderHit } from "./types";

const EXPEDIA_TEST = "https://test.ean.com";
const EXPEDIA_PROD = "https://api.ean.com";

/** Guatemala trip anchors — set EXPEDIA_PROPERTY_IDS_* in env after partner onboarding */
function getPropertyIds(
  env: Record<string, string | undefined>,
  query: string,
  location?: string,
): string[] {
  const antigua = envIds(env.EXPEDIA_PROPERTY_IDS_ANTIGUA, ["19248"]);
  const lake = envIds(env.EXPEDIA_PROPERTY_IDS_LAKE, []);
  const hay = `${query} ${location ?? ""}`.toLowerCase();
  if (/atitl|lake|panajachel|santa cruz/i.test(hay)) return lake;
  if (/antigua|guatemala city|gua/i.test(hay)) return antigua;
  return [...antigua, ...lake];
}

function expediaBase(env: Record<string, string | undefined>): string {
  return env.EXPEDIA_RAPID_ENV === "production" ? EXPEDIA_PROD : EXPEDIA_TEST;
}

function authHeader(apiKey: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha512")
    .update(`${apiKey}${secret}${timestamp}`)
    .digest("hex");
  return `EAN APIKey=${apiKey},Signature=${signature},timestamp=${timestamp}`;
}

function envIds(raw: string | undefined, fallback: string[]): string[] {
  if (!raw?.trim()) return fallback;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function inferPropertyIds(
  env: Record<string, string | undefined>,
  query: string,
  location?: string,
): string[] {
  return getPropertyIds(env, query, location);
}

export async function searchExpediaHotels(
  params: HotelSearchParams,
  env: Record<string, string | undefined>,
): Promise<ProviderHit[] | null> {
  const apiKey = env.EXPEDIA_RAPID_API_KEY;
  const secret = env.EXPEDIA_RAPID_SECRET;
  if (!apiKey || !secret) return null;

  const checkIn = params.checkIn;
  const checkOut = params.checkOut;
  if (!checkIn || !checkOut) return null;

  const propertyIds = inferPropertyIds(env, params.query, params.location);
  if (!propertyIds.length) return null;

  const occupancy = params.occupancy ?? 2;
  const qs = new URLSearchParams({
    checkin: checkIn,
    checkout: checkOut,
    currency: "USD",
    country_code: "US",
    language: "en-US",
    occupancy: String(occupancy),
    rate_plan_count: "1",
    sales_channel: "website",
    sales_environment: "hotel_only",
    travel_purpose: "leisure",
  });

  for (const id of propertyIds.slice(0, 5)) {
    qs.append("property_id", id);
  }

  try {
    const res = await fetch(`${expediaBase(env)}/v3/properties/availability?${qs}`, {
      headers: {
        Accept: "application/json",
        Authorization: authHeader(apiKey, secret),
        "User-Agent": "GuatemalaTrip/1.0",
      },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      name?: string;
      property_id?: string;
      rooms?: {
        room_name?: string;
        rates?: { occupancy_pricing?: Record<string, { totals?: { inclusive?: { billable_currency?: { value?: string } } } }> }[];
      }[];
    }[];

    if (!Array.isArray(data) || !data.length) return null;

    const hits: ProviderHit[] = [];

    for (const prop of data) {
      const room = prop.rooms?.[0];
      const rate = room?.rates?.[0];
      const price =
        rate?.occupancy_pricing?.["2"]?.totals?.inclusive?.billable_currency?.value ??
        rate?.occupancy_pricing?.["1"]?.totals?.inclusive?.billable_currency?.value;

      hits.push({
        title: prop.name ?? `Property ${prop.property_id}`,
        url: `https://www.expedia.com/h${prop.property_id}.Hotel-Information`,
        snippet: room?.room_name ?? "Room available via Expedia Rapid",
        priceHint: price ? `$${price} total stay` : undefined,
        source: "expedia",
      });
    }

    return hits.length ? hits : null;
  } catch {
    return null;
  }
}

export function formatExpediaHits(hits: ProviderHit[]): string {
  return hits
    .map(
      (h, i) =>
        `[${i + 1}] ${h.title} (Expedia Rapid)${h.priceHint ? ` — ${h.priceHint}` : ""}\n${h.url ?? ""}\n${h.snippet}`,
    )
    .join("\n\n");
}
