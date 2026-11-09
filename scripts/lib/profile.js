'use strict';
// Komponen 1: header profil ala X (banner, avatar, tombol Follow, meta, statistik, tab bar).
const { esc, f, text, svgDoc, textWidth, wrapText, joinedID, thousands, truncate } = require('./utils');
const { icon, verifiedBadge } = require('./icons');

function renderProfile(data, t) {
  const W = t.width, u = data.user;
  const name = u.name || u.login;
  const body = [];
  const bannerH = 200, avR = 66.5, avCx = 16 + avR, avCy = bannerH;
  const defs =
    `<linearGradient id="bn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.bannerFrom}"/><stop offset="1" stop-color="${t.bannerTo}"/></linearGradient>` +
    `<clipPath id="av"><circle cx="${f(avCx)}" cy="${f(avCy)}" r="${f(avR - 4)}"/></clipPath>`;

  // banner, lalu avatar yang menimpa tepi bawahnya
  if (data.bannerUri) body.push(`<image href="${data.bannerUri}" width="${W}" height="${bannerH}" preserveAspectRatio="xMidYMid slice"/>`);
  else body.push(`<rect width="${W}" height="${bannerH}" fill="url(#bn)"/>`);
  body.push(`<circle cx="${f(avCx)}" cy="${f(avCy)}" r="${f(avR)}" fill="${t.bg}"/>`);
  body.push(`<image href="${u.avatar}" x="${f(avCx - avR + 4)}" y="${f(avCy - avR + 4)}" width="${f((avR - 4) * 2)}" height="${f((avR - 4) * 2)}" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice"/>`);

  // tombol Follow
  const bw = 88, bx = W - 16 - bw, by = bannerH + 12;
  body.push(`<rect x="${bx}" y="${by}" width="${bw}" height="36" rx="18" fill="${t.btnBg}"/>`);
  body.push(text('Follow', bx + bw / 2, by + 23, { size: 15, weight: 700, fill: t.btnText, anchor: 'middle' }, t));

  // nama, badge verified, handle
  let y = avCy + avR + 28;
  const nameShown = truncate(name, W - 32 - 28, 20, { bold: true });
  body.push(text(nameShown, 16, y, { size: 20, weight: 800, fill: t.text }, t));
  body.push(verifiedBadge(16 + textWidth(nameShown, 20, { bold: true }) + 4, y - 17, 22, t.accent.blue));
  y += 22;
  body.push(text('@' + u.login, 16, y, { size: 15, fill: t.sub }, t));

  // bio
  if (data.bio) {
    y += 12;
    for (const line of wrapText(data.bio, W - 32, 15)) { y += 20; body.push(text(line, 16, y, { size: 15, fill: t.text }, t)); }
  }

  // meta: lokasi, blog, tanggal bergabung. Field kosong dilewati, baris turun kalau tidak muat.
  const meta = [];
  if (u.location) meta.push({ ic: 'pin', label: u.location, color: t.sub });
  if (u.blog) meta.push({ ic: 'link', label: u.blog.replace(/^https?:\/\//, '').replace(/\/$/, ''), color: t.link });
  const joined = joinedID(u.createdAt);
  if (joined) meta.push({ ic: 'calendar', label: joined, color: t.sub });
  y += 16;
  let mx = 16, rowOpen = false;
  for (const m of meta) {
    const label = truncate(m.label, W - 32 - 22, 15);
    const wItem = 18 + 4 + textWidth(label, 15);
    if (rowOpen && mx + wItem > W - 16) { y += 24; mx = 16; }
    if (!rowOpen) { y += 20; rowOpen = true; }
    body.push(icon('' + m.ic, mx, y - 15, 18, t.sub, { sw: 1.8 }));
    body.push(text(label, mx + 22, y, { size: 15, fill: m.color }, t));
    mx += wItem + 16;
  }

  // statistik
  y += 28;
  const s1 = thousands(u.following), s2 = thousands(u.followers);
  body.push(text(s1, 16, y, { size: 14, weight: 700, fill: t.text }, t));
  const x1 = 16 + textWidth(s1, 14, { bold: true }) + 4;
  body.push(text('Mengikuti', x1, y, { size: 14, fill: t.sub }, t));
  const x2 = x1 + textWidth('Mengikuti', 14) + 20;
  body.push(text(s2, x2, y, { size: 14, weight: 700, fill: t.text }, t));
  body.push(text('Pengikut', x2 + textWidth(s2, 14, { bold: true }) + 4, y, { size: 14, fill: t.sub }, t));

  // tab bar
  const tabTop = y + 16, tabH = 52;
  const tabs = ['Postingan', 'Balasan', 'Sorotan', 'Media'];
  const tw = W / tabs.length;
  tabs.forEach((label, i) => {
    const cx = i * tw + tw / 2;
    body.push(text(label, cx, tabTop + 32, { size: 15, weight: i === 0 ? 700 : 500, fill: i === 0 ? t.text : t.sub, anchor: 'middle' }, t));
    if (i === 0) {
      const uw = textWidth(label, 15, { bold: true }) + 32;
      body.push(`<rect x="${f(cx - uw / 2)}" y="${tabTop + tabH - 4}" width="${f(uw)}" height="4" rx="2" fill="${t.accent.blue}"/>`);
    }
  });
  body.push(`<path d="M0 ${tabTop + tabH - 0.5}H${W}" stroke="${t.border}" stroke-width="1"/>`);
  const H = tabTop + tabH;

  return svgDoc({
    w: W, h: H, t, defs,
    title: `Profil GitHub ${name} (@${u.login})`,
    desc: `${name}, ${(data.bio || 'tanpa bio').replace(/\s+/g, ' ')} ${thousands(u.followers)} pengikut, ${thousands(u.following)} mengikuti.`,
    body: body.join(''),
  });
}

module.exports = { renderProfile };
