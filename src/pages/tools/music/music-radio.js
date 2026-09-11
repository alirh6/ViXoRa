// 📻 ViXoRa Radio — ایستگاه هوشمند، کشف، نشست شنیداری، اهداف، آلارم بیداری
import { faDigits } from '../../../core/schemas/music-schema.js';
import { getHistoryWithSongs, getHistory } from '../../../core/services/music-library-service.js';
import {
  getPlayerState, playSongs, setQueue, playIndex, togglePlayback,
} from '../../../core/services/music-player-service.js';
import { drawSpark, drawVBars } from './music-charts.js';

const UI_KEY = 'ViXoRa:music-radio-ui';
const GOAL_KEY = 'ViXoRa:music-goals';
const SESSION_KEY = 'ViXoRa:music-sessions';
const ALARM_KEY = 'ViXoRa:music-alarm';

function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
function loadUi() {
  try { return { seedId: '', station: [], mode: '', energy: 2, ...JSON.parse(localStorage.getItem(UI_KEY) || '{}') }; }
  catch { return { seedId: '', station: [], mode: '', energy: 2 }; }
}
function saveUi(patch) {
  const u = { ...loadUi(), ...patch };
  try { localStorage.setItem(UI_KEY, JSON.stringify(u)); } catch { /* ignore */ }
  return u;
}
function loadGoals() { try { return { dailyMin: 30, log: {}, ...JSON.parse(localStorage.getItem(GOAL_KEY) || '{}') }; } catch { return { dailyMin: 30, log: {} }; } }
function saveGoals(g) { try { localStorage.setItem(GOAL_KEY, JSON.stringify(g)); } catch { /* ignore */ } }
function loadSessions() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'); } catch { return []; } }
function saveSessions(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s.slice(-60))); } catch { /* ignore */ } }
function loadAlarm() { try { return JSON.parse(localStorage.getItem(ALARM_KEY) || 'null'); } catch { return null; } }
function saveAlarm(a) { try { a ? localStorage.setItem(ALARM_KEY, JSON.stringify(a)) : localStorage.removeItem(ALARM_KEY); } catch { /* ignore */ } }
export function getRadioAlarm() { return loadAlarm(); }

function dayKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function norm(s) { return String(s || '').trim().toLowerCase(); }

/* ---------- موتور شباهت ---------- */
const ENERGY = { rock: 3, metal: 3, pop: 2, dance: 3, electronic: 3, hiphop: 3, jazz: 1, classical: 1, ambient: 1, lofi: 1, سنتی: 1, پاپ: 2, رپ: 3, راک: 3 };
function energyOf(s) {
  const g = norm(s.genre);
  for (const [k, v] of Object.entries(ENERGY)) if (g.includes(k)) return v;
  return 2;
}
function similarity(seed, cand) {
  let sc = 0;
  if (norm(seed.genre) && norm(seed.genre) === norm(cand.genre)) sc += 5;
  if (norm(seed.artist) && norm(seed.artist) === norm(cand.artist)) sc += 4;
  if (norm(seed.album) && norm(seed.album) === norm(cand.album)) sc += 2;
  if (Math.abs(energyOf(seed) - energyOf(cand)) <= 1) sc += 2;
  if (String(seed.year || '').slice(0, 3) && String(seed.year || '').slice(0, 3) === String(cand.year || '').slice(0, 3)) sc += 1;
  sc += Math.min(2, (cand.rating || 0) / 2.5);
  sc += Math.random() * 1.5;
  return sc;
}
export function buildStation(songs, seedId, n = 25) {
  const seed = songs.find((s) => String(s.id) === String(seedId)) || songs[0];
  if (!seed) return { seed: null, list: [] };
  const rest = songs.filter((s) => String(s.id) !== String(seed.id));
  rest.sort((a, b) => similarity(seed, b) - similarity(seed, a));
  return { seed, list: [seed, ...rest.slice(0, n - 1)] };
}

