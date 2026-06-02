import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import type { TabId } from "../types";

interface NavigationContextValue {
  askPedro: (message: string) => void;
  consumePedroSeed: () => string | null;
  setActiveTab: (tab: TabId) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  children,
  setActiveTab,
}: {
  children: ReactNode;
  setActiveTab: (tab: TabId) => void;
}) {
  const pedroSeedRef = useRef<string | null>(null);

  const askPedro = useCallback(
    (message: string) => {
      pedroSeedRef.current = message.trim();
      setActiveTab("chat");
    },
    [setActiveTab],
  );

  const consumePedroSeed = useCallback(() => {
    const seed = pedroSeedRef.current;
    pedroSeedRef.current = null;
    return seed;
  }, []);

  return (
    <NavigationContext.Provider value={{ askPedro, consumePedroSeed, setActiveTab }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}
