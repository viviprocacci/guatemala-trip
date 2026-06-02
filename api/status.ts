/** Zero-deps status check — avoids bundling issues on Vercel. */
export default function handler(
  _req: { method?: string },
  res: {
    status: (code: number) => { json: (body: unknown) => void };
  },
) {
  const key = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  res.status(200).json({
    enabled: Boolean(key),
    budgetCapUsd: 5,
    webSearch: Boolean(process.env.EXA_API_KEY || process.env.TAVILY_API_KEY),
    providers: {
      claude: Boolean(key),
      exa: Boolean(process.env.EXA_API_KEY),
      expedia: Boolean(
        process.env.EXPEDIA_RAPID_API_KEY && process.env.EXPEDIA_RAPID_SECRET,
      ),
      booking: Boolean(
        process.env.BOOKING_DEMAND_API_KEY || process.env.BOOKING_AFFILIATE_ID,
      ),
      tavily: Boolean(process.env.TAVILY_API_KEY),
    },
  });
}
