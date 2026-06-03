import { useEffect } from "react";
import { DAY_IMAGES } from "../../lib/images";
import { prefetchWeatherForDay } from "../components/WeatherCards";

/** Warm image + weather cache for prev/next days. */
export function useAdjacentDayImages(
  viewDay: number,
  tripDays: number,
  startDate: string | null,
) {
  useEffect(() => {
    const preloadImage = (day: number) => {
      const src = DAY_IMAGES[day as 1 | 2 | 3 | 4 | 5];
      if (!src) return;
      const img = new Image();
      img.src = src;
    };
    if (viewDay > 1) preloadImage(viewDay - 1);
    if (viewDay < tripDays) preloadImage(viewDay + 1);

    if (startDate) {
      if (viewDay > 1) prefetchWeatherForDay(viewDay - 1);
      if (viewDay < tripDays) prefetchWeatherForDay(viewDay + 1);
    }
  }, [viewDay, tripDays, startDate]);
}
