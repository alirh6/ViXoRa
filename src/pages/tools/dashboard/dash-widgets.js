// 🧩 ViXoRa Cockpit Widgets — ۳۲ ویجت زنده هر ۶ ابزار + سیستمی
// src/pages/tools/dashboard/dash-widgets.js
import { esc, faDigits, relTime, fmtCompact, dashNavigate, logActivity, getActivity, clearActivity, getFavs, toggleFav } from './dash-state.js';
import { globalSearch, weekSummary } from './dash-data.js';
import { dashSpark, dashDonut, dashHBars, dashVBars, dashRing, dashGauge, dashRadar, dashDual, dashHeatmap, DASH_PALETTE } from './dash-charts.js';

/* ================================================================== */
/* متای ویجت‌ها                                                          */
/* ================================================================== */
export const WIDGET_META = {
  'greet': { title: 'سلام و خلاصه روز', icon: '👋', desc: 'خوش‌آمد، تاریخ و خلاصه وضعیت' },
  'clock': { title: 'ساعت و کرونومتر', icon: '🕐', desc: 'ساعت زنده، تاریخ شمسی، کرونومتر' },
  'search': { title: 'جستجوی سراسری', icon: '🔎', desc: 'جستجو در هر ۶ ابزار هم‌زمان' },
  'quick': { title: 'اقدامات سریع', icon: '⚡', desc: 'میانبرهای پرکاربرد همه ابزارها' },
  'favs': { title: 'علاقه‌مندی‌ها', icon: '⭐', desc: 'لینک‌های ستاره‌دار تو' },
  'music-now': { title: 'در حال پخش', icon: '🎧', desc: 'کنترل زنده موزیک از داشبورد' },
  'music-stats': { title: 'آمار موزیک', icon: '🎵', desc: 'کتابخانه، پخش‌ها و دقایق' },
  'top-songs': { title: 'پرپخش‌ترین‌ها', icon: '🏆', desc: '۱۰ آهنگ پرگوش‌داده' },
  'radio': { title: 'رادیو سریع', icon: '📻', desc: 'شروع فوری ایستگاه و میکس' },
  'fin-kpi': { title: 'شاخص‌های مالی', icon: '💰', desc: 'دخل، خرج، خالص ماه' },
  'fin-cash': { title: 'جریان ماه', icon: '🌊', desc: 'نمودار روزانه دخل و خرج' },
  'finance-chart': { title: 'تفکیک هزینه‌ها', icon: '🍩', desc: 'دونات دسته‌های ماه' },
  'debts': { title: 'بدهی‌ها', icon: '🤝', desc: 'مانده‌ها و پرداخت سریع' },
  'goals': { title: 'اهداف مالی', icon: '🌟', desc: 'پیشرفت اهداف و واریز' },
  'bills': { title: 'قبوض نزدیک', icon: '💡', desc: 'قبوض فعال و سررسیدها' },
  'forecast': { title: 'ران‌وی مالی', icon: '🛬', desc: 'دوام بدون درآمد' },
  'subs': { title: 'اشتراک‌ها', icon: '🔁', desc: 'هزینه ماهانه اشتراک‌ها' },
  'insights': { title: 'بینش‌های برتر', icon: '💡', desc: '۳ بینش مهم امروز' },
  'notes': { title: 'یادداشت‌های اخیر', icon: '📝', desc: 'آخرین‌ها + ثبت سریع' },
  'customers': { title: 'مشتریان', icon: '👥', desc: 'آمار و آخرین مشتریان' },
  'building': { title: 'ساختمان‌ها', icon: '🏢', desc: 'واحدها و ساکنان' },
  'arcade': { title: 'آرکید', icon: '🎮', desc: 'بازی‌ها، رکوردها، شروع تصادفی' },
  'arcade-top': { title: 'جدول رکوردها', icon: '🥇', desc: 'برترین رکوردهای بازی' },
  'activity': { title: 'فید فعالیت', icon: '📜', desc: 'آخرین رویدادهای تو' },
  'health': { title: 'سلامت ابزارها', icon: '💊', desc: 'رادار فعالیت ۶ ابزار' },
  'storage': { title: 'حافظه', icon: '💾', desc: 'میزان مصرف localStorage' },
  'pomodoro': { title: 'پومودورو', icon: '🍅', desc: 'تایمر تمرکز ۲۵/۵' },
  'focus': { title: '۳ کار امروز', icon: '🎯', desc: 'مهم‌ترین کارهای روز' },
  'quote': { title: 'جمله روز', icon: '🌟', desc: 'انگیزشی روزانه' },
  'shortcuts': { title: 'میانبرها', icon: '⌨️', desc: 'کلیدهای سریع داشبورد' },
  'week': { title: 'هفته مالی', icon: '📅', desc: 'دخل و خرج ۷ روز' },
  'backup': { title: 'پشتیبان‌گیری', icon: '🛟', desc: 'خروجی همه داده‌ها' },
  'dice': { title: 'تاس تصمیم', icon: '🎲', desc: 'کمک به تصمیم‌گیری' },
};

