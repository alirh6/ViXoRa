// 🍳 Kitchen OS store
import { RECIPES, recipeById, AISLES, PRESETS } from './kt-data.js';

const KEY = 'vixora-kitchen-os-v1';
const faD = '۰۱۲۳۴۵۶۷۸۹';
export const faNum = (n) => String(n ?? '').replace(/\d/g, (d) => faD[d]);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

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

export function newId(p = 'k') {
  return p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/* --- Jalali --- */
const J_OFFSETS = [0,31,62,93,124,155,186,216,246,276,306,336];
function g2jd(y,m,d){ const a=Math.floor((14-m)/12); y=y+4800-a; m=m+12*a-3; return d+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045; }
function isLeapJ(jy){ const breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178]; let bl=breaks.length,jp=breaks[0],jump=0,leap,n,i; if(jy<jp||jy>=breaks[bl-1]) throw new Error('jy'); for(i=1;i<bl;i++){ const jm=breaks[i]; jump=jm-jp; if(jy<jm) break; jp=jm; } n=jy-jp; if(jump-n<6) n=n-jump+Math.floor((jump+4)/33)*33; leap=(((n+1)%33)-1)%4; if(leap===-1) leap=4; return leap===0; }
export function gregToJalali(gy,gm,gd){
  const gy2=gy-1600, gm2=gm-1, gd2=gd-1;
  let gDay=365*gy2+Math.floor((gy2+3)/4)-Math.floor((gy2+99)/100)+Math.floor((gy2+399)/400);
  const gmd=[0,31,59,90,120,151,181,212,243,273,304,334];
  gDay+=gmd[gm2]+gd2; if(gm2>1 && ((gy%4===0&&gy%100!==0)||gy%400===0)) gDay++;
  let jDay=gDay-79; const jNp=Math.floor(jDay/12053); jDay%=12053;
  let jy=979+33*jNp+4*Math.floor(jDay/1461); jDay%=1461;
  if(jDay>=366){ jy+=Math.floor((jDay-1)/365); jDay=(jDay-1)%365; }
  const jm = jDay<186 ? 1+Math.floor(jDay/31) : 7+Math.floor((jDay-186)/30);
  const jd = 1+(jDay<186 ? jDay%31 : (jDay-186)%30);
  return { jy, jm, jd };
}
export function jalaliNow(d = new Date()) { return gregToJalali(d.getFullYear(), d.getMonth()+1, d.getDate()); }
export function jalaliKey(d = new Date()) { const j = jalaliNow(d); return `${j.jy}-${String(j.jm).padStart(2,'0')}-${String(j.jd).padStart(2,'0')}`; }
export function faDate(d = new Date()) { const j = jalaliNow(d); return faNum(`${j.jy}/${j.jm}/${j.jd}`); }
export function weekdayFa(d = new Date()) { return ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'][d.getDay()]; }

export const defaultSettings = () => ({
  theme: 'ember', accent: '#fb7185', density: 'comfy', font: 'vazir',
  diet: 'all', defaultSrv: 4, tts: true, sound: true, motion: true,
  units: 'metric', ramadan: false, hydrationGoal: 8, langNums: true,
  allergies: [], hideCooked: false, spinMood: 'any',
});

export const blankState = () => ({
  v: 1,
  settings: defaultSettings(),
  fav: [],
  ratings: {},
  notes: {},
  cooked: [],
  xp: 0, streak: 0, lastCookDay: '',
  badges: [],
  pantry: [],
  shop: [],
  plan: {},
  custom: [],
  timers: [],
  collections: [{ id: 'col-fav', name: 'محبوب‌ها', ids: [] }],
  viewed: [],
  searchHist: [],
  leftovers: [],
  waste: [],
  water: {},
  family: [{ id: 'me', name: 'من', diet: 'all' }],
  hacksSeen: [],
  spinHist: [],
  costLog: [],
});

let mem = null;
export function load() {
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) mem = { ...blankState(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  if (!mem) mem = blankState();
  mem.settings = { ...defaultSettings(), ...(mem.settings || {}) };
  return mem;
}
export function save(s = mem) {
  mem = s;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota */ }
  return mem;
}
export function resetAll() { mem = blankState(); save(); return mem; }
export function mutate(fn) { const s = load(); fn(s); return save(s); }

export function allRecipes() {
  const s = load();
  return [...RECIPES, ...(s.custom || [])];
}
export function getRecipe(id) {
  return allRecipes().find((r) => r.id === id) || recipeById(id);
}

export function toggleFav(id) {
  return mutate((s) => {
    const i = s.fav.indexOf(id);
    if (i >= 0) s.fav.splice(i, 1); else s.fav.push(id);
    const col = s.collections.find((c) => c.id === 'col-fav');
    if (col) col.ids = [...s.fav];
  });
}
export function isFav(id) { return load().fav.includes(id); }
export function rate(id, n) { return mutate((s) => { s.ratings[id] = Math.max(1, Math.min(5, n)); }); }
export function setNote(id, t) { return mutate((s) => { s.notes[id] = t; }); }

const BADGE_DEFS = [
  { id: 'first', name: 'اولین پخت', need: (s) => s.cooked.length >= 1 },
  { id: 'streak3', name: '۳ روز پشت‌سرهم', need: (s) => s.streak >= 3 },
  { id: 'streak7', name: 'هفته کامل', need: (s) => s.streak >= 7 },
  { id: 'chef10', name: '۱۰ غذا', need: (s) => s.cooked.length >= 10 },
  { id: 'chef50', name: '۵۰ غذا', need: (s) => s.cooked.length >= 50 },
  { id: 'fav5', name: '۵ محبوب', need: (s) => s.fav.length >= 5 },
  { id: 'pantry', name: 'انباردار', need: (s) => s.pantry.length >= 8 },
  { id: 'plan7', name: 'برنامه‌ریز هفته', need: (s) => Object.keys(s.plan).length >= 7 },
  { id: 'hydrate', name: 'آب‌رسان', need: (s) => Object.values(s.water).some((n) => n >= 8) },
  { id: 'custom', name: 'خالق دستور', need: (s) => s.custom.length >= 1 },
  { id: 'xp100', name: 'XP ۱۰۰', need: (s) => s.xp >= 100 },
  { id: 'xp500', name: 'آشپز ارشد', need: (s) => s.xp >= 500 },
];
export { BADGE_DEFS };

export function markCooked(id, srv) {
  const r = getRecipe(id);
  return mutate((s) => {
    const day = jalaliKey();
    s.cooked.push({ id, at: Date.now(), day, srv: srv || r?.srv || 1 });
    if (s.lastCookDay === day) { /* same day */ }
    else {
      const y = new Date(Date.now() - 86400000);
      if (s.lastCookDay === jalaliKey(y)) s.streak += 1;
      else s.streak = 1;
      s.lastCookDay = day;
    }
    s.xp += 15 + (r?.diff === 'حرفه‌ای' ? 10 : r?.diff === 'متوسط' ? 5 : 0);
    for (const b of BADGE_DEFS) if (b.need(s) && !s.badges.includes(b.id)) s.badges.push(b.id);
  });
}

// BANK-SA: هر قلم یک رکورد مجزا (برند/مدل/تاریخ)؛ تجمیع فقط سمت خواننده
export function addPantry(item) {
  return mutate((s) => {
    s.pantry.push({ id: newId('p'), addedAt: Date.now(), ...item });
  });
}
export function removePantry(id) { return mutate((s) => { s.pantry = s.pantry.filter((p) => p.id !== id); }); }
export function pantryHave(k) { return load().pantry.filter((p) => p.k === k).reduce((a, p) => a + p.q, 0); }
export function expiring(days = 3) {
  const now = Date.now();
  return load().pantry.filter((p) => p.exp && new Date(p.exp).getTime() - now < days * 86400000 && new Date(p.exp).getTime() >= now);
}
export function expired() {
  const now = Date.now();
  return load().pantry.filter((p) => p.exp && new Date(p.exp).getTime() < now);
}

export function addShop(item) {
  return mutate((s) => {
    const ex = s.shop.find((x) => !x.done && x.k === item.k);
    if (ex) ex.q = (ex.q || 0) + (item.q || 0);
    else s.shop.push({ id: newId('s'), done: false, aisle: item.aisle || 'other', ...item });
  });
}
export function toggleShop(id) { return mutate((s) => { const x = s.shop.find((i) => i.id === id); if (x) x.done = !x.done; }); }
export function clearDoneShop() { return mutate((s) => { s.shop = s.shop.filter((x) => !x.done); }); }
export function shopByAisle() {
  const map = {};
  for (const [k] of AISLES) map[k] = [];
  for (const it of load().shop) (map[it.aisle] || (map.other = map.other || [])).push(it);
  return map;
}

export function planSet(day, slot, rid) {
  return mutate((s) => {
    if (!s.plan[day]) s.plan[day] = {};
    s.plan[day][slot] = rid;
  });
}
export function planClear(day) { return mutate((s) => { delete s.plan[day]; }); }

export function shopFromPlan(days) {
  const s = load();
  const need = {};
  for (const d of days) {
    const slots = s.plan[d] || {};
    for (const rid of Object.values(slots)) {
      const r = getRecipe(rid);
      if (!r) continue;
      for (const ing of r.ings) {
        const key = ing.k + '|' + ing.u;
        if (!need[key]) need[key] = { ...ing };
        else need[key].q += ing.q;
      }
    }
  }
  for (const it of Object.values(need)) {
    const have = pantryHave(it.k);
    const q = Math.max(0, it.q - have);
    if (q > 0) addShop({ k: it.k, q, u: it.u, aisle: it.aisle });
  }
  return load();
}

export function addTimer({ label, sec, recipeId }) {
  const endAt = Date.now() + sec * 1000;
  return mutate((s) => { s.timers.push({ id: newId('t'), label, sec, endAt, paused: false, left: sec, recipeId: recipeId || '' }); });
}
export function pauseTimer(id) {
  return mutate((s) => {
    const t = s.timers.find((x) => x.id === id);
    if (!t || t.paused) return;
    t.left = Math.max(0, Math.round((t.endAt - Date.now()) / 1000));
    t.paused = true;
  });
}
export function resumeTimer(id) {
  return mutate((s) => {
    const t = s.timers.find((x) => x.id === id);
    if (!t || !t.paused) return;
    t.endAt = Date.now() + t.left * 1000;
    t.paused = false;
  });
}
export function removeTimer(id) { return mutate((s) => { s.timers = s.timers.filter((x) => x.id !== id); }); }
export function remaining(t) {
  if (t.paused) return t.left;
  return Math.max(0, Math.round((t.endAt - Date.now()) / 1000));
}

export function addCustom(r) {
  const rec = { ...r, id: r.id || newId('cr'), custom: true };
  mutate((s) => { s.custom.push(rec); s.xp += 20; });
  return rec;
}
export function delCustom(id) { return mutate((s) => { s.custom = s.custom.filter((x) => x.id !== id); }); }

export function drinkWater() {
  const k = jalaliKey();
  return mutate((s) => { s.water[k] = (s.water[k] || 0) + 1; });
}

export function logWaste(k, q, u) { return mutate((s) => { s.waste.push({ k, q, u, at: Date.now() }); }); }
export function addLeftover(name, portions, exp) { return mutate((s) => { s.leftovers.push({ id: newId('l'), name, portions, exp }); }); }
export function useLeftover(id) { return mutate((s) => { s.leftovers = s.leftovers.filter((x) => x.id !== id); }); }

export function viewRecipe(id) {
  return mutate((s) => {
    s.viewed = [id, ...s.viewed.filter((x) => x !== id)].slice(0, 20);
  });
}
export function pushSearch(q) {
  q = (q || '').trim();
  if (!q) return load();
  return mutate((s) => { s.searchHist = [q, ...s.searchHist.filter((x) => x !== q)].slice(0, 12); });
}

export function exportPackage() {
  const circle = load();
  const sig = String(cyrb53('kit1:' + stable({ ...circle, settings: circle.settings })));
  return { app: 'vixora-kitchen', v: 1, exportedAt: Date.now(), state: circle, sig };
}
export function parsePackage(obj) {
  if (!obj || obj.app !== 'vixora-kitchen') throw new Error('بسته نامعتبر');
  if (obj.v > 1) throw new Error('نسخه جدیدتر لازم است');
  const sig = String(cyrb53('kit1:' + stable({ ...obj.state, settings: obj.state.settings })));
  if (String(obj.sig) !== sig) throw new Error('امضا مخدوش است');
  mem = { ...blankState(), ...obj.state };
  save();
  return mem;
}

export function filterRecipes(opts = {}) {
  const s = load();
  const diet = opts.diet ?? s.settings.diet;
  let list = allRecipes();
  const q = (opts.q || '').trim();
  if (q) {
    const n = q.toLowerCase();
    list = list.filter((r) => r.name.includes(q) || r.tags?.some((t) => t.includes(q)) || r.cat.includes(q) || r.ings.some((i) => i.k.includes(q)) || (r.name.toLowerCase && r.name.toLowerCase().includes(n)));
  }
  if (opts.cat && opts.cat !== 'all') list = list.filter((r) => r.cat === opts.cat);
  if (opts.meal && opts.meal !== 'all') list = list.filter((r) => r.meal === opts.meal);
  if (opts.diff && opts.diff !== 'all') list = list.filter((r) => r.diff === opts.diff);
  if (opts.timeMax) list = list.filter((r) => r.time <= +opts.timeMax);
  if (opts.fav) list = list.filter((r) => s.fav.includes(r.id));
  if (opts.spice != null && opts.spice !== '') list = list.filter((r) => r.spice <= +opts.spice);
  if (opts.cost && opts.cost !== 'all') list = list.filter((r) => r.cost <= +opts.cost);
  if (opts.season && opts.season !== 'all') list = list.filter((r) => r.season === opts.season || r.season === 'همه');
  if (diet && diet !== 'all') {
    list = list.filter((r) => {
      if (diet === 'veg') return r.veg;
      if (diet === 'vegan') return r.vegan;
      if (diet === 'gf') return r.gluten;
      if (diet === 'df') return !r.dairy;
      if (diet === 'lowcal') return r.kcal <= 320;
      if (diet === 'hiP') return r.p >= 24;
      if (diet === 'nutfree') return !r.nut;
      return true;
    });
  }
  if (s.settings.allergies?.length) {
    list = list.filter((r) => !r.ings.some((i) => s.settings.allergies.some((a) => i.k.includes(a))));
  }
  if (opts.pantry) {
    list = list.filter((r) => r.ings.every((i) => pantryHave(i.k) > 0));
  }
  if (opts.sort === 'time') list.sort((a, b) => a.time - b.time);
  else if (opts.sort === 'kcal') list.sort((a, b) => a.kcal - b.kcal);
  else if (opts.sort === 'rate') list.sort((a, b) => (s.ratings[b.id] || 0) - (s.ratings[a.id] || 0));
  else if (opts.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  return list;
}

export function dailySuggest(d = new Date()) {
  const key = jalaliKey(d);
  const idx = Number(cyrb53(key)) % allRecipes().length;
  return allRecipes()[idx];
}

export function spin(mood) {
  let list = filterRecipes({ diet: load().settings.diet });
  if (mood === 'fast') list = list.filter((r) => r.time <= 25);
  if (mood === 'cheap') list = list.filter((r) => r.cost <= 2);
  if (mood === 'party') list = list.filter((r) => r.tags?.includes('مجلسی') || r.time >= 70);
  if (mood === 'healthy') list = list.filter((r) => r.kcal <= 350);
  if (!list.length) list = allRecipes();
  const r = list[Math.floor(Math.random() * list.length)];
  mutate((s) => { s.spinHist.unshift({ id: r.id, at: Date.now() }); s.spinHist = s.spinHist.slice(0, 20); });
  return r;
}

export function missingFor(r, srv) {
  const f = (srv || r.srv) / r.srv;
  return r.ings.map((i) => {
    const need = i.q * f;
    const have = pantryHave(i.k);
    return { ...i, need, have, miss: Math.max(0, need - have) };
  }).filter((x) => x.miss > 0);
}

export function heatMap(days = 28) {
  const s = load();
  const map = {};
  for (let i = 0; i < days; i++) {
    const dt = new Date(Date.now() - i * 86400000);
    const k = jalaliKey(dt);
    map[k] = s.cooked.filter((c) => c.day === k).length;
  }
  return map;
}

export function stats() {
  const s = load();
  const kcal = s.cooked.reduce((a, c) => a + (getRecipe(c.id)?.kcal || 0), 0);
  return {
    cooked: s.cooked.length, xp: s.xp, streak: s.streak, fav: s.fav.length,
    badges: s.badges.length, pantry: s.pantry.length, custom: s.custom.length,
    kcal, waterToday: s.water[jalaliKey()] || 0,
  };
}

export function weekKeys(from = new Date()) {
  const out = [];
  const d = new Date(from);
  const day = (d.getDay() + 1) % 7; // sat=0 if we want sat start? JS sun=0. Iran week sat.
  // start Saturday
  const satOff = (d.getDay() + 1) % 7;
  d.setDate(d.getDate() - satOff);
  for (let i = 0; i < 7; i++) {
    const x = new Date(d); x.setDate(d.getDate() + i);
    out.push({ key: jalaliKey(x), label: weekdayFa(x), fa: faDate(x), date: x });
  }
  return out;
}

export { PRESETS, AISLES };

// ═══ هوش انبار (بانک‌محور) ═══
import { SYN, STAPLES } from './kt-bank-lib.js';
const canonMap = (() => {
  const m = new Map();
  Object.values(SYN).forEach((arr) => arr.forEach((n) => m.set(n, arr[0])));
  return m;
})();
export const canonName = (k) => { const n = String(k || '').trim().replace(/\s+/g, ' '); return canonMap.get(n) || n; };

export function pantryAll() { return load().pantry; }
export function daysLeft(p) {
  if (!p || !p.exp) return null;
  return Math.ceil((new Date(p.exp).getTime() - Date.now()) / 86400000);
}
export function expLabel(p) {
  const d = daysLeft(p);
  if (d === null) return { cls: '', txt: 'بدون تاریخ' };
  if (d < 0) return { cls: 'danger', txt: faNum(-d) + ' روز گذشته!' };
  if (d === 0) return { cls: 'danger', txt: 'امروز!' };
  if (d <= 3) return { cls: 'warn', txt: faNum(d) + ' روز مانده' };
  if (d <= 7) return { cls: 'warn', txt: faNum(d) + ' روز' };
  return { cls: '', txt: faNum(d) + ' روز' };
}
// تکراری نباش! هشدار افزودن تکراری نزدیک‌انقضا
export function dupCheck(name, exceptId) {
  const n = canonName(name);
  const same = load().pantry.filter((p) => canonName(p.k) === n && p.id !== exceptId);
  if (!same.length) return null;
  const withExp = same.filter((p) => p.exp).sort((a, b) => new Date(a.exp) - new Date(b.exp));
  const target = withExp[0] || same[0];
  const d = daysLeft(target);
  const who = describePantry(target);
  if (d !== null && d <= 3 && d >= 0) {
    return 'رفیق مواظب باش؛ یک ' + target.k + ' دیگه هم تو انبار داری (' + who + ') که فقط ' + faNum(d) + ' روز دیگه تمومه! اول اونو مصرف کن که نپوسه. همینم که داری اضافه می‌کنی چند روز مونده؟ اگه چند روزه، اونم نزدیک انقضاست.';
  }
  if (d !== null && d < 0) {
    return 'رفیق! یک ' + target.k + ' دیگه (' + who + ') توی انبارت هست که تاریخش گذشته؛ اول اونو چک کن. همین جدیده چند روز دوام میاره؟ اگه خودشم چند روزه، خوب ببندش.';
  }
  return 'یک ' + target.k + ' دیگه (' + who + ') توی انبارت هست؛ الان جمعش میشه ' + faNum(same.length + 1) + ' قلم. تاریخ انقضای جدیده رو بزن که هشدارگیرش بیاد رو.';
}
export function describePantry(p) {
  if (p.brand) return 'برند «' + p.brand + '»';
  if (p.model) return 'مدل «' + p.model + '»';
  return 'ثبت‌شده در ' + faDate(new Date(p.addedAt || Date.now()));
}
// تجمیع موجودی هر قلم برای «هرچقدر که داری»
export function pantryAggregate() {
  const agg = {};
  load().pantry.forEach((p) => {
    const k = canonName(p.k);
    const a = agg[k] || (agg[k] = { k: p.k, total: 0, u: p.u || '', count: 0, near: 0, expired: 0 });
    if (a.u === p.u) a.total += (p.q || 0); else if (!a.u) a.u = p.u || '';
    a.count += 1;
    const d = daysLeft(p);
    if (d !== null && d < 0) a.expired += 1; else if (d !== null && d <= 3) a.near += 1;
  });
  return Object.values(agg).sort((a, b) => a.k.localeCompare(b.k, 'fa'));
}
// تطبیق دستور با انبار (مواد خانه‌پیدا مجاز)
export function matchRecipe(r, includeStaples = true) {
  const miss = [];
  (r.ings || []).forEach((i) => {
    if (includeStaples && STAPLES.includes(i.k)) return;
    if (pantryHave(canonName(i.k)) > 0) return;
    miss.push(i);
  });
  return miss;
}
export function cookRank(includeStaples = true) {
  const full = [], near = [];
  allRecipes().forEach((r) => {
    const miss = matchRecipe(r, includeStaples);
    if (miss.length === 0) full.push(r);
    else if (miss.length <= 2) near.push({ r, miss });
  });
  near.sort((a, b) => a.miss.length - b.miss.length || a.r.name.localeCompare(b.r.name, 'fa'));
  return { full, near: near.slice(0, 12) };
}
