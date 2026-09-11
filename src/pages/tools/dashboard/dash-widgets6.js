// 🧩 ViXoRa Widgets 6 — سری ششم: ژورنال، ریموت، بهره‌وری+، سرگرمی+
// src/pages/tools/dashboard/dash-widgets6.js
import { esc, load } from './dash-state.js';
import { svgBars, svgDonut, svgSpark } from './dash-charts.js';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const dayKey = (ts) => new Date(ts).toDateString();
const faD = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

export const WIDGETS_META_6 = {
  'journal-mini': { title: 'ژورنال امروز', icon: '📓', desc: 'حال + نوشتن سریع', w: 1 },
  'remote-mini': { title: 'ریموت سریع', icon: '🎛', desc: 'پخش/مکث/بعدی', w: 1 },
  'eq-mini': { title: 'اکولایزر سریع', icon: '🎚', desc: 'پریست یک‌کلیکی', w: 1 },
  'sleep-mini': { title: 'خواب سریع', icon: '😴', desc: 'تایمر ۱۵/۳۰', w: 1 },
  'grade-week': { title: 'کارنامه هفته', icon: '🎓', desc: 'نمره ۷ روز', w: 1 },
  'money-mood': { title: 'حال و خرج', icon: '💸', desc: 'رابطه حال و خرید', w: 1 },
  'debt-free': { title: 'روز آزادی بدهی', icon: '🕊', desc: 'شمارش تا صفر شدن', w: 1 },
  'save-rate': { title: 'نرخ پس‌انداز', icon: '🏦', desc: 'درصد ماه', w: 1 },
  'note-tags': { title: 'برچسب‌ها', icon: '🏷', desc: 'ابر برچسب یادداشت', w: 1 },
  'cust-top': { title: 'مشتریان VIP', icon: '👑', desc: 'پرتراکنش‌ترین‌ها', w: 1 },
  'task-due': { title: 'کارهای امروز', icon: '✅', desc: 'چک‌لیست روزانه', w: 1 },
  'water': { title: 'آب روزانه', icon: '💧', desc: '۸ لیوان', w: 1 },
  'book-now': { title: 'کتاب فعلی', icon: '📚', desc: 'پیشرفت مطالعه', w: 1 },
  'steps': { title: 'قدم‌ها', icon: '👟', desc: 'هدف ۸ هزار', w: 1 },
  'lucky': { title: 'عدد شانس', icon: '🍀', desc: 'شانس روزانه', w: 1 },
};

