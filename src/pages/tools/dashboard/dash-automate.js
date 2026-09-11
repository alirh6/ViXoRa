// 🤖 ViXoRa Automations — قوانین اگر-آنگاه + روتین‌های خودکار
// src/pages/tools/dashboard/dash-automate.js
import { esc, load, save } from './dash-state.js';
import { pushNotify, showToast } from './dash-notify.js';

const KEY = 'vixora:automations';

/** قانون: {id,on,kind:'bill'|'debt'|'goal'|'backup'|'report'|'greet'|'streak',days?,msg?} */
const PRESETS = [
  { kind: 'bill', days: 2, icon: '💡', name: 'هشدار قبض', desc: '۲ روز قبل از سررسید هر قبض، اعلان بده' },
  { kind: 'debt', days: 3, icon: '🤝', name: 'یادآور بدهی', desc: '۳ روز قبل از مهلت بدهی، اعلان بده' },
  { kind: 'goal', days: 0, icon: '🌟', name: 'جشن هدف', desc: 'وقتی هدفی به ۱۰۰٪ رسید، جشن بگیر' },
  { kind: 'backup', days: 7, icon: '🛟', name: 'یادآور بکاپ', desc: 'اگر ۷ روز بکاپ نگرفتی، یادآوری کن' },
  { kind: 'report', days: 7, icon: '📊', name: 'یادآور گزارش', desc: 'هر ۷ روز گزارش هفتگی را پیشنهاد بده' },
  { kind: 'greet', days: 0, icon: '👋', name: 'خوش‌آمد روزانه', desc: 'اولین بازدید هر روز، خلاصه امروز را نشان بده' },
  { kind: 'streak', days: 0, icon: '🔥', name: 'نگهبان استریک', desc: 'اگر زنجیره‌ای در خطر است، هشدار بده' },
  { kind: 'silence', days: 3, icon: '😴', name: 'هشدار سکوت مالی', desc: 'اگر ۳ روز تراکنشی ثبت نشد، یادآوری کن' },
  { kind: 'review', days: 0, icon: '🌙', name: 'یادآور مرور شبانه', desc: 'بعد از ساعت ۲۲ اگر مرور نکردی، یادآوری کن' },
];

export function getAutomations() {
  try {
    const a = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(a)) return a;
  } catch {}
  return PRESETS.map((p, i) => ({ id: 'a' + i, on: true, ...p }));
}
export function setAutomations(list) { save(KEY, list); }
export function toggleAutomation(id) {
  const list = getAutomations().map((a) => a.id === id ? { ...a, on: !a.on } : a);
  setAutomations(list);
  return list;
}

const firedKey = (kind) => `vixora:auto-fired-${kind}-${new Date().toDateString()}`;
function once(kind, fn) {
  try {
    if (localStorage.getItem(firedKey(kind))) return false;
    localStorage.setItem(firedKey(kind), '1');
  } catch {}
  fn();
  return true;
}

/** اجرای همه قوانین فعال (در بوت داشبورد) */
export function runAutomations() {
  const rules = getAutomations().filter((a) => a.on);
  const has = (k) => rules.some((a) => a.kind === k);
  const now = Date.now();
  if (has('bill')) {
    const days = rules.find((a) => a.kind === 'bill')?.days ?? 2;
    const c = load('vixora:bills', []).filter((b) => !b.paid && b.due && (new Date(b.due) - now) < days * 86400000).length;
    if (c) once('bill', () => { pushNotify('💡', `${c} قبض در آستانه سررسید`, 'از مرکز اعلان‌ها ببین.'); showToast(`${c} قبض نزدیک سررسید!`, '💡'); });
  }
  if (has('silence')) {
    const days = rules.find((a) => a.kind === 'silence')?.days ?? 3;
    const txs = load('vixora:txs', []);
    const last = txs.length ? Math.max(...txs.map((t) => new Date(t.date || t.ts || 0).getTime())) : 0;
    if (last && now - last > days * 86400000) once('silence', () => pushNotify('😴', `${days} روز است تراکنشی ثبت نشده`, 'ثبت سریع از کاکپیت!'));
  }
  if (has('backup')) {
    const last = +(localStorage.getItem('vixora:backup-last') || 0);
    if (now - last > 7 * 86400000) once('backup', () => pushNotify('🛟', 'وقت بکاپ هفتگی است!', 'از مرکز خروجی بکاپ بگیر.'));
  }
  if (has('report')) {
    const last = +(localStorage.getItem('vixora:report-last') || 0);
    if (now - last > 7 * 86400000) once('report', () => pushNotify('📊', 'گزارش هفتگی‌ات آماده است!', 'عملکردت را مرور کن.'));
  }
  if (has('greet')) {
    once('greet', () => {
      const h = new Date().getHours();
      const g = h < 5 ? 'نیمه‌شب بخیر 🌙' : h < 12 ? 'صبح بخیر ☀️' : h < 17 ? 'ظهر بخیر 🌤' : h < 20 ? 'عصر بخیر 🌇' : 'شب بخیر 🌙';
      showToast(`${g} امروزت را بساز! 💪`, '👋', 4200);
    });
  }
  if (has('streak')) {
    const yest = new Date(now - 86400000).toDateString();
    const txDays = new Set(load('vixora:txs', []).map((t) => new Date(t.date || t.ts || 0).toDateString()));
    if (txDays.has(yest) && ![...txDays].includes(new Date().toDateString())) {
      const h = new Date().getHours();
      if (h >= 20) once('streak', () => { pushNotify('🔥', 'زنجیره ثبت مالی در خطر است!', 'امروز هنوز چیزی ثبت نکردی.'); showToast('زنجیره‌ات را نگه دار! 🔥', '🔥'); });
    }
  }
  if (has('review')) {
    const h = new Date().getHours();
    if (h >= 22) {
      let done = [];
      try { done = JSON.parse(localStorage.getItem('vixora:review-' + new Date().toDateString()) || '[]'); } catch {}
      if (done.length < 5) once('review', () => { pushNotify('🌙', 'مرور امشب را نکردی!', '۵ قدم تا خواب آرام.'); showToast('🌙 وقت مرور شبانه است!', '🌙'); });
    }
  }
  if (has('goal')) {
    load('vixora:goals', []).forEach((g) => {
      if (g.target && (g.saved || 0) >= g.target) once('goal-' + g.id, () => pushNotify('🏆', `هدف «${g.title}» محقق شد!`, 'جشن بگیر! 🎉'));
    });
  }
}

export function renderAutomations() {
  const list = getAutomations();
  return `<div class="dash-auto-wrap"><div class="dash-auto-head"><b>🤖 خودکارسازی‌ها</b><span class="dash-chip">${list.filter((a) => a.on).length} فعال</span></div>
  <div class="dash-auto-list">${list.map((a) => `
    <div class="dash-auto-row ${a.on ? 'on' : ''}">
      <span class="dash-auto-ic">${a.icon}</span>
      <div class="dash-auto-tx"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div>
      <button class="dash-switch ${a.on ? 'on' : ''}" data-action="w-auto-toggle" data-id="${a.id}" aria-label="تغییر"><i></i></button>
    </div>`).join('')}</div>
  <small class="dash-hint">قوانین در هر بار باز شدن داشبورد اجرا می‌شوند (حداکثر یک‌بار در روز برای هر قانون).</small></div>`;
}