export function widgetChrome(id, inner, opts = {}) {
  const m = opts.meta || WIDGET_META[id] || { title: id, icon: '🧩' };
  return `<section class="dash-widget" data-widget="${id}" data-size="${opts.size || 'm'}">
    <header class="dash-w-head">
      <span class="dash-w-drag" title="بکش برای جابه‌جایی">⋮⋮</span>
      <span class="dash-w-title">${m.icon} ${esc(m.title)}</span>
      <span class="dash-w-ops">
        ${opts.link ? `<button class="dash-icon-btn" data-action="go" data-link="${opts.link}" title="باز کردن">↗</button>` : ''}
        <button class="dash-icon-btn" data-action="w-size" data-id="${id}" title="تغییر اندازه">◧</button>
        <button class="dash-icon-btn" data-action="w-focus" data-id="${id}" title="تمرکز">⛶</button>
        <button class="dash-icon-btn" data-action="w-hide" data-id="${id}" title="مخفی">✕</button>
      </span>
    </header>
    <div class="dash-w-body">${inner}</div>
  </section>`;
}

/* ================================================================== */
/* رندر هر ویجت                                                          */
/* ================================================================== */
export function renderWidget(id, data, st, ui) {
  switch (id) {
    case 'greet': return wGreet(data, ui);
    case 'clock': return wClock();
    case 'search': return wSearch(st);
    case 'quick': return wQuick(data);
    case 'favs': return wFavs();
    case 'music-now': return wMusicNow();
    case 'music-stats': return wMusicStats(data);
    case 'top-songs': return wTopSongs(data);
    case 'radio': return wRadio(data);
    case 'fin-kpi': return wFinKpi(data);
    case 'fin-cash': return wFinCash(data);
    case 'finance-chart': return wFinChart();
    case 'debts': return wDebts(data);
    case 'goals': return wGoals(data);
    case 'bills': return wBills(data);
    case 'forecast': return wForecast(data);
    case 'subs': return wSubs(data);
    case 'insights': return wInsights(data);
    case 'notes': return wNotes(data);
    case 'customers': return wCustomers(data);
    case 'building': return wBuilding(data);
    case 'arcade': return wArcade(data);
    case 'arcade-top': return wArcadeTop(data);
    case 'activity': return wActivity();
    case 'health': return wHealth(data);
    case 'storage': return wStorage();
    case 'pomodoro': return wPomodoro();
    case 'focus': return wFocus();
    case 'quote': return wQuote(st);
    case 'shortcuts': return wShortcuts();
    case 'week': return wWeek(data);
    case 'backup': return wBackup(data);
    case 'dice': return wDice(st);
    default: return `<div class="dash-empty">ویجت ناشناس: ${esc(id)}</div>`;
  }
}

/* ---------- سلام ---------- */
function wGreet(data, ui) {
  const h = new Date().getHours();
  const g = h < 5 ? 'نیمه‌شب بخیر 🌙' : h < 12 ? 'صبح بخیر ☀️' : h < 17 ? 'ظهر بخیر 🌤️' : h < 20 ? 'عصر بخیر 🌇' : 'شب بخیر 🌙';
  const name = ui.greetName ? `، ${esc(ui.greetName)}` : '';
  const f = data.finance;
  const net = f.income30 - f.expense30;
  return `<div class="dash-greet"><b>${g}${name}!</b>
    <div class="dash-date">${new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
    <div class="dash-kv"><span>🎵 ${faDigits(String(data.music.count))} آهنگ</span><span>📝 ${faDigits(String(data.notes.count))} یادداشت</span></div>
    <div class="dash-kv"><span>👥 ${faDigits(String(data.customers.count))} مشتری</span><span>🎮 ${faDigits(String(data.arcade.plays))} بازی</span></div>
    <div class="dash-net ${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '📈' : '📉'} خالص ماه: ${fmtCompact(net)} تومان</div>
    <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-greet-name">✏️ نام من</button>
    <button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/dashboard">📖 راهنما</button></div></div>`;
}

