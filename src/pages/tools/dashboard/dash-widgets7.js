// 🧩 ViXoRa Widgets 7 — سری هفتم: تمرکز، تقویم، عادت، سلامتی، فان
// src/pages/tools/dashboard/dash-widgets7.js
import { esc, load } from './dash-state.js';
import { svgBars, svgDonut, svgSpark } from './dash-charts.js';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const dk = (ts) => new Date(ts).toDateString();
const faD = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

export const WIDGETS_META_7 = {
  'focus-mini': { title: 'اتاق تمرکز', icon: '🧘', desc: 'ورود به دیپ‌ورک', w: 1 },
  'cal-mini': { title: 'امروز در تقویم', icon: '📅', desc: 'رویدادهای امروز', w: 1 },
  'habit-mini': { title: 'عادت امروز', icon: '🔥', desc: 'تیک سریع', w: 1 },
  'journal-streak': { title: 'زنجیره ژورنال', icon: '⛓', desc: 'روزهای پشت‌سرهم', w: 1 },
  'sleep-log': { title: 'خواب دیشب', icon: '🛌', desc: 'ثبت ساعت خواب', w: 1 },
  'weight': { title: 'وزن', icon: '⚖️', desc: 'نمودار وزن', w: 1 },
  'sport-week': { title: 'ورزش هفته', icon: '🏋', desc: 'جلسات ۷ روز', w: 1 },
  'reading-goal': { title: 'هدف مطالعه سال', icon: '📖', desc: 'چند کتاب امسال؟', w: 1 },
  'no-spend': { title: 'روز بدون خرج', icon: '🚫', desc: 'زنجیره صرفه‌جویی', w: 1 },
  'bill-total': { title: 'قبض‌های ماه', icon: '🧾', desc: 'جمع سررسیدها', w: 1 },
  'sub-audit': { title: 'ممیزی اشتراک', icon: '🔍', desc: 'الگوهای تکراری', w: 1 },
  'word-day': { title: 'کلمه روز', icon: '🔤', desc: 'لغت انگلیسی', w: 1 },
  'riddle': { title: 'معمای امروز', icon: '🧩', desc: 'بشکن مغزت را!', w: 1 },
  'compliment': { title: 'تعریف امروز', icon: '💝', desc: 'حال‌خوب‌کن', w: 1 },
  'countdown2': { title: 'شمارش تا عید', icon: '🎆', desc: 'نوروز بعدی', w: 1 },
};

const WORDS = [['Serendipity', 'سِرِندپیتی', 'پیدا کردن چیز خوب بدون جستجو'], ['Petrichor', 'پتریکور', 'بوی خاک بعد از باران'], ['Ubuntu', 'اوبونتو', 'من هستم چون ما هستیم'], ['Hygge', 'هوگه', 'لذت دنج دانمارکی'], ['Wanderlust', 'واندرلاست', 'عشق سیاحت'], ['Resilience', 'رزیلینس', 'تاب‌آوری'], ['Mindfulness', 'مایندفولنس', 'ذهن‌آگاهی'], ['Ephemeral', 'افمرال', 'گذرا و زودگذر']];
const RIDDLES = [['آن چیست که هرچه بیشتر برداری بزرگ‌تر می‌شود؟', 'گودال! 🕳'], ['چه چیزی بالا می‌رود ولی هرگز پایین نمی‌آید؟', 'سن! 🎂'], ['من همیشه می‌آیم ولی هرگز نمی‌رسم. کی‌ام؟', 'فردا! 📆'], ['چه کلیدی در هیچ قفلی نمی‌رود؟', 'کلید موسیقی! 🎹'], ['آن چیست که مال توست ولی دیگران بیشتر از آن استفاده می‌کنند؟', 'اسمت! 📛']];
const COMPS = ['امروز فوق‌العاده‌ای! ✨', 'لبخندت دنیا را بهتر می‌کند 😊', 'تو از چیزی که فکر می‌کنی قوی‌تری 💪', 'ایده‌هات ارزشمندن 💡', 'حضورت نعمته 🙏', 'داری عالی پیش می‌روی! 🚀'];

