'use strict';
// Komponen 7: tata surya. Avatar = matahari, bahasa = planet, push terbaru = komet.
const { f, esc, clamp, text, svgDoc, wrapText, truncate, mulberry32, hashSeed, visibleOn, pct1 } = require('./utils');

const ellipsePath = (cx, cy, rx, ry, rot = 0) => {
  const c = Math.cos(rot), s = Math.sin(rot);
  const p = (a) => [cx + a * rx * c, cy + a * rx * s];
  const [x0, y0] = p(1), [x1, y1] = p(-1);
  const deg = (rot * 180) / Math.PI;
  return `M${f(x0)} ${f(y0)}A${f(rx)} ${f(ry)} ${f(deg)} 0 1 ${f(x1)} ${f(y1)}A${f(rx)} ${f(ry)} ${f(deg)} 0 1 ${f(x0)} ${f(y0)}Z`;
};

function renderSolar(data, t) {
  const W = t.width, u = data.user, st = data.stats;
  const rnd = mulberry32(hashSeed(data.login + ':' + data.calendar.total + ':solar'));
  const name = u.name || u.login;
  const planets = data.langs.slice(0, 8);
  const comets = st.fresh.slice(0, 4);

  // judul dan subjudul menjelaskan isi grafik
  const head = [];
  head.push(text('My language solar system', 16, 36, { size: 20, weight: 800, fill: t.text }, t));
  let y = 36;
  for (const l of wrapText('Each planet is a language: the bigger the planet, the more code I wrote in it. Small moons count the repos using that language, and comets are repos I pushed to in the last 14 days.', W - 32, 15, { maxLines: 3 })) { y += 22; head.push(text(l, 16, y, { size: 15, fill: t.sub }, t)); }

  // geometri sistem
  const N = planets.length;
  const R0 = 84, step = N > 1 ? Math.min(46, (262 - R0) / (N - 1)) : 0;
  const rxs = planets.map((_, i) => R0 + i * step);
  const rxMax = Math.max(N ? rxs[N - 1] : R0, R0 + 40) + 20;
  const tilt = 0.5;
  const cometSpecs = comets.map((c, i) => {
    const a = 236 + rnd() * 26, b = 56 + rnd() * 28;
    const th = ((i % 2 ? 1 : -1) * (14 + rnd() * 24) * Math.PI) / 180;
    return { c, a, b, th, period: 14 + rnd() * 8, phase: rnd(), len: 30 + 90 * (1 - clamp(c.daysAgo / 14, 0, 1)) };
  });
  const cometExtent = cometSpecs.reduce((m, s) => Math.max(m, Math.hypot(s.a * Math.sin(s.th), s.b * Math.cos(s.th)) + 10), 0);
  const halfH = Math.min(190, Math.max(rxMax * tilt + 24, cometExtent + 12));
  const cx = W / 2, cy = y + 24 + halfH;
  const sysBottom = cy + halfH;

  // keterangan di bawah
  const foot = [];
  let fy = sysBottom + 20;
  foot.push(text('Planets are my languages, comets are my latest pushes.', W / 2, fy, { size: 13, fill: t.sub, anchor: 'middle' }, t));
  if (st.archived) { fy += 18; foot.push(text(`The asteroid belt is my ${st.archived} archived ${st.archived === 1 ? 'repo' : 'repos'}.`, W / 2, fy, { size: 12, fill: t.sub, anchor: 'middle' }, t)); }
  const H = fy + 20;

  const defs = [], css = '.tw{animation:tw 2.6s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.2}50%{opacity:.9}}';
  defs.push(`<clipPath id="sun"><circle cx="${f(cx)}" cy="${f(cy)}" r="30"/></clipPath>`);
  defs.push(`<radialGradient id="glow"><stop offset="0" stop-color="${t.accent.blue}" stop-opacity=".32"/><stop offset="1" stop-color="${t.accent.blue}" stop-opacity="0"/></radialGradient>`);

  const b = [];
  // bintang latar, seed deterministik
  let tw = '';
  for (let i = 0; i < 36; i++) {
    const x = 8 + rnd() * (W - 16), yy = y + 12 + rnd() * (sysBottom - y), r = rnd() < 0.15 ? 1.6 : 1;
    const dx = Math.hypot((x - cx) / 1, (yy - cy) / tilt);
    if (dx < 60) continue;
    if (i % 5 === 0) tw += `<circle class="tw" style="animation-delay:-${(rnd() * 2.6).toFixed(2)}s" cx="${f(x)}" cy="${f(yy)}" r="${r}" fill="${t.text}"/>`;
    else b.push(`<circle cx="${f(x)}" cy="${f(yy)}" r="${r}" fill="${t.sub}" opacity="${f(0.25 + rnd() * 0.3)}"/>`);
  }
  b.push(`<g class="m">${tw}</g>`);

  // orbit. Tanpa bahasa: dua orbit putus-putus sebagai placeholder
  if (N) rxs.forEach((rx) => b.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(rx * tilt)}" fill="none" stroke="${t.border}" stroke-width="1"/>`));
  else [R0, R0 + 50].forEach((rx) => b.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${rx}" ry="${f(rx * tilt)}" fill="none" stroke="${t.border}" stroke-dasharray="4 6"/>`));
  if (!N) b.push(text('No languages detected yet', cx, cy + (R0 + 50) * tilt + 22, { size: 13, fill: t.sub, anchor: 'middle' }, t));

  // sabuk asteroid di luar orbit terakhir = jumlah repo arsip
  if (st.archived) {
    const brx = (N ? rxs[N - 1] : R0 + 50) + 16;
    for (let i = 0; i < Math.min(st.archived, 28); i++) {
      const a = rnd() * Math.PI * 2, j = (rnd() - 0.5) * 8;
      b.push(`<circle cx="${f(cx + (brx + j) * Math.cos(a))}" cy="${f(cy + (brx + j) * tilt * Math.sin(a))}" r="${f(1.6 + rnd() * 1.2)}" fill="${t.sub}" opacity=".9"/>`);
    }
  }

  // matahari
  b.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="64" fill="url(#glow)"/>`);
  b.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="33" fill="${t.bg}"/>`);
  b.push(`<image href="${u.avatarSmall}" x="${f(cx - 30)}" y="${f(cy - 30)}" width="60" height="60" clip-path="url(#sun)" preserveAspectRatio="xMidYMid slice"/>`);
  b.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="31.5" fill="none" stroke="${t.accent.blue}" stroke-width="3"/>`);

  // planet
  const maxPct = planets.length ? planets[0].pct : 1;
  const mv = [], sv = [];
  planets.forEach((l, i) => {
    const R = clamp(16 * Math.sqrt(l.pct / maxPct), 5, 16);
    const color = visibleOn(l.color, t.mode);
    const rx = rxs[i], ry = rx * tilt;
    const period = 12 * Math.pow(rx / R0, 1.5), phase = rnd();
    let g = '';
    if (i === 0) g += `<ellipse rx="${f(R * 1.8)}" ry="${f(R * 0.5)}" fill="none" stroke="${color}" stroke-width="1.5" opacity=".7" transform="rotate(-18)"/>`;
    g += `<circle r="${f(R)}" fill="${color}"/><circle cx="${f(-R * 0.3)}" cy="${f(-R * 0.3)}" r="${f(R * 0.35)}" fill="#ffffff" opacity=".2"/>`;
    if (i === 0) g += `<path d="M${f(-R * 1.8)} 0A${f(R * 1.8)} ${f(R * 0.5)} 0 0 0 ${f(R * 1.8)} 0" fill="none" stroke="${color}" stroke-width="1.5" transform="rotate(-18)"/>`;
    const lab = esc(truncate(l.name, 90, 11));
    g += `<text x="${f(R + 6)}" y="4" font-family='${t.font}' font-size="11" fill="none" stroke="${t.bg}" stroke-width="3" stroke-linejoin="round">${lab}</text>`;
    g += `<text x="${f(R + 6)}" y="4" font-family='${t.font}' font-size="11" fill="${t.text}">${lab}</text>`;
    defs.push(`<g id="pl${i}">${g}</g>`);

    const nMoons = Math.min(l.repoCount, 4);
    let moonsM = '', moonsS = '';
    for (let k = 0; k < nMoons; k++) {
      const mr = R + 7 + k * 4, mp = 2.2 + k * 1.1, ph = rnd();
      const path = `M${f(mr)} 0A${f(mr)} ${f(mr * 0.6)} 0 1 1 ${f(-mr)} 0A${f(mr)} ${f(mr * 0.6)} 0 1 1 ${f(mr)} 0Z`;
      moonsM += `<circle r="1.8" fill="${t.text}"><animateMotion dur="${mp.toFixed(1)}s" begin="-${(ph * mp).toFixed(2)}s" repeatCount="indefinite" path="${path}"/></circle>`;
      const ma = ph * Math.PI * 2;
      moonsS += `<circle cx="${f(mr * Math.cos(ma))}" cy="${f(mr * 0.6 * Math.sin(ma))}" r="1.8" fill="${t.text}"/>`;
    }
    mv.push(`<g><use href="#pl${i}" xlink:href="#pl${i}"/>${moonsM}<animateMotion dur="${period.toFixed(1)}s" begin="-${(phase * period).toFixed(2)}s" repeatCount="indefinite" path="${ellipsePath(cx, cy, rx, ry)}"/></g>`);
    const a = phase * Math.PI * 2;
    sv.push(`<g transform="translate(${f(cx + rx * Math.cos(a))} ${f(cy + ry * Math.sin(a))})"><use href="#pl${i}" xlink:href="#pl${i}"/>${moonsS}</g>`);
  });

  // komet: elips miring, ekor gradient, panjang ekor mengikuti kebaruan push
  const palette = [t.accent.blue, t.accent.red, t.accent.green, t.accent.yellow];
  cometSpecs.forEach((s, i) => {
    const col = i === 0 ? t.accent.blue : palette[i % 4];
    const ccx = cx - s.a * 0.12 * Math.cos(s.th), ccy = cy - s.a * 0.12 * Math.sin(s.th);
    const path = ellipsePath(ccx, ccy, s.a, s.b, s.th);
    defs.push(`<linearGradient id="cg${i}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${f(-s.len)}" y2="0"><stop offset="0" stop-color="${col}" stop-opacity=".9"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient>`);
    const body = `<polygon points="0,-3 ${f(-s.len)},0 0,3" fill="url(#cg${i})"/><circle r="3.5" fill="${col}"/><circle r="1.6" fill="#ffffff"/>`;
    const cl = esc(truncate(s.c.name, 110, 10));
    const label = `<text x="9" y="-7" font-family='${t.font}' font-size="10" fill="none" stroke="${t.bg}" stroke-width="3" stroke-linejoin="round">${cl}</text><text x="9" y="-7" font-family='${t.font}' font-size="10" fill="${t.sub}">${cl}</text>`;
    const begin = `-${(s.phase * s.period).toFixed(2)}s`;
    mv.push(`<g>${body}<animateMotion dur="${s.period.toFixed(1)}s" begin="${begin}" repeatCount="indefinite" rotate="auto" path="${path}"/></g>`);
    mv.push(`<g>${label}<animateMotion dur="${s.period.toFixed(1)}s" begin="${begin}" repeatCount="indefinite" path="${path}"/></g>`);
    // pose diam: posisi dan arah teruraikan dari parameter elips
    const u0 = s.phase * Math.PI * 2, c = Math.cos(s.th), sn = Math.sin(s.th);
    const lx = s.a * Math.cos(u0), ly = s.b * Math.sin(u0);
    const px = ccx + lx * c - ly * sn, py = ccy + lx * sn + ly * c;
    const dx = -s.a * Math.sin(u0), dy = s.b * Math.cos(u0);
    const ang = (Math.atan2(dx * sn + dy * c, dx * c - dy * sn) * 180) / Math.PI;
    sv.push(`<g transform="translate(${f(px)} ${f(py)})"><g transform="rotate(${f(ang)})">${body}</g>${label}</g>`);
  });
  b.push(`<g class="m">${mv.join('')}</g><g class="s">${sv.join('')}</g>`);

  const desc = `Solar system of languages: ${N} languages as planets, ${comets.length} recently pushed repos as comets, ${st.archived} archived repos as an asteroid belt.`;
  return svgDoc({ w: W, h: H, t, defs: defs.join(''), css, title: 'My language solar system', desc, body: head.join('') + b.join('') + foot.join('') });
}

module.exports = { renderSolar };
