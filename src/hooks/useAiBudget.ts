import { useCallback, useEffect, useState } from "react";
import { BUDGET_CAP_USD, estimateCostUsd, type TokenUsage } from "../../lib/ai/types";

const STORAGE_KEY = "guatemala-ai-spent-usd";
const BUDGET_SYNC_EVENT = "guatemala-budget-sync";

function readSpent(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseFloat(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

function writeSpent(value: number) {
  localStorage.setItem(STORAGE_KEY, String(value));
  window.dispatchEvent(new Event(BUDGET_SYNC_EVENT));
}

export function useAiBudget() {
  const [spentUsd, setSpentUsd] = useState(readSpent);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSpentUsd(readSpent());
    setLoaded(true);

    const sync = () => setSpentUsd(readSpent());

    window.addEventListener(BUDGET_SYNC_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BUDGET_SYNC_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const recordUsage = useCallback((usage: TokenUsage, costUsd?: number) => {
    const cost = costUsd ?? estimateCostUsd(usage);
    if (cost <= 0 && usage.input_tokens === 0 && usage.output_tokens === 0) return;

    setSpentUsd((prev) => {
      const next = Math.min(BUDGET_CAP_USD, prev + cost);
      writeSpent(next);
      return next;
    });
  }, []);

  const remainingUsd = Math.max(0, BUDGET_CAP_USD - spentUsd);
  const canUse = remainingUsd > 0.001;
  const percentUsed = Math.min(100, (spentUsd / BUDGET_CAP_USD) * 100);

  const reset = useCallback(() => {
    writeSpent(0);
    setSpentUsd(0);
  }, []);

  return {
    spentUsd,
    remainingUsd,
    canUse,
    percentUsed,
    recordUsage,
    reset,
    loaded,
    capUsd: BUDGET_CAP_USD,
  };
}

/** Format USD for budget display — show extra precision when spend is tiny */
export function formatBudgetUsd(amount: number): string {
  if (amount > 0 && amount < 0.01) return amount.toFixed(4);
  return amount.toFixed(2);
}
