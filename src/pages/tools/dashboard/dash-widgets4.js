// 🧩 ViXoRa Cockpit Widgets 4 — ۲۰ ویجت تخصصی عمیق
// src/pages/tools/dashboard/dash-widgets4.js
import { esc, faDigits, relTime, fmtCompact } from './dash-state.js';
import { dashSpark, dashRing, dashVBars, dashHBars, dashDonut } from './dash-charts.js';

export const WIDGET4_META = {
  'pomo-stats': { title: 'آمار تمرکز', icon: '📊', desc: 'پومودوروهای امروز و هفته' },
  'mood-chart': { title: 'نمودار حال', icon: '😊', desc: 'حال ۱۴ روز اخیر' },
  'tx-by-day': { title: 'خرج روزانه', icon: '📆', desc: '۳۰ روز گذشته' },
  'top-cats': { title: 'دسته‌های هفته', icon: '🏅', desc: 'رتبه‌بندی خرج' },
  'pl-stats': { title: 'آمار پلی‌لیست', icon: '📑', desc: 'توزیع آهنگ‌ها' },
  'album-wall': { title: 'دیوار آلبوم', icon: '💿', desc: 'آلبوم‌های اخیر' },
  'build-detail': { title: 'جزئیات ساختمان', icon: '🏗', desc: 'واحد به واحد' },
  'game-stats': { title: 'آمار بازی', icon: '🎯', desc: 'توزیع اجراها' },
  'tx-types': { title: 'ترکیب تراکنش', icon: '🥧', desc: 'دخل/خرج/انتقال' },
  'debt-list': { title: 'لیست بدهی', icon: '📋', desc: 'جزئیات هر بدهی' },
  'inv-open': { title: 'فاکتورهای باز', icon: '📄', desc: 'نیازمند پیگیری' },
  'bill-next': { title: 'قبض بعدی', icon: '⏭', desc: 'نزدیک‌ترین سررسید' },
  'note-pinned': { title: 'یادداشت‌های سنجاق', icon: '📌', desc: 'مهم‌ها' },
  'cust-new': { title: 'مشتریان جدید', icon: '🆕', desc: 'این ماه' },
  'song-fresh': { title: 'آهنگ‌های تازه', icon: '✨', desc: 'آخرین اضافه‌ها' },
  'song-liked': { title: 'علاقه‌مندی‌ها', icon: '❤️', desc: 'قلبی‌ها + پخش' },
  'queue-mini': { title: 'صف پخش', icon: '⏭️', desc: 'بعدی‌ها' },
  'vol-ctl': { title: 'کنترل صدا', icon: '🎚', desc: 'ولوم + بالانس' },
  'rate-ctl': { title: 'سرعت پخش', icon: '⏩', desc: '۰٫۵ تا ۲ برابر' },
  'theme-mini': { title: 'تم سریع', icon: '🎨', desc: 'تعویض تم کاکپیت' },
};

export function renderWidget4(id, data, st, ui) {
  switch (id) {
    case 'pomo-stats': return wPomoStats();
    case 'mood-chart': return wMoodChart();
    case 'tx-by-day': return wTxByDay();
    case 'top-cats': return wTopCats();
    case 'pl-stats': return wPlStats(data);
    case 'album-wall': return wAlbumWall(data);
    case 'build-detail': return wBuildDetail(data);
    case 'game-stats': return wGameStats();
    case 'tx-types': return wTxTypes();
    case 'debt-list': return wDebtList(data);
    case 'inv-open': return wInvOpen(data);
    case 'bill-next': return wBillNext(data);
    case 'note-pinned': return wNotePinned(data);
    case 'cust-new': return wCustNew(data);
    case 'song-fresh': return wSongFresh(data);
    case 'song-liked': return wSongLiked(data);
    case 'queue-mini': return wQueueMini();
    case 'vol-ctl': return wVolCtl();
    case 'rate-ctl': return wRateCtl();
    case 'theme-mini': return wThemeMini(ui);
    default: return `<div class="dash-empty">ویجت ناشناس: ${esc(id)}</div>`;
  }
}

