// 🌙 ViXoRa Nightly Review — مرور شبانه هدایت‌شده: ۵ قدم تا خواب آرام
// src/pages/tools/dashboard/dash-review.js
import { esc, load } from './dash-state.js';

const dk = (ts) => new Date(ts).toDateString();
const fa = (n) => Number(n || 0).toLocaleString('fa-IR');

const STEPS = [
  { id: 'money', icon: '💰', title: 'پول امروز', desc: 'هزینه‌ها کامل ثبت شده؟' },
  { id: 'habits', icon: '🔥', title: 'عادت‌ها', desc: 'تیک‌های امروز' },
  { id: 'journal', icon: '📓', title: 'ژورنال', desc: 'یک خط برای امروز' },
  { id: 'tomorrow', icon: '🌅', title: 'فردا', desc: '۳ کار مهم' },
  { id: 'sleep', icon: '😴', title: 'خواب', desc: 'آماده خواب؟' },
];

export function reviewState() {
  const t = dk(Date.now());
  const txs = load('vixora:txs', []).filter((x) => dk(x.date || x.ts || 0) === t);
  const hs = load('ViXoRa:dash-habits', []);
  const hDone = hs.filter((h) => (h.log || []).some((x) => dk(x) === t)).length;
  const d = new Date();
  const jk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hasJ = !!load('vixora:journal', {})[jk];
  let done = [];
  try { done = JSON.parse(localStorage.getItem('vixora:review-' + t) || '[]'); } catch {}
  return { txs: txs.length, habits: hs.length, hDone, hasJ, done };
}

function stepCard(i, st) {
  const s = STEPS[i];
  const isDone = st.done.includes(s.id);
  let body = '';
  if (s.id === 'money') body = st.txs ? `<small>✅ ${fa(st.txs)} تراکنش امروز ثبت شده.</small>` : '<small>⚠️ امروز چیزی ثبت نشده! از مالی یا ویجت 🧾 ثبت کن.</small>';
  if (s.id === 'habits') body = st.habits ? `<small>${st.hDone >= st.habits ? '✅' : '⬜'} ${fa(st.hDone)} از ${fa(st.habits)} انجام شده.</small><div><button class="dash-btn xs" data-action="view" data-v="habits">رفتن به عادت‌ها</button></div>` : '<small>عادتی نداری — از اتاق 🔥 بساز!</small>';
  if (s.id === 'journal') body = st.hasJ ? '<small>✅ ژورنال امروز نوشته شده!</small>' : '<small>✍️ فقط یک خط بنویس…</small><div class="dash-row"><input class="dash-input" data-rv-j placeholder="امروز…" style="margin:0"><button class="dash-btn xs" data-action="rv-j">💾</button></div>';
  if (s.id === 'tomorrow') {
    const tm = new Date(Date.now() + 86400000).toDateString();
    const tasks = JSON.parse(localStorage.getItem('vixora:tasks-' + tm) || '[]');
    body = `<small>${tasks.length ? `${fa(tasks.length)} کار برای فردا آماده است.` : 'فردا را از امشب بساز!'}</small><div class="dash-row"><input class="dash-input" data-rv-t placeholder="کار فردا…" style="margin:0"><button class="dash-btn xs" data-action="rv-t">＋</button></div>`;
  }
  if (s.id === 'sleep') body = '<small>تایمر خواب + گوشی بیرون اتاق = خواب پادشاهی 👑</small><div class="dash-row wrap"><button class="dash-btn xs" data-action="r-sleep" data-v="30">😴 خواب ۳۰ دقیقه</button></div>';
  return `<div class="dash-card dash-rv-card ${isDone ? 'done' : ''}">
    <div class="dash-rv-top"><span class="dash-rv-n">${isDone ? '✅' : fa(i + 1)}</span>
    <div><b>${s.icon} ${s.title}</b><br><small>${s.desc}</small></div>
    <button class="dash-btn xs ${isDone ? '' : 'dash-btn-primary'}" data-action="rv-tick" data-v="${s.id}">${isDone ? '↩' : '✓ انجام'}</button></div>
    <div class="dash-rv-body">${body}</div></div>`;
}

export function renderReview() {
  const st = reviewState();
  const pct = Math.round(st.done.length / STEPS.length * 100);
  const allDone = st.done.length >= STEPS.length;
  return `<div class="dash-rv-wrap">
    <div class="dash-rv-head"><b>🌙 مرور شبانه</b><span class="dash-chip">${fa(st.done.length)} از ${fa(STEPS.length)} • ${fa(pct)}٪</span></div>
    <div class="dash-bar"><i style="width:${pct}%"></i></div>
    ${allDone ? '<div class="dash-verdict">🎉 آفرین! امروز را کامل بستی. خواب شیرین! 😴🌙</div>' : '<small class="dash-hint">۵ قدم تا بستن کامل روز. هر قدم کمتر از ۱ دقیقه!</small>'}
    <div class="dash-rv-list">${STEPS.map((_, i) => stepCard(i, st)).join('')}</div>
    ${allDone ? '<div class="dash-row"><button class="dash-btn" data-action="rv-reset">↺ شروع دوباره</button></div>' : ''}</div>`;
}

export async function handleReviewAction(action, el, api) {
  const t = dk(Date.now());
  const key = 'vixora:review-' + t;
  const get = () => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  switch (action) {
    case 'rv-tick': {
      const id = el.dataset.v;
      let done = get();
      done = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
      localStorage.setItem(key, JSON.stringify(done));
      if (done.length >= STEPS.length) {
        api.toast('🎉 مرور کامل شد! خواب شیرین! 😴');
        const { pushNotify } = await import('./dash-notify.js');
        pushNotify('🌙', 'مرور شبانه کامل شد!', 'فردا آماده است. بخواب قهرمان! 😴');
      }
      api.rerender(); return true;
    }
    case 'rv-j': {
      const v = api.root.querySelector('[data-rv-j]')?.value.trim();
      if (!v) return true;
      const { saveEntry, dayStr } = await import('./dash-journal.js');
      saveEntry(dayStr(), { text: v });
      api.toast('📓 در ژورنال ذخیره شد!');
      api.rerender(); return true;
    }
    case 'rv-t': {
      const v = api.root.querySelector('[data-rv-t]')?.value.trim();
      if (!v) return true;
      const tm = new Date(Date.now() + 86400000).toDateString();
      const k = 'vixora:tasks-' + tm;
      const arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr.push({ text: v, done: false });
      localStorage.setItem(k, JSON.stringify(arr));
      api.toast('🌅 به فردا اضافه شد!');
      api.rerender(); return true;
    }
    case 'rv-reset': localStorage.removeItem(key); api.rerender(); return true;
    default: return false;
  }
}
