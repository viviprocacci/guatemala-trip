import type { ProviderHit } from "./types";

const EXA_URL = "https://api.exa.ai/search";

export interface ExaSearchOptions {
  query: string;
  numResults?: number;
  type?: "auto" | "fast" | "neural";
  includeDomains?: string[];
  category?: string;
}

export async function exaSearch(
  opts: ExaSearchOptions,
  env: Record<string, string | undefined>,
): Promise<ProviderHit[] | null> {
  const key = env.EXA_API_KEY;
  if (!key) return null;

  const body: Record<string, unknown> = {
    query: opts.query,
    type: opts.type ?? "auto",
    numResults: opts.numResults ?? 8,
    contents: { text: { maxCharacters: 600 } },
  };

  if (opts.includeDomains?.length) {
    body.includeDomains = opts.includeDomains;
  }
  if (opts.category) {
    body.category = opts.category;
  }

  try {
    const res = await fetch(EXA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      results?: {
        title?: string;
        url?: string;
        text?: string;
        highlights?: string[];
      }[];
    };

    if (!data.results?.length) return null;

    return data.results.map((r) => ({
      title: r.title ?? "Result",
      url: r.url,
      snippet: (r.highlights?.[0] ?? r.text ?? "").slice(0, 500),
      source: "exa" as const,
    }));
  } catch {
    return null;
  }
}

export function formatExaHits(hits: ProviderHit[]): string {
  return hits
    .map(
      (h, i) =>
        `[${i + 1}] ${h.title}${h.url ? `\n${h.url}` : ""}\n${h.snippet}${h.priceHint ? `\nPrice hint: ${h.priceHint}` : ""}`,
    )
    .join("\n\n");
}
