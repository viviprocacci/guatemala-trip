import { useState } from "react";
import { FileDown, Plus, Trash2 } from "lucide-react";
import { useReservations } from "../hooks/useReservations";
import type { Reservation, ReservationCategory } from "../types";
import { exportReservationsPdf } from "../utils/exportPdf";

const CATEGORIES: ReservationCategory[] = [
  "flight",
  "hotel",
  "tour",
  "transport",
  "spa",
  "other",
];

const SUGGESTED = [
  { title: "Acatenango tour (Wicho & Charlie's / Ox / GYG)", category: "tour" as const },
  { title: "Antigua hotel, Night 1", category: "hotel" as const },
  { title: "El Descanso Spa massage", category: "spa" as const },
  { title: "La Casa del Mundo, 2 nights", category: "hotel" as const },
  { title: "Shuttle Antigua → Lake Atitlán", category: "transport" as const },
  { title: "Shuttle Lake → GUA (Day 5)", category: "transport" as const },
  { title: "Flight home from GUA", category: "flight" as const },
];

const emptyForm = {
  title: "",
  category: "other" as ReservationCategory,
  date: "",
  time: "",
  confirmation: "",
  location: "",
  notes: "",
};

export function ReservationsView() {
  const { reservations, loaded, add, remove } = useReservations();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    add({
      title: form.title.trim(),
      category: form.category,
      date: form.date,
      time: form.time || undefined,
      confirmation: form.confirmation || undefined,
      location: form.location || undefined,
      notes: form.notes || undefined,
    });
    setForm(emptyForm);
    setShowForm(false);
  };

  const addSuggested = (s: (typeof SUGGESTED)[0]) => {
    setForm({
      ...emptyForm,
      title: s.title,
      category: s.category,
    });
    setShowForm(true);
  };

  if (!loaded) return null;

  return (
    <div>
      <div className="bookings-toolbar">
        <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={15} strokeWidth={1.5} />
          Add reservation
        </button>
        {reservations.length > 0 && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => exportReservationsPdf(reservations)}
          >
            <FileDown size={15} strokeWidth={1.5} />
            Export PDF
          </button>
        )}
      </div>

      {showForm && (
        <form className="form-card form-grid" onSubmit={handleAdd}>
          <label>
            Title
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Acatenango with Ox Expeditions"
            />
          </label>
          <label>
            Category
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as ReservationCategory })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          <label>
            Time
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </label>
          <label>
            Confirmation
            <input
              value={form.confirmation}
              onChange={(e) => setForm({ ...form, confirmation: e.target.value })}
            />
          </label>
          <label>
            Location
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>
          <label>
            Notes
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Save
            </button>
            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {reservations.length === 0 && !showForm && (
        <div className="empty-state">
          <p>No reservations yet.</p>
          <p className="empty-hint">Add your flights, stays, and tours in one place.</p>
          <div className="suggested-row">
            {SUGGESTED.map((s) => (
              <button
                key={s.title}
                type="button"
                className="quick-btn"
                onClick={() => addSuggested(s)}
              >
                {s.category}
              </button>
            ))}
          </div>
        </div>
      )}

      {reservations.map((r) => (
        <ReservationCard key={r.id} reservation={r} onDelete={() => remove(r.id)} />
      ))}
    </div>
  );
}

function ReservationCard({
  reservation: r,
  onDelete,
}: {
  reservation: Reservation;
  onDelete: () => void;
}) {
  const d = new Date(r.date + "T12:00:00");
  const month = d.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const dayNum = d.getDate();
  const weekday = d.toLocaleDateString(undefined, { weekday: "long" });

  return (
    <article className="reservation-card">
      <div className="reservation-date">
        <span className="month">{month}</span>
        <span className="day">{dayNum}</span>
      </div>
      <div className="reservation-body">
        <span className="category-tag">{r.category}</span>
        <h3>{r.title}</h3>
        <div className="reservation-meta">
          <span>{weekday}</span>
          {r.time && <span>{r.time}</span>}
          {r.location && <span>{r.location}</span>}
        </div>
        {r.confirmation && (
          <p className="reservation-detail">
            <strong>Confirmation · </strong>
            {r.confirmation}
          </p>
        )}
        {r.notes && <p className="reservation-detail">{r.notes}</p>}
      </div>
      <button
        type="button"
        className="btn-icon"
        onClick={onDelete}
        aria-label="Delete reservation"
      >
        <Trash2 size={16} strokeWidth={1.5} />
      </button>
    </article>
  );
}
