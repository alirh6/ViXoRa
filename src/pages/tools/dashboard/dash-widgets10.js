// 🧩 ViXoRa Widgets 10 — سری دهم: جمع‌بندی، رکوردها، متا
// src/pages/tools/dashboard/dash-widgets10.js
import { esc, load } from './dash-state.js';
import { svgBars, svgDonut, svgSpark } from './dash-charts.js';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const dk = (ts) => new Date(ts).toDateString();

export const WIDGETS_META_10 = {
  'records': { title: 'تابلوی رکوردها', icon: '🏅', desc: 'بهترین‌های تو', w: 1 },
  'tool-balance': { title: 'تعادل ابزارها', icon: '⚖️', desc: 'کدام ابزار خواب است؟', w: 1 },
  'week-grade2': { title: 'نمره هفته', icon: '💯', desc: 'زنده از گزارش', w: 1 },
  'month-progress': { title: 'پیشرفت ماه', icon: '🗓', desc: 'چند درصد گذشت؟', w: 1 },
  'year-progress': { title: 'پیشرفت سال', icon: '🎆', desc: 'سال چقدر رفت؟', w: 1 },
  'backup-age': { title: 'عمر بکاپ', icon: '🛟', desc: 'آخرین بکاپ کی بود؟', w: 1 },
  'storage-bar': { title: 'حافظه', icon: '💾', desc: 'مصرف سریع', w: 1 },
  'cmdk-hint': { title: 'نکته فرمان‌یاب', icon: '⌨️', desc: 'دستور تصادفی', w: 1 },
  'recipe-day': { title: 'دستورپخت روز', icon: '🍳', desc: 'پیشنهاد روزانه', w: 1 },
  'gloss-day': { title: 'واژه روز', icon: '📚', desc: 'یادگیری روزانه', w: 1 },
  'music-quiz': { title: 'کوییز موزیک', icon: '🎤', desc: 'حدس خواننده!', w: 1 },
  'math-duel': { title: 'دوئل ریاضی', icon: '🔢', desc: '۱۰ ثانیه، ۱ سؤال', w: 1 },
  'memory-plus': { title: 'تقویت حافظه', icon: '🧠', desc: 'حفظ کن!', w: 1 },
  'typing-tester': { title: 'تست تایپ', icon: '⌨️', desc: 'سرعتت چقدره؟', w: 1 },
  'appreciate': { title: 'قدردانی', icon: '💜', desc: 'از علی تشکر کن!', w: 1 },
};

const CMDK_TIPS = ['«بازی تصادفی» را امتحان کن! 🎮', 'عبارت ریاضی بنویس، جواب می‌گیری! 🧮', '«هدف سریع» یک هدف هفته می‌سازد 🏁', '«تم بعدی» با یک Enter! 🎨', '«بکاپ فوری» ۱۰ ثانیه! 🛟', 'نام خواننده را تایپ کن؟ (به‌زودی!) 🎤', '«تیک اولین عادت» صبح‌ها! ✅', '«شروع پومودورو» بدون موس! 🍅'];

