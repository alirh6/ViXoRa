// 👋 ViXoRa Welcome Wizard — راه‌اندازی ۶۰ ثانیه‌ای برای تازه‌واردها
// src/pages/tools/dashboard/dash-welcome.js
import { esc, saveDashUi } from './dash-state.js';

const SEEN_KEY = 'vixora:welcome-seen';

export function welcomeSeen() {
  try { return !!localStorage.getItem(SEEN_KEY); } catch { return true; }
}
export function markWelcomeSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
}

const STARTERS = [
  ['morning', '🌅 صبحگاهی', 'سلام، تقویم امروز، ۳ کار، حال، آب، دایجست', ['greet', 'cal-mini', 'task-due', 'journal-mini', 'water', 'digest-mini', 'quick', 'search']],
  ['money', '💰 مالی', 'شاخص‌ها، ثبت سریع، قبوض، اهداف، نرخ پس‌انداز', ['fin-kpi', 'tx-quick', 'bill-next', 'goals', 'save-rate', 'week-review', 'quick', 'search']],
  ['music', '🎵 موزیک', 'در حال پخش، ریموت، خواب، علاقه‌مندی‌ها', ['music-now', 'remote-mini', 'sleep-mini', 'song-liked', 'radio', 'eq-mini', 'quick', 'search']],
  ['focus', '🧘 تمرکز', 'پومودورو، عادت، کارها، ژورنال، مرور', ['focus-mini', 'habit-mini', 'task-due', 'journal-mini', 'score-mini', 'quote-lib', 'quick', 'search']],
  ['full', '🏙 همه‌چیز', 'ترکیب متعادل ۱۴ ویجت برای شروع', ['greet', 'quick', 'search', 'fin-kpi', 'tx-quick', 'music-now', 'journal-mini', 'habit-mini', 'task-due', 'cal-mini', 'score-mini', 'insight-mini', 'quote-lib', 'backup']],
];

export function renderWelcome() {
  return `<div class="dash-modal" data-close-welcome>
    <div class="dash-modal-panel dash-wc-panel" role="dialog" aria-label="خوش آمدی">
      <button class="dash-icon-btn dash-modal-x" data-action="wc-close">✕</button>
      <div class="dash-wc-hero">🛩</div>
      <h3>به کاکپیت ViXoRa خوش آمدی! 👋</h3>
      <p>۶۰ ثانیه وقت بگذار تا کاکپیت را مال خودت کنیم:</p>
      <div class="dash-wc-step"><b>۱. اسمت چیه؟</b>
        <input class="dash-input" data-wc-name placeholder="مثلاً: علی" maxlength="30"></div>
      <div class="dash-wc-step"><b>۲. چه رنگی دوست داری؟</b>
        <div class="dash-row wrap" data-wc-themes>
          ${[['violet', '💜 بنفش'], ['ocean', '🌊 آبی'], ['forest', '🌲 سبز'], ['sunset', '🌅 نارنجی'], ['midnight', '🌌 شب'], ['paper', '📄 روشن']].map(([v, t], i) => `<button class="dash-btn xs ${i === 0 ? 'dash-btn-primary' : ''}" data-action="wc-theme" data-v="${v}">${t}</button>`).join('')}
        </div></div>
      <div class="dash-wc-step"><b>۳. کاکپیتت چه حالی باشد؟</b>
        <div class="dash-wc-packs">${STARTERS.map(([v, t, d], i) => `
          <button class="dash-wc-pack ${i === 4 ? 'on' : ''}" data-action="wc-pack" data-v="${v}"><b>${t}</b><small>${d}</small></button>`).join('')}
        </div></div>
      <div class="dash-row"><button class="dash-btn dash-btn-primary" data-action="wc-done">🚀 بسازش!</button>
        <button class="dash-btn" data-action="wc-close">بعداً خودم تنظیم می‌کنم</button></div>
      <small class="dash-hint">💡 بعداً از 🧩 گالری و ⚙️ تنظیمات همه‌چیز قابل تغییر است.</small>
    </div></div>`;
}

let wcTheme = 'violet';
let wcPack = 'full';

export async function handleWelcomeAction(action, el, api) {
  switch (action) {
    case 'wc-theme':
      wcTheme = el.dataset.v || 'violet';
      el.closest('[data-wc-themes]')?.querySelectorAll('.dash-btn').forEach((b) => b.classList.toggle('dash-btn-primary', b === el));
      return true;
    case 'wc-pack':
      wcPack = el.dataset.v || 'full';
      el.closest('.dash-wc-packs')?.querySelectorAll('.dash-wc-pack').forEach((b) => b.classList.toggle('on', b === el));
      return true;
    case 'wc-done': {
      const name = api.root.querySelector('[data-wc-name]')?.value.trim().slice(0, 30) || '';
      const { applyTheme } = await import('./dash-themes.js');
      const t = applyTheme(wcTheme);
      const patch = { theme: t.id };
      if (name) patch.greetName = name;
      saveDashUi(patch);
      const pack = STARTERS.find((x) => x[0] === wcPack) || STARTERS[4];
      try {
        const { loadLayout, saveLayout } = await import('./dash-state.js');
        const layout = loadLayout().map((w) => ({ ...w, on: pack[3].includes(w.id) }));
        saveLayout(layout);
      } catch {}
      markWelcomeSeen();
      closeWelcome(api.root);
      api.toast(`🎉 کاکپیت «${pack[1]}» ساخته شد!`);
      setTimeout(() => api.reload(), 100);
      return true;
    }
    case 'wc-close':
      markWelcomeSeen();
      closeWelcome(api.root);
      return true;
    default: return false;
  }
}

export function openWelcome(root) {
  const ov = root.querySelector('[data-dash="overlay"]');
  if (!ov || ov.querySelector('[data-close-welcome]')) return;
  ov.innerHTML = renderWelcome();
  setTimeout(() => ov.querySelector('[data-wc-name]')?.focus(), 100);
}
export function closeWelcome(root) {
  const ov = root?.querySelector?.('[data-dash="overlay"]');
  if (ov?.querySelector('[data-close-welcome]')) ov.innerHTML = '';
}
export function maybeWelcome(root) {
  if (!welcomeSeen()) setTimeout(() => openWelcome(root), 800);
}
