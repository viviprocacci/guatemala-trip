export type PlaceCategory =
  | "airport"
  | "city"
  | "hike"
  | "spa"
  | "lake"
  | "activity"
  | "restaurant"
  | "hotel";

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: PlaceCategory;
  day?: number;
  notes?: string;
  address?: string;
}

export interface Activity {
  time?: string;
  text: string;
  rideTo?: { name: string; lat: number; lng: number; address?: string };
}

export interface DayPlan {
  day: number;
  title: string;
  subtitle?: string;
  activities: Activity[];
  tips?: string[];
  stay?: string;
}

export const PACK_LIST = [
  { item: "eSIM (Claro or Tigo)", category: "tech" },
  { item: "Power bank", category: "tech" },
  { item: "Buff / neck gaiter", category: "hike" },
  { item: "Layers, gloves, beanie", category: "hike" },
  { item: "Altitude meds (Diamox)", category: "health" },
  { item: "Dramamine", category: "health" },
  { item: "Cash in Quetzales", category: "essentials" },
  { item: "Padlock for hostel locker", category: "essentials" },
  { item: "Hand warmers", category: "hike" },
  { item: "Wet wipes", category: "essentials" },
  { item: "Toilet paper, disposable funnels", category: "essentials" },
  { item: "4L+ water for Acatenango", category: "hike" },
  { item: "Snacks for hike", category: "hike" },
  { item: "Motion sickness meds", category: "health" },
];

export const ACATENANGO_PACK = [
  "Layers, gloves, beanie, buff/neck gaiter",
  "Power bank, snacks, cash in Quetzales",
  "Altitude/motion sickness meds (Diamox/Dramamine)",
  "Hand warmers. Sleep with clothes on at camp",
  "At least 4L water, breaks on ascent",
];

export const PLACES: Place[] = [
  {
    id: "gua",
    name: "Guatemala City Airport (GUA)",
    lat: 14.5833,
    lng: -90.5275,
    category: "airport",
    notes: "Land early Day 1; fly home Day 5. Allow 3+ hrs to airport",
  },
  {
    id: "antigua",
    name: "Antigua",
    lat: 14.5586,
    lng: -90.7344,
    category: "city",
    day: 1,
    notes: "Base hotel/hostel, ruins, coffee, market, free walking tours",
  },
  {
    id: "la-soledad",
    name: "La Soledad (Acatenango trailhead)",
    lat: 14.519,
    lng: -90.875,
    category: "hike",
    day: 2,
    notes: "~1.5 hr shuttle from Antigua. Book: GetYourGuide, Wicho & Charlie's, Ox Expeditions",
  },
  {
    id: "acatenango-camp",
    name: "Acatenango high camp",
    lat: 14.501,
    lng: -90.876,
    category: "hike",
    day: 2,
    notes: "~3,900m. Watch Fuego erupt at sunset. Very cold & windy.",
  },
  {
    id: "el-descanso",
    name: "El Descanso Spa",
    lat: 14.556,
    lng: -90.731,
    category: "spa",
    day: 3,
    notes: "5.0★ post-Acatenango massage. Book ahead",
  },
  {
    id: "yspa",
    name: "Y'SPA Antigua",
    lat: 14.557,
    lng: -90.733,
    category: "spa",
    day: 3,
    notes: "4.9★, showers on site",
  },
  {
    id: "atitlan",
    name: "Lake Atitlán",
    lat: 14.72,
    lng: -91.21,
    category: "lake",
    day: 3,
    notes: "~2.5 hr bumpy shuttle from Antigua",
  },
  {
    id: "santa-cruz",
    name: "Santa Cruz la Laguna",
    lat: 14.746,
    lng: -91.205,
    category: "lake",
    day: 3,
    notes: "Lancha only. Last boats ~6–7pm",
  },
  {
    id: "casa-mundo",
    name: "La Casa del Mundo",
    lat: 14.748,
    lng: -91.198,
    category: "hotel",
    day: 3,
    notes: "Boat access only. 2 nights. ~40 ft cliff jump on property",
  },
  {
    id: "san-marcos",
    name: "San Marcos la Laguna",
    lat: 14.723,
    lng: -91.258,
    category: "city",
    day: 4,
    notes: "Lancha hop for lunch & wander",
  },
  {
    id: "san-pedro",
    name: "San Pedro la Laguna",
    lat: 14.692,
    lng: -91.272,
    category: "city",
    day: 4,
  },
  {
    id: "tzankujil",
    name: "Cerro Tzankujil Nature Reserve",
    lat: 14.726,
    lng: -91.255,
    category: "activity",
    day: 4,
    notes: "~40 ft cliff jump, lifeguard, Q15 entry, arrive before 4pm",
  },
  {
    id: "por-que-no",
    name: "Por Qué No? (Antigua)",
    lat: 14.5565,
    lng: -90.732,
    category: "restaurant",
    notes: "Ask to sit upstairs",
  },
  {
    id: "cafe-no-se",
    name: "Café no sé (Antigua)",
    lat: 14.5558,
    lng: -90.7315,
    category: "restaurant",
    notes: "Bar lit with candles only",
  },
];

