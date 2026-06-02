export interface ProviderHit {
  title: string;
  url?: string;
  snippet: string;
  priceHint?: string;
  source: "exa" | "expedia" | "booking" | "tavily";
}

export interface ProviderBundle {
  label: string;
  provider: ProviderHit["source"];
  hits: ProviderHit[];
}

export interface GatherSourcesResult {
  blocks: ProviderBundle[];
  /** Flat text for Claude prompts */
  text: string;
  sourcesUsed: {
    exa: boolean;
    expedia: boolean;
    booking: boolean;
    tavily: boolean;
  };
}

export interface HotelSearchParams {
  query: string;
  checkIn?: string;
  checkOut?: string;
  location?: string;
  occupancy?: number;
}
