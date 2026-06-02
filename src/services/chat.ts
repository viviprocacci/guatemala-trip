export const QUICK_PROMPTS = [
  { label: "Today", prompt: "What should I focus on today based on my trip day and what's already booked?" },
  { label: "Food & cafés", prompt: "Where should I eat in Antigua or around the lake? Any must-tries?" },
  { label: "Lake day", prompt: "What should I do on a day at Lake Atitlán?" },
  { label: "Hike prep", prompt: "What should I know before Acatenango? Packing, altitude, timing?" },
];

/** Offline fallback when API unavailable */
export function localFallback(userMessage: string): string {
  const q = userMessage.toLowerCase();

  if (/translate|how do i say|cómo se dice|in spanish|español/i.test(q)) {
    return `Use the **Español** tab for offline phrase cards, instant translate, and speak-back.`;
  }

  if (/acatenango|volcano|hike|fuego/i.test(q)) {
    return `**Acatenango tips:**

- Book **Ox Expeditions** or **Wicho & Charlie's**. Skip street touts.
- Layers, gloves, 4L+ water; camp gets cold and windy
- Typical overnight tour ~$50–80 USD`;
  }

  if (/lake|atitl|lancha|boat|casa del mundo/i.test(q)) {
    return `**Lake Atitlán:**

- Kayak, cliff jumps, town-hopping between villages
- Public lanchas are cheap. Last boats ~6–7pm.
- **La Casa del Mundo** is boat-only. Book direct if you're staying there.`;
  }

  if (/food|eat|restaurant|café|cafe/i.test(q)) {
    return `**Eating in Guatemala:**

- Antigua: street tostadas, Rincón Tipico, Café Condesa
- Lake: fresh fish in Panajachel, San Marcos cafés
- Carry cash (quetzales). Many spots don't take cards.`;
  }

  if (/shuttle|transport|airport|gua/i.test(q)) {
    return `**Getting around:**

- Antigua ↔ Lake: GuateGo or hostel desk, ~$25–35
- Lake → GUA Day 5: leave early, 3+ hr buffer before your flight
- Uber/InDrive in Antigua; negotiate tuk-tuks`;
  }

  return `Pedro needs API keys for live chat. **Today**, **Explore**, **Plan**, and **Español** work offline. ¡Pregúntame lo que quieras!`;
}
