'use strict';
// Komponen 6: papan skor tertinggi (TOP SCORES), repo dengan bintang terbanyak ala mesin arcade.
const { f, text, svgDoc, truncate, pad, wrapText } = require('./utils');
const { icon, pixelText, pixelWidth, pixelClean } = require('./icons');

// Tiga huruf inisial dari nama repo: huruf awal tiap kata, lalu dilengkapi dari huruf berikutnya.
function initials(name) {
  const tokens = String(name).replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^A-Za-z0-9]+/).filter(Boolean);
  const letters = tokens.map((w) => w[0]);
  for (let k = 1; letters.length < 3 && tokens.length; k++) {
    let added = false;
    for (const w of tokens) { if (letters.length < 3 && w[k]) { letters.push(w[k]); added = true; } }
    if (!added) break;
  }
  const out = pixelClean(letters.join('')).replace(/ /g, '').slice(0, 3);
  return out.padEnd(3, 'A');
}

function renderScores(data, t) {
  const W = t.width, CX = 16, CW = W - 32;
  const top = data.top.slice(0, 5);
  const body = [];
  const sub = wrapText('Repos with the most stars. Score = stars, NEW = pushed in the last 14 days.', CW - 32, 13);
  const rowH = 52, headH = 56 + sub.length * 18, footH = 52;
  const cardH = headH + 5 * rowH + footH;
  const H = cardH + 16;
  const css = `.bk{animation:bk 1.1s steps(1,end) infinite}@keyframes bk{0%{opacity:1}50%{opacity:.2}100%{opacity:1}}`;

  body.push(`<rect x="${CX}" y="8" width="${CW}" height="${cardH}" rx="${t.radius}" fill="${t.surface}"/>`);
  body.push(pixelText('TOP SCORES', CX + 16, 8 + 20, 2, t.gold));
  sub.forEach((l, i) => body.push(text(l, CX + 16, 8 + 52 + i * 18, { size: 13, fill: t.sub }, t)));

  for (let i = 0; i < 5; i++) {
    const r = top[i];
    const y0 = 8 + headH + i * rowH, cy = y0 + rowH / 2;
    const champ = i === 0 && r;
    const dim = !r;
    const ink = champ ? t.gold : dim ? t.sub : t.text;
    if (champ) body.push(`<rect x="${CX}" y="${y0}" width="${CW}" height="${rowH}" fill="${t.gold}" opacity=".08"/>`);
    body.push(`<path d="M${CX} ${y0 + 0.5}H${CX + CW}" stroke="${t.border}"/>`);

    // peringkat, mahkota untuk juara 1
    if (champ) body.push(icon('crown', CX + 14, cy - 11, 22, t.gold));
    else body.push(pixelText(String(i + 1), CX + 20, cy - 10, 3, ink));

    body.push(pixelText(r ? initials(r.name) : '---', CX + 60, cy - 10, 3, champ ? t.gold : dim ? t.sub : t.accent.blue));
    body.push(text(r ? truncate(r.name, 220, 15, { mono: true }) : '---', CX + 136, cy + 5, { size: 15, fill: ink, font: t.mono }, t));

    if (r) {
      const fresh = r.pushedAt && data.now - new Date(r.pushedAt).getTime() <= 14 * 86400000;
      if (fresh) {
        const bx = CX + 394;
        body.push(`<g class="bk"><rect x="${bx}" y="${cy - 10}" width="52" height="20" rx="10" fill="${t.accent.red}"/>${pixelText('NEW', bx + 26, cy - 5, 2, '#ffffff', { anchor: 'middle' })}</g>`);
      }
      body.push(pixelText(pad(r.stars, 6), CX + CW - 16, cy - 7, 2, ink, { anchor: 'end' }));
    } else {
      body.push(pixelText('---', CX + CW - 16, cy - 7, 2, t.sub, { anchor: 'end' }));
    }
  }
  const fy = 8 + headH + 5 * rowH;
  body.push(`<path d="M${CX} ${fy + 0.5}H${CX + CW}" stroke="${t.border}"/>`);
  body.push(`<g class="bk">${pixelText('INSERT COIN', W / 2, fy + 19, 2, t.accent.red, { anchor: 'middle' })}</g>`);

  return svgDoc({
    w: W, h: H, t, css, body: body.join(''),
    title: 'Top scores: repos with the most stars',
    desc: top.length ? 'Most starred repos: ' + top.map((r) => `${r.name} ${r.stars}`).join(', ') : 'No starred repos yet.',
  });
}

module.exports = { renderScores, initials };
