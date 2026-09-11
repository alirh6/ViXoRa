// 🛩 ViXoRa Cockpit State — وضعیت، چیدمان، پروفایل‌ها، تم، فعالیت‌ها
// src/pages/tools/dashboard/dash-state.js

const UI_KEY = 'ViXoRa:dash-ui-v1';
const LAYOUT_KEY = 'ViXoRa:dash-layout-v1';
const PROFILES_KEY = 'ViXoRa:dash-profiles-v1';
const ACT_KEY = 'ViXoRa:dash-activity-v1';
const FAV_KEY = 'ViXoRa:dash-fav-v1';
const TOUR_KEY = 'ViXoRa:dash-tour-v1';

export const DASH_VIEWS = [
  { id: 'cockpit', title: 'کاکپیت', icon: '🛩' },
  { id: 'guide', title: 'راهنمای کامل', icon: '📖' },
  { id: 'report', title: 'گزارش هفتگی', icon: '📰' },
  { id: 'settings', title: 'تنظیمات کاکپیت', icon: '⚙️' },
  { id: 'notify', title: 'اعلان‌ها', icon: '🔔' },
  { id: 'analytics', title: 'تحلیل شخصی', icon: '📈' },
  { id: 'themes', title: 'تم‌ها', icon: '🎨' },
  { id: 'export', title: 'خروجی', icon: '📤' },
  { id: 'auto', title: 'خودکارها', icon: '🤖' },
  { id: 'journal', title: 'ژورنال', icon: '📓' },
  { id: 'remote', title: 'ریموت موزیک', icon: '🎛' },
  { id: 'calendar', title: 'تقویم', icon: '📅' },
  { id: 'habits', title: 'عادت‌ها', icon: '🔥' },
  { id: 'focus', title: 'تمرکز', icon: '🧘' },
  { id: 'insights', title: 'بینش‌ها', icon: '🧠' },
  { id: 'achieve', title: 'دستاوردها', icon: '🏆' },
  { id: 'goals', title: 'اهداف', icon: '🎯' },
  { id: 'review', title: 'مرور شبانه', icon: '🌙' },
  { id: 'changelog', title: 'تازه‌ها', icon: '✨' },
];

export const DASH_THEMES = {
  aurora: { name: 'شفق قطبی', c1: '#8b5cf6', c2: '#ec4899', bg1: '#0b0620', bg2: '#1c0b38' },
  ocean: { name: 'اقیانوس', c1: '#38bdf8', c2: '#818cf8', bg1: '#020617', bg2: '#0b1e3a' },
  sunset: { name: 'غروب', c1: '#fb923c', c2: '#f43f5e', bg1: '#1a0a14', bg2: '#3b0f22' },
  forest: { name: 'جنگل', c1: '#34d399', c2: '#a3e635', bg1: '#02241c', bg2: '#053b2c' },
  royal: { name: 'سلطنتی', c1: '#fbbf24', c2: '#f472b6', bg1: '#17102b', bg2: '#2b1037' },
  mono: { name: 'تک‌رنگ', c1: '#94a3b8', c2: '#e2e8f0', bg1: '#0f172a', bg2: '#1e293b' },
};

export const WIDGET_SIZES = {
  s: { label: 'کوچک', cols: 3 },
  m: { label: 'متوسط', cols: 4 },
  l: { label: 'بزرگ', cols: 6 },
  xl: { label: 'خیلی بزرگ', cols: 12 },
};

