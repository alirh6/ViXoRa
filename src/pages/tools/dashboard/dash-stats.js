// 📈 ViXoRa Personal Analytics — امتیاز بهره‌وری، استریک‌ها، مرور هفتگی، اهداف
// src/pages/tools/dashboard/dash-stats.js
import { esc, load, save } from './dash-state.js';

/** امتیاز روزانه ۰-۱۰۰ از ۶ محور */
export function productivityScore(dayTs = Date.now()) {
  const d = new Date(dayTs).toDateString();
  const inDay = (ts) => new Date(ts).toDateString() === d;
  let score = 0;
  const parts = [];
  const txs = load('vixora:txs', []).filter((t) => inDay(t.date || t.ts || 0)).length;
  const pTx = Math.min(20, txs * 5); score += pTx; parts.push(['مالی', pTx, 20]);
  const plays = load('vixora:music-stats', {}).plays || 0;
  const pMu = plays > 0 ? 15 : 0; score += pMu; parts.push(['موزیک', pMu, 15]);
  const notes = load('vixora:notes', []).filter((n) => inDay(n.ts || 0)).length;
  const pNo = Math.min(15, notes * 5); score += pNo; parts.push(['یادداشت', pNo, 15]);
  const pomo = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]').filter((p) => inDay(p.ts)).length;
  const pPo = Math.min(20, pomo * 10); score += pPo; parts.push(['تمرکز', pPo, 20]);
  const habits = load('vixora:habits', []).filter((h) => (h.done || []).some((t) => inDay(t))).length;
  const pHa = Math.min(15, habits * 5); score += pHa; parts.push(['عادت', pHa, 15]);
  const mood = load('vixora:mood', []).some((m) => inDay(m.ts)) ? 15 : 0; score += mood; parts.push(['حال', mood, 15]);
  const label = score >= 80 ? '🔥 فوق‌العاده' : score >= 60 ? '💪 عالی' : score >= 40 ? '🙂 خوب' : score >= 20 ? '🌱 شروع‌شده' : '😴 استراحت';
  return { score, parts, label };
}

/** استریک (زنجیره روزان) یک لاگ زمانی */
export function calcStreak(tsList) {
  const days = new Set(tsList.map((t) => new Date(t).toDateString()));
  let streak = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
export function allStreaks() {
  const out = [];
  const txDays = load('vixora:txs', []).map((t) => t.date || t.ts || 0);
  out.push({ icon: '💰', name: 'ثبت مالی', days: calcStreak(txDays) });
  const noteDays = load('vixora:notes', []).map((n) => n.ts || 0);
  out.push({ icon: '📝', name: 'یادداشت', days: calcStreak(noteDays) });
  const pomoDays = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]').map((p) => p.ts);
  out.push({ icon: '🍅', name: 'تمرکز', days: calcStreak(pomoDays) });
  load('vixora:habits', []).forEach((h) => out.push({ icon: '✅', name: h.name, days: calcStreak(h.done || []) }));
  return out.sort((a, b) => b.days - a.days);
}

/** مرور هفتگی خودکار (متن) */
export function weeklyReviewText() {
  const week = Date.now() - 7 * 86400000;
  const txs = load('vixora:txs', []).filter((t) => (t.date || t.ts || 0) >= week);
  const inc = txs.filter((t) => t.type === 'income').reduce((a, t) => a + (+t.amount || 0), 0);
  const exp = txs.filter((t) => t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
  const notes = load('vixora:notes', []).filter((n) => (n.ts || 0) >= week).length;
  const pomo = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]').filter((p) => p.ts >= week).reduce((a, p) => a + (p.min || 25), 0);
  const scores = [];
  for (let i = 6; i >= 0; i--) scores.push(productivityScore(Date.now() - i * 86400000).score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / 7);
  return { inc, exp, net: inc - exp, notes, pomoMin: pomo, avg, scores };
}

/** اهداف شخصی هفتگی */
const GOALS_KEY = 'vixora:weekly-goals';
export function getWeeklyGoals() {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY)) || []; } catch { return []; }
}
export function addWeeklyGoal(text, target = 5) {
  const g = getWeeklyGoals();
  g.push({ id: 'g' + Date.now().toString(36), text, target, done: 0, ts: Date.now() });
  save(GOALS_KEY, g);
  return g;
}
export function bumpWeeklyGoal(id, d = 1) {
  const g = getWeeklyGoals().map((x) => x.id === id ? { ...x, done: Math.max(0, x.done + d) } : x);
  save(GOALS_KEY, g);
  return g;
}
export function delWeeklyGoal(id) {
  const g = getWeeklyGoals().filter((x) => x.id !== id);
  save(GOALS_KEY, g);
  return g;
}

