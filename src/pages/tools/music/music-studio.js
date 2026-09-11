// 🎛 ViXoRa Sound Studio — حلقه A-B، بوکمارک، پری‌امپ/مونو، فید هوشمند، ویژوالایزر
import { faDigits } from '../../../core/schemas/music-schema.js';
import {
  getPlayerState, seekTo, togglePlayback, setEqBand, toggleEq,
  readVisualData, playSongs, setVolume,
} from '../../../core/services/music-player-service.js';

const UI_KEY = 'ViXoRa:music-studio-ui';
const BM_KEY = 'ViXoRa:music-bookmarks';
const EQ_KEY = 'ViXoRa:music-eq-custom';

function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
function loadUi() {
  try {
    return {
      ab: null, fadeSecs: 0, visMode: 'bars', visColor: '#8b5cf6', mirror: true,
      preamp: 0, mono: false, pitchLock: true, metronome: 0, ...JSON.parse(localStorage.getItem(UI_KEY) || '{}'),
    };
  } catch { return { ab: null, fadeSecs: 0, visMode: 'bars', visColor: '#8b5cf6', mirror: true, preamp: 0, mono: false, pitchLock: true, metronome: 0 }; }
}
function saveUi(patch) {
  const u = { ...loadUi(), ...patch };
  try { localStorage.setItem(UI_KEY, JSON.stringify(u)); } catch { /* ignore */ }
  return u;
}
function loadBm() { try { return JSON.parse(localStorage.getItem(BM_KEY) || '{}'); } catch { return {}; } }
function saveBm(b) { try { localStorage.setItem(BM_KEY, JSON.stringify(b)); } catch { /* ignore */ } }
function loadEqCustom() { try { return JSON.parse(localStorage.getItem(EQ_KEY) || '[]'); } catch { return []; } }
function saveEqCustom(c) { try { localStorage.setItem(EQ_KEY, JSON.stringify(c.slice(0, 12))); } catch { /* ignore */ } }
function fmtT(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0],
  pop: [2, 3, 0, 1, 3],
  rock: [4, 2, -1, 2, 4],
  jazz: [3, 1, 1, 2, 3],
  classical: [3, 2, 0, 2, 4],
  dance: [4, 3, 0, 3, 2],
  bass: [6, 4, 1, 0, 0],
  vocal: [-2, 0, 3, 3, 1],
  acoustic: [3, 2, 1, 1, 2],
  lofi: [2, 1, -1, -1, -2],
};
const EQ_NAMES = { flat: 'تخت', pop: 'پاپ', rock: 'راک', jazz: 'جاز', classical: 'کلاسیک', dance: 'دَنس', bass: 'بم قوی', vocal: 'وکال', acoustic: 'آکوستیک', lofi: 'لوفای' };
const EQ_FREQS = ['۶۰', '۲۵۰', '۱K', '۴K', '۱۲K'];

/* ---------- حلقه A-B + فید هوشمند (تیک سراسری) ---------- */
let tickTimer = 0;
let fadeBase = null;
let fadeTrackId = '';
export function startStudioTick(onAbLoop) {
  stopStudioTick();
  tickTimer = setInterval(() => {
    try {
      const st = getPlayerState();
      if (!st.song || !st.playing) { fadeBase = null; fadeTrackId = ''; return; }
      const ui = loadUi();
      const pos = st.position || 0, dur = st.duration || 0;
      if (ui.ab && Number.isFinite(ui.ab.a) && Number.isFinite(ui.ab.b) && ui.ab.b > ui.ab.a) {
        if (pos < ui.ab.a - 0.4 || pos > ui.ab.b) {
          seekTo(ui.ab.a + 0.01);
          onAbLoop?.();
        }
      }
      // فید هوشمند پایان ترک
      const trackId = String(st.song.id || '');
      if (trackId !== fadeTrackId) { if (fadeBase != null) { try { setVolume(fadeBase); } catch { /* ignore */ } } fadeTrackId = trackId; fadeBase = null; }
      const fz = Number(ui.fadeSecs || 0);
      if (fz > 0 && dur > fz + 2 && !ui.ab) {
        const remain = dur - pos;
        if (remain < fz && remain > 0) {
          if (fadeBase == null) fadeBase = st.volume ?? 0.8;
          const ratio = Math.max(0.05, remain / fz);
          setVolume(Math.max(0.01, fadeBase * ratio * ratio));
        } else if (fadeBase != null && remain >= fz) {
          setVolume(fadeBase);
          fadeBase = null;
        }
      } else if (fadeBase != null) {
        setVolume(fadeBase);
        fadeBase = null;
      }
    } catch { /* ignore */ }
  }, 220);
}
export function stopStudioTick() { clearInterval(tickTimer); tickTimer = 0; }