/* ---------- ساعت ---------- */
function wClock() {
  return `<div class="dash-clock"><b data-dash="clock-time">--:--</b>
    <span data-dash="clock-date"></span>
    <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-clock-toggle">۲۴/۱۲ ساعته</button>
    <button class="dash-btn dash-btn-sm" data-action="w-sw">⏱ کرونومتر</button></div>
    <div data-dash="sw" class="dash-sw" hidden><b>--:--.--</b>
      <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-sw-start">▶</button>
      <button class="dash-btn dash-btn-sm" data-action="w-sw-lap">🏁 دور</button>
      <button class="dash-btn dash-btn-sm" data-action="w-sw-reset">↺</button></div>
      <div data-dash="sw-laps" class="dash-laps"></div></div></div>`;
}

/* ---------- جستجو ---------- */
function wSearch(st) {
  return `<input class="dash-search" data-dash="gq" placeholder="🔎 جستجو در همه ابزارها… (حداقل ۲ حرف)" value="${esc(st.gq || '')}" />
  <div data-dash="gq-results" class="dash-results">${st.gqResults || '<div class="dash-hint">مثلاً: اسم آهنگ، مشتری، یادداشت، مبلغ…</div>'}</div>`;
}

export function gqResultsHtml(results) {
  if (!results.length) return '<div class="dash-empty">چیزی پیدا نشد.</div>';
  const tools = { notes: '📝 یادداشت', customers: '👥 مشتری', music: '🎵 موزیک', finance: '🧾 مالی', building: '🏢 ساختمان', arcade: '🎮 بازی' };
  return results.map((r) => `<button class="dash-result" data-action="go" data-link="${r.link}">
    <b>${r.icon} ${esc(r.title)}</b><span>${esc(r.sub)}</span><i>${tools[r.tool] || r.tool}</i></button>`).join('');
}

/* ---------- اقدامات سریع ---------- */
function wQuick() {
  const items = [
    ['📝 یادداشت جدید', '/tools/note', 'w-qa-note'],
    ['🎵 پخش تصادفی', '', 'w-qa-shuffle'],
    ['🧾 هزینه جدید', '/tools/invoices', 'w-qa-tx'],
    ['👥 مشتری جدید', '/tools/customerInfo', ''],
    ['🎮 بازی تصادفی', '', 'w-qa-game'],
    ['💰 واریز به هدف', '/tools/invoices', ''],
    ['⏱ شروع پومودورو', '', 'w-qa-pomo'],
    ['📥 خروجی همه', '', 'w-qa-export'],
    ['🔎 جستجو', '', 'w-qa-cmdk'],
    ['📖 راهنما', '', 'w-qa-guide'],
    ['🏢 ساختمان', '/tools/building', ''],
    ['💡 بینش مالی', '/tools/invoices', ''],
  ];
  return `<div class="dash-qa-grid">${items.map(([t, link, act]) =>
    `<button class="dash-qa" data-action="${act || 'go'}" ${link ? `data-link="${link}"` : ''}>${t}</button>`).join('')}</div>`;
}

/* ---------- علاقه‌مندی‌ها ---------- */
function wFavs() {
  const favs = getFavs();
  if (!favs.length) return '<div class="dash-empty">⭐ هنوز چیزی ستاره نکردی.<br />از جستجو یا ابزارها ⭐ بزن.</div>';
  return favs.map((f) => `<div class="dash-fav"><button class="dash-link" data-action="go" data-link="${esc(f.link)}">${esc(f.title)}</button>
    <button class="dash-icon-btn" data-action="w-fav-del" data-link="${esc(f.link)}">✕</button></div>`).join('');
}

