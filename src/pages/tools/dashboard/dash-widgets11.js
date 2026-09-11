// 🧩 ViXoRa Widgets 11 — سری یازدهم: اهداف، رکورد، سرگرمی، متا
// src/pages/tools/dashboard/dash-widgets11.js
import { esc, load } from './dash-state.js';
import { svgBars, svgDonut, svgSpark } from './dash-charts.js';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const dk = (ts) => new Date(ts).toDateString();

export const WIDGETS_META_11 = {
  'goals-hub-mini': { title: 'اهداف هفته', icon: '🏁', desc: 'پیشرفت سریع', w: 1 },
  'fin-goals-mini': { title: 'اهداف مالی', icon: '🌟', desc: 'نزدیک‌ترین هدف', w: 1 },
  'digest-mini': { title: 'خلاصه امروز', icon: '🌅', desc: 'دایجست صبح', w: 1 },
  'achieve-mini': { title: 'دستاوردها', icon: '🏆', desc: 'پیشرفت مدال‌ها', w: 1 },
  'streak-best': { title: 'بهترین زنجیره', icon: '⛓', desc: 'رکورد همه', w: 1 },
  'week-compare': { title: 'هفته در برابر قبل', icon: '⚖️', desc: 'بهتر یا بدتر؟', w: 1 },
  'top-hour-tx': { title: 'ساعت خرید', icon: '🛒', desc: 'کی بیشتر می‌خری؟', w: 1 },
  'weekend-rate': { title: 'سهم آخرهفته', icon: '🎪', desc: 'خرج جمعه‌ها', w: 1 },
  'song-roulette': { title: 'رولت آهنگ', icon: '🎰', desc: 'شانسی گوش بده!', w: 1 },
  'note-roulette': { title: 'رولت یادداشت', icon: '🎲', desc: 'خاطره تصادفی', w: 1 },
  'fact-math': { title: 'فکت ریاضی', icon: '🔢', desc: 'عدد امروز', w: 1 },
  'breathe2': { title: 'تنفس ۴-۷-۸', icon: '🫁', desc: 'تکنیک خواب', w: 1 },
};