// ترتیب و اندازه پیش‌فرض ویجت‌ها
export const DEFAULT_LAYOUT = [
  { id: 'greet', size: 'm', on: true },
  { id: 'clock', size: 's', on: true },
  { id: 'search', size: 'm', on: true },
  { id: 'quick', size: 'm', on: true },
  { id: 'music-now', size: 'l', on: true },
  { id: 'music-stats', size: 'm', on: true },
  { id: 'fin-kpi', size: 'l', on: true },
  { id: 'fin-cash', size: 'm', on: true },
  { id: 'notes', size: 'm', on: true },
  { id: 'customers', size: 'm', on: true },
  { id: 'building', size: 'm', on: true },
  { id: 'arcade', size: 'm', on: true },
  { id: 'activity', size: 'm', on: true },
  { id: 'health', size: 'm', on: true },
  { id: 'storage', size: 's', on: true },
  { id: 'pomodoro', size: 's', on: true },
  { id: 'quote', size: 's', on: true },
  { id: 'shortcuts', size: 's', on: true },
  { id: 'debts', size: 'm', on: false },
  { id: 'goals', size: 'm', on: false },
  { id: 'bills', size: 'm', on: false },
  { id: 'radio', size: 'm', on: false },
  { id: 'forecast', size: 'm', on: false },
  { id: 'subs', size: 'm', on: false },
  { id: 'insights', size: 'l', on: false },
  { id: 'top-songs', size: 'm', on: false },
  { id: 'arcade-top', size: 'm', on: false },
  { id: 'finance-chart', size: 'l', on: false },
  { id: 'week', size: 'l', on: false },
  { id: 'backup', size: 's', on: false },
  { id: 'focus', size: 's', on: false },
  { id: 'dice', size: 's', on: false },
  { id: 'favs', size: 's', on: false },
  { id: 'tx-quick', size: 'm', on: true },
  { id: 'playlists', size: 'm', on: false },
  { id: 'sessions', size: 'm', on: false },
  { id: 'networth', size: 'm', on: false },
  { id: 'bills-cal', size: 'm', on: false },
  { id: 'quotes-day', size: 'm', on: false },
  { id: 'habits', size: 'm', on: true },
  { id: 'calendar', size: 'm', on: true },
  { id: 'heatmap', size: 'l', on: false },
  { id: 'cats', size: 'm', on: false },
  { id: 'accounts', size: 'm', on: false },
  { id: 'calc', size: 's', on: false },
  { id: 'notes-stats', size: 'm', on: false },
  { id: 'sys', size: 's', on: false },
  { id: 'lyrics-now', size: 'm', on: false },
  { id: 'eq-quick', size: 's', on: false },
  { id: 'sleep', size: 's', on: false },
  { id: 'goal-ring', size: 'm', on: false },
  { id: 'aging-mini', size: 'm', on: false },
  { id: 'fx-quick', size: 's', on: false },
  { id: 'game-day', size: 's', on: false },
  { id: 'note-cal', size: 'm', on: false },
  { id: 'charges', size: 's', on: false },
  { id: 'storage-detail', size: 'm', on: false },
  { id: 'countdown', size: 's', on: false },
  { id: 'world-clock', size: 's', on: false },
  { id: 'streak', size: 'm', on: false },
  { id: 'fun-fact', size: 's', on: false },
  { id: 'rate-day', size: 's', on: false },
  { id: 'sound-board', size: 's', on: false },
  { id: 'pomo-stats', size: 'm', on: false },
  { id: 'mood-chart', size: 'm', on: false },
  { id: 'tx-by-day', size: 'm', on: false },
  { id: 'top-cats', size: 'm', on: false },
  { id: 'pl-stats', size: 'm', on: false },
  { id: 'album-wall', size: 'm', on: false },
  { id: 'build-detail', size: 'm', on: false },
  { id: 'game-stats', size: 'm', on: false },
  { id: 'tx-types', size: 'm', on: false },
  { id: 'debt-list', size: 'm', on: false },
  { id: 'inv-open', size: 'm', on: false },
  { id: 'bill-next', size: 's', on: false },
  { id: 'note-pinned', size: 'm', on: false },
  { id: 'cust-new', size: 'm', on: false },
  { id: 'song-fresh', size: 'm', on: false },
  { id: 'song-liked', size: 'm', on: false },
  { id: 'queue-mini', size: 'm', on: false },
  { id: 'vol-ctl', size: 's', on: false },
  { id: 'rate-ctl', size: 's', on: false },
  { id: 'theme-mini', size: 's', on: false },
  { id: 'notify-mini', size: 's', on: true },
  { id: 'score-mini', size: 's', on: true },
  { id: 'theme-mini2', size: 's', on: true },
  { id: 'export-mini', size: 's', on: false },
  { id: 'auto-mini', size: 's', on: false },
  { id: 'week-review', size: 'm', on: true },
  { id: 'month-compare', size: 's', on: false },
  { id: 'top-days', size: 's', on: false },
  { id: 'cat-year', size: 'm', on: false },
  { id: 'artist-top', size: 'm', on: false },
  { id: 'genre-pie', size: 'm', on: false },
  { id: 'listen-week', size: 's', on: false },
  { id: 'cust-growth', size: 'm', on: false },
  { id: 'unit-occ', size: 's', on: false },
  { id: 'fun-fact2', size: 's', on: false },
  { id: 'quote2', size: 's', on: false },
  { id: 'dice2', size: 's', on: false },
  { id: 'timer-mini', size: 's', on: false },
  { id: 'breathe', size: 's', on: false },
  { id: 'journal-mini', size: 's', on: true },
  { id: 'remote-mini', size: 's', on: true },
  { id: 'eq-mini', size: 's', on: false },
  { id: 'sleep-mini', size: 's', on: false },
  { id: 'grade-week', size: 's', on: false },
  { id: 'money-mood', size: 's', on: false },
  { id: 'debt-free', size: 's', on: false },
  { id: 'save-rate', size: 's', on: false },
  { id: 'note-tags', size: 'm', on: false },
  { id: 'cust-top', size: 's', on: false },
  { id: 'task-due', size: 'm', on: true },
  { id: 'water', size: 's', on: false },
  { id: 'book-now', size: 's', on: false },
  { id: 'steps', size: 's', on: false },
  { id: 'lucky', size: 's', on: false },
  { id: 'focus-mini', size: 's', on: true },
  { id: 'cal-mini', size: 's', on: true },
  { id: 'habit-mini', size: 's', on: true },
  { id: 'journal-streak', size: 's', on: false },
  { id: 'sleep-log', size: 's', on: false },
  { id: 'weight', size: 's', on: false },
  { id: 'sport-week', size: 's', on: false },
  { id: 'reading-goal', size: 's', on: false },
  { id: 'no-spend', size: 's', on: false },
  { id: 'bill-total', size: 's', on: false },
  { id: 'sub-audit', size: 'm', on: false },
  { id: 'word-day', size: 's', on: false },
  { id: 'riddle', size: 's', on: false },
  { id: 'compliment', size: 's', on: false },
  { id: 'countdown2', size: 's', on: false },
  { id: 'insight-mini', size: 's', on: true },
  { id: 'search-adv', size: 'm', on: false },
  { id: 'mood-week', size: 'm', on: false },
  { id: 'energy-avg', size: 's', on: false },
  { id: 'grateful-all', size: 'm', on: false },
  { id: 'wins-all', size: 'm', on: false },
  { id: 'journal-cal', size: 'm', on: false },
  { id: 'tx-heat', size: 'm', on: false },
  { id: 'weekday-spend', size: 'm', on: false },
  { id: 'hour-play', size: 's', on: false },
  { id: 'bill-paid-rate', size: 's', on: false },
  { id: 'networth-trend', size: 'm', on: false },
  { id: 'deep-total', size: 's', on: false },
  { id: 'pomo-chart', size: 'm', on: false },
  { id: 'task-done-rate', size: 's', on: false },
  { id: 'eisenhower', size: 'l', on: false },
  { id: 'top-expense-day', size: 's', on: false },
  { id: 'avg-tx', size: 's', on: false },
  { id: 'cash-days', size: 's', on: false },
  { id: 'goal-eta', size: 's', on: false },
  { id: 'album-count', size: 's', on: false },
  { id: 'longest-song', size: 's', on: false },
  { id: 'palindrome', size: 's', on: false },
  { id: 'age-days', size: 's', on: false },
  { id: 'records', size: 's', on: true },
  { id: 'tool-balance', size: 's', on: false },
  { id: 'week-grade2', size: 's', on: true },
  { id: 'month-progress', size: 's', on: false },
  { id: 'year-progress', size: 's', on: false },
  { id: 'backup-age', size: 's', on: false },
  { id: 'storage-bar', size: 's', on: false },
  { id: 'cmdk-hint', size: 's', on: false },
  { id: 'recipe-day', size: 's', on: false },
  { id: 'gloss-day', size: 's', on: false },
  { id: 'music-quiz', size: 's', on: false },
  { id: 'math-duel', size: 's', on: false },
  { id: 'memory-plus', size: 's', on: false },
  { id: 'typing-tester', size: 's', on: false },
  { id: 'appreciate', size: 's', on: false },
  { id: 'goals-hub-mini', size: 's', on: true },
  { id: 'fin-goals-mini', size: 's', on: true },
  { id: 'digest-mini', size: 's', on: false },
  { id: 'achieve-mini', size: 's', on: true },
  { id: 'streak-best', size: 's', on: false },
  { id: 'week-compare', size: 's', on: false },
  { id: 'top-hour-tx', size: 's', on: false },
  { id: 'weekend-rate', size: 's', on: false },
  { id: 'song-roulette', size: 's', on: false },
  { id: 'note-roulette', size: 's', on: false },
  { id: 'fact-math', size: 's', on: false },
  { id: 'breathe2', size: 's', on: false },
  { id: 'cmdk-hist', size: 's', on: false },
  { id: 'palette-day', size: 's', on: false },
  { id: 'budget-5020', size: 's', on: false },
  { id: 'sleep-score', size: 's', on: false },
  { id: 'letter-self', size: 's', on: false },
  { id: 'd20', size: 's', on: false },
  { id: 'week-life', size: 's', on: false },
  { id: 'moon', size: 's', on: false },
  { id: 'dash-stats', size: 's', on: false },
  { id: 'thanks', size: 's', on: false },
  { id: 'quote-lib', size: 's', on: true },
];