/* ---------- موزیک زنده ---------- */
function wMusicNow() {
  return `<div class="dash-mn" data-dash="mn">
    <div class="dash-mn-cover" data-dash="mn-cover">🎵</div>
    <div class="dash-mn-info"><b data-dash="mn-title">چیزی پخش نمی‌شود</b><span data-dash="mn-artist">—</span>
      <div class="dash-mn-bar"><i data-dash="mn-prog"></i></div>
      <div class="dash-mn-time"><span data-dash="mn-pos">۰:۰۰</span><span data-dash="mn-dur">۰:۰۰</span></div></div>
    <div class="dash-mn-ctl">
      <button class="dash-icon-btn" data-action="w-mn-prev" title="قبلی">⏮</button>
      <button class="dash-icon-btn big" data-action="w-mn-toggle" title="پخش/مکث">▶</button>
      <button class="dash-icon-btn" data-action="w-mn-next" title="بعدی">⏭</button>
      <button class="dash-icon-btn" data-action="w-mn-like" title="علاقه">🤍</button>
    </div>
    <div class="dash-row"><input type="range" data-dash="mn-vol" min="0" max="100" value="80" title="صدا" />
    <button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/music">باز کردن پلیر ↗</button></div></div>`;
}

function wMusicStats(data) {
  const m = data.music;
  return `<div class="dash-stats"><div><b>${faDigits(String(m.count))}</b><span>🎵 آهنگ</span></div>
    <div><b>${faDigits(String(m.playlists.length))}</b><span>📝 پلی‌لیست</span></div>
    <div><b>${faDigits(String(m.liked))}</b><span>❤️ علاقه</span></div>
    <div><b>${faDigits(String(m.plays))}</b><span>▶ پخش</span></div></div>
    <canvas data-dash-chart="music-ring" height="110"></canvas>
    <div class="dash-hint">🎧 ${faDigits(String(m.mins))} دقیقه گوش داده‌ای.</div>`;
}

function wTopSongs(data) {
  const top = [...(data.music.all || [])].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 8);
  if (!top.length) return '<div class="dash-empty">🎵 آهنگی نیست.</div>';
  return top.map((s, i) => `<div class="dash-rowline"><b class="dash-num">${faDigits(String(i + 1))}</b>
    <span class="dash-t">${esc(s.title || 'بی‌نام')}</span><span class="dash-s">${esc(s.artist || '')}</span>
    <span class="dash-n">${faDigits(String(s.playCount || 0))} ▶</span>
    <button class="dash-icon-btn" data-action="w-play-song" data-id="${esc(s.id)}">▶</button></div>`).join('');
}

function wRadio(data) {
  return `<div class="dash-hint">📻 بدون باز کردن صفحه موزیک، پخش را شروع کن:</div>
  <div class="dash-qa-grid">
    <button class="dash-qa" data-action="w-radio" data-m="shuffle">🔀 شافل همه</button>
    <button class="dash-qa" data-action="w-radio" data-m="liked">❤️ علاقه‌مندی‌ها</button>
    <button class="dash-qa" data-action="w-radio" data-m="mix">🌀 میکس امروز</button>
    <button class="dash-qa" data-action="w-radio" data-m="fresh">✨ تازه‌ها</button>
  </div>
  <div class="dash-hint">${faDigits(String(data.music.count))} آهنگ در کتابخانه.</div>`;
}

/* ---------- مالی ---------- */
function wFinKpi(data) {
  const f = data.finance;
  const net = f.income30 - f.expense30;
  return `<div class="dash-stats"><div><b class="pos">+${fmtCompact(f.income30)}</b><span>💰 دخل ۳۰ روز</span></div>
    <div><b class="neg">−${fmtCompact(f.expense30)}</b><span>💸 خرج ۳۰ روز</span></div>
    <div><b class="${net >= 0 ? 'pos' : 'neg'}">${fmtCompact(net)}</b><span>⚖️ خالص</span></div>
    <div><b>${faDigits(String(f.txs))}</b><span>🧾 تراکنش</span></div></div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/invoices">سوپراپ مالی ↗</button>
  <button class="dash-btn dash-btn-sm" data-action="w-qa-tx">➕ ثبت سریع</button></div>`;
}

function wFinCash(data) {
  return `<canvas data-dash-chart="fin-spark" height="100"></canvas>
  <div class="dash-hint">خرج روزانه ۱۴ روز اخیر</div>`;
}

function wFinChart() {
  return `<canvas data-dash-chart="fin-donut" height="180"></canvas>`;
}

