// src/core/services/music-player-service.js

/**
 * ViXoRa Music Player Engine — موتور سراسری پخش موزیک
 * ==================================================================
 * ⭐ این سرویس مالک تکی (singleton) پخش است و بیرون از چرخه عمر
 * صفحات زندگی می‌کند؛ برای همین با ناوبری بین صفحات، موزیک قطع نمی‌شود.
 *
 * - دو المنت صوتی: یکی با گراف WebAudio (اکولایزر/ویژوالایزر واقعی)
 *   و یکی مستقیم (برای استریم‌هایی که CORS نمی‌دهند).
 * - صف پخش، شافل، تکرار، سرعت، خواب، fade، اکولایزر، بالانس.
 * - MediaSession برای کنترل از لاک‌اسکرین/بلوتوث/سیستم‌عامل.
 * - ذخیره خودکار صف و موقعیت برای ادامه بعد از بستن مرورگر.
 */

import {
  getTrackUrl,
  recordPlay,
  saveSongPosition,
  getCoverUrl,
  getHistory,
} from './music-library-service.js';

import {
  normalizeSong,
  REPEAT_MODES,
  EQ_PRESETS,
  gradientFor,
  initialOf,
} from '../schemas/music-schema.js';

import { createLocalStorageAdapter } from '../../utilities/storage.js';

const storage = createLocalStorageAdapter();

const PREFS_KEY = 'ViXoRa:music-prefs';
const QUEUE_KEY = 'ViXoRa:music-queue';
const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000];

/* ================================================================== */
/* state                                                                 */
/* ================================================================== */

const DEFAULT_PREFS = {
  volume: 0.9,
  muted: false,
  rate: 1,
  shuffle: false,
  repeat: 'off',
  fade: true,
  theme: 'neon',
  eqEnabled: true,
  eqPreset: 'flat',
  eqBands: [0, 0, 0, 0, 0],
  balance: 0,
};

function loadPrefs() {
  const saved = storage.get(PREFS_KEY, {});
  const prefs = { ...DEFAULT_PREFS, ...(saved || {}) };
  if (!REPEAT_MODES.includes(prefs.repeat)) prefs.repeat = 'off';
  if (!Array.isArray(prefs.eqBands) || prefs.eqBands.length !== 5) prefs.eqBands = [0, 0, 0, 0, 0];
  prefs.eqBands = prefs.eqBands.map((v) => Math.min(12, Math.max(-12, Number(v) || 0)));
  prefs.volume = Math.min(1, Math.max(0, Number(prefs.volume) || 0));
  prefs.rate = Math.min(2, Math.max(0.5, Number(prefs.rate) || 1));
  prefs.balance = Math.min(1, Math.max(-1, Number(prefs.balance) || 0));
  return prefs;
}

function savePrefs() {
  storage.set(PREFS_KEY, {
    volume: state.volume,
    muted: state.muted,
    rate: state.rate,
    shuffle: state.shuffle,
    repeat: state.repeat,
    fade: state.fade,
    theme: state.theme,
    eqEnabled: state.eqEnabled,
    eqPreset: state.eqPreset,
    eqBands: [...state.eqBands],
    balance: state.balance,
  });
}

const prefs = loadPrefs();

const state = {
  status: 'idle', // idle | loading | playing | paused | error
  song: null,
  queue: [],
  index: -1,
  contextLabel: '',
  shuffle: prefs.shuffle === true,
  repeat: prefs.repeat,
  volume: prefs.volume,
  muted: prefs.muted === true,
  rate: prefs.rate,
  currentTime: 0,
  duration: 0,
  liveAnalysis: false,
  fade: prefs.fade !== false,
  theme: prefs.theme || 'neon',
  eqEnabled: prefs.eqEnabled !== false,
  eqPreset: prefs.eqPreset || 'flat',
  eqBands: [...prefs.eqBands],
  balance: prefs.balance || 0,
  sleepEndAt: 0,
  sleepEndOfTrack: false,
  hidden: false,
  error: null,
  queueVersion: 0,
};

/* ================================================================== */
/* event emitter                                                         */
/* ================================================================== */

const listeners = new Set();

function snapshot() {
  return {
    ...state,
    queue: [...state.queue],
    eqBands: [...state.eqBands],
    song: state.song ? { ...state.song } : null,
  };
}

