import { useCallback, useEffect, useState } from "react";
import type { SavedMapPin } from "../types";

const STORAGE_KEY = "guatemala-map-pins";

export function useMapPins() {
  const [pins, setPins] = useState<SavedMapPin[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPins(JSON.parse(raw) as SavedMapPin[]);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((next: SavedMapPin[]) => {
    setPins(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addPin = useCallback(
    (pin: Omit<SavedMapPin, "id" | "addedAt">) => {
      const entry: SavedMapPin = {
        ...pin,
        id: crypto.randomUUID(),
        addedAt: new Date().toISOString(),
      };
      persist([entry, ...pins]);
      return entry;
    },
    [pins, persist],
  );

  const removePin = useCallback(
    (id: string) => {
      persist(pins.filter((p) => p.id !== id));
    },
    [pins, persist],
  );

  return { pins, loaded, addPin, removePin };
}
