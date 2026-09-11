// 🎯 ViXoRa Goals Hub — هاب اهداف: هفتگی + مالی + عادت‌ماهانه
// src/pages/tools/dashboard/dash-goals.js
import { esc, load, save } from './dash-state.js';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const WKEY = 'vixora:weekly-goals';
const MKEY = 'vixora:monthly-quests';

export function getQuests() {
  try {
    const q = JSON.parse(localStorage.getItem(MKEY) || '{}');
    const mk = new Date().toISOString().slice(0, 7);
    if (q.month !== mk) return { month: mk, items: [] };
    return q;
  } catch { return { month: new Date().toISOString().slice(0, 7), items: [] }; }
}
function setQuests(q) { try { localStorage.setItem(MKEY, JSON.stringify(q)); } catch {} }

export function renderGoals() {
  const weekly = load(WKEY, []);
  const fin = load('vixora:goals', []);
  const quests = getQuests();
  const wDone = weekly.filter((g) => g.done >= g.target).length;
  const finDone = fin.filter((g) => g.target && (g.saved || 0) >= g.target).length;
  const qDone = quests.items.filter((q) => q.done).length;
  const total = weekly.length + fin.length + quests.items.length;
  const doneTotal = wDone + finDone + qDone;
  const pct = total ? Math.round(doneTotal / total * 100) : 0;
  return `<div class="dash-gls-wrap">
    <div class="dash-gls-head"><b>🎯 هاب اهداف</b><span class="dash-chip">${fa(doneTotal)} از ${fa(total)} تمام • ${fa(pct)}٪</span></div>
    <div class="dash-bar"><i style="width:${pct}%"></i></div>
    <div class="dash-gls-grid">
      <div class="dash-card"><b>🏁 اهداف هفته (${fa(weekly.length)})</b>
        <div class="dash-row" style="margin:6px 0"><input class="dash-input" data-gl-w placeholder="هدف…" style="margin:0"><input class="dash-input" data-gl-wt type="number" value="5" style="margin:0;width:64px"><button class="dash-btn xs" data-action="gl-w-add">＋</button></div>
        ${weekly.map((g) => `<div class="dash-goal-row"><span>${esc(g.text)}</span>
          <span class="dash-row"><button class="dash-btn xs" data-action="w-goal-bump" data-id="${g.id}" data-d="-1">−</button><b>${fa(g.done)}/${fa(g.target)}</b><button class="dash-btn xs" data-action="w-goal-bump" data-id="${g.id}" data-d="1">＋</button>
          <button class="dash-btn xs danger" data-action="w-goal-del" data-id="${g.id}">✕</button></span>
          <div class="dash-bar"><i style="width:${Math.min(100, Math.round(g.done / Math.max(1, g.target) * 100))}%"></i></div></div>`).join('') || '<div class="dash-empty">هدفی نیست.</div>'}</div>
      <div class="dash-card"><b>🌟 اهداف مالی (${fa(fin.length)})</b>
        ${fin.map((g) => { const p = g.target ? Math.round((g.saved || 0) / g.target * 100) : 0; return `<div class="dash-goal-row"><span>🌟 ${esc(g.title)}</span>
          <span class="dash-row"><b>${fa(p)}٪</b><button class="dash-btn xs" data-action="go" data-link="/tools/invoices">واریز ↗</button></span>
          <div class="dash-bar"><i style="width:${Math.min(100, p)}%"></i></div>
          <small>${fa(g.saved || 0)} از ${fa(g.target || 0)}</small></div>`; }).join('') || '<div class="dash-empty">هدف مالی نیست.</div><button class="dash-btn xs" data-action="go" data-link="/tools/invoices">＋ ساخت در مالی ↗</button>'}</div>
      <div class="dash-card"><b>🗓 مأموریت‌های این ماه (${fa(quests.items.length)})</b>
        <div class="dash-row" style="margin:6px 0"><input class="dash-input" data-gl-q placeholder="مأموریت…" style="margin:0"><button class="dash-btn xs" data-action="gl-q-add">＋</button></div>
        ${quests.items.map((q) => `<div class="dash-kv"><span>${q.done ? '✅' : '⬜'} ${esc(q.text)}</span>
          <span class="dash-row"><button class="dash-btn xs" data-action="gl-q-t" data-id="${q.id}">${q.done ? '↩' : '✓'}</button><button class="dash-btn xs danger" data-action="gl-q-d" data-id="${q.id}">✕</button></span></div>`).join('') || '<div class="dash-empty">مأموریتی نیست. ۳ مأموریت ماهانه بنویس!</div>'}
        <small class="dash-hint">💡 هر ماه تازه شروع می‌شود. ناتمام‌ها منتقل نمی‌شوند — عمداً! (فشار مثبت 😄)</small></div>
    </div>
    <div class="dash-card"><b>🧠 فرمول هدف خوب (SMART ساده)</b>
      <div class="dash-row wrap" style="margin-top:6px">
        <span class="dash-chip">🎯 مشخص (نه «کمتر خرج» بلکه «خرج رستوران زیر ۲م»)</span>
        <span class="dash-chip">🔢 قابل شمارش</span>
        <span class="dash-chip">💪 چالشی ولی ممکن</span>
        <span class="dash-chip">⏰ ددلاین‌دار</span></div></div></div>`;
}

export async function handleGoalsAction(action, el, api) {
  const root = api.root;
  switch (action) {
    case 'gl-w-add': {
      const t = root.querySelector('[data-gl-w]')?.value.trim();
      const n = +(root.querySelector('[data-gl-wt]')?.value || 5);
      if (!t) return true;
      const { addWeeklyGoal } = await import('./dash-stats.js');
      addWeeklyGoal(t, n);
      api.rerender(); return true;
    }
    case 'gl-q-add': {
      const t = root.querySelector('[data-gl-q]')?.value.trim();
      if (!t) return true;
      const q = getQuests();
      if (q.items.length >= 10) { api.toast('حداکثر ۱۰ مأموریت!'); return true; }
      q.items.push({ id: 'q' + Date.now().toString(36), text: t, done: false });
      setQuests(q);
      api.rerender(); return true;
    }
    case 'gl-q-t': {
      const q = getQuests();
      const it = q.items.find((x) => x.id === el.dataset.id);
      if (it) { it.done = !it.done; if (it.done) api.toast('🎉 مأموریت انجام شد!'); }
      setQuests(q);
      api.rerender(); return true;
    }
    case 'gl-q-d': {
      const q = getQuests();
      q.items = q.items.filter((x) => x.id !== el.dataset.id);
      setQuests(q);
      api.rerender(); return true;
    }
    default: return false;
  }
}