export function sparkSVG(vals, w = 120, h = 36, color = 'var(--d1)') {
  if (!vals.length) return '';
  const mx = Math.max(...vals, 1), mn = Math.min(...vals, 0);
  const pts = vals.map((v, i) => `${(i / Math.max(1, vals.length - 1) * w).toFixed(1)},${(h - 3 - ((v - mn) / Math.max(1, mx - mn)) * (h - 6)).toFixed(1)}`).join(' ');
  return `<svg class="dash-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function renderAnalytics() {
  const today = productivityScore();
  const streaks = allStreaks();
  const wr = weeklyReviewText();
  const goals = getWeeklyGoals();
  const ring = (pct, label) => {
    const c = 2 * Math.PI * 15.9;
    return `<div class="dash-ring-wrap"><svg viewBox="0 0 42 42" class="dash-ring"><circle cx="21" cy="21" r="15.9" fill="none" stroke="rgba(128,128,128,.2)" stroke-width="5"/><circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--d1)" stroke-width="5" stroke-dasharray="${(pct / 100 * c).toFixed(1)} ${c.toFixed(1)}" stroke-linecap="round" transform="rotate(-90 21 21)"/><text x="21" y="24" text-anchor="middle" font-size="9" fill="currentColor">${pct}</text></svg><small>${label}</small></div>`;
  };
  return `<div class="dash-an-wrap">
    <div class="dash-an-head"><b>📈 تحلیل شخصی</b><button class="dash-btn xs" data-action="w-stats-csv">📤 CSV امتیازها</button><span class="dash-chip">${today.label} • امتیاز امروز ${today.score}</span></div>
    <div class="dash-an-grid">
      <div class="dash-card"><b>🎯 امتیاز امروز</b><div class="dash-ring-row">${ring(today.score, 'کل')}${today.parts.slice(0, 3).map((p) => ring(Math.round(p[1] / p[2] * 100), p[0])).join('')}</div>
        <div class="dash-an-parts">${today.parts.map((p) => `<span>${p[0]} <b>${p[1]}</b>/${p[2]}</span>`).join('')}</div></div>
      <div class="dash-card"><b>🔥 استریک‌ها</b><div class="dash-streak-list">${streaks.slice(0, 6).map((s) => `<div class="dash-streak-row"><span>${s.icon} ${esc(s.name)}</span><b>${s.days} روز</b></div>`).join('') || '<div class="dash-empty">هنوز زنجیره‌ای نیست.</div>'}</div></div>
      <div class="dash-card"><b>🗓 مرور هفته</b>
        <div class="dash-kv"><span>میانگین امتیاز</span><b>${wr.avg}</b></div>
        <div class="dash-kv"><span>خالص مالی</span><b class="${wr.net >= 0 ? 'pos' : 'neg'}">${wr.net.toLocaleString('fa-IR')}</b></div>
        <div class="dash-kv"><span>یادداشت‌ها</span><b>${wr.notes}</b></div>
        <div class="dash-kv"><span>دقایق تمرکز</span><b>${wr.pomoMin}</b></div>
        ${sparkSVG(wr.scores, 160, 40)}</div>
      <div class="dash-card"><b>🏁 اهداف هفته</b>
        <div class="dash-row"><input data-goal-text placeholder="هدف جدید…"><input data-goal-target type="number" value="5" min="1" max="99"><button class="dash-btn xs" data-action="w-goal-add">＋</button></div>
        <div class="dash-goal-list">${goals.map((g) => `<div class="dash-goal-row"><span>${esc(g.text)}</span>
          <span class="dash-row"><button class="dash-btn xs" data-action="w-goal-bump" data-id="${g.id}" data-d="-1">−</button><b>${g.done}/${g.target}</b><button class="dash-btn xs" data-action="w-goal-bump" data-id="${g.id}" data-d="1">＋</button>
          <button class="dash-btn xs danger" data-action="w-goal-del" data-id="${g.id}">✕</button></span>
          <div class="dash-bar"><i style="width:${Math.min(100, Math.round(g.done / Math.max(1, g.target) * 100))}%"></i></div></div>`).join('') || '<div class="dash-empty">هدفی ثبت نشده.</div>'}</div></div>
    </div></div>`;
}
