import { Radar } from "lucide-react";
import { useAiEnabled } from "../hooks/useAiEnabled";
import { ChatPanel } from "./ChatPanel";
import { BudgetBar } from "./BudgetBar";
import { useChatContext } from "../hooks/useChatContext";

export function AiView() {
  const { enabled, webSearch } = useAiEnabled();
  const { budget } = useChatContext();

  return (
    <div className="scout-view">
      <header className="wow-hero scout-hero">
        <div className="wow-hero-top">
          <div>
            <span className="wow-hero-eyebrow">Trip intel</span>
            <h2 className="wow-hero-title">Pedro</h2>
            <p className="wow-hero-sub">
              ¡Bienvenidos! I'm Pedro, here to help you make the most of your trip. Ask me anything about Guatemala.
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
          Offline tips only. Add API keys on the server for live answers.
        </div>
      )}

      <ChatPanel aiEnabled={enabled} />
    </div>
  );
}
