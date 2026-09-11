// 🏆 ViXoRa Achievements — دستاوردها و مدال‌ها + جشن آنلاک
// src/pages/tools/dashboard/dash-achieve.js
import { esc, load } from './dash-state.js';

const UNLOCK_KEY = 'vixora:achieve-unlocked';

export const ACHIEVEMENTS = [
  // شروع
  { id: 'first-step', icon: '👣', name: 'قدم اول', desc: 'اولین ورود به کاکپیت', check: () => true },
  { id: 'tour-done', icon: '🎬', name: 'تماشاگر', desc: 'تمام کردن تور آشنایی', check: () => { try { return !!localStorage.getItem('vixora:tour-done'); } catch { return false; } } },
  { id: 'themer', icon: '🎨', name: 'طراح', desc: 'عوض کردن تم', check: () => { try { return !!localStorage.getItem('vixora:dash-theme'); } catch { return false; } } },
  { id: 'custom-theme', icon: '🖌', name: 'هنرمند', desc: 'ساخت تم شخصی', check: () => { try { return !!localStorage.getItem('vixora:theme-custom'); } catch { return false; } } },
  { id: 'cmdk-user', icon: '⌨️', name: 'سرعت‌برق', desc: 'استفاده از فرمان‌یاب', check: () => { try { return (JSON.parse(localStorage.getItem('vixora:cmdk-hist') || '[]')).length > 0; } catch { return false; } } },
  // مالی
  { id: 'tx-1', icon: '🧾', name: 'حسابدار تازه‌کار', desc: 'ثبت اولین تراکنش', check: () => load('vixora:txs', []).length >= 1 },
  { id: 'tx-50', icon: '💰', name: 'حسابدار حرفه‌ای', desc: 'ثبت ۵۰ تراکنش', check: () => load('vixora:txs', []).length >= 50 },
  { id: 'tx-200', icon: '🏦', name: 'بانکدار', desc: 'ثبت ۲۰۰ تراکنش', check: () => load('vixora:txs', []).length >= 200 },
  { id: 'streak-7', icon: '🔥', name: 'هفته آتشین', desc: '۷ روز پشت‌سرهم ثبت مالی', check: () => txStreak() >= 7 },
  { id: 'streak-30', icon: '🌋', name: 'آتشفشان', desc: '۳۰ روز پشت‌سرهم ثبت مالی', check: () => txStreak() >= 30 },
  { id: 'saver-20', icon: '🏦', name: 'پس‌اندازکار', desc: 'نرخ پس‌انداز بالای ۲۰٪ در ماه', check: () => saveRate() >= 20 },
  { id: 'debt-free', icon: '🕊', name: 'آزاد!', desc: 'صفر شدن همه بدهی‌ها', check: () => { const d = load('vixora:debts', []); return d.length > 0 && d.every((x) => (+(x.remaining ?? x.amount ?? 0) || 0) <= 0); } },
  { id: 'goal-done', icon: '🌟', name: 'به هدف رسیدی!', desc: 'تحقق یک هدف مالی', check: () => load('vixora:goals', []).some((g) => g.target && (g.saved || 0) >= g.target) },
  { id: 'backup-1', icon: '🛟', name: 'احتیاط‌کار', desc: 'اولین بکاپ کامل', check: () => { try { return !!localStorage.getItem('vixora:backup-last'); } catch { return false; } } },
  // موزیک
  { id: 'songs-10', icon: '🎵', name: 'کلکسیونر', desc: '۱۰ آهنگ در کتابخانه', check: () => songs().length >= 10 },
  { id: 'songs-100', icon: '🎧', name: 'دی‌جی', desc: '۱۰۰ آهنگ در کتابخانه', check: () => songs().length >= 100 },
  { id: 'liked-10', icon: '❤️', name: 'عاشق موزیک', desc: '۱۰ آهنگ قلبی', check: () => songs().filter((s) => s.liked).length >= 10 },
  { id: 'listen-60', icon: '⏱', name: 'شنونده', desc: '۶۰ دقیقه گوش دادن', check: () => (load('vixora:music-stats', {}).seconds || 0) >= 3600 },
  // رشد
  { id: 'journal-1', icon: '📓', name: 'خاطره‌نویس', desc: 'اولین روز ژورنال', check: () => Object.keys(load('vixora:journal', {})).length >= 1 },
  { id: 'journal-30', icon: '📚', name: 'نویسنده', desc: '۳۰ روز ژورنال', check: () => Object.keys(load('vixora:journal', {})).length >= 30 },
  { id: 'habit-7', icon: '✅', name: 'منظم', desc: 'زنجیره ۷ روزه یک عادت', check: () => maxHabitStreak() >= 7 },
  { id: 'focus-300', icon: '🍅', name: 'متمرکز', desc: '۳۰۰ دقیقه تمرکز عمیق کل', check: () => focusTotal() >= 300 },
  { id: 'focus-1000', icon: '🧠', name: 'استاد تمرکز', desc: '۱۰۰۰ دقیقه تمرکز عمیق', check: () => focusTotal() >= 1000 },
  { id: 'notes-20', icon: '📝', name: 'پرنویس', desc: '۲۰ یادداشت', check: () => load('vixora:notes', []).length >= 20 },
  { id: 'cust-10', icon: '👥', name: 'تاجر', desc: '۱۰ مشتری', check: () => load('vixora:customers', []).length >= 10 },
  { id: 'book-1', icon: '📖', name: 'کتاب‌خوان', desc: 'تمام کردن یک کتاب', check: () => { try { const g = JSON.parse(localStorage.getItem('vixora:readgoal') || '{}'); return (g.done || 0) >= 1; } catch { return false; } } },
  { id: 'sport-12', icon: '🏋', name: 'ورزشکار', desc: '۱۲ جلسه ورزش', check: () => { try { return JSON.parse(localStorage.getItem('vixora:sport') || '[]').length >= 12; } catch { return false; } } },
  { id: 'review-7', icon: '🌙', name: 'مرورگر شبانه', desc: '۷ شب مرور کامل', check: () => { let n = 0; try { for (let i = 0; i < 60; i++) { const d = new Date(Date.now() - i * 86400000); if ((JSON.parse(localStorage.getItem('vixora:review-' + d.toDateString()) || '[]')).length >= 5) n++; } } catch {} return n >= 7; } },
  { id: 'quests-5', icon: '🗓', name: 'مأموریت‌پذیر', desc: '۵ مأموریت ماهانه', check: () => { try { return JSON.parse(localStorage.getItem('vixora:monthly-quests') || '{}').items?.filter((q) => q.done).length >= 5; } catch { return false; } } },
  { id: 'widgets-30', icon: '🧩', name: 'کلکسیونر ویجت', desc: '۳۰ ویجت روشن همزمان', check: () => { try { return JSON.parse(localStorage.getItem('ViXoRa:dash-layout-v1') || localStorage.getItem('vixora:dash-layout') || '[]').filter((w) => w.on).length >= 30; } catch { return false; } } },
  { id: 'quotes-1', icon: '💬', name: 'حکیم', desc: 'کپی یک نقل‌قول', check: () => { try { return !!localStorage.getItem('vixora:quote-copied'); } catch { return false; } } },
];

