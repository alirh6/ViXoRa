// 🧠 ViXoRa Smart Insights — بینش‌های خودکار چندابزاری
// src/pages/tools/dashboard/dash-insights.js
import { esc, load } from './dash-state.js';

const dk = (ts) => new Date(ts).toDateString();
const fa = (n) => Number(n || 0).toLocaleString('fa-IR');

/**
 * بینش: {icon, title, body, level: 'good'|'warn'|'bad'|'info', link?: {v|go, label}}
 */
export function buildInsights() {
  const out = [];
  const now = Date.now();
  const week = now - 7 * 86400000;
  const txs = load('vixora:txs', []);
  const wtx = txs.filter((t) => (t.date || t.ts || 0) >= week);
  const wExp = wtx.filter((t) => t.type !== 'income').reduce((a, t) => a + (+t.amount || 0), 0);
  const wInc = wtx.filter((t) => t.type === 'income').reduce((a, t) => a + (+t.amount || 0), 0);

  // ۱) وضعیت هفته
  if (wtx.length >= 3) {
    out.push(wInc >= wExp ? {
      icon: '💎', title: `این هفته ${fa(wInc - wExp)} جلو هستی!`, body: 'دخل از خرج بیشتر شد. این روند را حفظ کن!',
      level: 'good', link: { v: 'report', label: 'گزارش کامل' },
    } : {
      icon: '🚨', title: `این هفته ${fa(wExp - wInc)} عقب هستی`, body: 'خرج از دخل بیشتر شد. دسته‌های پرخرج را ببین.',
      level: 'bad', link: { go: '/tools/invoices', label: 'بررسی مالی' },
    });
  }
  // ۲) سکوت ثبت
  const lastTx = txs.length ? Math.max(...txs.map((t) => new Date(t.date || t.ts || 0).getTime())) : 0;
  if (lastTx && now - lastTx > 3 * 86400000) {
    out.push({ icon: '😴', title: `${Math.floor((now - lastTx) / 86400000)} روز است چیزی ثبت نکردی`, body: 'ثبت‌های عقب‌افتاده را از حافظه‌ات بنویس، بعداً دقیقش کن.', level: 'warn' });
  }
  // ۳) دسته غالب هفته
  const cats = {};
  wtx.filter((t) => t.type !== 'income').forEach((t) => { const c = t.cat || 'متفرقه'; cats[c] = (cats[c] || 0) + (+t.amount || 0); });
  const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  if (top && wExp > 0 && top[1] / wExp > 0.4) {
    out.push({ icon: '🍩', title: `«${top[0]}» ${Math.round(top[1] / wExp * 100)}٪ خرج هفته‌ات است`, body: 'یک دسته دارد همه پول را می‌بلعد! برایش بودجه بگذار.', level: 'warn', link: { go: '/tools/invoices', label: 'بودجه‌سازی' } });
  }
  // ۴) قبض‌های نزدیک
  const dueBills = load('vixora:bills', []).filter((b) => !b.paid && b.due && (new Date(b.due) - now) < 3 * 86400000);
  if (dueBills.length) {
    out.push({ icon: '💡', title: `${dueBills.length} قبض در ۳ روز آینده سررسید دارد`, body: dueBills.slice(0, 2).map((b) => b.title || '').join('، ') + ' — پرداختشان کن.', level: dueBills.some((b) => new Date(b.due) < now) ? 'bad' : 'warn', link: { v: 'notify', label: 'مرکز اعلان‌ها' } });
  }
  // ۵) استریک ثبت
  const txDays = new Set(txs.map((t) => dk(t.date || t.ts || 0)));
  let streak = 0;
  const d = new Date();
  if (!txDays.has(dk(d))) d.setDate(d.getDate() - 1);
  while (txDays.has(dk(d))) { streak++; d.setDate(d.getDate() - 1); }
  if (streak >= 7) out.push({ icon: '🔥', title: `${streak} روز پشت‌سرهم ثبت مالی! افسانه‌ای!`, body: 'تو در ۱٪ برتر منظم‌ها هستی. ادامه بده!', level: 'good' });
  else if (streak >= 3) out.push({ icon: '🔥', title: `زنجیره ${streak} روزه — به ۷ برسان!`, body: 'فقط چند روز تا یک هفته کامل مانده.', level: 'info' });
  // ۶) موزیک
  const songs = load('vixora:music-lib', load('vixora:songs', []));
  if (songs.length >= 50) out.push({ icon: '🎵', title: `${songs.length} آهنگ در کتابخانه‌ات است!`, body: 'وقت ساخت یک پلی‌لیست «بهترین‌ها» است.', level: 'good', link: { v: 'remote', label: 'ریموت موزیک' } });
  else if (songs.length === 0) out.push({ icon: '🎵', title: 'کتابخانه موزیکت خالی است', body: 'چند آهنگ اضافه کن تا ریموت و ویجت‌ها جان بگیرند.', level: 'info', link: { go: '/tools/music', label: 'افزودن آهنگ' } });
  // ۷) ژورنال
  const j = load('vixora:journal', {});
  const jCount = Object.keys(j).length;
  const jWeek = Object.keys(j).filter((k) => new Date(k + 'T12:00:00').getTime() >= week).length;
  if (jCount >= 30) out.push({ icon: '📓', title: `${jCount} روز ژورنال — نویسنده واقعی!`, body: 'خروجی بگیر و مرورش کن؛ گنجینه‌ای از خودت.', level: 'good', link: { v: 'journal', label: 'ژورنال' } });
  else if (jWeek === 0) out.push({ icon: '📓', title: 'این هفته ژورنال ننوشتی', body: 'فقط ۳ دقیقه: حال + ۱ شکرگزاری. زنجیره را شروع کن!', level: 'info', link: { v: 'journal', label: 'نوشتن امروز' } });
  // ۸) عادت‌ها
  const hs = load('ViXoRa:dash-habits', []);
  const todayDone = hs.filter((h) => (h.log || []).some((t) => dk(t) === dk(now))).length;
  if (hs.length && todayDone === hs.length) out.push({ icon: '✅', title: 'همه عادت‌های امروز انجام شد!', body: 'روز کامل! به خودت افتخار کن. 🎉', level: 'good' });
  else if (hs.length && todayDone === 0 && new Date().getHours() >= 18) out.push({ icon: '⚠️', title: 'امروز هیچ عادتی انجام نشده!', body: 'هنوز وقت هست — حتی کوچک‌ترینشان را بزن.', level: 'warn', link: { v: 'habits', label: 'اتاق عادت‌ها' } });
  // ۹) تمرکز
  const focusMin = JSON.parse(localStorage.getItem('vixora:pomo-log') || '[]').filter((p) => p.ts >= week).reduce((a, p) => a + (p.min || 25), 0);
  if (focusMin >= 300) out.push({ icon: '🧠', title: `${focusMin} دقیقه تمرکز عمیق این هفته!`, body: 'مغزت در حالت قهرمان است. 🏆', level: 'good' });
  else if (focusMin === 0) out.push({ icon: '🍅', title: 'این هفته تمرکز عمیقی ثبت نشده', body: 'یک بازه ۲۵ دقیقه‌ای در اتاق تمرکز شروع کن.', level: 'info', link: { v: 'focus', label: 'اتاق تمرکز' } });
  // ۱۰) مشتریان
  const cs = load('vixora:customers', []);
  const newCs = cs.filter((c) => (c.ts || c.created || 0) >= 30 * 86400000 + (now - 30 * 86400000) && (c.ts || c.created || 0) >= now - 30 * 86400000).length;
  if (newCs >= 3) out.push({ icon: '👥', title: `${newCs} مشتری جدید در ۳۰ روز!`, body: 'کسب‌وکارت دارد رشد می‌کند! 📈', level: 'good' });
  // ۱۱) بدهی
  const debts = load('vixora:debts', []);
  const dTotal = debts.reduce((a, x) => a + (+(x.remaining ?? x.amount ?? 0) || 0), 0);
  if (dTotal > 0 && wInc > 0 && dTotal < wInc * 4) out.push({ icon: '🕊', title: 'بدهی‌ات کمتر از ۱ ماه دخل است — نزدیک آزادی!', body: 'یک حمله نهایی و خلاص! 💪', level: 'good' });
  else if (dTotal > 0) out.push({ icon: '🤝', title: `مانده بدهی‌ها: ${fa(dTotal)}`, body: 'برنامه پرداخت هفتگی بچین و جلو برو.', level: 'info', link: { go: '/tools/invoices', label: 'مدیریت بدهی' } });
  // ۱۲) خواب
  const sleeps = JSON.parse(localStorage.getItem('vixora:sleep') || '[]');
  if (sleeps.length >= 3) {
    const avg = sleeps.slice(-7).reduce((a, x) => a + (+x.h || 0), 0) / Math.min(7, sleeps.length);
    if (avg < 6) out.push({ icon: '🥱', title: `میانگین خوابت ${avg.toFixed(1)} ساعت است — کم است!`, body: 'خواب کم = تصمیم‌های بد + خرج بیشتر. امشب زودتر بخواب!', level: 'bad' });
    else if (avg >= 7.5) out.push({ icon: '😴', title: `خوابت عالی است (${avg.toFixed(1)} ساعت)!`, body: 'پایه همه موفقیت‌هاست. حفظش کن!', level: 'good' });
  }
  // ۱۳) مرور شبانه
  let revN = 0;
  try { for (let i = 0; i < 7; i++) { const dd = new Date(now - i * 86400000); if ((JSON.parse(localStorage.getItem('vixora:review-' + dd.toDateString()) || '[]')).length >= 5) revN++; } } catch {}
  if (revN >= 5) out.push({ icon: '🌙', title: `${revN} شب این هفته مرور کردی!`, body: 'انضباط شبانه‌ات عالی است. 😴', level: 'good' });
  else if (revN === 0) out.push({ icon: '🌙', title: 'این هفته مروری نکردی', body: 'امشب ۵ دقیقه: تب مرور شبانه.', level: 'info', link: { v: 'review', label: 'مرور امشب' } });
  // ۱۴) آخرهفته
  const wd = new Date().getDay();
  if (wd === 4 || wd === 5) {
    const we = txs.filter((t) => { const x = new Date(t.date || t.ts || 0); return [4, 5].includes(x.getDay()) && (t.date || t.ts || 0) >= week && t.type !== 'income'; }).reduce((a, t) => a + (+t.amount || 0), 0);
    if (we > 0) out.push({ icon: '🎪', title: `خرج آخرهفته‌ات ${fa(we)} شد`, body: 'آخرهفته‌ها ولخرجی؟ بودجه جدا بگذار!', level: 'warn' });
  }
  // ۱۵) کتاب
  try {
    const b = JSON.parse(localStorage.getItem('vixora:book') || '{}');
    if (b.title && b.pages) {
      const p = Math.round((b.read || 0) / b.pages * 100);
      if (p >= 80) out.push({ icon: '📚', title: `«${b.title}» ${p}٪ تمام شده!`, body: 'یک فشار آخر و جشن! 🎉', level: 'good' });
    }
  } catch {}
  // ۱۶) آب
  const water = +(localStorage.getItem('vixora:water-' + dk(now)) || 0);
  if (water >= 8) out.push({ icon: '💧', title: '۸ لیوان آب امروز — هیدراته کامل!', body: 'بدنت ممنون است. 🫶', level: 'good' });
  // مرتب‌سازی: بد → هشدار → خوب → اطلاعات
  const rank = { bad: 0, warn: 1, good: 2, info: 3 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}

export function renderInsights() {
  const list = buildInsights();
  const lvlFa = { good: ['✅ خوب', 'good'], warn: ['⚠️ هشدار', 'warn'], bad: ['🚨 مهم', 'bad'], info: ['ℹ️ نکته', 'info'] };
  const counts = { good: 0, warn: 0, bad: 0, info: 0 };
  list.forEach((x) => counts[x.level]++);
  return `<div class="dash-in-wrap">
    <div class="dash-in-head"><b>🧠 بینش‌های هوشمند</b>
      <span class="dash-row">${Object.entries(counts).filter(([, c]) => c).map(([k, c]) => `<span class="dash-chip">${lvlFa[k][0]} ×${fa(c)}</span>`).join('')}</span></div>
    <small class="dash-hint">این تحلیل‌ها همین حالا از داده هر ۷ ابزارت ساخته شدند. هر بار که وارد شوی تازه‌اند! ✨</small>
    <div class="dash-in-list">${list.length ? list.map((x) => `
      <div class="dash-card dash-in-card ${x.level}">
        <div class="dash-in-top"><span class="dash-in-ic">${x.icon}</span><b>${esc(x.title)}</b>
        <span class="dash-in-lvl">${lvlFa[x.level][0]}</span></div>
        <p>${esc(x.body)}</p>
        ${x.link ? `<div>${x.link.v ? `<button class="dash-btn xs" data-action="view" data-v="${x.link.v}">${esc(x.link.label)} ←</button>` : `<button class="dash-btn xs" data-action="go" data-link="${x.link.go}">${esc(x.link.label)} ↗</button>`}</div>` : ''}
      </div>`).join('') : '<div class="dash-empty">داده کافی نیست. چند روز ثبت کن تا بینش‌ها ظاهر شوند! 🌱</div>'}</div></div>`;
}