export function renderWidgets11(id) {
  const now = Date.now();
  switch (id) {
    case 'goals-hub-mini': {
      let goals = [];
      try { goals = JSON.parse(localStorage.getItem('vixora:weekly-goals') || '[]'); } catch {}
      const done = goals.filter((g) => g.done >= g.target).length;
      return goals.length ? `<div class="dash-big">🏁 ${fa(done)}<small>/ ${fa(goals.length)} تمام شده</small></div>
        ${goals.slice(0, 3).map((g) => `<div class="dash-kv"><span>${esc(g.text)}</span><b>${fa(g.done)}/${fa(g.target)}</b></div>`).join('')}
        <button class="dash-btn xs" data-action="view" data-v="analytics">📈 مدیریت</button>`
        : '<div class="dash-empty">هدفی نیست.</div><button class="dash-btn xs" data-action="view" data-v="analytics">＋ ساخت هدف</button>';
    }
    case 'fin-goals-mini': {
      const goals = load('vixora:goals', []).filter((g) => g.target).map((g) => ({ g, pct: Math.round((g.saved || 0) / g.target * 100) })).sort((a, b) => b.pct - a.pct)[0];
      return goals ? `<b>🌟 ${esc(goals.g.title)}</b><div class="dash-big">${fa(Math.min(100, goals.pct))}٪</div>
        <div class="dash-bar"><i style="width:${Math.min(100, goals.pct)}%"></i></div><small>${fa(goals.g.saved || 0)} از ${fa(goals.g.target)}</small>`
        : '<div class="dash-empty">هدف مالی نیست.</div><button class="dash-btn xs" data-action="go" data-link="/tools/invoices">＋ ساخت ↗</button>';
    }
    case 'digest-mini': {
      const t = dk(now);
      const bills = load('vixora:bills', []).filter((b) => !b.paid && b.due && dk(new Date(b.due)) === t).length;
      const tasks = (JSON.parse(localStorage.getItem('vixora:tasks-' + t) || '[]')).filter((x) => !x.done).length;
      return `<div class="dash-kv"><span>💡 سررسید امروز</span><b>${fa(bills)}</b></div>
        <div class="dash-kv"><span>✅ کار باز</span><b>${fa(tasks)}</b></div>
        <button class="dash-btn xs" data-action="w11-digest">🌅 نمایش دایجست</button>`;
    }
    case 'achieve-mini': {
      let n = 0;
      try { n = JSON.parse(localStorage.getItem('vixora:achieve-unlocked') || '[]').length; } catch {}
      return `<div class="dash-big">🏆 ${fa(n)}<small>/۳۲</small></div>
        <div class="dash-bar"><i style="width:${n / 32 * 100}%"></i></div>
        <button class="dash-btn xs" data-action="view" data-v="achieve" style="margin-top:6px">دیدن همه</button>`;
    }
    case 'streak-best': {
      const counts = [];
      const txDays = new Set(load('vixora:txs', []).map((x) => dk(x.date || x.ts || 0)));
      let s = 0; const d = new Date();
      if (!txDays.has(dk(d))) d.setDate(d.getDate() - 1);
      while (txDays.has(dk(d))) { s++; d.setDate(d.getDate() - 1); }
      counts.push(['💰 ثبت مالی', s]);
      load('ViXoRa:dash-habits', []).forEach((h) => {
        const days = new Set((h.log || []).map((x) => dk(x)));
        let s2 = 0; const d2 = new Date();
        if (!days.has(dk(d2))) d2.setDate(d2.getDate() - 1);
        while (days.has(dk(d2))) { s2++; d2.setDate(d2.getDate() - 1); }
        counts.push([`✅ ${h.name || ''}`.slice(0, 24), s2]);
      });
      counts.sort((a, b) => b[1] - a[1]);
      return counts.length ? counts.slice(0, 4).map(([k, v]) => `<div class="dash-kv"><span>${esc(k)}</span><b>🔥 ${fa(v)}</b></div>`).join('') : '<div class="dash-empty">زنجیره‌ای نیست.</div>';
    }
    case 'week-compare': {
      const txs = load('vixora:txs', []);
      const sum = (from, to) => txs.filter((t) => { const x = new Date(t.date || t.ts || 0).getTime(); return x >= from && x < to && t.type !== 'income'; }).reduce((a, t) => a + (+t.amount || 0), 0);
      const cur = sum(now - 7 * 86400000, now), prev = sum(now - 14 * 86400000, now - 7 * 86400000);
      const diff = prev ? Math.round((cur - prev) / prev * 100) : 0;
      return `<div class="dash-big ${diff <= 0 ? 'pos' : 'neg'}">${diff > 0 ? '▲' : diff < 0 ? '▼' : '●'} ${fa(Math.abs(diff))}٪</div>
        ${svgBars([['قبل', prev], ['این هفته', cur]])}<small>${diff <= 0 ? 'کمتر خرج کردی! 🎉' : 'بیشتر خرج کردی! ⚠️'}</small>`;
    }
    case 'top-hour-tx': {
      const hours = new Array(24).fill(0);
      load('vixora:txs', []).forEach((t) => { if (t.type !== 'income') hours[new Date(t.date || t.ts || 0).getHours()]++; });
      const peak = hours.indexOf(Math.max(...hours));
      return hours.some(Boolean) ? `<div class="dash-big">🛒 ${fa(peak)}<small>:۰۰</small></div><small>ساعت اوج خریدت — حواست باشد! 👀</small>` : '<div class="dash-empty">تراکنشی نیست.</div>';
    }
    case 'weekend-rate': {
      const txs = load('vixora:txs', []).filter((t) => t.type !== 'income');
      const we = txs.filter((t) => [4, 5].includes(new Date(t.date || t.ts || 0).getDay())).reduce((a, t) => a + (+t.amount || 0), 0);
      const all = txs.reduce((a, t) => a + (+t.amount || 0), 0);
      const r = all ? Math.round(we / all * 100) : 0;
      return `<div class="dash-big">🎪 ${fa(r)}٪</div><div class="dash-bar"><i style="width:${r}%"></i></div><small>سهم پنجشنبه+جمعه از خرج کل</small>`;
    }
    case 'song-roulette':
      return `<div class="dash-big">🎰</div><small>یک آهنگ شانسی از کتابخانه‌ات!</small>
        <div><button class="dash-btn dash-btn-primary" data-action="w11-song">▶ بچرخون!</button></div><b data-song-r></b>`;
    case 'note-roulette': {
      const notes = load('vixora:notes', []);
      if (!notes.length) return '<div class="dash-empty">یادداشتی نیست.</div>';
      const n = notes[Math.floor(now / 3600000) % notes.length];
      return `<p class="dash-fact">🎲 «${esc((n.text || '').slice(0, 120))}…»</p><small>${new Date(n.ts || 0).toLocaleDateString('fa-IR')}</small>
        <div><button class="dash-btn xs" data-action="w11-note">🎲 یکی دیگه</button></div>`;
    }
    case 'fact-math': {
      const day = new Date().getDate();
      const facts = [`${day} ${day % 2 ? 'فرد' : 'زوج'} است!`, `مربع ${day} = ${day * day}`, `${day} به حروف: ${['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه', 'ده'][Math.min(10, day)] || 'زیاد'}…`, `آیا ${day} اول است؟ ${[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31].includes(day) ? 'بله! ⭐' : 'نه!'}`];
      return `<p class="dash-fact">🔢 ${facts[Math.floor(now / 86400000) % facts.length]}</p>`;
    }
    case 'breathe2':
      return `<small>دم ۴ ثانیه → نگه‌دار ۷ → بازدم ۸ (تکنیک خواب 😴)</small>
        <div class="dash-big" data-br2>🫁 آماده؟</div>
        <div><button class="dash-btn xs" data-action="w11-breathe">▶ شروع یک دور</button></div>`;
    default: return '';
  }
}

