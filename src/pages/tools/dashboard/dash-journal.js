// 📓 ViXoRa Journal — ژورنال روزانه: حال، انرژی، شکرگزاری، بردها، آموخته‌ها
// src/pages/tools/dashboard/dash-journal.js
import { esc, load, save } from './dash-state.js';

const KEY = 'vixora:journal';
const MOODS = [['1', '😭', 'افتضاح'], ['2', '😞', 'بد'], ['3', '😐', 'معمولی'], ['4', '🙂', 'خوب'], ['5', '🤩', 'عالی']];
const ENERGIES = [['1', '🪫', 'خالی'], ['2', '🔋', 'کم'], ['3', '🔋', 'متوسط'], ['4', '⚡', 'زیاد'], ['5', '⚡⚡', 'فول']];
const PROMPTS = [
  'امروز بابت چه چیزی شکرگزاری؟ 🙏', 'امروز چه چیزی یاد گرفتی؟ 🧠', 'اگر امروز را دوباره می‌زیستی، چه را عوض می‌کردی؟ 🔄',
  'چه کسی امروز لبخندت را ساخت؟ 😊', 'بزرگ‌ترین برد امروزت چه بود؟ 🏆', 'امروز از چه چیزی فرار کردی؟ 🏃',
  'فردا یک کار مهمت چیست؟ 🎯', 'امروز بدنت چه حسی داشت؟ 🧘', 'چه چیزی امروز غافلگیرت کرد؟ 😲',
  'بهترین لحظه امروز؟ ✨', 'امروز به چه کسی کمک کردی؟ 🤝', 'چه ترسی امروز کوچک‌تر شد؟ 🦁',
  'امروز چه خرجی ارزشش را داشت؟ 💰', 'یک جمله به خودِ فردا صبح بگو. 💬',
];

export const dayStr = (ts = Date.now()) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export function getJournal() { return load(KEY, {}); }
export function getEntry(day) { return getJournal()[day] || null; }
export function saveEntry(day, patch) {
  const j = getJournal();
  j[day] = { ...(j[day] || {}), ...patch, ts: Date.now() };
  save(KEY, j);
  return j[day];
}
export function deleteEntry(day) {
  const j = getJournal();
  delete j[day];
  save(KEY, j);
}
export function journalStreak() {
  const j = getJournal();
  let s = 0;
  const d = new Date();
  if (!j[dayStr(d)]) d.setDate(d.getDate() - 1);
  while (j[dayStr(d)]) { s++; d.setDate(d.getDate() - 1); }
  return s;
}
export function journalStats() {
  const j = getJournal();
  const days = Object.keys(j).sort();
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const e = j[dayStr(Date.now() - i * 86400000)];
    last7.push(e ? +e.mood || 0 : 0);
  }
  const moods = days.map((d) => +j[d].mood || 0).filter(Boolean);
  return {
    count: days.length, streak: journalStreak(), last7,
    avg: moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : '—',
  };
}

const faD = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