/* ---------- آمار تمرکز ---------- */
const POMO_LOG = 'ViXoRa:dash-pomo-log';
export function logPomo(mins) {
  try {
    const log = JSON.parse(localStorage.getItem(POMO_LOG) || '[]');
    log.push({ at: Date.now(), mins });
    localStorage.setItem(POMO_LOG, JSON.stringify(log.slice(-200)));
  } catch { /* ignore */ }
}
function wPomoStats() {
  let log = [];
  try { log = JSON.parse(localStorage.getItem(POMO_LOG) || '[]'); } catch { /* ignore */ }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t0 = today.getTime();
  const tm = log.filter((x) => x.at >= t0).reduce((a, x) => a + (x.mins || 0), 0);
  const wm = log.filter((x) => x.at >= t0 - 6 * 864e5).reduce((a, x) => a + (x.mins || 0), 0);
  const daily = [];
  for (let i = 6; i >= 0; i--) {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - i);
    daily.push(log.filter((x) => x.at >= d0.getTime() && x.at < d0.getTime() + 864e5).reduce((a, x) => a + (x.mins || 0), 0));
  }
  return `<div class="dash-stats"><div><b>${faDigits(String(tm))}</b><span>⏱ امروز (دقیقه)</span></div>
  <div><b>${faDigits(String(wm))}</b><span>📅 هفته</span></div></div>
  <canvas data-dash-chart4="pomo" height="90"></canvas>
  <script type="dash-data" data-dash="pomo-data">${JSON.stringify(daily)}</script>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-pomo-log">➕ ثبت ۲۵ دقیقه دستی</button></div>`;
}

/* ---------- نمودار حال ---------- */
function wMoodChart() {
  let moods = {};
  try { moods = JSON.parse(localStorage.getItem('ViXoRa:dash-moods') || '{}'); } catch { /* ignore */ }
  const vals = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toDateString();
    const m = moods[d];
    vals.push(m === '🤩' ? 5 : m === '🙂' ? 4 : m === '😐' ? 3 : m === '🙁' ? 2 : m === '😭' ? 1 : 0);
  }
  const avg = vals.filter((v) => v > 0);
  const a = avg.length ? (avg.reduce((x, y) => x + y, 0) / avg.length) : 0;
  const face = a >= 4.5 ? '🤩' : a >= 3.5 ? '🙂' : a >= 2.5 ? '😐' : a >= 1.5 ? '🙁' : a > 0 ? '😭' : '—';
  return `<div class="dash-big">${face} <small>میانگین: ${faDigits(a.toFixed(1))} از ۵</small></div>
  <canvas data-dash-chart4="mood" height="90"></canvas>
  <script type="dash-data" data-dash="mood-data">${JSON.stringify(vals)}</script>`;
}

/* ---------- خرج روزانه ---------- */
function wTxByDay() {
  return `<canvas data-dash-chart4="txday" height="120"></canvas><div class="dash-hint">۳۰ روز اخیر (قرمز = خرج)</div>`;
}

/* ---------- دسته‌های هفته ---------- */
function wTopCats() {
  return `<canvas data-dash-chart4="topcats" height="150"></canvas>`;
}

/* ---------- آمار پلی‌لیست ---------- */
function wPlStats(data) {
  const pls = data.music.playlists || [];
  const counts = pls.map((p) => (p.songIds || []).length);
  const total = counts.reduce((a, b) => a + b, 0);
  return `<div class="dash-stats"><div><b>${faDigits(String(pls.length))}</b><span>📝 پلی‌لیست</span></div>
  <div><b>${faDigits(String(total))}</b><span>🎵 عضویت</span></div></div>
  <canvas data-dash-chart4="pls" height="110"></canvas>
  <script type="dash-data" data-dash="pls-data">${JSON.stringify(pls.slice(0, 6).map((p) => ({ label: (p.title || p.name || '').slice(0, 12), value: (p.songIds || []).length })))}</script>`;
}

/* ---------- دیوار آلبوم ---------- */
function wAlbumWall(data) {
  const songs = [...(data.music.all || [])].sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
  const seen = new Set();
  const albums = [];
  for (const s of songs) {
    const k = (s.album || '').trim() || 'تک‌آهنگ';
    if (!seen.has(k) && albums.length < 6) { seen.add(k); albums.push({ name: k, artist: s.artist || '' }); }
  }
  if (!albums.length) return '<div class="dash-empty">💿 آلبومی نیست.</div>';
  return `<div class="dash-qa-grid">${albums.map((a) => `<div class="dash-qa">💿<br /><b>${esc(a.name.slice(0, 18))}</b><br /><small>${esc(a.artist.slice(0, 16))}</small></div>`).join('')}</div>`;
}

