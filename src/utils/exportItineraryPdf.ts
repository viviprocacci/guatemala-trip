import { ACATENANGO_PACK, DAYS, PACK_LIST } from "../data/trip";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function exportItineraryPdf() {
  const daysHtml = DAYS.map(
    (day) => `
    <section class="day">
      <div class="day-head">
        <span class="day-num">${day.day}</span>
        <div>
          <h2>${escapeHtml(day.title)}</h2>
          ${day.subtitle ? `<p class="sub">${escapeHtml(day.subtitle)}</p>` : ""}
        </div>
      </div>
      <ul>
        ${day.activities
          .map(
            (a) =>
              `<li>${a.time ? `<strong>${escapeHtml(a.time)}</strong>: ` : ""}${escapeHtml(a.text)}</li>`,
          )
          .join("")}
      </ul>
      ${day.stay ? `<p class="stay"><em>Stay:</em> ${escapeHtml(day.stay)}</p>` : ""}
      ${day.tips?.map((t) => `<p class="tip">${escapeHtml(t)}</p>`).join("") ?? ""}
    </section>`,
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Guatemala · 5 Day Itinerary</title>
  <style>
    @page { margin: 1.2cm; }
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #1a1816;
      max-width: 720px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      line-height: 1.55;
    }
    header {
      text-align: center;
      border-bottom: 2px solid #9c4f3d;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    header h1 {
      font-size: 2.5rem;
      font-weight: normal;
      margin: 0 0 0.25rem;
      letter-spacing: 0.02em;
    }
    header .tagline {
      font-style: italic;
      color: #8c857c;
      margin: 0;
    }
    header .meta {
      margin-top: 1rem;
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #8c857c;
    }
    .day {
      margin-bottom: 2rem;
      page-break-inside: avoid;
    }
    .day-head {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    .day-num {
      font-size: 2.5rem;
      color: #9c4f3d;
      line-height: 1;
      min-width: 2rem;
    }
    .day h2 {
      font-size: 1.25rem;
      font-weight: normal;
      margin: 0;
    }
    .sub { color: #8c857c; font-style: italic; margin: 0.2rem 0 0; font-size: 0.9rem; }
    ul { margin: 0; padding-left: 1.25rem; }
    li { margin: 0.35rem 0; font-size: 0.9rem; }
    .stay { font-size: 0.85rem; color: #5a7d8a; margin-top: 0.75rem; }
    .tip { font-size: 0.82rem; color: #8c857c; font-style: italic; }
    .pack-section {
      border-top: 1px solid #e5e0d8;
      padding-top: 1.5rem;
      margin-top: 2rem;
    }
    .pack-section h3 { font-weight: normal; font-size: 1.1rem; }
    .pack-grid { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .pack-chip {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border: 1px solid #e5e0d8;
      border-radius: 2px;
    }
    footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.7rem;
      color: #8c857c;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <header>
    <h1>Guatemala</h1>
    <p class="tagline">Acatenango overnight · Lake Atitlán</p>
    <p class="meta">5 days · 3 regions · Personal itinerary</p>
  </header>
  ${daysHtml}
  <div class="pack-section">
    <h3>Acatenango essentials</h3>
    <ul>${ACATENANGO_PACK.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
    <h3>Full pack list</h3>
    <div class="pack-grid">
      ${PACK_LIST.map((p) => `<span class="pack-chip">${escapeHtml(p.item)}</span>`).join("")}
    </div>
  </div>
  <footer>Exported ${new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</footer>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Allow pop-ups, then Print → Save to PDF.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
