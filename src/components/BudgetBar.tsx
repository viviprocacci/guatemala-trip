import { Droplets } from "lucide-react";
import { BUDGET_CAP_USD } from "../../lib/ai/types";
import { formatBudgetUsd } from "../hooks/useAiBudget";
import { PedroEngineCredit } from "./PedroEngineCredit";

interface BudgetBarProps {
  spentUsd: number;
  remainingUsd: number;
  percentUsed: number;
  webSearch?: boolean;
  compact?: boolean;
}

export function BudgetBar({
  spentUsd,
  remainingUsd,
  percentUsed,
  webSearch,
  compact,
}: BudgetBarProps) {
  const juicePercent = Math.max(0, Math.min(100, 100 - percentUsed));
  const low = juicePercent <= 20;
  const showUsed = spentUsd > 0.01;

  return (
    <div
      className={[
        "pedro-juice",
        compact && "pedro-juice--compact",
        low && "pedro-juice--low",
      ]
        .filter(Boolean)
        .join(" ")}
      role="meter"
      aria-valuenow={Math.round(juicePercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Pedro juice: $${formatBudgetUsd(remainingUsd)} left of $${BUDGET_CAP_USD} limit`}
    >
      <div className="pedro-juice-top">
        <span className="pedro-juice-label">
          <Droplets size={13} strokeWidth={2} className="pedro-juice-icon" />
          Pedro juice
          <span className="pedro-juice-limit">${BUDGET_CAP_USD} limit</span>
        </span>
        <span className="pedro-juice-amount">${formatBudgetUsd(remainingUsd)} left</span>
      </div>
      <div className="pedro-juice-track">
        <div className="pedro-juice-fill" style={{ width: `${juicePercent}%` }} />
      </div>
      {!compact && (
        <p className="pedro-juice-hint">
          {showUsed && <>${formatBudgetUsd(spentUsd)} used</>}
          {showUsed && webSearch && " · "}
          {webSearch && "live web scan on"}
          {(showUsed || webSearch) && " · "}
          <PedroEngineCredit inline />
        </p>
      )}
    </div>
  );
}
