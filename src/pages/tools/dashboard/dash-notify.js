// 🔔 ViXoRa Notify Center — مرکز اعلان‌ها، یادآورها، تست‌ها
// src/pages/tools/dashboard/dash-notify.js
import { esc, load, save } from './dash-state.js';

const KEY = 'vixora:notify-list';
const READ_KEY = 'vixora:notify-read-ts';

export function getNotifs() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function setNotifs(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100))); } catch {}
}

let toastBox = null;
function ensureToastBox() {
  if (toastBox && document.body.contains(toastBox)) return toastBox;
  toastBox = document.createElement('div');
  toastBox.className = 'dash-toasts';
  toastBox.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastBox);
  return toastBox;
}

/** تست شناور (حداکثر ۳ همزمان) */
export function showToast(msg, icon = '🔔', ms = 3200) {
  const box = ensureToastBox();
  while (box.children.length >= 3) box.firstChild.remove();
  const el = document.createElement('div');
  el.className = 'dash-toast';
  el.innerHTML = `<span>${icon}</span><span>${esc(msg)}</span>`;
  el.onclick = () => el.remove();
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms);
}

/** ثبت اعلان دائمی در مرکز */
export function pushNotify(icon, title, body = '', link = '') {
  const list = getNotifs();
  const day = new Date().toDateString();
  const dup = list.find((n) => n.title === title && new Date(n.ts).toDateString() === day);
  if (dup) return dup.id;
  const item = { id: 'n' + Date.now().toString(36) + Math.floor(Math.random() * 999), ts: Date.now(), icon, title, body, link, read: false };
  list.unshift(item);
  setNotifs(list);
  updateNotifyBadge();
  return item.id;
}

export function unreadCount() {
  const readTs = +(localStorage.getItem(READ_KEY) || 0);
  return getNotifs().filter((n) => n.ts > readTs).length;
}
export function markAllRead() {
  localStorage.setItem(READ_KEY, String(Date.now()));
  updateNotifyBadge();
  const c = document.querySelector('.dash-notify-list');
  if (c) c.querySelectorAll('.unread').forEach((el) => el.classList.remove('unread'));
}
export function clearNotifs() {
  setNotifs([]);
  updateNotifyBadge();
  const c = document.querySelector('.dash-notify-list');
  if (c) c.innerHTML = '<div class="dash-empty">اعلانی نیست. 🎉</div>';
}
export function updateNotifyBadge() {
  const b = document.querySelector('[data-action="w-notify-open"] .dash-badge, .dash-notify-badge');
  const n = unreadCount();
  document.querySelectorAll('.dash-notify-badge').forEach((el) => {
    el.textContent = n > 9 ? '9+' : String(n);
    el.style.display = n ? '' : 'none';
  });
  if (b) { b.textContent = n > 9 ? '9+' : String(n); b.style.display = n ? '' : 'none'; }
}

/** موتور یادآور: قبض‌ها، بدهی‌ها، اهداف، گزارش */
export function scanReminders() {
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 86400000);
  try {
    const bills = load('vixora:bills', []);
    bills.filter((b) => !b.paid).forEach((b) => {
      const d = new Date(b.due || b.date || Date.now());
      if (d <= soon) {
        const overdue = d < now;
        pushNotify(overdue ? '🚨' : '💡', overdue ? `قبض معوق: ${b.title || 'بدون عنوان'}` : `سررسید نزدیک: ${b.title || 'بدون عنوان'}`, `${Number(b.amount || 0).toLocaleString('fa-IR')} • ${d.toLocaleDateString('fa-IR')}`);
      }
    });
  } catch {}
  try {
    const debts = load('vixora:debts', []);
    debts.filter((d) => (d.remaining ?? d.amount ?? 0) > 0).forEach((d) => {
      const due = d.due ? new Date(d.due) : null;
      if (due && due <= soon) pushNotify('🤝', `مهلت بدهی: ${d.title || d.person || 'بدهی'}`, `${Number(d.remaining ?? d.amount ?? 0).toLocaleString('fa-IR')}`);
    });
  } catch {}
  try {
    const goals = load('vixora:goals', []);
    goals.forEach((g) => {
      const pct = g.target ? Math.round(((g.saved || 0) / g.target) * 100) : 0;
      if (pct >= 100) pushNotify('🏆', `هدف محقق شد: ${g.title}`, 'تبریک! 🎉');
      else if (pct >= 80) pushNotify('🌟', `هدف نزدیک است: ${g.title}`, `${pct}٪ تکمیل شده`);
    });
  } catch {}
  try {
    const last = +(localStorage.getItem('vixora:report-last') || 0);
    if (Date.now() - last > 7 * 86400000) pushNotify('📊', 'وقت گزارش هفتگی است!', 'عملکرد هفته‌ات را مرور کن.');
  } catch {}
  try {
    const backup = +(localStorage.getItem('vixora:backup-last') || 0);
    if (Date.now() - backup > 14 * 86400000) pushNotify('🛟', 'بکاپ دیر شده!', 'بیش از ۲ هفته از آخرین بکاپ گذشته.');
  } catch {}
}

