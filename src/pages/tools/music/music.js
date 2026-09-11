// src/pages/tools/music/music.js

/**
 * ViXoRa Music Page — ارکستر اصلی صفحه موزیک پلیر
 * قرارداد صفحه: { render, afterRender, destroy }
 */

import { injectScopedCss } from '../../../utilities/css-scope.js';
import { toast } from '../../../utilities/toast.js';
import { createModal, confirmDialog } from '../../../utilities/modal.js';
import { escapeHtml, openExternal } from '../../../utilities/dom-utils.js';
import { musicCss } from './music.css.js';
import { loadPersistedMusicUi, persistMusicUi } from './music-state.js';
import * as R from './music-renderers.js';
import * as E from './music-editor.js';
import { renderLyricsView, afterLyricsRender, handleLyricsAction, startLyricsTicker, stopLyricsTicker, openLrcSync } from './music-lyrics.js';
import { renderLabView, afterLabRender, handleLabAction, handleLabCoverFile, handleLabInput } from './music-lab.js';
import { renderRadioView, afterRadioRender, handleRadioAction, startSession, noteSessionPlay, endSession, getLiveSession, scheduleAlarmCheck, clearAlarmTimer, noteTrackAdvanced } from './music-radio.js';
import { renderStudioView, afterStudioRender, handleStudioAction, handleStudioInput, startStudioTick, stopStudioTick, stopVisualizer } from './music-studio.js';

import {
  normalizeSong,
  filterSongs,
  sortSongs,
  getMusicStats,
  buildSmartPlaylists,
  parseM3U,
  faDigits,
  isHttpUrl,
} from '../../../core/schemas/music-schema.js';

import * as Lib from '../../../core/services/music-library-service.js';

import {
  getPlayerState,
  subscribeMusicPlayer,
  loadTrack,
  playPlayback,
  pausePlayback,
  togglePlayback,
  nextTrack,
  prevTrack,
  seekTo,
  setVolume,
  toggleMute,
  setRate,
  toggleShuffle,
  cycleRepeat,
  toggleFade,
  setEqBand,
  setEqPreset,
  toggleEq,
  setBalance,
  setPlayerTheme,
  setSleepTimer,
  clearSleepTimer,
  setQueue,
  playSongs,
  playIndex,
  enqueueSong,
  removeFromQueue,
  moveInQueue,
  clearQueue,
  shuffleQueueNow,
  readVisualData,
  saveQueueSnapshot,
} from '../../../core/services/music-player-service.js';

const VISUAL_BINS = 48;
const THEME_CANVAS = {
  neon: ['#8b5cf6', '#ec4899'],
  midnight: ['#38bdf8', '#818cf8'],
  sunset: ['#fb923c', '#f43f5e'],
  emerald: ['#34d399', '#a3e635'],
};