export function defaultDashUi() {
  return {
    view: 'cockpit',
    theme: 'aurora',
    cols: 12,
    density: 'comfortable',
    clock24: true,
    showSeconds: false,
    greetName: '',
    focusWidget: '',
    guideChapter: 'start',
    guideQuery: '',
    cmdkOpen: false,
    tourStep: 0,
  };
}

export function loadDashUi() {
  try { return { ...defaultDashUi(), ...JSON.parse(localStorage.getItem(UI_KEY) || '{}') }; }
  catch { return defaultDashUi(); }
}

export function saveDashUi(patch = {}) {
  const next = { ...loadDashUi(), ...patch };
  try { localStorage.setItem(UI_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export function loadLayout() {
  try {
    const raw = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null');
    if (Array.isArray(raw) && raw.length) {
      // ادغام با پیش‌فرض برای ویجت‌های جدید
      const map = new Map(raw.map((w) => [w.id, w]));
      const merged = DEFAULT_LAYOUT.map((d) => ({ ...d, ...(map.get(d.id) || {}) }));
      for (const w of raw) {
        if (!merged.some((m) => m.id === w.id)) merged.push({ size: 'm', on: false, ...w });
      }
      return merged;
    }
  } catch { /* ignore */ }
  return DEFAULT_LAYOUT.map((d) => ({ ...d }));
}

export function saveLayout(layout) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch { /* ignore */ }
}

export function loadProfiles() {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}'); } catch { return {}; }
}

export function saveProfiles(p) {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

/* ---------- فید فعالیت ---------- */
export function logActivity(icon, text, link = '') {
  try {
    const all = JSON.parse(localStorage.getItem(ACT_KEY) || '[]');
    all.unshift({ icon, text: String(text).slice(0, 160), link, at: Date.now() });
    localStorage.setItem(ACT_KEY, JSON.stringify(all.slice(0, 120)));
  } catch { /* ignore */ }
}

export function getActivity(limit = 30) {
  try { return JSON.parse(localStorage.getItem(ACT_KEY) || '[]').slice(0, limit); }
  catch { return []; }
}

export function clearActivity() {
  try { localStorage.removeItem(ACT_KEY); } catch { /* ignore */ }
}

/* ---------- علاقه‌مندی‌ها ---------- */
export function getFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}

export function toggleFav(link, title) {
  const favs = getFavs();
  const i = favs.findIndex((f) => f.link === link);
  if (i >= 0) favs.splice(i, 1);
  else favs.push({ link, title, at: Date.now() });
  try { localStorage.setItem(FAV_KEY, JSON.stringify(favs.slice(0, 24))); } catch { /* ignore */ }
  return favs;
}

/* ---------- تور ---------- */
export function tourDone() {
  try { return localStorage.getItem(TOUR_KEY) === '1'; } catch { return false; }
}
export function setTourDone() {
  try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* ignore */ }
}
export function resetTour() {
  try { localStorage.removeItem(TOUR_KEY); } catch { /* ignore */ }
}

