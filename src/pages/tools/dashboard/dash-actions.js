// ⚡ ViXoRa Cockpit Actions — همه اکشن‌های ویجت‌ها + تایمرها
// src/pages/tools/dashboard/dash-actions.js
import { faDigits, logActivity, toggleFav, saveDashUi } from './dash-state.js';
import { invalidateDashData } from './dash-data.js';
import { evalCalc } from './dash-widgets2.js';
import { getFocus3 } from './dash-widgets.js';

/* ---------- تایمرهای زنده ---------- */
let clockTimer = 0;
let pomoTimer = 0;
let lyricsTimer = 0;
let queueTimer = 0;
let swState = { running: false, start: 0, acc: 0, laps: [] };
let mnUnsub = null;

export function startDashTimers(root, api) {
  stopDashTimers();
  clockTimer = setInterval(() => {
    tickClock(root);
    try {
      import('./dash-widgets3.js').then((W3) => {
        W3.tickCountdown(root);
        W3.tickWorldClock(root);
      }).catch(() => null);
    try {
      if (root.querySelector('[data-r="queue"]')) import('./dash-remote.js').then((R) => R.tickRemote(root)).catch(() => null);
    } catch { /* ignore */ }
    } catch { /* ignore */ }
  }, 1000);
  tickClock(root);
  import('./dash-widgets3.js').then((W3) => {
    try { W3.tickCountdown(root); W3.tickWorldClock(root); } catch { /* ignore */ }
  }).catch(() => null);
  clearInterval(lyricsTimer);
  lyricsTimer = setInterval(() => {
    import('./dash-widgets3.js').then((W3) => W3.tickLyricsNow(root)).catch(() => null);
  }, 3000);
  clearInterval(queueTimer);
  queueTimer = setInterval(() => {
    import('./dash-widgets4.js').then((W4) => W4.tickQueueMini(root)).catch(() => null);
  }, 5000);
  import('./dash-widgets4.js').then((W4) => W4.tickQueueMini(root)).catch(() => null);
  pomoTimer = setInterval(() => tickPomo(root), 1000);
  tickPomo(root);
  // اشتراک پلیر برای ویجت «در حال پخش»
  import('../../../core/services/music-player-service.js').then((P) => {
    try { mnUnsub = P.subscribeMusicPlayer(() => updateMusicNow(root)); } catch { /* ignore */ }
    updateMusicNow(root);
  }).catch(() => null);
}

export function stopDashTimers() {
  clearInterval(clockTimer);
  clearInterval(pomoTimer);
  try { clearInterval(lyricsTimer); lyricsTimer = 0; } catch { /* ignore */ }
  try { clearInterval(queueTimer); queueTimer = 0; } catch { /* ignore */ }
  clockTimer = 0; pomoTimer = 0;
  try { mnUnsub?.(); } catch { /* ignore */ }
  mnUnsub = null;
}

function tickClock(root) {
  if (!root.isConnected) return;
  const t = root.querySelector('[data-dash="clock-time"]');
  if (!t) return;
  const ui = JSON.parse(localStorage.getItem('ViXoRa:dash-ui-v1') || '{}');
  const now = new Date();
  let h = now.getHours();
  let suffix = '';
  if (!ui.clock24) {
    suffix = h < 12 ? ' ق.ظ' : ' ب.ظ';
    h = h % 12 || 12;
  }
  t.textContent = faDigits(`${String(h).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}${ui.showSeconds ? ':' + String(now.getSeconds()).padStart(2, '0') : ''}`) + suffix;
  const d = root.querySelector('[data-dash="clock-date"]');
  if (d) d.textContent = now.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });
  // کرونومتر
  if (swState.running) {
    const el = root.querySelector('[data-dash="sw"] b');
    if (el) el.textContent = fmtSw(Date.now() - swState.start + swState.acc);
  }
}

