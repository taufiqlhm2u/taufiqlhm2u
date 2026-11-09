'use strict';
// Data palsu untuk tes lokal tanpa token. MOCK=full | minimal | empty.
const { buildData, FALLBACK_COLORS } = require('./api');
const { mulberry32, hashSeed } = require('./utils');

function avatar() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#1d9bf0"/><circle cx="48" cy="38" r="18" fill="#e7e9ea"/><path d="M12 96c4-26 20-34 36-34s32 8 36 34z" fill="#e7e9ea"/></svg>';
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

function mockData(kind, now = Date.now()) {
  const rnd = mulberry32(hashSeed('mock' + kind));
  const iso = (daysAgo) => new Date(now - daysAgo * 86400000).toISOString();
  const day = 86400000;

  const full = kind === 'full';
  const empty = kind === 'empty';
  const mk = (name, desc, stars, forks, lang, pushed, archived = false) => ({
    name, fullName: 'taufiqlhm2u/' + name, owner: 'taufiqlhm2u', description: desc, stars, forks,
    issues: Math.floor(rnd() * 6), watchers: stars, url: 'https://github.com/taufiqlhm2u/' + name,
    pushedAt: iso(pushed), archived, lang: lang ? { name: lang, color: FALLBACK_COLORS[lang] } : null,
  });

  let all = [];
  if (full) {
    all = [
      mk('sistem-informasi-akademik', 'Aplikasi akademik kampus dengan dashboard nilai, jadwal kuliah, dan presensi mahasiswa berbasis Laravel', 1243, 310, 'PHP', 1),
      mk('portfolio-v3', 'Website portofolio pribadi', 87, 12, 'TypeScript', 3),
      mk('kota-bot', 'Bot Telegram untuk cek jadwal sholat dan cuaca kota Semarang', 54, 9, 'Python', 40),
      mk('dotfiles', '', 31, 3, 'Shell', 9),
      mk('catatan-kuliah', 'Catatan kuliah semester 1 sampai 6', 12, 1, 'HTML', 200, true),
      mk('belajar-rust', 'Latihan Rust', 4, 0, 'Rust', 12),
      mk('toko-online-lama', 'Proyek lama, sudah tidak dipakai', 2, 0, 'JavaScript', 500, true),
    ];
  } else if (!empty) {
    all = [mk('hello-world', 'Repo pertamaku', 1, 0, 'JavaScript', 2)];
  }

  const langs = full
    ? [['PHP', 412000, 4], ['TypeScript', 301000, 3], ['JavaScript', 180000, 3], ['Python', 90000, 2], ['Blade', 70000, 2], ['CSS', 52000, 4], ['Shell', 21000, 1], ['Rust', 9000, 1]]
    : empty ? [] : [['JavaScript', 800, 1]];
  const total = langs.reduce((s, l) => s + l[1], 0);
  const langList = langs.map(([name, bytes, repoCount]) => ({ name, bytes, repoCount, pct: (bytes / total) * 100, color: FALLBACK_COLORS[name] || '#8b98a5' }));

  // 53 minggu x 7 hari, berakhir hari ini
  const weeks = [];
  const todayDow = new Date(now).getUTCDay();
  let totalC = 0;
  const startOffset = 52 * 7 + todayDow;
  for (let w = 0; w < 53; w++) {
    const wk = [];
    for (let d = 0; d < 7; d++) {
      const idx = w * 7 + d;
      const ago = startOffset - idx;
      if (ago < 0) continue;
      let c = 0;
      if (full) c = rnd() < 0.62 ? Math.floor(Math.pow(rnd(), 2) * 14 * (0.5 + 0.8 * Math.sin(w / 6) ** 2)) : 0;
      else if (!empty && ago < 5) c = ago % 2 === 0 ? 1 : 2;
      if (full && ago < 6) c = Math.max(c, 1 + (ago % 3));
      totalC += c;
      wk.push({ date: new Date(now - ago * day).toISOString().slice(0, 10), count: c, weekday: d });
    }
    weeks.push(wk);
  }

  const created = full ? iso(365 * 4.6) : iso(20);
  const featured = full ? all.slice(0, 4) : all.slice(0, 4);
  return buildData({
    login: 'taufiqlhm2u',
    user: {
      name: full ? 'Taufiq Hidayat Muhammad' : empty ? '' : 'Taufiq',
      login: 'taufiqlhm2u',
      bio: full ? 'Mahasiswa Teknik Informatika yang suka ngoprek backend, otomatisasi, dan hal-hal kecil yang bikin hidup lebih gampang. Ngopi dulu, ngoding kemudian.' : empty ? '' : 'Baru mulai belajar ngoding',
      avatar: avatar(), avatarSmall: avatar(),
      location: full ? 'Semarang, Indonesia' : '', blog: full ? 'https://taufiq.dev' : '',
      createdAt: created, followers: full ? 1342 : 0, following: full ? 98 : 3, publicRepos: all.length,
      htmlUrl: 'https://github.com/taufiqlhm2u',
    },
    featured, top: all.slice().sort((a, b) => b.stars - a.stars).slice(0, 10), all, langs: langList, weeks,
    totalContributions: totalC, now,
  });
}

module.exports = { mockData };