/* ---------- ناوبری ---------- */
export function dashNavigate(href) {
  if (!href) return;
  try {
    if (href === window.location.pathname) return;
    window.history.pushState({}, '', href);
    window.dispatchEvent(new Event('vixora:navigate'));
    window.dispatchEvent(new PopStateEvent('popstate'));
  } catch {
    window.location.href = href;
  }
}

/** خواندن/نوشتن ژنریک localStorage با JSON امن */
export function load(key, fb = null) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fb : JSON.parse(v);
  } catch { return fb; }
}
export function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

export function faDigits(v) {
  return String(v).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export function relTime(ts) {
  const d = Date.now() - (Number(ts) || 0);
  if (d < 60e3) return 'لحظاتی پیش';
  if (d < 3600e3) return `${faDigits(Math.floor(d / 60e3))} دقیقه پیش`;
  if (d < 86400e3) return `${faDigits(Math.floor(d / 3600e3))} ساعت پیش`;
  if (d < 7 * 86400e3) return `${faDigits(Math.floor(d / 86400e3))} روز پیش`;
  return new Date(Number(ts)).toLocaleDateString('fa-IR');
}

export function fmtCompact(n) {
  const a = Math.abs(Number(n) || 0);
  if (a >= 1e9) return faDigits((n / 1e9).toFixed(1)) + ' م';
  if (a >= 1e6) return faDigits((n / 1e6).toFixed(1)) + ' م';
  if (a >= 1e3) return faDigits((n / 1e3).toFixed(1)) + ' ه';
  return faDigits(String(Math.round(Number(n) || 0)));
}
