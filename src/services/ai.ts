import type { ChatContext } from "../../lib/ai/types";
import type { ExploreAiStructured } from "../../lib/ai/exploreResult";
import type { SearchType } from "../../lib/ai/search";

export interface AiResponse {
  text: string;
  structured?: ExploreAiStructured | null;
  usage?: import("../../lib/ai/types").TokenUsage;
  costUsd?: number;
  searchedWeb?: boolean;
  sourcesUsed?: {
    exa: boolean;
    expedia: boolean;
    booking: boolean;
    tavily: boolean;
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function checkAiStatus(): Promise<{
  enabled: boolean;
  budgetCapUsd: number;
  webSearch: boolean;
  providers?: {
    claude: boolean;
    exa: boolean;
    expedia: boolean;
    booking: boolean;
    tavily: boolean;
  };
}> {
  try {
    const res = await fetch("/api/status");
    if (!res.ok) return { enabled: false, budgetCapUsd: 5, webSearch: false };
    return res.json();
  } catch {
    return { enabled: false, budgetCapUsd: 5, webSearch: false };
  }
}

export async function sendChatMessage(
  messages: { role: "user" | "assistant"; content: string }[],
  context: ChatContext,
): Promise<AiResponse> {
  return post("/api/chat", { messages, context });
}

export async function exploreSearch(
  query: string,
  type: SearchType,
  context: ChatContext,
  localMatches?: string[],
): Promise<AiResponse> {
  return post("/api/search", { query, type, context, localMatches });
}

export async function buildItineraryPlan(
  context: ChatContext,
  query?: string,
  targetDay?: number,
): Promise<AiResponse> {
  return post("/api/plan", { query, context, targetDay });
}
