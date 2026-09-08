// src/pages/tools/music/music-mini-player.js

/**
 * ViXoRa Global Mini Player — مینی‌پلیر شناور سراسری
 * ==================================================================
 * از app.js سوار می‌شود و روی همه صفحات زندگی می‌کند.
 * وقتی کاربر داخل صفحه موزیک است مخفی می‌شود (تا با پلیر کامل تداخل نکند).
 */

import {
  subscribeMusicPlayer,
  getPlayerState,
  togglePlayback,
  nextTrack,
  prevTrack,
  closePlayer,
  restoreQueueSnapshot,
} from '../../../core/services/music-player-service.js';

import { getCoverUrl } from '../../../core/services/music-library-service.js';
import { gradientFor, initialOf } from '../../../core/schemas/music-schema.js';
import { escapeHtml } from '../../../utilities/dom-utils.js';
import { injectScopedCss } from '../../../utilities/css-scope.js';

const MINI_CSS = `
.mxmini-bar{position:fixed;bottom:18px;inset-inline:0;margin-inline:auto;width:min(480px,calc(100vw - 24px));z-index:8000;
display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:18px;color:#f2f5ff;
background:linear-gradient(150deg,rgba(20,16,45,.92),rgba(35,12,55,.92));
border:1px solid rgba(255,255,255,.14);box-shadow:0 20px 60px -12px rgba(124,58,237,.55),0 8px 24px rgba(0,0,0,.5);
backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
transform:translateY(140%);opacity:0;transition:transform .45s cubic-bezier(.2,.9,.25,1),opacity .3s ease}
.mxmini-bar.is-visible{transform:translateY(0);opacity:1}
.mxmini-cover{width:46px;height:46px;border-radius:12px;flex:0 0 auto;display:grid;place-items:center;overflow:hidden;
font-size:20px;font-weight:800;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.4);position:relative}
.mxmini-cover img{width:100%;height:100%;object-fit:cover}
.mxmini-cover.is-spinning::after{content:'';position:absolute;inset:0;border-radius:12px;
border:2px solid transparent;border-top-color:#fff;animation:mxmini-spin 1.2s linear infinite}
@keyframes mxmini-spin{to{transform:rotate(360deg)}}
.mxmini-meta{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.mxmini-title{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mxmini-artist{font-size:11.5px;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mxmini-progress{height:3px;border-radius:99px;background:rgba(255,255,255,.15);margin-top:5px;overflow:hidden}
.mxmini-progress > i{display:block;height:100%;width:0%;border-radius:99px;
background:linear-gradient(90deg,#22d3ee,#e879f9);box-shadow:0 0 8px #e879f9;transition:width .3s linear}
.mxmini-btns{display:flex;align-items:center;gap:2px}
.mxmini-btn{width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:#fff;
font-size:15px;cursor:pointer;display:grid;place-items:center;transition:transform .15s ease,background .2s}
.mxmini-btn:hover{background:rgba(255,255,255,.2);transform:scale(1.08)}
.mxmini-btn--play{width:42px;height:42px;font-size:17px;background:linear-gradient(135deg,#7c3aed,#db2777);
box-shadow:0 6px 18px -4px rgba(219,39,119,.7)}
.mxmini-btn--play:hover{background:linear-gradient(135deg,#8b5cf6,#ec4899)}
.mxmini-close{width:26px;height:26px;font-size:12px;opacity:.6}
.mxmini-eq{display:inline-flex;align-items:flex-end;gap:2px;height:14px}
.mxmini-eq i{width:3px;border-radius:2px;background:#22d3ee;animation:mxmini-eq 1s ease-in-out infinite}
.mxmini-eq i:nth-child(2){animation-delay:.2s;background:#e879f9}
.mxmini-eq i:nth-child(3){animation-delay:.4s;background:#facc15}
@keyframes mxmini-eq{0%,100%{height:5px}50%{height:14px}}
.mxmini-paused .mxmini-eq i{animation-play-state:paused;height:5px!important}
@media (max-width:520px){.mxmini-btn--hide-sm{display:none}.mxmini-bar{gap:8px;padding:8px 10px}}
`;

let mounted = false;
let root = null;
let coverImgSongId = null;

function esc(value) {
  return escapeHtml(value);
}

function isMusicPageActive() {
  return document.body?.dataset?.musicPage === '1';
}

function goToMusicPage() {
  try {
    const router = globalThis.appRouter;
    if (router && typeof router.navigate === 'function') {
      router.navigate('/tools/music');
      return;
    }
  } catch {
    /* ignore */
  }
  window.location.hash = '/tools/music';
  window.location.pathname = '/tools/music';
}

