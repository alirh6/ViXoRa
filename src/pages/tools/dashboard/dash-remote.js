// 🎛 ViXoRa Music Remote — کنترل کامل پلیر از کاکپیت
// src/pages/tools/dashboard/dash-remote.js
import { esc } from './dash-state.js';

const P = () => import('../../../core/services/music-player-service.js');
const fmtT = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const EQ_PRESETS = [['flat', '⬜ فلت'], ['pop', '🎤 پاپ'], ['rock', '🎸 راک'], ['jazz', '🎷 جز'], ['bass', '🥁 بیس'], ['classical', '🎻 کلاسیک'], ['vocal', '🗣 وکال'], ['dance', '💃 دنس']];

export function renderRemote() {
  return `<div class="dash-rm-wrap">
    <div class="dash-rm-head"><b>🎛 ریموت موزیک</b>
      <span class="dash-row"><button class="dash-btn xs" data-action="go" data-link="/tools/music">🎵 پلیر کامل ↗</button></span></div>
    <div class="dash-rm-grid">
      <div class="dash-card dash-rm-now">
        <div class="dash-rm-cover" data-r="cover">🎵</div>
        <div class="dash-rm-meta"><b data-r="title">—</b><small data-r="artist">پلیر خالی است</small>
          <small data-r="ctx"></small></div>
        <input type="range" class="dash-rm-seek" data-dash="r-seek" min="0" max="1000" value="0" aria-label="جستجو در آهنگ">
        <div class="dash-rm-times"><span data-r="cur">۰:۰۰</span><span data-r="dur">۰:۰۰</span></div>
        <div class="dash-rm-transport">
          <button class="dash-btn" data-action="r-shuffle" data-r="shuffle" title="شافل">🔀</button>
          <button class="dash-btn" data-action="r-prev" title="قبلی">⏮</button>
          <button class="dash-btn dash-btn-primary dash-rm-play" data-action="r-toggle" data-r="play">▶</button>
          <button class="dash-btn" data-action="r-next" title="بعدی">⏭</button>
          <button class="dash-btn" data-action="r-repeat" data-r="repeat" title="تکرار">🔁</button>
        </div>
        <div class="dash-rm-sliders">
          <label>🔊<input type="range" data-dash="r-vol" min="0" max="100" value="80"><span data-r="vol">۸۰٪</span></label>
          <label>⚖️<input type="range" data-dash="r-bal" min="-100" max="100" value="0"><span data-r="bal">وسط</span></label>
        </div>
        <div class="dash-row wrap">
          <button class="dash-btn xs" data-action="r-mute" data-r="mute">🔇 میوت</button>
          <button class="dash-btn xs" data-action="r-rate" data-r="rate">⏩ سرعت ۱×</button>
          <button class="dash-btn xs" data-action="r-fade" data-r="fade">🌊 فید</button>
        </div>
        <div class="dash-rm-lyric" data-r="lyric">🎤 —</div>
      </div>
      <div class="dash-rm-side">
        <div class="dash-card"><b>🎚 اکولایزر</b>
          <div class="dash-row wrap" style="margin:6px 0"><button class="dash-btn xs" data-action="r-eq-toggle" data-r="eq">🎚 روشن</button></div>
          <div class="dash-rm-eq">${EQ_PRESETS.map(([v, t]) => `<button class="dash-btn xs" data-action="r-eq" data-v="${v}">${t}</button>`).join('')}</div></div>
        <div class="dash-card"><b>😴 تایمر خواب</b>
          <div class="dash-row wrap" style="margin-top:6px">
            <button class="dash-btn xs" data-action="r-sleep" data-v="5">۵m</button>
            <button class="dash-btn xs" data-action="r-sleep" data-v="15">۱۵m</button>
            <button class="dash-btn xs" data-action="r-sleep" data-v="30">۳۰m</button>
            <button class="dash-btn xs" data-action="r-sleep" data-v="60">۶۰m</button>
            <button class="dash-btn xs" data-action="r-sleep" data-v="track">🎵 پایان آهنگ</button>
            <button class="dash-btn xs" data-action="r-sleep" data-v="off">لغو</button></div>
          <small data-r="sleep">خاموش</small></div>
        <div class="dash-card"><b>📜 صف پخش</b> <small data-r="qcount"></small>
          <div class="dash-row wrap" style="margin:6px 0">
            <button class="dash-btn xs" data-action="r-qshuffle">🔀 بر زدن</button>
            <button class="dash-btn xs" data-action="r-qclear">🗑 پاک</button>
            <button class="dash-btn xs" data-action="r-qsave">💾 ذخیره صف</button>
            <button class="dash-btn xs" data-action="r-qrestore">📥 بازیابی</button></div>
          <div class="dash-rm-queue" data-r="queue" data-qv="-1"></div></div>
      </div>
    </div></div>`;
}

