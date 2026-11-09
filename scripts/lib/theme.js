'use strict';
// Token desain tema X. Semua komponen memakai objek ini, tidak ada warna yang ditulis ulang di tempat lain.

const base = {
  width: 600,
  radius: 16,
  font: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: '"Courier New", monospace',
  accent: { blue: '#1d9bf0', green: '#00ba7c', red: '#f91880', yellow: '#ffd400' },
};

const dark = {
  mode: 'dark',
  bg: '#000000',
  bgDim: '#15202b', // varian "Dim", belum dipakai tapi tersedia
  text: '#e7e9ea',
  sub: '#71767b',
  border: '#2f3336',
  surface: '#16181c',   // kartu (Tren untuk kamu)
  surface2: '#0d0e10',  // panel kontrol kabinet
  link: '#1d9bf0',
  btnBg: '#ffffff',
  btnText: '#0f1419',
  bannerFrom: '#1d9bf0',
  bannerTo: '#0f1419',
  heat: ['#0c2d48', '#0a4f7e', '#1280c4', '#1d9bf0'],
  heatEmpty: '#2f3336',
  gold: '#ffd400',
  screenBg: '#000000',  // layar CRT arcade
  bezel: '#050607',
  skyline: '#0a1118',
};

const light = {
  mode: 'light',
  bg: '#ffffff',
  bgDim: '#ffffff',
  text: '#0f1419',
  sub: '#536471',
  border: '#eff3f4',
  surface: '#f7f9f9',
  surface2: '#e7ecef',
  link: '#1a78b8', // biru X digelapkan supaya teks kecil lolos kontras 4,5:1 di latar putih
  btnBg: '#0f1419',
  btnText: '#ffffff',
  bannerFrom: '#1d9bf0',
  bannerTo: '#8ecdf7',
  heat: ['#c3e4fa', '#80c6f4', '#3da6ee', '#1a78b8'],
  heatEmpty: '#e1e8ec',
  gold: '#b88a00',
  screenBg: '#0f1419',
  bezel: '#0f1419',
  skyline: '#16202a',
};

// Layar arcade selalu gelap di dua mode, jadi warna isi layar tidak ikut tema.
const screen = {
  text: '#e7e9ea',
  sub: '#8b98a5',
  border: '#2f3336',
  heat: ['#0c2d48', '#0a4f7e', '#1280c4', '#1d9bf0'],
  gold: '#ffd400',
};

const theme = { base, dark, light, screen };

function getTheme(mode) {
  const m = mode === 'light' ? light : dark;
  return Object.assign({}, base, m, { screen });
}

module.exports = { theme, getTheme };
