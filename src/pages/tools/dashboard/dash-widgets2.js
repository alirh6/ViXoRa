// 🧩 ViXoRa Cockpit Widgets 2 — ۱۴ ویجت تکمیلی
// src/pages/tools/dashboard/dash-widgets2.js
import { esc, faDigits, relTime, fmtCompact } from './dash-state.js';
import { dashSpark, dashHBars, dashVBars, dashRing, dashDonut, dashHeatmap } from './dash-charts.js';

export const WIDGET2_META = {
  'tx-quick': { title: 'ثبت سریع تراکنش', icon: '🧾', desc: 'دخل/خرج بدون باز کردن مالی' },
  'playlists': { title: 'پلی‌لیست‌ها', icon: '📝', desc: 'پخش فوری پلی‌لیست' },
  'sessions': { title: 'نشست‌های شنیداری', icon: '⏱', desc: 'آمار گوش‌دادن' },
  'networth': { title: 'ارزش خالص', icon: '📈', desc: 'دارایی، بدهی، خالص' },
  'bills-cal': { title: 'تقویم قبوض', icon: '🗓', desc: '۳۰ روز آینده قبوض' },
  'quotes-day': { title: 'پیش‌فاکتورها', icon: '📝', desc: 'بازها و ارزش کل' },
  'habits': { title: 'عادت‌ها', icon: '🔥', desc: 'ردیاب عادت روزانه' },
  'calendar': { title: 'تقویم امروز', icon: '📅', desc: 'رویدادهای امروز ابزارها' },
  'heatmap': { title: 'نقشه فعالیت', icon: '🟩', desc: 'حضور ۱۲ هفته اخیر' },
  'cats': { title: 'دسته‌های پرخرج', icon: '🎯', desc: '۵ دسته اول ماه' },
  'accounts': { title: 'حساب‌ها', icon: '🏦', desc: 'موجودی حساب‌ها' },
  'calc': { title: 'ماشین‌حساب', icon: '🧮', desc: 'محاسبه سریع' },
  'notes-stats': { title: 'آمار یادداشت', icon: '📊', desc: 'توزیع و رشد' },
  'sys': { title: 'وضعیت سیستم', icon: '🖥', desc: 'مرورگر، حافظه، نسخه' },
};

export function renderWidget2(id, data, st, ui) {
  switch (id) {
    case 'tx-quick': return wTxQuick(data);
    case 'playlists': return wPlaylists(data);
    case 'sessions': return wSessions();
    case 'networth': return wNetworth(data);
    case 'bills-cal': return wBillsCal(data);
    case 'quotes-day': return wQuotes(data);
    case 'habits': return wHabits();
    case 'calendar': return wCalendar(data);
    case 'heatmap': return wHeatmap();
    case 'cats': return wCats(data);
    case 'accounts': return wAccounts(data);
    case 'calc': return wCalc(st);
    case 'notes-stats': return wNotesStats(data);
    case 'sys': return wSys();
    default: return `<div class="dash-empty">ویجت ناشناس: ${esc(id)}</div>`;
  }
}

/* ---------- ثبت سریع تراکنش ---------- */
function wTxQuick(data) {
  const accs = (data.finance.bundle?.accounts || []).map((a) => `<option value="${esc(a.id)}">${esc(a.name || '')}</option>`).join('');
  const cats = (data.finance.bundle?.categories || []).filter((c) => c.type !== 'income').map((c) => `<option value="${esc(c.id)}">${esc(c.name || c.title || '')}</option>`).join('');
  return `<div class="dash-row"><button class="dash-chip is-exp" data-action="w-tx-type" data-v="expense">💸 هزینه</button>
  <button class="dash-chip" data-action="w-tx-type" data-v="income">💰 درآمد</button></div>
  <div class="dash-form">
    <input class="dash-input" data-dash="tx-amount" type="number" min="0" placeholder="مبلغ (تومان)" />
    <input class="dash-input" data-dash="tx-note" placeholder="شرح…" />
    <div class="dash-row"><select class="dash-input" data-dash="tx-acc"><option value="">حساب…</option>${accs}</select>
    <select class="dash-input" data-dash="tx-cat"><option value="">دسته…</option>${cats}</select></div>
    <button class="dash-btn dash-btn-primary" data-action="w-tx-save">✅ ثبت تراکنش</button>
  </div>`;
}