export function createMusicPage(ctx) {
  let root = null;
  let els = {};
  let releaseCss = null;
  let unsubPlayer = null;
  let destroyed = false;

  let ui = loadPersistedMusicUi();
  try {
    const deep = sessionStorage.getItem('vixora:music-tab');
    if (deep) {
      sessionStorage.removeItem('vixora:music-tab');
      ui.tab = deep;
    }
  } catch { /* ignore */ }
  let lib = { songs: [], playlists: [], albums: [], smart: [] };
  let songMap = new Map();
  let historyEntries = [];
  let historyLoaded = false;
  let snap = getPlayerState();

  let visualRaf = 0;
  let simData = new Array(VISUAL_BINS).fill(0);
  let simTarget = new Array(VISUAL_BINS).fill(0);
  let searchTimer = null;
  let lastTrackStamp = 0;
  let dropDepth = 0;
  let immersiveEl = null; // المنت سطح-body حالت فراگیر

  /* ============================== رندر ============================== */

  function render() {
    return R.renderShell(ui, snap.theme || 'neon');
  }

  function cacheEls() {
    els = {
      root: root && root.classList && root.classList.contains('mx-root') ? root : root.querySelector('.mx-root'),
      header: root.querySelector('[data-mx="header"]'),
      tabs: root.querySelector('[data-mx="tabs"]'),
      content: root.querySelector('[data-mx="content"]'),
      bar: root.querySelector('[data-mx="bar"]'),
      immersive: null, // اورلی فراگیر در body ساخته می‌شود (نه داخل صفحه)
      file: root.querySelector('[data-mx="file"]'),
      m3ufile: root.querySelector('[data-mx="m3ufile"]'),
      backupfile: root.querySelector('[data-mx="backupfile"]'),
      drop: root.querySelector('[data-mx="drop"]'),
    };
  }

  function stats() {
    return getMusicStats(lib.songs);
  }

  function renderHeader() {
    if (els.header) els.header.innerHTML = R.renderHeader(stats());
  }

  function renderTabs() {
    if (!els.tabs) return;
    els.tabs.innerHTML = R.renderTabs(ui, {
      songs: lib.songs.length,
      playlists: lib.playlists.length + lib.smart.length,
      albums: lib.albums.length,
      queue: snap.queue.length,
      history: historyLoaded ? historyEntries.length : Lib.getHistory().length,
    });
  }

  function currentFilteredSongs() {
    return sortSongs(filterSongs(lib.songs, ui), ui.sort);
  }

  function findCollection(kind, id) {
    if (kind === 'playlist') {
      if (String(id).startsWith('smart:')) return lib.smart.find((s) => s.id === id) || null;
      return lib.playlists.find((p) => p.id === id) || null;
    }
    return lib.albums.find((a) => a.id === id) || null;
  }

  function collectionSongs(item) {
    if (!item) return [];
    return (item.songIds || []).map((id) => songMap.get(id)).filter(Boolean);
  }

  function renderContent() {
    if (!els.content || destroyed) return;
    const fullSong = snap.song ? songMap.get(snap.song.id) || snap.song : null;

    switch (ui.tab) {
      case 'songs': {
        const genresInUse = new Set(lib.songs.map((s) => s.genre));
        els.content.innerHTML =
          R.renderSongsToolbar(ui, genresInUse) +
          `<div data-mx="songlist">${R.renderSongsList(currentFilteredSongs(), ui, snap, 'songs')}</div>`;
        updateSongCount();
        break;
      }
      case 'playlists': {
        if (ui.selectedPlaylistId) {
          const pl = findCollection('playlist', ui.selectedPlaylistId);
          if (!pl) {
            ui.selectedPlaylistId = null;
            els.content.innerHTML = R.renderPlaylistsView(lib.playlists, lib.smart, songMap);
          } else {
            els.content.innerHTML = R.renderPlaylistDetail(
              pl, collectionSongs(pl), ui, snap, String(pl.id).startsWith('smart:')
            );
          }
        } else {
          els.content.innerHTML = R.renderPlaylistsView(lib.playlists, lib.smart, songMap);
        }
        break;
      }
      case 'albums': {
        if (ui.selectedAlbumId) {
          const album = findCollection('album', ui.selectedAlbumId);
          if (!album) {
            ui.selectedAlbumId = null;
            els.content.innerHTML = R.renderAlbumsView(lib.albums, songMap);
          } else {
            els.content.innerHTML = R.renderAlbumDetail(album, collectionSongs(album), ui, snap);
          }
        } else {
          els.content.innerHTML = R.renderAlbumsView(lib.albums, songMap);
        }
        break;
      }
      case 'queue':
        els.content.innerHTML = R.renderQueueView(snap);
        break;
      case 'history':
        els.content.innerHTML = R.renderHistoryView(historyEntries, snap);
        break;
      case 'stats':
        els.content.innerHTML =
          R.renderStatsView(stats()) +
          `<div class="mx-secbar"><h3>🎨 تم پلیر</h3></div><div class="mx-panel"><div class="mx-themes">${R.themeButtonsHtml(snap.theme)}</div></div>`;
        break;
      case 'lyrics':
        stopLyricsTicker();
        els.content.innerHTML = renderLyricsView(lib, snap, ui);
        afterLyricsRender(els.content, snap);
        startLyricsTicker(els.content);
        break;
      case 'lab':
        els.content.innerHTML = renderLabView(lib);
        afterLabRender(els.content, lib);
        break;
      case 'radio':
        els.content.innerHTML = renderRadioView(lib, snap, modApi());
        afterRadioRender(els.content);
        break;
      case 'studio':
        els.content.innerHTML = renderStudioView(lib, snap);
        afterStudioRender(els.content);
        break;
      case 'now':
      default:
        els.content.innerHTML = R.renderNow(fullSong ? normalizeSong(fullSong) : null, snap);
        break;
    }
    hydrateCovers(els.content);
  }

  function updateSongCount() {
    const countEl = els.content?.querySelector('[data-mx="count"]');
    if (countEl) {
      const n = currentFilteredSongs().length;
      countEl.textContent = `${faDigits(n)} آهنگ`;
    }
  }

  function refreshSongList() {
    const box = els.content?.querySelector('[data-mx="songlist"]');
    if (!box) return;
    box.innerHTML = R.renderSongsList(currentFilteredSongs(), ui, snap, 'songs');
    hydrateCovers(box);
    updateSongCount();
  }

  function renderBar() {
    if (!els.bar || destroyed) return;
    els.bar.innerHTML = R.renderPlayerBar(snap);
    hydrateCovers(els.bar);
  }

  /** به‌روزرسانی سبک دکمه‌های بار بدون رندر کامل (تا درگ ولوم نشکند) */
  function updateBarDynamic() {
    if (!els.bar) return;
    const playing = snap.status === 'playing';
    const loading = snap.status === 'loading';
    const playBtn = els.bar.querySelector('[data-action="toggle"]');
    if (playBtn) {
      playBtn.classList.toggle('is-playing', playing);
      playBtn.innerHTML = loading ? '<span class="mx-spinner"></span>' : playing ? '⏸' : '▶';
    }
    const toggleBtn = (action, on) => {
      const btn = els.bar.querySelector(`[data-action="${action}"]`);
      if (btn) btn.classList.toggle('is-on', Boolean(on));
    };
    toggleBtn('shuffle', snap.shuffle);
    toggleBtn('repeat', snap.repeat !== 'off');
    toggleBtn('mute', snap.muted);
    toggleBtn('sleep', snap.sleepEndAt > 0 || snap.sleepEndOfTrack);
    toggleBtn('eq', snap.eqEnabled);
    const rateBtn = els.bar.querySelector('[data-action="rate"]');
    if (rateBtn) rateBtn.textContent = snap.rate === 1 ? '1x' : `${snap.rate}x`;
    const muteBtn = els.bar.querySelector('[data-action="mute"]');
    if (muteBtn) muteBtn.textContent = snap.muted || snap.volume === 0 ? '🔇' : snap.volume < 0.5 ? '🔈' : '🔊';
    // وینیل‌ها (صفحه + اورلی فراگیر سطح-body)
    document.querySelectorAll('.mx-vinylwrap').forEach((v) => v.classList.toggle('is-playing', playing));
    els.root?.classList?.toggle('mx-is-playing', playing);
  }

  function updateProgress() {
    const pct = snap.duration > 0 ? Math.min(1000, Math.round((snap.currentTime / snap.duration) * 1000)) : 0;
    // اسکوپ document چون اورلی فراگیر در body است (data-mx فقط مال همین صفحه است)
    document.querySelectorAll('[data-mx="seek"]').forEach((input) => {
      if (document.activeElement !== input) input.value = String(pct);
    });
    const tcur = snap.duration > 0 || snap.currentTime > 0 ? snap.currentTime : 0;
    document.querySelectorAll('[data-mx="tcur"]').forEach((el) => {
      el.textContent = faDigits(formatTimeSafe(tcur));
    });
    document.querySelectorAll('[data-mx="tdur"]').forEach((el) => {
      el.textContent = faDigits(formatTimeSafe(snap.duration));
    });
  }

  function formatTimeSafe(sec) {
    const s = Math.floor(Number(sec));
    if (!Number.isFinite(s) || s < 0) return '—';
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  /* ============================== کاور ============================== */

  function hydrateCovers(scope) {
    if (!scope) return;
    scope.querySelectorAll('[data-cover]').forEach((box) => {
      if (box.querySelector('img') || box.dataset.hydrated) return;
      box.dataset.hydrated = '1';
      const [type, ...rest] = String(box.dataset.cover).split(':');
      const id = rest.join(':');
      if (!type || !id || String(id).startsWith('smart')) return;
      Lib.getCoverUrl(type, id)
        .then((url) => {
          if (!url || destroyed || !box.isConnected) return;
          const img = document.createElement('img');
          img.src = url;
          img.alt = '';
          img.loading = 'lazy';
          box.appendChild(img);
        })
        .catch(() => null);
    });
  }

  /* ============================== ویژوالایزر ============================== */

  function drawVisual() {
    if (destroyed) return;
    visualRaf = requestAnimationFrame(drawVisual);

    const canvases = [];
    const small = els.content?.querySelector('[data-mx="visual"]');
    if (small && ui.tab === 'now') canvases.push(small);
    const big = immersiveEl?.querySelector('[data-mx="visual-big"]');
    if (big && ui.immersive) canvases.push(big);
    if (!canvases.length) return;

    const { live, data } = readVisualData(simData);
    let values = data;
    if (!live) {
      // شبیه‌سازی زیبا وقتی تحلیل زنده نداریم
      const playing = snap.status === 'playing';
      const t = performance.now() / 1000;
      for (let i = 0; i < VISUAL_BINS; i += 1) {
        if (playing && Math.random() < 0.06) {
          simTarget[i] = 0.25 + Math.random() * 0.75 * (1 - i / (VISUAL_BINS * 1.4));
        }
        if (!playing) simTarget[i] = 0.04;
        const wave = playing ? 0.08 * Math.sin(t * 2.2 + i * 0.55) : 0;
        simData[i] += (Math.max(0.03, simTarget[i] + wave) - simData[i]) * 0.18;
      }
      values = simData;
    }

    const colors = THEME_CANVAS[snap.theme] || THEME_CANVAS.neon;
    for (const canvas of canvases) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth || 300;
      const h = canvas.clientHeight || 120;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      const g = canvas.getContext('2d');
      g.clearRect(0, 0, canvas.width, canvas.height);
      const grad = g.createLinearGradient(0, canvas.height, 0, 0);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      g.fillStyle = grad;
      g.shadowColor = colors[1];
      g.shadowBlur = 12 * dpr;
      const gap = canvas.width / VISUAL_BINS;
      const bw = Math.max(2, gap * 0.62);
      for (let i = 0; i < VISUAL_BINS; i += 1) {
        const v = Math.min(1, Math.max(0.03, values[i] || 0));
        const bh = v * canvas.height * 0.92;
        const x = i * gap + (gap - bw) / 2;
        const y = canvas.height - bh;
        g.beginPath();
        if (g.roundRect) g.roundRect(x, y, bw, bh, bw / 2);
        else g.rect(x, y, bw, bh);
        g.fill();
      }
    }
  }

  /* ============================== کتابخانه ============================== */

  async function refreshLibrary() {
    try {
      const [songs, playlists, albums] = await Promise.all([
        Lib.listSongs(),
        Lib.listPlaylists(),
        Lib.listAlbums(),
      ]);
      lib.songs = songs;
      lib.playlists = playlists;
      lib.albums = albums;
      lib.smart = buildSmartPlaylists(songs);
      songMap = new Map(songs.map((s) => [s.id, s]));
      if (historyLoaded) {
        historyEntries = await Lib.getHistoryWithSongs().catch(() => []);
      }
    } catch (error) {
      toast.error('خواندن کتابخانه ممکن نشد. دوباره وارد شوید.');
    }
    renderHeader();
    renderTabs();
    renderContent();
  }

  function upsertSongInCache(song) {
    if (!song) return;
    const normalized = normalizeSong(song);
    const i = lib.songs.findIndex((s) => s.id === normalized.id);
    if (i >= 0) lib.songs[i] = normalized;
    else lib.songs.unshift(normalized);
    songMap.set(normalized.id, normalized);
    lib.smart = buildSmartPlaylists(lib.songs);
  }

  /* ============================== اکشن‌ها ============================== */

  async function doLike(songId) {
    try {
      const updated = await Lib.toggleSongLike(songId);
      upsertSongInCache(updated);
      toast.success(updated.liked ? 'به علاقه‌مندی‌ها اضافه شد ❤️' : 'از علاقه‌مندی‌ها حذف شد.');
      renderContent();
    } catch (error) {
      toast.error(error?.message || 'ممکن نشد.');
    }
  }

  async function doShare(song) {
    const target = songMap.get(song.id) || song;
    const text = `🎵 ${target.title} — ${target.artist}`;
    const url = target.source === 'link' ? target.url : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: target.title, text, url: url || undefined });
        return;
      }
      throw new Error('no-share');
    } catch {
      try {
        await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
        toast.success('در کلیپ‌بورد کپی شد 📋');
      } catch {
        toast.error('اشتراک‌گذاری ممکن نشد.');
      }
    }
  }

  async function doDownload(song) {
    const target = songMap.get(song.id) || song;
    try {
      if (target.source === 'link') {
        openExternal(target.url);
        return;
      }
      const objectUrl = await Lib.getTrackUrl(target);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = target.fileName || `${target.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('دانلود شروع شد ⬇️');
    } catch (error) {
      toast.error(error?.message || 'دانلود ممکن نشد.');
    }
  }

  function doReattach(songId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const updated = await Lib.reattachSongFile(songId, file);
        upsertSongInCache(updated);
        toast.success('فایل الصاق شد 📎');
        renderContent();
      } catch (error) {
        toast.error(error?.message || 'الصاق ممکن نشد.');
      }
    };
    input.click();
  }

  async function doDeleteSong(songId) {
    const song = songMap.get(songId);
    const ok = await confirmDialog({
      title: 'حذف آهنگ',
      message: `«${song?.title || ''}» برای همیشه از کتابخانه حذف شود؟`,
      confirmLabel: 'بله، حذف کن',
      danger: true,
    });
    if (!ok) return;
    try {
      await Lib.deleteSong(songId);
      toast.success('حذف شد 🗑️');
      await refreshLibrary();
    } catch (error) {
      toast.error(error?.message || 'حذف ممکن نشد.');
    }
  }

  function playContextSong(songId, context) {
    const song = songMap.get(songId);
    if (!song) {
      toast.error('آهنگ یافت نشد.');
      return;
    }
    // اگر همین آهنگ در صف است، فقط بپخشش
    const qi = snap.queue.findIndex((s) => s.id === songId);
    if (qi >= 0 && snap.song?.id === songId) {
      togglePlayback();
      return;
    }
    let list = [song];
    let label = song.title;
    if (context === 'songs') {
      list = currentFilteredSongs();
      label = 'کتابخانه';
    } else if (String(context).startsWith('playlist:')) {
      const pl = findCollection('playlist', String(context).slice(9));
      if (pl) {
        list = collectionSongs(pl);
        label = pl.title;
      }
    } else if (String(context).startsWith('album:')) {
      const album = findCollection('album', String(context).slice(6));
      if (album) {
        list = collectionSongs(album);
        label = album.title;
      }
    }
    if (!list.length) list = [song];
    playSongs(list, songId, label);
  }

  function openM3UModal() {
    const modal = createModal({
      title: '📋 ایمپورت لیست پخش M3U',
      bodyHtml: `
        <div class="mx-form">
          <div class="mx-hint">لینک فایل <span dir="ltr">.m3u</span> را بده یا فایلش را انتخاب کن؛ همه آهنگ‌های داخلش اضافه می‌شوند.</div>
          <label class="mx-field"><span class="mx-field__label">لینک فایل M3U</span><input type="url" name="m3uurl" dir="ltr" style="text-align:left" placeholder="https://..." /></label>
          <button class="mx-btn" data-m3ufile-btn>📁 انتخاب فایل از سیستم</button>
        </div>
      `,
      actions: [
        { id: 'cancel', label: 'بستن' },
        {
          id: 'go',
          label: '📥 وارد کردن',
          variant: 'primary',
          onClick: async ({ dialog, button }) => {
            const url = dialog.querySelector('[name="m3uurl"]')?.value?.trim() || '';
            if (!isHttpUrl(url)) {
              toast.error('لینک معتبر وارد کن یا فایل انتخاب کن.');
              return false;
            }
            button.disabled = true;
            try {
              const res = await fetch(url);
              if (!res.ok) throw new Error('دریافت فایل ممکن نشد.');
              const text = await res.text();
              await importM3UText(text);
              return true;
            } catch (error) {
              toast.error(error?.message || 'ایمپورت ممکن نشد.');
              button.disabled = false;
              return false;
            }
          },
        },
      ],
    });
    modal.open();
    modal.element.querySelector('[data-m3ufile-btn]')?.addEventListener('click', () => {
      modal.close('file');
      setTimeout(() => els.m3ufile?.click(), 200);
    });
  }

  async function importM3UText(text) {
    const items = parseM3U(text);
    if (!items.length) {
      toast.warning('آهنگی در این فایل پیدا نشد.');
      return;
    }
    toast.info(`⏳ ${faDigits(items.length)} آهنگ پیدا شد؛ در حال افزودن...`);
    let ok = 0;
    let fail = 0;
    for (const item of items.slice(0, 200)) {
      try {
        await Lib.addSongFromLink({ url: item.url, title: item.title });
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    await refreshLibrary();
    toast.success(`✅ ${faDigits(ok)} آهنگ اضافه شد${fail ? ` (${faDigits(fail)} ناموفق/تکراری)` : ''}`);
  }

  async function doExportBackup() {
    try {
      const data = await Lib.exportLibrary();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vixora-music-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast.success('بکاپ دانلود شد 💾');
    } catch {
      toast.error('تهیه بکاپ ممکن نشد.');
    }
  }

  async function doImportBackupFile(file) {
    try {
      const text = await file.text();
      const result = await Lib.importLibrary(JSON.parse(text));
      await refreshLibrary();
      toast.success(`بازیابی شد: ${faDigits(result.songs)} آهنگ، ${faDigits(result.playlists)} پلی‌لیست، ${faDigits(result.albums)} آلبوم ✅`);
      if (result.songs > 0) {
        toast.warning('یادت نره: فایل آهنگ‌های آپلودی را باید دوباره الصاق کنی 📎');
      }
    } catch {
      toast.error('فایل بکاپ معتبر نیست.');
    }
  }

  function openDestination(kind, songId) {
    const collections = kind === 'album' ? lib.albums : lib.playlists;
    E.openDestinationPickerModal(
      kind,
      collections,
      async (destId) => {
        try {
          if (kind === 'album') await Lib.addSongsToAlbum(destId, [songId]);
          else await Lib.addSongsToPlaylist(destId, [songId]);
          toast.success('اضافه شد ✅');
          await refreshLibrary();
        } catch (error) {
          toast.error(error?.message || 'ممکن نشد.');
        }
      },
      async (name) => {
        if (kind === 'album') await Lib.createAlbum({ title: name, songIds: [songId] });
        else await Lib.createPlaylist({ title: name, songIds: [songId] });
        toast.success(`ساخته و اضافه شد ✅`);
        await refreshLibrary();
      }
    );
  }

  /* ---------- API مشترک ماژول‌های توسعه (شعر/آزمایشگاه/رادیو/استودیو) ---------- */
  function modApi() {
    return {
      lib, root, toast, snap,
      refreshLibrary,
      renderContent,
      renderTabs,
      playSong: (id, context) => playContextSong(id, context || 'songs'),
      gotoTab: (tab) => {
        stopLyricsTicker();
        stopVisualizer();
        ui.tab = tab;
        ui.selectedPlaylistId = null;
        ui.selectedAlbumId = null;
        ui = persistMusicUi({ tab });
        renderTabs();
        renderContent();
      },
    };
  }

  async function handleModuleClick(action, actionEl) {
    const api = modApi();
    if (action.startsWith('lx-')) {
      if (action === 'lx-sync-open') {
        const { getLrcLines } = await import('./music-lyrics.js');
        openLrcSync(actionEl.dataset.id, getLrcLines(lib.songs.find((s) => String(s.id) === String(actionEl.dataset.id))), api);
        return true;
      }
      return handleLyricsAction(action, actionEl, api);
    }
    if (action.startsWith('lab-')) return handleLabAction(action, actionEl, api);
    if (action.startsWith('rd-')) return handleRadioAction(action, actionEl, api);
    if (action.startsWith('st-')) return handleStudioAction(action, actionEl, api);
    return false;
  }

  /* ---------- رویداد کلیک (delegation) ---------- */

  async function handleClick(event) {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    if (!root.contains(actionEl) && !(immersiveEl && immersiveEl.contains(actionEl))) return;
    const action = actionEl.dataset.action;
    const id = actionEl.dataset.id;

    if (action.startsWith('lx-') || action.startsWith('lab-') || action.startsWith('rd-') || action.startsWith('st-')) {
      const handled = await handleModuleClick(action, actionEl).catch(() => false);
      if (handled) return;
    }

    // جلوگیری از پخش ناخواسته وقتی روی دکمه‌های داخل ردیف کلیک می‌شود
    const row = event.target.closest('[data-song-row]');
    if (row && actionEl !== row && (action === 'play-song' ? false : true)) {
      event.stopPropagation();
    }

    switch (action) {
      case 'tab': {
        stopLyricsTicker();
        stopVisualizer();
        ui.tab = actionEl.dataset.tab || 'now';
        ui.selectedPlaylistId = null;
        ui.selectedAlbumId = null;
        if (ui.tab === 'history' && !historyLoaded) {
          historyEntries = await Lib.getHistoryWithSongs().catch(() => []);
          historyLoaded = true;
        }
        ui = persistMusicUi({ tab: ui.tab });
        renderTabs();
        renderContent();
        break;
      }
      case 'play-song':
        playContextSong(id, actionEl.dataset.context || 'songs');
        break;
      case 'toggle':
        togglePlayback();
        break;
      case 'next':
        nextTrack(false);
        break;
      case 'prev':
        prevTrack();
        break;
      case 'shuffle':
        toggleShuffle();
        toast.info(getPlayerState().shuffle ? 'شافل روشن شد 🔀' : 'شافل خاموش شد.');
        break;
      case 'repeat': {
        const mode = cycleRepeat();
        toast.info(mode === 'off' ? 'تکرار خاموش شد.' : mode === 'all' ? 'تکرار همه 🔁' : 'تکرار همین آهنگ 🔂');
        break;
      }
      case 'mute':
        toggleMute();
        break;
      case 'like':
        event.stopPropagation();
        if (id) doLike(id);
        else if (snap.song) doLike(snap.song.id);
        break;
      case 'song-menu': {
        event.stopPropagation();
        const song = songMap.get(id);
        if (!song) break;
        E.openSongMenuModal(song, {
          next: (s) => {
            enqueueSong(s, { playNext: true });
            toast.success('بعد از همین آهنگ پخش می‌شود ⏭');
          },
          queue: (s) => {
            enqueueSong(s);
            toast.success('به انتهای صف اضافه شد ➕');
          },
          playlist: (s) => openDestination('playlist', s.id),
          album: (s) => openDestination('album', s.id),
          edit: (s) => E.openSongEditorModal(s.id, () => refreshLibrary()),
          lyrics: (s) => E.openLyricsModal(s.id, () => refreshLibrary()),
          share: (s) => doShare(s),
          download: (s) => doDownload(s),
          reattach: (s) => doReattach(s.id),
          delete: (s) => doDeleteSong(s.id),
        });
        break;
      }
      case 'song-edit':
        E.openSongEditorModal(id, () => refreshLibrary());
        break;
      case 'lyrics-edit':
        E.openLyricsModal(id, () => refreshLibrary());
        break;
      case 'song-share':
        doShare(songMap.get(id) || snap.song);
        break;
      case 'song-download':
        doDownload(songMap.get(id) || snap.song);
        break;
      case 'add-link':
        E.openAddLinkModal(() => refreshLibrary());
        break;
      case 'upload':
        els.file?.click();
        break;
      case 'import-m3u':
        openM3UModal();
        break;
      case 'backup':
        E.openBackupModal(
          { songs: lib.songs.length, playlists: lib.playlists.length, albums: lib.albums.length },
          () => doExportBackup(),
          (file) => doImportBackupFile(file)
        );
        break;
      case 'filter-source':
        ui.filterSource = actionEl.dataset.v || 'all';
        ui = persistMusicUi({ filterSource: ui.filterSource });
        renderContent();
        break;
      case 'filter-liked':
        ui.likedOnly = !ui.likedOnly;
        ui = persistMusicUi({ likedOnly: ui.likedOnly });
        renderContent();
        break;
      case 'play-all': {
        const list = currentFilteredSongs();
        if (!list.length) {
          toast.warning('آهنگی برای پخش نیست.');
          break;
        }
        playSongs(list, null, 'کتابخانه');
        ui.tab = 'now';
        renderTabs();
        break;
      }
      case 'surprise': {
        if (!lib.songs.length) {
          toast.warning('اول آهنگ اضافه کن 🎵');
          break;
        }
        const shuffled = [...lib.songs].sort(() => Math.random() - 0.5);
        playSongs(shuffled, null, '🎲 شانسی');
        toast.success('بزن بریم! 🎲🎶');
        ui.tab = 'now';
        renderTabs();
        break;
      }
      case 'create-playlist':
        E.openCollectionModal('playlist', null, async (draft) => {
          const created = await Lib.createPlaylist(draft);
          toast.success('پلی‌لیست ساخته شد 📝');
          ui.selectedPlaylistId = created.id;
          await refreshLibrary();
        });
        break;
      case 'create-album':
        E.openCollectionModal('album', null, async (draft) => {
          const created = await Lib.createAlbum(draft);
          toast.success('آلبوم ساخته شد 💿');
          ui.selectedAlbumId = created.id;
          await refreshLibrary();
        });
        break;
      case 'open-playlist':
        ui.selectedPlaylistId = id;
        renderContent();
        break;
      case 'open-album':
        ui.selectedAlbumId = id;
        renderContent();
        break;
      case 'back-collections':
        ui.selectedPlaylistId = null;
        ui.selectedAlbumId = null;
        renderContent();
        break;
      case 'play-collection': {
        const kind = actionEl.dataset.kind;
        const item = findCollection(kind, id);
        const songs = collectionSongs(item);
        if (!songs.length) {
          toast.warning('این کالکشن خالی است.');
          break;
        }
        playSongs(songs, null, item.title);
        break;
      }
      case 'shuffle-collection': {
        const kind = actionEl.dataset.kind;
        const item = findCollection(kind, id);
        const songs = collectionSongs(item);
        if (!songs.length) {
          toast.warning('این کالکشن خالی است.');
          break;
        }
        playSongs([...songs].sort(() => Math.random() - 0.5), null, item.title);
        toast.success('به‌صورت شانسی پخش می‌شود 🔀');
        break;
      }
      case 'pl-add-songs':
        E.openSongPickerModal(lib.songs, findCollection('playlist', id)?.songIds || [], async (ids) => {
          await Lib.addSongsToPlaylist(id, ids);
          toast.success(`${faDigits(ids.length)} آهنگ اضافه شد ➕`);
          await refreshLibrary();
        });
        break;
      case 'alb-add-songs':
        E.openSongPickerModal(lib.songs, findCollection('album', id)?.songIds || [], async (ids) => {
          await Lib.addSongsToAlbum(id, ids);
          toast.success(`${faDigits(ids.length)} آهنگ اضافه شد ➕`);
          await refreshLibrary();
        });
        break;
      case 'pl-remove':
        await Lib.removeSongFromPlaylist(actionEl.dataset.pl, id).catch(() => null);
        await refreshLibrary();
        break;
      case 'alb-remove':
        await Lib.removeSongFromAlbum(actionEl.dataset.alb, id).catch(() => null);
        await refreshLibrary();
        break;
      case 'pl-move-up':
        await Lib.moveSongInPlaylist(actionEl.dataset.pl, id, 'up').catch(() => null);
        await refreshLibrary();
        break;
      case 'pl-move-down':
        await Lib.moveSongInPlaylist(actionEl.dataset.pl, id, 'down').catch(() => null);
        await refreshLibrary();
        break;
      case 'alb-move-up':
        await Lib.moveSongInAlbum(actionEl.dataset.alb, id, 'up').catch(() => null);
        await refreshLibrary();
        break;
      case 'alb-move-down':
        await Lib.moveSongInAlbum(actionEl.dataset.alb, id, 'down').catch(() => null);
        await refreshLibrary();
        break;
      case 'pl-rename': {
        const pl = findCollection('playlist', id);
        E.openCollectionModal('playlist', pl, async (draft) => {
          await Lib.updatePlaylist(id, draft);
          toast.success('ذخیره شد ✅');
          await refreshLibrary();
        });
        break;
      }
      case 'alb-edit': {
        const album = findCollection('album', id);
        E.openCollectionModal('album', album, async (draft) => {
          await Lib.updateAlbum(id, draft);
          toast.success('ذخیره شد ✅');
          await refreshLibrary();
        });
        break;
      }
      case 'pl-cover': {
        const pl = findCollection('playlist', id);
        E.openCoverModal('playlist', id, pl?.title || '', () => refreshLibrary());
        break;
      }
      case 'alb-cover': {
        const album = findCollection('album', id);
        E.openCoverModal('album', id, album?.title || '', () => refreshLibrary());
        break;
      }
      case 'pl-delete': {
        const ok = await confirmDialog({ title: 'حذف پلی‌لیست', message: 'این پلی‌لیست حذف شود؟ (آهنگ‌ها حذف نمی‌شوند)', confirmLabel: 'بله، حذف کن', danger: true });
        if (!ok) break;
        await Lib.deletePlaylist(id);
        ui.selectedPlaylistId = null;
        toast.success('حذف شد 🗑️');
        await refreshLibrary();
        break;
      }
      case 'alb-delete': {
        const ok = await confirmDialog({ title: 'حذف آلبوم', message: 'این آلبوم حذف شود؟ (آهنگ‌ها حذف نمی‌شوند)', confirmLabel: 'بله، حذف کن', danger: true });
        if (!ok) break;
        await Lib.deleteAlbum(id);
        ui.selectedAlbumId = null;
        toast.success('حذف شد 🗑️');
        await refreshLibrary();
        break;
      }
      case 'queue-play':
        playIndex(Number(actionEl.dataset.i));
        break;
      case 'queue-up':
        event.stopPropagation();
        moveInQueue(Number(actionEl.dataset.i), 'up');
        break;
      case 'queue-down':
        event.stopPropagation();
        moveInQueue(Number(actionEl.dataset.i), 'down');
        break;
      case 'queue-remove':
        event.stopPropagation();
        removeFromQueue(Number(actionEl.dataset.i));
        break;
      case 'queue-clear': {
        const ok = await confirmDialog({ title: 'پاک کردن صف', message: 'کل صف پخش پاک شود؟', confirmLabel: 'بله', danger: true });
        if (ok) {
          clearQueue();
          toast.info('صف پاک شد 🧹');
        }
        break;
      }
      case 'queue-shuffle':
        shuffleQueueNow();
        toast.success('صف بر زده شد 🔀');
        break;
      case 'queue-save': {
        if (!snap.queue.length) break;
        E.openDestinationPickerModal(
          'playlist',
          lib.playlists,
          async (destId) => {
            await Lib.addSongsToPlaylist(destId, snap.queue.map((s) => s.id));
            toast.success('صف به پلی‌لیست اضافه شد 💾');
            await refreshLibrary();
          },
          async (name) => {
            await Lib.createPlaylist({ title: name, songIds: snap.queue.map((s) => s.id) });
            toast.success('پلی‌لیست از روی صف ساخته شد 💾');
            await refreshLibrary();
          }
        );
        break;
      }
      case 'history-clear': {
        const ok = await confirmDialog({ title: 'پاک کردن تاریخچه', message: 'تاریخچه پخش پاک شود؟', confirmLabel: 'بله', danger: true });
        if (ok) {
          Lib.clearHistory();
          historyEntries = [];
          renderTabs();
          renderContent();
          toast.info('تاریخچه پاک شد 🧹');
        }
        break;
      }
      case 'sleep': {
        const s = getPlayerState();
        const label = s.sleepEndOfTrack ? 'پایان آهنگ' : s.sleepEndAt > 0 ? 'فعال' : '';
        E.openSleepModal(label, (value) => {
          if (value === 'off') {
            clearSleepTimer();
            toast.info('تایمر خواب خاموش شد.');
          } else if (value === 'track') {
            setSleepTimer('track');
            toast.success('پایان همین آهنگ، پخش متوقف می‌شود 😴');
          } else {
            setSleepTimer(Number(value));
            toast.success(`تایمر خواب: ${faDigits(value)} دقیقه 😴`);
          }
        });
        break;
      }
      case 'rate':
        E.openRateModal(getPlayerState().rate, (value) => {
          setRate(value);
          toast.info(`سرعت پخش: ${value}x`);
        });
        break;
      case 'eq':
        E.openEqModal(getPlayerState(), {
          setBand: (i, v) => setEqBand(i, v),
          setPreset: (name) => setEqPreset(name),
          toggleEq: () => toggleEq(),
          setBalance: (v) => setBalance(v),
          toggleFade: () => toggleFade(),
        });
        break;
      case 'theme':
        setPlayerTheme(actionEl.dataset.v);
        if (els.root) els.root.dataset.musicTheme = actionEl.dataset.v;
        renderContent();
        toast.success('تم عوض شد 🎨');
        break;
      case 'immersive':
        toggleImmersive();
        break;
      case 'drop-cancel':
        hideDrop();
        break;
      default:
        break;
    }
  }

  /* ---------- ورودی‌ها ---------- */

  function handleInput(event) {
    const lab = event.target.closest('[data-lab]');
    if (lab && (lab.dataset.lab === 'q' || lab.dataset.lab === 'sel')) {
      handleLabInput(lab, modApi());
      return;
    }
    const st = event.target.closest('[data-st]');
    if (st && !event.target.closest('[data-mx]')) {
      handleStudioInput(event.target.closest('[data-st]') || st, modApi()).catch(() => null);
      return;
    }
    const q = event.target.closest('[data-mx="q"]');
    if (q) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        ui.query = q.value || '';
        refreshSongList();
      }, 220);
      return;
    }
    const vol = event.target.closest('[data-mx="vol"]');
    if (vol) {
      setVolume(Number(vol.value) / 100);
      return;
    }
  }

  function handleChange(event) {
    const sort = event.target.closest('[data-mx="sort"]');
    if (sort) {
      ui.sort = sort.value;
      ui = persistMusicUi({ sort: ui.sort });
      refreshSongList();
      return;
    }
    const genre = event.target.closest('[data-mx="genre"]');
    if (genre) {
      ui.filterGenre = genre.value;
      ui = persistMusicUi({ filterGenre: ui.filterGenre });
      refreshSongList();
      return;
    }
    const seek = event.target.closest('[data-mx="seek"]');
    if (seek) {
      const ratio = Number(seek.value) / 1000;
      if (snap.duration > 0) seekTo(ratio * snap.duration);
      return;
    }
    if (event.target === els.file) {
      handleUploadFiles(event.target.files);
      event.target.value = '';
      return;
    }
    if (event.target.matches && event.target.matches('[data-lab="cover-file"]')) {
      const file = event.target.files?.[0];
      if (file) handleLabCoverFile(file, modApi()).catch(() => toast.error('ثبت کاور ناموفق بود.'));
      event.target.value = '';
      return;
    }
    if (event.target.matches && event.target.matches('[data-st="eq-on"], [data-st="mono"], [data-st="pitch"], [data-st="mirror"]')) {
      handleStudioInput(event.target, modApi()).catch(() => null);
      return;
    }
    if (event.target === els.m3ufile) {
      const file = event.target.files?.[0];
      if (file) {
        file.text().then((text) => importM3UText(text)).catch(() => toast.error('خواندن فایل ممکن نشد.'));
      }
      event.target.value = '';
    }
  }

  async function handleUploadFiles(fileList) {
    if (!fileList || !fileList.length) return;
    toast.info('⏳ در حال افزودن فایل‌ها...');
    try {
      const { added, skipped } = await Lib.addSongsFromFiles(fileList);
      await refreshLibrary();
      if (added.length) toast.success(`✅ ${faDigits(added.length)} آهنگ اضافه شد 🎵`);
      for (const s of skipped.slice(0, 3)) {
        toast.warning(`${s.name}: ${s.reason}`);
      }
      if (!added.length && !skipped.length) toast.warning('فایل صوتی معتبری پیدا نشد.');
    } catch (error) {
      toast.error('آپلود ممکن نشد.');
    }
  }

  /* ---------- کیبورد ---------- */

  function handleKeydown(event) {
    if (destroyed) return;
    const target = event.target;
    const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    if (typing || document.querySelector('.vx-modal-overlay')) return;

    // ESC: اورلی دراپ ← حالت فراگیر ← بازگشت از جزئیات کالکشن
    if (event.key === 'Escape' || event.code === 'Escape') {
      if (dropVisible) {
        hideDrop();
        return;
      }
      if (ui.immersive) {
        toggleImmersive();
        return;
      }
      if (ui.selectedPlaylistId || ui.selectedAlbumId) {
        ui.selectedPlaylistId = null;
        ui.selectedAlbumId = null;
        renderContent();
        return;
      }
      return;
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        togglePlayback();
        break;
      case 'ArrowRight':
        seekBySafe(5);
        break;
      case 'ArrowLeft':
        seekBySafe(-5);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setVolume(Math.min(1, getPlayerState().volume + 0.05));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setVolume(Math.max(0, getPlayerState().volume - 0.05));
        break;
      case 'KeyN':
        nextTrack(false);
        break;
      case 'KeyP':
        prevTrack();
        break;
      case 'KeyM':
        toggleMute();
        break;
      case 'KeyL':
        if (snap.song) doLike(snap.song.id);
        break;
      case 'KeyI':
        toggleImmersive();
        break;
      default:
        break;
    }
  }

  function seekBySafe(delta) {
    const s = getPlayerState();
    if (s.duration > 0) seekTo(s.currentTime + delta);
  }

  /* ---------- درگ و دراپ (ضدگیر: شمارنده + نگهبان + ESC + دکمه انصراف) ---------- */

  let dropVisible = false;
  let lastDragOverAt = 0;
  let dropWatchdog = null;

  function showDrop() {
    if (dropVisible || !els.drop) return;
    dropVisible = true;
    els.drop.hidden = false;
  }

  function hideDrop() {
    dropDepth = 0;
    if (!dropVisible) return;
    dropVisible = false;
    if (els.drop) els.drop.hidden = true;
  }

  function dragHasFiles(event) {
    try {
      return [...(event.dataTransfer?.types || [])].includes('Files');
    } catch {
      return false;
    }
  }

  function handleDragEnter(event) {
    if (!dragHasFiles(event)) return;
    event.preventDefault();
    dropDepth += 1;
    lastDragOverAt = Date.now();
    showDrop();
  }

  function handleDragOver(event) {
    if (!dragHasFiles(event)) return;
    event.preventDefault(); // حیاتی: بدون این، رویداد drop فایر نمی‌شود
    try {
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    } catch {
      /* ignore */
    }
    lastDragOverAt = Date.now();
    showDrop();
  }

  function handleDragLeave(event) {
    dropDepth = Math.max(0, dropDepth - 1);
    if (dropDepth === 0) hideDrop();
  }

  function handleDrop(event) {
    event.preventDefault(); // همیشه: تا مرورگر فایل را باز نکند
    hideDrop();
    const files = event.dataTransfer?.files;
    if (files && files.length) handleUploadFiles(files);
  }

  function startDropWatchdog() {
    stopDropWatchdog();
    // اگر بیش از ۱.۵ ثانیه dragover نیامد یعنی درگ لغو/گم شده → اورلی را مخفی کن
    dropWatchdog = setInterval(() => {
      if (dropVisible && Date.now() - lastDragOverAt > 1500) hideDrop();
    }, 700);
  }

  function stopDropWatchdog() {
    if (dropWatchdog) {
      clearInterval(dropWatchdog);
      dropWatchdog = null;
    }
  }

  /* ---------- فراگیر (سطح body تا زیر سایدبار/هدر نرود) ---------- */

  function closeImmersiveEl() {
    if (immersiveEl) {
      immersiveEl.removeEventListener('click', handleClick);
      immersiveEl.removeEventListener('change', handleChange);
      immersiveEl.remove();
      immersiveEl = null;
    }
    els.immersive = null;
    try {
      document.body.style.overflow = '';
    } catch {
      /* ignore */
    }
  }

  function toggleImmersive() {
    ui.immersive = !ui.immersive;
    if (ui.immersive) {
      if (!snap.song) {
        toast.warning('اول آهنگی پخش کن 🎵');
        ui.immersive = false;
        return;
      }
      closeImmersiveEl();
      immersiveEl = document.createElement('div');
      immersiveEl.className = 'mx-immersive';
      immersiveEl.setAttribute('dir', 'rtl');
      immersiveEl.dataset.musicTheme = snap.theme || 'neon';
      immersiveEl.innerHTML = R.renderImmersive(songMap.get(snap.song.id) || snap.song, snap);
      document.body.appendChild(immersiveEl);
      els.immersive = immersiveEl;
      immersiveEl.addEventListener('click', handleClick);
      immersiveEl.addEventListener('change', handleChange);
      hydrateCovers(immersiveEl);
      updateProgress();
      try {
        document.body.style.overflow = 'hidden'; // قفل اسکرول پس‌زمینه
      } catch {
        /* ignore */
      }
    } else {
      closeImmersiveEl();
    }
  }

  /* ---------- اشتراک پلیر ---------- */

  function handlePlayerEvent(type, nextSnap) {
    if (destroyed) return;
    snap = nextSnap;

    if (type === 'time') {
      updateProgress();
      return;
    }
    if (type === 'error') {
      toast.error(nextSnap.error || 'خطا در پخش.');
      renderBar();
      return;
    }
    if (type === 'sleep') {
      toast.info('تایمر خواب: پخش متوقف شد 😴');
      updateBarDynamic();
      return;
    }
    if (type === 'track') {
      renderBar();
      updateBarDynamic();
      updateProgress();
      try {
        if (getLiveSession() && nextSnap.song) {
          const now = Date.now();
          const gap = lastTrackStamp ? Math.min(600, Math.max(0, (now - lastTrackStamp) / 1000)) : 0;
          lastTrackStamp = now;
          noteSessionPlay(nextSnap.song.id, gap);
        } else {
          lastTrackStamp = Date.now();
        }
        if (noteTrackAdvanced()) toast.info('🛑 توقف هوشمند: پخش متوقف شد.');
      } catch { /* ignore */ }
      // اگر آهنگ جدید لایک/آمارش عوض شده، کش را تازه کن
      if (['now', 'queue', 'songs', 'playlists', 'albums', 'history', 'lyrics'].includes(ui.tab)) {
        renderContent();
      }
      if (ui.immersive && immersiveEl && snap.song) {
        immersiveEl.innerHTML = R.renderImmersive(songMap.get(snap.song.id) || snap.song, snap);
        immersiveEl.dataset.musicTheme = snap.theme || 'neon';
        hydrateCovers(immersiveEl);
      }
      return;
    }
    if (type === 'queue') {
      renderTabs();
      if (ui.tab === 'queue') renderContent();
      return;
    }
    // state
    updateBarDynamic();
    updateProgress();
  }

  /* ============================== چرخه عمر ============================== */

  function afterRender() {
    root = ctx?.outlet || document.querySelector('.mx-root')?.parentElement || document.getElementById('app');
    // ریشه واقعی: نزدیک‌ترین والد دارای .mx-root که خودمان رندر کردیم
    const selfRoot = document.querySelector('#app .mx-root, .outlet .mx-root, main .mx-root') || document.querySelector('.mx-root');
    root = selfRoot ? selfRoot.parentElement || selfRoot : document.getElementById('app');

    releaseCss = injectScopedCss(musicCss, 'music-page');
    cacheEls();

    document.body.dataset.musicPage = '1';
    if (els.root) {
      els.root.dataset.musicTheme = snap.theme || 'neon';
      els.root.classList.toggle('mx-is-playing', snap.status === 'playing');
    }

    if (els.content) {
      els.content.innerHTML = `<div class="mx-empty"><div class="mx-empty__icon">🎵</div><div class="mx-empty__title">در حال بارگذاری کتابخانه...</div></div>`;
    }

    els.root.addEventListener('click', handleClick);
    els.root.addEventListener('input', handleInput);
    els.root.addEventListener('change', handleChange);
    els.root.addEventListener('dragenter', handleDragEnter);
    els.root.addEventListener('dragover', handleDragOver);
    els.root.addEventListener('dragleave', handleDragLeave);
    els.root.addEventListener('drop', handleDrop);
    document.addEventListener('keydown', handleKeydown);

    unsubPlayer = subscribeMusicPlayer(handlePlayerEvent);
    startDropWatchdog();
    try {
      startStudioTick();
      // بازگردانی افکت‌های ذخیره‌شده استودیو
      try {
        const stUi = JSON.parse(localStorage.getItem('ViXoRa:music-studio-ui') || '{}');
        import('../../../core/services/music-player-service.js').then((P) => {
          if (Number.isFinite(stUi.preamp) && stUi.preamp) P.setPreamp?.(stUi.preamp);
          if (stUi.mono) P.setMono?.(true);
          if (stUi.pitchLock === false) P.setPitchLock?.(false);
        }).catch(() => null);
      } catch { /* ignore */ }
      scheduleAlarmCheck((alarm) => {
        (async () => {
          try {
            const songs = lib.songs || [];
            if (!songs.length) return;
            if (alarm.src === 'liked') {
              const liked = songs.filter((s) => s.liked);
              if (liked.length) await playSongs(liked, 0);
            } else if (alarm.src === 'mix') {
              const mix = [...songs].sort(() => Math.random() - 0.5).slice(0, 30);
              await playSongs(mix, 0);
            } else {
              const snapNow = getPlayerState();
              if (snapNow.queue?.length) playIndex(Math.max(0, snapNow.index));
              else await playSongs(songs, 0);
            }
            // زیاد شدن تدریجی صدا برای بیداری ملایم
            setVolume(0.05);
            let v = 0.05;
            const ramp = setInterval(() => {
              v = Math.min(0.8, v + 0.08);
              setVolume(v);
              if (v >= 0.8) clearInterval(ramp);
            }, 4000);
            toast.success('🔔 صبح بخیر! آلارم موزیک اجرا شد.');
          } catch { /* ignore */ }
        })();
      });
    } catch { /* ignore */ }

    refreshLibrary().then(() => {
      renderBar();
      updateBarDynamic();
      updateProgress();
    });

    visualRaf = requestAnimationFrame(drawVisual);
  }

  function destroy() {
    destroyed = true;
    ui.immersive = false;
    try {
      stopLyricsTicker();
      stopVisualizer();
      stopStudioTick();
      clearAlarmTimer();
    } catch { /* ignore */ }
    closeImmersiveEl();
    clearTimeout(searchTimer);
    stopDropWatchdog();
    cancelAnimationFrame(visualRaf);
    if (unsubPlayer) unsubPlayer();
    document.removeEventListener('keydown', handleKeydown);
    if (els.root) {
      els.root.removeEventListener('click', handleClick);
      els.root.removeEventListener('input', handleInput);
      els.root.removeEventListener('change', handleChange);
      els.root.removeEventListener('dragenter', handleDragEnter);
      els.root.removeEventListener('dragover', handleDragOver);
      els.root.removeEventListener('dragleave', handleDragLeave);
      els.root.removeEventListener('drop', handleDrop);
    }
    if (releaseCss) releaseCss();
    delete document.body.dataset.musicPage;
    saveQueueSnapshot();
  }

  return { render, afterRender, destroy };
}
