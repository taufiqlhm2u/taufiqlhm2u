'use strict';
// Komponen 4: heatmap kontribusi 53 minggu x 7 hari.
const { f, text, svgDoc, textWidth, thousands, MONTHS_SHORT } = require('./utils');

function renderContributions(data, t) {
  const W = t.width, CX = 16, CW = W - 32, PAD = 16;
  const weeks = data.calendar.weeks;
  const nW = Math.max(weeks.length, 1);
  const gridX = CX + PAD, gridW = CW - 2 * PAD;
  const pitch = gridW / nW, cell = Math.max(6, pitch - 2.2);
  const body = [];

  // ambang level dari kuartil hari yang punya kontribusi
  const counts = [].concat(...weeks).map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p) => (counts.length ? counts[Math.min(counts.length - 1, Math.floor(p * counts.length))] : 0);
  const th = [q(0.25), q(0.5), q(0.75)];
  const level = (c) => (c <= 0 ? -1 : c <= th[0] ? 0 : c <= th[1] ? 1 : c <= th[2] ? 2 : 3);

  const top = 8, headY = top + 36, monthY = headY + 36, gridY = monthY + 10;
  const gridH = 7 * pitch;
  const legendY = gridY + gridH + 12;
  const cardH = legendY + 24 + 12 - top;
  const H = cardH + 16;

  body.push(`<rect x="${CX}" y="${top}" width="${CW}" height="${cardH}" rx="${t.radius}" fill="${t.surface}"/>`);
  body.push(text('Aktivitas kontribusi', CX + PAD, headY, { size: 20, weight: 800, fill: t.text }, t));
  body.push(text(`${thousands(data.calendar.total)} kontribusi dalam setahun terakhir`, CX + PAD, headY + 22, { size: 14, fill: t.sub }, t));

  // label bulan di minggu pertama tiap bulan, dilewati kalau terlalu rapat
  let prevMonth = -1, prevX = -100;
  weeks.forEach((wk, i) => {
    if (!wk.length) return;
    const m = new Date(wk[0].date + 'T00:00:00Z').getUTCMonth();
    if (m !== prevMonth) {
      const x = gridX + i * pitch;
      if (x - prevX >= 28 && x + 24 < CX + CW) { body.push(text(MONTHS_SHORT[m], x, monthY, { size: 12, fill: t.sub }, t)); prevX = x; }
      prevMonth = m;
    }
  });

  const lastDate = data.calendar.days.length ? data.calendar.days[data.calendar.days.length - 1].date : '';
  let cells = '';
  weeks.forEach((wk, i) => {
    for (const d of wk) {
      const lv = level(d.count);
      const fill = lv < 0 ? t.heatEmpty : t.heat[lv];
      const x = gridX + i * pitch, y = gridY + d.weekday * pitch;
      cells += `<rect x="${f(x)}" y="${f(y)}" width="${f(cell)}" height="${f(cell)}" rx="2" fill="${fill}"${d.date === lastDate ? ` stroke="${t.accent.blue}" stroke-width="1.5"` : ''}/>`;
    }
  });
  body.push(cells);

  // legenda
  const rx = CX + CW - PAD;
  let lx = rx - textWidth('Banyak', 12) ;
  body.push(text('Banyak', rx, legendY + 16, { size: 12, fill: t.sub, anchor: 'end' }, t));
  const swatches = [t.heatEmpty].concat(t.heat);
  lx -= 8 + swatches.length * 14;
  swatches.forEach((c, i) => body.push(`<rect x="${f(lx + i * 14)}" y="${legendY + 6}" width="10" height="10" rx="2" fill="${c}"/>`));
  body.push(text('Sedikit', lx - 8, legendY + 16, { size: 12, fill: t.sub, anchor: 'end' }, t));

  return svgDoc({
    w: W, h: H, t, body: body.join(''),
    title: 'Aktivitas kontribusi',
    desc: `${data.calendar.total} kontribusi dalam setahun terakhir.`,
  });
}

module.exports = { renderContributions };
