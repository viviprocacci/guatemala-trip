import { lazy, Suspense, useState } from "react";
import {
  Calendar,
  Compass,
  Languages,
  MapPin,
  Radar,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { TabId } from "./types";
import { TodayView } from "./components/TodayView";
import { ExploreView } from "./components/ExploreView";
import { ItineraryView } from "./components/ItineraryView";
import { PhrasesView } from "./components/PhrasesView";
import { WalletView } from "./components/WalletView";

const TripMap = lazy(() =>
  import("./components/TripMap").then((m) => ({ default: m.TripMap })),
);
const AiView = lazy(() =>
  import("./components/AiView").then((m) => ({ default: m.AiView })),
);
const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: "today", label: "Today", icon: Sparkles },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "itinerary", label: "Plan", icon: Calendar },
  { id: "phrases", label: "Español", icon: Languages },
  { id: "map", label: "Map", icon: MapPin },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "chat", label: "Scout", icon: Radar },
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
    chat: "Scout",
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
        <Suspense fallback={<p className="tab-loading">Loading…</p>}>
          {tab === "today" && <TodayView />}
          {tab === "explore" && <ExploreView />}
          {tab === "itinerary" && <ItineraryView />}
          {tab === "phrases" && <PhrasesView />}
          {tab === "map" && <TripMap />}
          {tab === "wallet" && <WalletView />}
          {tab === "chat" && <AiView />}
        </Suspense>
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
