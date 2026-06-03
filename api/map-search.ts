import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runMapPlaceSearch } from "../lib/geo/mapPlaceSearch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query } = req.body as { query?: string };
    if (!query?.trim()) {
      return res.status(400).json({ error: "query required" });
    }

    const result = await runMapPlaceSearch(query.trim());
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Map search failed",
    });
  }
}
