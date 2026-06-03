import type { CSSProperties } from "react";
import { Calendar, Car, MapPin, RotateCcw } from "lucide-react";
import { DAY_IMAGE_FOCUS } from "../../lib/images";
import type { DayPlan } from "../data/trip";
import { inDriveUrl, uberUrl } from "../utils/links";
import type { Activity } from "../data/trip";

type TodayDayCardProps = {
  plan: DayPlan;
  viewDay: number;
  tripDays: number;
  isLiveToday: boolean;
  startDate: string | null;
  setStartDate: (date: string) => void;
  resetStartDate: () => void;
  nextActivity?: Activity;
};

export function TodayDayCard({
  plan,
  viewDay,
  tripDays,
  isLiveToday,
  startDate,
  setStartDate,
  resetStartDate,
  nextActivity,
}: TodayDayCardProps) {
  const focus = DAY_IMAGE_FOCUS[viewDay as 1 | 2 | 3 | 4 | 5];

  return (
    <section className="today-hero today-day-card" aria-label={`Day ${viewDay} itinerary`}>
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
      <div className="today-hero-body">
        <div className="today-hero-top">
          <div>
            <span className="today-eyebrow">
              Day {viewDay} of {tripDays}
              {isLiveToday && <span className="today-eyebrow-today"> · Today</span>}
            </span>
            <h2 className="today-title">{plan.title}</h2>
            {plan.subtitle && <p className="today-subtitle">{plan.subtitle}</p>}
          </div>
          <div
            className="today-date-actions"
            onPointerDown={(e) => e.stopPropagation()}
          >
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
      </div>
    </section>
  );
}
