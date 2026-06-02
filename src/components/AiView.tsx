import { useState } from "react";
import { useAiEnabled } from "../hooks/useAiEnabled";
import { ChatPanel } from "./ChatPanel";
import { DealsPanel } from "./DealsPanel";
import { BudgetBar } from "./BudgetBar";
import { useChatContext } from "../hooks/useChatContext";

type AiMode = "chat" | "deals";

export function AiView() {
  const [mode, setMode] = useState<AiMode>("chat");
  const { enabled, webSearch } = useAiEnabled();
  const { budget } = useChatContext();

  return (
    <div className="ai-view">
      <BudgetBar
        spentUsd={budget.spentUsd}
        remainingUsd={budget.remainingUsd}
        percentUsed={budget.percentUsed}
        webSearch={webSearch}
        onReset={budget.reset}
      />

      {!enabled && (
        <div className="nudge-card">
          Live search runs on the server after Vercel deploy. Add <code>ANTHROPIC_API_KEY</code> in Vercel env
          vars — never share the key in the app URL.
        </div>
      )}

      <div className="ai-mode-tabs">
        <button
          type="button"
          className={`phrase-tab ${mode === "chat" ? "active" : ""}`}
          onClick={() => setMode("chat")}
        >
          Chat
        </button>
        <button
          type="button"
          className={`phrase-tab ${mode === "deals" ? "active" : ""}`}
          onClick={() => setMode("deals")}
        >
          Deals
        </button>
      </div>

      {mode === "chat" ? (
        <ChatPanel aiEnabled={enabled} />
      ) : (
        <DealsPanel aiEnabled={enabled} />
      )}
    </div>
  );
}
