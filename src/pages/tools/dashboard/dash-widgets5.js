// 🧩 ViXoRa Widgets 5 — سری پنجم: اعلان، تم، تحلیل، خروجی، خودکار، سرگرمی
// src/pages/tools/dashboard/dash-widgets5.js
import { esc, load } from './dash-state.js';
import { svgBars, svgDonut, svgSpark } from './dash-charts.js';
import { unreadCount } from './dash-notify.js';
import { productivityScore } from './dash-stats.js';
import { THEMES, currentThemeId } from './dash-themes.js';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const dayKey = (ts) => new Date(ts).toDateString();

export const WIDGETS_META_5 = {
  'notify-mini': { title: 'اعلان‌ها', icon: '🔔', desc: 'خوانده‌نشده‌ها + مرکز', w: 1 },
  'score-mini': { title: 'امتیاز امروز', icon: '🎯', desc: 'بهره‌وری روزانه', w: 1 },
  'theme-mini2': { title: 'تم‌ها', icon: '🎨', desc: 'گالری سریع', w: 1 },
  'export-mini': { title: 'خروجی سریع', icon: '📤', desc: 'بکاپ و CSV', w: 1 },
  'auto-mini': { title: 'خودکارها', icon: '🤖', desc: 'قوانین فعال', w: 1 },
  'week-review': { title: 'مرور هفته', icon: '🗓', desc: '۷ روز گذشته', w: 2 },
  'month-compare': { title: 'مقایسه ماه', icon: '⚖️', desc: 'امسال در برابر پارسال', w: 1 },
  'top-days': { title: 'بهترین روزها', icon: '🏆', desc: 'پربارترین روزها', w: 1 },
  'cat-year': { title: 'دسته‌های سال', icon: '🍩', desc: 'دونات سالانه', w: 1 },
  'artist-top': { title: 'خواننده‌ها', icon: '🎤', desc: 'برترین خوانندگان', w: 1 },
  'genre-pie': { title: 'ژانرها', icon: '🎼', desc: 'توزیع ژانر', w: 1 },
  'listen-week': { title: 'شنیدار هفته', icon: '🎧', desc: 'دقایق ۷ روز', w: 1 },
  'cust-growth': { title: 'رشد مشتری', icon: '📈', desc: '۶ ماه اخیر', w: 1 },
  'unit-occ': { title: 'اشغال واحدها', icon: '🏠', desc: 'درصد پر بودن', w: 1 },
  'fun-fact2': { title: 'دانستنی ۲', icon: '🤯', desc: 'آمار چرخشی تازه', w: 1 },
  'quote2': { title: 'جمله انگیزشی', icon: '💬', desc: 'حال‌خوب‌کن', w: 1 },
  'dice2': { title: 'تصمیم‌گیر', icon: '🎯', desc: 'بله/خیر شانسی', w: 1 },
  'timer-mini': { title: 'تایمر ساده', icon: '⏲', desc: 'شمارش معکوس', w: 1 },
  'breathe': { title: 'تنفس', icon: '🫁', desc: 'آرامش ۱ دقیقه‌ای', w: 1 },
};

const MOTI = ['تو قوی‌تر از بهانه‌هایتی. 💪', 'قدم کوچک امروز، جهش فرداست. 🚀', 'نظم، استعداد پنهان است. 📏', 'شروع ناقص بهتر از انتظار کامل است. 🌱', 'هر روز ۱٪ بهتر شو. 📈', 'تمرکز یعنی نه گفتن. 🎯', 'آینده از امروز ساخته می‌شود. 🏗', 'تو داستان موفقیت خودتی. 📖'];

