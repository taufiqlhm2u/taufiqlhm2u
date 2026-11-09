'use strict';
// Orkestrasi: ambil data, render semua komponen (dark + light), validasi, tulis ke folder sementara,
// lalu pindahkan ke assets/ hanya kalau SEMUA berhasil. Kalau ada yang gagal, SVG lama tidak disentuh.
const fs = require('fs');
const path = require('path');
const { loadData } = require('./lib/api');
const { getTheme } = require('./lib/theme');
const { validateSvg, esc } = require('./lib/utils');
const { renderProfile } = require('./lib/profile');
const { renderRepoCard } = require('./lib/repoCard');
const { renderLangs } = require('./lib/langs');
const { renderContributions } = require('./lib/contributions');
const { renderArcade } = require('./lib/arcade');
const { renderScores } = require('./lib/scores');
const { renderSolar } = require('./lib/solar');

const ROOT = path.join(__dirname, '..');
const LOGIN = process.env.GH_LOGIN || 'taufiqlhm2u';

const COMPONENTS = [
  { name: 'profile', render: renderProfile },
  ...[0, 1, 2, 3].map((i) => ({ name: `repo-${i + 1}`, render: (d, t) => renderRepoCard(d, t, i) })),
  { name: 'arcade', render: renderArcade },
  { name: 'arcade-scores', render: renderScores },
  { name: 'solar', render: renderSolar },
  { name: 'langs', render: renderLangs },
  { name: 'contributions', render: renderContributions },
];

function picture(name, alt) {
  return `<picture>\n  <source media="(prefers-color-scheme: light)" srcset="assets/${name}-light.svg" />\n  <img src="assets/${name}-dark.svg" width="100%" alt="${esc(alt)}" />\n</picture>`;
}

// README dibuat dari data supaya tautan kartu repo selalu menunjuk repo yang benar.
function buildReadme(data) {
  const u = data.user;
  const parts = [`<a href="${esc(u.htmlUrl)}">\n${picture('profile', 'Profil GitHub ' + (u.name || u.login))}\n</a>`];
  for (let i = 0; i < 4; i++) {
    const r = data.featured[i];
    const img = picture(`repo-${i + 1}`, r ? 'Repo ' + r.name : 'Slot repo kosong');
    parts.push(r ? `<a href="${esc(r.url)}">\n${img}\n</a>` : img);
  }
  parts.push(picture('arcade', 'Arcade: level platformer dari kontribusi 26 minggu terakhir'));
  parts.push(picture('arcade-scores', 'Papan skor repo dengan bintang terbanyak'));
  parts.push(picture('solar', 'Tata surya: planet adalah bahasa, komet adalah push terbaru'));
  parts.push(picture('langs', 'Bahasa pemrograman yang sering dipakai'));
  parts.push(picture('contributions', 'Aktivitas kontribusi setahun terakhir'));
  return `<div align="center">\n\n${parts.join('\n\n')}\n\n</div>\n`;
}

async function main() {
  const mock = process.env.MOCK;
  let data;
  if (mock) {
    data = require('./lib/mock').mockData(mock === '1' ? 'full' : mock);
    console.log(`Memakai data MOCK (${mock})`);
  } else {
    data = await loadData(LOGIN, process.env.GITHUB_TOKEN);
  }

  const outDir = path.join(ROOT, 'assets');
  const tmpDir = path.join(outDir, '.tmp-' + process.pid);
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    const written = [];
    for (const mode of ['dark', 'light']) {
      const t = getTheme(mode);
      for (const c of COMPONENTS) {
        const file = `${c.name}-${mode}.svg`;
        const svg = c.render(data, t);
        const bytes = validateSvg(svg, file);
        fs.writeFileSync(path.join(tmpDir, file), svg);
        written.push(file);
        console.log(`${file.padEnd(28)} ${(bytes / 1024).toFixed(1)} KB`);
      }
    }
    const readmeTmp = path.join(tmpDir, 'README.md');
    fs.writeFileSync(readmeTmp, buildReadme(data));

    // semua sukses, baru timpa file lama
    for (const file of written) fs.renameSync(path.join(tmpDir, file), path.join(outDir, file));
    if (!mock) fs.renameSync(readmeTmp, path.join(ROOT, 'README.md'));
    console.log(mock ? 'Selesai (mock, README tidak ditimpa).' : 'Selesai.');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error('GAGAL:', e.message);
  if (process.env.RUNNER_DEBUG === '1' || process.env.DEBUG) console.error(e.stack); process.exit(1); });