function wDebts(data) {
  const debts = (data.finance.bundle?.debts || []).filter((d) => !d.settled);
  if (!debts.length) return '<div class="dash-empty">🎉 بدهی فعالی نیست!</div>';
  const rem = (d) => Math.max(0, (Number(d.total) || 0) - (d.payments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0));
  const total = debts.reduce((a, d) => a + rem(d), 0);
  return `<div class="dash-big">💰 ${fmtCompact(total)} <small>تومان مانده</small></div>` +
    debts.slice(0, 5).map((d) => `<div class="dash-rowline"><span class="dash-t">${esc(d.person || d.title || '')}</span>
      <span class="dash-n">${fmtCompact(rem(d))}</span>
      <button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/invoices">پرداخت</button></div>`).join('');
}

function wGoals(data) {
  const goals = data.finance.bundle?.goals || [];
  if (!goals.length) return '<div class="dash-empty">🌟 هدفی ثبت نشده.<br /><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/invoices">ساخت هدف ↗</button></div>';
  return goals.slice(0, 4).map((g) => {
    const cur = Number(g.current ?? g.saved ?? 0), target = Number(g.target ?? g.amount ?? 0) || 1;
    const pct = Math.min(100, Math.round((cur / target) * 100));
    return `<div class="dash-goal"><div class="dash-goal-head"><b>${esc(g.title || g.name || '')}</b><span>${faDigits(String(pct))}٪</span></div>
      <div class="dash-bar"><i style="width:${pct}%"></i></div>
      <span class="dash-s">${fmtCompact(cur)} از ${fmtCompact(target)}</span></div>`;
  }).join('');
}

function wBills(data) {
  const bills = (data.finance.bundle?.bills || []).filter((b) => b.active !== false);
  if (!bills.length) return '<div class="dash-empty">💡 قبض فعالی نیست.</div>';
  const today = new Date().getDate();
  return bills.slice(0, 6).map((b) => {
    const due = Number(b.dueDay) || 1;
    const left = due - today;
    const badge = left < 0 ? `🔴 ${faDigits(String(-left))} روز گذشته` : left === 0 ? '🟡 امروز!' : `🟢 ${faDigits(String(left))} روز مانده`;
    return `<div class="dash-rowline"><span class="dash-t">${esc(b.icon || '🧾')} ${esc(b.title)}</span><span class="dash-n">${badge}</span></div>`;
  }).join('');
}

function wForecast(data) {
  const f = data.finance;
  const burn = f.expense30;
  const net = f.income30 - f.expense30;
  const liq = net >= 0 ? Infinity : 0;
  void liq;
  const runway = net >= 0 ? '∞' : (burn > 0 ? (3).toFixed(1) : '—');
  return `<canvas data-dash-chart="runway" height="110"></canvas>
  <div class="dash-hint">${net >= 0 ? '🌟 دخلت از خرجت بیشتره!' : `🛬 با این روند، ذخیره‌ات را در «پیش‌بینی» بررسی کن.`}</div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/invoices">🔮 پیش‌بینی کامل ↗</button></div>`;
}

function wSubs(data) {
  const txs = data.finance.bundle?.txs || [];
  const groups = new Map();
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    const k = `${Math.round(Number(t.amount) || 0)}|${String(t.note || t.title || '').slice(0, 20)}`;
    groups.set(k, (groups.get(k) || 0) + 1);
  }
  let monthly = 0, n = 0;
  for (const [k, c] of groups) {
    if (c >= 2) { monthly += Number(k.split('|')[0]) || 0; n++; }
  }
  return `<div class="dash-big">🔁 ${fmtCompact(monthly)} <small>تومان/ماه</small></div>
  <div class="dash-hint">${faDigits(String(n))} الگوی تکراری پیدا شد.</div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/invoices">رادار اشتراک ↗</button></div>`;
}

function wInsights(data) {
  const f = data.finance;
  const net = f.income30 - f.expense30;
  const items = [];
  if (net < 0) items.push(['🚨', 'خرج ماه از دخل بیشتر شده!']);
  else items.push(['💎', `این ماه ${fmtCompact(net)} تومان جلو هستی.`]);
  if (f.invoicesOpen) items.push(['📄', `${faDigits(String(f.invoicesOpen))} فاکتور باز داری.`]);
  if (f.debts) items.push(['🤝', `${faDigits(String(f.debts))} بدهی فعال نیازمند توجه.`]);
  items.push(['🎮', `${faDigits(String(data.arcade.plays))} بار بازی کرده‌ای — تعادل خوبه!`]);
  return items.slice(0, 4).map(([i, t]) => `<div class="dash-rowline"><span class="dash-t">${i} ${t}</span></div>`).join('') +
    `<div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/invoices">همه بینش‌ها ↗</button></div>`;
}