function emit(type) {
  const snap = snapshot();
  for (const listener of [...listeners]) {
    try {
      listener(type, snap);
    } catch (error) {
      console.error('[MusicPlayer] listener error:', error);
    }
  }
}

export function subscribeMusicPlayer(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPlayerState() {
  return snapshot();
}

/* ================================================================== */
/* audio elements + WebAudio graph                                       */
/* ================================================================== */

let elGraph = null; // با گراف WebAudio (اکولایزر/ویژوالایزر)
let elDirect = null; // مستقیم (استریم بدون CORS)
let activeEl = null;
let usingGraph = false;

let audioCtx = null;
let mediaSource = null;
let eqNodes = [];
let pannerNode = null;
let analyserNode = null;
let masterGain = null;

let shuffleHistory = [];
let consecutiveErrors = 0;
let trackStartedAt = 0;
let trackBaseSeconds = 0;
let lastTimeEmit = 0;
let lastPositionSave = 0;
let fadeTimer = null;
let sleepTimer = null;
let resumePosition = 0;

function applyOutputLevels() {
  const level = state.muted ? 0 : state.volume;
  if (masterGain) {
    try {
      masterGain.gain.setTargetAtTime(level, audioCtx.currentTime, 0.02);
    } catch {
      /* ignore */
    }
  }
  if (elDirect) elDirect.volume = level;
  if (elGraph) elGraph.volume = 1;
}

function applyRate() {
  if (elGraph) elGraph.playbackRate = state.rate;
  if (elDirect) elDirect.playbackRate = state.rate;
}

function applyEqToNodes() {
  if (!eqNodes.length || !audioCtx) return;
  const bands = state.eqEnabled ? state.eqBands : [0, 0, 0, 0, 0];
  eqNodes.forEach((node, i) => {
    try {
      node.gain.setTargetAtTime(bands[i] || 0, audioCtx.currentTime, 0.03);
    } catch {
      /* ignore */
    }
  });
}

function applyBalanceToNode() {
  if (!pannerNode || !audioCtx) return;
  try {
    pannerNode.pan.setTargetAtTime(state.balance || 0, audioCtx.currentTime, 0.03);
  } catch {
    /* ignore */
  }
}

function ensureElements() {
  if (elGraph && elDirect) return;

  elGraph = new Audio();
  elGraph.preload = 'auto';
  elGraph.volume = 1;

  elDirect = new Audio();
  elDirect.preload = 'auto';

  for (const el of [elGraph, elDirect]) {
    el.addEventListener('timeupdate', handleTimeUpdate);
    el.addEventListener('loadedmetadata', handleLoadedMetadata);
    el.addEventListener('ended', handleEnded);
    el.addEventListener('error', () => handleElementError(el));
    el.addEventListener('play', () => {
      if (el === activeEl && state.status !== 'playing') {
        state.status = 'playing';
        updateMediaSessionPlayback();
        emit('state');
      }
    });
    el.addEventListener('pause', () => {
      if (el === activeEl && state.status === 'playing') {
        state.status = 'paused';
        persistPosition();
        updateMediaSessionPlayback();
        emit('state');
      }
    });
  }

  applyOutputLevels();
  applyRate();
  activeEl = elDirect;
}

function ensureGraph() {
  ensureElements();
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => null);
    return true;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return false;
  try {
    audioCtx = new Ctx();
    mediaSource = audioCtx.createMediaElementSource(elGraph);
    let head = mediaSource;
    eqNodes = EQ_FREQUENCIES.map((freq) => {
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = 0;
      head.connect(filter);
      head = filter;
      return filter;
    });
    pannerNode = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
    if (pannerNode) {
      head.connect(pannerNode);
      head = pannerNode;
    }
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.82;
    head.connect(analyserNode);
    head = analyserNode;
    masterGain = audioCtx.createGain();
    head.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    applyEqToNodes();
    applyBalanceToNode();
    applyOutputLevels();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => null);
    return true;
  } catch (error) {
    console.warn('[MusicPlayer] WebAudio unavailable:', error?.message);
    audioCtx = null;
    return false;
  }
}

/* ================================================================== */
/* رویدادهای المنت                                                       */
/* ================================================================== */