/* ---------- ویژوالایزر ---------- */
let visRaf = 0;
export function startVisualizer(canvas, getOpts) {
  stopVisualizer();
  const draw = () => {
    if (!canvas.isConnected) { stopVisualizer(); return; }
    const opts = getOpts();
    const data = readVisualData(96) || { freq: [], wave: [] };
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 180;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const col = opts.color || '#8b5cf6';
    const freq = data.freq?.length ? [...data.freq] : new Array(64).fill(0);
    const wave = data.wave?.length ? [...data.wave] : new Array(128).fill(128);
    if (opts.mode === 'wave') {
      c.beginPath();
      wave.forEach((v, i) => {
        const x = (i / (wave.length - 1)) * w;
        const y = h / 2 + ((v - 128) / 128) * (h / 2 - 6);
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      });
      c.strokeStyle = col; c.lineWidth = 2.5; c.stroke();
      c.lineTo(w, h); c.lineTo(0, h); c.closePath();
      c.fillStyle = col + '33'; c.fill();
    } else if (opts.mode === 'circle') {
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 14;
      c.beginPath(); c.arc(cx, cy, R * 0.45, 0, 7); c.fillStyle = col + '22'; c.fill();
      const n = 56;
      for (let i = 0; i < n; i++) {
        const v = (freq[Math.floor((i / n) * freq.length)] || 0) / 255;
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const r1 = R * 0.5, r2 = R * (0.5 + v * 0.5);
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        c.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        c.strokeStyle = col; c.lineWidth = 3; c.lineCap = 'round'; c.stroke();
      }
    } else if (opts.mode === 'vu') {
      const avg = freq.reduce((a, b) => a + b, 0) / Math.max(1, freq.length) / 255;
      const peak = Math.max(...freq) / 255;
      c.fillStyle = 'rgba(255,255,255,.08)';
      c.beginPath(); c.roundRect(10, h / 2 - 14, w - 20, 28, 14); c.fill();
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#34d399'); g.addColorStop(0.7, '#fbbf24'); g.addColorStop(1, '#ef4444');
      c.fillStyle = g;
      c.beginPath(); c.roundRect(10, h / 2 - 14, Math.max(8, (w - 20) * avg), 28, 14); c.fill();
      c.fillStyle = '#fff';
      c.fillRect(10 + (w - 20) * Math.min(1, peak) - 2, h / 2 - 20, 4, 40);
      c.fillStyle = '#9aa3c0'; c.font = '12px Tahoma'; c.textAlign = 'center';
      c.fillText('VU ' + faDigits(String(Math.round(avg * 100))) + '٪', w / 2, h / 2 + 34);
    } else if (opts.mode === 'particles') {
      const n = 40;
      for (let i = 0; i < n; i++) {
        const v = (freq[Math.floor((i / n) * freq.length)] || 0) / 255;
        const x = (i / n) * w + w / n / 2;
        const r = 2 + v * 9;
        c.beginPath(); c.arc(x, h - 14 - v * (h - 30), r, 0, 7);
        c.fillStyle = col + Math.round(60 + v * 160).toString(16).padStart(2, '0');
        c.fill();
      }
    } else {
      // bars
      const n = 48;
      const bw = w / n;
      for (let i = 0; i < n; i++) {
        const v = (freq[Math.floor((i / n) * freq.length)] || 0) / 255;
        const bh = Math.max(3, v * (h - 16));
        const g = c.createLinearGradient(0, h - bh, 0, h);
        g.addColorStop(0, col); g.addColorStop(1, col + '33');
        c.fillStyle = g;
        const x = w - (i + 1) * bw + 1;
        c.beginPath(); c.roundRect(x, h - 8 - bh, bw - 2, bh, 3); c.fill();
        if (opts.mirror) {
          c.globalAlpha = 0.25;
          c.beginPath(); c.roundRect(x, 8, bw - 2, Math.min(8 + bh * 0.3, h / 2 - 10), 3); c.fill();
          c.globalAlpha = 1;
        }
      }
    }
    visRaf = requestAnimationFrame(draw);
  };
  draw();
}
export function stopVisualizer() { cancelAnimationFrame(visRaf); visRaf = 0; }

