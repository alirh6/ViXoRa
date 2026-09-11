// 🎨 ViXoRa Theme Engine — ۱۰ تم + سازنده تم سفارشی + خودکار
// src/pages/tools/dashboard/dash-themes.js
import { esc } from './dash-state.js';

export const THEMES = [
  { id: 'violet', name: 'بنفش ویکسورا', icon: '💜', c1: '#7c3aed', c2: '#ec4899', bg: '#0f0c29', tx: '#f4f1ff' },
  { id: 'ocean', name: 'اقیانوس', icon: '🌊', c1: '#0284c7', c2: '#22d3ee', bg: '#082f49', tx: '#f0f9ff' },
  { id: 'forest', name: 'جنگل', icon: '🌲', c1: '#059669', c2: '#a3e635', bg: '#052e22', tx: '#f0fdf4' },
  { id: 'sunset', name: 'غروب', icon: '🌅', c1: '#ea580c', c2: '#facc15', bg: '#431407', tx: '#fff7ed' },
  { id: 'rose', name: 'رز', icon: '🌹', c1: '#e11d48', c2: '#fb7185', bg: '#4c0519', tx: '#fff1f2' },
  { id: 'midnight', name: 'نیمه‌شب', icon: '🌌', c1: '#1e1b4b', c2: '#6366f1', bg: '#020617', tx: '#eef2ff' },
  { id: 'gold', name: 'طلایی', icon: '👑', c1: '#b45309', c2: '#fde047', bg: '#1c1917', tx: '#fefce8' },
  { id: 'mint', name: 'نعنایی روشن', icon: '🍃', c1: '#0d9488', c2: '#5eead4', bg: '#f0fdfa', tx: '#134e4a', light: true },
  { id: 'paper', name: 'کاغذی روشن', icon: '📄', c1: '#7c3aed', c2: '#f59e0b', bg: '#fafaf9', tx: '#1c1917', light: true },
  { id: 'candy', name: 'آبنباتی', icon: '🍬', c1: '#db2777', c2: '#8b5cf6', bg: '#fdf2f8', tx: '#500724', light: true },
];

const CUSTOM_KEY = 'vixora:theme-custom';
const MODE_KEY = 'vixora:theme-mode';

export function getCustomTheme() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || null; } catch { return null; }
}
export function saveCustomTheme(t) {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(t)); } catch {}
}

/** اعمال تم روی ریشه داشبورد */
export function applyTheme(id) {
  let t = THEMES.find((x) => x.id === id);
  if (id === 'custom') {
    const c = getCustomTheme();
    t = c ? { id: 'custom', name: c.name || 'تم من', icon: '🖌', ...c } : THEMES[0];
  }
  if (!t) t = THEMES[0];
  const root = document.querySelector('.dash-root') || document.body;
  root.style.setProperty('--d1', t.c1);
  root.style.setProperty('--d2', t.c2);
  root.style.setProperty('--dbg', t.bg);
  root.style.setProperty('--dtx', t.tx);
  root.dataset.theme = t.id;
  root.classList.toggle('dash-light', !!t.light);
  try { localStorage.setItem('vixora:dash-theme', t.id); } catch {}
  return t;
}
export function currentThemeId() {
  try { return localStorage.getItem('vixora:dash-theme') || 'violet'; } catch { return 'violet'; }
}
export function cycleTheme() {
  const all = [...THEMES.map((t) => t.id), ...(getCustomTheme() ? ['custom'] : [])];
  const i = all.indexOf(currentThemeId());
  return applyTheme(all[(i + 1) % all.length]);
}

/** حالت خودکار: روز روشن / شب تیره */
export function themeMode() {
  try { return localStorage.getItem(MODE_KEY) || 'manual'; } catch { return 'manual'; }
}
export function setThemeMode(m) {
  try { localStorage.setItem(MODE_KEY, m); } catch {}
  if (m !== 'manual') autoThemeTick();
}
export function autoThemeTick() {
  if (themeMode() === 'manual') return null;
  const h = new Date().getHours();
  const night = h < 6 || h >= 19;
  return applyTheme(night ? 'midnight' : 'paper');
}

/** گالری تم با پیش‌نمایش زنده */
export function renderThemeGallery() {
  const cur = currentThemeId();
  const custom = getCustomTheme();
  const cards = THEMES.map((t) => `
    <button class="dash-theme-card ${cur === t.id ? 'on' : ''}" data-action="w-theme-set" data-v="${t.id}"
      style="--c1:${t.c1};--c2:${t.c2};--cb:${t.bg};--ct:${t.tx}">
      <span class="dash-theme-prev"><i></i><i></i><i></i></span>
      <span class="dash-theme-nm">${t.icon} ${esc(t.name)}</span>
      ${cur === t.id ? '<span class="dash-theme-on">✓</span>' : ''}
    </button>`).join('');
  return `<div class="dash-theme-wrap">
    <div class="dash-theme-head"><b>🎨 گالری تم</b>
      <span class="dash-row"><button class="dash-btn xs" data-action="w-theme-mode" data-v="manual">🖐 دستی</button>
      <button class="dash-btn xs" data-action="w-theme-mode" data-v="auto">🌗 خودکار شب/روز</button></span></div>
    <div class="dash-theme-grid">${cards}
      <button class="dash-theme-card ${cur === 'custom' ? 'on' : ''}" data-action="w-theme-set" data-v="custom"
        style="--c1:${custom?.c1 || '#888'};--c2:${custom?.c2 || '#aaa'};--cb:${custom?.bg || '#222'};--ct:${custom?.tx || '#fff'}">
        <span class="dash-theme-prev"><i></i><i></i><i></i></span>
        <span class="dash-theme-nm">🖌 ${custom ? esc(custom.name || 'تم من') : 'ساخت تم من'}</span>
        ${cur === 'custom' ? '<span class="dash-theme-on">✓</span>' : ''}
      </button></div>
    <div class="dash-theme-custom">
      <b>🖌 سازنده تم سفارشی</b>
      <div class="dash-row wrap">
        <label>رنگ ۱ <input type="color" data-custom-c1 value="${custom?.c1 || '#7c3aed'}"></label>
        <label>رنگ ۲ <input type="color" data-custom-c2 value="${custom?.c2 || '#ec4899'}"></label>
        <label>پس‌زمینه <input type="color" data-custom-bg value="${custom?.bg || '#0f0c29'}"></label>
        <label>متن <input type="color" data-custom-tx value="${custom?.tx || '#f4f1ff'}"></label>
        <input data-custom-name placeholder="نام تم…" value="${custom ? esc(custom.name || '') : ''}">
        <button class="dash-btn" data-action="w-theme-save">💾 ذخیره و اعمال</button>
      </div></div></div>`;
}

const OLD_THEME_MAP = { aurora: 'violet', royal: 'gold', mono: 'midnight', ocean: 'ocean', sunset: 'sunset', forest: 'forest' };
export function normalizeThemeId(id) {
  if (!id) return currentThemeId();
  if (id === 'custom' || THEMES.some((t) => t.id === id)) return id;
  return OLD_THEME_MAP[id] || 'violet';
}
