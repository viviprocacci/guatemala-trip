import { Zap } from "lucide-react";
import { BUDGET_CAP_USD } from "../../lib/ai/types";
import { formatBudgetUsd } from "../hooks/useAiBudget";

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
  return (
    <div className={`fuel-gauge ${compact ? "fuel-gauge--compact" : ""}`}>
      <div className="fuel-gauge-top">
        <span className="fuel-gauge-label">
          <Zap size={11} />
          Pedro
        </span>
        <span className="fuel-gauge-amount">
          ${formatBudgetUsd(remainingUsd)} left
        </span>
      </div>
      <div className="fuel-gauge-track">
        <div className="fuel-gauge-fill" style={{ width: `${percentUsed}%` }} />
      </div>
      {!compact && (
        <p className="fuel-gauge-hint">
          ${formatBudgetUsd(spentUsd)} used · ${BUDGET_CAP_USD} cap per device
          {webSearch ? " · live web scan on" : ""}
          {" · "}
          <span className="pedro-engine pedro-engine--inline">powered by claude</span>
        </p>
      )}
    </div>
  );
}
