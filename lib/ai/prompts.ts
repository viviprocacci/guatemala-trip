import { TRIP_CONTEXT } from "./tripContext";
import type { ChatContext } from "./types";

export function buildSystemPrompt(ctx?: ChatContext): string {
  const parts = [TRIP_CONTEXT];

  if (ctx?.tripStartDate) {
    parts.push(`\nUSER TRIP START DATE: ${ctx.tripStartDate}`);
  }
  if (ctx?.tripDayLabel) {
    parts.push(`CURRENT TRIP STATUS: ${ctx.tripDayLabel}${ctx.tripDay != null ? ` (day index ${ctx.tripDay})` : ""}`);
  }
  if (ctx?.weather?.length) {
    parts.push(
      `\nLIVE WEATHER (today, °F):\n${ctx.weather
        .map((w) => `- ${w.label}: ${w.high}°F / ${w.low}°F, ${w.conditions}`)
        .join("\n")}`,
    );
  }
  if (ctx?.reservations?.length) {
    parts.push(
      `\nUSER BOOKINGS:\n${ctx.reservations
        .map(
          (r) =>
            `- ${r.title} (${r.category})${r.date ? ` on ${r.date}` : ""}${r.confirmation ? ` conf ${r.confirmation}` : ""}${r.location ? ` @ ${r.location}` : ""}`,
        )
        .join("\n")}`,
    );
  } else {
    parts.push("\nUSER BOOKINGS: none saved yet.");
  }
  if (ctx?.budgetRemainingUsd != null) {
    parts.push(
      `\nAI BUDGET: ~$${ctx.budgetRemainingUsd.toFixed(2)} remaining of $5 app allowance. Be concise.`,
    );
  }

  parts.push(
    "\nUse this context for personalized answers. Reference their actual day, weather, and bookings when relevant.",
    "Never translate. Redirect to the Español tab. Focus on who to book with, what's local, and on-the-ground tips.",
  );

  return parts.join("");
}

export const EXPLORE_SEARCH_SYSTEM = `You are Pedro, a Guatemala travel search assistant. You synthesize live provider data into actionable picks.

DATA SOURCES (when provided):
- Expedia Rapid → live hotel rates
- Booking.com → hotel options
- Exa → open-ended activity/discovery results

RULES:
- Prefer real URLs and prices from provider blocks; do not invent rates
- For HOTELS: cite Expedia/Booking data first
- For ACTIVITIES: cite Exa discovery results
- Max 5 items. Be honest if data is thin.
- Trip context: 5-day route Antigua → Acatenango → Lake Atitlán when relevant.

OUTPUT: Reply with ONLY raw JSON — no markdown, no code fences, no text before or after:
{
  "title": "Short headline for the search",
  "intro": "1-2 sentence overview",
  "items": [
    {
      "name": "Operator or place name",
      "price": "$X–Y/day or /night",
      "group": "Optional section label e.g. SALTWATER or BUDGET HOTELS",
      "links": [{"label": "site.com", "url": "https://..."}],
      "book": "Plain-text booking note if no URL",
      "why": "One line why it's worth it",
      "highlight": "Optional badge e.g. Best Budget Match"
    }
  ],
  "footer": "Optional reality check or timing tip"
}`;

export const ITINERARY_PLAN_SYSTEM = `You are Pedro, a Guatemala trip planner. You merge live hotel data (Expedia Rapid, Booking.com) and Exa activity discovery into a coherent itinerary.

RULES:
- Output JSON only (same schema as search results) with items that can be added to the trip
- Group items by day when possible using the "group" field ("Day 1", "Day 2", etc.)
- Respect existing bookings and current trip day
- Include mix of must-do and optional activities
- Hotels: prefer live Expedia/Booking prices when in provider data
- Activities: prefer Exa discovery results
- Max 8 items for a full plan refresh; fewer if query is narrow

OUTPUT: Same JSON schema as explore search (title, intro, items[], footer).`;

export function buildExploreSearchPrompt(opts: {
  query: string;
  type: string;
  tripStart?: string;
  tripEnd?: string;
  searchBlock: string | null;
  localMatches?: string[];
  reservations?: string[];
  sourcesUsed?: { exa: boolean; expedia: boolean; booking: boolean; tavily: boolean };
}): string {
  const lines = [
    `Search query: "${opts.query}"`,
    `Search type: ${opts.type}`,
  ];
  if (opts.tripStart) lines.push(`Trip dates: ${opts.tripStart} to ${opts.tripEnd ?? "?"}`);
  if (opts.localMatches?.length) {
    lines.push(`Curated app matches: ${opts.localMatches.join("; ")}`);
  }
  if (opts.reservations?.length) {
    lines.push(`Already booked: ${opts.reservations.join(", ")}`);
  }
  if (opts.sourcesUsed) {
    const active = [
      opts.sourcesUsed.expedia && "Expedia Rapid",
      opts.sourcesUsed.booking && "Booking.com",
      opts.sourcesUsed.exa && "Exa",
      opts.sourcesUsed.tavily && "Tavily",
    ].filter(Boolean);
    if (active.length) lines.push(`Live sources: ${active.join(", ")}`);
  }
  lines.push(
    opts.searchBlock
      ? `PROVIDER RESULTS:\n${opts.searchBlock}`
      : "No live provider data — use known Guatemala pricing and name sites to check.",
  );
  lines.push("Return JSON only with title, intro, items array, and optional footer.");
  return lines.join("\n\n");
}

export function buildItineraryPlanPrompt(opts: {
  query: string;
  tripStart?: string;
  tripDay?: number | null;
  tripDayLabel?: string;
  targetDay?: number;
  searchBlock: string | null;
  reservations?: string[];
  weather?: string[];
  sourcesUsed?: { exa: boolean; expedia: boolean; booking: boolean; tavily: boolean };
}): string {
  const lines = [`Plan request: "${opts.query}"`];
  if (opts.tripStart) lines.push(`Trip start: ${opts.tripStart}`);
  if (opts.tripDayLabel) lines.push(`Current status: ${opts.tripDayLabel}`);
  if (opts.targetDay) lines.push(`Focus additions on Day ${opts.targetDay}`);
  if (opts.reservations?.length) lines.push(`Already booked: ${opts.reservations.join(", ")}`);
  if (opts.weather?.length) lines.push(`Weather:\n${opts.weather.join("\n")}`);
  if (opts.sourcesUsed) {
    const active = [
      opts.sourcesUsed.expedia && "Expedia Rapid (hotels)",
      opts.sourcesUsed.booking && "Booking.com (hotels)",
      opts.sourcesUsed.exa && "Exa (discovery)",
    ].filter(Boolean);
    if (active.length) lines.push(`Providers: ${active.join(", ")}`);
  }
  lines.push(
    opts.searchBlock
      ? `PROVIDER RESULTS:\n${opts.searchBlock}`
      : "No live providers — suggest from known Guatemala trip knowledge.",
  );
  lines.push("Return JSON itinerary suggestions (title, intro, items with group=Day N, footer).");
  return lines.join("\n\n");
}
