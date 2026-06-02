import { useState } from "react";
import { FileDown, Plus, Trash2, X } from "lucide-react";
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
  addressEs: "",
  notes: "",
};

export function WalletView() {
  const { reservations, loaded, add, remove } = useReservations();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Reservation | null>(null);
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
      addressEs: form.addressEs || undefined,
      notes: form.notes || undefined,
    });
    setForm(emptyForm);
    setShowForm(false);
  };

  const addSuggested = (s: (typeof SUGGESTED)[0]) => {
    setForm({ ...emptyForm, title: s.title, category: s.category });
    setShowForm(true);
  };

  if (!loaded) return null;

  return (
    <div className="wallet-view">
      <div className="bookings-toolbar">
        <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={15} strokeWidth={1.5} />
          Add
        </button>
        {reservations.length > 0 && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => exportReservationsPdf(reservations)}
          >
            <FileDown size={15} strokeWidth={1.5} />
            PDF
          </button>
        )}
      </div>

      {showForm && (
        <form className="form-card form-grid" onSubmit={handleAdd}>
          <label>
            Title
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label>
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ReservationCategory })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label>
            Time
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </label>
          <label>
            Confirmation #
            <input value={form.confirmation} onChange={(e) => setForm({ ...form, confirmation: e.target.value })} />
          </label>
          <label>
            Location
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          <label>
            Address in Spanish (show driver)
            <input
              placeholder="Hotel Casa Santo Domingo, Antigua"
              value={form.addressEs}
              onChange={(e) => setForm({ ...form, addressEs: e.target.value })}
            />
          </label>
          <label>
            Notes
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {reservations.length === 0 && !showForm && (
        <div className="empty-state">
          <p>Your confirmation wallet is empty.</p>
          <p className="empty-hint">Tap a booking to full-screen conf # offline at check-in.</p>
          <div className="suggested-row">
            {SUGGESTED.map((s) => (
              <button key={s.title} type="button" className="quick-btn" onClick={() => addSuggested(s)}>
                {s.category}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="wallet-grid">
        {reservations.map((r) => (
          <button
            key={r.id}
            type="button"
            className="wallet-card"
            onClick={() => setSelected(r)}
          >
            <span className="category-tag">{r.category}</span>
            <h3>{r.title}</h3>
            {r.confirmation && (
              <p className="wallet-conf-preview">{r.confirmation}</p>
            )}
            <span className="wallet-tap-hint">Tap for full screen</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="wallet-modal" role="dialog" aria-modal="true">
          <div className="wallet-modal-inner">
            <button type="button" className="wallet-modal-close" onClick={() => setSelected(null)} aria-label="Close">
              <X size={22} />
            </button>
            <span className="category-tag">{selected.category}</span>
            <h2 className="wallet-modal-title">{selected.title}</h2>
            {selected.confirmation && (
              <div className="wallet-conf-block">
                <span className="wallet-conf-label">Confirmation</span>
                <span className="wallet-conf-number">{selected.confirmation}</span>
              </div>
            )}
            {selected.addressEs && (
              <div className="wallet-driver-block">
                <span className="wallet-conf-label">Show driver</span>
                <p className="wallet-driver-text">{selected.addressEs}</p>
              </div>
            )}
            {selected.location && !selected.addressEs && (
              <p className="wallet-detail">{selected.location}</p>
            )}
            {selected.time && <p className="wallet-detail">{selected.time}</p>}
            {selected.notes && <p className="wallet-notes">{selected.notes}</p>}
            <button
              type="button"
              className="btn-ghost wallet-delete"
              onClick={() => {
                remove(selected.id);
                setSelected(null);
              }}
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
