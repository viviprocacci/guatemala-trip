import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useChatContext } from "../hooks/useChatContext";
import { fetchDeals } from "../services/ai";
import { localFallback } from "../services/chat";

const DEAL_FOCUS = [
  "Acatenango overnight tour",
  "Antigua hotel night 1",
  "La Casa del Mundo",
  "Shuttle Antigua → Lake",
  "Shuttle Lake → Airport",
  "Post-hike spa massage",
];

export function DealsPanel({ aiEnabled }: { aiEnabled: boolean }) {
  const { context, budget } = useChatContext();
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchedWeb, setSearchedWeb] = useState(false);

  const runDeals = async (focus?: string) => {
    if (!context.tripStartDate) {
      setResult("Set your **trip start date** on the Today tab first — deals depend on your dates.");
      return;
    }
    if (!aiEnabled) {
      setResult(localFallback("deals"));
      return;
    }
    if (!budget.canUse) {
      setResult("~$5 search budget used on this device. The meter resets if you clear site data.");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetchDeals(context, focus);
      if (res.costUsd != null || res.usage) {
        budget.recordUsage(
          res.usage ?? { input_tokens: 0, output_tokens: 0 },
          res.costUsd,
        );
      }
      setSearchedWeb(Boolean(res.searchedWeb));
      setResult(res.text);
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deals-panel">
      <p className="deals-intro">
        Web deal scanner for your dates — pulls live prices and where to book.
        {!aiEnabled && " Deploy to Vercel with API keys to enable."}
      </p>

      {!context.tripStartDate && (
        <div className="nudge-card nudge-card--urgent">
          Set trip start date on <strong>Today</strong> before scanning deals.
        </div>
      )}

      <button
        type="button"
        className="btn-primary deals-scan-all"
        onClick={() => runDeals()}
        disabled={loading || !context.tripStartDate}
      >
        <Sparkles size={16} />
        {loading ? "Scanning…" : "Scan all trip bookings"}
      </button>

      <p className="deals-focus-label">Or focus on one:</p>
      <div className="quick-prompts">
        {DEAL_FOCUS.map((f) => (
          <button
            key={f}
            type="button"
            className="quick-btn"
            onClick={() => runDeals(f)}
            disabled={loading}
          >
            <Search size={12} />
            {f}
          </button>
        ))}
      </div>

      {searchedWeb && (
        <p className="deals-web-badge">Live web results included</p>
      )}

      {result && (
        <div className="deals-result msg assistant">{formatMarkdownLite(result)}</div>
      )}
    </div>
  );
}

function formatMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
