import type { GatherSourcesResult, HotelSearchParams } from "./types";
import { gatherBookingHotels } from "./booking";
import { exaSearch, formatExaHits } from "./exa";
import { formatExpediaHits, searchExpediaHotels } from "./expedia";

export async function gatherHotelSources(
  params: HotelSearchParams,
  env: Record<string, string | undefined>,
): Promise<GatherSourcesResult> {
  const blocks: GatherSourcesResult["blocks"] = [];
  const sourcesUsed = { exa: false, expedia: false, booking: false, tavily: false };

  const expediaHits = await searchExpediaHotels(params, env);
  if (expediaHits?.length) {
    sourcesUsed.expedia = true;
    blocks.push({
      label: "Expedia Rapid — live rates",
      provider: "expedia",
      hits: expediaHits,
    });
  }

  const booking = await gatherBookingHotels(params, env);
  if (booking?.hits.length) {
    sourcesUsed.booking = true;
    blocks.push({
      label: "Booking.com",
      provider: "booking",
      hits: booking.hits,
    });
  }

  if (!expediaHits?.length && !booking?.hits.length) {
    const loc = params.location ?? params.query;
    const dates =
      params.checkIn && params.checkOut
        ? ` ${params.checkIn} to ${params.checkOut}`
        : "";
    const exaHits = await exaSearch(
      {
        query: `hotels hostels ${loc} Guatemala${dates} price review`,
        numResults: 8,
        includeDomains: ["booking.com", "hotels.com", "hostelworld.com"],
      },
      env,
    );
    if (exaHits?.length) {
      sourcesUsed.exa = true;
      blocks.push({
        label: "Exa — hotel discovery",
        provider: "exa",
        hits: exaHits,
      });
    }
  }

  const text = blocks
    .map((b) => {
      const body =
        b.provider === "expedia"
          ? formatExpediaHits(b.hits)
          : formatExaHits(b.hits);
      return `### ${b.label}\n${body}`;
    })
    .join("\n\n");

  return { blocks, text, sourcesUsed };
}