export function renderJournal(st = {}) {
  const day = st.jDay || dayStr();
  const e = getEntry(day) || {};
  const stats = journalStats();
  const dObj = new Date(day + 'T12:00:00');
  // نوار ۱۴ روز
  let strip = '';
  for (let i = 13; i >= 0; i--) {
    const dd = dayStr(Date.now() - i * 86400000);
    const en = getEntry(dd);
    const dt = new Date(dd + 'T12:00:00');
    strip += `<button class="dash-j-day ${dd === day ? 'on' : ''} ${en ? 'has' : ''}" data-action="j-day" data-v="${dd}" title="${dt.toLocaleDateString('fa-IR')}">
      <i>${dt.toLocaleDateString('fa-IR', { weekday: 'short' })}</i>
      <b>${faD(dt.getDate())}</b>
      <u>${en ? (MOODS.find((m) => m[0] === String(en.mood))?.[1] || '•') : '·'}</u></button>`;
  }
  const moodBtns = (cur, kind, arr) => arr.map(([v, ic, t]) => `<button class="dash-j-pick ${String(cur) === v ? 'on' : ''}" data-action="j-${kind}" data-v="${v}" title="${t}">${ic}<small>${t}</small></button>`).join('');
  const prompt = PROMPTS[Math.floor(dObj.getTime() / 86400000) % PROMPTS.length];
  return `<div class="dash-j-wrap">
    <div class="dash-j-head"><b>📓 ژورنال روزانه</b>
      <span class="dash-row"><span class="dash-chip">🔥 ${faD(stats.streak)} روز زنجیره</span>
      <span class="dash-chip">📝 ${faD(stats.count)} روز ثبت</span>
      <span class="dash-chip">😊 میانگین ${faD(stats.avg)}</span></span></div>
    <div class="dash-j-date"><b>${dObj.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}</b>
      <span class="dash-row"><button class="dash-btn xs" data-action="j-today">📍 امروز</button>
      <button class="dash-btn xs" data-action="j-export">📤 خروجی</button></span></div>
    <div class="dash-j-strip">${strip}</div>
    <div class="dash-j-grid">
      <div class="dash-card"><b>😊 حالت امروز</b><div class="dash-j-picks">${moodBtns(e.mood, 'mood', MOODS)}</div></div>
      <div class="dash-card"><b>⚡ انرژیت</b><div class="dash-j-picks">${moodBtns(e.energy, 'energy', ENERGIES)}</div></div>
      <div class="dash-card"><b>🙏 سه شکرگزاری</b>
        <input class="dash-input" data-j="g0" placeholder="۱…" value="${esc(e.g?.[0] || '')}">
        <input class="dash-input" data-j="g1" placeholder="۲…" value="${esc(e.g?.[1] || '')}">
        <input class="dash-input" data-j="g2" placeholder="۳…" value="${esc(e.g?.[2] || '')}"></div>
      <div class="dash-card"><b>🏆 برد امروز</b><textarea class="dash-input" data-j="win" rows="2" placeholder="به چه چیزی افتخار می‌کنی؟">${esc(e.win || '')}</textarea>
        <b style="margin-top:8px">🧠 آموخته امروز</b><textarea class="dash-input" data-j="learn" rows="2" placeholder="چه یاد گرفتی؟">${esc(e.learn || '')}</textarea></div>
    </div>
    <div class="dash-card"><b>💬 سؤال امروز:</b> <span class="dash-j-prompt">${prompt}</span>
      <textarea class="dash-input" data-j="text" rows="4" placeholder="هر چه در دلت هست بنویس…">${esc(e.text || '')}</textarea>
      <div class="dash-row" style="margin-top:8px"><button class="dash-btn dash-btn-primary" data-action="j-save">💾 ذخیره روز ${faD(dObj.getDate())}</button>
      ${e.ts ? `<button class="dash-btn xs" data-action="j-tonote">📝 به یادداشت‌ها</button><button class="dash-btn xs danger" data-action="j-clear">🗑 حذف این روز</button><small>آخرین ذخیره: ${new Date(e.ts).toLocaleTimeString('fa-IR')}</small>` : '<small>هنوز ذخیره نشده.</small>'}</div></div>
  </div>`;
}

/** بینش‌های ژورنال: حال روزهای هفته + پرتکرارترین کلمات + رکورد */
export function journalInsights() {
  const j = getJournal();
  const days = Object.entries(j);
  if (!days.length) return null;
  const WD = ['شنبه', '۱شنبه', '۲شنبه', '۳شنبه', '۴شنبه', '۵شنبه', 'جمعه'];
  const wdSum = [0, 0, 0, 0, 0, 0, 0], wdN = [0, 0, 0, 0, 0, 0, 0];
  let words = 0, longest = { d: '', n: 0 };
  days.forEach(([k, e]) => {
    const w = (new Date(k + 'T12:00:00').getDay() + 1) % 7;
    if (e.mood) { wdSum[w] += +e.mood; wdN[w]++; }
    const n = (e.text || '').trim().split(/\s+/).filter(Boolean).length;
    words += n;
    if (n > longest.n) longest = { d: k, n };
  });
  let best = 0, bestV = -1;
  wdSum.forEach((s, i) => { const a = wdN[i] ? s / wdN[i] : 0; if (wdN[i] && a > bestV) { bestV = a; best = i; } });
  return { count: days.length, words, longest, bestDay: WD[best], bestAvg: bestV > 0 ? bestV.toFixed(1) : null };
}

