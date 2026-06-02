import { useState } from "react";
import { Radar, Sparkles, Target } from "lucide-react";
import { useChatContext } from "../hooks/useChatContext";
import { fetchDeals } from "../services/ai";
import { localFallback } from "../services/chat";

const DEAL_FOCUS = [
  "Acatenango overnight",
  "Antigua night 1 hotel",
  "La Casa del Mundo",
  "Shuttle Antigua → Lake",
  "Shuttle Lake → Airport",
  "Post-hike spa",
];

export function DealsPanel({ aiEnabled }: { aiEnabled: boolean }) {
  const { context, budget } = useChatContext();
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchedWeb, setSearchedWeb] = useState(false);

  const runDeals = async (focus?: string) => {
    if (!context.tripStartDate) {
      setResult("Set your **trip start date** on Today first — price hunts need your dates.");
      return;
    }
    if (!aiEnabled) {
      setResult(localFallback("deals"));
      return;
    }
    if (!budget.canUse) {
      setResult("Scout fuel's empty on this device. Clear site data to reset the meter.");
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
      setResult(`Hunt failed — ${e instanceof Error ? e.message : "try again"}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deals-panel">
      <p className="deals-intro">
        Live price hunt for your exact dates — operators, hotels, shuttles, and where to book.
      </p>

      {!context.tripStartDate && (
        <div className="nudge-card nudge-card--urgent">
          Set trip start on <strong>Today</strong> to unlock price hunts.
        </div>
      )}

      <button
        type="button"
        className="btn-scan deals-scan-all"
        onClick={() => runDeals()}
        disabled={loading || !context.tripStartDate}
      >
        {loading ? (
          <>
            <Radar size={16} className="spin" />
            Hunting prices…
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Hunt all trip bookings
          </>
        )}
      </button>

      <p className="deals-focus-label">Or zero in on one:</p>
      <div className="quick-prompts">
        {DEAL_FOCUS.map((f) => (
          <button
            key={f}
            type="button"
            className="quick-btn"
            onClick={() => runDeals(f)}
            disabled={loading}
          >
            <Target size={12} />
            {f}
          </button>
        ))}
      </div>

      {searchedWeb && (
        <span className="intel-badge">
          <Radar size={10} /> Live intel
        </span>
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
