'use strict';
// Komponen 2: repo pinned sebagai kartu tweet.
const { esc, f, text, svgDoc, textWidth, wrapText, truncate, shortNum, relativeTimeID, visibleOn } = require('./utils');
const { icon } = require('./icons');

function renderRepoCard(data, t, index) {
  const W = t.width, u = data.user;
  const repo = data.featured[index] || null;
  const X = 68, CW = W - X - 16; // kolom isi
  const body = [];
  const defs = `<clipPath id="av"><circle cx="36" cy="32" r="20"/></clipPath>`;
  const name = u.name || u.login;

  body.push(`<image href="${u.avatarSmall}" x="16" y="12" width="40" height="40" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice"/>`);

  let y = 12;
  // baris header: nama, @username, waktu
  const nameShown = truncate(name, 200, 15, { bold: true });
  let hx = X;
  body.push(text(nameShown, hx, y + 15, { size: 15, weight: 700, fill: t.text }, t));
  hx += textWidth(nameShown, 15, { bold: true }) + 4;
  const handle = '@' + u.login;
  body.push(text(handle, hx, y + 15, { size: 15, fill: t.sub }, t));
  hx += textWidth(handle, 15) + 4;
  if (repo && repo.pushedAt) {
    const when = '· updated ' + relativeTimeID(repo.pushedAt, data.now);
    body.push(text(truncate(when, W - 16 - hx, 15), hx, y + 15, { size: 15, fill: t.sub }, t));
  }
  y += 24;

  if (!repo) {
    // slot kosong, tetap rapi kalau repo kurang dari 4
    body.push(text('Empty slot', X, y + 17, { size: 17, weight: 700, fill: t.sub }, t));
    y += 24;
    for (const line of wrapText('Pin a repo on your GitHub profile and its card shows up here on its own.', CW, 15)) {
      body.push(text(line, X, y + 15, { size: 15, fill: t.sub }, t)); y += 20;
    }
    y += 12;
  } else {
    body.push(text(truncate(repo.name, CW, 17, { bold: true }), X, y + 17, { size: 17, weight: 700, fill: t.link }, t));
    y += 28;
    const desc = repo.description || 'No description yet';
    for (const line of wrapText(desc, CW, 15, { maxLines: 4 })) {
      body.push(text(line, X, y + 15, { size: 15, fill: repo.description ? t.text : t.sub }, t)); y += 20;
    }
    y += 8;

    // chip bahasa dan status arsip
    let cx = X, any = false;
    const chip = (label, dot) => {
      const w = 12 + (dot ? 14 : 0) + textWidth(label, 13) + 12;
      body.push(`<rect x="${f(cx + 0.5)}" y="${y + 0.5}" width="${f(w - 1)}" height="23" rx="11.5" fill="none" stroke="${t.border}"/>`);
      let tx = cx + 12;
      if (dot) { body.push(`<circle cx="${f(cx + 18)}" cy="${y + 12}" r="4.5" fill="${dot}"/>`); tx += 14; }
      body.push(text(label, tx, y + 16.5, { size: 13, fill: t.sub }, t));
      cx += w + 8; any = true;
    };
    if (repo.lang) chip(repo.lang.name, visibleOn(repo.lang.color || '#8b98a5', t.mode));
    if (repo.archived) chip('Archived', null);
    if (any) y += 36;

    // baris aksi: issues, forks, stars, watchers
    const actions = [['reply', repo.issues], ['repeat', repo.forks], ['star', repo.stars], ['eye', repo.watchers]];
    actions.forEach(([ic, n], i) => {
      const ax = X + i * (CW / 4);
      body.push(icon(ic, ax, y, 18, t.sub, { sw: 1.8 }));
      body.push(text(shortNum(n), ax + 26, y + 14, { size: 13, fill: t.sub }, t));
    });
    y += 18 + 12;
  }

  const H = y;
  body.push(`<path d="M0 ${H - 0.5}H${W}" stroke="${t.border}" stroke-width="1"/>`);
  return svgDoc({
    w: W, h: H, t, defs,
    title: repo ? `Repo ${repo.fullName}` : 'Empty repo slot',
    desc: repo ? `${repo.name}: ${repo.description || 'no description'}. ${repo.stars} stars, ${repo.forks} forks.` : 'No repo for this slot yet.',
    body: body.join(''),
  });
}

module.exports = { renderRepoCard };