export const DAYS: DayPlan[] = [
  {
    day: 1,
    title: "Antigua · Arrive & Acclimatize",
    subtitle: "Land GUA early",
    stay: "Antigua base hotel or hostel",
    activities: [
      { time: "Morning", text: "Land GUA early, shuttle to Antigua (~45 min)", rideTo: { name: "Antigua", lat: 14.5586, lng: -90.7344, address: "Antigua Guatemala, Sacatepéquez, Guatemala" } },
      { text: "Check in, drop bags, get your bearings" },
      { text: "Walk the city: ruins, coffee, market, good dinner" },
      { text: "Free walking tours" },
      { text: "Sleep early. Big hike tomorrow" },
      { text: "Pack Acatenango bag tonight" },
    ],
    tips: [
      "Pack layers, gloves, beanie, buff, power bank, snacks, Q cash, altitude meds",
    ],
  },
  {
    day: 2,
    title: "Acatenango · Ascent",
    subtitle: "Overnight on the volcano",
    activities: [
      { time: "Early", text: "Shuttle to La Soledad base (~1.5 hrs)", rideTo: { name: "La Soledad trailhead", lat: 14.519, lng: -90.875, address: "La Soledad, Acatenango, Chimaltenango, Guatemala" } },
      { text: "4–6 hr ascent to high camp (~3,900m). Steep, dusty, very windy" },
      { text: "Volcanic dust is intense. Bring buff/gaiter" },
      { text: "Altitude is rough. 4L+ water, take breaks" },
      { time: "Evening", text: "Watch Volcán de Fuego erupt at sunset and through the night" },
      { text: "Super cold at camp. All layers, sleep in clothes, hand warmers" },
    ],
    tips: [
      "Optional summit/Fuego hike next morning: ~7 km, ~4 hrs",
    ],
  },
  {
    day: 3,
    title: "Acatenango descent · Recovery · Lake",
    subtitle: "Off mountain by ~10am",
    stay: "La Casa del Mundo (2 nights)",
    activities: [
      { time: "Dawn", text: "Optional sunrise summit push" },
      { time: "Mid-morning", text: "Descend. Aim off mountain by 10am" },
      { text: "Full body massage in Antigua (El Descanso or Y'SPA)" },
      { text: "Big meal, rehydrate, shower" },
      { time: "Afternoon", text: "Shuttle to Lake Atitlán (~2.5 hrs, bumpy)", rideTo: { name: "Panajachel / Lake Atitlán", lat: 14.741, lng: -91.158, address: "Panajachel, Sololá, Guatemala" } },
      { text: "Lancha to Santa Cruz, check into La Casa del Mundo", rideTo: { name: "La Casa del Mundo", lat: 14.748, lng: -91.198, address: "Santa Cruz La Laguna, Sololá, Guatemala" } },
    ],
    tips: ["Last lanchas run around 6–7pm"],
  },
  {
    day: 4,
    title: "Lake Atitlán · Full Lake Day",
    activities: [
      { time: "Morning", text: "Kayaking or guided bass fishing from the lake. Go early before wind." },
      { text: "Cliff jump at La Casa del Mundo (~40 ft)" },
      { text: "Lancha to San Marcos or San Pedro, lunch & explore" },
      { text: "Cerro Tzankujil: cliff jump with volcano backdrop (Q15, before 4pm)" },
      { time: "Evening", text: "Kayak or lancha back for sunset on the terrace" },
    ],
  },
  {
    day: 5,
    title: "Morning Lake · Fly Home",
    activities: [
      { text: "Slow breakfast with volcano views" },
      { time: "Midday", text: "Shuttle back to Guatemala City", rideTo: { name: "GUA Airport", lat: 14.5833, lng: -90.5275, address: "Aeropuerto La Aurora, Guatemala City, Guatemala" } },
      { text: "Evening flight from GUA. 3+ hr buffer for slow roads" },
    ],
  },
];

export const EXTRA_IDEAS = [
  "Semuc Champey natural pools",
  "Chichicastenango market (Thu/Sun)",
  "Chocolate making class in Antigua",
  "Café no sé, candlelit bar",
  "Monterrico surf lessons",
  "Xela volcano town",
  "Vintage clothes shopping in Antigua",
];

export const TRIP_CONTEXT = `
You are a helpful travel assistant for a 5-day Guatemala trip.

ITINERARY:
Day 1: Antigua — arrive from GUA, acclimatize, pack for hike
Day 2-3: Acatenango overnight — La Soledad base, high camp ~3900m, watch Fuego erupt, optional summit at dawn, descend by 10am Day 3
Day 3 PM: Massage in Antigua, shuttle to Lake Atitlán, La Casa del Mundo (boat only, last lanchas 6-7pm)
Day 4: Kayaking/fishing, cliff jumps, San Marcos/San Pedro, Cerro Tzankujil
Day 5: Breakfast at lake, shuttle to GUA with 3+ hr buffer

PACK LIST: eSIM, power bank, buff, layers/gloves/beanie, Diamox, Dramamine, Q cash, padlock, hand warmers, wet wipes, 4L+ water for hike

WEATHER (general): Antigua dry season Nov-Apr (warm days, cool nights). Acatenango camp near freezing at night, very windy. Lake Atitlán mornings calmer, windy afternoons. Rainy season May-Oct.

TRANSLATION: Help with Spanish phrases useful in Guatemala (formal/informal as appropriate). Common: "¿Cuánto cuesta?" (How much?), "La lancha a Santa Cruz" (boat to Santa Cruz), "¿Dónde está...?" (Where is...?), "Gracias", "Por favor", "La cuenta, por favor" (check please).

Be concise, practical, and safety-aware for altitude and boat schedules.
`.trim();