export function renderJournalInsights() {
  const ins = journalInsights();
  if (!ins) return '<div class="dash-empty">هنوز ژورنالی نیست.</div>';
  return `<div class="dash-grid-2">
    <div class="dash-kpi"><span>📓 روزهای ثبت</span><b>${ins.count}</b></div>
    <div class="dash-kpi"><span>✍️ کلمات نوشته‌شده</span><b>${Number(ins.words).toLocaleString('fa-IR')}</b></div>
    <div class="dash-kpi"><span>😊 شادترین روز هفته</span><b>${ins.bestAvg ? `${ins.bestDay} (${ins.bestAvg})` : '—'}</b></div>
    <div class="dash-kpi"><span>📜 طولانی‌ترین روز</span><b>${ins.longest.n ? `${new Date(ins.longest.d + 'T12:00:00').toLocaleDateString('fa-IR')} (${ins.longest.n} کلمه)` : '—'}</b></div></div>`;
}

export async function handleJournalAction(action, el, api) {
  const st = api.st;
  if (!st.jDay) st.jDay = dayStr();
  switch (action) {
    case 'j-day': st.jDay = el.dataset.v || dayStr(); api.rerender(); return true;
    case 'j-today': st.jDay = dayStr(); api.rerender(); return true;
    case 'j-mood': saveEntry(st.jDay, { mood: el.dataset.v }); api.rerender(); return true;
    case 'j-energy': saveEntry(st.jDay, { energy: el.dataset.v }); api.rerender(); return true;
    case 'j-save': {
      const root = api.root;
      const g = (k) => root.querySelector(`[data-j="${k}"]`)?.value.trim() || '';
      saveEntry(st.jDay, { g: [g('g0'), g('g1'), g('g2')], win: g('win'), learn: g('learn'), text: g('text') });
      api.toast('📓 ژورنال ذخیره شد. ✍️');
      api.rerender(); return true;
    }
    case 'j-tonote': {
      const e = getEntry(st.jDay) || {};
      const txt = `📓 ${new Date(st.jDay + 'T12:00:00').toLocaleDateString('fa-IR')}\nحال: ${e.mood || '—'}/۵ • انرژی: ${e.energy || '—'}/۵\n${e.text || ''}`;
      try {
        const { createToolItem } = await import('../../../core/actions/tools-service.js');
        await createToolItem('notes', { title: txt.slice(0, 60), body: txt, createdAt: new Date().toISOString() });
        api.toast('📝 به یادداشت‌ها رفت!');
      } catch { api.toast('❌ نشد.'); }
      return true;
    }
    case 'j-clear':
      if (confirm('🗑 این روز حذف شود؟')) { deleteEntry(st.jDay); api.toast('حذف شد.'); api.rerender(); }
      return true;
    case 'j-export': {
      const j = getJournal();
      const days = Object.keys(j).sort();
      const md = days.map((d) => {
        const x = j[d];
        return `## ${new Date(d + 'T12:00:00').toLocaleDateString('fa-IR')}\n\n- حال: ${x.mood || '—'}/۵ • انرژی: ${x.energy || '—'}/۵\n- شکرگزاری: ${(x.g || []).filter(Boolean).join('، ') || '—'}\n- برد: ${x.win || '—'}\n- آموخته: ${x.learn || '—'}\n\n${x.text || ''}\n`;
      }).join('\n---\n\n') || '_خالی_';
      const { download } = await import('./dash-export.js');
      download(`vixora-journal-${Date.now()}.md`, `# 📓 ژورنال ViXoRa\n\n${md}`);
      api.toast(`✅ ${days.length} روز خروجی شد.`);
      return true;
    }
    default: return false;
  }
}
