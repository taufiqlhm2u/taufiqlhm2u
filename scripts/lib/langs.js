'use strict';
// Komponen 3: bahasa pemrograman bergaya kartu "Tren untuk kamu".
const { f, text, svgDoc, textWidth, truncate, pct1, visibleOn } = require('./utils');

function renderLangs(data, t) {
  const W = t.width, CX = 16, CW = W - 32, PAD = 16;
  const top = data.langs.slice(0, 8);
  const body = [];
  const rowH = 60, headH = 56;
  const rows = Math.max(top.length, 1);
  const cardH = headH + rows * rowH + 4;
  const H = cardH + 16;

  body.push(`<rect x="${CX}" y="8" width="${CW}" height="${cardH}" rx="${t.radius}" fill="${t.surface}"/>`);
  body.push(text('Bahasa yang sering kupakai', CX + PAD, 8 + 36, { size: 20, weight: 800, fill: t.text }, t));

  if (!top.length) {
    body.push(text('Belum ada kode yang terbaca', CX + PAD, 8 + headH + 22, { size: 15, weight: 700, fill: t.text }, t));
    body.push(text('Begitu ada repo dengan kode, barisnya muncul di sini', CX + PAD, 8 + headH + 44, { size: 13, fill: t.sub }, t));
  }

  top.forEach((l, i) => {
    const y0 = 8 + headH + i * rowH;
    const color = visibleOn(l.color, t.mode);
    body.push(text(`${i + 1} · Bahasa pemrograman`, CX + PAD, y0 + 14, { size: 13, fill: t.sub }, t));
    body.push(text(truncate(l.name, CW - 2 * PAD - 100, 15, { bold: true }), CX + PAD, y0 + 36, { size: 15, weight: 700, fill: t.text }, t));
    body.push(text(`${pct1(l.pct)}% kode`, CX + CW - PAD, y0 + 36, { size: 13, fill: t.sub, anchor: 'end' }, t));
    const bw = CW - 2 * PAD;
    body.push(`<rect x="${CX + PAD}" y="${y0 + 44}" width="${bw}" height="4" rx="2" fill="${t.border}"/>`);
    const fw = Math.max(4, (bw * l.pct) / 100);
    body.push(`<rect x="${CX + PAD}" y="${y0 + 44}" width="${f(Math.min(bw, fw))}" height="4" rx="2" fill="${color}"/>`);
  });

  return svgDoc({
    w: W, h: H, t, body: body.join(''),
    title: 'Bahasa pemrograman',
    desc: top.length ? 'Bahasa terbanyak: ' + top.map((l) => `${l.name} ${pct1(l.pct)}%`).join(', ') : 'Belum ada data bahasa.',
  });
}

module.exports = { renderLangs };