export function renderWidgets7(id) {
  const now = Date.now();
  switch (id) {
    case 'focus-mini': {
      const log = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]');
      const mins = log.filter((p) => dk(p.ts) === dk(now)).reduce((a, p) => a + (p.min || 25), 0);
      return `<div class="dash-big">🍅 ${fa(mins)}<small> دقیقه امروز</small></div>
        <button class="dash-btn dash-btn-primary" data-action="view" data-v="focus">🧘 ورود به اتاق تمرکز</button>`;
    }
    case 'cal-mini': {
      const t = dk(now);
      const bills = load('vixora:bills', []).filter((b) => !b.paid && b.due && dk(new Date(b.due)) === t);
      const txs = load('vixora:txs', []).filter((x) => dk(x.date || x.ts || 0) === t).length;
      return bills.length ? bills.slice(0, 3).map((b) => `<div class="dash-kv"><span>💡 ${esc(b.title || '')}</span><b>${fa(b.amount)}</b></div>`).join('')
        + `<button class="dash-btn xs" data-action="view" data-v="calendar">📅 تقویم کامل</button>`
        : `<div class="dash-big">☁️</div><small>امروز سررسیدی نیست • ${fa(txs)} تراکنش</small><div><button class="dash-btn xs" data-action="view" data-v="calendar">📅 تقویم</button></div>`;
    }
    case 'habit-mini': {
      const hs = load('ViXoRa:dash-habits', []);
      const t = dk(now);
      const done = hs.filter((h) => (h.log || []).some((x) => dk(x) === t)).length;
      return `<div class="dash-big">${fa(done)}<small>/ ${fa(hs.length)}</small></div>
        <div class="dash-bar"><i style="width:${hs.length ? done / hs.length * 100 : 0}%"></i></div>
        <button class="dash-btn xs" data-action="view" data-v="habits" style="margin-top:6px">🔥 اتاق عادت‌ها</button>`;
    }
    case 'journal-streak': {
      const j = load('vixora:journal', {});
      let s = 0;
      const d = new Date();
      const k = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
      if (!j[k(d)]) d.setDate(d.getDate() - 1);
      while (j[k(d)]) { s++; d.setDate(d.getDate() - 1); }
      return `<div class="dash-big">⛓ ${fa(s)}<small> روز</small></div>
        <button class="dash-btn xs" data-action="view" data-v="journal">📓 ادامه زنجیره</button>`;
    }
    case 'sleep-log': {
      const arr = JSON.parse(localStorage.getItem('vixora:sleep') || '[]');
      const last = arr[arr.length - 1];
      const avg = arr.length ? (arr.slice(-7).reduce((a, x) => a + (+x.h || 0), 0) / Math.min(7, arr.length)).toFixed(1) : '—';
      return `<div class="dash-row"><input class="dash-input" data-sleep-h type="number" min="1" max="16" placeholder="ساعت…" style="margin:0;width:90px"><button class="dash-btn xs" data-action="w7-sleep">🛌 ثبت</button></div>
        <small>دیشب: ${last ? fa(last.h) + ' ساعت' : '—'} • میانگین هفته: ${faD(avg)}</small>
        ${arr.length > 1 ? svgSpark(arr.slice(-14).map((x) => +x.h || 0), 140, 32) : ''}`;
    }
    case 'weight': {
      const arr = JSON.parse(localStorage.getItem('vixora:weight') || '[]');
      const last = arr[arr.length - 1];
      return `<div class="dash-row"><input class="dash-input" data-wt-v type="number" placeholder="کیلو…" style="margin:0;width:90px"><button class="dash-btn xs" data-action="w7-weight">⚖️ ثبت</button></div>
        <small>آخرین: ${last ? fa(last.v) + ' kg' : '—'}</small>
        ${arr.length > 1 ? svgSpark(arr.slice(-20).map((x) => +x.v || 0), 140, 32) : ''}`;
    }
    case 'sport-week': {
      const arr = JSON.parse(localStorage.getItem('vixora:sport') || '[]');
      const week = arr.filter((x) => now - x < 7 * 86400000).length;
      return `<div class="dash-big">🏋 ${fa(week)}<small>/۳ جلسه</small></div>
        <div class="dash-bar"><i style="width:${Math.min(100, week / 3 * 100)}%"></i></div>
        <button class="dash-btn xs" data-action="w7-sport" style="margin-top:6px">＋ جلسه امروز</button>`;
    }
    case 'reading-goal': {
      const g = JSON.parse(localStorage.getItem('vixora:readgoal') || '{"target":12,"done":0}');
      return `<div class="dash-big">📖 ${fa(g.done)}<small>/ ${fa(g.target)}</small></div>
        <div class="dash-bar"><i style="width:${g.target ? Math.min(100, g.done / g.target * 100) : 0}%"></i></div>
        <div class="dash-row" style="margin-top:6px"><button class="dash-btn xs" data-action="w7-read" data-v="1">＋ کتاب</button><button class="dash-btn xs" data-action="w7-read" data-v="t">🎯 هدف</button></div>`;
    }
    case 'no-spend': {
      const txs = load('vixora:txs', []);
      const spentDays = new Set(txs.filter((t) => t.type !== 'income').map((t) => dk(t.date || t.ts || 0)));
      let s = 0;
      const d = new Date();
      if (spentDays.has(dk(d))) s = 0;
      else { while (!spentDays.has(dk(d))) { s++; d.setDate(d.getDate() - 1); if (s > 365) break; } }
      return `<div class="dash-big">🚫 ${fa(s)}<small> روز</small></div><small>بدون خرج پشت‌سرهم — رکوردت را بزن!</small>`;
    }
    case 'bill-total': {
      const m = new Date().getMonth(), y = new Date().getFullYear();
      const bills = load('vixora:bills', []).filter((b) => { const d = new Date(b.due || 0); return d.getMonth() === m && d.getFullYear() === y; });
      const unpaid = bills.filter((b) => !b.paid).reduce((a, b) => a + (+b.amount || 0), 0);
      return `<div class="dash-kv"><span>قبض‌های این ماه</span><b>${fa(bills.length)}</b></div>
        <div class="dash-kv"><span>پرداخت‌نشده</span><b class="neg">${fa(unpaid)}</b></div>
        <button class="dash-btn xs" data-action="go" data-link="/tools/invoices">💰 پرداخت ↗</button>`;
    }
    case 'sub-audit': {
      const map = {};
      load('vixora:txs', []).forEach((t) => {
        const k = (t.note || t.desc || '').trim();
        if (k.length > 2 && t.type !== 'income') map[k] = (map[k] || 0) + 1;
      });
      const rows = Object.entries(map).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 4);
      return rows.length ? rows.map(([k, c]) => `<div class="dash-kv"><span>🔁 ${esc(k.slice(0, 24))}</span><b>×${fa(c)}</b></div>`).join('') + '<small>💡 این‌ها را لغو کنی، پول نجات می‌دهی!</small>'
        : '<div class="dash-empty">الگوی تکراری (۳+ بار) پیدا نشد. 👍</div>';
    }
    case 'word-day': {
      const w = WORDS[Math.floor(now / 86400000) % WORDS.length];
      return `<div class="dash-big" style="font-size:22px">${w[0]}</div><b>${w[1]}</b><small>${w[2]}</small>`;
    }
    case 'riddle': {
      const r = RIDDLES[Math.floor(now / 86400000) % RIDDLES.length];
      return `<p class="dash-fact">🧩 ${r[0]}</p><button class="dash-btn xs" data-action="w7-riddle" data-v="${esc(r[1])}">👁 دیدن جواب</button>`;
    }
    case 'compliment': {
      const c = COMPS[Math.floor(now / 86400000) % COMPS.length];
      return `<p class="dash-quote">💝 ${c}</p>`;
    }
    case 'countdown2': {
      const nowD = new Date();
      let target = new Date(nowD.getFullYear(), 2, 21);
      if (target < nowD) target = new Date(nowD.getFullYear() + 1, 2, 21);
      const days = Math.ceil((target - nowD) / 86400000);
      return `<div class="dash-big">🎆 ${fa(days)}<small> روز تا نوروز</small></div><small>امسال را بترکون! 💪</small>`;
    }
    default: return '';
  }
}