function songs() { return load('vixora:music-lib', load('vixora:songs', [])); }
function txStreak() {
  const days = new Set(load('vixora:txs', []).map((t) => new Date(t.date || t.ts || 0).toDateString()));
  let s = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
  return s;
}
function saveRate() {
  const m = new Date().getMonth(), y = new Date().getFullYear();
  const txs = load('vixora:txs', []).filter((t) => { const d = new Date(t.date || t.ts || 0); return d.getMonth() === m && d.getFullYear() === y; });
  const inc = txs.filter((t) => t.type === 'income').reduce((a, t) => a + (+t.amount || 0), 0);
  const exp = txs.filter((t) => t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
  return inc > 0 ? Math.round((inc - exp) / inc * 100) : 0;
}
function maxHabitStreak() {
  let best = 0;
  load('ViXoRa:dash-habits', []).forEach((h) => {
    const days = new Set((h.log || []).map((t) => new Date(t).toDateString()));
    let s = 0;
    const d = new Date();
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
    best = Math.max(best, s);
  });
  return best;
}
function focusTotal() {
  try { return JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]').reduce((a, p) => a + (p.min || 25), 0); }
  catch { return 0; }
}

export function getUnlocked() {
  try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) || '[]'); }
  catch { return []; }
}

/** بررسی و جشن آنلاک‌های جدید — خروجی: لیست تازه‌ها */
export function checkAchievements() {
  const have = new Set(getUnlocked());
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (have.has(a.id)) continue;
    try { if (a.check()) { have.add(a.id); fresh.push(a); } } catch { /* ignore */ }
  }
  try { localStorage.setItem(UNLOCK_KEY, JSON.stringify([...have])); } catch {}
  return { unlocked: [...have], fresh };
}

export function celebrateFresh(fresh) {
  if (!fresh.length) return;
  import('./dash-notify.js').then((N) => {
    fresh.slice(0, 3).forEach((a, i) => {
      setTimeout(() => {
        N.pushNotify(a.icon, `دستاورد آنلاک شد: ${a.name}!`, a.desc);
        N.showToast(`🏆 ${a.name}!`, a.icon, 4500);
      }, i * 1200);
    });
  }).catch(() => null);
}

export function renderAchievements() {
  const { unlocked } = checkAchievements();
  const have = new Set(unlocked);
  const pct = Math.round(have.size / ACHIEVEMENTS.length * 100);
  return `<div class="dash-ac-wrap">
    <div class="dash-ac-head"><b>🏆 دستاوردها</b><span class="dash-chip">${have.size} از ${ACHIEVEMENTS.length} • ${pct}٪</span></div>
    <div class="dash-bar"><i style="width:${pct}%"></i></div>
    <div class="dash-ac-grid">${ACHIEVEMENTS.map((a) => `
      <div class="dash-ac-card ${have.has(a.id) ? 'on' : 'lock'}">
        <span class="dash-ac-ic">${have.has(a.id) ? a.icon : '🔒'}</span>
        <b>${have.has(a.id) ? esc(a.name) : '؟؟؟'}</b><small>${esc(a.desc)}</small>
      </div>`).join('')}</div>
    <small class="dash-hint">💡 دستاوردها خودکار بررسی می‌شوند؛ هر ورود به کاکپیت = یک شانس آنلاک! 🎰</small></div>`;
}