export function renderWidgets10(id) {
  const now = Date.now();
  switch (id) {
    case 'records': {
      const recs = [];
      const txs = load('vixora:txs', []);
      if (txs.length) {
        const top = txs.filter((t) => t.type !== 'income').sort((a, b) => b.amount - a.amount)[0];
        if (top) recs.push(['💸 بزرگ‌ترین خرید', `${fa(top.amount)} (${(top.note || '').slice(0, 20)})`]);
      }
      const txDays = new Set(txs.map((t) => dk(t.date || t.ts || 0)));
      let s = 0; const d = new Date();
      if (!txDays.has(dk(d))) d.setDate(d.getDate() - 1);
      while (txDays.has(dk(d))) { s++; d.setDate(d.getDate() - 1); }
      recs.push(['🔥 زنجیره ثبت', `${fa(s)} روز`]);
      const songs = load('vixora:music-lib', load('vixora:songs', []));
      recs.push(['🎵 آهنگ‌ها', fa(songs.length)]);
      recs.push(['📝 یادداشت‌ها', fa(load('vixora:notes', []).length)]);
      recs.push(['📓 روزهای ژورنال', fa(Object.keys(load('vixora:journal', {})).length)]);
      return recs.map(([k, v]) => `<div class="dash-kv"><span>${k}</span><b>${v}</b></div>`).join('');
    }
    case 'tool-balance': {
      const week = now - 7 * 86400000;
      const rows = [
        ['📝', load('vixora:notes', []).filter((n) => (n.ts || 0) >= week).length],
        ['🎵', load('vixora:music-lib', load('vixora:songs', [])).length ? 1 : 0],
        ['💰', load('vixora:txs', []).filter((t) => (t.date || t.ts || 0) >= week).length],
        ['👥', load('vixora:customers', []).length ? 1 : 0],
        ['📓', Object.keys(load('vixora:journal', {})).filter((k) => new Date(k + 'T12:00:00').getTime() >= week).length],
        ['🔥', load('ViXoRa:dash-habits', []).filter((h) => (h.log || []).some((t) => dk(t) === dk(now))).length],
      ];
      return svgBars(rows);
    }
    case 'week-grade2': {
      const week = now - 7 * 86400000;
      let sc = 50;
      const txs = load('vixora:txs', []).filter((t) => (t.date || t.ts || 0) >= week);
      if (txs.length >= 5) sc += 10;
      if (load('vixora:notes', []).filter((n) => (n.ts || 0) >= week).length >= 3) sc += 10;
      if (Object.keys(load('vixora:journal', {})).filter((k) => new Date(k + 'T12:00:00').getTime() >= week).length >= 3) sc += 10;
      if (JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]').filter((p) => p.ts >= week).length >= 2) sc += 10;
      sc = Math.min(100, sc);
      const g = sc >= 85 ? '🌟' : sc >= 70 ? '✅' : sc >= 55 ? '🙂' : '🌱';
      return `<div class="dash-big">${g} ${fa(sc)}</div><div class="dash-bar"><i style="width:${sc}%"></i></div>
        <button class="dash-btn xs" data-action="view" data-v="report" style="margin-top:6px">📰 گزارش کامل</button>`;
    }
    case 'month-progress': {
      const d = new Date();
      const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const p = Math.round(d.getDate() / dim * 100);
      return `<div class="dash-big">🗓 ${fa(p)}٪</div><div class="dash-bar"><i style="width:${p}%"></i></div><small>${fa(dim - d.getDate())} روز مانده — بودجه‌ات را چک کن!</small>`;
    }
    case 'year-progress': {
      const d = new Date();
      const start = new Date(d.getFullYear(), 0, 1);
      const p = Math.round((d - start) / (365 * 86400000) * 100);
      return `<div class="dash-big">🎆 ${fa(p)}٪</div><div class="dash-bar"><i style="width:${Math.min(100, p)}%"></i></div><small>سال ${d.getFullYear()} — هدف‌هایت کجان؟ 🎯</small>`;
    }
    case 'backup-age': {
      const last = +(localStorage.getItem('vixora:backup-last') || 0);
      const days = last ? Math.floor((now - last) / 86400000) : 999;
      return `<div class="dash-big ${days > 7 ? 'neg' : 'pos'}">🛟 ${days > 900 ? 'هرگز!' : fa(days) + ' روز پیش'}</div>
        <button class="dash-btn xs" data-action="w-xp-backup">بکاپ الان!</button>`;
    }
    case 'storage-bar': {
      let bytes = 0;
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('vixora:')) bytes += (localStorage.getItem(k) || '').length * 2; } } catch {}
      const mb = (bytes / 1048576).toFixed(1);
      return `<div class="dash-big">💾 ${mb}<small> MB</small></div><div class="dash-bar"><i style="width:${Math.min(100, bytes / 5242880 * 100)}%"></i></div><small>از ~۵MB سهمیه مرورگر</small>`;
    }
    case 'cmdk-hint': {
      const t = CMDK_TIPS[Math.floor(now / 86400000) % CMDK_TIPS.length];
      return `<p class="dash-fact">⌨️ ${t}</p><button class="dash-btn xs" data-action="open-cmdk">باز کردن فرمان‌یاب</button>`;
    }
    case 'recipe-day': {
      const all = JSON.parse('[]');
      return `<p class="dash-fact">🍳 امروز: «جلسه بینش هفتگی» — ۱۰ دقیقه، تب 🧠!</p><button class="dash-btn xs" data-action="guide-goto" data-v="recipes">همه دستورپخت‌ها</button>`;
    }
    case 'gloss-day': {
      const terms = [['استریک 🔥', 'زنجیره روزهای پشت‌سرهم'], ['ران‌وی 🛬', 'ماه‌های دوام بدون درآمد'], ['دیپ‌ورک 🧠', 'تمرکز عمیق بدون حواس‌پرتی'], ['نشت پول 💸', 'خریدهای کوچکِ زیاد'], ['باجت 📊', 'سقف خرج هر دسته']];
      const t = terms[Math.floor(now / 86400000) % terms.length];
      return `<div class="dash-big" style="font-size:19px">${t[0]}</div><small>${t[1]}</small><div><button class="dash-btn xs" data-action="guide-goto" data-v="gloss">📚 واژه‌نامه</button></div>`;
    }
    case 'music-quiz': {
      const songs = load('vixora:music-lib', load('vixora:songs', [])).filter((s) => s.title && s.artist);
      if (songs.length < 4) return '<div class="dash-empty">حداقل ۴ آهنگ با خواننده لازم است! 🎵</div>';
      const qi = Math.floor(now / 3600000) % songs.length;
      const song = songs[qi];
      const others = songs.filter((_, i) => i !== qi).sort(() => Math.random() - 0.5).slice(0, 3).map((x) => x.artist);
      const opts = [...others, song.artist].sort(() => Math.random() - 0.5);
      return `<b>🎤 خواننده «${esc(song.title)}» کیست؟</b><div class="dash-row wrap" style="margin-top:6px">${opts.map((o) => `<button class="dash-btn xs" data-action="w10-quiz" data-v="${esc(o)}|${esc(song.artist)}">${esc(o)}</button>`).join('')}</div>`;
    }
    case 'math-duel': {
      const a = 5 + Math.floor(Math.random() * 40), b = 5 + Math.floor(Math.random() * 40);
      return `<div class="dash-big">🔢 ${fa(a)} + ${fa(b)} = ؟</div>
        <div class="dash-row"><input class="dash-input" data-math-a type="number" placeholder="جواب…" style="margin:0"><button class="dash-btn xs" data-action="w10-math" data-v="${a + b}">✓</button></div>`;
    }
    case 'memory-plus': {
      const seq = Array.from({ length: 5 }, () => Math.floor(Math.random() * 9) + 1);
      return `<small>این را ۵ ثانیه حفظ کن:</small><div class="dash-big" data-mem>${seq.join(' - ')}</div>
        <div class="dash-row"><button class="dash-btn xs" data-action="w10-mem-hide">🙈 قایم کن</button><input class="dash-input" data-mem-a placeholder="تکرار…" style="margin:0"><button class="dash-btn xs" data-action="w10-mem" data-v="${seq.join('')}">✓</button></div>`;
    }
    case 'typing-tester': {
      const words = 'سرعت تایپ تو با تمرین بیشتر می‌شود و این جمله برای تست است';
      return `<small>این را تایپ کن:</small><p class="dash-fact">«${words}»</p>
        <div class="dash-row"><button class="dash-btn xs" data-action="w10-type-start">▶ شروع</button><span data-type-t>—</span></div>`;
    }
    case 'appreciate':
      return `<p class="dash-quote">💜 ViXoRa را علی ساخت، با عشق و بی‌خوابی!</p>
        <button class="dash-btn xs" data-action="show-credit">🌟 دیدن اعتبار</button>`;
    default: return '';
  }
}

