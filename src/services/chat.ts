export const QUICK_PROMPTS = [
  { label: "🇬🇹 Spanish", prompt: "How do I say 'boat to Santa Cruz' in Spanish?" },
  { label: "🎒 Pack", prompt: "What should I pack for Acatenango overnight?" },
  { label: "🌤️ Today", prompt: "What should I wear today based on my weather and trip day?" },
  { label: "📋 Bookings", prompt: "Summarize what I still need to book based on my saved reservations." },
];

/** Offline fallback when API unavailable */
export function localFallback(userMessage: string): string {
  const q = userMessage.toLowerCase();

  if (/translate|spanish|say|how do i|cómo/i.test(q)) {
    return `**Useful Spanish:**

- *La lancha a Santa Cruz, por favor*
- *¿Cuánto cuesta?*
- *La cuenta, por favor*

Go live on Scout once the app is deployed with API keys.`;
  }

  if (/deal|cheap|price|book/i.test(q)) {
    return `**Deal hunting tips:**

- Acatenango: compare Ox Expeditions, Wicho & Charlie's, GetYourGuide
- Lake hotel: book La Casa del Mundo direct
- Shuttles: GuateGo or hostel desks beat airport rates

Try **Price hunt** on Scout for live scans.`;
  }

  return `Scout needs API keys on the server for live intel. **Today**, **Explore**, and **Plan** work offline.`;
}
