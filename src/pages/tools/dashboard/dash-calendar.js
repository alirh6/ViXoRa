// 📅 ViXoRa Unified Calendar — تقویم ماه: قبض، بدهی، ژورنال، حال، تراکنش
// src/pages/tools/dashboard/dash-calendar.js
import { esc, load } from './dash-state.js';

const faD = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
export const dayStr = (ts = Date.now()) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** رویدادهای یک روز از همه منابع */
export function dayEvents(day) {
  const evs = [];
  load('vixora:bills', []).filter((b) => !b.paid && dayStr(new Date(b.due || 0)) === day).forEach((b) => evs.push({ icon: '💡', text: `قبض: ${b.title || ''} (${Number(b.amount || 0).toLocaleString('fa-IR')})`, kind: 'bill' }));
  load('vixora:debts', []).filter((d) => d.due && dayStr(new Date(d.due)) === day).forEach((d) => evs.push({ icon: '🤝', text: `بدهی: ${d.title || d.person || ''}`, kind: 'debt' }));
  const txs = load('vixora:txs', []).filter((t) => dayStr(new Date(t.date || t.ts || 0)) === day);
  if (txs.length) {
    const exp = txs.filter((t) => t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
    evs.push({ icon: '💰', text: `${txs.length} تراکنش • خرج ${exp.toLocaleString('fa-IR')}`, kind: 'tx' });
  }
  const notes = load('vixora:notes', []).filter((n) => dayStr(n.ts || 0) === day);
  if (notes.length) evs.push({ icon: '📝', text: `${notes.length} یادداشت`, kind: 'note' });
  const j = (load('vixora:journal', {})[day]);
  if (j) evs.push({ icon: '📓', text: `ژورنال ثبت شده ${j.mood ? `(حال ${j.mood}/۵)` : ''}`, kind: 'journal' });
  const mood = load('vixora:mood', []).find((m) => dayStr(m.ts) === day);
  if (mood && !j) evs.push({ icon: String(mood.mood || mood.v || '😊'), text: 'حال ثبت شده', kind: 'mood' });
  return evs;
}

const WD = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']; // شنبه اول

export function renderCalendar(st = {}) {
  const cur = st.calMonth ? new Date(st.calMonth + 'T12:00:00') : new Date();
  const y = cur.getFullYear(), m = cur.getMonth();
  const first = new Date(y, m, 1);
  let startOffset = (first.getDay() + 1) % 7; // شنبه=0
  const dim = new Date(y, m + 1, 0).getDate();
  const today = dayStr();
  const sel = st.calDay || today;
  // جمع‌آوری نقطه‌های ماه
  const dots = {};
  for (let d = 1; d <= dim; d++) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const evs = dayEvents(key);
    if (evs.length) dots[key] = evs.slice(0, 3).map((e) => e.icon).join('');
  }
  let cells = '';
  for (let i = 0; i < startOffset; i++) cells += '<span class="dash-cal-empty"></span>';
  for (let d = 1; d <= dim; d++) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells += `<button class="dash-cal-day ${key === today ? 'today' : ''} ${key === sel ? 'on' : ''} ${dots[key] ? 'has' : ''}" data-action="cal-day" data-v="${key}">
      <b>${faD(d)}</b><small>${dots[key] || ''}</small></button>`;
  }
  const evs = dayEvents(sel);
  const selD = new Date(sel + 'T12:00:00');
  const monthName = cur.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' });
  const prev = dayStr(new Date(y, m - 1, 1)).slice(0, 7);
  const next = dayStr(new Date(y, m + 1, 1)).slice(0, 7);
  // آمار ماه
  const mTxs = load('vixora:txs', []).filter((t) => { const d = new Date(t.date || t.ts || 0); return d.getMonth() === m && d.getFullYear() === y; });
  const mExp = mTxs.filter((t) => t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
  const mInc = mTxs.filter((t) => t.type === 'income').reduce((a, t) => a + (+t.amount || 0), 0);
  const mJ = Object.keys(load('vixora:journal', {})).filter((k) => k.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)).length;
  return `<div class="dash-cal-wrap">
    <div class="dash-cal-head"><b>📅 تقویم یکپارچه</b>
      <span class="dash-row"><button class="dash-btn xs" data-action="cal-month" data-v="${prev}">→ ماه قبل</button>
      <b>${monthName}</b>
      <button class="dash-btn xs" data-action="cal-month" data-v="${next}">ماه بعد ←</button>
      <button class="dash-btn xs" data-action="cal-today">📍 امروز</button></span></div>
    <div class="dash-cal-chips"><span class="dash-chip">💰 دخل ${mInc.toLocaleString('fa-IR')}</span>
      <span class="dash-chip">💸 خرج ${mExp.toLocaleString('fa-IR')}</span>
      <span class="dash-chip">📓 ${mJ} روز ژورنال</span></div>
    <div class="dash-row"><button class="dash-btn xs" data-action="cal-agenda">📌 آجندای ۱۴ روز</button></div>
    <div data-cal-agenda hidden></div>
    <div class="dash-cal-grid"><div class="dash-cal-wd">${WD.map((w) => `<span>${w}</span>`).join('')}</div>${cells}</div>
    <div class="dash-card"><b>📌 ${selD.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}</b>
      <div class="dash-cal-evs">${evs.length ? evs.map((e) => `<div class="dash-cal-ev"><span>${e.icon}</span><span>${esc(e.text)}</span></div>`).join('') : '<div class="dash-empty">رویدادی نیست. روز آرومیه! ☁️</div>'}</div>
      <div class="dash-row wrap" style="margin-top:8px">
        <button class="dash-btn xs" data-action="view" data-v="journal">📓 ژورنال این روز</button>
        <button class="dash-btn xs" data-action="go" data-link="/tools/invoices">💰 مالی ↗</button>
      </div></div></div>`;
}

export async function handleCalendarAction(action, el, api) {
  const st = api.st;
  switch (action) {
    case 'cal-day': st.calDay = el.dataset.v; api.rerender(); return true;
    case 'cal-today': { const t = new Date(); st.calMonth = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`; st.calDay = dayStr(); api.rerender(); return true; }
    case 'cal-month': st.calMonth = el.dataset.v; api.rerender(); return true;
    case 'cal-agenda': {
      const box = api.root.querySelector('[data-cal-agenda]');
      if (box) {
        if (box.hidden) { box.innerHTML = renderAgenda(); box.hidden = false; }
        else box.hidden = true;
      }
      return true;
    }
    default: return false;
  }
}

/** آجندای ۱۴ روز آینده (لیست) */
export function renderAgenda() {
  const out = [];
  for (let i = 0; i < 14; i++) {
    const key = dayStr(Date.now() + i * 86400000);
    const evs = dayEvents(key);
    if (evs.length) out.push({ key, evs });
  }
  if (!out.length) return '<div class="dash-empty">۱۴ روز آینده خلوت است! ☁️</div>';
  return out.map(({ key, evs }) => `
    <div class="dash-ag-day"><b>${new Date(key + 'T12:00:00').toLocaleDateString('fa-IR', { weekday: 'short', day: 'numeric', month: 'short' })}</b>
    ${evs.map((e) => `<div class="dash-cal-ev"><span>${e.icon}</span><span>${esc(e.text)}</span></div>`).join('')}</div>`).join('');
}