function handleTimeUpdate(event) {
  if (event.target !== activeEl) return;
  state.currentTime = Number(activeEl.currentTime) || 0;
  if (Number.isFinite(activeEl.duration) && activeEl.duration > 0) {
    state.duration = activeEl.duration;
  }
  const now = Date.now();
  if (now - lastTimeEmit > 250) {
    lastTimeEmit = now;
    emit('time');
  }
  if (now - lastPositionSave > 10000 && state.song && state.status === 'playing') {
    lastPositionSave = now;
    persistPosition();
  }
  checkSleepTimer();
}

function handleLoadedMetadata(event) {
  if (event.target !== activeEl) return;
  if (Number.isFinite(activeEl.duration) && activeEl.duration > 0) {
    state.duration = activeEl.duration;
  }
  if (resumePosition > 0 && state.duration > 0) {
    const pos = Math.min(resumePosition, Math.max(0, state.duration - 5));
    if (pos > 5) {
      try {
        activeEl.currentTime = pos;
      } catch {
        /* ignore */
      }
      state.currentTime = pos;
    }
    resumePosition = 0;
  }
  emit('time');
}

function handleEnded() {
  if (state.sleepEndOfTrack) {
    clearSleepTimer();
    pausePlayback(false);
    emit('sleep');
    return;
  }
  finishTrack(true);
}

function handleElementError(el) {
  if (el !== activeEl) return;
  // اگر گراف شکست خورد (معمولاً CORS)، با المنت مستقیم دوباره تلاش کن
  if (usingGraph && state.song) {
    switchToDirectAndRetry();
    return;
  }
  onTrackFailed('پخش این آهنگ ممکن نشد.');
}

function onTrackFailed(message) {
  consecutiveErrors += 1;
  state.status = 'error';
  state.error = message;
  emit('error');

  // اگر کل صف خراب است، بعد از ۳ خطا پشت‌سرهم بی‌خیال شو
  if (consecutiveErrors >= 3) {
    state.status = 'paused';
    emit('state');
    return;
  }
  setTimeout(() => {
    if (state.status === 'error') nextTrack(true);
  }, 1200);
}

/* ================================================================== */
/* fade                                                                  */
/* ================================================================== */