/* ---------- یادداشت/مشتری/ساختمان ---------- */
function wNotes(data) {
  const items = data.notes.items || [];
  return `<div class="dash-row"><input class="dash-input" data-dash="note-q" placeholder="✏️ یادداشت سریع… (Enter)" /></div>` +
    (items.length ? items.slice(0, 5).map((n) => `<button class="dash-result" data-action="go" data-link="/tools/note">
      <b>${n.pinned || n.favorite ? '📌 ' : '📝 '}${esc(n.title || (n.body || n.content || '').slice(0, 40) || 'بدون عنوان')}</b>
      <span>${esc(relTime(Date.parse(n.updatedAt || n.createdAt || 0) || Date.now()))}</span></button>`).join('')
      : '<div class="dash-empty">یادداشتی نیست.</div>');
}

function wCustomers(data) {
  const all = data.customers.all || [];
  const withPhone = all.filter((c) => c.phone).length;
  return `<div class="dash-stats"><div><b>${faDigits(String(all.length))}</b><span>👥 مشتری</span></div>
    <div><b>${faDigits(String(withPhone))}</b><span>📞 با تلفن</span></div></div>` +
    (data.customers.items || []).slice(0, 4).map((c) => `<div class="dash-rowline"><span class="dash-t">👤 ${esc(c.name || 'بی‌نام')}</span>
      <span class="dash-s">${esc(c.phone || c.company || '')}</span></div>`).join('') +
    `<div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/customerInfo">مدیریت مشتریان ↗</button></div>`;
}

function wBuilding(data) {
  const all = data.building.all || [];
  return `<div class="dash-stats"><div><b>${faDigits(String(all.length))}</b><span>🏢 ساختمان</span></div>
    <div><b>${faDigits(String(data.building.units))}</b><span>🚪 واحد</span></div></div>` +
    (data.building.buildings || []).slice(0, 4).map((b) => `<div class="dash-rowline"><span class="dash-t">🏢 ${esc(b.name || b.title || 'ساختمان')}</span>
      <span class="dash-s">${esc(b.code || '')}</span></div>`).join('') +
    `<div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/building">مدیریت ساختمان ↗</button></div>`;
}

/* ---------- آرکید ---------- */
function wArcade(data) {
  return `<div class="dash-stats"><div><b>${faDigits(String(data.arcade.games))}</b><span>🎮 بازی</span></div>
    <div><b>${faDigits(String(data.arcade.plays))}</b><span>▶ اجراها</span></div></div>
  <div class="dash-qa-grid"><button class="dash-qa" data-action="w-qa-game">🎲 بازی تصادفی</button>
  <button class="dash-qa" data-action="go" data-link="/tools/entertainment">🕹 آرکید ↗</button></div>`;
}

function wArcadeTop(data) {
  const recs = (data.arcade.records || []).filter((r) => r.best > 0).slice(0, 6);
  if (!recs.length) return '<div class="dash-empty">🥇 هنوز رکوردی ثبت نشده. برو بازی کن!</div>';
  const medals = ['🥇', '🥈', '🥉', '۴.', '۵.', '۶.'];
  return recs.map((r, i) => `<div class="dash-rowline"><b class="dash-num">${medals[i] || ''}</b>
    <span class="dash-t">${esc(r.title)}</span><span class="dash-n">${faDigits(String(r.best))}</span></div>`).join('');
}

/* ---------- سیستمی ---------- */
function wActivity() {
  const acts = getActivity(8);
  if (!acts.length) return '<div class="dash-empty">📜 فعالیتی ثبت نشده.</div>';
  return acts.map((a) => `<div class="dash-rowline"><span class="dash-t">${a.icon} ${esc(a.text)}</span>
    <span class="dash-s">${esc(relTime(a.at))}</span></div>`).join('') +
    `<div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-act-clear">🧹 پاک کردن</button></div>`;
}

function wHealth(data) {
  return `<canvas data-dash-chart="health" height="190"></canvas>
  <div class="dash-hint">امتیاز کلی: <b>${faDigits(String(data.health.total))}</b> از ۱۰۰</div>`;
}