export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'لحظاتی پیش';
  if (s < 3600) return `${Math.floor(s / 60)} دقیقه پیش`;
  if (s < 86400) return `${Math.floor(s / 3600)} ساعت پیش`;
  return `${Math.floor(s / 86400)} روز پیش`;
}

export function renderNotifyCenter() {
  const list = getNotifs();
  const items = list.length ? list.map((n) => `
    <div class="dash-notify-item ${n.read ? '' : 'unread'}" data-action="w-notify-open-one" data-id="${n.id}">
      <span class="dash-notify-ic">${n.icon || '🔔'}</span>
      <div class="dash-notify-tx"><b>${esc(n.title)}</b>${n.body ? `<small>${esc(n.body)}</small>` : ''}<small class="dash-notify-ts">${timeAgo(n.ts)}</small></div>
      ${n.link ? `<button class="dash-btn xs" data-action="w-notify-go" data-id="${n.id}">باز کردن</button>` : ''}
      <button class="dash-icon-btn" data-action="w-notify-del" data-id="${n.id}" title="حذف">✕</button>
    </div>`).join('') : '<div class="dash-empty">اعلانی نیست. همه‌چیز آرام است! 🎉</div>';
  return `<div class="dash-notify-wrap">
    <div class="dash-notify-head"><b>🔔 مرکز اعلان‌ها</b>
      <span class="dash-row"><button class="dash-btn xs" data-action="w-notify-scan">🔍 بررسی دوباره</button>
      <button class="dash-btn xs" data-action="w-notify-read">✓ خواندن همه</button>
      <button class="dash-btn xs danger" data-action="w-notify-clear">🗑 پاک‌سازی</button></span></div>
    <div class="dash-notify-list">${items}</div></div>`;
}

export function openNotifyItem(id) {
  const list = getNotifs();
  const n = list.find((x) => x.id === id);
  if (!n) return;
  n.read = true;
  setNotifs(list);
  if (n.link) location.hash = n.link;
  else showToast(n.title, n.icon || '🔔');
  updateNotifyBadge();
}

/** اعلان مرورگر (اختیاری) */
export async function requestBrowserPerm() {
  try {
    if (!('Notification' in window)) { showToast('مرورگر اعلان پشتیبانی نمی‌کند', '⚠️'); return false; }
    const p = await Notification.requestPermission();
    showToast(p === 'granted' ? 'اعلان مرورگر فعال شد! 🎉' : 'مجوز داده نشد', p === 'granted' ? '🔔' : '🔕');
    return p === 'granted';
  } catch { return false; }
}
export function browserPing(title, body = '') {
  try {
    if (Notification.permission === 'granted') new Notification('ViXoRa • ' + title, { body });
  } catch {}
}

/** جمع‌بندی هفتگی (شنبه‌ها، حداکثر یک‌بار در هفته) */
export function maybeWeeklySummary() {
  const d = new Date();
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - ((d.getDay() + 1) % 7));
  const key = 'vixora:weekly-sum-' + weekStart.toDateString();
  try { if (localStorage.getItem(key)) return false; } catch {}
  if (d.getDay() !== 6) return false; // فقط شنبه
  try { localStorage.setItem(key, '1'); } catch {}
  const txs = load('vixora:txs', []);
  const week = Date.now() - 7 * 86400000;
  const w = txs.filter((t) => (t.date || t.ts || 0) >= week);
  const inc = w.filter((t) => t.type === 'income').reduce((a, t) => a + (+t.amount || 0), 0);
  const exp = w.filter((t) => t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
  pushNotify('📊', 'جمع‌بندی هفته آماده است!', `دخل ${inc.toLocaleString('fa-IR')} • خرج ${exp.toLocaleString('fa-IR')} • خالص ${(inc - exp).toLocaleString('fa-IR')}`, '#/tools/dashboard');
  return true;
}

export function deleteNotif(id) {
  setNotifs(getNotifs().filter((n) => n.id !== id));
  updateNotifyBadge();
}
