// 🛰 ViXoRa Cockpit Data — جمع‌آوری یکپارچه داده هر ۶ ابزار + شاخص‌ها
// src/pages/tools/dashboard/dash-data.js

let cache = { at: 0, data: null };
const TTL = 15000;

export function invalidateDashData() { cache.at = 0; cache.data = null; }

export async function getDashData(force = false) {
  if (!force && cache.data && Date.now() - cache.at < TTL) return cache.data;
  const data = {
    notes: { items: [], count: 0, pinned: 0, updated: 0 },
    customers: { items: [], count: 0, updated: 0 },
    building: { buildings: [], units: 0, residents: 0, openCharges: 0 },
    music: { songs: [], playlists: [], count: 0, liked: 0, plays: 0, mins: 0 },
    finance: { bundle: null, txs: 0, income30: 0, expense30: 0, debts: 0, goals: 0, billsDue: 0, invoicesOpen: 0 },
    arcade: { games: 0, plays: 0, records: [] },
    errors: [],
  };
  // یادداشت‌ها
  try {
    const { getToolData } = await import('../../../core/actions/tools-service.js');
    const items = await getToolData('notes').catch(() => []);
    const arr = Array.isArray(items) ? items : [];
    data.notes.items = arr.slice(0, 8);
    data.notes.count = arr.length;
    data.notes.pinned = arr.filter((n) => n.pinned || n.favorite).length;
    data.notes.all = arr;
  } catch (e) { data.errors.push('notes'); }
  // مشتریان
  try {
    const { getToolData } = await import('../../../core/actions/tools-service.js');
    const items = await getToolData('customerInfo').catch(() => []);
    const arr = Array.isArray(items) ? items : [];
    data.customers.items = arr.slice(0, 8);
    data.customers.count = arr.length;
    data.customers.all = arr;
  } catch { data.errors.push('customers'); }
  // ساختمان
  try {
    const store = await import('../building/building-store.js');
    const db = store.loadDb?.() || { buildings: [] };
    const list = db.buildings || db.items || [];
    data.building.buildings = list.slice(0, 6);
    data.building.all = list;
    data.building.units = list.reduce((a, b) => a + (b.units?.length || b.floors * 2 || 0), 0);
  } catch { data.errors.push('building'); }
  // موزیک
  try {
    const lib = await import('../../../core/services/music-library-service.js');
    const songs = await lib.listSongs().catch(() => []);
    const playlists = await lib.listPlaylists().catch(() => []);
    data.music.songs = songs.slice(0, 10);
    data.music.all = songs;
    data.music.count = songs.length;
    data.music.playlists = playlists;
    data.music.liked = songs.filter((s) => s.liked).length;
    data.music.plays = songs.reduce((a, s) => a + (s.playCount || 0), 0);
    data.music.mins = Math.round(songs.reduce((a, s) => a + (s.playCount || 0) * (Number(s.duration) || 200), 0) / 60);
  } catch { data.errors.push('music'); }
  // مالی
  try {
    const fin = await import('../../../core/services/finance-service.js');
    const bundle = await fin.getFinanceBundle().catch(() => null);
    data.finance.bundle = bundle;
    const txs = bundle?.txs || [];
    data.finance.txs = txs.length;
    const since = Date.now() - 30 * 864e5;
    for (const t of txs) {
      const at = Date.parse(t.date || t.createdAt || 0) || 0;
      if (at < since) continue;
      if (t.type === 'income') data.finance.income30 += Number(t.amount) || 0;
      else if (t.type === 'expense') data.finance.expense30 += Number(t.amount) || 0;
    }
    data.finance.debts = (bundle?.debts || []).filter((d) => !d.settled).length;
    data.finance.goals = (bundle?.goals || []).length;
    data.finance.billsDue = (bundle?.bills || []).filter((b) => b.active !== false).length;
    data.finance.invoicesOpen = (bundle?.invoices || []).filter((d) => d.status !== 'paid' && d.status !== 'cancelled').length;
    data.finance.recent = txs.slice(0, 6);
  } catch { data.errors.push('finance'); }
  // آرکید
  try {
    const arc = await import('../entertainment/arcade.js');
    const games = arc.GAMES || [];
    data.arcade.games = games.length;
    data.arcade.plays = arc.totalPlays ? arc.totalPlays() : 0;
    data.arcade.records = games.map((g) => ({ id: g.id, title: g.fa || g.title || g.id, best: arc.getBest ? arc.getBest(g.id) : 0, plays: arc.getPlays ? arc.getPlays(g.id) : 0 }))
      .sort((a, b) => b.best - a.best).slice(0, 6);
    data.arcade.all = games;
  } catch { data.errors.push('arcade'); }

  // شاخص سلامت هر ابزار
  data.health = computeHealth(data);
  cache = { at: Date.now(), data };
  return data;
}