function stopFade() {
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

function rampLevel(from, to, ms, done) {
  stopFade();
  if (!state.fade || ms <= 0) {
    applyOutputLevels();
    if (done) done();
    return;
  }
  const steps = 12;
  let i = 0;
  const applyTemp = (level) => {
    if (masterGain && audioCtx) {
      try {
        masterGain.gain.setTargetAtTime(level, audioCtx.currentTime, 0.02);
      } catch {
        /* ignore */
      }
    }
    if (elDirect) elDirect.volume = level;
  };
  applyTemp(from);
  fadeTimer = setInterval(() => {
    i += 1;
    const t = Math.min(1, i / steps);
    applyTemp(from + (to - from) * t);
    if (t >= 1) {
      stopFade();
      applyOutputLevels();
      if (done) done();
    }
  }, Math.max(10, Math.floor(ms / steps)));
}

/* ================================================================== */
/* بارگذاری و پخش تراک                                                   */
/* ================================================================== */

function persistPosition() {
  if (state.song && state.status === 'playing' && state.currentTime > 5) {
    saveSongPosition(state.song.id, state.currentTime);
  }
}

function listenedSecondsSoFar() {
  if (!trackStartedAt) return trackBaseSeconds;
  return trackBaseSeconds + Math.max(0, (Date.now() - trackStartedAt) / 1000);
}

function beginListenClock() {
  trackStartedAt = Date.now();
  trackBaseSeconds = 0;
}

function pauseListenClock() {
  if (trackStartedAt) {
    trackBaseSeconds += Math.max(0, (Date.now() - trackStartedAt) / 1000);
    trackStartedAt = 0;
  }
}

/** پایان تراک: ثبت آمار + رفتن به بعدی */
function finishTrack(natural) {
  const finished = state.song;
  const seconds = listenedSecondsSoFar();
  trackStartedAt = 0;
  trackBaseSeconds = 0;

  if (finished && (natural || seconds > 30 || (state.duration > 0 && seconds > state.duration * 0.5))) {
    recordPlay(finished.id, seconds).catch(() => null);
  } else if (finished) {
    persistPosition();
  }

  if (!natural) return;

  if (state.repeat === 'one' && state.song) {
    loadTrack(state.song, { autoplay: true, startAt: 0 });
    return;
  }
  nextTrack(true);
}

async function switchToDirectAndRetry() {
  const song = state.song;
  if (!song) return;
  try {
    elGraph.pause();
  } catch {
    /* ignore */
  }
  usingGraph = false;
  state.liveAnalysis = false;
  activeEl = elDirect;
  activeEl.removeAttribute('crossorigin');
  try {
    activeEl.src = await getTrackUrl(song);
    activeEl.load();
    applyRate();
    applyOutputLevels();
    await activeEl.play();
    state.status = 'playing';
    consecutiveErrors = 0;
    emit('state');
  } catch (error) {
    onTrackFailed('پخش این آهنگ ممکن نشد.');
  }
}

export async function loadTrack(song, { autoplay = true, startAt = null } = {}) {
  ensureElements();
  const normalized = normalizeSong(song || {});
  if (!normalized.id) throw new Error('آهنگ نامعتبر است.');

  // ذخیره موقعیت تراک قبلی
  if (state.song && state.song.id !== normalized.id) persistPosition();

  stopFade();
  try {
    elGraph.pause();
  } catch {
    /* ignore */
  }
  try {
    elDirect.pause();
  } catch {
    /* ignore */
  }

  state.song = { ...normalized, lyrics: '' };
  state.currentTime = 0;
  state.duration = normalized.duration || 0;
  state.status = 'loading';
  state.error = null;
  state.hidden = false;
  state.liveAnalysis = false;
  emit('track');
  emit('state');

  const { pushHistory } = await import('./music-library-service.js').catch(() => ({}));
  if (typeof pushHistory === 'function') {
    try {
      pushHistory(normalized.id);
    } catch {
      /* ignore */
    }
  }

  // موقعیت ادامه: صریح > ذخیره‌شده
  let start = typeof startAt === 'number' ? startAt : normalized.lastPosition || 0;
  if (!(start > 5) || (state.duration > 0 && start > state.duration - 10)) start = 0;
  resumePosition = start;

  let src;
  try {
    src = await getTrackUrl(normalized);
  } catch (error) {
    onTrackFailed(error?.message || 'فایل صوتی یافت نشد.');
    return false;
  }

  // همیشه اول گراف را امتحان کن (اکولایزر/ویژوالایزر واقعی)
  const graphReady = ensureGraph();
  usingGraph = graphReady;
  activeEl = graphReady ? elGraph : elDirect;
  state.liveAnalysis = graphReady;

  if (graphReady && /^https?:\/\//i.test(src)) {
    activeEl.crossOrigin = 'anonymous';
  } else {
    activeEl.removeAttribute('crossorigin');
  }

  try {
    activeEl.src = src;
    activeEl.load();
    applyRate();
    applyOutputLevels();
  } catch (error) {
    onTrackFailed('پخش این آهنگ ممکن نشد.');
    return false;
  }

  updateMediaSession(normalized);

  if (autoplay) {
    try {
      if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume().catch(() => null);
      const target = state.muted ? 0 : state.volume;
      if (state.fade && target > 0) {
        if (masterGain && audioCtx) masterGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.02);
        if (!usingGraph && elDirect) elDirect.volume = 0.0001;
      }
      await activeEl.play();
      state.status = 'playing';
      state.currentTime = Number(activeEl.currentTime) || start;
      beginListenClock();
      consecutiveErrors = 0;
      if (state.fade && target > 0) rampLevel(0.0001, target, 600);
      else applyOutputLevels();
      updateMediaSessionPlayback();
      saveQueueSnapshot();
      emit('state');
      return true;
    } catch (error) {
      state.status = 'paused';
      emit('state');
      return false;
    }
  }

  state.status = 'paused';
  emit('state');
  return true;
}

