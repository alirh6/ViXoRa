// 🧩 ViXoRa Cockpit Widgets 3 — ۱۶ ویجت پیشرفته
// src/pages/tools/dashboard/dash-widgets3.js
import { esc, faDigits, relTime, fmtCompact } from './dash-state.js';
import { dashSpark, dashRing, dashDonut, dashHBars, dashGauge } from './dash-charts.js';

export const WIDGET3_META = {
  'lyrics-now': { title: 'بیت جاری', icon: '🎤', desc: 'خط در حال پخش ترانه' },
  'eq-quick': { title: 'اکولایزر سریع', icon: '🎚', desc: 'پریست صدا با یک کلیک' },
  'sleep': { title: 'تایمر خواب', icon: '😴', desc: 'توقف خودکار پخش' },
  'goal-ring': { title: 'حلقه اهداف', icon: '⭕', desc: 'پیشرفت هر هدف' },
  'aging-mini': { title: 'سنی مطالبات', icon: '⏰', desc: 'معوق‌ها یک‌نگاه' },
  'fx-quick': { title: 'نرخ ارز', icon: '💱', desc: 'تبدیل سریع' },
  'game-day': { title: 'بازی امروز', icon: '🕹', desc: 'پیشنهاد روزانه' },
  'note-cal': { title: 'تقویم یادداشت', icon: '🗓', desc: 'پراکندگی ۳۰ روز' },
  'charges': { title: 'شارژ ساختمان', icon: '🧮', desc: 'وضعیت پرداخت‌ها' },
  'storage-detail': { title: 'جزئیات حافظه', icon: '🗄', desc: 'تفکیک مصرف' },
  'countdown': { title: 'شمارش معکوس', icon: '⏳', desc: 'تا رویداد مهم' },
  'world-clock': { title: 'ساعت جهانی', icon: '🌍', desc: 'چند شهر' },
  'streak': { title: 'استریک‌ها', icon: '🔥', desc: 'زنجیره‌های فعال' },
  'fun-fact': { title: 'آمار جالب', icon: '🤯', desc: 'دانستنی از داده‌ات' },
  'rate-day': { title: 'حال امروز', icon: '😊', desc: 'ثبت حال روزانه' },
  'sound-board': { title: 'تخته صدا', icon: '🔊', desc: 'تست صدا و ولوم' },
};

export function renderWidget3(id, data, st, ui) {
  switch (id) {
    case 'lyrics-now': return wLyricsNow();
    case 'eq-quick': return wEqQuick();
    case 'sleep': return wSleep();
    case 'goal-ring': return wGoalRing(data);
    case 'aging-mini': return wAging(data);
    case 'fx-quick': return wFx(st);
    case 'game-day': return wGameDay(data);
    case 'note-cal': return wNoteCal(data);
    case 'charges': return wCharges(data);
    case 'storage-detail': return wStorageDetail();
    case 'countdown': return wCountdown();
    case 'world-clock': return wWorldClock();
    case 'streak': return wStreak();
    case 'fun-fact': return wFunFact(data, st);
    case 'rate-day': return wRateDay();
    case 'sound-board': return wSoundBoard();
    default: return `<div class="dash-empty">ویجت ناشناس: ${esc(id)}</div>`;
  }
}

/* ---------- بیت جاری ---------- */
function wLyricsNow() {
  return `<div class="dash-lyrics-now" data-dash="ly-now"><span>🎤 آهنگی پخش نمی‌شود.</span></div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-ly-open">باز کردن استودیو شعر ↗</button></div>`;
}
export async function tickLyricsNow(root) {
  const box = root.querySelector('[data-dash="ly-now"]');
  if (!box || !box.isConnected) return;
  try {
    const P = await import('../../../core/services/music-player-service.js');
    const st = P.getPlayerState();
    if (!st.song?.id) { box.innerHTML = '<span>🎤 آهنگی پخش نمی‌شود.</span>'; return; }
    const key = `lynow:${st.song.id}`;
    if (box.dataset.key !== key) {
      box.dataset.key = key;
      const L = await import('../../../core/services/music-library-service.js');
      const full = await L.getSong(st.song.id).catch(() => null);
      box.dataset.lrc = full?.lyrics || '';
    }
    const lines = parseLrcMini(box.dataset.lrc || '');
    const pos = st.position || 0;
    if (!lines.length) { box.innerHTML = `<span>🎤 «${esc(st.song.title || '')}» — شعری ثبت نشده.</span>`; return; }
    let cur = 0;
    lines.forEach((l, i) => { if (l.t <= pos) cur = i; });
    const prev = lines[cur - 1], now = lines[cur], next = lines[cur + 1];
    box.innerHTML = `${prev ? `<span class="dim">${esc(prev.x)}</span>` : ''}<b>${esc(now.x)}</b>${next ? `<span class="dim">${esc(next.x)}</span>` : ''}`;
  } catch { /* ignore */ }
}
function parseLrcMini(text) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    const m = line.match(/\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/);
    if (m) out.push({ t: Number(m[1]) * 60 + Number(m[2]), x: m[3].trim() });
  }
  return out.sort((a, b) => a.t - b.t).slice(0, 300);
}