function wStorage() {
  let bytes = 0;
  const rows = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k) || '';
      bytes += (k.length + v.length) * 2;
      const top = k.split(':')[0];
      const r = rows.find((x) => x.k === top);
      if (r) r.v += v.length * 2; else rows.push({ k: top, v: v.length * 2 });
    }
  } catch { /* ignore */ }
  rows.sort((a, b) => b.v - a.v);
  const mb = (bytes / 1048576).toFixed(2);
  const pct = Math.min(100, (bytes / (5 * 1048576)) * 100);
  return `<div class="dash-big">💾 ${faDigits(mb)} <small>مگابایت</small></div>
  <div class="dash-bar"><i style="width:${pct}%"></i></div>
  <div class="dash-hint">${rows.slice(0, 3).map((r) => `${esc(r.k)}: ${faDigits((r.v / 1024).toFixed(0))}KB`).join(' • ')}</div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-storage-clean">🧹 پاک‌سازی کش‌ها</button></div>`;
}

const POMO_KEY = 'ViXoRa:dash-pomo';
function wPomodoro() {
  let p = { mode: 'focus', endAt: 0, left: 25 * 60 };
  try { p = { ...p, ...JSON.parse(localStorage.getItem(POMO_KEY) || '{}') }; } catch { /* ignore */ }
  return `<div class="dash-pomo"><b data-dash="pomo-time">۲۵:۰۰</b><span>${p.mode === 'focus' ? '🍅 تمرکز' : '☕ استراحت'}</span>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-pomo-toggle">▶ شروع</button>
  <button class="dash-btn dash-btn-sm" data-action="w-pomo-mode">🔁 حالت</button>
  <button class="dash-btn dash-btn-sm" data-action="w-pomo-reset">↺</button></div></div>`;
}

const FOCUS_KEY = 'ViXoRa:dash-focus3';
export function getFocus3() {
  try {
    const raw = JSON.parse(localStorage.getItem(FOCUS_KEY) || 'null');
    const today = new Date().toDateString();
    if (raw && raw.day === today) return raw.items;
  } catch { /* ignore */ }
  return ['', '', ''];
}
function wFocus() {
  const items = getFocus3();
  return items.map((t, i) => `<div class="dash-row"><input class="dash-input" data-dash="focus" data-i="${i}" value="${esc(t)}" placeholder="کار ${faDigits(String(i + 1))} امروز…" />
  <button class="dash-icon-btn" data-action="w-focus-done" data-i="${i}" title="انجام شد">✅</button></div>`).join('') +
    `<div class="dash-hint">ذخیره خودکار • هر روز تازه می‌شود.</div>`;
}

const QUOTES = [
  ['موفقیت یعنی رفتن از شکستی به شکست دیگر بدون از دست دادن اشتیاق.', 'وینستون چرچیل'],
  ['بهترین زمان برای شروع دیروز بود؛ دومین زمانِ خوب، همین الآن است.', 'ضرب‌المثل چینی'],
  ['آنچه ما را نمی‌کشد، قوی‌ترمان می‌کند.', 'نیچه'],
  ['نظم، پلی است میان هدف و موفقیت.', '—'],
  ['کار امروز را به فردا مینداز.', '—'],
  ['کوچک شروع کن، بزرگ فکر کن.', '—'],
  ['ثروت واقعی، زمان آزاد است.', '—'],
  ['هر متخصصی روزی یک مبتدی بوده.', '—'],
  ['پس‌انداز امروز، آزادی فرداست.', '—'],
  ['تمرکز یعنی گفتن «نه» به صد چیز خوب.', 'استیو جابز'],
  ['عادت‌های کوچک، نتایج بزرگ.', 'جیمز کلیر'],
  ['موسیقی، زبان مشترک همه دنیاست.', '—'],
];
function wQuote(st) {
  const day = Math.floor(Date.now() / 864e5);
  const i = (day + (st.quoteShift || 0)) % QUOTES.length;
  const [t, a] = QUOTES[i];
  return `<div class="dash-quote">«${esc(t)}»<span>— ${esc(a)}</span></div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-quote-next">🔀 جمله دیگر</button></div>`;
}

function wShortcuts() {
  const rows = [
    ['Ctrl/⌘ + K', 'فرمان‌یاب'],
    ['G سپس M', 'رفتن به موزیک'],
    ['G سپس F', 'رفتن به مالی'],
    ['G سپس N', 'یادداشت‌ها'],
    ['?', 'راهنمای کامل'],
    ['Esc', 'بستن پنجره‌ها'],
  ];
  return rows.map(([k, d]) => `<div class="dash-rowline"><kbd>${k}</kbd><span class="dash-t">${d}</span></div>`).join('');
}

