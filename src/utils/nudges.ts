import type { Nudge } from "../types";

/** Contextual nudges based on trip day and time of day (0–23) */
export function getNudges(tripDay: number, hour: number): Nudge[] {
  const nudges: Nudge[] = [];

  if (tripDay === 0) {
    nudges.push({
      id: "pre-trip",
      text: "Trip hasn't started yet. Review your pack list and confirm Acatenango booking.",
    });
    return nudges;
  }

  if (tripDay > 5) {
    nudges.push({ id: "post-trip", text: "Safe travels home. Hope Guatemala was incredible." });
    return nudges;
  }

  switch (tripDay) {
    case 1:
      if (hour >= 18) {
        nudges.push({
          id: "d1-pack",
          text: "Pack your Acatenango bag tonight: layers, 4L+ water, hand warmers, buff.",
          urgency: "high",
        });
      }
      if (hour >= 20) {
        nudges.push({
          id: "d1-sleep",
          text: "Sleep early. Big hike tomorrow. Set alarm for shuttle.",
          urgency: "high",
        });
      }
      break;
    case 2:
      nudges.push({
        id: "d2-water",
        text: "Altitude day. Sip water constantly. Buff over mouth for volcanic dust.",
        urgency: "high",
      });
      if (hour >= 16) {
        nudges.push({
          id: "d2-cold",
          text: "Camp tonight is near freezing. Sleep in all layers + hand warmers.",
          urgency: "high",
        });
      }
      break;
    case 3:
      if (hour < 10) {
        nudges.push({
          id: "d3-descend",
          text: "Aim to be off the mountain by 10am, then massage & rehydrate in Antigua.",
        });
      }
      if (hour >= 14) {
        nudges.push({
          id: "d3-lancha",
          text: "Last lanchas run ~6–7pm. Don't miss the boat to La Casa del Mundo.",
          urgency: "high",
        });
      }
      break;
    case 4:
      if (hour < 10) {
        nudges.push({
          id: "d4-morning",
          text: "Kayak or fish early. Lake gets windy by afternoon.",
        });
      }
      if (hour >= 12 && hour < 16) {
        nudges.push({
          id: "d4-tzankujil",
          text: "Cerro Tzankujil closes around 4pm. Q15 entry, cliff jump with volcano views.",
        });
      }
      break;
    case 5:
      if (hour < 12) {
        nudges.push({
          id: "d5-leave",
          text: "Leave the lake by midday. 3+ hours to GUA for your evening flight.",
          urgency: "high",
        });
      }
      nudges.push({
        id: "d5-buffer",
        text: "Bumpy roads. Build in extra buffer to the airport.",
        urgency: hour >= 14 ? "high" : "normal",
      });
      break;
  }

  return nudges;
}