/* ---------- حالت‌های کشف ---------- */
export async function discoveryLists(songs) {
  const hist = await getHistoryWithSongs().catch(() => []);
  const lastPlay = new Map();
  hist.forEach((h) => {
    const id = String(h.songId || h.song?.id || '');
    const at = Date.parse(h.at || h.playedAt || 0) || 0;
    if (id && (!lastPlay.has(id) || lastPlay.get(id) < at)) lastPlay.set(id, at);
  });
  const now = Date.now();
  const week = 7 * 864e5;
  const forgotten = songs.filter((s) => (s.rating || 0) >= 4 && (!lastPlay.has(String(s.id)) || now - lastPlay.get(String(s.id)) > 30 * 864e5));
  const unplayed = songs.filter((s) => !(s.playCount > 0));
  const fresh = [...songs].sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0)).slice(0, 25);
  const topRated = songs.filter((s) => (s.rating || 0) >= 4).sort((a, b) => (b.rating - a.rating) || ((b.playCount || 0) - (a.playCount || 0))).slice(0, 25);
  const deep = songs.filter((s) => (s.playCount || 0) <= 2 && (s.rating || 0) >= 3);
  const liked = songs.filter((s) => s.liked);
  return { forgotten, unplayed, fresh, topRated, deep, liked, lastPlay };
}

/* ---------- نشست ---------- */
let sessionLive = null;
export function getLiveSession() { return sessionLive; }
export function startSession() {
  sessionLive = { startedAt: Date.now(), plays: 0, seconds: 0, trackIds: [] };
  return sessionLive;
}
export function noteSessionPlay(songId, seconds) {
  if (!sessionLive) return;
  sessionLive.plays++;
  sessionLive.seconds += seconds || 0;
  if (songId) sessionLive.trackIds.push(String(songId));
}
export function endSession() {
  if (!sessionLive) return null;
  const done = { ...sessionLive, endedAt: Date.now() };
  const all = loadSessions();
  all.push(done);
  saveSessions(all);
  // ثبت در هدف روزانه
  const g = loadGoals();
  const k = dayKey();
  g.log[k] = (g.log[k] || 0) + Math.round(done.seconds / 60);
  saveGoals(g);
  sessionLive = null;
  return done;
}

/* ---------- آلارم بیداری ---------- */
let alarmTimer = 0;
export function scheduleAlarmCheck(onFire) {
  clearTimeout(alarmTimer);
  const tick = () => {
    const a = loadAlarm();
    if (a?.at && Date.now() >= a.at) {
      saveAlarm(null);
      try { onFire?.(a); } catch { /* ignore */ }
    }
    alarmTimer = setTimeout(tick, 15000);
  };
  alarmTimer = setTimeout(tick, 5000);
}
export function clearAlarmTimer() { clearTimeout(alarmTimer); }

/* ---------- توقف بعد از N ---------- */
let stopAfter = 0;
export function setStopAfter(n) { stopAfter = Math.max(0, Number(n) || 0); }
export function getStopAfter() { return stopAfter; }
export function noteTrackAdvanced() {
  if (stopAfter > 0) {
    stopAfter--;
    if (stopAfter === 0) {
      const { pausePlayback } = requirePlayback();
      try { pausePlayback(); } catch { /* ignore */ }
      return true;
    }
  }
  return false;
}
import { pausePlayback as _pause } from '../../../core/services/music-player-service.js';
function requirePlayback() { return { pausePlayback: _pause }; }

