// 🔥 ViXoRa Habits Room — اتاق عادت‌ها: هیت‌مپ، آمار، یادآور
// src/pages/tools/dashboard/dash-habits.js
import { esc, load, save } from './dash-state.js';

const KEY = 'ViXoRa:dash-habits';
const faD = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const dk = (ts) => new Date(ts).toDateString();

export function getHabits() {
  const raw = load(KEY, []);
  return raw.map((h, i) => typeof h === 'string' ? { id: 'h' + i, name: h, log: [] } : { id: h.id || 'h' + i, name: h.name || 'عادت', log: h.log || [], target: h.target || 0, color: h.color || '' });
}
function setHabits(hs) { save(KEY, hs); }

export function habitStreak(h) {
  const days = new Set((h.log || []).map(dk));
  let s = 0;
  const d = new Date();
  if (!days.has(dk(d))) d.setDate(d.getDate() - 1);
  while (days.has(dk(d))) { s++; d.setDate(d.getDate() - 1); }
  return s;
}
export function habitWeekRate(h) {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const day = dk(Date.now() - i * 86400000);
    if ((h.log || []).some((t) => dk(t) === day)) n++;
  }
  return Math.round(n / 7 * 100);
}

export function renderHabits() {
  const hs = getHabits();
  const today = dk(Date.now());
  const cards = hs.map((h) => {
    const doneToday = (h.log || []).some((t) => dk(t) === today);
    const streak = habitStreak(h);
    const rate = habitWeekRate(h);
    // هیت‌مپ ۵ هفته اخیر (۳۵ خانه)
    let cells = '';
    for (let i = 34; i >= 0; i--) {
      const day = dk(Date.now() - i * 86400000);
      const on = (h.log || []).some((t) => dk(t) === day);
      cells += `<i class="${on ? 'on' : ''}" title="${new Date(Date.now() - i * 86400000).toLocaleDateString('fa-IR')}"></i>`;
    }
    return `<div class="dash-card dash-hb-card">
      <div class="dash-hb-top"><b>${doneToday ? '✅' : '⬜'} ${esc(h.name)}</b>
        <span class="dash-row"><span class="dash-chip">🔥 ${faD(streak)}</span><span class="dash-chip">${faD(rate)}٪ هفته</span></span></div>
      <div class="dash-hb-map">${cells}</div>
      <div class="dash-row" style="margin-top:8px">
        <button class="dash-btn ${doneToday ? '' : 'dash-btn-primary'}" data-action="hb-tick" data-v="${h.id}">${doneToday ? '↩ برگردوندن امروز' : '✓ انجام شد!'}</button>
        <button class="dash-btn xs danger" data-action="hb-del" data-v="${h.id}">🗑</button></div></div>`;
  }).join('');
  const totalTicks = hs.reduce((a, h) => a + (h.log || []).length, 0);
  const best = hs.map((h) => ({ h, s: habitStreak(h) })).sort((a, b) => b.s - a.s)[0];
  return `<div class="dash-hb-wrap">
    <div class="dash-hb-head"><b>🔥 اتاق عادت‌ها</b>
      <span class="dash-row"><span class="dash-chip">📌 ${faD(hs.length)} عادت</span>
      <span class="dash-chip">✓ ${faD(totalTicks)} تیک کل</span>
      ${best && best.s > 0 ? `<span class="dash-chip">🏆 ${esc(best.h.name)}: ${faD(best.s)} روز</span>` : ''}</span></div>
    <div class="dash-row"><button class="dash-btn xs" data-action="hb-csv">📤 خروجی CSV</button></div>
    <div class="dash-card"><b>＋ عادت جدید</b>
      <div class="dash-row" style="margin-top:6px"><input class="dash-input" data-hb-name placeholder="مثلاً: ۱۰ دقیقه مطالعه… (Enter)" style="margin:0">
      <button class="dash-btn dash-btn-primary" data-action="hb-add">＋ اضافه</button></div>
      <small class="dash-hint">💡 قانون ۲ دقیقه: عادت را آن‌قدر کوچک کن که نشود نه گفت. «کتاب خواندن» → «۱ صفحه».</small></div>
    <div class="dash-hb-grid">${cards || '<div class="dash-empty">عادتی نیست. اولین عادتت را بساز! 🌱</div>'}</div>
    <div class="dash-card"><b>🧠 قوانین طلایی عادت</b><ul class="dash-hb-rules">
      <li><b>هرگز دو بار پشت‌سرهم نشکن:</b> یک روز افتادن حادثه است، دو روز شروع عادت بد!</li>
      <li><b>محیط را طراحی کن:</b> کتاب روی بالش، گوشی دور از تخت.</li>
      <li><b>انباشتن عادت:</b> «بعد از [چای صبح]، [۱ صفحه] می‌خوانم».</li>
      <li><b>نمودار را نبین، زنجیره را ببین:</b> فقط امروز را تیک بزن. 🔥</li></ul></div></div>`;
}

export async function handleHabitsAction(action, el, api) {
  const hs = getHabits();
  switch (action) {
    case 'hb-add': {
      const inp = api.root.querySelector('[data-hb-name]');
      const v = inp?.value.trim().slice(0, 60);
      if (!v) { api.toast('نام عادت را بنویس!'); return true; }
      if (hs.length >= 12) { api.toast('حداکثر ۱۲ عادت! اول یکی را تمام کن.'); return true; }
      hs.push({ id: 'h' + Date.now().toString(36), name: v, log: [] });
      setHabits(hs);
      api.toast('🔥 عادت اضافه شد!');
      api.rerender(); return true;
    }
    case 'hb-tick': {
      const h = hs.find((x) => x.id === el.dataset.v);
      if (!h) return true;
      const today = dk(Date.now());
      const i = (h.log || []).findIndex((t) => dk(t) === today);
      if (i >= 0) h.log.splice(i, 1);
      else { h.log.push(Date.now()); api.toast(`🔥 آفرین! زنجیره ${esc(h.name)}: ${habitStreak(h) + 0} روز`); }
      setHabits(hs);
      api.rerender(); return true;
    }
    case 'hb-csv': exportHabitsCSV(); api.toast('✅ خروجی گرفته شد.'); return true;
    case 'hb-del':
      if (confirm('🗑 این عادت حذف شود؟')) {
        setHabits(hs.filter((x) => x.id !== el.dataset.v));
        api.rerender();
      }
      return true;
    default: return false;
  }
}

/** خروجی CSV عادت‌ها */
export function exportHabitsCSV() {
  const hs = getHabits();
  const rows = ['نام,تیک‌ها,زنجیره,درصد هفته'];
  hs.forEach((h) => rows.push([`"${(h.name || '').replace(/"/g, '""')}"`, (h.log || []).length, habitStreak(h), habitWeekRate(h) + '%'].join(',')));
  import('./dash-export.js').then((X) => X.download(`vixora-habits-${Date.now()}.csv`, rows.join('\n'), 'text/csv;charset=utf-8')).catch(() => null);
}
