import type { CSSProperties } from "react";
import { DAY_IMAGE_FOCUS } from "../../lib/images";
import type { DayPlan } from "../data/trip";

type TodayDayPeekProps = {
  plan: DayPlan;
  viewDay: number;
  tripDays: number;
};

/** Lightweight stack preview — image + title only (no weather/API). */
export function TodayDayPeek({ plan, viewDay, tripDays }: TodayDayPeekProps) {
  const focus = DAY_IMAGE_FOCUS[viewDay as 1 | 2 | 3 | 4 | 5];

  return (
    <article className="today-day-peek" aria-hidden>
      {plan.image && (
        <div
          className="today-hero-media"
          style={{ "--focus": focus } as CSSProperties}
        >
          <img
            src={plan.image}
            alt=""
            className="today-hero-img"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
      )}
      <div className="today-day-peek__body">
        <span className="today-eyebrow">
          Day {viewDay} of {tripDays}
        </span>
        <h2 className="today-title">{plan.title}</h2>
        {plan.subtitle && <p className="today-subtitle">{plan.subtitle}</p>}
        <p className="today-day-peek__meta">
          {plan.activities.length} activities
          {plan.stay ? ` · ${plan.stay}` : ""}
        </p>
      </div>
    </article>
  );
}