export async function playPlayback() {
  ensureElements();
  if (!state.song) {
    if (state.queue.length) {
      return loadTrack(state.queue[Math.max(0, state.index)], { autoplay: true });
    }
    return false;
  }
  if (!activeEl.src) {
    return loadTrack(state.song, { autoplay: true });
  }
  try {
    if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume().catch(() => null);
    const target = state.muted ? 0 : state.volume;
    if (state.fade && target > 0 && activeEl.paused) rampLevel(0.0001, target, 400);
    await activeEl.play();
    state.status = 'playing';
    beginListenClock();
    updateMediaSessionPlayback();
    emit('state');
    return true;
  } catch {
    state.status = 'paused';
    emit('state');
    return false;
  }
}

export function pausePlayback(withFade = true) {
  ensureElements();
  if (!activeEl) return;
  pauseListenClock();
  persistPosition();
  const doPause = () => {
    try {
      activeEl.pause();
    } catch {
      /* ignore */
    }
    state.status = 'paused';
    updateMediaSessionPlayback();
    saveQueueSnapshot();
    emit('state');
  };
  if (withFade && state.fade && !activeEl.paused) {
    rampLevel(state.muted ? 0 : state.volume, 0.0001, 300, doPause);
  } else {
    doPause();
  }
}

export async function togglePlayback() {
  if (state.status === 'playing') {
    pausePlayback(true);
    return false;
  }
  return playPlayback();
}

/** بستن کامل پلیر (مینی‌پلیر هم مخفی می‌شود تا پخش بعدی) */
export function closePlayer() {
  pauseListenClock();
  persistPosition();
  try {
    elGraph?.pause();
  } catch {
    /* ignore */
  }
  try {
    elDirect?.pause();
  } catch {
    /* ignore */
  }
  clearSleepTimer();
  state.status = 'paused';
  state.hidden = true;
  updateMediaSessionPlayback();
  saveQueueSnapshot();
  emit('state');
}

export function reopenPlayer() {
  state.hidden = false;
  emit('state');
}

/* ================================================================== */
/* صف پخش                                                               */
/* ================================================================== */

function toSnapshot(song) {
  const s = normalizeSong(song || {});
  s.lyrics = '';
  return s;
}

export function setQueue(songs, { index = 0, autoplay = true, contextLabel = '' } = {}) {
  const list = (Array.isArray(songs) ? songs : []).map(toSnapshot).filter((s) => s.id);
  if (!list.length) return false;
  state.queue = list;
  state.index = Math.min(Math.max(0, index), list.length - 1);
  state.contextLabel = String(contextLabel || '');
  state.queueVersion += 1;
  shuffleHistory = [state.index];
  emit('queue');
  return loadTrack(list[state.index], { autoplay });
}

export function playSongs(songs, startId = null, contextLabel = '') {
  const list = (Array.isArray(songs) ? songs : []).map(toSnapshot).filter((s) => s.id);
  if (!list.length) return false;
  let index = 0;
  if (startId) {
    const found = list.findIndex((s) => s.id === startId);
    if (found >= 0) index = found;
  }
  return setQueue(list, { index, autoplay: true, contextLabel });
}

export function playIndex(i) {
  const idx = Number(i);
  if (!Number.isInteger(idx) || idx < 0 || idx >= state.queue.length) return false;
  state.index = idx;
  shuffleHistory.push(idx);
  state.queueVersion += 1;
  emit('queue');
  return loadTrack(state.queue[idx], { autoplay: true, startAt: 0 });
}

export function enqueueSong(song, { playNext = false } = {}) {
  const snap = toSnapshot(song);
  if (!snap.id) return false;
  if (!state.queue.length) return setQueue([snap], { autoplay: true });
  const at = playNext ? state.index + 1 : state.queue.length;
  state.queue.splice(Math.min(at, state.queue.length), 0, snap);
  state.queueVersion += 1;
  saveQueueSnapshot();
  emit('queue');
  return true;
}

export function removeFromQueue(i) {
  const idx = Number(i);
  if (!Number.isInteger(idx) || idx < 0 || idx >= state.queue.length) return false;
  const removingCurrent = idx === state.index;
  state.queue.splice(idx, 1);
  if (!state.queue.length) {
    state.index = -1;
    state.song = null;
    state.status = 'paused';
    pausePlayback(false);
    saveQueueSnapshot();
    emit('queue');
    emit('state');
    return true;
  }
  if (removingCurrent) {
    state.index = Math.min(idx, state.queue.length - 1);
    state.queueVersion += 1;
    emit('queue');
    return loadTrack(state.queue[state.index], { autoplay: true, startAt: 0 });
  }
  if (idx < state.index) state.index -= 1;
  state.queueVersion += 1;
  saveQueueSnapshot();
  emit('queue');
  return true;
}

