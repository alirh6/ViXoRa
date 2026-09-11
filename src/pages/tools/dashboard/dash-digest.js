// 🌅 ViXoRa Morning Digest — خلاصه صبحگاهی: یک اعلان، همه امروز
// src/pages/tools/dashboard/dash-digest.js
import { load } from './dash-state.js';
import { pushNotify, showToast } from './dash-notify.js';

const dk = (ts) => new Date(ts).toDateString();
const fa = (n) => Number(n || 0).toLocaleString('fa-IR');

/** ساخت متن دایجست امروز */
export function buildDigest() {
  const now = new Date();
  const t = dk(now);
  const lines = [];
  // سررسیدها
  const bills = load('vixora:bills', []).filter((b) => !b.paid && b.due && dk(new Date(b.due)) === t);
  if (bills.length) lines.push(`💡 ${bills.length} قبض امروز سررسید دارد (${bills.map((b) => b.title || '').slice(0, 2).join('، ')})`);
  // کارها
  const tasks = JSON.parse(localStorage.getItem('vixora:tasks-' + t) || '[]');
  const open = tasks.filter((x) => !x.done).length;
  if (open) lines.push(`✅ ${open} کار باز امروز داری`);
  // عادت‌ها
  const hs = load('ViXoRa:dash-habits', []);
  const hDone = hs.filter((h) => (h.log || []).some((x) => dk(x) === t)).length;
  if (hs.length) lines.push(`🔥 عادت‌ها: ${hDone} از ${hs.length} انجام شده`);
  // خرج دیروز
  const yest = dk(Date.now() - 86400000);
  const yExp = load('vixora:txs', []).filter((x) => dk(x.date || x.ts || 0) === yest && x.type !== 'income').reduce((a, x) => a + (+x.amount || 0), 0);
  if (yExp > 0) lines.push(`💸 خرج دیروز: ${fa(yExp)}`);
  // تمرکز دیروز
  const yFocus = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]').filter((p) => dk(p.ts) === yest).reduce((a, p) => a + (p.min || 25), 0);
  if (yFocus > 0) lines.push(`🍅 تمرکز دیروز: ${yFocus} دقیقه`);
  // ژورنال دیروز؟
  const yd = new Date(Date.now() - 86400000);
  const yk = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
  if (!load('vixora:journal', {})[yk]) lines.push('📓 ژورنال دیروز خالی ماند — امروز بنویس!');
  // زنجیره ثبت
  const txDays = new Set(load('vixora:txs', []).map((x) => dk(x.date || x.ts || 0)));
  let s = 0;
  const d = new Date();
  if (!txDays.has(dk(d))) d.setDate(d.getDate() - 1);
  while (txDays.has(dk(d))) { s++; d.setDate(d.getDate() - 1); }
  if (s >= 2) lines.push(`🔥 زنجیره ثبت: ${s} روز — نگهش دار!`);
  if (!lines.length) lines.push('روز خلوتی است! یک کار خوب برای خودت بکن. 🌟');
  const h = now.getHours();
  const greet = h < 5 ? 'نیمه‌شب بخیر 🌙' : h < 12 ? 'صبح بخیر ☀️' : h < 17 ? 'ظهر بخیر 🌤' : h < 20 ? 'عصر بخیر 🌇' : 'شب بخیر 🌙';
  return { greet, lines, date: now.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }) };
}

/** انتشار دایجست (حداکثر یک‌بار در روز) */
export function maybeDigest() {
  const key = 'vixora:digest-' + dk(Date.now());
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, '1');
  } catch {}
  const d = buildDigest();
  pushNotify('🌅', `${d.greet} — خلاصه امروز`, d.lines.slice(0, 4).join(' • '));
  setTimeout(() => showToast(`${d.greet} ${d.lines[0] || ''}`, '🌅', 5000), 4000);
  return true;
}

/** نمایش دایجست در فرمان‌یاب/تست */
export function showDigestNow(api) {
  const d = buildDigest();
  api.toast(`🌅 ${d.greet} — ${d.lines[0] || ''}`);
}
