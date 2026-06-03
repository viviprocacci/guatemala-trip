import { Calendar, Car, ChevronRight, MapPin, RotateCcw } from "lucide-react";
import { DAYS } from "../data/trip";
import { useTripStart } from "../hooks/useTripStart";
import { inDriveUrl, uberUrl } from "../utils/links";
import { getNudges } from "../utils/nudges";
import { tripDayLabel } from "../utils/tripDay";
import { ActivityRow } from "./ActivityRow";
import { WeatherCards } from "./WeatherCards";

export function TodayView() {
  const { startDate, setStartDate, resetStartDate, tripDay, loaded } = useTripStart();
  const hour = new Date().getHours();

  if (!loaded) return null;

  const effectiveDay = tripDay !== null && tripDay >= 1 && tripDay <= 5 ? tripDay : 1;
  const plan = DAYS.find((d) => d.day === effectiveDay) ?? DAYS[0];
  const nudges =
    tripDay !== null
      ? getNudges(tripDay, hour)
      : [{ id: "set-date", text: "Set your trip start date above to unlock day-specific nudges & weather.", urgency: "normal" as const }];

  const nextActivity = plan.activities.find((a) => {
    if (!a.time) return true;
    const t = a.time.toLowerCase();
    if (hour < 12 && (t.includes("morning") || t.includes("early") || t.includes("dawn"))) return true;
    if (hour >= 12 && hour < 17 && (t.includes("afternoon") || t.includes("mid"))) return true;
    if (hour >= 17 && t.includes("evening")) return true;
    return false;
  }) ?? plan.activities[0];

  return (
    <div className="today-view">
      <section className="today-hero">
        <div className="today-hero-top">
          <div>
            <span className="today-eyebrow">{tripDayLabel(tripDay)}</span>
            <h2 className="today-title">{plan.title}</h2>
            {plan.subtitle && <p className="today-subtitle">{plan.subtitle}</p>}
          </div>
          <div className="today-date-actions">
            <label className="today-date-picker">
              <Calendar size={14} strokeWidth={1.5} />
              <input
                type="date"
                value={startDate ?? ""}
                onChange={(e) => e.target.value && setStartDate(e.target.value)}
                aria-label="Trip start date"
              />
            </label>
            {startDate && (
              <button
                type="button"
                className="today-reset-btn"
                onClick={resetStartDate}
                aria-label="Reset trip start date"
              >
                <RotateCcw size={14} strokeWidth={1.5} />
                Reset
              </button>
            )}
          </div>
        </div>

        {nextActivity && (
          <div className="next-up-card">
            <span className="next-up-label">Next up</span>
            <p className="next-up-text">
              {nextActivity.time && (
                <strong>{nextActivity.time} · </strong>
              )}
              {nextActivity.text}
            </p>
            {nextActivity.rideTo && (
              <div className="ride-actions ride-actions--inline">
                <a href={uberUrl(nextActivity.rideTo)} className="ride-btn">
                  <Car size={12} strokeWidth={1.5} />
                  Uber
                </a>
                <a href={inDriveUrl(nextActivity.rideTo)} className="ride-btn ride-btn--alt">
                  InDrive
                </a>
              </div>
            )}
          </div>
        )}

        {plan.stay && (
          <div className="today-stay">
            <MapPin size={14} strokeWidth={1.5} />
            <span>{plan.stay}</span>
          </div>
        )}
      </section>

      {nudges.length > 0 && (
        <section className="nudge-stack">
          {nudges.map((n) => (
            <div
              key={n.id}
              className={`nudge-card ${n.urgency === "high" ? "nudge-card--urgent" : ""}`}
            >
              {n.text}
            </div>
          ))}
        </section>
      )}

      <section className="today-section">
        <h3 className="section-title">Weather today</h3>
        <WeatherCards tripDay={tripDay} compact />
      </section>

      <section className="today-section">
        <h3 className="section-title">Today's plan</h3>
        <ul className="activity-list today-activities">
          {plan.activities.map((a, i) => (
            <ActivityRow key={i} activity={a} />
          ))}
        </ul>
      </section>

      {tripDay !== null && tripDay >= 1 && tripDay <= 5 && (
        <p className="today-footer-hint">
          Day {tripDay} of 5
          {tripDay < 5 && (
            <>
              {" "}
              · Tomorrow: {DAYS[tripDay]?.title}
              <ChevronRight size={12} style={{ verticalAlign: "middle" }} />
            </>
          )}
        </p>
      )}
    </div>
  );
}