function wWeek(data) {
  return `<canvas data-dash-chart="week" height="150"></canvas>
  <div class="dash-hint">سبز: دخل • قرمز: خرج (۷ روز)</div>`;
}

function wBackup(data) {
  return `<div class="dash-hint">🛟 خروجی یکجای همه داده‌ها (یادداشت، مشتری، موزیک، مالی، ساختمان، تنظیمات داشبورد):</div>
  <div class="dash-qa-grid"><button class="dash-qa" data-action="w-qa-export">📥 دانلود بکاپ</button>
  <button class="dash-qa" data-action="w-backup-copy">📋 کپی خلاصه</button></div>
  <div class="dash-hint" data-dash="backup-info">—</div>`;
}

function wDice(st) {
  const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const v = st.dice || 0;
  return `<div class="dash-dice"><b>${faces[v % 6]}</b></div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-dice-roll">🎲 بنداز</button>
  <button class="dash-btn dash-btn-sm" data-action="w-coin">🪙 شیر/خط</button></div>
  <div class="dash-hint" data-dash="dice-out">${st.diceOut || 'برای تصمیم‌های سخت!'}</div>`;
}

/* ================================================================== */
/* پس از رندر: نمودارها                                                   */
/* ================================================================== */
export function afterWidgetsRender(root, data) {
  root.querySelectorAll('[data-dash-chart]').forEach((cv) => {
    try {
      const kind = cv.dataset.dashChart;
      if (kind === 'music-ring') {
        const liked = data.music.liked, total = Math.max(1, data.music.count);
        dashRing(cv, liked / total, { color: '#ec4899', label: 'علاقه‌مندی', h: 110 });
      } else if (kind === 'fin-spark') {
        const txs = data.finance.bundle?.txs || [];
        const daily = [];
        for (let i = 13; i >= 0; i--) {
          const d0 = new Date(); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - i);
          const d1 = d0.getTime() + 864e5;
          daily.push(txs.filter((t) => {
            const at = Date.parse(t.date || t.createdAt || 0) || 0;
            return t.type === 'expense' && at >= d0.getTime() && at < d1;
          }).reduce((a, t) => a + (Number(t.amount) || 0), 0));
        }
        dashSpark(cv, daily, { h: 100, color: '#f43f5e' });
      } else if (kind === 'fin-donut') {
        const now = Date.now();
        const cats = new Map((data.finance.bundle?.categories || []).map((c) => [c.id, c.name || c.title || 'دسته']));
        const byCat = new Map();
        for (const t of data.finance.bundle?.txs || []) {
          const at = Date.parse(t.date || t.createdAt || 0) || 0;
          if (t.type !== 'expense' || at < now - 30 * 864e5) continue;
          byCat.set(t.categoryId || '', (byCat.get(t.categoryId || '') || 0) + (Number(t.amount) || 0));
        }
        dashDonut(cv, [...byCat.entries()].map(([k, v]) => ({ label: cats.get(k) || 'بدون دسته', value: v })), { h: 180 });
      } else if (kind === 'runway') {
        const f = data.finance;
        const frac = f.income30 >= f.expense30 ? 1 : (f.income30 / Math.max(1, f.expense30));
        dashGauge(cv, frac, { label: f.income30 >= f.expense30 ? 'مازاد' : 'کسری', h: 110 });
      } else if (kind === 'health') {
        const h = data.health;
        dashRadar(cv, [
          { label: '📝 یادداشت', value: h.notes / 100 },
          { label: '👥 مشتری', value: h.customers / 100 },
          { label: '🏢 ساختمان', value: h.building / 100 },
          { label: '🎵 موزیک', value: h.music / 100 },
          { label: '💰 مالی', value: h.finance / 100 },
          { label: '🎮 بازی', value: h.arcade / 100 },
        ], { h: 190 });
      } else if (kind === 'week') {
        const w = weekSummary(data);
        dashDual(cv, w.map((d) => d.inc), w.map((d) => d.exp), { h: 150, labels: ['دخل', 'خرج'], colors: ['#34d399', '#f43f5e'] });
      }
    } catch { /* ignore */ }
  });
}
