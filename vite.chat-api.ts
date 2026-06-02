import type { Plugin, PreviewServer, ViteDevServer } from "vite";
import { loadEnv } from "vite";
import { runExploreSearch } from "./lib/ai/search";
import { runItineraryPlan } from "./lib/ai/itinerary";
import { runMapPlaceSearch } from "./lib/ai/mapSearch";
import { runTranslate } from "./lib/ai/translate";
import type { ChatContext } from "./lib/ai/types";
import { buildSystemPrompt } from "./lib/ai/prompts";
import { callClaude, getApiKey, getModel } from "./lib/ai/anthropic";
import { estimateCostUsd } from "./lib/ai/types";
import type { SearchType } from "./lib/ai/search";

function readBody(req: import("http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function json(res: import("http").ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function attachApiRoutes(server: ViteDevServer | PreviewServer) {
  const env = loadEnv(server.config.mode, process.cwd(), "");

  server.middlewares.use("/api/status", (_req, res) => {
    json(res, 200, {
      enabled: Boolean(getApiKey(env)),
      budgetCapUsd: 5,
      webSearch: Boolean(env.EXA_API_KEY || env.TAVILY_API_KEY),
      providers: {
        claude: Boolean(getApiKey(env)),
        exa: Boolean(env.EXA_API_KEY),
        expedia: Boolean(env.EXPEDIA_RAPID_API_KEY && env.EXPEDIA_RAPID_SECRET),
        booking: Boolean(env.BOOKING_DEMAND_API_KEY || env.BOOKING_AFFILIATE_ID),
        tavily: Boolean(env.TAVILY_API_KEY),
      },
    });
  });

  server.middlewares.use("/api/chat", async (req, res) => {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    const apiKey = getApiKey(env);
    if (!apiKey) return json(res, 500, { error: "ANTHROPIC_API_KEY not set in .env" });
    try {
      const { messages, context } = JSON.parse(await readBody(req)) as {
        messages: { role: "user" | "assistant"; content: string }[];
        context?: ChatContext;
      };
      const result = await callClaude(apiKey, getModel(env), buildSystemPrompt(context), messages);
      json(res, 200, { text: result.text, usage: result.usage, costUsd: estimateCostUsd(result.usage) });
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : "Failed" });
    }
  });

  server.middlewares.use("/api/search", async (req, res) => {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    try {
      const { query, type, context, localMatches } = JSON.parse(await readBody(req)) as {
        query: string;
        type?: SearchType;
        context?: ChatContext;
        localMatches?: string[];
      };
      if (!query?.trim()) return json(res, 400, { error: "query required" });
      const result = await runExploreSearch({ query, type, context, localMatches }, env);
      json(res, 200, result);
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : "Failed" });
    }
  });

  server.middlewares.use("/api/map-search", async (req, res) => {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    try {
      const { query } = JSON.parse(await readBody(req)) as { query?: string };
      if (!query?.trim()) return json(res, 400, { error: "query required" });
      const result = await runMapPlaceSearch(query.trim(), env);
      json(res, 200, result);
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : "Failed" });
    }
  });

  server.middlewares.use("/api/plan", async (req, res) => {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    try {
      const { query, context, targetDay } = JSON.parse(await readBody(req)) as {
        query?: string;
        context?: ChatContext;
        targetDay?: number;
      };
      const result = await runItineraryPlan({ query, context, targetDay }, env);
      json(res, 200, result);
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : "Failed" });
    }
  });

  server.middlewares.use("/api/translate", async (req, res) => {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    try {
      const { text, from, to, useAi } = JSON.parse(await readBody(req)) as {
        text: string;
        from?: "en" | "es";
        to?: "en" | "es";
        useAi?: boolean;
      };
      if (!text?.trim()) return json(res, 400, { error: "text required" });
      const result = await runTranslate(text, from ?? "en", to ?? "es", Boolean(useAi), env);
      json(res, 200, result);
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : "Translation failed" });
    }
  });

  server.middlewares.use("/api/tts", async (req, res) => {
    if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
    const url = new URL(req.url ?? "", "http://local");
    const text = url.searchParams.get("text")?.trim() ?? "";
    const lang = (url.searchParams.get("lang") ?? "es").slice(0, 10);
    if (!text) return json(res, 400, { error: "text required" });
    try {
      const ttsUrl = new URL("https://translate.googleapis.com/translate_tts");
      ttsUrl.searchParams.set("ie", "UTF-8");
      ttsUrl.searchParams.set("client", "tw-ob");
      ttsUrl.searchParams.set("tl", lang);
      ttsUrl.searchParams.set("q", text.slice(0, 200));
      const upstream = await fetch(ttsUrl.toString(), { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!upstream.ok) return json(res, 502, { error: "TTS upstream failed" });
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.statusCode = 200;
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.end(buffer);
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : "TTS failed" });
    }
  });
}

export function chatApiPlugin(): Plugin {
  return {
    name: "chat-api",
    configureServer(server) {
      attachApiRoutes(server);
    },
    configurePreviewServer(server) {
      attachApiRoutes(server);
    },
  };
}
