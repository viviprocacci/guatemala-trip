import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { DAYS } from "../data/trip";
import { useTripStart } from "../hooks/useTripStart";
import { getNudges } from "../utils/nudges";
import { ActivityRow } from "./ActivityRow";
import { DaySwipeCard } from "./DaySwipeCard";
import { TodayDayCard } from "./TodayDayCard";
import { WeatherCards } from "./WeatherCards";

const TRIP_DAYS = 5;

export function TodayView() {
  const { startDate, setStartDate, resetStartDate, tripDay, loaded } = useTripStart();
  const [viewDay, setViewDay] = useState(1);
  const hour = new Date().getHours();

  const calendarDay =
    tripDay !== null && tripDay >= 1 && tripDay <= TRIP_DAYS ? tripDay : 1;

  useEffect(() => {
    setViewDay(calendarDay);
  }, [calendarDay]);

  if (!loaded) return null;

  const plan = DAYS.find((d) => d.day === viewDay) ?? DAYS[0];
  const peekPrevPlan = DAYS.find((d) => d.day === viewDay - 1);
  const peekNextPlan = DAYS.find((d) => d.day === viewDay + 1);
  const isLiveToday =
    tripDay !== null && tripDay >= 1 && tripDay <= TRIP_DAYS && viewDay === tripDay;
  const nudges =
    startDate && tripDay !== null && tripDay >= 1 && tripDay <= TRIP_DAYS
      ? isLiveToday
        ? getNudges(tripDay, hour)
        : []
      : [{ id: "set-date", text: "Set your trip start date above to unlock day-specific nudges & weather.", urgency: "normal" as const }];

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

  const cardProps = {
    tripDays: TRIP_DAYS,
    startDate,
    setStartDate,
    resetStartDate,
  };

  return (
    <div className="today-view">
      <DaySwipeCard
        canPrev={viewDay > 1}
        canNext={viewDay < TRIP_DAYS}
        showSwipeHint={viewDay === 1}
        onPrev={() => setViewDay((d) => Math.max(1, d - 1))}
        onNext={() => setViewDay((d) => Math.min(TRIP_DAYS, d + 1))}
        peekPrev={
          peekPrevPlan ? (
            <TodayDayCard
              plan={peekPrevPlan}
              viewDay={viewDay - 1}
              isLiveToday={false}
              {...cardProps}
            />
          ) : undefined
        }
        peekNext={
          peekNextPlan ? (
            <TodayDayCard
              plan={peekNextPlan}
              viewDay={viewDay + 1}
              isLiveToday={false}
              {...cardProps}
            />
          ) : undefined
        }
      >
        <TodayDayCard
          plan={plan}
          viewDay={viewDay}
          isLiveToday={isLiveToday}
          nextActivity={isLiveToday ? nextActivity : undefined}
          {...cardProps}
        />
      </DaySwipeCard>

      <div className="day-swipe-dots" role="tablist" aria-label="Trip day">
        {Array.from({ length: TRIP_DAYS }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === viewDay}
            aria-label={`Day ${d}`}
            className={`day-swipe-dot ${d === viewDay ? "day-swipe-dot--active" : ""}`}
            onClick={() => setViewDay(d)}
          />
        ))}
      </div>

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

      <section className="today-section">
        <h3 className="section-title">
          {isLiveToday ? "Today's plan" : `Day ${viewDay} plan`}
        </h3>
        <ul className="activity-list today-activities">
          {plan.activities.map((a, i) => (
            <ActivityRow key={i} activity={a} />
          ))}
        </ul>
      </section>

      {isLiveToday && tripDay !== null && tripDay < TRIP_DAYS && (
        <p className="today-footer-hint">
          Tomorrow: {DAYS[tripDay]?.title}
          <ChevronRight size={12} style={{ verticalAlign: "middle" }} />
        </p>
      )}
    </div>
  );
}