export function afterWidgets10Render() {}

export async function handleWidgets10Action(action, el, api) {
  switch (action) {
    case 'w10-quiz': {
      const [got, want] = (el.dataset?.v || '').split('|');
      api.toast(got === want ? '🎉 درست! آفرین!' : `❌ نه! جواب: ${want}`);
      if (got === want) api.rerender();
      return true;
    }
    case 'w10-math': {
      const scope = el.closest('section') || api.root;
      const v = +(scope.querySelector('[data-math-a]')?.value || -1);
      api.toast(v === +el.dataset?.v ? '🎉 درست! مغزت تیز است!' : '❌ اشتباه! دوباره تلاش کن.');
      if (v === +el.dataset?.v) api.rerender();
      return true;
    }
    case 'w10-mem-hide': {
      const scope = el.closest('section') || api.root;
      const m = scope.querySelector('[data-mem]');
      if (m) m.textContent = '؟ - ؟ - ؟ - ؟ - ؟';
      return true;
    }
    case 'w10-mem': {
      const scope = el.closest('section') || api.root;
      const v = (scope.querySelector('[data-mem-a]')?.value || '').replace(/\D/g, '');
      api.toast(v === el.dataset?.v ? '🧠 حافظه قوی! آفرین!' : '❌ نشد! دوباره تلاش کن.');
      if (v === el.dataset?.v) api.rerender();
      return true;
    }
    case 'w10-type-start': {
      const scope = el.closest('section') || api.root;
      const t = scope.querySelector('[data-type-t]');
      const t0 = Date.now();
      if (t) {
        t.textContent = '...تایپ کن و Enter';
        const inp = document.createElement('input');
        inp.className = 'dash-input'; inp.placeholder = 'اینجا تایپ کن…';
        t.after(inp); inp.focus();
        inp.onkeydown = (e) => {
          if (e.key === 'Enter') {
            const secs = Math.max(1, Math.round((Date.now() - t0) / 1000));
            const wpm = Math.round((inp.value.trim().split(/\s+/).length / secs) * 60);
            t.textContent = `⚡ ${secs} ثانیه • ~${wpm} کلمه/دقیقه`;
            inp.remove();
          }
        };
      }
      return true;
    }
    default: return false;
  }
}
