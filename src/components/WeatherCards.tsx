import { useEffect, useState } from "react";
import { Cloud, Droplets, Wind } from "lucide-react";
import type { WeatherForecast } from "../types";
import { fetchWeather, weatherLabel, WEATHER_SPOTS, weatherSpotsForDay } from "../services/weather";

const weatherCache = new Map<number, WeatherForecast[]>();

/** Warm cache for upcoming swipes (fire-and-forget). */
export function prefetchWeatherForDay(tripDay: number) {
  if (weatherCache.has(tripDay)) return;
  const spotIds = weatherSpotsForDay(tripDay);
  const spots = WEATHER_SPOTS.filter((s) => spotIds.includes(s.id));
  fetchWeather(spots)
    .then((data) => weatherCache.set(tripDay, data))
    .catch(() => {});
}

interface WeatherCardsProps {
  tripDay: number | null;
  compact?: boolean;
}

function placeholderCards(tripDay: number | null, compact?: boolean) {
  const spotIds = weatherSpotsForDay(tripDay ?? 1);
  const spots = WEATHER_SPOTS.filter((s) => spotIds.includes(s.id));

  return (
    <div
      className={`weather-row weather-row--locked ${compact ? "weather-row--compact" : ""}`}
      aria-label="Weather — set trip start date to load forecast"
    >
      {spots.map((spot) => (
        <article key={spot.id} className="weather-card weather-card--placeholder">
          <span className="weather-card-label">{spot.label}</span>
          <div className="weather-card-temps">
            <strong>—°F</strong>
            <span>—°F</span>
          </div>
          <p className="weather-card-desc">
            <Cloud size={12} strokeWidth={1.5} />
            Set date
          </p>
          <div className="weather-card-meta">
            <span>
              <Wind size={11} /> — mph
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function WeatherCards({ tripDay, compact }: WeatherCardsProps) {
  const cached = tripDay != null ? weatherCache.get(tripDay) : undefined;
  const [forecasts, setForecasts] = useState<WeatherForecast[]>(cached ?? []);
  const [loading, setLoading] = useState(tripDay != null && !cached);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (tripDay == null) {
      setForecasts([]);
      setLoading(false);
      setError(false);
      return;
    }

    const hit = weatherCache.get(tripDay);
    if (hit) {
      setForecasts(hit);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    const spotIds = weatherSpotsForDay(tripDay);
    const spots = WEATHER_SPOTS.filter((s) => spotIds.includes(s.id));

    fetchWeather(spots)
      .then((data) => {
        if (!cancelled) {
          weatherCache.set(tripDay, data);
          setForecasts(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tripDay]);

  if (tripDay == null) {
    return placeholderCards(tripDay, compact);
  }

  if (loading) {
    return <div className="weather-row weather-row--loading">Loading forecast…</div>;
  }

  if (error) {
    return (
      <div className="weather-row weather-row--error">
        Weather unavailable. Check connection.
      </div>
    );
  }

  return (
    <div className={`weather-row ${compact ? "weather-row--compact" : ""}`}>
      {forecasts.map((f) => (
        <article key={f.spotId} className="weather-card">
          <span className="weather-card-label">{f.label}</span>
          <div className="weather-card-temps">
            <strong>{f.tempHigh}°F</strong>
            <span>{f.tempLow}°F</span>
          </div>
          <p className="weather-card-desc">
            <Cloud size={12} strokeWidth={1.5} />
            {weatherLabel(f.weatherCode)}
          </p>
          <div className="weather-card-meta">
            <span>
              <Wind size={11} /> {f.windMax} mph
            </span>
            {f.precipProb > 0 && (
              <span>
                <Droplets size={11} /> {f.precipProb}%
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
