# Guatemala Trip Planner

5-day Antigua → Acatenango → Lake Atitlán app with Today mode, Explore, AI chat, deal hunter, wallet, map, and Spanish phrases.

## Deploy to Vercel (share with friends)

## AI features

| Feature | What it does |
|---------|----------------|
| **Chat** | Context-aware — knows trip day, weather °F, wallet bookings |
| **Deals** | After you set trip dates, scans where to book cheap (web search if Tavily key set) |

API key stays **server-side** on Vercel — not in the phone app bundle.

## Local dev

```bash
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
```

## Offline (no AI)

Itinerary, Today, Explore, Map, Wallet, Español work without API keys. AI needs deployed `/api/*` routes.

## Deal search note

We use **web search API** (Tavily) + Claude — not scraping booking sites directly (they block scrapers and break often). Claude synthesizes results into actionable booking advice.