/* ---------- پلی‌لیست‌ها ---------- */
function wPlaylists(data) {
  const pls = data.music.playlists || [];
  if (!pls.length) return '<div class="dash-empty">📝 پلی‌لیستی نیست.</div>';
  return pls.slice(0, 6).map((p) => `<div class="dash-rowline"><span class="dash-t">📝 ${esc(p.title || p.name || '')}</span>
    <span class="dash-s">${faDigits(String((p.songIds || []).length))} آهنگ</span>
    <button class="dash-icon-btn" data-action="w-play-pl" data-id="${esc(p.id)}">▶</button></div>`).join('') +
    `<div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/music">همه پلی‌لیست‌ها ↗</button></div>`;
}

/* ---------- نشست‌های شنیداری ---------- */
function wSessions() {
  let sessions = [];
  try { sessions = JSON.parse(localStorage.getItem('ViXoRa:music-sessions') || '[]'); } catch { /* ignore */ }
  const total = sessions.reduce((a, s) => a + (s.seconds || 0), 0);
  const plays = sessions.reduce((a, s) => a + (s.plays || 0), 0);
  return `<div class="dash-stats"><div><b>${faDigits(String(sessions.length))}</b><span>⏱ نشست</span></div>
  <div><b>${faDigits(String(Math.round(total / 60)))}</b><span>دقیقه</span></div></div>` +
    sessions.slice(-4).reverse().map((s) => `<div class="dash-rowline"><span class="dash-t">🎧 ${new Date(s.startedAt).toLocaleDateString('fa-IR')}</span>
      <span class="dash-s">${faDigits(String(s.plays))} پخش • ${faDigits(String(Math.round((s.seconds || 0) / 60)))} دقیقه</span></div>`).join('') +
    `<div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-session-toggle">⏱ شروع/پایان نشست</button></div>`;
}

/* ---------- ارزش خالص ---------- */
function wNetworth(data) {
  const b = data.finance.bundle;
  if (!b) return '<div class="dash-empty">داده مالی نیست.</div>';
  const accs = b.accounts || [];
  const withBal = accs.filter((a) => Number.isFinite(Number(a.balance)));
  const assets = withBal.length ? withBal.reduce((s, a) => s + Number(a.balance), 0)
    : (b.txs || []).reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) || 0 : t.type === 'expense' ? -(Number(t.amount) || 0) : 0), 0);
  const debts = (b.debts || []).filter((d) => !d.settled).reduce((s, d) => {
    const paid = (d.payments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0);
    return s + Math.max(0, (Number(d.total) || 0) - paid);
  }, 0);
  const net = assets - debts;
  return `<div class="dash-big ${net >= 0 ? 'pos' : 'neg'}">📈 ${fmtCompact(net)} <small>تومان</small></div>
  <div class="dash-kv"><span>🏦 دارایی: ${fmtCompact(assets)}</span><span>🤝 بدهی: ${fmtCompact(debts)}</span></div>
  <canvas data-dash-chart2="networth" height="90"></canvas>
  <script type="dash-data" data-dash="nw-data">${JSON.stringify({ assets, debts })}</script>`;
}

/* ---------- تقویم قبوض ---------- */
function wBillsCal(data) {
  const bills = (data.finance.bundle?.bills || []).filter((x) => x.active !== false);
  if (!bills.length) return '<div class="dash-empty">💡 قبض فعالی نیست.</div>';
  const today = new Date().getDate();
  const rows = [];
  for (let d = 0; d < 30; d++) {
    const day = new Date(Date.now() + d * 864e5);
    const due = bills.filter((x) => Number(x.dueDay) === day.getDate());
    if (due.length) rows.push({ day, due });
    if (rows.length >= 6) break;
  }
  if (!rows.length) return '<div class="dash-empty">۳۰ روز آینده قبضی سررسید نمی‌شود. 🎉</div>';
  return rows.map(({ day, due }) => `<div class="dash-rowline"><span class="dash-t">📅 ${day.toLocaleDateString('fa-IR', { day: 'numeric', month: 'short', weekday: 'short' })}</span>
    <span class="dash-s">${due.map((x) => esc(x.title)).join('، ')}</span></div>`).join('');
}

/* ---------- پیش‌فاکتورها ---------- */
function wQuotes(data) {
  let quotes = {};
  try { quotes = JSON.parse(localStorage.getItem('ViXoRa:fin-quotes') || '{}'); } catch { /* ignore */ }
  const invs = (data.finance.bundle?.invoices || []).filter((x) => quotes[String(x.id)]);
  const total = invs.reduce((a, x) => a + (x.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0), 0);
  return `<div class="dash-stats"><div><b>${faDigits(String(invs.length))}</b><span>📝 باز</span></div>
  <div><b>${fmtCompact(total)}</b><span>💰 ارزش</span></div></div>` +
    invs.slice(0, 4).map((x) => `<div class="dash-rowline"><span class="dash-t">📝 ${esc(x.customer || '')}</span>
      <span class="dash-s">${esc(x.number || '')}</span></div>`).join('') +
    `<div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/invoices">استودیو فاکتور ↗</button></div>`;
}