export function afterWidgets11Render() {}

export async function handleWidgets11Action(action, el, api) {
  switch (action) {
    case 'w11-digest': {
      const { showDigestNow } = await import('./dash-digest.js');
      showDigestNow(api);
      return true;
    }
    case 'w11-song': {
      const { load: L } = await import('./dash-state.js');
      const songs = L('vixora:music-lib', L('vixora:songs', []));
      if (!songs.length) { api.toast('🎵 آهنگی نیست!'); return true; }
      const song = songs[Math.floor(Math.random() * songs.length)];
      try {
        const P = await import('../../../core/services/music-player-service.js');
        P.setQueue(songs, { index: songs.indexOf(song), autoplay: true, contextLabel: '🎰 رولت' });
        api.toast(`🎰 ${song.title || ''} — ${song.artist || ''}`);
      } catch { api.toast(`🎰 ${song.title || ''}`); }
      const b = (el.closest('section') || api.root).querySelector('[data-song-r]');
      if (b) b.textContent = `🎵 ${song.title || ''} — ${song.artist || ''}`;
      return true;
    }
    case 'w11-note': api.rerender(); return true;
    case 'w11-breathe': {
      const box = (el.closest('section') || api.root).querySelector('[data-br2]');
      if (!box) return true;
      el.disabled = true;
      const steps = [['👃 دم… ۴', 4000], ['✋ نگه‌دار… ۷', 7000], ['😮‍💨 بازدم… ۸', 8000]];
      let i = 0;
      box.textContent = steps[0][0];
      const next = () => {
        i++;
        if (i >= steps.length) { box.textContent = '😌 آفرین! خوابت می‌آید؟'; el.disabled = false; return; }
        box.textContent = steps[i][0];
        setTimeout(next, steps[i][1]);
      };
      setTimeout(next, steps[0][1]);
      return true;
    }
    default: return false;
  }
}