const faD = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

/** به‌روزرسانی زنده ریموت (هر ثانیه از تایمر کاکپیت) */
export async function tickRemote(root) {
  try {
    const player = await P();
    const st = player.getPlayerState();
    const q = (sel) => root.querySelector(`[data-r="${sel}"]`);
    const song = st.song || {};
    if (q('cover')) q('cover').textContent = song.cover ? '' : '🎵';
    if (song.cover && q('cover')) q('cover').innerHTML = `<img src="${esc(song.cover)}" alt="">`;
    if (q('title')) q('title').textContent = song.title || '—';
    if (q('artist')) q('artist').textContent = song.artist || (st.queue.length ? `${st.queue.length} آهنگ در صف` : 'پلیر خالی است');
    if (q('ctx')) q('ctx').textContent = st.contextLabel || '';
    if (q('cur')) q('cur').textContent = faD(fmtT(st.currentTime));
    if (q('dur')) q('dur').textContent = faD(fmtT(st.duration));
    const seek = root.querySelector('[data-dash="r-seek"]');
    if (seek && st.duration > 0 && document.activeElement !== seek) seek.value = Math.round((st.currentTime / st.duration) * 1000);
    if (q('play')) { q('play').textContent = st.status === 'playing' ? '⏸' : '▶'; q('play').classList.toggle('playing', st.status === 'playing'); }
    if (q('shuffle')) q('shuffle').classList.toggle('is-on', !!st.shuffle);
    if (q('repeat')) { q('repeat').textContent = st.repeat === 'one' ? '🔂' : '🔁'; q('repeat').classList.toggle('is-on', st.repeat !== 'off'); }
    if (q('vol')) q('vol').textContent = st.muted ? 'میوت' : faD(Math.round(st.volume * 100) + '٪');
    const vol = root.querySelector('[data-dash="r-vol"]');
    if (vol && document.activeElement !== vol) vol.value = Math.round(st.volume * 100);
    if (q('bal')) q('bal').textContent = st.balance === 0 ? 'وسط' : (st.balance < 0 ? 'چپ ' : 'راست ') + faD(Math.abs(Math.round(st.balance * 100)));
    if (q('mute')) q('mute').classList.toggle('is-on', !!st.muted);
    if (q('rate')) q('rate').textContent = `⏩ سرعت ${faD(String(st.rate || 1))}×`;
    if (q('fade')) q('fade').classList.toggle('is-on', st.fade !== false);
    if (q('eq')) { q('eq').textContent = st.eqEnabled ? `🎚 ${st.eqPreset || ''}` : '🎚 خاموش'; q('eq').classList.toggle('is-on', !!st.eqEnabled); }
    if (q('sleep')) {
      let t = 'خاموش';
      if (st.sleepEndOfTrack) t = '🎵 پایان آهنگ';
      else if (st.sleepEndAt > Date.now()) t = `⏳ ${faD(fmtT((st.sleepEndAt - Date.now()) / 1000))} مانده`;
      q('sleep').textContent = t;
    }
    if (q('qcount')) q('qcount').textContent = st.queue.length ? `${faD(st.queue.length)} آهنگ` : '';
    const qbox = q('queue');
    if (qbox && String(st.queueVersion) !== qbox.dataset.qv) {
      qbox.dataset.qv = String(st.queueVersion);
      qbox.innerHTML = st.queue.length ? st.queue.slice(0, 30).map((s, i) => `
        <div class="dash-rm-q ${i === st.index ? 'cur' : ''}">
          <span class="dash-rm-q-n">${i === st.index ? '▶' : faD(i + 1)}</span>
          <span class="dash-rm-q-t">${esc(s.title || 'بی‌نام')}<small>${esc(s.artist || '')}</small></span>
          <button class="dash-icon-btn" data-action="r-qplay" data-v="${i}" title="پخش">▶</button>
          <button class="dash-icon-btn" data-action="r-qdel" data-v="${i}" title="حذف">✕</button>
        </div>`).join('') : '<div class="dash-empty">صف خالی است. از پلیر آهنگ اضافه کن! 🎵</div>';
    }
    if (q('lyric')) {
      try {
        const lines = song.lyrics || song.lrc || [];
        const arr = Array.isArray(lines) ? lines : [];
        const cur = [...arr].reverse().find((l) => (l.t ?? l.time ?? 0) <= st.currentTime);
        q('lyric').textContent = cur ? `🎤 ${cur.text || cur.line || ''}` : '🎤 —';
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

export async function handleRemoteAction(action, el, api) {
  const player = await P();
  const toast = api.toast;
  switch (action) {
    case 'r-toggle': await player.togglePlayback().catch(() => toast('🎵 آهنگی در صف نیست.')); await tickRemote(api.root); return true;
    case 'r-next': player.nextTrack(false); await tickRemote(api.root); return true;
    case 'r-prev': player.prevTrack(); await tickRemote(api.root); return true;
    case 'r-shuffle': { const on = player.toggleShuffle(); toast(on ? '🔀 شافل روشن' : '🔀 شافل خاموش'); await tickRemote(api.root); return true; }
    case 'r-repeat': { const m = player.cycleRepeat(); toast(m === 'off' ? '🔁 تکرار خاموش' : m === 'one' ? '🔂 تکرار یک آهنگ' : '🔁 تکرار همه'); await tickRemote(api.root); return true; }
    case 'r-mute': { player.toggleMute(); await tickRemote(api.root); return true; }
    case 'r-rate': { const st = player.getPlayerState(); const rates = [1, 1.25, 1.5, 2, 0.75]; const n = rates[(rates.indexOf(st.rate) + 1) % rates.length] || 1; player.setRate(n); toast(`⏩ سرعت ${n}×`); await tickRemote(api.root); return true; }
    case 'r-fade': player.toggleFade(); toast('🌊 فید تغییر کرد.'); await tickRemote(api.root); return true;
    case 'r-eq-toggle': player.toggleEq(); await tickRemote(api.root); return true;
    case 'r-eq': player.setEqPreset(el.dataset.v); toast(`🎚 ${el.textContent.trim()}`); await tickRemote(api.root); return true;
    case 'r-sleep': {
      const v = el.dataset.v;
      if (v === 'off') { player.clearSleepTimer(); toast('😴 تایمر لغو شد.'); }
      else { player.setSleepTimer(v === 'track' ? 'track' : Number(v)); toast(v === 'track' ? '😴 پایان آهنگ می‌خوابد.' : `😴 ${v} دقیقه دیگر می‌خوابد.`); }
      await tickRemote(api.root); return true;
    }
    case 'r-qplay': player.playIndex(+(el.dataset.v || 0)); await tickRemote(api.root); return true;
    case 'r-qdel': player.removeFromQueue(+(el.dataset.v || 0)); await tickRemote(api.root); return true;
    case 'r-qshuffle': player.shuffleQueueNow(); toast('🔀 صف بر خورد!'); await tickRemote(api.root); return true;
    case 'r-qclear': if (confirm('🗑 صف پاک شود؟')) { player.clearQueue(); await tickRemote(api.root); } return true;
    case 'r-qsave': player.saveQueueSnapshot(); toast('💾 صف ذخیره شد.'); return true;
    case 'r-qrestore': player.restoreQueueSnapshot(); toast('📥 صف بازیابی شد.'); await tickRemote(api.root); return true;
    default: return false;
  }
}

/** اسلایدرهای ریموت */
export async function handleRemoteInput(name, el) {
  const player = await P();
  if (name === 'r-vol') player.setVolume((+el.value || 0) / 100);
  else if (name === 'r-bal') player.setBalance((+el.value || 0) / 100);
  else if (name === 'r-seek') {
    const st = player.getPlayerState();
    if (st.duration > 0) player.seekTo((+el.value / 1000) * st.duration);
  }
  return true;
}