/* ---------- عادت‌ها ---------- */
const HABIT_KEY = 'ViXoRa:dash-habits';
export function getHabits() {
  try { return JSON.parse(localStorage.getItem(HABIT_KEY) || '[]'); } catch { return []; }
}
function wHabits() {
  const habits = getHabits();
  const today = new Date().toDateString();
  const rows = habits.map((h, i) => {
    const done = (h.log || []).includes(today);
    const streak = calcStreak(h.log || []);
    return `<div class="dash-rowline ${done ? 'is-done' : ''}"><button class="dash-icon-btn" data-action="w-habit-toggle" data-i="${i}">${done ? '✅' : '⬜'}</button>
    <span class="dash-t">${esc(h.name)}</span><span class="dash-s">🔥 ${faDigits(String(streak))}</span>
    <button class="dash-icon-btn" data-action="w-habit-del" data-i="${i}">✕</button></div>`;
  }).join('');
  return (rows || '<div class="dash-empty">عادتی ثبت نشده. یکی اضافه کن! 💪</div>') +
    `<div class="dash-row"><input class="dash-input" data-dash="habit-new" placeholder="➕ عادت جدید… (Enter)" /></div>`;
}
function calcStreak(log) {
  const set = new Set(log);
  let s = 0;
  const d = new Date();
  if (!set.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (set.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
  return s;
}

/* ---------- تقویم امروز ---------- */
function wCalendar(data) {
  const items = [];
  const bills = (data.finance.bundle?.bills || []).filter((x) => x.active !== false && Number(x.dueDay) === new Date().getDate());
  bills.forEach((x) => items.push(['💡', `سررسید قبض «${x.title}» — امروز!`]));
  const debts = (data.finance.bundle?.debts || []).filter((d) => !d.settled && d.dueDate && new Date(d.dueDate).toDateString() === new Date().toDateString());
  debts.forEach((d) => items.push(['🤝', `سررسید بدهی «${d.person || ''}» — امروز!`]));
  let alarm = null;
  try { alarm = JSON.parse(localStorage.getItem('ViXoRa:music-alarm') || 'null'); } catch { /* ignore */ }
  if (alarm?.at && new Date(alarm.at).toDateString() === new Date().toDateString()) items.push(['🔔', `آلارم موزیک ساعت ${new Date(alarm.at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`]);
  items.push(['📅', `${new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}`]);
  if (!items.length) items.push(['🎉', 'امروز رویدادی نداری — روز آرومیه!']);
  return items.map(([i, t]) => `<div class="dash-rowline"><span class="dash-t">${i} ${esc(t)}</span></div>`).join('');
}

/* ---------- نقشه حرارتی ---------- */
function wHeatmap() {
  return `<canvas data-dash-chart2="heatmap" height="120"></canvas>
  <div class="dash-hint">فعالیت روزانه (بر اساس تراکنش‌ها و بازی‌ها) — ۱۲ هفته اخیر</div>`;
}

/* ---------- دسته‌های پرخرج ---------- */
function wCats() {
  return `<canvas data-dash-chart2="cats" height="170"></canvas>`;
}

/* ---------- حساب‌ها ---------- */
function wAccounts(data) {
  const accs = data.finance.bundle?.accounts || [];
  if (!accs.length) return '<div class="dash-empty">🏦 حسابی ثبت نشده.</div>';
  return accs.slice(0, 6).map((a) => `<div class="dash-rowline"><span class="dash-t">🏦 ${esc(a.name || '')}</span>
    <span class="dash-n">${Number.isFinite(Number(a.balance)) ? fmtCompact(Number(a.balance)) : '—'}</span></div>`).join('') +
    `<div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/invoices">مدیریت حساب‌ها ↗</button></div>`;
}

/* ---------- ماشین‌حساب ---------- */
function wCalc(st) {
  return `<input class="dash-input dash-calc" data-dash="calc" placeholder="مثلاً: 150000*12/10" dir="ltr" value="${esc(st.calcQ || '')}" />
  <div class="dash-big" data-dash="calc-out">${st.calcOut || '='}</div>
  <div class="dash-qa-grid">${['+', '−', '×', '÷', '%', 'C'].map((o) => `<button class="dash-qa" data-action="w-calc-op" data-v="${o}">${o}</button>`).join('')}</div>`;
}
export function evalCalc(expr) {
  let s = String(expr || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/٬|,/g, '').replace(/%/g, '/100');
  if (!/^[\d\s+\-*/.()]+$/.test(s) || !s.trim()) return null;
  try {
    const val = Function(`"use strict"; return (${s})`)();
    return Number.isFinite(val) ? val : null;
  } catch { return null; }
}

/* ---------- آمار یادداشت ---------- */
function wNotesStats(data) {
  const all = data.notes.all || [];
  const pinned = all.filter((n) => n.pinned || n.favorite).length;
  const week = all.filter((n) => (Date.parse(n.updatedAt || n.createdAt || 0) || 0) > Date.now() - 7 * 864e5).length;
  return `<div class="dash-stats"><div><b>${faDigits(String(all.length))}</b><span>📝 کل</span></div>
  <div><b>${faDigits(String(pinned))}</b><span>📌 سنجاق</span></div>
  <div><b>${faDigits(String(week))}</b><span>🆕 این هفته</span></div></div>
  <canvas data-dash-chart2="notes" height="100"></canvas>`;
}

/* ---------- سیستم ---------- */
function wSys() {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'نامشخص';
  const online = navigator.onLine ? '🟢 آنلاین' : '🔴 آفلاین';
  const cores = navigator.hardwareConcurrency || '—';
  return `<div class="dash-kv"><span>🌐 ${browser}</span><span>${online}</span></div>
  <div class="dash-kv"><span>🧠 ${faDigits(String(cores))} هسته</span><span>📱 ${faDigits(String(screen.width))}×${faDigits(String(screen.height))}</span></div>
  <div class="dash-kv"><span>🛩 ViXoRa Cockpit نسخه ۱٫۰</span></div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-sys-copy">📋 کپی مشخصات</button></div>`;
}

/* ================================================================== */
/* پس از رندر                                                             */
/* ================================================================== */
export function afterWidgets2Render(root, data) {
  root.querySelectorAll('[data-dash-chart2]').forEach((cv) => {
    try {
      const kind = cv.dataset.dashChart2;
      if (kind === 'networth') {
        const d = root.querySelector('[data-dash="nw-data"]');
        const { assets = 0, debts = 0 } = d ? JSON.parse(d.textContent || '{}') : {};
        dashDonut(cv, [
          { label: 'دارایی', value: Math.max(0, assets), color: '#34d399' },
          { label: 'بدهی', value: Math.max(0, debts), color: '#f43f5e' },
        ], { h: 90, thickness: 20 });
      } else if (kind === 'heatmap') {
        const txs = data.finance.bundle?.txs || [];
        const weeks = [];
        for (let w = 11; w >= 0; w--) {
          const week = [];
          for (let d = 6; d >= 0; d--) {
            const day = new Date();
            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() - (w * 7 + d));
            const n = txs.filter((t) => {
              const at = Date.parse(t.date || t.createdAt || 0) || 0;
              return at >= day.getTime() && at < day.getTime() + 864e5;
            }).length;
            week.push(n);
          }
          weeks.push(week);
        }
        dashHeatmap(cv, weeks, { h: 120 });
      } else if (kind === 'cats') {
        const now = Date.now();
        const cats = new Map((data.finance.bundle?.categories || []).map((c) => [c.id, c.name || c.title || 'دسته']));
        const byCat = new Map();
        for (const t of data.finance.bundle?.txs || []) {
          const at = Date.parse(t.date || t.createdAt || 0) || 0;
          if (t.type !== 'expense' || at < now - 30 * 864e5) continue;
          byCat.set(t.categoryId || '', (byCat.get(t.categoryId || '') || 0) + (Number(t.amount) || 0));
        }
        dashHBars(cv, [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ label: cats.get(k) || 'بدون دسته', value: v })));
      } else if (kind === 'notes') {
        const all = data.notes.all || [];
        const daily = [];
        for (let i = 13; i >= 0; i--) {
          const d0 = new Date(); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - i);
          daily.push(all.filter((n) => {
            const at = Date.parse(n.updatedAt || n.createdAt || 0) || 0;
            return at >= d0.getTime() && at < d0.getTime() + 864e5;
          }).length);
        }
        dashSpark(cv, daily, { h: 100, color: '#38bdf8' });
      }
    } catch { /* ignore */ }
  });
}
