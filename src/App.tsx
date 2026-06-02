import { useState } from "react";
import {
  Calendar,
  Compass,
  Languages,
  MapPin,
  MessageCircle,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { TabId } from "./types";
import { TodayView } from "./components/TodayView";
import { ExploreView } from "./components/ExploreView";
import { ItineraryView } from "./components/ItineraryView";
import { PhrasesView } from "./components/PhrasesView";
import { TripMap } from "./components/TripMap";
import { WalletView } from "./components/WalletView";
import { AiView } from "./components/AiView";

const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: "today", label: "Today", icon: Sparkles },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "itinerary", label: "Plan", icon: Calendar },
  { id: "phrases", label: "Español", icon: Languages },
  { id: "map", label: "Map", icon: MapPin },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "chat", label: "Finder", icon: MessageCircle },
];

export default function App() {
  const [tab, setTab] = useState<TabId>("today");

  const titles: Record<TabId, string> = {
    today: "Today",
    explore: "Explore",
    itinerary: "Full plan",
    phrases: "Español",
    map: "Map",
    wallet: "Wallet",
    chat: "Finder",
  };

  return (
    <div className="app">
      <header className="app-bar">
        <div>
          <span className="app-bar-eyebrow">Guatemala</span>
          <h1 className="app-bar-title">{titles[tab]}</h1>
        </div>
      </header>

      <main className="main-content">
        {tab === "today" && <TodayView />}
        {tab === "explore" && <ExploreView />}
        {tab === "itinerary" && <ItineraryView />}
        {tab === "phrases" && <PhrasesView />}
        {tab === "map" && <TripMap />}
        {tab === "wallet" && <WalletView />}
        {tab === "chat" && <AiView />}
      </main>

      <nav className="nav" aria-label="Main">
        <div className="nav-inner nav-inner--scroll">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-btn ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