/* ---------- رندر ---------- */
const VIS_MODES = [['bars', '📊 میله‌ای'], ['wave', '🌊 موج'], ['circle', '⭕ دایره‌ای'], ['vu', '🎚 VU متر'], ['particles', '✨ ذرات']];

export function renderStudioView(lib, snap) {
  const ui = loadUi();
  const songs = lib.songs || [];
  const cur = snap.song;
  const bm = loadBm();
  const curBm = cur ? (bm[String(cur.id)] || []) : [];
  const allBmCount = Object.values(bm).reduce((a, arr) => a + arr.length, 0);
  const customs = loadEqCustom();
  const ab = ui.ab;

  return `
  <div class="mx-secbar"><h3>🎛 استودیو صدا</h3>
    <div class="mx-secbar-actions"><span class="mx-hint-inline">🎧 ${cur ? esc(cur.title || '') : 'چیزی پخش نمی‌شود'}</span></div>
  </div>
  <div class="mx-grid-2">
    <div class="mx-panel"><h4>🔁 حلقه A-B (تکرار بخش)</h4>
      <div class="mx-stats-row">
        <span class="mx-stat">🅰 ${ab ? fmtT(ab.a) : '—'}</span>
        <span class="mx-stat">🅱 ${ab ? fmtT(ab.b) : '—'}</span>
        <span class="mx-stat">${ab ? '🟢 فعال' : '⚪ غیرفعال'}</span>
      </div>
      <div class="mx-btn-row">
        <button class="mx-btn mx-btn--sm" data-action="st-ab-a">🅰 ثبت نقطه شروع</button>
        <button class="mx-btn mx-btn--sm" data-action="st-ab-b">🅱 ثبت نقطه پایان</button>
        <button class="mx-btn mx-btn--sm" data-action="st-ab-play">▶ پخش حلقه</button>
        <button class="mx-btn mx-btn--sm mx-btn--danger" data-action="st-ab-clear">✕ لغو حلقه</button>
      </div>
      <div class="mx-hint">برای تمرین موسیقی و زبان: بخشی را انتخاب کن تا بی‌نهایت تکرار شود.</div>
      <h4>📑 بوکمارک‌های این آهنگ (${faDigits(String(curBm.length))})</h4>
      <div class="mx-btn-row">
        <input data-st="bm-label" placeholder="عنوان نشان…" class="mx-input" />
        <button class="mx-btn mx-btn--sm mx-btn--primary" data-action="st-bm-add">🔖 ثبت در لحظه فعلی</button>
      </div>
      <div class="mx-lab-list">${curBm.map((b, i) => `<div class="mx-lab-row"><b class="mx-num">${fmtT(b.t)}</b>
        <span class="mx-lab-title">${esc(b.label || 'بدون عنوان')}</span>
        <button class="mx-btn mx-btn--sm" data-action="st-bm-go" data-i="${i}">پرش ⏩</button>
        <button class="mx-btn mx-btn--sm mx-btn--danger" data-action="st-bm-del" data-i="${i}">✕</button></div>`).join('') || '<div class="mx-empty">نشان‌گذاری نیست.</div>'}</div>
      <div class="mx-hint">📚 مجموع نشان‌های همه آهنگ‌ها: ${faDigits(String(allBmCount))}</div>
    </div>
    <div class="mx-panel"><h4>🎚 اکولایزر و خروجی</h4>
      <div class="mx-eq-row">${[0, 1, 2, 3, 4].map((i) => `
        <label class="mx-eq-band"><input type="range" data-st="eq" data-i="${i}" min="-12" max="12" step="1" value="${snap.eqBands?.[i] ?? 0}" />
        <b data-st="eq-v" data-i="${i}">${faDigits(String(snap.eqBands?.[i] ?? 0))}</b><span>${EQ_FREQS[i]}</span></label>`).join('')}
      </div>
      <div class="mx-btn-row"><label class="mx-check"><input type="checkbox" data-st="eq-on" ${snap.eqEnabled ? 'checked' : ''} /> اکولایزر فعال</label>
      <button class="mx-btn mx-btn--sm" data-action="st-eq-flat">تخت کردن</button></div>
      <h4>🎨 پریست‌ها</h4>
      <div class="mx-chip-row">${Object.keys(EQ_PRESETS).map((k) => `<button class="mx-chip" data-action="st-eq-preset" data-p="${k}">${EQ_NAMES[k]}</button>`).join('')}</div>
      <div class="mx-form-grid"><label>ذخیره پریست من<input data-st="eq-name" placeholder="نام پریست…" /></label></div>
      <div class="mx-btn-row"><button class="mx-btn mx-btn--sm" data-action="st-eq-save">💾 ذخیره تنظیم فعلی</button></div>
      <div class="mx-chip-row">${customs.map((cp, i) => `<button class="mx-chip mx-chip-custom" data-action="st-eq-custom" data-i="${i}" title="اعمال">${esc(cp.name)}</button><button class="mx-btn--icon mx-btn--danger" data-action="st-eq-custom-del" data-i="${i}" title="حذف">✕</button>`).join('') || '<span class="mx-hint">پریست سفارشی نداری.</span>'}</div>
      <h4>🔊 زنجیره خروجی</h4>
      <div class="mx-form-grid">
        <label>پری‌امپ (dB)<span class="mx-inline"><input type="range" data-st="preamp" min="-12" max="12" step="1" value="${ui.preamp}" /><b data-st="preamp-v">${faDigits(String(ui.preamp))}</b></span></label>
        <label class="mx-check"><input type="checkbox" data-st="mono" ${ui.mono ? 'checked' : ''} /> حالت مونو (تک‌کاناله)</label>
        <label class="mx-check"><input type="checkbox" data-st="pitch" ${ui.pitchLock ? 'checked' : ''} /> قفل گام صدا در تغییر سرعت</label>
      </div>
      <h4>🎧 فید هوشمند بین آهنگ‌ها</h4>
      <div class="mx-btn-row">${[0, 2, 4, 6, 10].map((s) => `<button class="mx-chip ${ui.fadeSecs === s ? 'is-on' : ''}" data-action="st-fade" data-s="${s}">${s === 0 ? 'خاموش' : faDigits(String(s)) + ' ثانیه'}</button>`).join('')}</div>
      <div class="mx-hint">قبل از پایان هر آهنگ صدا نرم کم می‌شود (نیاز به پخش از صف دارد).</div>
    </div>
  </div>
  <div class="mx-panel"><h4>🌈 ویژوالایزر زنده</h4>
    <div class="mx-btn-row">${VIS_MODES.map(([v, l]) => `<button class="mx-chip ${ui.visMode === v ? 'is-on' : ''}" data-action="st-vis" data-v="${v}">${l}</button>`).join('')}
    <input type="color" data-st="vis-color" value="${esc(ui.visColor)}" title="رنگ" />
    <label class="mx-check"><input type="checkbox" data-st="mirror" ${ui.mirror ? 'checked' : ''} /> آینه</label></div>
    <canvas data-st="visual" class="mx-visual"></canvas>
    <div class="mx-hint">💡 برای فایل‌های محلی بهترین کیفیت را دارد (محدودیت CORS استریم‌ها).</div>
  </div>
  <div class="mx-panel"><h4>⚡ اکشن‌های سریع استودیو</h4><div class="mx-btn-row">
    <button class="mx-btn mx-btn--sm" data-action="st-jump-back">⏪ ۱۰ ثانیه عقب</button>
    <button class="mx-btn mx-btn--sm" data-action="st-jump-fwd">۱۰ ثانیه جلو ⏩</button>
    <button class="mx-btn mx-btn--sm" data-action="st-restart">↺ از اول</button>
    <button class="mx-btn mx-btn--sm" data-action="st-toggle">⏯ پخش/مکث</button>
    <button class="mx-btn mx-btn--sm" data-action="st-frame-lyrics">🎤 رفتن به استودیو شعر</button>
  </div></div>`;
}