export function renderWidgets5(id, api) {
  const now = Date.now();
  switch (id) {
    case 'notify-mini': {
      const n = unreadCount();
      return `<div class="dash-big">${fa(n)}</div><small>اعلان خوانده‌نشده</small>
        <div class="dash-row"><button class="dash-btn xs" data-action="view" data-v="notify">🔔 مرکز اعلان‌ها</button>
        <button class="dash-btn xs" data-action="w-notify-scan">🔍 بررسی</button></div>`;
    }
    case 'score-mini': {
      const s = productivityScore();
      return `<div class="dash-big">${fa(s.score)}<small>/۱۰۰</small></div><small>${s.label}</small>
        <div class="dash-bar"><i style="width:${s.score}%"></i></div>
        <button class="dash-btn xs" data-action="view" data-v="analytics">📈 تحلیل کامل</button>`;
    }
    case 'theme-mini2': {
      const cur = currentThemeId();
      return `<div class="dash-theme-dots">${THEMES.slice(0, 8).map((t) => `<button class="dash-dot ${cur === t.id ? 'on' : ''}" style="background:linear-gradient(135deg,${t.c1},${t.c2})" data-action="w-theme-set" data-v="${t.id}" title="${esc(t.name)}"></button>`).join('')}</div>
        <button class="dash-btn xs" data-action="view" data-v="themes">🎨 گالری تم</button>`;
    }
    case 'export-mini':
      return `<div class="dash-row wrap"><button class="dash-btn xs" data-action="w-xp-backup">🛟 بکاپ</button>
        <button class="dash-btn xs" data-action="w-xp-tx">💰 CSV</button>
        <button class="dash-btn xs" data-action="view" data-v="export">📤 مرکز خروجی</button></div>
        <small>آخرین بکاپ: ${localStorage.getItem('vixora:backup-last') ? new Date(+localStorage.getItem('vixora:backup-last')).toLocaleDateString('fa-IR') : 'هیچ‌وقت'}</small>`;
    case 'auto-mini': {
      let on = 0, total = 0;
      try { const a = JSON.parse(localStorage.getItem('vixora:automations')) || []; total = a.length; on = a.filter((x) => x.on).length; } catch {}
      return `<div class="dash-big">${fa(on)}<small>/ ${fa(total)}</small></div><small>قانون فعال</small>
        <button class="dash-btn xs" data-action="view" data-v="auto">🤖 مدیریت</button>`;
    }
    case 'week-review': {
      const week = now - 7 * 86400000;
      const txs = load('vixora:txs', []).filter((t) => (t.date || t.ts || 0) >= week);
      const inc = txs.filter((t) => t.type === 'income').reduce((a, t) => a + (+t.amount || 0), 0);
      const exp = txs.filter((t) => t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const dk = dayKey(now - i * 86400000);
        days.push(txs.filter((t) => dayKey(t.date || t.ts || 0) === dk && t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0));
      }
      return `<div class="dash-kv"><span>دخل هفته</span><b class="pos">＋${fa(inc)}</b></div>
        <div class="dash-kv"><span>خرج هفته</span><b class="neg">−${fa(exp)}</b></div>
        <div class="dash-kv"><span>خالص</span><b class="${inc - exp >= 0 ? 'pos' : 'neg'}">${fa(inc - exp)}</b></div>${svgSpark(days)}`;
    }
    case 'month-compare': {
      const d = new Date(); const m = d.getMonth(), y = d.getFullYear();
      const txs = load('vixora:txs', []);
      const sum = (mm, yy) => txs.filter((t) => { const x = new Date(t.date || t.ts || 0); return x.getMonth() === mm && x.getFullYear() === yy && t.type !== 'income'; }).reduce((a, t) => a + (+t.amount || 0), 0);
      const cur = sum(m, y), prev = sum((m + 11) % 12, m === 0 ? y - 1 : y);
      const diff = prev ? Math.round((cur - prev) / prev * 100) : 0;
      return `<div class="dash-kv"><span>این ماه</span><b>${fa(cur)}</b></div>
        <div class="dash-kv"><span>ماه قبل</span><b>${fa(prev)}</b></div>
        <div class="dash-big ${diff <= 0 ? 'pos' : 'neg'}">${diff > 0 ? '▲' : diff < 0 ? '▼' : '●'} ${fa(Math.abs(diff))}٪</div>${svgBars([['قبل', prev], ['حال', cur]])}`;
    }
    case 'top-days': {
      const map = {};
      load('vixora:txs', []).forEach((t) => { const k = dayKey(t.date || t.ts || 0); map[k] = (map[k] || 0) + 1; });
      const top = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 4);
      return top.length ? top.map(([k, v], i) => `<div class="dash-kv"><span>${['🥇', '🥈', '🥉', '4️⃣'][i]} ${new Date(k).toLocaleDateString('fa-IR')}</span><b>${fa(v)} ثبت</b></div>`).join('') : '<div class="dash-empty">داده‌ای نیست.</div>';
    }
    case 'cat-year': {
      const y = new Date().getFullYear();
      const map = {};
      load('vixora:txs', []).forEach((t) => { if (new Date(t.date || t.ts || 0).getFullYear() === y && t.type !== 'income') map[t.cat || 'متفرقه'] = (map[t.cat || 'متفرقه'] || 0) + (+t.amount || 0); });
      const rows = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
      return rows.length ? svgDonut(rows) : '<div class="dash-empty">تراکنشی در امسال نیست.</div>';
    }
    case 'artist-top': {
      const map = {};
      load('vixora:music-lib', load('vixora:songs', [])).forEach((s) => { const a = s.artist || 'ناشناس'; map[a] = (map[a] || 0) + 1; });
      const rows = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
      return rows.length ? svgBars(rows) : '<div class="dash-empty">آهنگی نیست.</div>';
    }
    case 'genre-pie': {
      const map = {};
      load('vixora:music-lib', load('vixora:songs', [])).forEach((s) => { const g = s.genre || 'متفرقه'; map[g] = (map[g] || 0) + 1; });
      const rows = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
      return rows.length ? svgDonut(rows) : '<div class="dash-empty">ژانری ثبت نشده.</div>';
    }
    case 'listen-week': {
      const stats = load('vixora:music-stats', {});
      const mins = Math.round((stats.seconds || 0) / 60);
      return `<div class="dash-big">${fa(mins)}<small> دقیقه کل</small></div>
        <div class="dash-kv"><span>پخش‌ها</span><b>${fa(stats.plays || 0)}</b></div>
        <button class="dash-btn xs" data-action="w-music-open">🎵 ادامه شنیدن</button>`;
    }
    case 'cust-growth': {
      const cs = load('vixora:customers', []);
      const months = [];
      for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); months.push([d.toLocaleDateString('fa-IR', { month: 'short' }), cs.filter((c) => { const x = new Date(c.ts || c.created || 0); return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear(); }).length]); }
      return months.some((m) => m[1]) ? svgBars(months) : `<div class="dash-big">${fa(cs.length)}</div><small>مشتری کل</small>`;
    }
    case 'unit-occ': {
      const buildings = load('vixora:buildings', []);
      let units = 0, occ = 0;
      buildings.forEach((b) => (b.units || []).forEach((u) => { units++; if (u.resident || u.tenant) occ++; }));
      const pct = units ? Math.round(occ / units * 100) : 0;
      return `<div class="dash-big">${fa(pct)}٪</div><div class="dash-bar"><i style="width:${pct}%"></i></div><small>${fa(occ)} از ${fa(units)} واحد پر</small>`;
    }
    case 'fun-fact2': {
      const facts = [
        () => `📝 ${fa(load('vixora:notes', []).length)} یادداشت داری — دانشنامه شخصی‌ات!`,
        () => `🎵 ${fa(load('vixora:music-lib', load('vixora:songs', [])).length)} آهنگ — کنسرت جیبی!`,
        () => `💰 ${fa(load('vixora:txs', []).length)} تراکنش ثبت شده — حسابدار درونت فعاله!`,
        () => `👥 ${fa(load('vixora:customers', []).length)} مشتری — امپراتوری‌ات رشد می‌کند!`,
        () => `🎮 ${fa((load('vixora:arcade', {}).plays || []).length)} اجرای بازی — گیمر واقعی!`,
      ];
      const f = facts[Math.floor(now / 86400000) % facts.length]();
      return `<p class="dash-fact">${f}</p><button class="dash-btn xs" data-action="w-fun2-next">🎲 یکی دیگه</button>`;
    }
    case 'quote2': {
      const q = MOTI[Math.floor(now / 3600000) % MOTI.length];
      return `<p class="dash-quote">«${q}»</p><button class="dash-btn xs" data-action="w-quote2-next">✨ جمله جدید</button>`;
    }
    case 'dice2':
      return `<div class="dash-big" data-decide>🤔</div><small>سوالت را در ذهن بگیر و بزن!</small>
        <button class="dash-btn" data-action="w-decide">🎯 تصمیم بگیر</button>`;
    case 'timer-mini':
      return `<div class="dash-big" data-timer-view>۵:۰۰</div>
        <div class="dash-row wrap"><button class="dash-btn xs" data-action="w-timer-set" data-v="60">۱m</button>
        <button class="dash-btn xs" data-action="w-timer-set" data-v="300">۵m</button>
        <button class="dash-btn xs" data-action="w-timer-set" data-v="600">۱۰m</button>
        <button class="dash-btn xs" data-action="w-timer-go">▶</button>
        <button class="dash-btn xs" data-action="w-timer-stop">⏹</button></div>`;
    case 'breathe':
      return `<div class="dash-breathe"><span>🫁</span></div><small>با دایره نفس بکش: دم… بازدم…</small>
        <button class="dash-btn xs" data-action="w-breathe-go">▶ شروع ۱ دقیقه</button>`;
    default: return '';
  }
}

