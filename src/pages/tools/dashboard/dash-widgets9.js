// 🧩 ViXoRa Widgets 9 — سری نهم: بهره‌وری عمیق، مالی عمیق، سرگرمی
// src/pages/tools/dashboard/dash-widgets9.js
import { esc, load } from './dash-state.js';
import { svgBars, svgDonut, svgSpark } from './dash-charts.js';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const dk = (ts) => new Date(ts).toDateString();

export const WIDGETS_META_9 = {
  'deep-total': { title: 'جمع دیپ‌ورک', icon: '🧠', desc: 'ساعت‌های عمیق کل', w: 1 },
  'pomo-chart': { title: 'نمودار تمرکز', icon: '📊', desc: '۷ روز اخیر', w: 1 },
  'task-done-rate': { title: 'نرخ انجام کار', icon: '✅', desc: 'امروز چند درصد؟', w: 1 },
  'eisenhower': { title: 'ماتریس آیزنهاور', icon: '◫', desc: 'مهم/فوری', w: 2 },
  'top-expense-day': { title: 'پرخرج‌ترین روز', icon: '💸', desc: 'رکورد خرج ماه', w: 1 },
  'avg-tx': { title: 'میانگین تراکنش', icon: '🧮', desc: 'سایز خریدها', w: 1 },
  'cash-days': { title: 'روزهای نقدینگی', icon: '💵', desc: 'تا ته کشیدن', w: 1 },
  'goal-eta': { title: 'زمان تحقق هدف', icon: '⏳', desc: 'کی به هدف می‌رسی؟', w: 1 },
  'album-count': { title: 'شمار آلبوم‌ها', icon: '💿', desc: 'تنوع کتابخانه', w: 1 },
  'longest-song': { title: 'طولانی‌ترین آهنگ', icon: '🦒', desc: 'رکورد مدت', w: 1 },
  'palindrome': { title: 'تاریخ خاص', icon: '🪞', desc: 'آیا امروز خاص است؟', w: 1 },
  'age-days': { title: 'روزهای زندگی', icon: '🎂', desc: 'تو چند روزه‌ای؟', w: 1 },
};

