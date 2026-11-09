'use strict';
// Pengambilan data: REST + GraphQL GitHub, lalu diolah jadi satu objek `data` untuk semua komponen.
// Tidak ada data yang ditulis tangan di sini selain login.

const API = 'https://api.github.com';

// Warna bahasa cadangan kalau GraphQL tidak memberi warna.
const FALLBACK_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', HTML: '#e34c26', CSS: '#563d7c',
  PHP: '#4F5D95', Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600', Go: '#00ADD8',
  Rust: '#dea584', Ruby: '#701516', Shell: '#89e051', Kotlin: '#A97BFF', Swift: '#F05138',
  Dart: '#00B4AB', Vue: '#41b883', Dockerfile: '#384d54', 'Jupyter Notebook': '#DA5B0B', SCSS: '#c6538c',
  Blade: '#f7523f', Svelte: '#ff3e00', Lua: '#000080', Makefile: '#427819', Astro: '#ff5a03', R: '#198CE7',
};

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function request(url, init, label) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.status >= 500) throw new Error(`${label}: HTTP ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e;
      await sleep(600 * (attempt + 1));
    }
  }
  throw lastErr;
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'profile-readme-generator',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function rest(path, token) {
  const res = await request(API + path, { headers: headers(token) }, 'REST ' + path);
  if (!res.ok) throw new Error(`REST ${path}: HTTP ${res.status}`);
  return res.json();
}

async function graphql(query, variables, token) {
  const res = await request(API + '/graphql', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers(token)),
    body: JSON.stringify({ query, variables }),
  }, 'GraphQL');
  if (!res.ok) throw new Error(`GraphQL: HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors && json.errors.length) throw new Error('GraphQL: ' + json.errors.map((e) => e.message).join('; '));
  return json.data;
}

