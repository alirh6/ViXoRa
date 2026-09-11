// src/layouts/tools/activity-log.js

/**
 * Activity Log — گزارش فعالیت‌های خود کاربر (ناوبری، شخصی‌سازی، موزیک…)
 * ring buffer در LocalStorage + subscribe زنده
 */

const KEY = 'ViXoRa:layout-activity-v1';
const MAX = 80;
const listeners = new Set();

function load() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

let items = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function getActivities(limit = 30) {
  return items.slice(0, limit);
}

export function logActivity({ icon = '•', text = '', link = '' } = {}) {
  const clean = String(text || '').trim();
  if (!clean) return null;
  // جلوگیری از اسپم تکراری پشت سر هم
  if (items[0] && items[0].text === clean && Date.now() - items[0].at < 3000) return null;
  const entry = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, icon, text: clean.slice(0, 160), link, at: Date.now() };
  items = [entry, ...items].slice(0, MAX);
  persist();
  for (const fn of [...listeners]) {
    try {
      fn(entry);
    } catch {
      /* ignore */
    }
  }
  return entry;
}

export function clearActivities() {
  items = [];
  persist();
  for (const fn of [...listeners]) {
    try {
      fn(null);
    } catch {
      /* ignore */
    }
  }
}

export function onActivity(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** زمان نسبی فارسی */
export function timeAgoFa(ts) {
  const diff = Math.max(0, Date.now() - Number(ts || 0));
  const s = Math.floor(diff / 1000);
  if (s < 10) return 'لحظاتی پیش';
  if (s < 60) return `${s} ثانیه پیش`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ساعت پیش`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} روز پیش`;
  return new Date(Number(ts)).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
}
