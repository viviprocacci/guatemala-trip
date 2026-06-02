import { useAiEnabled } from "../hooks/useAiEnabled";
import { ChatPanel } from "./ChatPanel";
import { BudgetBar } from "./BudgetBar";
import { PedroEngineCredit } from "./PedroEngineCredit";
import { useChatContext } from "../hooks/useChatContext";

export function AiView() {
  const { enabled, webSearch } = useAiEnabled();
  const { budget } = useChatContext();

  return (
    <div className="scout-view">
      <header className="wow-hero scout-hero">
        <div className="wow-hero-top">
          <div>
            <h2 className="wow-hero-title">Pedro</h2>
            <p className="wow-hero-tagline">Your travel companion</p>
          </div>
          <PedroEngineCredit className="pedro-engine--side" />
        </div>
        <p className="wow-hero-sub">
          ¡Bienvenidos! I'm here to help you make the most of your trip. Ask me anything about Guatemala.
        </p>
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
          Pedro works offline with saved tips. Add keys on the server for live chat.
        </div>
      )}

      <ChatPanel aiEnabled={enabled} />
    </div>
  );
}