export function renderWidgets9(id) {
  const now = Date.now();
  switch (id) {
    case 'deep-total': {
      const log = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]');
      const total = log.reduce((a, p) => a + (p.min || 25), 0);
      return `<div class="dash-big">🧠 ${fa(Math.floor(total / 60))}<small> ساعت + ${fa(total % 60)} دقیقه</small></div>
        <small>${fa(log.length)} بازه عمیق ثبت شده</small>
        <div><button class="dash-btn xs" data-action="view" data-v="focus">🧘 ادامه بده</button></div>`;
    }
    case 'pomo-chart': {
      const log = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]');
      const vals = [];
      for (let i = 6; i >= 0; i--) vals.push(log.filter((p) => dk(p.ts) === dk(now - i * 86400000)).reduce((a, p) => a + (p.min || 25), 0));
      return vals.some(Boolean) ? svgBars(vals.map((v, i) => [new Date(now - (6 - i) * 86400000).toLocaleDateString('fa-IR', { weekday: 'short' }), v])) : '<div class="dash-empty">تمرکزی ثبت نشده. از اتاق 🧘 شروع کن!</div>';
    }
    case 'task-done-rate': {
      const tasks = JSON.parse(localStorage.getItem('vixora:tasks-' + dk(now)) || '[]');
      const done = tasks.filter((t) => t.done).length;
      const r = tasks.length ? Math.round(done / tasks.length * 100) : 0;
      return `<div class="dash-big ${r === 100 && tasks.length ? 'pos' : ''}">${fa(r)}٪</div>
        <div class="dash-bar"><i style="width:${r}%"></i></div><small>${fa(done)} از ${fa(tasks.length)} کار</small>`;
    }
    case 'eisenhower': {
      let m = {};
      try { m = JSON.parse(localStorage.getItem('vixora:eisen') || '{}'); } catch {}
      const qs = [['q1', '🔥 مهم+فوری'], ['q2', '🌱 مهم'], ['q3', '📢 فوری'], ['q4', '🗑 نه مهم نه فوری']];
      return `<div class="dash-eis">${qs.map(([k, t]) => `<div class="dash-eis-q"><b>${t}</b><div>${(m[k] || []).map((x, i) => `<span>${esc(x)} <button class="dash-icon-btn" data-action="w9-eis-d" data-v="${k}:${i}">✕</button></span>`).join('') || '<small>—</small>'}</div><div class="dash-row"><input data-eis="${k}" placeholder="＋…"><button class="dash-btn xs" data-action="w9-eis-a" data-v="${k}">＋</button></div></div>`).join('')}</div>`;
    }
    case 'top-expense-day': {
      const m = new Date().getMonth(), y = new Date().getFullYear();
      const map = {};
      load('vixora:txs', []).forEach((t) => {
        const d = new Date(t.date || t.ts || 0);
        if (d.getMonth() === m && d.getFullYear() === y && t.type !== 'income') { const k = dk(d); map[k] = (map[k] || 0) + (+t.amount || 0); }
      });
      const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
      return top ? `<div class="dash-kv"><span>📅 ${new Date(top[0]).toLocaleDateString('fa-IR')}</span><b class="neg">${fa(top[1])}</b></div><small>آن روز چه خبر بود؟ 🤔</small>` : '<div class="dash-empty">خرجی در این ماه نیست.</div>';
    }
    case 'avg-tx': {
      const txs = load('vixora:txs', []).filter((t) => t.type !== 'income');
      const avg = txs.length ? txs.reduce((a, t) => a + (+t.amount || 0), 0) / txs.length : 0;
      return `<div class="dash-big">🧮 ${fa(Math.round(avg))}</div><small>میانگین هر خرید • ${fa(txs.length)} خرید</small><small>💡 خریدهای کوچکِ زیاد = نشت پول!</small>`;
    }
    case 'cash-days': {
      const m = new Date().getMonth();
      const exp = load('vixora:txs', []).filter((t) => new Date(t.date || t.ts || 0).getMonth() === m && t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
      const day = new Date().getDate();
      const daily = exp / Math.max(1, day);
      const cash = 5000000; // فرض موجودی نقد
      const days = daily > 0 ? Math.floor(cash / daily) : 99;
      return `<div class="dash-big">💵 ${fa(days)}<small> روز</small></div><small>با روند فعلی (فرض ۵ میلیون نقد)</small>`;
    }
    case 'goal-eta': {
      const goals = load('vixora:goals', []).filter((g) => g.target && (g.saved || 0) < g.target);
      if (!goals.length) return '<div class="dash-empty">هدف فعالی نیست. یکی بساز! 🌟</div>';
      const m = new Date().getMonth();
      const saved = load('vixora:txs', []).filter((t) => new Date(t.date || t.ts || 0).getMonth() === m && t.type === 'income').reduce((a, t) => a + (+t.amount || 0), 0) - load('vixora:txs', []).filter((t) => new Date(t.date || t.ts || 0).getMonth() === m && t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
      const g = goals[0];
      const left = g.target - (g.saved || 0);
      const months = saved > 0 ? Math.ceil(left / saved) : 0;
      return `<b>🌟 ${esc(g.title)}</b><div class="dash-big">⏳ ${months ? fa(months) + ' ماه' : '؟'}</div><small>مانده: ${fa(left)} • پس‌انداز ماه: ${fa(Math.max(0, saved))}</small>`;
    }
    case 'album-count': {
      const set = new Set();
      load('vixora:music-lib', load('vixora:songs', [])).forEach((s) => { if (s.album) set.add(s.album); });
      return `<div class="dash-big">💿 ${fa(set.size)}<small> آلبوم</small></div><small>تنوع = کشف بیشتر! 🔍</small>`;
    }
    case 'longest-song': {
      const songs = load('vixora:music-lib', load('vixora:songs', [])).filter((s) => s.duration);
      const top = songs.sort((a, b) => b.duration - a.duration)[0];
      if (!top) return '<div class="dash-empty">مدت آهنگی ثبت نشده.</div>';
      const mm = Math.floor(top.duration / 60), ss = Math.floor(top.duration % 60);
      return `<div class="dash-big">🦒 ${fa(mm)}:${String(ss).padStart(2, '0')}</div><small>${esc(top.title || '')} — ${esc(top.artist || '')}</small>`;
    }
    case 'palindrome': {
      const d = new Date();
      const s = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      const pal = s === [...s].reverse().join('');
      const faD2 = d.toLocaleDateString('fa-IR');
      return pal ? `<div class="dash-big">🪞✨</div><small>امروز (${faD2}) تاریخ آینه‌ای است! آرزو کن! 🌟</small>` : `<div class="dash-big">📅</div><small>امروز ${faD2} — هر روز خاص است اگر بخواهی! ✨</small>`;
    }
    case 'age-days': {
      const b = localStorage.getItem('vixora:birth');
      if (!b) return `<input class="dash-input" data-birth type="date" style="margin:0"><button class="dash-btn xs" data-action="w9-birth" style="margin-top:6px">🎂 ثبت تولد</button>`;
      const days = Math.floor((now - new Date(b).getTime()) / 86400000);
      return `<div class="dash-big">🎂 ${fa(days)}<small> روز زندگی!</small></div><small>≈ ${fa(Math.floor(days / 365))} سال پر از تجربه 🌟</small>`;
    }
    default: return '';
  }
}

export function afterWidgets9Render() {}

export async function handleWidgets9Action(action, el, api) {
  if (action === 'w9-eis-a') {
    const k = el.dataset?.v;
    const scope = el.closest('.dash-eis-q') || api.root;
    const v = scope.querySelector(`[data-eis="${k}"]`)?.value.trim();
    if (!v) return true;
    const m = JSON.parse(localStorage.getItem('vixora:eisen') || '{}');
    (m[k] = m[k] || []).push(v);
    localStorage.setItem('vixora:eisen', JSON.stringify(m));
    api.rerender(); return true;
  }
  if (action === 'w9-eis-d') {
    const [k, i] = (el.dataset?.v || '').split(':');
    const m = JSON.parse(localStorage.getItem('vixora:eisen') || '{}');
    m[k]?.splice(+i, 1);
    localStorage.setItem('vixora:eisen', JSON.stringify(m));
    api.rerender(); return true;
  }
  if (action === 'w9-birth') {
    const scope = el.closest('section') || api.root;
    const v = scope.querySelector('[data-birth]')?.value;
    if (v) { localStorage.setItem('vixora:birth', v); api.rerender(); }
    return true;
  }
  return false;
}
