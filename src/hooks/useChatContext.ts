import { useEffect, useState } from "react";
import type { ChatContext } from "../../lib/ai/types";
import { fetchWeather, weatherLabel, WEATHER_SPOTS, weatherSpotsForDay } from "../services/weather";
import { tripDayLabel } from "../utils/tripDay";
import { useBudget } from "../contexts/BudgetContext";
import { useReservations } from "./useReservations";
import { useTripStart } from "./useTripStart";

export function useChatContext(): {
  context: ChatContext;
  ready: boolean;
  budget: ReturnType<typeof useBudget>;
} {
  const { startDate, tripDay, loaded: tripLoaded } = useTripStart();
  const { reservations, loaded: resLoaded } = useReservations();
  const budget = useBudget();
  const [weather, setWeather] = useState<ChatContext["weather"]>([]);

  useEffect(() => {
    const day = tripDay ?? 1;
    const spots = WEATHER_SPOTS.filter((s) => weatherSpotsForDay(day).includes(s.id));
    fetchWeather(spots)
      .then((data) =>
        setWeather(
          data.map((w) => ({
            label: w.label,
            high: w.tempHigh,
            low: w.tempLow,
            conditions: weatherLabel(w.weatherCode),
          })),
        ),
      )
      .catch(() => setWeather([]));
  }, [tripDay]);

  const context: ChatContext = {
    tripStartDate: startDate,
    tripDay,
    tripDayLabel: tripDayLabel(tripDay),
    weather,
    reservations: reservations.map((r) => ({
      title: r.title,
      category: r.category,
      date: r.date,
      confirmation: r.confirmation,
      location: r.location,
    })),
    budgetRemainingUsd: budget.remainingUsd,
  };

  return {
    context,
    ready: tripLoaded && resLoaded && budget.loaded,
    budget,
  };
}