export function afterStudioRender(root) {
  const cv = root.querySelector('[data-st="visual"]');
  if (cv) startVisualizer(cv, () => { const u = loadUi(); return { mode: u.visMode, color: u.visColor, mirror: u.mirror }; });
}

/* ---------- اکشن‌ها ---------- */
export async function handleStudioAction(action, el, api) {
  const { root, toast, renderContent } = api;
  const st = getPlayerState();
  const ui = loadUi();
  switch (action) {
    case 'st-ab-a': {
      const pos = st.position || 0;
      saveUi({ ab: { a: +pos.toFixed(2), b: ui.ab && ui.ab.b > pos ? ui.ab.b : +(pos + 10).toFixed(2) } });
      toast.success(`🅰 شروع حلقه: ${fmtT(pos)}`);
      renderContent(); return true;
    }
    case 'st-ab-b': {
      const pos = st.position || 0;
      const a = ui.ab ? ui.ab.a : 0;
      if (pos <= a) { toast.warning('نقطه پایان باید بعد از شروع باشد.'); return true; }
      saveUi({ ab: { a, b: +pos.toFixed(2) } });
      toast.success(`🅱 حلقه فعال: ${fmtT(a)} تا ${fmtT(pos)} 🔁`);
      renderContent(); return true;
    }
    case 'st-ab-play': { if (ui.ab) seekTo(ui.ab.a + 0.01); return true; }
    case 'st-ab-clear': saveUi({ ab: null }); renderContent(); return true;
    case 'st-bm-add': {
      if (!st.song) { toast.warning('آهنگی پخش نمی‌شود.'); return true; }
      const label = root.querySelector('[data-st="bm-label"]')?.value?.trim() || `نشان ${fmtT(st.position || 0)}`;
      const bm = loadBm();
      const k = String(st.song.id);
      bm[k] = [...(bm[k] || []), { t: +(st.position || 0).toFixed(2), label, at: Date.now() }].sort((a, b) => a.t - b.t);
      saveBm(bm);
      toast.success('🔖 نشان ثبت شد.');
      renderContent(); return true;
    }
    case 'st-bm-go': {
      if (!st.song) return true;
      const arr = loadBm()[String(st.song.id)] || [];
      const b = arr[Number(el.dataset.i)];
      if (b) seekTo(b.t);
      return true;
    }
    case 'st-bm-del': {
      if (!st.song) return true;
      const bm = loadBm();
      const k = String(st.song.id);
      bm[k] = (bm[k] || []).filter((_, i) => i !== Number(el.dataset.i));
      saveBm(bm);
      renderContent(); return true;
    }
    case 'st-eq-flat': {
      for (let i = 0; i < 5; i++) setEqBand(i, 0);
      toast.info('اکولایزر تخت شد.');
      renderContent(); return true;
    }
    case 'st-eq-preset': {
      const p = EQ_PRESETS[el.dataset.p] || EQ_PRESETS.flat;
      p.forEach((v, i) => setEqBand(i, v));
      toast.success(`🎨 پریست ${EQ_NAMES[el.dataset.p] || ''} اعمال شد.`);
      renderContent(); return true;
    }
    case 'st-eq-save': {
      const name = root.querySelector('[data-st="eq-name"]')?.value?.trim() || `پریست ${faDigits(String(loadEqCustom().length + 1))}`;
      const bands = [...(getPlayerState().eqBands || [0, 0, 0, 0, 0])];
      const customs = loadEqCustom();
      customs.push({ name, bands });
      saveEqCustom(customs);
      toast.success('💾 پریست ذخیره شد.');
      renderContent(); return true;
    }
    case 'st-eq-custom': {
      const cp = loadEqCustom()[Number(el.dataset.i)];
      if (cp) { cp.bands.forEach((v, i) => setEqBand(i, v)); toast.success(`🎨 ${cp.name} اعمال شد.`); renderContent(); }
      return true;
    }
    case 'st-eq-custom-del': {
      const customs = loadEqCustom().filter((_, i) => i !== Number(el.dataset.i));
      saveEqCustom(customs);
      renderContent(); return true;
    }
    case 'st-fade': {
      saveUi({ fadeSecs: Number(el.dataset.s || 0) });
      toast.info(Number(el.dataset.s) ? `🎧 فید ${faDigits(el.dataset.s)} ثانیه‌ای فعال شد.` : 'فید خاموش شد.');
      renderContent(); return true;
    }
    case 'st-vis': saveUi({ visMode: el.dataset.v }); renderContent(); return true;
    case 'st-jump-back': seekTo(Math.max(0, (st.position || 0) - 10)); return true;
    case 'st-jump-fwd': seekTo((st.position || 0) + 10); return true;
    case 'st-restart': seekTo(0); return true;
    case 'st-toggle': togglePlayback(); return true;
    case 'st-frame-lyrics': {
      const { persistMusicUi } = await import('./music-state.js');
      persistMusicUi({ tab: 'lyrics' });
      api.gotoTab?.('lyrics');
      return true;
    }
    default: return false;
  }
}