export function moveInQueue(i, direction) {
  const idx = Number(i);
  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= state.queue.length) return false;
  [state.queue[idx], state.queue[swapWith]] = [state.queue[swapWith], state.queue[idx]];
  if (state.index === idx) state.index = swapWith;
  else if (state.index === swapWith) state.index = idx;
  state.queueVersion += 1;
  saveQueueSnapshot();
  emit('queue');
  return true;
}

export function clearQueue() {
  pausePlayback(false);
  state.queue = [];
  state.index = -1;
  state.song = null;
  state.status = 'idle';
  state.currentTime = 0;
  state.duration = 0;
  state.queueVersion += 1;
  shuffleHistory = [];
  saveQueueSnapshot();
  emit('queue');
  emit('state');
}

export function shuffleQueueNow() {
  if (state.queue.length < 2) return false;
  const current = state.queue[state.index];
  const rest = state.queue.filter((_, i) => i !== state.index);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  state.queue = current ? [current, ...rest] : rest;
  state.index = 0;
  shuffleHistory = [0];
  state.queueVersion += 1;
  saveQueueSnapshot();
  emit('queue');
  return true;
}

function pickShuffleIndex() {
  if (state.queue.length < 2) return state.index;
  const played = new Set(shuffleHistory.slice(-Math.min(shuffleHistory.length, state.queue.length - 1)));
  const candidates = state.queue.map((_, i) => i).filter((i) => i !== state.index && !played.has(i));
  const pool = candidates.length ? candidates : state.queue.map((_, i) => i).filter((i) => i !== state.index);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function nextTrack(auto = false) {
  if (!state.queue.length) return false;
  if (state.song && !auto) {
    // رد کردن دستی: اگر به‌اندازه کافی گوش داده، ثبت کن
    const seconds = listenedSecondsSoFar();
    if (seconds > 30 || (state.duration > 0 && seconds > state.duration * 0.5)) {
      recordPlay(state.song.id, seconds).catch(() => null);
    } else {
      persistPosition();
    }
    trackStartedAt = 0;
    trackBaseSeconds = 0;
  }

  let nextIndex = state.index + 1;
  if (state.shuffle) {
    nextIndex = pickShuffleIndex();
    shuffleHistory.push(nextIndex);
  }
  if (nextIndex >= state.queue.length) {
    if (state.repeat === 'all' || state.shuffle) {
      nextIndex = 0;
      if (state.shuffle) shuffleHistory = [0];
    } else {
      // پایان صف
      if (state.song) persistPosition();
      state.status = 'paused';
      try {
        if (activeEl) activeEl.currentTime = 0;
      } catch {
        /* ignore */
      }
      state.currentTime = 0;
      saveQueueSnapshot();
      emit('state');
      return true;
    }
  }
  state.index = nextIndex;
  state.queueVersion += 1;
  emit('queue');
  return loadTrack(state.queue[nextIndex], { autoplay: true, startAt: 0 });
}

export function prevTrack() {
  if (!state.queue.length) return false;
  // اگر از شروع تراک گذشته‌ایم، همان تراک از اول
  if (state.currentTime > 4 && activeEl) {
    try {
      activeEl.currentTime = 0;
    } catch {
      /* ignore */
    }
    state.currentTime = 0;
    emit('time');
    return true;
  }
  if (state.shuffle && shuffleHistory.length > 1) {
    shuffleHistory.pop();
    const prevIndex = shuffleHistory[shuffleHistory.length - 1];
    state.index = prevIndex;
  } else {
    state.index = (state.index - 1 + state.queue.length) % state.queue.length;
  }
  state.queueVersion += 1;
  emit('queue');
  return loadTrack(state.queue[state.index], { autoplay: true, startAt: 0 });
}

/* ================================================================== */
/* seek / volume / rate / shuffle / repeat                               */
/* ================================================================== */

export function seekTo(seconds) {
  ensureElements();
  if (!activeEl || !state.song) return;
  const target = Math.min(Math.max(0, Number(seconds) || 0), state.duration || 0);
  try {
    activeEl.currentTime = target;
  } catch {
    /* ignore */
  }
  state.currentTime = target;
  emit('time');
}

export function seekBy(delta) {
  seekTo(state.currentTime + Number(delta || 0));
}

export function setVolume(value) {
  const v = Math.min(1, Math.max(0, Number(value)));
  if (!Number.isFinite(v)) return;
  state.volume = v;
  if (v > 0 && state.muted) state.muted = false;
  applyOutputLevels();
  savePrefs();
  emit('state');
}

export function toggleMute() {
  state.muted = !state.muted;
  applyOutputLevels();
  savePrefs();
  emit('state');
  return state.muted;
}

export function setRate(value) {
  const r = Math.min(2, Math.max(0.5, Number(value) || 1));
  state.rate = r;
  applyRate();
  savePrefs();
  emit('state');
}

export function toggleShuffle() {
  state.shuffle = !state.shuffle;
  if (state.shuffle) shuffleHistory = [state.index];
  savePrefs();
  emit('state');
  return state.shuffle;
}

export function cycleRepeat() {
  const order = ['off', 'all', 'one'];
  state.repeat = order[(order.indexOf(state.repeat) + 1) % order.length];
  savePrefs();
  emit('state');
  return state.repeat;
}

export function toggleFade() {
  state.fade = !state.fade;
  savePrefs();
  emit('state');
  return state.fade;
}

/* ================================================================== */
/* اکولایزر و بالانس                                                     */
/* ================================================================== */

export function setEqBand(i, value) {
  const idx = Number(i);
  if (idx < 0 || idx > 4) return;
  state.eqBands[idx] = Math.min(12, Math.max(-12, Number(value) || 0));
  state.eqPreset = 'custom';
  applyEqToNodes();
  savePrefs();
  emit('state');
}

export function setEqPreset(name) {
  if (name === 'custom') return;
  const preset = EQ_PRESETS[name];
  if (!preset) return;
  state.eqBands = [...preset.bands];
  state.eqPreset = name;
  state.eqEnabled = true;
  applyEqToNodes();
  savePrefs();
  emit('state');
}

export function toggleEq() {
  state.eqEnabled = !state.eqEnabled;
  applyEqToNodes();
  savePrefs();
  emit('state');
  return state.eqEnabled;
}

export function setBalance(value) {
  state.balance = Math.min(1, Math.max(-1, Number(value) || 0));
  applyBalanceToNode();
  savePrefs();
  emit('state');
}

/* ================================================================== */
/* تم پلیر                                                               */
/* ================================================================== */

export function setPlayerTheme(theme) {
  state.theme = theme || 'neon';
  savePrefs();
  emit('state');
}

/* ================================================================== */
/* تایمر خواب                                                            */
/* ================================================================== */

function checkSleepTimer() {
  if (state.sleepEndAt > 0 && Date.now() >= state.sleepEndAt) {
    clearSleepTimer();
    pausePlayback(true);
    emit('sleep');
  }
}

export function setSleepTimer(option) {
  clearSleepTimer();
  if (option === 'track') {
    state.sleepEndOfTrack = true;
    emit('state');
    return true;
  }
  const minutes = Number(option);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    state.sleepEndAt = 0;
    emit('state');
    return false;
  }
  state.sleepEndAt = Date.now() + minutes * 60 * 1000;
  sleepTimer = setInterval(checkSleepTimer, 1000);
  emit('state');
  return true;
}