/* ---------- اکولایزر سریع ---------- */
const EQ_PRESETS = [['flat', 'تخت'], ['pop', 'پاپ'], ['rock', 'راک'], ['jazz', 'جاز'], ['bass', 'بم'], ['vocal', 'وکال'], ['dance', 'دنس'], ['lofi', 'لوفای']];
function wEqQuick() {
  return `<div class="dash-qa-grid">${EQ_PRESETS.map(([v, l]) => `<button class="dash-qa" data-action="w-eq" data-v="${v}">${l}</button>`).join('')}</div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-eq-toggle">🎚 روشن/خاموش اکولایزر</button>
  <button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/music">استودیو ↗</button></div>`;
}

/* ---------- تایمر خواب ---------- */
function wSleep() {
  return `<div class="dash-hint">😴 پخش بعد از این مدت خودکار متوقف می‌شود:</div>
  <div class="dash-qa-grid">${[['5', '۵ دقیقه'], ['15', '۱۵ دقیقه'], ['30', '۳۰ دقیقه'], ['60', '۱ ساعت'], ['track', 'پایان آهنگ'], ['off', 'لغو']].map(([v, l]) => `<button class="dash-qa" data-action="w-sleep" data-v="${v}">${l}</button>`).join('')}</div>
  <div class="dash-hint" data-dash="sleep-state">وضعیت: نامشخص</div>`;
}

/* ---------- حلقه اهداف ---------- */
function wGoalRing(data) {
  const goals = data.finance.bundle?.goals || [];
  if (!goals.length) return '<div class="dash-empty">🌟 هدفی نیست.</div>';
  return `<div class="dash-rings">${goals.slice(0, 4).map((g, i) => {
    const cur = Number(g.current ?? g.saved ?? 0), target = Number(g.target ?? g.amount ?? 0) || 1;
    return `<div class="dash-ringbox"><canvas data-dash-chart3="goal" data-i="${i}" height="90"></canvas><span>${esc((g.title || g.name || '').slice(0, 14))}</span></div>`;
  }).join('')}</div><script type="dash-data" data-dash="goals-data">${JSON.stringify(goals.slice(0, 4).map((g) => ({ cur: Number(g.current ?? g.saved ?? 0), target: Number(g.target ?? g.amount ?? 0) || 1 })))}</script>`;
}

/* ---------- سنی مطالبات ---------- */
function wAging(data) {
  let quotes = {};
  try { quotes = JSON.parse(localStorage.getItem('ViXoRa:fin-quotes') || '{}'); } catch { /* ignore */ }
  const invs = (data.finance.bundle?.invoices || []).filter((d) => d.status !== 'paid' && d.status !== 'cancelled' && !quotes[String(d.id)]);
  let pays = {};
  try { pays = JSON.parse(localStorage.getItem('ViXoRa:fin-inv-payments') || '{}'); } catch { /* ignore */ }
  const now = Date.now();
  const sums = [0, 0, 0];
  for (const d of invs) {
    const total = (d.items || []).reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const paid = (pays[String(d.id)] || []).reduce((a, p) => a + (Number(p.amount) || 0), 0);
    const rem = Math.max(0, total - paid);
    if (rem <= 0) continue;
    const due = d.dueDate ? Date.parse(d.dueDate) : NaN;
    const days = Number.isFinite(due) ? Math.floor((now - due) / 864e5) : -1;
    sums[days <= 0 ? 0 : days <= 30 ? 1 : 2] += rem;
  }
  return `<canvas data-dash-chart3="aging" height="110"></canvas>
  <script type="dash-data" data-dash="aging-data">${JSON.stringify(sums)}</script>
  <div class="dash-kv"><span>✅ نرسیده: ${fmtCompact(sums[0])}</span><span>⚠️ ۱-۳۰: ${fmtCompact(sums[1])}</span><span>🔴 ۳۰+: ${fmtCompact(sums[2])}</span></div>`;
}

