import { Calendar, X } from "lucide-react";

function formatStartLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type TripStartDateBarProps = {
  startDate: string | null;
  setStartDate: (date: string) => void;
  resetStartDate: () => void;
};

export function TripStartDateBar({
  startDate,
  setStartDate,
  resetStartDate,
}: TripStartDateBarProps) {
  return (
    <div className="trip-start-bar">
      <label className="trip-start-bar__btn">
        <Calendar size={13} strokeWidth={1.5} aria-hidden />
        <span className="trip-start-bar__label">
          {startDate ? (
            <>
              Starts <strong>{formatStartLabel(startDate)}</strong>
            </>
          ) : (
            "Set trip start date"
          )}
        </span>
        <input
          type="date"
          className="trip-start-bar__input"
          value={startDate ?? ""}
          onChange={(e) => e.target.value && setStartDate(e.target.value)}
          aria-label="Trip start date"
        />
      </label>
      {startDate && (
        <button
          type="button"
          className="trip-start-bar__clear"
          onClick={resetStartDate}
          aria-label="Clear trip start date"
        >
          <X size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