function render(snap) {
  if (!root) return;
  const song = snap.song;
  const shouldShow = Boolean(song) && !snap.hidden && !isMusicPageActive();
  root.classList.toggle('is-visible', shouldShow);
  root.classList.toggle('mxmini-paused', snap.status !== 'playing');
  if (!song) return;

  const playing = snap.status === 'playing';
  const pct = snap.duration > 0 ? Math.min(100, (snap.currentTime / snap.duration) * 100) : 0;

  root.querySelector('[data-mxmini="title"]').textContent = `${song.title || ''}`;
  root.querySelector('[data-mxmini="artist"]').textContent = song.artist || '';
  root.querySelector('[data-mxmini="bar"]').style.width = `${pct.toFixed(2)}%`;
  root.querySelector('[data-mxmini="play"]').innerHTML = playing ? '⏸' : '▶';
  root.querySelector('[data-mxmini="play"]').setAttribute('aria-label', playing ? 'توقف' : 'پخش');

  const cover = root.querySelector('[data-mxmini="cover"]');
  cover.classList.toggle('is-spinning', playing);
  if (coverImgSongId !== song.id) {
    coverImgSongId = song.id;
    cover.style.background = gradientFor(song.id);
    cover.innerHTML = `<span>${esc(initialOf(song.title))}</span>`;
    getCoverUrl('song', song.id)
      .then((url) => {
        if (url && coverImgSongId === song.id) {
          cover.innerHTML = '';
          const img = document.createElement('img');
          img.src = url;
          img.alt = '';
          cover.appendChild(img);
        }
      })
      .catch(() => null);
  }
}

export function mountGlobalMiniPlayer() {
  if (mounted || typeof document === 'undefined') return;
  mounted = true;

  injectScopedCss(MINI_CSS, 'music-mini');

  root = document.createElement('div');
  root.className = 'mxmini-bar';
  root.setAttribute('dir', 'rtl');
  root.innerHTML = `
    <div class="mxmini-cover" data-mxmini="cover"><span>♪</span></div>
    <div class="mxmini-meta" data-mxmini="open" style="cursor:pointer" title="باز کردن موزیک پلیر">
      <div class="mxmini-title" data-mxmini="title">—</div>
      <div class="mxmini-artist" data-mxmini="artist">—</div>
      <div class="mxmini-progress"><i data-mxmini="bar"></i></div>
    </div>
    <div class="mxmini-eq" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="mxmini-btns">
      <button class="mxmini-btn mxmini-btn--hide-sm" data-mxmini="prev" title="قبلی" aria-label="قبلی">⏮</button>
      <button class="mxmini-btn mxmini-btn--play" data-mxmini="play" title="پخش/توقف" aria-label="پخش">▶</button>
      <button class="mxmini-btn mxmini-btn--hide-sm" data-mxmini="next" title="بعدی" aria-label="بعدی">⏭</button>
      <button class="mxmini-btn mxmini-close" data-mxmini="close" title="بستن" aria-label="بستن">✕</button>
    </div>
  `;
  document.body.appendChild(root);

  root.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-mxmini]');
    if (!btn) return;
    const action = btn.dataset.mxmini;
    if (action === 'play') togglePlayback();
    else if (action === 'next') nextTrack(false);
    else if (action === 'prev') prevTrack();
    else if (action === 'close') closePlayer();
    else if (action === 'open') goToMusicPage();
  });

  // بازیابی صف قبلی (بدون پخش خودکار)
  try {
    restoreQueueSnapshot();
  } catch {
    /* ignore */
  }

  subscribeMusicPlayer((type, snap) => {
    if (type === 'time') {
      // به‌روزرسانی سبک نوار پیشرفت بدون رندر کامل
      const bar = root.querySelector('[data-mxmini="bar"]');
      if (bar && snap.duration > 0) {
        bar.style.width = `${Math.min(100, (snap.currentTime / snap.duration) * 100).toFixed(2)}%`;
      }
      return;
    }
    render(snap);
  });

  // وقتی وارد/خارج صفحه موزیک می‌شویم، دیده‌شدن را بازبینی کن
  setInterval(() => {
    if (!root) return;
    const song = getPlayerState().song;
    const shouldShow = Boolean(song) && !getPlayerState().hidden && !isMusicPageActive();
    root.classList.toggle('is-visible', shouldShow);
  }, 800);

  render(getPlayerState());
}