function fmtSw(ms) {
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), cs = Math.floor((ms % 1000) / 10);
  return faDigits(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`);
}

const POMO_KEY = 'ViXoRa:dash-pomo';
function getPomo() {
  try { return { mode: 'focus', endAt: 0, left: 25 * 60, ...JSON.parse(localStorage.getItem(POMO_KEY) || '{}') }; }
  catch { return { mode: 'focus', endAt: 0, left: 25 * 60 }; }
}
function setPomo(p) { try { localStorage.setItem(POMO_KEY, JSON.stringify(p)); } catch { /* ignore */ } }

function tickPomo(root) {
  if (!root.isConnected) return;
  const el = root.querySelector('[data-dash="pomo-time"]');
  if (!el) return;
  const p = getPomo();
  let left = p.left;
  if (p.endAt) {
    left = Math.max(0, Math.round((p.endAt - Date.now()) / 1000));
    if (left === 0) {
      setPomo({ ...p, endAt: 0, left: p.mode === 'focus' ? 5 * 60 : 25 * 60, mode: p.mode === 'focus' ? 'break' : 'focus' });
      try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=').play().catch(() => null); } catch { /* ignore */ }
      return;
    }
  }
  el.textContent = faDigits(`${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`);
}

async function updateMusicNow(root) {
  if (!root.isConnected) return;
  const box = root.querySelector('[data-dash="mn"]');
  if (!box) return;
  try {
    const P = await import('../../../core/services/music-player-service.js');
    const st = P.getPlayerState();
    const title = box.querySelector('[data-dash="mn-title"]');
    const artist = box.querySelector('[data-dash="mn-artist"]');
    const pos = box.querySelector('[data-dash="mn-pos"]');
    const dur = box.querySelector('[data-dash="mn-dur"]');
    const prog = box.querySelector('[data-dash="mn-prog"]');
    const btn = root.querySelector('[data-action="w-mn-toggle"]');
    const like = root.querySelector('[data-action="w-mn-like"]');
    if (st.song) {
      if (title) title.textContent = st.song.title || 'بی‌نام';
      if (artist) artist.textContent = st.song.artist || '—';
      const p = st.position || 0, d = st.duration || 0;
      if (pos) pos.textContent = faDigits(fmtT(p));
      if (dur) dur.textContent = faDigits(fmtT(d));
      if (prog) prog.style.width = (d > 0 ? (p / d) * 100 : 0) + '%';
      if (btn) btn.textContent = st.playing ? '⏸' : '▶';
      if (like) like.textContent = st.song.liked ? '❤️' : '🤍';
    } else {
      if (title) title.textContent = 'چیزی پخش نمی‌شود';
      if (artist) artist.textContent = '—';
      if (btn) btn.textContent = '▶';
    }
    const vol = root.querySelector('[data-dash="mn-vol"]');
    if (vol && document.activeElement !== vol) vol.value = Math.round((st.volume ?? 0.8) * 100);
  } catch { /* ignore */ }
}
function fmtT(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

/* ================================================================== */
/* هندلر مرکزی اکشن‌ها                                                    */
/* ================================================================== */
let txType = 'expense';

export async function handleWidgetAction(action, el, api) {
  const { root, toast, data } = api;
  switch (action) {
    /* ----- موزیک ----- */
    case 'w-mn-toggle': {
      const P = await import('../../../core/services/music-player-service.js');
      const st = P.getPlayerState();
      if (!st.song) {
        const songs = data.music.all || [];
        if (songs.length) await P.playSongs(songs, 0);
        else { toast('🎵 آهنگی در کتابخانه نیست.'); return true; }
      } else P.togglePlayback();
      setTimeout(() => updateMusicNow(root), 300);
      return true;
    }
    case 'w-mn-next': {
      const P = await import('../../../core/services/music-player-service.js');
      P.nextTrack(false);
      setTimeout(() => updateMusicNow(root), 300);
      return true;
    }
    case 'w-mn-prev': {
      const P = await import('../../../core/services/music-player-service.js');
      P.prevTrack();
      setTimeout(() => updateMusicNow(root), 300);
      return true;
    }
    case 'w-mn-like': {
      const P = await import('../../../core/services/music-player-service.js');
      const st = P.getPlayerState();
      if (st.song) {
        const L = await import('../../../core/services/music-library-service.js');
        await L.toggleSongLike(st.song.id).catch(() => null);
        invalidateDashData();
        toast(st.song.liked ? '🤍 از علاقه‌مندی حذف شد.' : '❤️ به علاقه‌مندی اضافه شد.');
        setTimeout(() => updateMusicNow(root), 300);
      }
      return true;
    }
    case 'w-play-song': {
      const songs = data.music.all || [];
      const i = songs.findIndex((s) => String(s.id) === String(el.dataset.id));
      if (i >= 0) {
        const P = await import('../../../core/services/music-player-service.js');
        await P.playSongs(songs, i);
        logActivity('🎵', `پخش «${songs[i].title}» از داشبورد`);
        toast(`▶ ${songs[i].title}`);
      }
      return true;
    }
    case 'w-play-pl': {
      const pl = (data.music.playlists || []).find((p) => String(p.id) === String(el.dataset.id));
      if (pl) {
        const songs = (pl.songIds || []).map((id) => (data.music.all || []).find((s) => String(s.id) === String(id))).filter(Boolean);
        if (songs.length) {
          const P = await import('../../../core/services/music-player-service.js');
          await P.playSongs(songs, 0);
          toast(`▶ پلی‌لیست «${pl.title}» در حال پخش است.`);
        } else toast('پلی‌لیست خالی است.');
      }
      return true;
    }
    case 'w-radio': {
      const songs = [...(data.music.all || [])];
      if (!songs.length) { toast('🎵 آهنگی نیست.'); return true; }
      const P = await import('../../../core/services/music-player-service.js');
      const m = el.dataset.m;
      let list = songs;
      if (m === 'liked') list = songs.filter((s) => s.liked);
      else if (m === 'fresh') list = songs.sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0)).slice(0, 25);
      else if (m === 'mix') list = songs.sort(() => Math.random() - 0.5).slice(0, 25);
      else list = songs.sort(() => Math.random() - 0.5);
      if (!list.length) { toast('آهنگی در این حالت نیست.'); return true; }
      await P.playSongs(list, 0);
      toast(`📻 پخش شروع شد (${faDigits(String(list.length))} آهنگ).`);
      logActivity('📻', 'شروع رادیو سریع از داشبورد');
      return true;
    }
    case 'w-session-toggle': {
      const R = await import('../music/music-radio.js');
      const live = R.getLiveSession();
      if (live) {
        const done = R.endSession();
        toast(`⏹ نشست تمام شد: ${faDigits(String(done.plays))} پخش.`);
        logActivity('⏱', `پایان نشست شنیداری (${faDigits(String(Math.round(done.seconds / 60)))} دقیقه)`);
      } else {
        R.startSession();
        toast('⏱ نشست شنیداری شروع شد.');
      }
      api.rerender();
      return true;
    }
    /* ----- اقدام سریع ----- */
    case 'w-qa-shuffle': {
      const songs = [...(data.music.all || [])].sort(() => Math.random() - 0.5);
      if (!songs.length) { toast('🎵 آهنگی نیست.'); return true; }
      const P = await import('../../../core/services/music-player-service.js');
      await P.playSongs(songs, 0);
      toast('🔀 شافل همه شروع شد.');
      return true;
    }
    case 'w-qa-game': {
      const games = data.arcade.all || [];
      if (!games.length) { toast('بازی‌ای نیست.'); return true; }
      const g = games[(Math.random() * games.length) | 0];
      api.navigate(`/tools/entertainment`);
      toast(`🎲 ${g.fa || g.en || g.id} — از آرکید انتخابش کن!`);
      return true;
    }
    case 'w-qa-pomo': {
      setPomo({ mode: 'focus', endAt: Date.now() + 25 * 60 * 1000, left: 25 * 60 });
      toast('🍅 پومودوروی ۲۵ دقیقه‌ای شروع شد!');
      api.rerender();
      return true;
    }
    case 'w-qa-note': {
      const input = root.querySelector('[data-dash="note-q"]');
      if (input) { input.focus(); input.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      else { api.navigate('/tools/note'); }
      return true;
    }
    case 'w-qa-tx': {
      const input = root.querySelector('[data-dash="tx-amount"]');
      if (input) { input.focus(); input.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      else { api.navigate('/tools/invoices'); }
      return true;
    }
    case 'w-qa-cmdk': api.openCmdk(); return true;
    case 'w-qa-guide': api.gotoView('guide'); return true;
    case 'w-qa-export': return doExportAll(api);
    /* ----- تراکنش سریع ----- */
    case 'w-tx-type': {
      txType = el.dataset.v || 'expense';
      root.querySelectorAll('[data-action="w-tx-type"]').forEach((b) => {
        const on = b.dataset.v === txType;
        b.classList.toggle('is-exp', on && txType === 'expense');
        b.classList.toggle('is-inc', on && txType === 'income');
      });
      return true;
    }
    case 'w-tx-save': {
      const amount = Number(root.querySelector('[data-dash="tx-amount"]')?.value) || 0;
      if (amount <= 0) { toast('❌ مبلغ معتبر وارد کن.'); return true; }
      const note = root.querySelector('[data-dash="tx-note"]')?.value?.trim() || '';
      const accountId = root.querySelector('[data-dash="tx-acc"]')?.value || '';
      const categoryId = root.querySelector('[data-dash="tx-cat"]')?.value || '';
      const F = await import('../../../core/services/finance-service.js');
      await F.createTx({ type: txType, amount, note, accountId, categoryId, date: new Date().toISOString() });
      logActivity(txType === 'income' ? '💰' : '💸', `ثبت ${txType === 'income' ? 'درآمد' : 'هزینه'} ${faDigits(amount.toLocaleString('en-US'))} از داشبورد`);
      toast('✅ تراکنش ثبت شد.');
      invalidateDashData();
      await api.reload();
      return true;
    }
    /* ----- ساعت/پومودورو ----- */
    case 'w-clock-toggle': {
      const raw = JSON.parse(localStorage.getItem('ViXoRa:dash-ui-v1') || '{}');
      saveDashUi({ clock24: raw.clock24 === false });
      tickClock(root);
      return true;
    }
    case 'w-sw': {
      const box = root.querySelector('[data-dash="sw"]');
      if (box) box.hidden = !box.hidden;
      return true;
    }
    case 'w-sw-start': {
      if (swState.running) {
        swState.acc += Date.now() - swState.start;
        swState.running = false;
        el.textContent = '▶';
      } else {
        swState.start = Date.now();
        swState.running = true;
        el.textContent = '⏸';
      }
      return true;
    }
    case 'w-sw-lap': {
      if (!swState.running && !swState.acc) return true;
      const cur = Date.now() - (swState.running ? swState.start : Date.now()) + swState.acc;
      swState.laps.unshift(cur);
      swState.laps = swState.laps.slice(0, 5);
      const box = root.querySelector('[data-dash="sw-laps"]');
      if (box) box.innerHTML = swState.laps.map((l, i) => `<span>🏁${faDigits(String(swState.laps.length - i))}: ${fmtSw(l)}</span>`).join('');
      return true;
    }
    case 'w-sw-reset': {
      swState = { running: false, start: 0, acc: 0, laps: [] };
      const b = root.querySelector('[data-dash="sw"] b');
      if (b) b.textContent = faDigits('۰۰:۰۰.۰۰');
      const box = root.querySelector('[data-dash="sw-laps"]');
      if (box) box.innerHTML = '';
      const btn = root.querySelector('[data-action="w-sw-start"]');
      if (btn) btn.textContent = '▶';
      return true;
    }
    case 'w-pomo-toggle': {
      const p = getPomo();
      if (p.endAt) {
        const left = Math.max(0, Math.round((p.endAt - Date.now()) / 1000));
        setPomo({ ...p, endAt: 0, left });
        el.textContent = '▶ شروع';
        toast('⏸ پومودورو متوقف شد.');
      } else {
        const secs = p.left > 0 ? p.left : (p.mode === 'focus' ? 25 * 60 : 5 * 60);
        setPomo({ ...p, endAt: Date.now() + secs * 1000, left: secs });
        el.textContent = '⏸ توقف';
        toast(p.mode === 'focus' ? '🍅 تمرکز شروع شد!' : '☕ استراحت شروع شد!');
      }
      return true;
    }
    case 'w-pomo-mode': {
      const p = getPomo();
      const mode = p.mode === 'focus' ? 'break' : 'focus';
      setPomo({ mode, endAt: 0, left: mode === 'focus' ? 25 * 60 : 5 * 60 });
      api.rerender();
      return true;
    }
    case 'w-pomo-reset': {
      const p = getPomo();
      setPomo({ ...p, endAt: 0, left: p.mode === 'focus' ? 25 * 60 : 5 * 60 });
      api.rerender();
      return true;
    }
    /* ----- عادت‌ها ----- */
    case 'w-habit-toggle': {
      const i = Number(el.dataset.i);
      const all = JSON.parse(localStorage.getItem('ViXoRa:dash-habits') || '[]');
      const h = all[i];
      if (!h) return true;
      const today = new Date().toDateString();
      h.log = h.log || [];
      if (h.log.includes(today)) h.log = h.log.filter((x) => x !== today);
      else {
        h.log.push(today);
        logActivity('🔥', `انجام عادت «${h.name}»`);
      }
      localStorage.setItem('ViXoRa:dash-habits', JSON.stringify(all));
      api.rerender();
      return true;
    }
    case 'w-habit-del': {
      const i = Number(el.dataset.i);
      const all = JSON.parse(localStorage.getItem('ViXoRa:dash-habits') || '[]');
      all.splice(i, 1);
      localStorage.setItem('ViXoRa:dash-habits', JSON.stringify(all));
      api.rerender();
      return true;
    }
    /* ----- متفرقه ----- */
    case 'w-greet-name': {
      const v = prompt('اسمت چیه؟', api.ui.greetName || '');
      if (v !== null) {
        saveDashUi({ greetName: v.trim().slice(0, 30) });
        api.rerender();
      }
      return true;
    }
    case 'w-fav-del': {
      toggleFav(el.dataset.link, '');
      api.rerender();
      return true;
    }
    case 'w-act-clear': {
      const { clearActivity } = await import('./dash-state.js');
      clearActivity();
      api.rerender();
      return true;
    }
    case 'w-storage-clean': {
      const kills = [];
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i) || '';
          if (/:autobackup|:cache|:tmp/.test(k)) { kills.push(k); localStorage.removeItem(k); }
        }
      } catch { /* ignore */ }
      toast(kills.length ? `🧹 ${faDigits(String(kills.length))} کش پاک شد.` : 'چیزی برای پاک‌سازی نبود.');
      api.rerender();
      return true;
    }
    case 'w-quote-next': {
      api.st.quoteShift = (api.st.quoteShift || 0) + 1;
      api.rerender();
      return true;
    }
    case 'w-dice-roll': {
      const v = (Math.random() * 6) | 0;
      api.st.dice = v;
      const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      const box = root.querySelector('[data-widget="dice"] .dash-dice b');
      if (box) {
        let n = 0;
        const iv = setInterval(() => {
          box.textContent = faces[(Math.random() * 6) | 0];
          if (++n > 8) { clearInterval(iv); box.textContent = faces[v]; }
        }, 70);
      }
      const msgs = ['شانس باهاته! 🍀', 'دوباره فکر کن 🤔', 'حتماً انجامش بده! 🚀', 'صبر کن… ⏳', 'بله صددرصد! ✅', 'نه، بیخیال! ❌'];
      api.st.diceOut = `${faces[v]} ${msgs[v]}`;
      const out = root.querySelector('[data-dash="dice-out"]');
      if (out) out.textContent = api.st.diceOut;
      return true;
    }
    case 'w-coin': {
      const win = Math.random() < 0.5;
      api.st.diceOut = win ? '🪙 شیر! (بله)' : '🪙 خط! (نه)';
      const out = root.querySelector('[data-dash="dice-out"]');
      if (out) out.textContent = api.st.diceOut;
      return true;
    }
    case 'w-calc-op': {
      const inp = root.querySelector('[data-dash="calc"]');
      if (!inp) return true;
      const v = el.dataset.v;
      if (v === 'C') { inp.value = ''; api.st.calcQ = ''; api.st.calcOut = '='; }
      else { inp.value += v === '×' ? '*' : v === '÷' ? '/' : v === '−' ? '-' : v; api.st.calcQ = inp.value; doCalc(root, api); }
      return true;
    }
    case 'w-sys-copy': {
      const txt = `ViXoRa Cockpit | ${navigator.userAgent} | ${screen.width}x${screen.height} | ${navigator.onLine ? 'online' : 'offline'}`;
      try { await navigator.clipboard.writeText(txt); toast('📋 کپی شد.'); }
      catch { toast('کپی ناموفق بود.'); }
      return true;
    }
    case 'w-backup-copy': {
      const d = api.data;
      const txt = `ViXoRa: 📝${d.notes.count} 👥${d.customers.count} 🎵${d.music.count} 🧾${d.finance.txs} 🎮${d.arcade.plays}`;
      try { await navigator.clipboard.writeText(txt); toast('📋 خلاصه کپی شد.'); }
      catch { toast('کپی ناموفق بود.'); }
      return true;
    }
    case 'w-eq': {
      const P = await import('../../../core/services/music-player-service.js');
      if (P.setEqPreset) P.setEqPreset(el.dataset.v);
      toast(`🎚 پریست ${el.textContent.trim()} اعمال شد.`);
      return true;
    }
    case 'w-eq-toggle': {
      const P = await import('../../../core/services/music-player-service.js');
      P.toggleEq();
      toast(`🎚 اکولایزر ${P.getPlayerState().eqEnabled ? 'روشن' : 'خاموش'} شد.`);
      return true;
    }
    case 'w-sleep': {
      const P = await import('../../../core/services/music-player-service.js');
      const v = el.dataset.v;
      if (v === 'off') { P.clearSleepTimer(); toast('😴 تایمر خواب لغو شد.'); }
      else if (v === 'track') { P.setSleepTimer({ endOfTrack: true }); toast('😴 توقف در پایان آهنگ.'); }
      else { P.setSleepTimer({ minutes: Number(v) }); toast(`😴 توقف بعد از ${faDigits(v)} دقیقه.`); }
      const stBox = root.querySelector('[data-dash="sleep-state"]');
      if (stBox) {
        const s = P.getPlayerState();
        stBox.textContent = 'وضعیت: ' + (s.sleepEndAt > 0 ? 'فعال ⏳' : s.sleepEndOfTrack ? 'پایان آهنگ 🎵' : 'غیرفعال');
      }
      return true;
    }
    case 'w-ly-open': api.navigate('/tools/music'); return true;
    case 'w-cd-save': {
      const title = root.querySelector('[data-dash="cd-title"]')?.value?.trim() || 'رویداد';
      const at = root.querySelector('[data-dash="cd-at"]')?.value;
      if (!at || Date.parse(at) <= Date.now()) { toast('❌ زمان معتبر در آینده انتخاب کن.'); return true; }
      localStorage.setItem('ViXoRa:dash-countdown', JSON.stringify({ title: title.slice(0, 60), at }));
      toast('⏳ شمارش معکوس ثبت شد.');
      api.rerender();
      return true;
    }
    case 'w-cd-del': {
      localStorage.removeItem('ViXoRa:dash-countdown');
      api.rerender();
      return true;
    }
    case 'w-mood': {
      const moods = JSON.parse(localStorage.getItem('ViXoRa:dash-moods') || '{}');
      moods[new Date().toDateString()] = el.dataset.v;
      localStorage.setItem('ViXoRa:dash-moods', JSON.stringify(moods));
      logActivity(el.dataset.v, 'ثبت حال امروز');
      api.rerender();
      return true;
    }
    case 'w-snd': {
      if (el.dataset.v === 'mute-t') { toast('…سکوت… اگر چیزی نشنیدی یعنی تست موفق بود! 🔇'); return true; }
      const W3 = await import('./dash-widgets3.js');
      W3.playTestSound(el.dataset.v);
      return true;
    }
    case 'w-fact-next': {
      api.st.factShift = (api.st.factShift || 0) + 1;
      api.rerender();
      return true;
    }
    case 'w-pomo-log': {
      const W4 = await import('./dash-widgets4.js');
      W4.logPomo(25);
      logActivity('🍅', 'ثبت دستی ۲۵ دقیقه تمرکز');
      toast('🍅 ثبت شد!');
      api.rerender();
      return true;
    }
    case 'w-bill-paid': {
      const F = await import('../../../core/services/finance-service.js');
      const bill = (data.finance.bundle?.bills || []).find((b) => String(b.id) === String(el.dataset.id));
      if (bill) {
        await F.updateBill(bill.id, { lastPaidAt: new Date().toISOString() }).catch(() => null);
        toast(`✅ «${bill.title}» پرداخت شد.`);
        logActivity('💡', `پرداخت قبض «${bill.title}»`);
        invalidateDashData();
        await api.reload();
      }
      return true;
    }
    case 'w-q-shuffle': {
      const P = await import('../../../core/services/music-player-service.js');
      P.shuffleQueueNow();
      toast('🔀 صف بر زده شد.');
      return true;
    }
    case 'w-q-clear': {
      const P = await import('../../../core/services/music-player-service.js');
      P.clearQueue();
      toast('🧹 صف پاک شد.');
      return true;
    }
    case 'w-mute': {
      const P = await import('../../../core/services/music-player-service.js');
      P.toggleMute();
      toast(P.getPlayerState().muted ? '🔇 بی‌صدا شد.' : '🔊 با صدا شد.');
      return true;
    }
    case 'w-mono': {
      const P = await import('../../../core/services/music-player-service.js');
      const cur = P.getFxState ? P.getFxState().mono : false;
      if (P.setMono) P.setMono(!cur);
      toast(!cur ? '🔊 حالت مونو فعال شد.' : '🎧 حالت استریو.');
      return true;
    }
    case 'w-rate': {
      const P = await import('../../../core/services/music-player-service.js');
      P.setRate(Number(el.dataset.v) || 1);
      toast(`⏩ سرعت ${faDigits(el.dataset.v)}x`);
      return true;
    }
    case 'w-theme': {
      saveDashUi({ theme: el.dataset.v });
      api.rerender();
      return true;
    }
    case 'w-focus-done': {
      const items = getFocus3();
      const i = Number(el.dataset.i);
      if (items[i]) {
        logActivity('🎯', `انجام شد: «${items[i].slice(0, 40)}»`);
        items[i] = '✅ ' + items[i];
        localStorage.setItem('ViXoRa:dash-focus3', JSON.stringify({ day: new Date().toDateString(), items }));
        toast('🎯 آفرین! یکی انجام شد.');
        api.rerender();
      }
      return true;
    }
    /* ----- مرکز اعلان ----- */
    case 'w-notify-open-one': case 'w-notify-go': {
      const { openNotifyItem, updateNotifyBadge } = await import('./dash-notify.js');
      const n = (await import('./dash-notify.js')).getNotifs().find((x) => x.id === el.dataset.id);
      openNotifyItem(el.dataset.id);
      updateNotifyBadge();
      if (n?.link) api.navigate(n.link);
      else { toast(n?.title || '🔔'); api.rerender(); }
      return true;
    }
    case 'w-notify-scan': {
      const { scanReminders, unreadCount } = await import('./dash-notify.js');
      scanReminders();
      const { updateNotifyBadge } = await import('./dash-notify.js');
      updateNotifyBadge();
      toast(`🔍 بررسی شد: ${faDigits(String(unreadCount()))} خوانده‌نشده`);
      api.rerender();
      return true;
    }
    case 'w-notify-del': {
      const { deleteNotif } = await import('./dash-notify.js');
      deleteNotif(el.dataset.id);
      api.rerender();
      return true;
    }
    case 'w-notify-read': {
      const { markAllRead } = await import('./dash-notify.js');
      markAllRead();
      toast('✓ همه خوانده شدند.');
      api.rerender();
      return true;
    }
    case 'w-notify-clear': {
      const { clearNotifs } = await import('./dash-notify.js');
      if (confirm('همه اعلان‌ها پاک شوند؟')) { clearNotifs(); api.rerender(); }
      return true;
    }
    /* ----- تم ----- */
    case 'w-theme-set': {
      const { applyTheme, THEMES } = await import('./dash-themes.js');
      const t = applyTheme(el.dataset.v || 'violet');
      logActivity('🎨', `تم شد: ${t.name}`);
      toast(`🎨 ${t.icon} ${t.name}`);
      api.rerender();
      const { applyTheme: re } = await import('./dash-themes.js');
      try { re(t.id); } catch { /* ignore */ }
      return true;
    }
    case 'w-theme-mode': {
      const { setThemeMode, autoThemeTick } = await import('./dash-themes.js');
      setThemeMode(el.dataset.v || 'manual');
      const t = autoThemeTick();
      toast(el.dataset.v === 'auto' ? '🌗 حالت خودکار شب/روز فعال شد.' : '🖐 حالت دستی.');
      api.rerender();
      try { if (t) { const { applyTheme } = await import('./dash-themes.js'); applyTheme(t.id); } } catch { /* ignore */ }
      return true;
    }
    case 'w-theme-save': {
      const scope = el.closest('.dash-theme-custom') || api.root;
      const g = (sel) => scope.querySelector(sel)?.value;
      const { saveCustomTheme, applyTheme } = await import('./dash-themes.js');
      saveCustomTheme({ c1: g('[data-custom-c1]') || '#7c3aed', c2: g('[data-custom-c2]') || '#ec4899', bg: g('[data-custom-bg]') || '#0f0c29', tx: g('[data-custom-tx]') || '#f4f1ff', name: g('[data-custom-name]') || 'تم من' });
      const t = applyTheme('custom');
      toast(`🖌 «${t.name}» ساخته و اعمال شد!`);
      api.rerender();
      try { applyTheme('custom'); } catch { /* ignore */ }
      return true;
    }
    /* ----- خروجی ----- */
    case 'w-xp-backup': case 'w-xp-tx': case 'w-xp-notes': case 'w-xp-cust': case 'w-xp-vcf': case 'w-xp-ics': case 'w-xp-music': case 'w-xp-m3u': {
      const X = await import('./dash-export.js');
      const map = { 'w-xp-backup': ['exportFullBackup', 'کلید'], 'w-xp-tx': ['exportTxCSV', 'تراکنش'], 'w-xp-notes': ['exportNotesMD', 'یادداشت'], 'w-xp-cust': ['exportCustomersCSV', 'مشتری'], 'w-xp-vcf': ['exportCustomersVCF', 'مخاطب'], 'w-xp-ics': ['exportCalendarICS', 'رویداد'], 'w-xp-music': ['exportMusicJSON', 'آهنگ'], 'w-xp-m3u': ['exportPlaylistM3U', 'آهنگ'] };
      const [fn, label] = map[action];
      const n = X[fn]();
      logActivity('📤', `خروجی: ${label} (${n})`);
      toast(`✅ ${faDigits(String(n))} ${label} خروجی گرفته شد.`);
      return true;
    }
    case 'w-xp-summary': {
      const { buildSummaryText } = await import('./dash-export.js');
      try { await navigator.clipboard.writeText(buildSummaryText()); toast('📋 خلاصه کپی شد.'); }
      catch { toast('❌ کپی نشد.'); }
      return true;
    }
    /* ----- اهداف هفته ----- */
    case 'w-goal-add': {
      const scope = el.closest('.dash-card') || api.root;
      const text = scope.querySelector('[data-goal-text]')?.value.trim();
      const target = +(scope.querySelector('[data-goal-target]')?.value || 5);
      if (!text) { toast('متن هدف را بنویس!'); return true; }
      const { addWeeklyGoal } = await import('./dash-stats.js');
      addWeeklyGoal(text, target);
      logActivity('🏁', `هدف هفته: «${text.slice(0, 30)}»`);
      toast('🏁 هدف اضافه شد.');
      api.rerender();
      return true;
    }
    case 'w-goal-bump': {
      const { bumpWeeklyGoal } = await import('./dash-stats.js');
      bumpWeeklyGoal(el.dataset.id, +(el.dataset.d || 1));
      api.rerender();
      return true;
    }
    case 'w-stats-csv': {
      const { productivityScore } = await import('./dash-stats.js');
      const rows = ['روز,امتیاز'];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        rows.push([d.toLocaleDateString('fa-IR'), productivityScore(d.getTime()).score].join(','));
      }
      const { download } = await import('./dash-export.js');
      download(`vixora-scores-${Date.now()}.csv`, rows.join('\n'), 'text/csv;charset=utf-8');
      toast('✅ خروجی گرفته شد.');
      return true;
    }
    case 'w-goal-del': {
      const { delWeeklyGoal } = await import('./dash-stats.js');
      delWeeklyGoal(el.dataset.id);
      api.rerender();
      return true;
    }
    /* ----- خودکارها ----- */
    case 'w-auto-toggle': {
      const { toggleAutomation } = await import('./dash-automate.js');
      toggleAutomation(el.dataset.id);
      api.rerender();
      return true;
    }
    case 'w-music-open': api.navigate('/tools/music'); return true;
    default: break;
  }
  try {
    const W5 = await import('./dash-widgets5.js');
    if (await W5.handleWidgets5Action(action, el, api)) return true;
  } catch { /* ignore */ }
  if (action.startsWith('w6-')) {
    try { const W6 = await import('./dash-widgets6.js');
      if (await W6.handleWidgets6Action(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('r-')) {
    try { const R = await import('./dash-remote.js');
      if (await R.handleRemoteAction(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('w12-')) {
    try { const W12 = await import('./dash-widgets12.js');
      if (await W12.handleWidgets12Action(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('w11-')) {
    try { const W11 = await import('./dash-widgets11.js');
      if (await W11.handleWidgets11Action(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('rv-')) {
    try { const R = await import('./dash-review.js');
      if (await R.handleReviewAction(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('gl-')) {
    try { const G = await import('./dash-goals.js');
      if (await G.handleGoalsAction(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('w10-')) {
    try { const W10 = await import('./dash-widgets10.js');
      if (await W10.handleWidgets10Action(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('w9-')) {
    try { const W9 = await import('./dash-widgets9.js');
      if (await W9.handleWidgets9Action(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('w8-')) {
    try { const W8 = await import('./dash-widgets8.js');
      if (await W8.handleWidgets8Action(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('w7-')) {
    try { const W7 = await import('./dash-widgets7.js');
      if (await W7.handleWidgets7Action(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('f-')) {
    try { const F = await import('./dash-focus.js');
      if (await F.handleFocusAction(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('cal-')) {
    try { const C = await import('./dash-calendar.js');
      if (await C.handleCalendarAction(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('hb-')) {
    try { const H = await import('./dash-habits.js');
      if (await H.handleHabitsAction(action, el, api)) return true; } catch { /* ignore */ }
  }
  if (action.startsWith('j-')) {
    try { const J = await import('./dash-journal.js');
      if (await J.handleJournalAction(action, el, api)) return true; } catch { /* ignore */ }
  }
  return false;
}

/* ---------- خروجی همه ---------- */
async function doExportAll(api) {
  const { toast, data } = api;
  toast('📥 در حال آماده‌سازی بکاپ…');
  const out = {
    app: 'ViXoRa', at: new Date().toISOString(), version: 1,
    notes: data.notes.all || [],
    customers: data.customers.all || [],
    music: { songs: data.music.all || [], playlists: data.music.playlists || [] },
    finance: data.finance.bundle,
    building: data.building.all || [],
    dash: {
      ui: JSON.parse(localStorage.getItem('ViXoRa:dash-ui-v1') || '{}'),
      layout: JSON.parse(localStorage.getItem('ViXoRa:dash-layout-v1') || '[]'),
      favs: JSON.parse(localStorage.getItem('ViXoRa:dash-fav-v1') || '[]'),
      habits: JSON.parse(localStorage.getItem('ViXoRa:dash-habits') || '[]'),
    },
  };
  const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vixora-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  logActivity('🛟', 'دانلود بکاپ کامل');
  toast('✅ بکاپ دانلود شد.');
  const info = api.root.querySelector('[data-dash="backup-info"]');
  if (info) info.textContent = `آخرین بکاپ: ${new Date().toLocaleString('fa-IR')} • ${faDigits((blob.size / 1024).toFixed(0))}KB`;
  return true;
}

/* ---------- ورودی‌ها ---------- */
export function handleWidgetInput(el, api) {
  const k = el.dataset.dash;
  if (k === 'r-vol' || k === 'r-seek' || k === 'r-bal') {
    import('./dash-remote.js').then((R) => R.handleRemoteInput(k, el)).catch(() => null);
    return;
  }
  if (k === 'gq') {
    clearTimeout(handleWidgetInput._t);
    handleWidgetInput._t = setTimeout(async () => {
      api.st.gq = el.value;
      const { globalSearch } = await import('./dash-data.js');
      const { gqResultsHtml } = await import('./dash-widgets.js');
      const box = api.root.querySelector('[data-dash="gq-results"]');
      if (box && el.isConnected) {
        const res = globalSearch(api.data, el.value);
        api.st.gqResults = gqResultsHtml(res);
        box.innerHTML = api.st.gqResults;
      }
    }, 300);
    return true;
  }
  if (k === 'calc') {
    api.st.calcQ = el.value;
    doCalc(api.root, api);
    return true;
  }
  if (k === 'balance') {
    import('../../../core/services/music-player-service.js').then((P) => {
      try { P.setBalance(Number(el.value) / 100); } catch { /* ignore */ }
    }).catch(() => null);
    return true;
  }
  if (k === 'mn-vol') {
    import('../../../core/services/music-player-service.js').then((P) => {
      try { P.setVolume(Number(el.value) / 100); } catch { /* ignore */ }
    }).catch(() => null);
    return true;
  }
  if (k === 'fx-amt') {
    api.st.fxAmt = el.value;
    clearTimeout(handleWidgetInput._fx);
    handleWidgetInput._fx = setTimeout(() => api.rerender(), 700);
    return true;
  }
  if (k === 'focus') {
    clearTimeout(handleWidgetInput._f);
    handleWidgetInput._f = setTimeout(() => {
      const items = getFocus3();
      items[Number(el.dataset.i)] = el.value.slice(0, 120);
      try { localStorage.setItem('ViXoRa:dash-focus3', JSON.stringify({ day: new Date().toDateString(), items })); } catch { /* ignore */ }
    }, 500);
    return true;
  }
  return false;
}

function doCalc(root, api) {
  const out = root.querySelector('[data-dash="calc-out"]');
  if (!out) return;
  const v = evalCalc(api.st.calcQ);
  api.st.calcOut = v == null ? '؟' : '= ' + faDigits(Number(v.toFixed(4)).toLocaleString('en-US'));
  out.textContent = api.st.calcOut;
}

export function handleWidgetKeydown(e, api) {
  const el = e.target;
  if (el.hasAttribute?.('data-eis') && e.key === 'Enter') {
    el.closest('.dash-eis-q')?.querySelector('[data-action="w9-eis-a"]')?.click();
    return true;
  }
  if (el.hasAttribute?.('data-adv-q') && e.key === 'Enter') {
    import('./dash-widgets8.js').then((W8) => W8.runAdvSearch(el, api)).catch(() => null);
    return true;
  }
  if (el.hasAttribute?.('data-fx-task') && e.key === 'Enter') {
    api.root.querySelector('[data-action="f-task"]')?.click();
    return true;
  }
  if (el.hasAttribute?.('data-hb-name') && e.key === 'Enter') {
    api.root.querySelector('[data-action="hb-add"]')?.click();
    return true;
  }
  if (el.hasAttribute?.('data-task-in') && e.key === 'Enter') {
    el.closest('section')?.querySelector('[data-action="w6-task-add"]')?.click();
    return true;
  }
  if (el.dataset?.dash === 'note-q' && e.key === 'Enter') {
    const v = el.value.trim();
    if (!v) return false;
    import('../../../core/actions/tools-service.js').then(async ({ createToolItem }) => {
      await createToolItem('notes', { title: v.slice(0, 60), body: v, createdAt: new Date().toISOString() });
      logActivity('📝', `یادداشت سریع: «${v.slice(0, 40)}»`);
      api.toast('📝 یادداشت ثبت شد.');
      invalidateDashData();
      await api.reload();
    }).catch(() => api.toast('❌ ثبت ناموفق بود.'));
    return true;
  }
  if (el.dataset?.dash === 'habit-new' && e.key === 'Enter') {
    const v = el.value.trim().slice(0, 60);
    if (!v) return false;
    const all = JSON.parse(localStorage.getItem('ViXoRa:dash-habits') || '[]');
    all.push({ name: v, log: [] });
    localStorage.setItem('ViXoRa:dash-habits', JSON.stringify(all.slice(0, 12)));
    api.toast('🔥 عادت اضافه شد.');
    api.rerender();
    return true;
  }
  if (el.dataset?.dash === 'tx-amount' && e.key === 'Enter') {
    const btn = api.root.querySelector('[data-action="w-tx-save"]');
    btn?.click();
    return true;
  }
  return false;
}