/* ---------- نرخ ارز ---------- */
function wFx(st) {
  let rates = {};
  try { rates = JSON.parse(localStorage.getItem('ViXoRa:fin-fx') || '{}').rates || {}; } catch { /* ignore */ }
  const amt = Number(st.fxAmt) || 100;
  const usd = Number(rates.USD) || 0;
  return `<div class="dash-row"><input class="dash-input" data-dash="fx-amt" type="number" min="0" value="${amt}" style="max-width:120px" /><span>دلار =</span></div>
  <div class="dash-big">${usd ? fmtCompact(amt * usd) + ' <small>تومان</small>' : 'نرخی ثبت نشده'}</div>
  <div class="dash-hint">💵 دلار: ${usd ? fmtCompact(usd) : '—'} • 💶 یورو: ${rates.EUR ? fmtCompact(Number(rates.EUR)) : '—'} • درهم: ${rates.AED ? fmtCompact(Number(rates.AED)) : '—'}</div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/invoices">تنظیم نرخ‌ها ↗</button></div>`;
}

/* ---------- بازی امروز ---------- */
function wGameDay(data) {
  const games = data.arcade.all || [];
  if (!games.length) return '<div class="dash-empty">بازی‌ای نیست.</div>';
  const day = Math.floor(Date.now() / 864e5);
  const g = games[day % games.length];
  return `<div class="dash-gameday"><b>🕹 ${esc(g.fa || g.en || g.id)}</b><span>${esc((g.descFa || g.descEn || '').slice(0, 90))}</span></div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm dash-btn-primary" data-action="go" data-link="/tools/entertainment">▶ بازی کن</button>
  <button class="dash-btn dash-btn-sm" data-action="w-qa-game">🎲 شانس دیگر</button></div>`;
}

/* ---------- تقویم یادداشت ---------- */
function wNoteCal(data) {
  return `<canvas data-dash-chart3="notecal" height="120"></canvas><div class="dash-hint">یادداشت‌های ۳۰ روز اخیر</div>`;
}

/* ---------- شارژ ساختمان ---------- */
function wCharges(data) {
  const all = data.building.all || [];
  let totalUnits = 0, withRes = 0;
  for (const b of all) {
    const units = b.units || [];
    totalUnits += units.length;
    withRes += units.filter((u) => u.resident || u.owner).length;
  }
  return `<div class="dash-stats"><div><b>${faDigits(String(totalUnits))}</b><span>🚪 واحد</span></div>
  <div><b>${faDigits(String(withRes))}</b><span>👨‍👩‍👧 ساکن‌دار</span></div></div>
  <div class="dash-bar"><i style="width:${totalUnits ? Math.round((withRes / totalUnits) * 100) : 0}%"></i></div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="go" data-link="/tools/building">مدیریت شارژ ↗</button></div>`;
}

/* ---------- جزئیات حافظه ---------- */
function wStorageDetail() {
  const rows = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      const v = (localStorage.getItem(k) || '').length * 2;
      const top = k.split(':').slice(0, 2).join(':');
      const r = rows.find((x) => x.k === top);
      if (r) r.v += v; else rows.push({ k: top, v });
    }
  } catch { /* ignore */ }
  rows.sort((a, b) => b.v - a.v);
  return `<canvas data-dash-chart3="storage" height="150"></canvas>
  <script type="dash-data" data-dash="storage-data">${JSON.stringify(rows.slice(0, 6).map((r) => ({ label: r.k.slice(0, 22), value: Math.round(r.v / 1024) })))}</script>`;
}