function computeHealth(d) {
  const h = {};
  h.notes = scoreOf(d.notes.count, [1, 5, 20]);
  h.customers = scoreOf(d.customers.count, [1, 10, 50]);
  h.building = scoreOf(d.building.all?.length || 0, [1, 2, 5]);
  h.music = scoreOf(d.music.count, [5, 30, 150]);
  h.finance = scoreOf(d.finance.txs, [5, 40, 200]);
  h.arcade = scoreOf(d.arcade.plays, [1, 20, 200]);
  h.total = Math.round((h.notes + h.customers + h.building + h.music + h.finance + h.arcade) / 6);
  return h;
}

function scoreOf(v, [a, b, c]) {
  if (v >= c) return 100;
  if (v >= b) return 75;
  if (v >= a) return 50;
  if (v > 0) return 25;
  return 5;
}

/* ---------- جستجوی سراسری ---------- */
export function globalSearch(data, q, limit = 24) {
  q = String(q || '').trim().toLowerCase();
  if (q.length < 2 || !data) return [];
  const out = [];
  const push = (tool, icon, title, sub, link) => {
    if (out.length < limit) out.push({ tool, icon, title: String(title).slice(0, 60), sub: String(sub || '').slice(0, 80), link });
  };
  for (const n of data.notes.all || []) {
    const t = `${n.title || ''} ${n.body || n.content || ''}`.toLowerCase();
    if (t.includes(q)) push('notes', '📝', n.title || 'یادداشت', (n.body || n.content || '').slice(0, 60), '/tools/note');
  }
  for (const c of data.customers.all || []) {
    const t = `${c.name || ''} ${c.phone || ''} ${c.company || ''}`.toLowerCase();
    if (t.includes(q)) push('customers', '👥', c.name || 'مشتری', c.phone || c.company || '', '/tools/customerInfo');
  }
  for (const s of data.music.all || []) {
    const t = `${s.title || ''} ${s.artist || ''} ${s.album || ''}`.toLowerCase();
    if (t.includes(q)) push('music', '🎵', s.title || 'آهنگ', s.artist || '', '/tools/music');
  }
  for (const t of data.finance.bundle?.txs || []) {
    const x = `${t.note || t.title || ''} ${t.amount || ''}`.toLowerCase();
    if (x.includes(q)) push('finance', '🧾', t.note || t.title || 'تراکنش', `${t.type === 'income' ? '+' : '−'}${t.amount}`, '/tools/invoices');
  }
  for (const b of data.building.all || []) {
    const t = `${b.name || b.title || ''} ${b.code || ''}`.toLowerCase();
    if (t.includes(q)) push('building', '🏢', b.name || b.title || 'ساختمان', b.code || '', '/tools/building');
  }
  for (const g of data.arcade.all || []) {
    const t = `${g.fa || ''} ${g.en || ''} ${g.id}`.toLowerCase();
    if (t.includes(q)) push('arcade', '🎮', g.fa || g.en || g.id, 'بازی', '/tools/entertainment');
  }
  return out;
}

