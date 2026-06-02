import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runItineraryPlan } from "../lib/ai/itinerary";
import type { ChatContext } from "../lib/ai/types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query, context, targetDay } = req.body as {
      query?: string;
      context?: ChatContext;
      targetDay?: number;
    };

    const result = await runItineraryPlan({ query, context, targetDay }, process.env);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Itinerary plan failed",
    });
  }
}
