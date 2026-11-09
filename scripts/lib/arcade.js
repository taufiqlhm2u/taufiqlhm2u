'use strict';
// Komponen 5: Arcade Cabinet. Level platformer dari 26 minggu kontribusi terakhir.
const { f, esc, clamp, text, svgDoc, wrapText, mulberry32, hashSeed, pad, truncate } = require('./utils');
const { icon, HEART, pixelText, pixelWidth, pixelClean } = require('./icons');

function renderArcade(data, t) {
  const W = t.width, sc = t.screen;
  const u = data.user, st = data.stats;
  const rnd = mulberry32(hashSeed(data.login + ':' + data.calendar.total)); // seed deterministik per user

  // ---- geometri kabinet ----
  const cab = { x: 16, y: 8, w: 568 };
  const mq = { x: 32, y: 24, w: 536, h: 48 };
  const bz = { x: 32, y: 88, w: 536, h: 304 };
  const scr = { x: 44, y: 100, w: 512, h: 280 };
  const hudH = 36;
  const fx = scr.x, fw = scr.w, fy = scr.y + hudH, baseY = scr.y + scr.h;
  const caption = 'Each column is one of my last 26 weeks: the taller the column, the more contributions that week. Hearts mark my busiest weeks and the number is that week\'s contributions. CONTRIBS = total over these 26 weeks, STREAK = days in a row with contributions, YEARS = time on GitHub.';
  const capLines = wrapText(caption, 508, 12);
  const capTop = bz.y + bz.h + 12;
  const capBottom = capTop + capLines.length * 16;
  const panelY = capBottom + 12, panelH = 88;
  const cabBottom = panelY + panelH + 16;
  const H = cabBottom + 8;

  // ---- medan dari data ----
  const n = 26, cw = fw / n;
  const totals = st.weekTotals.slice(-n);
  const maxC = Math.max(...totals, 0);
  const minH = 10, maxH = 124;
  const heights = totals.map((c) => (maxC > 0 ? Math.round(minH + (maxH - minH) * Math.pow(c / maxC, 0.7)) : minH));
  const surf = heights.map((h) => baseY - h);
  const colX = (i) => fx + i * cw;
  const nz = totals.filter((c) => c > 0).slice().sort((a, b) => a - b);
  const lvl = (c) => {
    if (c <= 0 || !nz.length) return 0;
    const r = nz.indexOf(c) / Math.max(1, nz.length - 1);
    return r < 0.34 ? 0 : r < 0.67 ? 1 : r < 0.9 ? 2 : 3;
  };

  // ---- jalur lari: y sebagai fungsi x, lompat di tanjakan ----
  const wins = [];
  for (let j = 1; j < n; j++) {
    const bx = colX(j), y0 = surf[j - 1], y1 = surf[j], dy = y1 - y0;
    if (dy < -4) wins.push({ a: bx - cw * 0.65, b: bx + cw * 0.2, y0, y1, peak: Math.max(12, -dy + 10), jump: true });
    else if (dy > 4) wins.push({ a: bx - 2, b: bx + 6, y0, y1, peak: 0, jump: false });
  }
  const yAt = (x) => {
    if (x <= fx) return surf[0];
    if (x >= fx + fw) return surf[n - 1];
    for (const w of wins) {
      if (x >= w.a && x <= w.b) {
        const tt = (x - w.a) / (w.b - w.a);
        const e = w.jump ? tt : tt * tt * (3 - 2 * tt);
        return w.y0 + (w.y1 - w.y0) * e - (w.jump ? w.peak * 4 * tt * (1 - tt) : 0);
      }
    }
    return surf[clamp(Math.floor((x - fx) / cw), 0, n - 1)];
  };
  const pts = [];
  for (let x = fx - 30; x <= fx + fw + 30; x += 1.5) pts.push([x, yAt(x)]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  const fracAtX = (x) => {
    let i = 1; while (i < pts.length - 1 && pts[i][0] < x) i++;
    const a = pts[i - 1], b = pts[i], r = b[0] === a[0] ? 0 : (x - a[0]) / (b[0] - a[0]);
    return (cum[i - 1] + (cum[i] - cum[i - 1]) * clamp(r, 0, 1)) / total;
  };
  const T = clamp(total / 105, 5.5, 9).toFixed(1);
  const runPath = 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L');
  const jumpTimes = wins.filter((w) => w.jump).map((w) => [fracAtX(w.a), fracAtX(w.b)]);

  // ---- koin: 3 sampai 5 minggu tersibuk (hanya yang punya kontribusi) ----
  const ranked = totals.map((c, i) => ({ c, i })).filter((o) => o.c > 0).sort((a, b) => b.c - a.c || a.i - b.i);
  const coinCount = ranked.length >= 3 ? clamp(Math.round(3 + Math.min(2, (st.score / 120))), 3, 5) : ranked.length;
  const coins = ranked.slice(0, coinCount).map((o, k) => {
    const cx = colX(o.i) + cw / 2;
    return { cx, cy: surf[o.i] - 26, c: o.c, tc: fracAtX(cx), color: k === 0 ? t.accent.red : t.accent.blue, rank: k };
  }).sort((a, b) => a.cx - b.cx);
  coins.forEach((c, i) => { c.lift = i > 0 && c.cx - coins[i - 1].cx < 44 ? (coins[i - 1].lift + 14) % 28 : 0; });

  // ---- defs ----
  const defs = [];
  defs.push(`<image id="avd" width="96" height="96" href="${u.avatarSmall}" preserveAspectRatio="xMidYMid slice"/>`);
  defs.push(`<clipPath id="c9"><circle r="9"/></clipPath><clipPath id="c10"><circle cx="0" cy="0" r="10"/></clipPath>`);
  defs.push(`<clipPath id="scr"><rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${scr.h}" rx="10"/></clipPath>`);
  defs.push(`<path id="rp" d="${runPath}"/>`);
  defs.push(`<path id="hrt" d="${HEART}"/>`);
  const head = `<g clip-path="url(#c9)"><use href="#avd" xlink:href="#avd" transform="translate(-9 -9) scale(.1875)"/></g><circle r="9.5" fill="none" stroke="#ffffff" stroke-width="1.5"/>`;
  const sprite = (animated) => {
    const legA = animated
      ? `<rect x="-5" y="-7" width="4" height="7" fill="#e7e9ea"><animate attributeName="height" values="7;3" keyTimes="0;.5" dur=".36s" calcMode="discrete" repeatCount="indefinite"/></rect>`
      : `<rect x="-5" y="-7" width="4" height="7" fill="#e7e9ea"/>`;
    const legB = animated
      ? `<rect x="1" y="-7" width="4" height="7" fill="#e7e9ea"><animate attributeName="height" values="3;7" keyTimes="0;.5" dur=".36s" calcMode="discrete" repeatCount="indefinite"/></rect>`
      : `<rect x="1" y="-3" width="4" height="3" fill="#e7e9ea"/><rect x="1" y="-7" width="4" height="7" fill="#e7e9ea"/>`;
    const bob = animated ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.5;0 0" dur=".36s" repeatCount="indefinite"/>` : '';
    return `<g shape-rendering="crispEdges">${legA}${legB}</g><g>${bob}<rect x="-6" y="-17" width="12" height="11" rx="2" fill="${t.accent.blue}"/><rect x="-9" y="-16" width="3" height="7" fill="${t.accent.blue}"/><rect x="6" y="-16" width="3" height="7" fill="${t.accent.blue}"/><g transform="translate(0 -26)">${head}</g></g>`;
  };
  defs.push(`<g id="rn">${sprite(false)}</g>`);
  defs.push(`<g id="ra">${sprite(true)}</g>`);

  const css =
    `.tw{animation:tw 2.4s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}` +
    `.sp{transform-box:fill-box;transform-origin:center;animation:sp 1.4s ease-in-out infinite}@keyframes sp{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.18)}}` +
    `.led{animation:ld 1.6s steps(1,end) infinite}.led2{animation:ld 1.6s steps(1,end) infinite;animation-delay:-.8s}@keyframes ld{0%{opacity:1}50%{opacity:.2}100%{opacity:1}}`;

  const b = [];
  // ---- badan kabinet ----
  b.push(`<rect x="${cab.x}" y="${cab.y}" width="${cab.w}" height="${cabBottom - cab.y}" rx="20" fill="${t.surface}" stroke="${t.border}"/>`);

  // marquee atas
  b.push(`<rect x="${mq.x}" y="${mq.y}" width="${mq.w}" height="${mq.h}" rx="10" fill="${t.screenBg}" stroke="${t.border}"/>`);
  const mqName = pixelClean(u.login).trim() || 'ARCADE';
  const mqText = mqName.length > 16 ? mqName.slice(0, 16) : mqName;
  b.push(pixelText(mqText, W / 2, mq.y + 13, 3, t.accent.blue, { anchor: 'middle' }));
  [0, 1, 2].forEach((k) => {
    const cls = k % 2 ? 'led2' : 'led';
    b.push(`<circle class="${cls}" cx="${mq.x + 18 + k * 14}" cy="${mq.y + 24}" r="3.5" fill="${t.accent.red}"/>`);
    b.push(`<circle class="${k % 2 ? 'led' : 'led2'}" cx="${mq.x + mq.w - 18 - k * 14}" cy="${mq.y + 24}" r="3.5" fill="${t.accent.yellow}"/>`);
  });

  // bezel dan layar
  b.push(`<rect x="${bz.x}" y="${bz.y}" width="${bz.w}" height="${bz.h}" rx="18" fill="${t.bezel}" stroke="${t.border}"/>`);
  b.push(`<rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${scr.h}" rx="10" fill="${t.screenBg}"/>`);

  // isi layar (di-clip ke layar)
  const g = [];
  // bintang latar, sebagian berkedip
  const nStars = 34;
  let twAnim = '';
  for (let i = 0; i < nStars; i++) {
    const x = fx + 6 + rnd() * (fw - 12), y = fy + 6 + rnd() * (baseY - fy - 80), s = rnd() < 0.2 ? 2 : 1, o = 0.35 + rnd() * 0.45;
    const delay = -(rnd() * 3).toFixed(2);
    if (i % 4 === 0) twAnim += `<rect class="tw" style="animation-delay:${delay}s" x="${f(x)}" y="${f(y)}" width="${s}" height="${s}" fill="${sc.text}"/>`;
    else g.push(`<rect x="${f(x)}" y="${f(y)}" width="${s}" height="${s}" fill="${sc.text}" opacity="${f(o)}"/>`);
  }
  g.push(`<g class="m">${twAnim}</g>`);
  // siluet kota di belakang medan
  let sx = fx - 4;
  while (sx < fx + fw) {
    const bw = 14 + Math.floor(rnd() * 22), bh = 18 + Math.floor(rnd() * 52);
    g.push(`<rect x="${f(sx)}" y="${f(baseY - bh)}" width="${bw - 2}" height="${bh}" fill="${t.skyline}"/>`);
    sx += bw;
  }
  // medan: tiap kolom = satu minggu
  totals.forEach((c, i) => {
    const x = Math.round(colX(i)), w = Math.round(colX(i + 1)) - x - 1, y = surf[i], h = heights[i];
    g.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${sc.heat[lvl(c)]}" shape-rendering="crispEdges"/>`);
    g.push(`<rect x="${x}" y="${y}" width="${w}" height="3" fill="${t.accent.blue}" shape-rendering="crispEdges"/>`);
  });

  if (!coins.length) {
    g.push(text('No coins in this level yet', fx + fw / 2, fy + 56, { size: 14, fill: sc.sub, anchor: 'middle' }, t));
    g.push(text('One contribution is enough to spawn one', fx + fw / 2, fy + 76, { size: 12, fill: sc.sub, anchor: 'middle' }, t));
  }

  const coinShape = (c, scl) =>
    `<g transform="translate(${f(c.cx - 9 * scl)} ${f(c.cy - 9 * scl)}) scale(${f(0.75 * scl)})"><g class="sp" style="animation-delay:-${(rnd() * 1.4).toFixed(2)}s"><use href="#hrt" xlink:href="#hrt" fill="${c.color}" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/></g></g>`;
  // lapisan bergerak
  const mv = [];
  // koin dengan animasi "diambil" tepat saat pelari lewat
  for (const c of coins) {
    const s = c.rank === 0 ? 1.25 : 1;
    const k1 = Math.min(c.tc, 0.97), k2 = Math.min(k1 + 0.03, 0.99);
    const popK = [0, k1, Math.min(k1 + 0.012, 0.992), Math.min(k1 + 0.06, 0.994), Math.min(k1 + 0.09, 0.996), 1].map((v) => v.toFixed(4)).join(';');
    mv.push(`<g>${coinShape(c, s)}<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${k1.toFixed(4)};${k2.toFixed(4)};.996;1" dur="${T}s" repeatCount="indefinite"/></g>`);
    mv.push(`<g opacity="0">${pixelText('+' + c.c, c.cx, c.cy - 26 - c.lift, 2, '#ffffff', { anchor: 'middle' })}` +
      `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="${popK}" dur="${T}s" repeatCount="indefinite"/>` +
      `<animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 -4;0 -12;0 -16;0 -16" keyTimes="${popK}" dur="${T}s" repeatCount="indefinite"/></g>`);
  }
  // debu di belakang karakter: tiga titik yang mengikuti jalur dengan jeda waktu
  [[0.08, 4, 0.6], [0.16, 3, 0.4], [0.24, 2, 0.25]].forEach(([lag, s, o]) => {
    mv.push(`<g opacity="${o}"><rect x="${-s / 2}" y="${-s - 1}" width="${s}" height="${s}" fill="${sc.sub}"/><animateMotion dur="${T}s" repeatCount="indefinite" begin="-${(T - lag).toFixed(2)}s"><mpath href="#rp" xlink:href="#rp"/></animateMotion></g>`);
  });
  mv.push(`<g><use href="#ra" xlink:href="#ra"/><animateMotion dur="${T}s" repeatCount="indefinite"><mpath href="#rp" xlink:href="#rp"/></animateMotion></g>`);
  g.push(`<g class="m">${mv.join('')}</g>`);

  // pose diam untuk prefers-reduced-motion
  const st0 = [];
  for (const c of coins) {
    st0.push(coinShape(c, c.rank === 0 ? 1.25 : 1).replace('class="sp"', 'class="sp2"'));
    st0.push(pixelText('+' + c.c, c.cx, c.cy - 26 - c.lift, 2, '#ffffff', { anchor: 'middle' }));
  }
  st0.push(`<g transform="translate(${f(fx + cw * 1.5)} ${f(surf[1])})"><use href="#rn" xlink:href="#rn"/></g>`);
  g.push(`<g class="s">${st0.join('')}</g>`);

  b.push(`<g clip-path="url(#scr)">${g.join('')}`);

  // ---- HUD gaya top bar X ----
  b.push(`<rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${hudH}" fill="${t.screenBg}"/><path d="M${scr.x} ${scr.y + hudH - 0.5}H${scr.x + scr.w}" stroke="${sc.border}"/>`);
  const hy = scr.y + (hudH - 14) / 2;
  b.push(`<g transform="translate(${scr.x + 26} ${scr.y + hudH / 2})"><g clip-path="url(#c10)"><use href="#avd" xlink:href="#avd" transform="translate(-10 -10) scale(.2083)"/></g><circle r="10.5" fill="none" stroke="${sc.border}"/></g>`);
  // kiri: total kontribusi 26 minggu. tengah: tahun di GitHub. kanan: streak hari berturut-turut
  const lbl = 'CONTRIBS ';
  b.push(pixelText(lbl, scr.x + 44, hy, 2, sc.sub));
  b.push(pixelText(String(st.score), scr.x + 44 + pixelWidth(lbl, 2), hy, 2, sc.text));
  const cxm = scr.x + scr.w / 2 + 22;
  b.push(pixelText('YEARS ', cxm, hy, 2, sc.sub));
  b.push(pixelText(String(st.level), cxm + pixelWidth('YEARS ', 2), hy, 2, sc.text));
  const lives = st.streak + 'D';
  const rEnd = scr.x + scr.w - 16;
  const livesW = pixelWidth(lives, 2);
  b.push(pixelText(lives, rEnd, hy, 2, sc.text, { anchor: 'end' }));
  b.push(icon('heartFill', rEnd - livesW - 22, hy - 1, 16, t.accent.red));
  b.push(pixelText('STREAK', rEnd - livesW - 28, hy, 2, sc.sub, { anchor: 'end' }));
  b.push('</g>');

  // ---- caption ----
  capLines.forEach((l, i) => b.push(text(l, W / 2, capTop + 12 + i * 16, { size: 12, fill: t.sub, anchor: 'middle' }, t)));

  // ---- panel kontrol ----
  b.push(`<rect x="32" y="${panelY}" width="536" height="${panelH}" rx="16" fill="${t.surface2}" stroke="${t.border}"/>`);
  const py = panelY + panelH / 2;
  // joystick: miring ke kanan saat lari, tegak saat lompat
  const jx = 100;
  b.push(`<circle cx="${jx}" cy="${py + 10}" r="18" fill="${t.border}"/>`);
  const stick = (rot) => `<g transform="rotate(${rot} ${jx} ${py + 10})"><rect x="${jx - 3}" y="${py - 20}" width="6" height="30" fill="${t.sub}"/><circle cx="${jx}" cy="${py - 22}" r="11" fill="${t.accent.red}"/></g>`;
  b.push(`<g class="s">${stick(0)}</g>`);
  const kt = [0], rv = ['10'];
  for (const [a, e] of jumpTimes) { kt.push(a, e); rv.push('-14', '10'); }
  kt.push(1); rv.push('10');
  const ktS = kt.map((v) => clamp(v, 0, 1).toFixed(4)).join(';');
  b.push(`<g class="m"><g><animateTransform attributeName="transform" type="rotate" values="${rv.map((v) => `${v} ${jx} ${py + 10}`).join(';')}" keyTimes="${ktS}" dur="${T}s" calcMode="discrete" repeatCount="indefinite"/>${stick(0).replace(/^<g[^>]*>/, '').replace(/<\/g>$/, '')}</g></g>`);

  // tombol Mulai seperti tombol Follow
  const sbw = 104;
  b.push(`<rect x="${f(W / 2 - sbw / 2)}" y="${py - 18}" width="${sbw}" height="36" rx="18" fill="${t.btnBg}"/>`);
  b.push(pixelText('START', W / 2, py - 7, 2, t.btnText, { anchor: 'middle' }));

  // dua tombol: A menekan saat lompat, B menekan saat koin diambil
  const press = (times) => {
    const k = [0], v = ['0 0'];
    for (const [a, e] of times) { k.push(a, e); v.push('0 2', '0 0'); }
    k.push(1); v.push('0 0');
    return `<animateTransform attributeName="transform" type="translate" values="${v.join(';')}" keyTimes="${k.map((x) => clamp(x, 0, 1).toFixed(4)).join(';')}" dur="${T}s" calcMode="discrete" repeatCount="indefinite"/>`;
  };
  const coinTimes = coins.map((c) => [c.tc, Math.min(c.tc + 0.04, 0.995)]);
  [[448, t.accent.blue, jumpTimes], [506, t.accent.red, coinTimes]].forEach(([bx, col, times]) => {
    b.push(`<circle cx="${bx}" cy="${py + 3}" r="15" fill="${t.border}"/>`);
    b.push(`<g class="s"><circle cx="${bx}" cy="${py}" r="13" fill="${col}"/></g>`);
    b.push(`<g class="m"><g><circle cx="${bx}" cy="${py}" r="13" fill="${col}"/>${press(times)}</g></g>`);
  });

  const desc = `Platformer level built from my last 26 weeks of contributions: ${st.score} contributions, a ${st.streak}-day streak, ${st.level} years on GitHub. ${coins.length} hearts mark the busiest weeks.`;
  return svgDoc({ w: W, h: H, t, defs: defs.join(''), css, body: b.join(''), title: 'Contribution arcade', desc });
}

module.exports = { renderArcade };
