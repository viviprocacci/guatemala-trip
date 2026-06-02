export type TabId = "today" | "explore" | "itinerary" | "phrases" | "map" | "wallet" | "chat";

export type ReservationCategory =
  | "flight"
  | "hotel"
  | "tour"
  | "transport"
  | "spa"
  | "other";

export interface Reservation {
  id: string;
  title: string;
  category: ReservationCategory;
  date: string;
  time?: string;
  confirmation?: string;
  location?: string;
  addressEs?: string;
  notes?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Nudge {
  id: string;
  text: string;
  urgency?: "high" | "normal";
}

export interface WeatherSpot {
  id: string;
  label: string;
  lat: number;
  lng: number;
  elevation: number;
}

export interface WeatherForecast {
  spotId: string;
  label: string;
  tempHigh: number;
  tempLow: number;
  weatherCode: number;
  windMax: number;
  precipProb: number;
}

export interface Phrase {
  id: string;
  category: PhraseCategory;
  spanish: string;
  english: string;
}

export type PhraseCategory = "lancha" | "taxi" | "restaurant" | "altitude" | "general";

export interface SavedMapPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  notes?: string;
  address?: string;
  sourceUrl?: string;
  addedAt: string;
}