/* ---------- رندر ---------- */
export function renderRadioView(lib, snap, api) {
  const ui = loadUi();
  const songs = lib.songs || [];
  const goals = loadGoals();
  const sessions = loadSessions();
  const alarm = loadAlarm();
  const todayMin = goals.log[dayKey()] || 0;
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    last7.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, value: goals.log[dayKey(d)] || 0 });
  }
  const streak = (() => {
    let s = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(Date.now() - i * 864e5);
      if ((goals.log[dayKey(d)] || 0) >= (goals.dailyMin || 30)) s++; else if (i > 0) break;
    }
    return s;
  })();

  const seedOpts = songs.slice(0, 500).map((s) =>
    `<option value="${esc(s.id)}" ${String(s.id) === String(ui.seedId || snap.song?.id) ? 'selected' : ''}>${esc(s.title || 'بی‌نام')} — ${esc(s.artist || '')}</option>`
  ).join('');
  const station = ui.station.map((id) => songs.find((s) => String(s.id) === String(id))).filter(Boolean);

  return `
  <div class="mx-secbar"><h3>📻 رادیو و کشف</h3>
    <div class="mx-secbar-actions">
      <button class="mx-btn mx-btn--sm" data-action="rd-surprise">🎲 سوپرایزم کن</button>
      <button class="mx-btn mx-btn--sm" data-action="rd-daily-mix">🌀 میکس امروز من</button>
    </div>
  </div>
  <div class="mx-grid-2">
    <div class="mx-panel"><h4>📡 ساخت ایستگاه از روی آهنگ</h4>
      <div class="mx-form-grid">
        <label>آهنگ مبنا<select data-rd="seed">${seedOpts || '<option value="">— خالی —</option>'}</select></label>
        <label>تعداد<select data-rd="count"><option>15</option><option selected>25</option><option>40</option><option>60</option></select></label>
        <label>انرژی<select data-rd="energy"><option value="0">😌 آرام</option><option value="1">🙂 متعادل</option><option value="2" selected>⚡ هرچی</option><option value="3">🔥 پرانرژی</option></select></label>
      </div>
      <div class="mx-btn-row">
        <button class="mx-btn mx-btn--primary" data-action="rd-build">📡 ساخت ایستگاه</button>
        ${station.length ? `<button class="mx-btn" data-action="rd-play-station">▶ پخش ایستگاه (${faDigits(String(station.length))})</button>
        <button class="mx-btn mx-btn--sm" data-action="rd-shuffle-station">🔀 بر زدن ایستگاه</button>` : ''}
      </div>
      ${station.length ? `<div class="mx-lab-list">${station.slice(0, 12).map((s, i) => `<div class="mx-lab-row"><b class="mx-num">${faDigits(String(i + 1))}</b><span class="mx-lab-title">${esc(s.title)}</span><span class="mx-lab-sub">${esc(s.artist || '')} • ${esc(s.genre || '')}</span></div>`).join('')}${station.length > 12 ? `<div class="mx-hint">…و ${faDigits(String(station.length - 12))} تای دیگر</div>` : ''}</div>` : '<div class="mx-hint">یک آهنگ مبنا انتخاب کن تا ایستگاه مشابهش ساخته شود.</div>'}
    </div>
    <div class="mx-panel"><h4>🧭 حالت‌های کشف</h4>
      <div class="mx-discover-grid">
        <button class="mx-discover" data-action="rd-mode" data-m="forgotten">💎<b>جواهرات فراموش‌شده</b><span>امتیاز بالا، مدت‌ها پخش‌نشده</span></button>
        <button class="mx-discover" data-action="rd-mode" data-m="unplayed">🆕<b>کشف‌نشده‌ها</b><span>هرگز گوش نداده‌ای</span></button>
        <button class="mx-discover" data-action="rd-mode" data-m="fresh">✨<b>تازه‌واردها</b><span>آخرین اضافه‌شده‌ها</span></button>
        <button class="mx-discover" data-action="rd-mode" data-m="topRated">🏆<b>بهترین‌ها</b><span>بالاترین امتیازها</span></button>
        <button class="mx-discover" data-action="rd-mode" data-m="deep">🕳<b>دیپ‌کات‌ها</b><span>کم‌شنیده + خوب</span></button>
        <button class="mx-discover" data-action="rd-mode" data-m="liked">❤️<b>علاقه‌مندی‌ها</b><span>قلبی‌های تو</span></button>
      </div>
      <div data-rd="mode-result">${ui.modeResult || ''}</div>
    </div>
  </div>
  <div class="mx-grid-2">
    <div class="mx-panel"><h4>🎯 هدف شنیداری روزانه</h4>
      <div class="mx-stats-row"><span class="mx-stat">🔥 ${faDigits(String(streak))} روز استریک</span>
      <span class="mx-stat">⏱ امروز ${faDigits(String(todayMin))}/${faDigits(String(goals.dailyMin))} دقیقه</span></div>
      <canvas data-rd="goal-chart" width="300" height="150"></canvas>
      <div class="mx-form-grid"><label>هدف روزانه (دقیقه)<input type="number" min="5" max="600" value="${goals.dailyMin}" data-rd="goal-input" /></label></div>
      <div class="mx-btn-row"><button class="mx-btn mx-btn--sm mx-btn--primary" data-action="rd-goal-save">💾 ذخیره هدف</button></div>
    </div>
    <div class="mx-panel"><h4>⏱ نشست شنیداری ${sessionLive ? '(فعال 🟢)' : ''}</h4>
      ${sessionLive ? `<div class="mx-stats-row"><span class="mx-stat">▶ ${faDigits(String(sessionLive.plays))} پخش</span>
        <span class="mx-stat">⏱ ${faDigits(String(Math.round(sessionLive.seconds / 60)))} دقیقه</span></div>
        <div class="mx-btn-row"><button class="mx-btn mx-btn--sm" data-action="rd-session-end">⏹ پایان نشست</button></div>`
        : `<div class="mx-hint">نشست را شروع کن؛ تعداد پخش و دقایق گوش‌دادن ثبت می‌شود و در هدف روزانه حساب می‌آید.</div>
        <div class="mx-btn-row"><button class="mx-btn mx-btn--sm mx-btn--primary" data-action="rd-session-start">⏱ شروع نشست</button></div>`}
      <h4>🕘 نشست‌های اخیر</h4>
      <div class="mx-lab-list">${sessions.slice(-5).reverse().map((s) => `<div class="mx-lab-row"><span class="mx-lab-title">${new Date(s.startedAt).toLocaleDateString('fa-IR')} • ${faDigits(String(s.plays))} پخش</span><span class="mx-lab-sub">${faDigits(String(Math.round(s.seconds / 60)))} دقیقه</span></div>`).join('') || '<div class="mx-empty">نشستی ثبت نشده.</div>'}</div>
    </div>
  </div>
  <div class="mx-grid-2">
    <div class="mx-panel"><h4>⏰ آلارم بیداری با موزیک ${alarm ? '🟢' : '⚪'}</h4>
      ${alarm ? `<div class="mx-stats-row"><span class="mx-stat">🔔 ${new Date(alarm.at).toLocaleString('fa-IR')}</span><span class="mx-stat">🎵 ${esc(alarm.label || 'صف فعلی')}</span></div>
        <div class="mx-btn-row"><button class="mx-btn mx-btn--sm mx-btn--danger" data-action="rd-alarm-clear">لغو آلارم</button></div>`
      : `<div class="mx-form-grid"><label>زمان<input type="datetime-local" data-rd="alarm-at" /></label>
        <label>منبع پخش<select data-rd="alarm-src"><option value="queue">صف فعلی</option><option value="liked">❤️ علاقه‌مندی‌ها</option><option value="mix">🌀 میکس تصادفی</option></select></label></div>
        <div class="mx-btn-row"><button class="mx-btn mx-btn--sm mx-btn--primary" data-action="rd-alarm-set">🔔 تنظیم آلارم</button></div>
        <div class="mx-hint">در زمان مقرر (اگر اپ باز باشد) پخش شروع می‌شود.</div>`}
    </div>
    <div class="mx-panel"><h4>🛑 توقف هوشمند</h4>
      <div class="mx-stats-row"><span class="mx-stat">⏭ ${getStopAfter() ? `توقف بعد از ${faDigits(String(getStopAfter()))} آهنگ` : 'غیرفعال'}</span></div>
      <div class="mx-btn-row">
        <button class="mx-btn mx-btn--sm" data-action="rd-stop-after" data-n="1">بعد از ۱</button>
        <button class="mx-btn mx-btn--sm" data-action="rd-stop-after" data-n="3">بعد از ۳</button>
        <button class="mx-btn mx-btn--sm" data-action="rd-stop-after" data-n="5">بعد از ۵</button>
        <button class="mx-btn mx-btn--sm" data-action="rd-stop-after" data-n="0">لغو</button>
      </div>
      <div class="mx-hint">برای خواب یا تمرکز: بعد از چند آهنگ، پخش خودکار متوقف می‌شود.</div>
      <h4>🎉 حالت مهمانی</h4>
      <div class="mx-btn-row"><button class="mx-btn mx-btn--sm" data-action="rd-party">🎉 شروع حالت مهمانی (تمام‌صفحه + شافل)</button></div>
    </div>
  </div>`;
}