/* ---------- شمارش معکوس ---------- */
const CD_KEY = 'ViXoRa:dash-countdown';
export function getCountdown() {
  try { return JSON.parse(localStorage.getItem(CD_KEY) || 'null'); } catch { return null; }
}
function wCountdown() {
  const cd = getCountdown();
  if (!cd?.at) return `<div class="dash-empty">⏳ رویدادی ثبت نشده.</div>
  <div class="dash-row"><input class="dash-input" data-dash="cd-title" placeholder="عنوان…" /><input class="dash-input" data-dash="cd-at" type="datetime-local" /></div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm dash-btn-primary" data-action="w-cd-save">💾 ثبت</button></div>`;
  return `<div class="dash-big" data-dash="cd-left">…</div><div class="dash-hint" style="text-align:center">تا «${esc(cd.title)}»</div>
  <div class="dash-row" style="justify-content:center"><button class="dash-btn dash-btn-sm" data-action="w-cd-del">🗑 حذف</button></div>`;
}
export function tickCountdown(root) {
  const el = root.querySelector('[data-dash="cd-left"]');
  if (!el || !el.isConnected) return;
  const cd = getCountdown();
  if (!cd?.at) return;
  const ms = Date.parse(cd.at) - Date.now();
  if (ms <= 0) { el.textContent = '🎉 رسید!'; return; }
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1000);
  el.textContent = faDigits(`${d} روز ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
}

/* ---------- ساعت جهانی ---------- */
const CITIES = [['تهران', 'Asia/Tehran', '🇮🇷'], ['استانبول', 'Europe/Istanbul', '🇹🇷'], ['دبی', 'Asia/Dubai', '🇦🇪'], ['لندن', 'Europe/London', '🇬🇧'], ['نیویورک', 'America/New_York', '🇺🇸']];
function wWorldClock() {
  return CITIES.map(([fa, tz, flag], i) => `<div class="dash-rowline"><span class="dash-t">${flag} ${fa}</span><b data-dash="wc" data-tz="${tz}">--:--</b></div>`).join('');
}
export function tickWorldClock(root) {
  root.querySelectorAll('[data-dash="wc"]').forEach((el) => {
    if (!el.isConnected) return;
    try {
      el.textContent = faDigits(new Date().toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit', timeZone: el.dataset.tz }));
    } catch { /* ignore */ }
  });
}

/* ---------- استریک‌ها ---------- */
function wStreak() {
  const rows = [];
  let habits = [];
  try { habits = JSON.parse(localStorage.getItem('ViXoRa:dash-habits') || '[]'); } catch { /* ignore */ }
  habits.forEach((h) => {
    const set = new Set(h.log || []);
    let s = 0;
    const d = new Date();
    if (!set.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (set.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
    if (s > 0) rows.push(['🔥', h.name, s]);
  });
  let goals = {};
  try { goals = JSON.parse(localStorage.getItem('ViXoRa:music-goals') || '{}'); } catch { /* ignore */ }
  const log = goals.log || {};
  let ms = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.now() - i * 864e5);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if ((log[k] || 0) >= (goals.dailyMin || 30)) ms++; else if (i > 0) break;
  }
  if (ms > 0) rows.push(['🎧', 'هدف شنیداری', ms]);
  if (!rows.length) return '<div class="dash-empty">🔥 استریک فعالی نیست. یک عادت شروع کن!</div>';
  rows.sort((a, b) => b[2] - a[2]);
  return rows.map(([i, n, s]) => `<div class="dash-rowline"><span class="dash-t">${i} ${esc(n)}</span><b class="dash-n">🔥 ${faDigits(String(s))} روز</b></div>`).join('');
}

/* ---------- آمار جالب ---------- */
const FACTS = [
  (d) => d.music.mins > 0 ? `🎧 تا حالا ${faDigits(String(d.music.mins))} دقیقه موزیک گوش دادی — یعنی ${faDigits((d.music.mins / 60).toFixed(1))} ساعت!` : null,
  (d) => d.finance.txs > 10 ? `🧾 ${faDigits(String(d.finance.txs))} تراکنش ثبت کردی — حسابدار درونت فعاله!` : null,
  (d) => d.notes.count > 5 ? `📝 ${faDigits(String(d.notes.count))} یادداشت داری — ذهن دومت قویه!` : null,
  (d) => d.arcade.plays > 10 ? `🎮 ${faDigits(String(d.arcade.plays))} بار بازی کردی!` : null,
  (d) => d.customers.count > 3 ? `👥 شبکه‌ات ${faDigits(String(d.customers.count))} نفره و growing!` : null,
  () => `🛩 کاکپیت ${faDigits(String(Object.keys(arguments).length))} ویجت دارد — همه را امتحان کردی؟`,
];
function wFunFact(data, st) {
  const valid = FACTS.map((f) => { try { return f(data); } catch { return null; } }).filter(Boolean);
  if (!valid.length) return '<div class="dash-empty">🤯 هنوز داده کافی نیست!</div>';
  const i = ((st.factShift || 0) + Math.floor(Date.now() / 864e5)) % valid.length;
  return `<div class="dash-quote">${esc(valid[i])}</div>
  <div class="dash-row"><button class="dash-btn dash-btn-sm" data-action="w-fact-next">🔀 یکی دیگه</button></div>`;
}

/* ---------- حال امروز ---------- */
const MOOD_KEY = 'ViXoRa:dash-moods';
function wRateDay() {
  const today = new Date().toDateString();
  let moods = {};
  try { moods = JSON.parse(localStorage.getItem(MOOD_KEY) || '{}'); } catch { /* ignore */ }
  const cur = moods[today];
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toDateString();
    week.push(moods[d] || '·');
  }
  return `<div class="dash-moods">${['😭', '🙁', '😐', '🙂', '🤩'].map((m) => `<button class="dash-mood ${cur === m ? 'is-on' : ''}" data-action="w-mood" data-v="${m}">${m}</button>`).join('')}</div>
  <div class="dash-hint">امروز: ${cur || 'ثبت نشده'} • هفته: ${week.join(' ')}</div>`;
}

/* ---------- تخته صدا ---------- */
function wSoundBoard() {
  return `<div class="dash-hint">🔊 تست ولوم و افکت (WebAudio):</div>
  <div class="dash-qa-grid">${[['beep', '🔔 بوق'], ['chime', '🎐 زنگ'], ['pop', '💥 پاپ'], ['mute-t', '🔇 تست سکوت']].map(([v, l]) => `<button class="dash-qa" data-action="w-snd" data-v="${v}">${l}</button>`).join('')}</div>
  <div class="dash-row"><input type="range" data-dash="mn-vol" min="0" max="100" value="80" title="ولوم موزیک" /><span class="dash-hint">ولوم موزیک</span></div>`;
}
export function playTestSound(kind) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const t0 = ctx.currentTime;
    const beep = (f, t, dur = 0.15, type = 'sine', g = 0.25) => {
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = type; o.frequency.value = f;
      gn.gain.setValueAtTime(g, t);
      gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(gn); gn.connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.05);
    };
    if (kind === 'beep') beep(880, t0, 0.2);
    else if (kind === 'chime') { beep(660, t0, 0.3); beep(880, t0 + 0.15, 0.3); beep(1320, t0 + 0.3, 0.4); }
    else if (kind === 'pop') beep(220, t0, 0.12, 'square', 0.2);
    setTimeout(() => ctx.close().catch(() => null), 1500);
  } catch { /* ignore */ }
}

/* ================================================================== */
/* پس از رندر                                                             */
/* ================================================================== */
export function afterWidgets3Render(root, data) {
  root.querySelectorAll('[data-dash-chart3]').forEach((cv) => {
    try {
      const kind = cv.dataset.dashChart3;
      if (kind === 'goal') {
        const d = root.querySelector('[data-dash="goals-data"]');
        const goals = d ? JSON.parse(d.textContent || '[]') : [];
        const g = goals[Number(cv.dataset.i)] || { cur: 0, target: 1 };
        dashRing(cv, g.cur / Math.max(1, g.target), { color: '#a3e635', label: `${Math.round((g.cur / Math.max(1, g.target)) * 100)}٪`, h: 90 });
      } else if (kind === 'aging') {
        const d = root.querySelector('[data-dash="aging-data"]');
        const sums = d ? JSON.parse(d.textContent || '[0,0,0]') : [0, 0, 0];
        dashHBars(cv, [
          { label: 'نرسیده', value: sums[0], color: '#34d399' },
          { label: '۱-۳۰ روز', value: sums[1], color: '#fbbf24' },
          { label: '۳۰+ روز', value: sums[2], color: '#f43f5e' },
        ]);
      } else if (kind === 'notecal') {
        const all = data.notes.all || [];
        const daily = [];
        for (let i = 29; i >= 0; i--) {
          const d0 = new Date(); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - i);
          daily.push(all.filter((n) => {
            const at = Date.parse(n.updatedAt || n.createdAt || 0) || 0;
            return at >= d0.getTime() && at < d0.getTime() + 864e5;
          }).length);
        }
        dashSpark(cv, daily, { h: 120, color: '#38bdf8' });
      } else if (kind === 'storage') {
        const d = root.querySelector('[data-dash="storage-data"]');
        const rows = d ? JSON.parse(d.textContent || '[]') : [];
        dashHBars(cv, rows.map((r, i) => ({ ...r, color: ['#8b5cf6', '#ec4899', '#38bdf8', '#34d399', '#fbbf24', '#f472b6'][i % 6] })));
      }
    } catch { /* ignore */ }
  });
  void dashDonut; void dashGauge;
}