/* ---------- جزئیات ساختمان ---------- */
function wBuildDetail(data) {
  const all = data.building.all || [];
  if (!all.length) return '<div class="dash-empty">🏢 ساختمانی نیست.</div>';
  const b = all[0];
  const units = b.units || [];
  return `<div class="dash-hint">🏢 ${esc(b.name || b.title || '')} — ${faDigits(String(units.length))} واحد</div>` +
    (units.slice(0, 6).map((u) => `<div class="dash-rowline"><span class="dash-t">🚪 ${esc(u.no || u.name || u.title || 'واحد')}</span>
      <span class="dash-s">${esc(u.resident || u.owner || 'خالی')}</span></div>`).join('') || '<div class="dash-empty">واحدی تعریف نشده.</div>') +
    (all.length > 1 ? `<div class="dash-hint">+ ${faDigits(String(all.length - 1))} ساختمان دیگر</div>` : '');
}

/* ---------- آمار بازی ---------- */
function wGameStats() {
  let plays = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (k.startsWith('vixora:arcade:plays:')) {
        plays.push({ id: k.replace('vixora:arcade:plays:', ''), n: Number(localStorage.getItem(k)) || 0 });
      }
    }
  } catch { /* ignore */ }
  plays.sort((a, b) => b.n - a.n);
  const top = plays.slice(0, 6);
  if (!top.length) return '<div class="dash-empty">🎮 هنوز بازی نکردی!</div>';
  return `<canvas data-dash-chart4="games" height="150"></canvas>
  <script type="dash-data" data-dash="games-data">${JSON.stringify(top)}</script>`;
}

/* ---------- ترکیب تراکنش ---------- */
function wTxTypes() {
  return `<canvas data-dash-chart4="txtypes" height="150"></canvas>`;
}

/* ---------- لیست بدهی ---------- */
function wDebtList(data) {
  const debts = (data.finance.bundle?.debts || []).filter((d) => !d.settled);
  if (!debts.length) return '<div class="dash-empty">🎉 بدهی نداری!</div>';
  return debts.slice(0, 6).map((d) => {
    const paid = (d.payments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0);
    const total = Number(d.total) || 0;
    const pct = total ? Math.round((paid / total) * 100) : 0;
    return `<div class="dash-goal"><div class="dash-goal-head"><b>${d.debtType === 'loan' ? '🏦' : d.debtType === 'lend' ? '📤' : '📥'} ${esc(d.person || d.title || '')}</b><span>${faDigits(String(pct))}٪</span></div>
    <div class="dash-bar"><i style="width:${pct}%"></i></div></div>`;
  }).join('');
}

/* ---------- فاکتورهای باز ---------- */
function wInvOpen(data) {
  const invs = (data.finance.bundle?.invoices || []).filter((d) => d.status !== 'paid' && d.status !== 'cancelled');
  if (!invs.length) return '<div class="dash-empty">🎉 فاکتور بازی نیست!</div>';
  return invs.slice(0, 6).map((d) => {
    const total = (d.items || []).reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const overdue = d.dueDate && Date.parse(d.dueDate) < Date.now() ? '🔴' : '📄';
    return `<div class="dash-rowline"><span class="dash-t">${overdue} ${esc(d.customer || '')} — ${esc(d.number || '')}</span>
    <span class="dash-n">${fmtCompact(total)}</span></div>`;
  }).join('') + `<div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/invoices">پیگیری ↗</button></div>`;
}

/* ---------- قبض بعدی ---------- */
function wBillNext(data) {
  const bills = (data.finance.bundle?.bills || []).filter((b) => b.active !== false);
  if (!bills.length) return '<div class="dash-empty">💡 قبضی نیست.</div>';
  const today = new Date().getDate();
  const sorted = [...bills].sort((a, b) => {
    const da = (Number(a.dueDay) || 1) - today;
    const db = (Number(b.dueDay) || 1) - today;
    return (da < 0 ? da + 31 : da) - (db < 0 ? db + 31 : db);
  });
  const b = sorted[0];
  const left = (Number(b.dueDay) || 1) - today;
  const days = left < 0 ? left + 31 : left;
  return `<div class="dash-big">${esc(b.icon || '🧾')} ${esc(b.title)}</div>
  <div class="dash-quote">${days === 0 ? '🟡 امروز سررسید است!' : `🟢 ${faDigits(String(days))} روز مانده (روز ${faDigits(String(b.dueDay))})`}</div>
  ${b.expected ? `<div class="dash-hint" style="text-align:center">حدود ${fmtCompact(Number(b.expected))} تومان</div>` : ''}
  <div class="dash-row" style="justify-content:center"><button class="dash-btn dash-btn-sm" data-action="w-bill-paid" data-id="${esc(b.id)}">✅ پرداخت شد</button></div>`;
}

