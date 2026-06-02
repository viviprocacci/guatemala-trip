import type { HotelSearchParams, ProviderHit } from "./types";
import { exaSearch, formatExaHits } from "./exa";

/** Booking.com Demand API — requires partner credentials */
export async function searchBookingDemandApi(
  params: HotelSearchParams,
  env: Record<string, string | undefined>,
): Promise<ProviderHit[] | null> {
  const key = env.BOOKING_DEMAND_API_KEY;
  if (!key) return null;

  // Demand API v3 is partner-gated; wire your endpoint when approved.
  // Fallback: Exa scoped to booking.com below.
  void params;
  void key;
  return null;
}

/** Affiliate deep link when BOOKING_AFFILIATE_ID is set */
export function bookingSearchUrl(params: HotelSearchParams, env: Record<string, string | undefined>): string | null {
  const aid = env.BOOKING_AFFILIATE_ID;
  if (!aid) return null;

  const dest = encodeURIComponent(params.location ?? params.query);
  const qs = new URLSearchParams({
    ss: params.location ?? params.query,
    aid,
    lang: "en-us",
    sb: "1",
  });
  if (params.checkIn) qs.set("checkin", params.checkIn);
  if (params.checkOut) qs.set("checkout", params.checkOut);

  return `https://www.booking.com/searchresults.html?${qs}&ss=${dest}`;
}

/** Exa search limited to booking.com when Demand API unavailable */
export async function searchBookingViaExa(
  params: HotelSearchParams,
  env: Record<string, string | undefined>,
): Promise<ProviderHit[] | null> {
  const loc = params.location ?? params.query;
  const dates =
    params.checkIn && params.checkOut
      ? ` ${params.checkIn} to ${params.checkOut}`
      : "";

  const hits = await exaSearch(
    {
      query: `hotels ${loc} Guatemala${dates} price booking`,
      includeDomains: ["booking.com"],
      numResults: 6,
    },
    env,
  );

  if (!hits?.length) return null;

  const affiliate = bookingSearchUrl(params, env);
  if (affiliate && hits[0]) {
    hits[0] = { ...hits[0], url: affiliate };
  }

  return hits;
}

export async function gatherBookingHotels(
  params: HotelSearchParams,
  env: Record<string, string | undefined>,
): Promise<{ hits: ProviderHit[]; text: string } | null> {
  const demand = await searchBookingDemandApi(params, env);
  if (demand?.length) {
    return {
      hits: demand,
      text: demand
        .map((h, i) => `[${i + 1}] ${h.title} (Booking.com)\n${h.url ?? ""}\n${h.snippet}`)
        .join("\n\n"),
    };
  }

  const exaHits = await searchBookingViaExa(params, env);
  if (!exaHits?.length) return null;

  return { hits: exaHits.map((h) => ({ ...h, source: "booking" as const })), text: formatExaHits(exaHits) };
}