export function clearSleepTimer() {
  if (sleepTimer) {
    clearInterval(sleepTimer);
    sleepTimer = null;
  }
  state.sleepEndAt = 0;
  state.sleepEndOfTrack = false;
}

export function getSleepRemaining() {
  if (state.sleepEndOfTrack) return 'track';
  if (state.sleepEndAt > Date.now()) return Math.ceil((state.sleepEndAt - Date.now()) / 1000);
  return 0;
}

/* ================================================================== */
/* ویژوالایزر (داده خام تحلیل‌گر)                                         */
/* ================================================================== */

const VISUAL_BINS = 48;

export function readVisualData(target) {
  const out = target && target.length === VISUAL_BINS ? target : new Array(VISUAL_BINS).fill(0);
  if (state.liveAnalysis && analyserNode && state.status === 'playing') {
    try {
      const raw = new Uint8Array(analyserNode.frequencyBinCount);
      analyserNode.getByteFrequencyData(raw);
      // نگاشت لگاریتمی به ۴۸ ستون برای حس موسیقیایی‌تر
      for (let i = 0; i < VISUAL_BINS; i += 1) {
        const t = i / VISUAL_BINS;
        const idx = Math.floor(Math.pow(t, 1.6) * raw.length * 0.72);
        out[i] = Math.min(1, (raw[idx] || 0) / 255);
      }
      return { live: true, data: out };
    } catch {
      /* fallthrough to simulated */
    }
  }
  return { live: false, data: out };
}