export function renderWidgets6(id) {
  const now = Date.now();
  switch (id) {
    case 'journal-mini': {
      const d = new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const e = (load('vixora:journal', {})[key]) || {};
      return `<div class="dash-row">${['😞', '😐', '🙂', '🤩'].map((m, i) => `<button class="dash-btn xs ${String(e.mood) === String(i + 2) ? 'dash-btn-primary' : ''}" data-action="w6-mood" data-v="${i + 2}">${m}</button>`).join('')}</div>
        <button class="dash-btn xs" data-action="view" data-v="journal" style="margin-top:6px">📓 ژورنال کامل</button>
        <small>${e.text ? '✅ امروز نوشته‌ای!' : 'هنوز ننوشتی…'}</small>`;
    }
    case 'remote-mini':
      return `<div class="dash-row"><button class="dash-btn xs" data-action="r-prev">⏮</button>
        <button class="dash-btn dash-btn-primary" data-action="r-toggle">⏯</button>
        <button class="dash-btn xs" data-action="r-next">⏭</button>
        <button class="dash-btn xs" data-action="view" data-v="remote">🎛</button></div>
        <small data-r="mini-song">—</small>`;
    case 'eq-mini':
      return `<div class="dash-row wrap">${[['flat', '⬜'], ['pop', '🎤'], ['rock', '🎸'], ['bass', '🥁'], ['jazz', '🎷']].map(([v, t]) => `<button class="dash-btn xs" data-action="r-eq" data-v="${v}">${t}</button>`).join('')}</div>`;
    case 'sleep-mini':
      return `<div class="dash-row wrap"><button class="dash-btn xs" data-action="r-sleep" data-v="15">۱۵m</button>
        <button class="dash-btn xs" data-action="r-sleep" data-v="30">۳۰m</button>
        <button class="dash-btn xs" data-action="r-sleep" data-v="track">🎵</button>
        <button class="dash-btn xs" data-action="r-sleep" data-v="off">لغو</button></div>`;
    case 'grade-week': {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const dk = dayKey(now - i * 86400000);
        const tx = load('vixora:txs', []).filter((t) => dayKey(t.date || t.ts || 0) === dk).length;
        const no = load('vixora:notes', []).filter((n) => dayKey(n.ts || 0) === dk).length;
        days.push(Math.min(100, tx * 20 + no * 15));
      }
      const avg = Math.round(days.reduce((a, b) => a + b, 0) / 7);
      const g = avg >= 80 ? 'A' : avg >= 60 ? 'B' : avg >= 40 ? 'C' : 'D';
      return `<div class="dash-big">${g}<small> میانگین ${fa(avg)}</small></div>${svgSpark(days, 140, 36)}`;
    }
    case 'money-mood': {
      const moods = load('vixora:mood', []);
      const last = moods[moods.length - 1];
      const dk = dayKey(now);
      const spent = load('vixora:txs', []).filter((t) => dayKey(t.date || t.ts || 0) === dk && t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
      return `<div class="dash-kv"><span>حال امروز</span><b>${last ? last.mood || last.v || '—' : 'ثبت نشده'}</b></div>
        <div class="dash-kv"><span>خرج امروز</span><b>${fa(spent)}</b></div>
        <small>💡 وقتی حالت خوب نیست، خرید احساسی نکن!</small>`;
    }
    case 'debt-free': {
      const debts = load('vixora:debts', []);
      const total = debts.reduce((a, d) => a + (+(d.remaining ?? d.amount ?? 0) || 0), 0);
      const m = new Date().getMonth();
      const paid = load('vixora:txs', []).filter((t) => new Date(t.date || t.ts || 0).getMonth() === m && /debt|بدهی|قرض|وام/i.test(`${t.cat || ''} ${t.note || ''}`)).reduce((a, t) => a + (+t.amount || 0), 0);
      const months = paid > 0 ? Math.ceil(total / paid) : 0;
      return total <= 0 ? `<div class="dash-big">🕊</div><small>بدهی نداری! آزادی! 🎉</small>`
        : `<div class="dash-big">${fa(months)}<small> ماه تا آزادی</small></div><div class="dash-bar"><i style="width:${Math.min(100, paid / Math.max(1, total) * 100 * 3)}%"></i></div><small>مانده: ${fa(total)}</small>`;
    }
    case 'save-rate': {
      const m = new Date().getMonth(), y = new Date().getFullYear();
      const txs = load('vixora:txs', []).filter((t) => { const d = new Date(t.date || t.ts || 0); return d.getMonth() === m && d.getFullYear() === y; });
      const inc = txs.filter((t) => t.type === 'income').reduce((a, t) => a + (+t.amount || 0), 0);
      const exp = txs.filter((t) => t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
      const r = inc > 0 ? Math.round((inc - exp) / inc * 100) : 0;
      return `<div class="dash-big ${r >= 20 ? 'pos' : r >= 0 ? '' : 'neg'}">${fa(r)}٪</div>
        <div class="dash-bar"><i style="width:${Math.max(0, Math.min(100, r))}%"></i></div><small>هدف سالم: بالای ۲۰٪ 🎯</small>`;
    }
    case 'note-tags': {
      const map = {};
      load('vixora:notes', []).forEach((n) => {
        const tags = n.text?.match(/#[\w\u0600-\u06FF]+/g) || [];
        tags.forEach((t) => { map[t] = (map[t] || 0) + 1; });
      });
      const rows = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
      return rows.length ? `<div class="dash-row wrap">${rows.map(([t, c]) => `<span class="dash-chip">${esc(t)} ×${fa(c)}</span>`).join('')}</div>`
        : '<div class="dash-empty">برچسبی نیست. در یادداشت‌ها از #تگ استفاده کن!</div>';
    }
    case 'cust-top': {
      const cs = load('vixora:customers', []).slice(0, 4);
      return cs.length ? cs.map((c, i) => `<div class="dash-kv"><span>${['👑', '🥈', '🥉', '4️⃣'][i]} ${esc(c.name || 'بی‌نام')}</span><b>${esc(c.phone || '')}</b></div>`).join('')
        : '<div class="dash-empty">مشتری نیست.</div>';
    }
    case 'task-due': {
      const key = 'vixora:tasks-' + dayKey(now);
      let tasks = [];
      try { tasks = JSON.parse(localStorage.getItem(key)) || []; } catch {}
      return `<div class="dash-row"><input class="dash-input" data-task-in placeholder="کار جدید… (Enter)"><button class="dash-btn xs" data-action="w6-task-add">＋</button></div>
        <div>${tasks.map((t, i) => `<div class="dash-kv"><span>${t.done ? '✅' : '⬜'} ${esc(t.text)}</span><span class="dash-row"><button class="dash-icon-btn" data-action="w6-task-t" data-v="${i}">${t.done ? '↩' : '✓'}</button><button class="dash-icon-btn" data-action="w6-task-d" data-v="${i}">✕</button></span></div>`).join('') || '<div class="dash-empty">کاری نیست. روز آرومیه! ☁️</div>'}</div>`;
    }
    case 'water': {
      const key = 'vixora:water-' + dayKey(now);
      const n = +(localStorage.getItem(key) || 0);
      return `<div class="dash-big">${'💧'.repeat(Math.min(8, n)) || '🥛'}<small> ${fa(n)}/۸</small></div>
        <div class="dash-bar"><i style="width:${Math.min(100, n / 8 * 100)}%"></i></div>
        <div class="dash-row" style="margin-top:6px"><button class="dash-btn xs" data-action="w6-water" data-v="1">＋ لیوان</button><button class="dash-btn xs" data-action="w6-water" data-v="0">↺ ریست</button></div>`;
    }
    case 'book-now': {
      let b = {};
      try { b = JSON.parse(localStorage.getItem('vixora:book') || '{}'); } catch {}
      if (!b.title) return `<input class="dash-input" data-book-t placeholder="نام کتاب…"><div class="dash-row" style="margin-top:6px"><input class="dash-input" data-book-p type="number" placeholder="صفحات" style="width:90px"><button class="dash-btn xs" data-action="w6-book-set">📚 شروع</button></div>`;
      const pct = b.pages ? Math.round((b.read || 0) / b.pages * 100) : 0;
      return `<b>📖 ${esc(b.title)}</b><div class="dash-big">${fa(pct)}٪</div>
        <div class="dash-bar"><i style="width:${pct}%"></i></div>
        <small>${fa(b.read || 0)} از ${fa(b.pages || 0)} صفحه</small>
        <div class="dash-row" style="margin-top:6px"><button class="dash-btn xs" data-action="w6-book" data-v="10">＋۱۰</button><button class="dash-btn xs" data-action="w6-book" data-v="1">＋۱</button><button class="dash-btn xs danger" data-action="w6-book-new">📕 کتاب جدید</button></div>`;
    }
    case 'steps': {
      const n = +(localStorage.getItem('vixora:steps-' + dayKey(now)) || 0);
      return `<div class="dash-big">👟 ${fa(n)}<small>/۸٬۰۰۰</small></div>
        <div class="dash-bar"><i style="width:${Math.min(100, n / 8000 * 100)}%"></i></div>
        <div class="dash-row" style="margin-top:6px"><button class="dash-btn xs" data-action="w6-steps" data-v="500">＋۵۰۰</button><button class="dash-btn xs" data-action="w6-steps" data-v="1000">＋۱۰۰۰</button></div>`;
    }
    case 'lucky': {
      const seed = Math.floor(now / 86400000);
      const num = (seed * 9301 + 49297) % 100;
      const colors = ['قرمز ❤️', 'آبی 💙', 'سبز 💚', 'طلایی 💛', 'بنفش 💜'];
      return `<div class="dash-big">🍀 ${fa(num)}</div><small>رنگ امروز: ${colors[seed % colors.length]}</small>
        <small>«${['امروز روز توئه!', 'یک خبر خوب در راهه.', 'ریسک کوچیک بکن!', 'به دوستت زنگ بزن.', 'استراحت هم کاره.'][seed % 5]}»</small>`;
    }
    default: return '';
  }
}

export function afterWidgets6Render() { /* بدون نیاز */ }

export async function handleWidgets6Action(action, el, api) {
  const dk = dayKey(Date.now());
  switch (action) {
    case 'w6-mood': {
      const { saveEntry, dayStr } = await import('./dash-journal.js');
      saveEntry(dayStr(), { mood: el.dataset?.v });
      api.toast('😊 حالت ثبت شد.');
      api.rerender(); return true;
    }
    case 'w6-task-add': {
      const scope = el.closest('.dash-w-body') || el.closest('section') || api.root;
      const inp = scope.querySelector('[data-task-in]');
      const t = inp?.value.trim();
      if (!t) { api.toast('متن کار را بنویس!'); return true; }
      const key = 'vixora:tasks-' + dk;
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.push({ text: t, done: false });
      localStorage.setItem(key, JSON.stringify(arr));
      api.rerender(); return true;
    }
    case 'w6-task-t': case 'w6-task-d': {
      const key = 'vixora:tasks-' + dk;
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      const i = +(el.dataset?.v || 0);
      if (action === 'w6-task-t' && arr[i]) arr[i].done = !arr[i].done;
      else arr.splice(i, 1);
      localStorage.setItem(key, JSON.stringify(arr));
      api.rerender(); return true;
    }
    case 'w6-water': {
      const key = 'vixora:water-' + dk;
      if (el.dataset?.v === '0') localStorage.removeItem(key);
      else localStorage.setItem(key, String(+(localStorage.getItem(key) || 0) + 1));
      api.rerender(); return true;
    }
    case 'w6-book-set': {
      const scope = el.closest('.dash-w-body') || el.closest('section') || api.root;
      const t = scope.querySelector('[data-book-t]')?.value.trim();
      const p = +(scope.querySelector('[data-book-p]')?.value || 0);
      if (!t) { api.toast('نام کتاب؟'); return true; }
      localStorage.setItem('vixora:book', JSON.stringify({ title: t, pages: p || 100, read: 0 }));
      api.rerender(); return true;
    }
    case 'w6-book': {
      const b = JSON.parse(localStorage.getItem('vixora:book') || '{}');
      b.read = Math.min(b.pages || 9999, (b.read || 0) + (+(el.dataset?.v || 1)));
      localStorage.setItem('vixora:book', JSON.stringify(b));
      if (b.read >= b.pages) api.toast('🎉 کتاب تمام شد! آفرین!');
      api.rerender(); return true;
    }
    case 'w6-book-new': localStorage.removeItem('vixora:book'); api.rerender(); return true;
    case 'w6-steps': {
      const key = 'vixora:steps-' + dk;
      const n = +(localStorage.getItem(key) || 0) + (+(el.dataset?.v || 500));
      localStorage.setItem(key, String(n));
      if (n >= 8000) api.toast('🏆 به ۸ هزار قدم رسیدی!');
      api.rerender(); return true;
    }
    default: return false;
  }
}
