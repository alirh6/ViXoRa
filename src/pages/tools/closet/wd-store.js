import { GARMENTS, CATS, harmony } from './wd-data.js';

const KEY = 'vixora-closet-os-v1';
const faD = '۰۱۲۳۴۵۶۷۸۹';
export const faNum = (n) => String(n ?? '').replace(/\d/g, (d) => faD[d]);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
export const fmtT = (n) => faNum(Math.round(n || 0).toLocaleString('en-US')) + ' ت';

export function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const stable = (o) => JSON.stringify(o);
export function newId(p = 'w') { return p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }

export function gregToJalali(gy, gm, gd) {
  const gy2 = gy - 1600, gm2 = gm - 1, gd2 = gd - 1;
  let gDay = 365 * gy2 + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
  const gmd = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  gDay += gmd[gm2] + gd2;
  if (gm2 > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) gDay++;
  let jDay = gDay - 79;
  const jNp = Math.floor(jDay / 12053); jDay %= 12053;
  let jy = 979 + 33 * jNp + 4 * Math.floor(jDay / 1461); jDay %= 1461;
  if (jDay >= 366) { jy += Math.floor((jDay - 1) / 365); jDay = (jDay - 1) % 365; }
  const jm = jDay < 186 ? 1 + Math.floor(jDay / 31) : 7 + Math.floor((jDay - 186) / 30);
  const jd = 1 + (jDay < 186 ? jDay % 31 : (jDay - 186) % 30);
  return { jy, jm, jd };
}
export function jalaliNow(d = new Date()) { return gregToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
export function jalaliKey(d = new Date()) { const j = jalaliNow(d); return `${j.jy}-${String(j.jm).padStart(2, '0')}-${String(j.jd).padStart(2, '0')}`; }
export function faDate(d = new Date()) { const j = jalaliNow(d); return faNum(`${j.jy}/${j.jm}/${j.jd}`); }
export function weekdayFa(d = new Date()) { return ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'][d.getDay()]; }
export function seasonNow(d = new Date()) {
  const m = jalaliNow(d).jm;
  if (m <= 3) return 'بهار';
  if (m <= 6) return 'تابستان';
  if (m <= 9) return 'پاییز';
  return 'زمستان';
}

export const defaultSettings = () => ({
  theme: 'runway', accent: '#e8b4b8', density: 'comfy',
  genderCut: 'all', modest: true, motion: true, sound: true,
  weather: 'آفتابی', city: 'تهران', laundryWarn: 3, costGoal: 50,
});

export const blank = () => ({
  v: 1, settings: defaultSettings(),
  items: GARMENTS.map((g) => ({ ...g, own: true, dirty: false, wears: 0, fav: false, note: '', last: '' })),
  custom: [],
  outfits: [],
  looks: [],
  laundry: [],
  worn: [],
  wish: [],
  packs: [],
  xp: 0, streak: 0, lastLook: '',
  badges: [],
  boards: [{ id: 'b1', name: 'کپسول', ids: [] }],
  challenge: { id: '30', left: 30, used: [] },
});

let mem = null;
export function load() {
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) mem = { ...blank(), ...JSON.parse(raw) };
  } catch { /* */ }
  if (!mem) mem = blank();
  mem.settings = { ...defaultSettings(), ...(mem.settings || {}) };
  return mem;
}
export function save(s = mem) { mem = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* */ } return mem; }
export function resetAll() { mem = blank(); return save(); }
export function mutate(fn) { const s = load(); fn(s); return save(s); }

export function allItems() {
  const s = load();
  return [...s.items, ...s.custom];
}
export function getItem(id) { return allItems().find((x) => x.id === id); }

export function filterItems(f = {}) {
  let list = allItems();
  if (f.q) list = list.filter((x) => x.name.includes(f.q) || x.brand?.includes(f.q) || x.tags?.some((t) => t.includes(f.q)) || x.color.includes(f.q));
  if (f.cat && f.cat !== 'all') list = list.filter((x) => x.cat === f.cat);
  if (f.color && f.color !== 'all') list = list.filter((x) => x.color === f.color);
  if (f.season && f.season !== 'all') list = list.filter((x) => x.season === f.season || x.season === 'همه');
  if (f.occ && f.occ !== 'all') list = list.filter((x) => x.occ?.includes(f.occ));
  if (f.fav) list = list.filter((x) => x.fav);
  if (f.clean) list = list.filter((x) => !x.dirty);
  if (f.capsule) list = list.filter((x) => x.tags?.includes('کپسول'));
  if (f.sort === 'price') list.sort((a, b) => a.price - b.price);
  else if (f.sort === 'wears') list.sort((a, b) => (b.wears || 0) - (a.wears || 0));
  else if (f.sort === 'cpw') list.sort((a, b) => cpw(a) - cpw(b));
  else list.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  return list;
}

export function cpw(it) {
  const w = Math.max(1, it.wears || 0);
  return Math.round((it.price || 0) / w);
}

export function toggleFav(id) {
  return mutate((s) => {
    const it = [...s.items, ...s.custom].find((x) => x.id === id);
    if (it) it.fav = !it.fav;
  });
}
export function markDirty(id, dirty = true) {
  return mutate((s) => {
    const it = [...s.items, ...s.custom].find((x) => x.id === id);
    if (it) it.dirty = dirty;
    if (dirty && !s.laundry.includes(id)) s.laundry.push(id);
    if (!dirty) s.laundry = s.laundry.filter((x) => x !== id);
  });
}
export function washAll() {
  return mutate((s) => {
    for (const id of s.laundry) {
      const it = [...s.items, ...s.custom].find((x) => x.id === id);
      if (it) it.dirty = false;
    }
    s.laundry = [];
    s.xp += 8;
  });
}