/* ---------- بینش‌های چندابزاری ---------- */
export function crossInsights(data) {
  const out = [];
  const push = (icon, level, text, link = '') => out.push({ icon, level, text, link });
  const f = data.finance;
  const net = f.income30 - f.expense30;
  // مالی + رفتار
  if (net < 0 && data.arcade.plays > 30) {
    push('⚖️', 'warn', 'هم خرجت از دخل بیشتره، هم زیاد بازی می‌کنی — وقتشه اولویت‌ها را مرور کنی!', '/tools/invoices');
  }
  if (net > 0 && f.income30 > 0 && net / f.income30 > 0.3) {
    push('💎', 'good', `نرخ پس‌اندازت بالای ۳۰٪ است! این ماه ${fmtFa(net)} جلو هستی.`, '/tools/invoices');
  }
  // موزیک + حال
  if (data.music.mins > 300) {
    push('🎧', 'info', `این ماه بیش از ${fmtFa(Math.round(data.music.mins / 60))} ساعت موزیک گوش دادی — گوش‌هایت را هم استراحت بده!`, '/tools/music');
  }
  if (data.music.count > 0 && data.music.liked === 0) {
    push('🤍', 'info', 'هنوز هیچ آهنگی را ❤️ نکردی — علاقه‌مندی‌ها رادیوی بهتری می‌سازند!', '/tools/music');
  }
  // یادداشت + مشتری
  if (data.notes.count >= 10 && data.customers.count === 0) {
    push('👥', 'info', 'زیاد یادداشت می‌نویسی ولی مشتری ثبت نکردی — دفتر مشتریان منتظرته!', '/tools/customerInfo');
  }
  if (data.customers.count > 0 && data.notes.count === 0) {
    push('📝', 'info', 'مشتری داری ولی یادداشت نداری — برای هر مشتری یادداشت بگذار!', '/tools/note');
  }
  // بدهی + هدف
  if (f.debts > 0 && f.goals === 0) {
    push('🎯', 'warn', 'بدهی داری ولی هدف پس‌اندازی تعریف نکردی — یک هدف بساز تا انگیزه بگیری!', '/tools/invoices');
  }
  // فاکتور باز + نقدینگی
  if (f.invoicesOpen > 3) {
    push('📄', 'warn', `${fmtFa(f.invoicesOpen)} فاکتور باز داری — وقتشه پیگیری کنی!`, '/tools/invoices');
  }
  // ساختمان خالی
  if (data.building.all?.length && !data.building.units) {
    push('🏢', 'info', 'ساختمان داری ولی واحدی تعریف نشده — واحدها را اضافه کن.', '/tools/building');
  }
  // رکورد بازی
  const recs = (data.arcade.records || []).filter((r) => r.best > 0);
  if (recs.length >= 5) {
    push('🏆', 'good', `در ${fmtFa(recs.length)} بازی رکورد داری — گیمر واقعی! 🎮`, '/tools/entertainment');
  }
  // سکوت داده
  if (!data.notes.count && !data.finance.txs && !data.music.count) {
    push('🌱', 'info', 'تازه شروع کردی؟ از راهنمای «شروع سریع» قدم‌به‌قدم پیش برو!', '');
  }
  return out.slice(0, 8);
}

function fmtFa(n) {
  return String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

/* ---------- رشد ماهانه هر ابزار ---------- */
export function toolGrowth(data) {
  const since = Date.now() - 30 * 864e5;
  const prevSince = Date.now() - 60 * 864e5;
  const inWin = (at, a, b) => { const t = Date.parse(at || 0) || 0; return t >= a && t < b; };
  const now = Date.now();
  const g = (cur, prev) => ({ cur, prev, d: prev ? Math.round(((cur - prev) / prev) * 100) : (cur ? 100 : 0) });
  const txs = data.finance.bundle?.txs || [];
  return {
    notes: g(
      (data.notes.all || []).filter((n) => inWin(n.updatedAt || n.createdAt, since, now)).length,
      (data.notes.all || []).filter((n) => inWin(n.updatedAt || n.createdAt, prevSince, since)).length,
    ),
    txs: g(
      txs.filter((t) => inWin(t.date || t.createdAt, since, now)).length,
      txs.filter((t) => inWin(t.date || t.createdAt, prevSince, since)).length,
    ),
    songs: g(
      (data.music.all || []).filter((s) => inWin(s.createdAt, since, now)).length,
      (data.music.all || []).filter((s) => inWin(s.createdAt, prevSince, since)).length,
    ),
    customers: g(
      (data.customers.all || []).filter((c) => inWin(c.updatedAt || c.createdAt, since, now)).length,
      (data.customers.all || []).filter((c) => inWin(c.updatedAt || c.createdAt, prevSince, since)).length,
    ),
  };
}

/* ---------- خلاصه هفتگی ---------- */
export function weekSummary(data) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - i);
    const d1 = d0.getTime() + 864e5;
    let exp = 0, inc = 0;
    for (const t of data.finance.bundle?.txs || []) {
      const at = Date.parse(t.date || t.createdAt || 0) || 0;
      if (at < d0.getTime() || at >= d1) continue;
      if (t.type === 'expense') exp += Number(t.amount) || 0;
      else if (t.type === 'income') inc += Number(t.amount) || 0;
    }
    days.push({ label: d0.toLocaleDateString('fa-IR', { weekday: 'short' }), exp, inc });
  }
  return days;
}
