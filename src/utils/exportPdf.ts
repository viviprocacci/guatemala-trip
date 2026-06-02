import type { Reservation } from "../types";

function formatDate(date: string): string {
  return new Date(date + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Opens a print-friendly page — on iPhone use Share → Save to Files as PDF */
export function exportReservationsPdf(reservations: Reservation[]) {
  const sorted = [...reservations].sort((a, b) => a.date.localeCompare(b.date));

  const rows = sorted
    .map(
      (r) => `
      <tr>
        <td>${formatDate(r.date)}${r.time ? `<br><small>${r.time}</small>` : ""}</td>
        <td><span class="tag">${r.category}</span><br><strong>${escapeHtml(r.title)}</strong></td>
        <td>${escapeHtml(r.location ?? "—")}${r.addressEs ? `<br><small>${escapeHtml(r.addressEs)}</small>` : ""}</td>
        <td>${escapeHtml(r.confirmation ?? "—")}</td>
        <td>${escapeHtml(r.notes ?? "—")}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Guatemala Trip · Reservations</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #1a1816;
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      line-height: 1.5;
    }
    h1 { font-size: 1.75rem; font-weight: normal; margin: 0 0 0.25rem; }
    .sub { color: #8c857c; font-size: 0.9rem; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { border-bottom: 1px solid #e5e0d8; padding: 0.75rem 0.5rem; text-align: left; vertical-align: top; }
    th { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #8c857c; font-weight: normal; }
    .tag { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.06em; color: #5a7d8a; }
    @media print { body { margin: 0; padding: 1rem; } }
  </style>
</head>
<body>
  <h1>Guatemala Trip</h1>
  <p class="sub">Reservations · ${sorted.length} booking${sorted.length === 1 ? "" : "s"} · exported ${new Date().toLocaleDateString()}</p>
  ${
    sorted.length === 0
      ? "<p>No reservations saved.</p>"
      : `<table>
    <thead><tr><th>Date</th><th>Booking</th><th>Location</th><th>Confirmation</th><th>Notes</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
  }
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Allow pop-ups to export PDF, then use Print → Save to PDF (or Share on iPhone).");
    return;
  }
  win.document.write(html);
  win.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
