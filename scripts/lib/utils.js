'use strict';
// Fungsi bantu bersama: escape XML, pembungkus teks, format angka dan tanggal Indonesia, PRNG, hash, validasi SVG.

// ---------- XML ----------
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Angka aman untuk atribut SVG. Melempar error kalau NaN/Infinity supaya bug ketahuan saat generate.
function f(x) {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error('Nilai SVG tidak valid: ' + x);
  return String(+x.toFixed(2));
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- Estimasi lebar teks ----------
// SVG tidak punya auto-wrap, jadi lebar dihitung kasar per karakter (satuan em).
function charEm(ch) {
  const c = ch.codePointAt(0);
  if (c >= 0x1100) return 1.0; // CJK, emoji
  if ('ijl.,:;\'!|`'.includes(ch)) return 0.27;
  if (ch === ' ') return 0.3;
  if ('frt()[]{}/\\-"*'.includes(ch)) return 0.38;
  if ('mwMW@%'.includes(ch)) return 0.88;
  if (c >= 65 && c <= 90) return 0.66;
  if (c >= 48 && c <= 57) return 0.56;
  return 0.53;
}

function textWidth(str, size, opts = {}) {
  if (opts.mono) return Array.from(String(str)).length * size * 0.6;
  let em = 0;
  for (const ch of Array.from(String(str))) em += charEm(ch);
  return em * size * (opts.bold ? 1.07 : 1.02);
}

// Potong teks dengan elipsis supaya muat di lebar maxW.
function truncate(str, maxW, size, opts = {}) {
  const s = String(str);
  if (textWidth(s, size, opts) <= maxW) return s;
  const chars = Array.from(s);
  while (chars.length > 1 && textWidth(chars.join('') + '…', size, opts) > maxW) chars.pop();
  return chars.join('').trimEnd() + '…';
}

// Bungkus teks jadi beberapa baris. maxLines opsional, baris terakhir diberi elipsis kalau terpotong.
function wrapText(text, maxW, size, opts = {}) {
  const out = [];
  const paragraphs = String(text == null ? '' : text).replace(/\r/g, '').split('\n');
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    let line = '';
    for (let w of words) {
      // kata yang lebih panjang dari satu baris dipecah per karakter
      while (textWidth(w, size, opts) > maxW) {
        let cut = Array.from(w);
        let head = '';
        while (cut.length && textWidth(head + cut[0], size, opts) <= maxW) head += cut.shift();
        if (!head) { head = cut.shift(); }
        if (line) { out.push(line); line = ''; }
        out.push(head);
        w = cut.join('');
        if (!w) break;
      }
      if (!w) continue;
      const trial = line ? line + ' ' + w : w;
      if (textWidth(trial, size, opts) <= maxW) line = trial;
      else { out.push(line); line = w; }
    }
    if (line) out.push(line);
  }
  if (opts.maxLines && out.length > opts.maxLines) {
    const kept = out.slice(0, opts.maxLines);
    const rest = out.slice(opts.maxLines - 1).join(' ');
    kept[opts.maxLines - 1] = truncate(rest, maxW, size, opts);
    return kept;
  }
  return out;
}

// ---------- Angka dan tanggal Indonesia ----------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function thousands(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

// 1234 -> "1.2K", 15300 -> "15K", 2300000 -> "2.3M"
function shortNum(n) {
  n = Math.max(0, Number(n) || 0);
  const fmt = (v) => (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : String(Math.round(v)));
  if (n >= 1e6) return fmt(n / 1e6) + 'M';
  if (n >= 1e3) return fmt(n / 1e3) + 'K';
  return String(Math.round(n));
}

const pct1 = (p) => p.toFixed(1);
const plural = (n, word) => (n === 1 ? word : word + 's');
const pad = (n, len) => String(Math.max(0, Math.round(n))).padStart(len, '0');

function joinedID(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return 'Joined ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
}

function relativeTimeID(iso, now) {
  const diff = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (!Number.isFinite(diff)) return '';
  const ago = (n, unit) => n + ' ' + plural(n, unit) + ' ago';
  if (diff < 60) return 'just now';
  if (diff < 3600) return ago(Math.floor(diff / 60), 'minute');
  if (diff < 86400) return ago(Math.floor(diff / 3600), 'hour');
  if (diff < 86400 * 30) return ago(Math.floor(diff / 86400), 'day');
  if (diff < 86400 * 365) return ago(Math.floor(diff / (86400 * 30)), 'month');
  return ago(Math.floor(diff / (86400 * 365)), 'year');
}

