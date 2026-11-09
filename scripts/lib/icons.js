'use strict';
// Ikon SVG (viewBox 24x24) dan font piksel 5x7 untuk komponen arcade.
const { f } = require('./utils');

// Bintang 5 sudut dihitung, bukan ditulis tangan.
function starPath() {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 10 : 4.4;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push((12 + r * Math.cos(a)).toFixed(2) + ' ' + (12.6 + r * Math.sin(a)).toFixed(2));
  }
  return 'M' + pts.join('L') + 'Z';
}

const HEART = 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

// type "stroke": garis 2px, "fill": isi penuh
const ICONS = {
  pin: { type: 'stroke', body: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>' },
  link: { type: 'stroke', body: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' },
  calendar: { type: 'stroke', body: '<path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/>' },
  reply: { type: 'stroke', body: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>' },
  repeat: { type: 'stroke', body: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>' },
  star: { type: 'stroke', body: `<path d="${starPath()}"/>` },
  heart: { type: 'stroke', body: `<path d="${HEART}"/>` },
  heartFill: { type: 'fill', body: `<path d="${HEART}"/>` },
  eye: { type: 'stroke', body: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>' },
  crown: { type: 'fill', body: '<path d="M3 8l4.5 4L12 4l4.5 8L21 8l-2 11H5z"/>' },
};

// Ikon sebagai grup siap tempel. size dalam px, color untuk stroke atau fill.
function icon(name, x, y, size, color, opts = {}) {
  const ic = ICONS[name];
  if (!ic) throw new Error('Ikon tidak dikenal: ' + name);
  const s = size / 24;
  const attrs = ic.type === 'fill'
    ? `fill="${color}"`
    : `fill="none" stroke="${color}" stroke-width="${opts.sw || 2}" stroke-linecap="round" stroke-linejoin="round"`;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})" ${attrs}${opts.extra ? ' ' + opts.extra : ''}>${ic.body}</g>`;
}

// Badge centang biru (verified), dua warna jadi dibuat terpisah.
function verifiedBadge(x, y, size, blue) {
  const s = size / 24;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` +
    '<path fill="' + blue + '" d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>' +
    '<path d="m8.5 12.2 2.4 2.4 4.6-4.8" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></g>';
}

// ---------- Font piksel 5x7 ----------
const GLYPHS = {
  A: '01110/10001/10001/11111/10001/10001/10001', B: '11110/10001/10001/11110/10001/10001/11110',
  C: '01110/10001/10000/10000/10000/10001/01110', D: '11110/10001/10001/10001/10001/10001/11110',
  E: '11111/10000/10000/11110/10000/10000/11111', F: '11111/10000/10000/11110/10000/10000/10000',
  G: '01110/10001/10000/10111/10001/10001/01111', H: '10001/10001/10001/11111/10001/10001/10001',
  I: '01110/00100/00100/00100/00100/00100/01110', J: '00111/00010/00010/00010/00010/10010/01100',
  K: '10001/10010/10100/11000/10100/10010/10001', L: '10000/10000/10000/10000/10000/10000/11111',
  M: '10001/11011/10101/10101/10001/10001/10001', N: '10001/11001/10101/10011/10001/10001/10001',
  O: '01110/10001/10001/10001/10001/10001/01110', P: '11110/10001/10001/11110/10000/10000/10000',
  Q: '01110/10001/10001/10001/10101/10010/01101', R: '11110/10001/10001/11110/10100/10010/10001',
  S: '01111/10000/10000/01110/00001/00001/11110', T: '11111/00100/00100/00100/00100/00100/00100',
  U: '10001/10001/10001/10001/10001/10001/01110', V: '10001/10001/10001/10001/10001/01010/00100',
  W: '10001/10001/10001/10101/10101/11011/10001', X: '10001/10001/01010/00100/01010/10001/10001',
  Y: '10001/10001/01010/00100/00100/00100/00100', Z: '11111/00001/00010/00100/01000/10000/11111',
  0: '01110/10001/10011/10101/11001/10001/01110', 1: '00100/01100/00100/00100/00100/00100/01110',
  2: '01110/10001/00001/00010/00100/01000/11111', 3: '11110/00001/00001/01110/00001/00001/11110',
  4: '00010/00110/01010/10010/11111/00010/00010', 5: '11111/10000/11110/00001/00001/10001/01110',
  6: '00110/01000/10000/11110/10001/10001/01110', 7: '11111/00001/00010/00100/01000/01000/01000',
  8: '01110/10001/10001/01110/10001/10001/01110', 9: '01110/10001/10001/01111/00001/00010/01100',
  '-': '00000/00000/00000/11111/00000/00000/00000', '.': '00000/00000/00000/00000/00000/01100/01100',
  ':': '00000/01100/01100/00000/01100/01100/00000', '!': '00100/00100/00100/00100/00100/00000/00100',
  '/': '00001/00010/00010/00100/01000/01000/10000', '%': '11001/11010/00010/00100/01000/01011/10011',
  '+': '00000/00100/00100/11111/00100/00100/00000', ' ': '00000/00000/00000/00000/00000/00000/00000',
};
const GLYPH_ROWS = {};
for (const k of Object.keys(GLYPHS)) GLYPH_ROWS[k] = GLYPHS[k].split('/');

// Huruf besar tanpa aksen, karakter di luar font diganti spasi.
function pixelClean(str) {
  return String(str == null ? '' : str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    .split('').map((c) => (GLYPH_ROWS[c] ? c : ' ')).join('');
}

function pixelWidth(str, s) {
  const n = Array.from(pixelClean(str)).length;
  return n ? (n * 6 - 1) * s : 0;
}

// Satu path gabungan per string. Baris piksel yang berurutan digabung jadi satu persegi panjang.
function pixelPath(str, x, y, s) {
  const clean = pixelClean(str);
  let d = '';
  let cx = x;
  for (const ch of clean) {
    const rows = GLYPH_ROWS[ch];
    for (let r = 0; r < 7; r++) {
      const row = rows[r];
      let c = 0;
      while (c < 5) {
        if (row[c] === '1') {
          let e = c;
          while (e + 1 < 5 && row[e + 1] === '1') e++;
          d += `M${f(cx + c * s)} ${f(y + r * s)}h${f((e - c + 1) * s)}v${f(s)}h${f(-(e - c + 1) * s)}z`;
          c = e + 1;
        } else c++;
      }
    }
    cx += 6 * s;
  }
  return d;
}

// anchor: start | middle | end. y adalah sisi atas huruf.
function pixelText(str, x, y, s, fill, opts = {}) {
  const w = pixelWidth(str, s);
  const sx = opts.anchor === 'end' ? x - w : opts.anchor === 'middle' ? x - w / 2 : x;
  const d = pixelPath(str, Math.round(sx), Math.round(y), s);
  if (!d) return '';
  return `<path d="${d}" fill="${fill}"${opts.extra ? ' ' + opts.extra : ''} shape-rendering="crispEdges"/>`;
}

module.exports = { ICONS, HEART, icon, verifiedBadge, pixelClean, pixelWidth, pixelPath, pixelText };
