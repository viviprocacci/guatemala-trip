import { useState } from "react";
import { MessageCircle, Radar, Tag } from "lucide-react";
import { useAiEnabled } from "../hooks/useAiEnabled";
import { ChatPanel } from "./ChatPanel";
import { DealsPanel } from "./DealsPanel";
import { BudgetBar } from "./BudgetBar";
import { useChatContext } from "../hooks/useChatContext";

type ScoutMode = "ask" | "hunt";

export function AiView() {
  const [mode, setMode] = useState<ScoutMode>("ask");
  const { enabled, webSearch } = useAiEnabled();
  const { budget } = useChatContext();

  return (
    <div className="scout-view">
      <header className="wow-hero scout-hero">
        <div className="wow-hero-top">
          <div>
            <span className="wow-hero-eyebrow">Trip intel</span>
            <h2 className="wow-hero-title">Scout</h2>
            <p className="wow-hero-sub">
              Knows your day, weather & bookings — ask anything or hunt live prices.
            </p>
          </div>
          <Radar size={28} strokeWidth={1.25} className="wow-hero-icon" aria-hidden />
        </div>
        <BudgetBar
          spentUsd={budget.spentUsd}
          remainingUsd={budget.remainingUsd}
          percentUsed={budget.percentUsed}
          webSearch={webSearch}
          compact
        />
      </header>

      {!enabled && (
        <div className="scout-offline-banner">
          Offline tips only — deploy with API keys for live intel.
        </div>
      )}

      <div className="scout-mode-tabs">
        <button
          type="button"
          className={`scout-mode-tab ${mode === "ask" ? "active" : ""}`}
          onClick={() => setMode("ask")}
        >
          <MessageCircle size={15} />
          Ask Scout
        </button>
        <button
          type="button"
          className={`scout-mode-tab ${mode === "hunt" ? "active" : ""}`}
          onClick={() => setMode("hunt")}
        >
          <Tag size={15} />
          Price hunt
        </button>
      </div>

      {mode === "ask" ? (
        <ChatPanel aiEnabled={enabled} />
      ) : (
        <DealsPanel aiEnabled={enabled} />
      )}
    </div>
  );
}