/* ---------- سنجاق‌ها ---------- */
function wNotePinned(data) {
  const pins = (data.notes.all || []).filter((n) => n.pinned || n.favorite);
  if (!pins.length) return '<div class="dash-empty">📌 چیزی سنجاق نشده.</div>';
  return pins.slice(0, 5).map((n) => `<button class="dash-result" data-action="go" data-link="/tools/note">
    <b>📌 ${esc(n.title || (n.body || n.content || '').slice(0, 40) || 'بدون عنوان')}</b></button>`).join('');
}

/* ---------- مشتریان جدید ---------- */
function wCustNew(data) {
  const since = Date.now() - 30 * 864e5;
  const news = (data.customers.all || []).filter((c) => (Date.parse(c.createdAt || c.updatedAt || 0) || 0) >= since);
  return `<div class="dash-big">🆕 ${faDigits(String(news.length))} <small>مشتری این ماه</small></div>` +
    news.slice(0, 4).map((c) => `<div class="dash-rowline"><span class="dash-t">👤 ${esc(c.name || 'بی‌نام')}</span>
      <span class="dash-s">${esc(relTime(Date.parse(c.createdAt || c.updatedAt || 0) || Date.now()))}</span></div>`).join('');
}

/* ---------- آهنگ‌های تازه ---------- */
function wSongFresh(data) {
  const fresh = [...(data.music.all || [])].sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0)).slice(0, 6);
  if (!fresh.length) return '<div class="dash-empty">🎵 آهنگی نیست.</div>';
  return fresh.map((s) => `<div class="dash-rowline"><span class="dash-t">✨ ${esc(s.title || 'بی‌نام')}</span>
    <span class="dash-s">${esc(s.artist || '')}</span>
    <button class="dash-icon-btn" data-action="w-play-song" data-id="${esc(s.id)}">▶</button></div>`).join('');
}

/* ---------- علاقه‌مندی‌ها ---------- */
function wSongLiked(data) {
  const liked = (data.music.all || []).filter((s) => s.liked);
  if (!liked.length) return '<div class="dash-empty">🤍 هنوز چیزی ❤️ نکردی.</div>';
  return `<div class="dash-row"><button class="dash-btn dash-btn-sm dash-btn-primary" data-action="w-radio" data-m="liked">▶ پخش همه (${faDigits(String(liked.length))})</button></div>` +
    liked.slice(0, 5).map((s) => `<div class="dash-rowline"><span class="dash-t">❤️ ${esc(s.title || 'بی‌نام')}</span>
      <button class="dash-icon-btn" data-action="w-play-song" data-id="${esc(s.id)}">▶</button></div>`).join('');
}

/* ---------- صف پخش ---------- */
function wQueueMini() {
  return `<div data-dash="qmini"><div class="dash-empty">⏳…</div></div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-q-shuffle">🔀 بر زدن صف</button>
  <button class="dash-btn dash-btn-sm" data-action="w-q-clear">🧹 پاک کردن صف</button></div>`;
}
export async function tickQueueMini(root) {
  const box = root.querySelector('[data-dash="qmini"]');
  if (!box || !box.isConnected) return;
  try {
    const P = await import('../../../core/services/music-player-service.js');
    const st = P.getPlayerState();
    const q = st.queue || [];
    if (!q.length) { box.innerHTML = '<div class="dash-empty">صف خالی است.</div>'; return; }
    const idx = st.index || 0;
    box.innerHTML = q.slice(idx, idx + 6).map((s, i) => `<div class="dash-rowline ${i === 0 ? 'is-cur' : ''}">
      <span class="dash-t">${i === 0 ? '▶' : faDigits(String(idx + i + 1))} ${esc(s.title || 'بی‌نام')}</span>
      <span class="dash-s">${esc(s.artist || '')}</span></div>`).join('') +
      (q.length - idx > 6 ? `<div class="dash-hint">…و ${faDigits(String(q.length - idx - 6))} تای دیگر</div>` : '');
  } catch { /* ignore */ }
}

/* ---------- کنترل صدا ---------- */
function wVolCtl() {
  return `<div class="dash-form"><label>🔊 ولوم<input type="range" data-dash="mn-vol" min="0" max="100" value="80" /></label>
  <label>⚖️ بالانس (چپ/راست)<input type="range" data-dash="balance" min="-100" max="100" value="0" /></label></div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-mute">🔇 بی‌صدا</button>
  <button class="dash-btn dash-btn-sm" data-action="w-mono">🔊 مونو/استریو</button></div>`;
}