let fun2Idx = 0;
let quote2Idx = 0;
let timerSecs = 300;
let timerInt = null;
let breatheInt = null;

export function afterWidgets5Render(root) {
  root.querySelectorAll('[data-action="w-fun2-next"]').forEach((b) => b.onclick = () => {
    const facts = ['📝 یادداشت‌ها دانشنامه‌ات‌اند!', '🎵 موزیک روح را تازه می‌کند!', '💰 هر ثبت مالی یک قدم به آزادی است!', '😴 خواب کافی = بهره‌وری دوبرابر!', '🚶 پیاده‌روی ۱۰ دقیقه‌ای معجزه می‌کند!'];
    fun2Idx = (fun2Idx + 1) % facts.length;
    const p = b.closest('.dash-w')?.querySelector('.dash-fact');
    if (p) p.textContent = facts[fun2Idx];
  });
  root.querySelectorAll('[data-action="w-quote2-next"]').forEach((b) => b.onclick = () => {
    quote2Idx = (quote2Idx + 1) % MOTI.length;
    const p = b.closest('.dash-w')?.querySelector('.dash-quote');
    if (p) p.textContent = `«${MOTI[quote2Idx]}»`;
  });
}

export async function handleWidgets5Action(action, el, api) {
  const root = el?.closest?.('.dash-root') || document;
  switch (action) {
    case 'w-fun2-next': case 'w-quote2-next': return true; // handled by onclick
    case 'w-decide': {
      const opts = ['✅ بله، حتماً!', '❌ نه، بی‌خیال!', '🤔 شاید بعداً…', '🔥 همین حالا!', '⏳ صبر کن', '🎲 دوباره بنداز!'];
      const v = root.querySelector('[data-decide]');
      if (v) {
        v.textContent = '🎲';
        setTimeout(() => { v.textContent = opts[Math.floor(Math.random() * opts.length)]; }, 500);
      }
      return true;
    }
    case 'w-timer-set': timerSecs = +(el?.dataset?.v || 300); {
      const v = root.querySelector('[data-timer-view]');
      if (v) v.textContent = `${Math.floor(timerSecs / 60)}:${String(timerSecs % 60).padStart(2, '0')}`;
      return true;
    }
    case 'w-timer-go': {
      clearInterval(timerInt);
      let left = timerSecs;
      const v = root.querySelector('[data-timer-view]');
      timerInt = setInterval(() => {
        left--;
        if (v) { v.textContent = `${Math.floor(Math.max(0, left) / 60)}:${String(Math.max(0, left) % 60).padStart(2, '0')}`; }
        if (left <= 0) {
          clearInterval(timerInt);
          showToastLocal('⏲ تایمر تمام شد!');
        }
      }, 1000);
      return true;
    }
    case 'w-timer-stop': clearInterval(timerInt); return true;
    case 'w-breathe-go': {
      const c = root.querySelector('.dash-breathe');
      if (c) {
        c.classList.add('on');
        showToastLocal('۱ دقیقه نفس عمیق… 🫁');
        clearTimeout(breatheInt);
        breatheInt = setTimeout(() => c.classList.remove('on'), 60000);
      }
      return true;
    }
    default: return false;
  }
}
function showToastLocal(m) {
  import('./dash-notify.js').then((mod) => mod.showToast(m, '🫁')).catch(() => {});
}