export function wearLook(ids) {
  const day = jalaliKey();
  return mutate((s) => {
    for (const id of ids) {
      const it = [...s.items, ...s.custom].find((x) => x.id === id);
      if (!it) continue;
      it.wears = (it.wears || 0) + 1;
      it.last = day;
      it.dirty = true;
      if (!s.laundry.includes(id)) s.laundry.push(id);
    }
    s.worn.push({ day, ids, at: Date.now() });
    if (s.lastLook === day) { /* */ }
    else {
      const y = jalaliKey(new Date(Date.now() - 86400000));
      s.streak = s.lastLook === y ? s.streak + 1 : 1;
      s.lastLook = day;
    }
    s.xp += 12;
    if (s.worn.length >= 1 && !s.badges.includes('first')) s.badges.push('first');
    if (s.streak >= 7 && !s.badges.includes('week')) s.badges.push('week');
    if (s.items.filter((x) => x.wears > 5).length >= 5 && !s.badges.includes('reuse')) s.badges.push('reuse');
  });
}

export function saveOutfit(name, ids) {
  const o = { id: newId('o'), name, ids, at: Date.now() };
  mutate((s) => { s.outfits.push(o); s.xp += 10; });
  return o;
}
export function delOutfit(id) { return mutate((s) => { s.outfits = s.outfits.filter((o) => o.id !== id); }); }

export function suggestToday(occ = 'روزمره') {
  const s = load();
  const season = seasonNow();
  const weather = s.settings.weather;
  const pool = allItems().filter((x) => !x.dirty && (x.season === season || x.season === 'همه') && x.occ?.includes(occ));
  const pick = (cat) => {
    const xs = pool.filter((x) => x.cat === cat);
    if (!xs.length) return allItems().find((x) => x.cat === cat && !x.dirty);
    return xs[Number(cyrb53(jalaliKey() + cat)) % xs.length];
  };
  let top = pick('مانتو') || pick('کت') || pick('هودی');
  if (weather === 'گرم' || weather === 'آفتابی') top = pick('مانتو') || pick('تیشرت');
  if (weather === 'باران') top = allItems().find((x) => x.tags?.includes('باران') && !x.dirty) || top;
  const bottom = pick('شلوار') || pick('دامن');
  const shoe = pick('کفش');
  const inner = pick('تیشرت') || pick('پیراهن');
  const acc = pick('اکسسوری');
  return [inner, bottom, top, shoe, acc].filter(Boolean);
}

export function scoreOutfit(ids) {
  const items = ids.map(getItem).filter(Boolean);
  if (items.length < 2) return 40;
  let h = 70;
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) h = (h + harmony(items[i].color, items[j].color)) / 2;
  const formals = items.map((x) => x.formal);
  const spread = Math.max(...formals) - Math.min(...formals);
  if (spread > 3) h -= 12;
  if (items.some((x) => x.dirty)) h -= 20;
  return Math.max(10, Math.min(99, Math.round(h)));
}

export function addCustom(p) {
  const it = { id: newId('c'), wears: 0, dirty: false, fav: false, own: true, last: '', note: '', tags: p.tags || ['سفارشی'], ...p };
  mutate((s) => { s.custom.push(it); s.xp += 15; });
  return it;
}
export function delCustom(id) { return mutate((s) => { s.custom = s.custom.filter((x) => x.id !== id); }); }

export function addWish(name, price) { return mutate((s) => { s.wish.push({ id: newId('w'), name, price: +price || 0, at: Date.now() }); }); }
export function delWish(id) { return mutate((s) => { s.wish = s.wish.filter((x) => x.id !== id); }); }

export function packList(kind) {
  const need = { weekend: ['تیشرت','شلوار','کفش','مانتو','اکسسوری'], work3: ['پیراهن','شلوار','کت','کفش','کیف'], beach: ['تیشرت','شلوارک','کفش','اکسسوری'] }[kind] || CATS;
  const chosen = [];
  for (const cat of need) {
    const it = allItems().find((x) => x.cat === cat && !x.dirty);
    if (it) chosen.push(it.id);
  }
  const pack = { id: newId('pk'), kind, ids: chosen, at: Date.now() };
  mutate((s) => { s.packs.unshift(pack); });
  return pack;
}

export function stats() {
  const s = load();
  const items = allItems();
  const value = items.reduce((a, x) => a + (x.price || 0), 0);
  const wears = items.reduce((a, x) => a + (x.wears || 0), 0);
  const idle = items.filter((x) => !x.wears).length;
  return { n: items.length, value, wears, idle, laundry: s.laundry.length, xp: s.xp, streak: s.streak, outfits: s.outfits.length, dirty: items.filter((x) => x.dirty).length };
}

export function heatWorn(days = 28) {
  const s = load();
  const map = {};
  for (let i = 0; i < days; i++) {
    const dt = new Date(Date.now() - i * 86400000);
    const k = jalaliKey(dt);
    map[k] = s.worn.filter((w) => w.day === k).length;
  }
  return map;
}

export function exportPackage() {
  const state = load();
  return { app: 'vixora-closet', v: 1, exportedAt: Date.now(), state, sig: String(cyrb53('cl1:' + stable(state))) };
}
export function parsePackage(obj) {
  if (!obj || obj.app !== 'vixora-closet') throw new Error('بسته نامعتبر');
  if (obj.v > 1) throw new Error('نسخه جدیدتر');
  if (String(obj.sig) !== String(cyrb53('cl1:' + stable(obj.state)))) throw new Error('امضا مخدوش');
  mem = { ...blank(), ...obj.state };
  return save();
}

export const BADGES = [
  { id: 'first', name: 'اولین استایل' },
  { id: 'week', name: 'هفته استایلیست' },
  { id: 'reuse', name: '۵ لباس پرکار' },
];