/* ---------- سرعت پخش ---------- */
function wRateCtl() {
  return `<div class="dash-qa-grid">${[['0.5', '۰٫۵x'], ['0.75', '۰٫۷۵x'], ['1', '۱x'], ['1.25', '۱٫۲۵x'], ['1.5', '۱٫۵x'], ['2', '۲x']].map(([v, l]) => `<button class="dash-qa" data-action="w-rate" data-v="${v}">${l}</button>`).join('')}</div>
  <div class="dash-hint">برای پادکست و آموزش عالی است 🎧</div>`;
}

/* ---------- تم سریع ---------- */
function wThemeMini(ui) {
  const themes = [['aurora', 'شفق'], ['ocean', 'اقیانوس'], ['sunset', 'غروب'], ['forest', 'جنگل'], ['royal', 'سلطنتی'], ['mono', 'تک‌رنگ']];
  return `<div class="dash-qa-grid">${themes.map(([v, l]) => `<button class="dash-qa ${ui.theme === v ? 'is-on' : ''}" data-action="w-theme" data-v="${v}">${l}</button>`).join('')}</div>`;
}

/* ================================================================== */
/* پس از رندر                                                             */
/* ================================================================== */
export function afterWidgets4Render(root, data) {
  root.querySelectorAll('[data-dash-chart4]').forEach((cv) => {
    try {
      const kind = cv.dataset.dashChart4;
      const get = (k) => {
        const el = root.querySelector(`[data-dash="${k}"]`);
        return el ? JSON.parse(el.textContent || '[]') : [];
      };
      if (kind === 'pomo') dashVBars(cv, get('pomo-data').map((v, i) => ({ label: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'][(new Date().getDay() - 6 + i + 7) % 7] || '', value: v })), { h: 90 });
      else if (kind === 'mood') dashSpark(cv, get('mood-data'), { h: 90, color: '#fbbf24' });
      else if (kind === 'txday') {
        const txs = data.finance.bundle?.txs || [];
        const daily = [];
        for (let i = 29; i >= 0; i--) {
          const d0 = new Date(); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - i);
          daily.push(txs.filter((t) => {
            const at = Date.parse(t.date || t.createdAt || 0) || 0;
            return t.type === 'expense' && at >= d0.getTime() && at < d0.getTime() + 864e5;
          }).reduce((a, t) => a + (Number(t.amount) || 0), 0));
        }
        dashSpark(cv, daily, { h: 120, color: '#f43f5e' });
      } else if (kind === 'topcats') {
        const now = Date.now();
        const cats = new Map((data.finance.bundle?.categories || []).map((c) => [c.id, c.name || c.title || 'دسته']));
        const byCat = new Map();
        for (const t of data.finance.bundle?.txs || []) {
          const at = Date.parse(t.date || t.createdAt || 0) || 0;
          if (t.type !== 'expense' || at < now - 7 * 864e5) continue;
          byCat.set(t.categoryId || '', (byCat.get(t.categoryId || '') || 0) + (Number(t.amount) || 0));
        }
        dashHBars(cv, [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ label: cats.get(k) || 'بدون دسته', value: v })));
      } else if (kind === 'pls') {
        const rows = get('pls-data');
        dashHBars(cv, rows.length ? rows : [{ label: '—', value: 0 }]);
      } else if (kind === 'games') {
        dashHBars(cv, get('games-data').map((g, i) => ({ label: g.id.slice(0, 16), value: g.n, color: ['#8b5cf6', '#ec4899', '#38bdf8', '#34d399', '#fbbf24', '#f472b6'][i % 6] })));
      } else if (kind === 'txtypes') {
        const txs = data.finance.bundle?.txs || [];
        const since = Date.now() - 30 * 864e5;
        const sum = (ty) => txs.filter((t) => t.type === ty && (Date.parse(t.date || t.createdAt || 0) || 0) >= since).reduce((a, t) => a + (Number(t.amount) || 0), 0);
        dashDonut(cv, [
          { label: 'درآمد', value: sum('income'), color: '#34d399' },
          { label: 'هزینه', value: sum('expense'), color: '#f43f5e' },
          { label: 'انتقال', value: sum('transfer'), color: '#38bdf8' },
        ], { h: 150 });
      }
    } catch { /* ignore */ }
  });
  void dashRing;
}
