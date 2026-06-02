import { useEffect, useState } from "react";
import { Cloud, Droplets, Wind } from "lucide-react";
import type { WeatherForecast } from "../types";
import { fetchWeather, weatherLabel, WEATHER_SPOTS, weatherSpotsForDay } from "../services/weather";

interface WeatherCardsProps {
  tripDay: number | null;
  compact?: boolean;
}

export function WeatherCards({ tripDay, compact }: WeatherCardsProps) {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const spotIds = weatherSpotsForDay(tripDay ?? 1);
    const spots = WEATHER_SPOTS.filter((s) => spotIds.includes(s.id));

    fetchWeather(spots)
      .then((data) => {
        if (!cancelled) setForecasts(data);
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
