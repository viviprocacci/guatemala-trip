import { createContext, useContext, type ReactNode } from "react";
import { useAiBudget } from "../hooks/useAiBudget";

type BudgetState = ReturnType<typeof useAiBudget>;

const BudgetContext = createContext<BudgetState | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const budget = useAiBudget();
  return <BudgetContext.Provider value={budget}>{children}</BudgetContext.Provider>;
}

export function useBudget(): BudgetState {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