// ---------- PRNG dan hash ----------
// xfnv1a: hash string jadi uint32
function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Warna ----------
function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r, g, b) { return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function luminance(hex) {
  const c = hexToRgb(hex); if (!c) return 0.5;
  const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  if (!a || !b) return hexA;
  return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}
// Warna bahasa yang terlalu gelap di latar gelap (atau terlalu terang di latar terang) digeser sedikit agar tetap terlihat.
function visibleOn(hex, mode) {
  if (!hexToRgb(hex)) return mode === 'dark' ? '#8b98a5' : '#536471';
  const L = luminance(hex);
  if (mode === 'dark' && L < 0.06) return mix(hex, '#ffffff', 0.45);
  if (mode === 'light' && L > 0.75) return mix(hex, '#000000', 0.35);
  return hex;
}

// ---------- Dokumen SVG ----------
// CSS yang mematikan animasi saat pengguna meminta gerak dikurangi.
// SMIL tidak bisa dimatikan lewat CSS, jadi elemen bergerak diberi class "m" (disembunyikan)
// dan pose diam diberi class "s" (ditampilkan) saat reduce.
const REDUCED_CSS =
  '.s{display:none}' +
  '@media (prefers-reduced-motion: reduce){.m{display:none}.s{display:inline}*{animation:none !important}}';

function svgDoc({ w, h, title, desc, defs = '', css = '', body, t, frame = true }) {
  const borderLines = frame
    ? `<path d="M.5 0V${f(h)}M${f(w - 0.5)} 0V${f(h)}" stroke="${t.border}" stroke-width="1" fill="none"/>`
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}" role="img" aria-labelledby="ttl dsc">` +
    `<title id="ttl">${esc(title)}</title><desc id="dsc">${esc(desc)}</desc>` +
    `<defs>${defs}</defs>` +
    `<style>${css}${REDUCED_CSS}</style>` +
    `<rect width="${f(w)}" height="${f(h)}" fill="${t.bg}"/>` +
    body +
    borderLines +
    `</svg>`
  );
}

// Teks biasa. anchor: start | middle | end
function text(str, x, y, { size = 15, fill, weight = 400, anchor = 'start', font, extra = '' } = {}, t) {
  const fam = font || (t && t.font) || 'sans-serif';
  return `<text x="${f(x)}" y="${f(y)}" font-family='${fam}' font-size="${f(size)}" font-weight="${weight}" fill="${fill}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}${extra ? ' ' + extra : ''}>${esc(str)}</text>`;
}

// ---------- Validasi ----------
// Cek XML well-formed secara sederhana (tanpa dependency) dan cari nilai bocor.
function validateSvg(svg, name) {
  const errors = [];
  const noText = svg.replace(/>[^<]*</g, '><');
  if (/undefined|NaN|\[object Object\]/.test(noText)) errors.push('mengandung undefined/NaN/[object Object]');
  if (/<script/i.test(svg)) errors.push('mengandung <script>');
  if (/(href|src)=["']https?:/i.test(svg)) errors.push('mengandung resource eksternal');
  if (/@import|url\(["']?https?:/i.test(svg)) errors.push('CSS memuat resource eksternal');
  const bytes = Buffer.byteLength(svg, 'utf8');
  if (bytes > 500 * 1024) errors.push('ukuran ' + Math.round(bytes / 1024) + ' KB melebihi 500 KB');

  const stripped = svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style>[\s\S]*?<\/style>/g, '<style/>');
  const stack = [];
  const re = /<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)>/g;
  let m, last = 0;
  while ((m = re.exec(stripped))) {
    const between = stripped.slice(last, m.index);
    if (/</.test(between)) { errors.push('tag rusak dekat: ' + between.slice(0, 40)); break; }
    if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(between)) { errors.push('entity & tidak valid'); break; }
    last = re.lastIndex;
    const [, close, tag, , self] = m;
    if (close) {
      const top = stack.pop();
      if (top !== tag) { errors.push(`penutup </${tag}> tidak cocok dengan <${top}>`); break; }
    } else if (!self) stack.push(tag);
  }
  if (!errors.length && stripped.slice(last).trim()) errors.push('sisa teks di luar tag');
  if (!errors.length && stack.length) errors.push('tag belum ditutup: ' + stack.join(','));
  if (errors.length) throw new Error(`SVG ${name} tidak valid: ${errors.join('; ')}`);
  return bytes;
}

module.exports = {
  esc, f, clamp, lerp, textWidth, truncate, wrapText,
  MONTHS, MONTHS_SHORT, thousands, shortNum, pct1, plural, pad, joinedID, relativeTimeID,
  hashSeed, mulberry32, hexToRgb, luminance, mix, visibleOn,
  REDUCED_CSS, svgDoc, text, validateSvg,
};