// Unduh gambar lalu ubah jadi data URI, karena SVG di <img> tidak boleh memuat resource eksternal.
async function toDataUri(url) {
  const res = await request(url, { headers: { 'User-Agent': 'profile-readme-generator' } }, 'avatar');
  if (!res.ok) throw new Error(`Avatar: HTTP ${res.status}`);
  const type = (res.headers.get('content-type') || 'image/png').split(';')[0];
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${buf.toString('base64')}`;
}

function sized(url, px) { return url + (url.includes('?') ? '&' : '?') + 's=' + px; }

const REPO_FIELDS = `
  name nameWithOwner description stargazerCount forkCount url pushedAt isArchived
  primaryLanguage { name color }
  issues(states: OPEN) { totalCount }
  watchers { totalCount }
  owner { login }`;

const Q_MAIN = `
query($login: String!) {
  user(login: $login) {
    pinnedItems(first: 4, types: REPOSITORY) { nodes { ... on Repository { ${REPO_FIELDS} } } }
    top: repositories(first: 10, orderBy: {field: STARGAZERS, direction: DESC}, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
      nodes { ${REPO_FIELDS} }
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
    }
  }
}`;

const Q_ALL = `
query($login: String!, $after: String) {
  user(login: $login) {
    repositories(first: 100, after: $after, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes { name nameWithOwner pushedAt isArchived stargazerCount primaryLanguage { name color } owner { login } }
    }
  }
}`;

function normRepo(r) {
  return {
    name: r.name,
    fullName: r.nameWithOwner,
    owner: r.owner ? r.owner.login : '',
    description: r.description || '',
    stars: r.stargazerCount || 0,
    forks: r.forkCount || 0,
    issues: r.issues ? r.issues.totalCount : 0,
    watchers: r.watchers ? r.watchers.totalCount : 0,
    url: r.url,
    pushedAt: r.pushedAt,
    archived: !!r.isArchived,
    lang: r.primaryLanguage ? { name: r.primaryLanguage.name, color: r.primaryLanguage.color || FALLBACK_COLORS[r.primaryLanguage.name] || null } : null,
  };
}

// Jalankan tugas paralel dengan batas konkurensi.
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

async function loadData(login, token, now = Date.now()) {
  if (!token) throw new Error('GITHUB_TOKEN kosong');

  const user = await rest(`/users/${login}`, token);
  const main = (await graphql(Q_MAIN, { login }, token)).user;
  if (!main) throw new Error('User GraphQL tidak ditemukan');

  // semua repo publik non-fork (maks 500) untuk statistik bahasa, komet, dan sabuk asteroid
  let all = [], after = null;
  for (let page = 0; page < 5; page++) {
    const q = (await graphql(Q_ALL, { login, after }, token)).user.repositories;
    all = all.concat(q.nodes.map(normRepo));
    if (!q.pageInfo.hasNextPage) break;
    after = q.pageInfo.endCursor;
  }

  // byte per bahasa lewat REST
  const langTotals = {};
  const langRepoCount = {};
  await pool(all, 6, async (r) => {
    try {
      const l = await rest(`/repos/${r.fullName}/languages`, token);
      for (const [name, bytes] of Object.entries(l)) {
        langTotals[name] = (langTotals[name] || 0) + bytes;
        langRepoCount[name] = (langRepoCount[name] || 0) + 1;
      }
    } catch (e) {
      console.warn(`Peringatan: bahasa ${r.fullName} dilewati (${e.message})`);
    }
  });

  // warna bahasa: GraphQL dulu, lalu peta cadangan, lalu abu-abu
  const colorOf = {};
  for (const r of all.concat(main.top.nodes.map(normRepo))) if (r.lang && r.lang.color) colorOf[r.lang.name] = r.lang.color;
  const totalBytes = Object.values(langTotals).reduce((a, b) => a + b, 0);
  const langs = Object.entries(langTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({
      name, bytes, repoCount: langRepoCount[name] || 1,
      pct: totalBytes ? (bytes / totalBytes) * 100 : 0,
      color: colorOf[name] || FALLBACK_COLORS[name] || '#8b98a5',
    }));

  const top = main.top.nodes.map(normRepo);
  const pinned = main.pinnedItems.nodes.filter(Boolean).map(normRepo);
  // pinned dulu, sisanya diisi repo non-fork terbanyak bintang sampai 4 kartu
  const featured = pinned.slice();
  for (const r of top) { if (featured.length >= 4) break; if (!featured.some((x) => x.fullName === r.fullName)) featured.push(r); }

  const cal = main.contributionsCollection.contributionCalendar;
  const weeks = cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, weekday: d.weekday })));

  const [avatar, avatarSmall] = await Promise.all([
    toDataUri(sized(user.avatar_url, 280)),
    toDataUri(sized(user.avatar_url, 96)),
  ]);

  return buildData({
    login: user.login,
    user: {
      name: user.name || '', login: user.login, bio: user.bio || '', avatar, avatarSmall,
      location: user.location || '', blog: user.blog || '', createdAt: user.created_at,
      followers: user.followers, following: user.following, publicRepos: user.public_repos,
      htmlUrl: user.html_url,
    },
    featured, top, all, langs, weeks, totalContributions: cal.totalContributions, now,
  });
}

// Turunan data (streak, level, komet, dll) dipisah supaya mock bisa memakai logika yang sama.
function buildData(raw) {
  const { now } = raw;
  const days = [].concat(...raw.weeks).sort((a, b) => (a.date < b.date ? -1 : 1));

  // streak aktif: hari ini yang masih 0 tidak memutus streak
  let i = days.length - 1, streak = 0;
  if (i >= 0 && days[i].count === 0) i--;
  while (i >= 0 && days[i].count > 0) { streak++; i--; }

  // kontribusi hari ini dan streak terpanjang dalam jendela kalender (setahun)
  const today = days.length ? days[days.length - 1].count : 0;
  let longest = 0, run = 0;
  for (const d of days) { run = d.count > 0 ? run + 1 : 0; if (run > longest) longest = run; }

  // 26 minggu terakhir, diisi nol di depan kalau kalender lebih pendek
  const last = raw.weeks.slice(-26).map((w) => w.reduce((s, d) => s + d.count, 0));
  while (last.length < 26) last.unshift(0);

  const years = Math.floor((now - new Date(raw.user.createdAt).getTime()) / (365.25 * 86400000));
  const fresh = raw.all
    .filter((r) => !r.archived && r.pushedAt && now - new Date(r.pushedAt).getTime() <= 14 * 86400000)
    .sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1))
    .slice(0, 4)
    .map((r) => ({ name: r.name, url: r.url, daysAgo: (now - new Date(r.pushedAt).getTime()) / 86400000 }));

  return {
    login: raw.login,
    user: raw.user,
    featured: raw.featured,
    top: raw.top,
    repos: raw.all,
    langs: raw.langs,
    calendar: { total: raw.totalContributions, weeks: raw.weeks, days },
    stats: {
      streak, today, longest,
      weekTotals: last,
      score: last.reduce((a, b) => a + b, 0),
      level: Math.max(1, years),
      years,
      archived: raw.all.filter((r) => r.archived).length,
      fresh,
    },
    now,
  };
}

module.exports = { loadData, buildData, FALLBACK_COLORS };
