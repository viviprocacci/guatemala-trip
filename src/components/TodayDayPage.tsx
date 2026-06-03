import type { CSSProperties } from "react";
import { Car, ChevronRight, MapPin } from "lucide-react";
import { DAY_IMAGE_FOCUS } from "../../lib/images";
import { DAYS, type DayPlan } from "../data/trip";
import { getNudges } from "../utils/nudges";
import { inDriveUrl, uberUrl } from "../utils/links";
import { ActivityRow } from "./ActivityRow";
import { WeatherCards } from "./WeatherCards";

export type TodayDayPageProps = {
  plan: DayPlan;
  viewDay: number;
  tripDays: number;
  tripDay: number | null;
  hour: number;
  startDate: string | null;
};

export function TodayDayPage({
  plan,
  viewDay,
  tripDays,
  tripDay,
  hour,
  startDate,
}: TodayDayPageProps) {
  const focus = DAY_IMAGE_FOCUS[viewDay as 1 | 2 | 3 | 4 | 5];
  const isLiveToday =
    tripDay !== null &&
    tripDay >= 1 &&
    tripDay <= tripDays &&
    viewDay === tripDay;

  const nudges =
    startDate && tripDay !== null && tripDay >= 1 && tripDay <= tripDays
      ? isLiveToday
        ? getNudges(tripDay, hour)
        : []
      : [
          {
            id: "set-date",
            text: "Set your trip start date to unlock day-specific nudges & weather.",
            urgency: "normal" as const,
          },
        ];

  const nextActivity =
    plan.activities.find((a) => {
      if (!a.time) return true;
      const t = a.time.toLowerCase();
      if (hour < 12 && (t.includes("morning") || t.includes("early") || t.includes("dawn")))
        return true;
      if (hour >= 12 && hour < 17 && (t.includes("afternoon") || t.includes("mid")))
        return true;
      if (hour >= 17 && t.includes("evening")) return true;
      return false;
    }) ?? plan.activities[0];

  return (
    <article
      className="today-day-page"
      aria-label={`Day ${viewDay} itinerary`}
    >
      {plan.image && (
        <div
          className="today-hero-media"
          style={{ "--focus": focus } as CSSProperties}
        >
          <img
            src={plan.image}
            alt={plan.imageAlt ?? plan.title}
            className="today-hero-img"
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </div>
      )}

      <div className="today-day-page__body">
        <header className="today-day-page__head">
          <span className="today-eyebrow">
            Day {viewDay} of {tripDays}
            {isLiveToday && <span className="today-eyebrow-today"> · Today</span>}
          </span>
          <h2 className="today-title">{plan.title}</h2>
          {plan.subtitle && <p className="today-subtitle">{plan.subtitle}</p>}
        </header>

        {isLiveToday && nextActivity && (
          <div className="next-up-card" onPointerDown={(e) => e.stopPropagation()}>
            <span className="next-up-label">Next up</span>
            <p className="next-up-text">
              {nextActivity.time && <strong>{nextActivity.time} · </strong>}
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
          <h3 className="section-title">
            {isLiveToday ? "Weather today" : `Weather · Day ${viewDay}`}
          </h3>
          <WeatherCards tripDay={startDate ? viewDay : null} compact />
        </section>

        <section
          className="today-section"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <h3 className="section-title">
            {isLiveToday ? "Today's plan" : `Day ${viewDay} plan`}
          </h3>
          <ul className="activity-list today-activities">
            {plan.activities.map((a, i) => (
              <ActivityRow key={i} activity={a} />
            ))}
          </ul>
        </section>

        {isLiveToday && tripDay !== null && tripDay < tripDays && (
          <p className="today-footer-hint">
            Tomorrow: {DAYS[tripDay]?.title}
            <ChevronRight size={12} style={{ verticalAlign: "middle" }} />
          </p>
        )}
      </div>
    </article>
  );
}