/* ================================================================== */
/* MediaSession                                                          */
/* ================================================================== */

const artworkCache = new Map();

function makeArtwork(song) {
  if (artworkCache.has(song.id)) return artworkCache.get(song.id);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const hash = [...String(song.id)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const hue = hash % 360;
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, `hsl(${hue},80%,45%)`);
    grad.addColorStop(1, `hsl(${(hue + 70) % 360},85%,55%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = 'bold 240px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initialOf(song.title), 256, 270);
    const url = canvas.toDataURL('image/png');
    artworkCache.set(song.id, url);
    return url;
  } catch {
    return '';
  }
}

async function resolveArtwork(song) {
  try {
    const cover = await getCoverUrl('song', song.id);
    if (cover) return cover;
  } catch {
    /* ignore */
  }
  return makeArtwork(song);
}

export async function updateMediaSession(song = null) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  const target = song || state.song;
  if (!target) return;
  try {
    const artwork = await resolveArtwork(target);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: target.title || 'آهنگ بدون نام',
      artist: target.artist || 'خواننده ناشناس',
      album: target.album || 'ViXoRa Music',
      artwork: artwork ? [{ src: artwork, sizes: '512x512', type: 'image/png' }] : [],
    });
    navigator.mediaSession.setActionHandler('play', () => playPlayback());
    navigator.mediaSession.setActionHandler('pause', () => pausePlayback(false));
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack(false));
  } catch {
    /* ignore */
  }
}

function updateMediaSessionPlayback() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state.status === 'playing' ? 'playing' : 'paused';
  } catch {
    /* ignore */
  }
}

/* ================================================================== */
/* ذخیره و بازیابی صف                                                     */
/* ================================================================== */

let snapshotTimer = null;

export function saveQueueSnapshot() {
  if (snapshotTimer) clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => {
    try {
      storage.set(QUEUE_KEY, {
        queue: state.queue.slice(0, 300),
        index: state.index,
        songId: state.song?.id || null,
        time: state.currentTime || 0,
        savedAt: new Date().toISOString(),
      });
    } catch {
      /* ignore */
    }
  }, 400);
}

/** بازیابی صف بعد از رفرش/بستن مرورگر (بدون پخش خودکار) */
export function restoreQueueSnapshot() {
  try {
    const snap = storage.get(QUEUE_KEY, null);
    if (!snap || !Array.isArray(snap.queue) || !snap.queue.length) return false;
    state.queue = snap.queue.map(toSnapshot).filter((s) => s.id);
    if (!state.queue.length) return false;
    state.index = Math.min(Math.max(0, Number(snap.index) || 0), state.queue.length - 1);
    state.song = { ...state.queue[state.index] };
    state.currentTime = Number(snap.time) || 0;
    state.duration = state.song.duration || 0;
    state.status = 'paused';
    resumePosition = state.currentTime > 5 ? state.currentTime : 0;
    state.queueVersion += 1;
    shuffleHistory = [state.index];
    updateMediaSession(state.song);
    emit('queue');
    emit('state');
    return true;
  } catch {
    return false;
  }
}

/* ذخیره اضطراری هنگام بستن تب */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      persistPosition();
      storage.set(QUEUE_KEY, {
        queue: state.queue.slice(0, 300),
        index: state.index,
        songId: state.song?.id || null,
        time: Number(activeEl?.currentTime) || state.currentTime || 0,
        savedAt: new Date().toISOString(),
      });
    } catch {
      /* ignore */
    }
  });
}

/* مرجع برای دیباگ */
export function __debugPlayer() {
  return { state: snapshot(), usingGraph, hasCtx: Boolean(audioCtx) };
}