export function afterRadioRender(root) {
  const c = root.querySelector('[data-rd="goal-chart"]');
  if (c) {
    const goals = loadGoals();
    const pts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      pts.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, value: goals.log[dayKey(d)] || 0 });
    }
    drawSpark(c, pts.map((p) => p.value), { h: 90, color: '#34d399' });
  }
}

function modeResultHtml(name, list) {
  if (!list.length) return `<div class="mx-empty">در این حالت چیزی پیدا نشد.</div>`;
  return `<div class="mx-hint">🎧 ${esc(name)} — ${faDigits(String(list.length))} آهنگ</div>
  <div class="mx-btn-row"><button class="mx-btn mx-btn--sm mx-btn--primary" data-action="rd-play-mode">▶ پخش همه</button>
  <button class="mx-btn mx-btn--sm" data-action="rd-queue-mode">➕ افزودن به صف</button></div>
  <div class="mx-lab-list">${list.slice(0, 10).map((s) => `<div class="mx-lab-row"><span class="mx-lab-title">${esc(s.title)}</span><span class="mx-lab-sub">${esc(s.artist || '')}</span></div>`).join('')}</div>`;
}
let lastModeList = [];

export async function handleRadioAction(action, el, api) {
  const { lib, root, toast, renderContent } = api;
  const songs = lib.songs || [];
  const ui = loadUi();
  switch (action) {
    case 'rd-build': {
      const seedId = root.querySelector('[data-rd="seed"]')?.value || '';
      const count = Number(root.querySelector('[data-rd="count"]')?.value || 25);
      const energy = Number(root.querySelector('[data-rd="energy"]')?.value ?? 2);
      let { seed, list } = buildStation(songs, seedId, count + 10);
      if (energy === 0) list = list.filter((s) => energyOf(s) <= 1);
      if (energy === 1) list = list.filter((s) => energyOf(s) === 2);
      if (energy === 3) list = list.filter((s) => energyOf(s) >= 3);
      list = list.slice(0, count);
      saveUi({ seedId, station: list.map((s) => String(s.id)) });
      toast.success(`📡 ایستگاه «${seed ? seed.title : ''}» با ${faDigits(String(list.length))} آهنگ ساخته شد.`);
      renderContent();
      return true;
    }
    case 'rd-play-station': {
      const list = ui.station.map((id) => songs.find((s) => String(s.id) === String(id))).filter(Boolean);
      if (!list.length) return true;
      await playSongs(list, 0);
      toast.success('▶ ایستگاه در حال پخش است.');
      return true;
    }
    case 'rd-shuffle-station': {
      const st = [...ui.station];
      for (let i = st.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[st[i], st[j]] = [st[j], st[i]]; }
      saveUi({ station: st });
      renderContent();
      return true;
    }
    case 'rd-mode': {
      const m = el.dataset.m;
      const D = await discoveryLists(songs);
      const names = { forgotten: 'جواهرات فراموش‌شده', unplayed: 'کشف‌نشده‌ها', fresh: 'تازه‌واردها', topRated: 'بهترین‌ها', deep: 'دیپ‌کات‌ها', liked: 'علاقه‌مندی‌ها' };
      lastModeList = D[m] || [];
      const box = root.querySelector('[data-rd="mode-result"]');
      if (box) box.innerHTML = modeResultHtml(names[m] || m, lastModeList);
      return true;
    }
    case 'rd-play-mode': {
      if (!lastModeList.length) return true;
      await playSongs(lastModeList, 0);
      return true;
    }
    case 'rd-queue-mode': {
      if (!lastModeList.length) return true;
      const snap = getPlayerState();
      setQueue([...(snap.queue || []), ...lastModeList]);
      toast.success(`➕ ${faDigits(String(lastModeList.length))} آهنگ به صف اضافه شد.`);
      return true;
    }
    case 'rd-surprise': {
      if (!songs.length) return true;
      const pick = songs[(Math.random() * songs.length) | 0];
      await playSongs([pick], 0);
      toast.success(`🎲 ${pick.title} — ${pick.artist || ''}`);
      return true;
    }
    case 'rd-daily-mix': {
      if (!songs.length) return true;
      const D = await discoveryLists(songs);
      const pool = [...(D.topRated || []).slice(0, 8), ...(D.forgotten || []).slice(0, 6), ...(D.fresh || []).slice(0, 6), ...(D.liked || []).slice(0, 6)];
      const uniq = [...new Map(pool.map((s) => [String(s.id), s])).values()];
      for (let i = uniq.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[uniq[i], uniq[j]] = [uniq[j], uniq[i]]; }
      const mix = uniq.slice(0, 25);
      if (!mix.length) { toast.warning('آهنگی نیست.'); return true; }
      await playSongs(mix, 0);
      toast.success(`🌀 میکس امروز: ${faDigits(String(mix.length))} آهنگ.`);
      return true;
    }
    case 'rd-goal-save': {
      const v = Math.min(600, Math.max(5, Number(root.querySelector('[data-rd="goal-input"]')?.value || 30)));
      const g = loadGoals();
      g.dailyMin = v;
      saveGoals(g);
      toast.success('💾 هدف ذخیره شد.');
      renderContent();
      return true;
    }
    case 'rd-session-start': startSession(); toast.success('⏱ نشست شروع شد.'); renderContent(); return true;
    case 'rd-session-end': {
      const done = endSession();
      if (done) toast.success(`⏹ نشست تمام شد: ${faDigits(String(done.plays))} پخش، ${faDigits(String(Math.round(done.seconds / 60)))} دقیقه.`);
      renderContent();
      return true;
    }
    case 'rd-alarm-set': {
      const atRaw = root.querySelector('[data-rd="alarm-at"]')?.value;
      const src = root.querySelector('[data-rd="alarm-src"]')?.value || 'queue';
      const at = atRaw ? Date.parse(atRaw) : NaN;
      if (!Number.isFinite(at) || at <= Date.now()) { toast.warning('زمان معتبر در آینده انتخاب کن.'); return true; }
      const labels = { queue: 'صف فعلی', liked: 'علاقه‌مندی‌ها', mix: 'میکس تصادفی' };
      saveAlarm({ at, src, label: labels[src] });
      toast.success('🔔 آلارم تنظیم شد.');
      renderContent();
      return true;
    }
    case 'rd-alarm-clear': saveAlarm(null); renderContent(); return true;
    case 'rd-stop-after': {
      setStopAfter(Number(el.dataset.n || 0));
      toast.info(getStopAfter() ? `🛑 توقف بعد از ${faDigits(String(getStopAfter()))} آهنگ.` : '🛑 توقف هوشمند لغو شد.');
      renderContent();
      return true;
    }
    case 'rd-party': {
      document.documentElement.requestFullscreen?.().catch(() => null);
      const { toggleShuffle } = await import('../../../core/services/music-player-service.js');
      const st = getPlayerState();
      if (!st.shuffle) toggleShuffle();
      if (!st.song && songs.length) await playSongs(songs, 0);
      else togglePlayback();
      toast.success('🎉 حالت مهمانی! (Esc برای خروج از تمام‌صفحه)');
      return true;
    }
    default: return false;
  }
}