export function afterWidgets7Render() {}

export async function handleWidgets7Action(action, el, api) {
  switch (action) {
    case 'w7-sleep': {
      const scope = el.closest('section') || api.root;
      const h = +(scope.querySelector('[data-sleep-h]')?.value || 0);
      if (!h) { api.toast('چند ساعت خوابیدی؟'); return true; }
      const arr = JSON.parse(localStorage.getItem('vixora:sleep') || '[]');
      arr.push({ ts: Date.now(), h });
      localStorage.setItem('vixora:sleep', JSON.stringify(arr.slice(-90)));
      api.toast(h >= 7 ? '🛌 عالی! خواب کافی.' : '🛌 کم خوابیدی! امشب زودتر بخواب.');
      api.rerender(); return true;
    }
    case 'w7-weight': {
      const scope = el.closest('section') || api.root;
      const v = +(scope.querySelector('[data-wt-v]')?.value || 0);
      if (!v) return true;
      const arr = JSON.parse(localStorage.getItem('vixora:weight') || '[]');
      arr.push({ ts: Date.now(), v });
      localStorage.setItem('vixora:weight', JSON.stringify(arr.slice(-180)));
      api.toast('⚖️ ثبت شد.');
      api.rerender(); return true;
    }
    case 'w7-sport': {
      const arr = JSON.parse(localStorage.getItem('vixora:sport') || '[]');
      arr.push(Date.now());
      localStorage.setItem('vixora:sport', JSON.stringify(arr.slice(-100)));
      api.toast('🏋 آفرین! ورزش ثبت شد.');
      api.rerender(); return true;
    }
    case 'w7-read': {
      const g = JSON.parse(localStorage.getItem('vixora:readgoal') || '{"target":12,"done":0}');
      if (el.dataset?.v === 't') {
        const t = prompt('🎯 هدف امسال (چند کتاب)؟', String(g.target));
        if (t && +t > 0) g.target = +t;
      } else {
        g.done++;
        if (g.done >= g.target) api.toast('🎉 به هدف مطالعه سال رسیدی!');
        else api.toast('📖 یک کتاب دیگر تمام شد!');
      }
      localStorage.setItem('vixora:readgoal', JSON.stringify(g));
      api.rerender(); return true;
    }
    case 'w7-riddle': api.toast(el.dataset?.v || '؟'); return true;
    default: return false;
  }
}