export async function handleStudioInput(el, api) {
  const k = el.dataset.st;
  if (k === 'eq') {
    setEqBand(Number(el.dataset.i), Number(el.value));
    const b = api.root.querySelector(`[data-st="eq-v"][data-i="${el.dataset.i}"]`);
    if (b) b.textContent = faDigits(el.value);
    return true;
  }
  if (k === 'eq-on') { toggleEq(); return true; }
  if (k === 'preamp') {
    const v = Number(el.value);
    saveUi({ preamp: v });
    const mod = await import('../../../core/services/music-player-service.js');
    mod.setPreamp?.(v);
    const b = api.root.querySelector('[data-st="preamp-v"]');
    if (b) b.textContent = faDigits(el.value);
    return true;
  }
  if (k === 'mono') {
    saveUi({ mono: el.checked });
    const mod = await import('../../../core/services/music-player-service.js');
    mod.setMono?.(el.checked);
    api.toast.info(el.checked ? '🔊 حالت مونو فعال شد.' : '🎧 حالت استریو.');
    return true;
  }
  if (k === 'pitch') {
    saveUi({ pitchLock: el.checked });
    const mod = await import('../../../core/services/music-player-service.js');
    mod.setPitchLock?.(el.checked);
    return true;
  }
  if (k === 'vis-color') { saveUi({ visColor: el.value }); return true; }
  if (k === 'mirror') { saveUi({ mirror: el.checked }); return true; }
  return false;
}
