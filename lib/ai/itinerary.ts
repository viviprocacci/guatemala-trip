import { parseExploreResult } from "./exploreResult";
import { buildItineraryPlanPrompt, ITINERARY_PLAN_SYSTEM } from "./prompts";
import { callClaude, getApiKey, getModel } from "./anthropic";
import { gatherSearchSources } from "../providers/sources";
import { estimateCostUsd } from "./types";
import type { ChatContext } from "./types";

export interface ItineraryPlanRequest {
  query?: string;
  context?: ChatContext;
  /** Merge suggestions into specific day 1–5 */
  targetDay?: number;
}

export async function runItineraryPlan(
  req: ItineraryPlanRequest,
  env: Record<string, string | undefined>,
) {
  const apiKey = getApiKey(env);
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured on server");

  const query = req.query?.trim() || "Build my Guatemala trip plan";
  const start = req.context?.tripStartDate ?? "";

  const sources = await gatherSearchSources(
    {
      query,
      type: "general",
      tripStart: start || undefined,
    },
    env,
  );

  const userPrompt = buildItineraryPlanPrompt({
    query,
    tripStart: start || undefined,
    tripDay: req.context?.tripDay,
    tripDayLabel: req.context?.tripDayLabel,
    targetDay: req.targetDay,
    searchBlock: sources.text,
    reservations: req.context?.reservations?.map((r) => r.title),
    weather: req.context?.weather?.map((w) => `${w.label}: ${w.high}°F/${w.low}°F ${w.conditions}`),
    sourcesUsed: sources.sourcesUsed,
  });

  const result = await callClaude(
    apiKey,
    getModel(env),
    ITINERARY_PLAN_SYSTEM,
    [{ role: "user", content: userPrompt }],
    2000,
  );

  const structured = parseExploreResult(result.text);

  return {
    text: result.text,
    structured,
    usage: result.usage,
    costUsd: estimateCostUsd(result.usage),
    searchedWeb: sources.sourcesUsed.exa || sources.sourcesUsed.expedia || sources.sourcesUsed.booking,
    sourcesUsed: sources.sourcesUsed,
  };
}
