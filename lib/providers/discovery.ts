import type { ProviderHit } from "./types";
import { exaSearch, formatExaHits } from "./exa";

export interface DiscoveryParams {
  query: string;
  tripStart?: string;
  location?: string;
}

export async function searchActivities(
  params: DiscoveryParams,
  env: Record<string, string | undefined>,
): Promise<ProviderHit[] | null> {
  const when = params.tripStart ? ` near ${params.tripStart}` : "";
  const where = params.location ? ` in ${params.location}` : " in Guatemala";

  return exaSearch(
    {
      query: `${params.query}${where}${when} tours activities things to do`,
      numResults: 10,
      type: "auto",
    },
    env,
  );
}

export async function gatherDiscovery(
  params: DiscoveryParams,
  env: Record<string, string | undefined>,
): Promise<{ hits: ProviderHit[]; text: string } | null> {
  const hits = await searchActivities(params, env);
  if (!hits?.length) return null;
  return { hits, text: formatExaHits(hits) };
}
