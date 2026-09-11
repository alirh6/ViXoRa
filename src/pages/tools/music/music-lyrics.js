// 🎤 ViXoRa Lyrics Studio — ویرایشگر شعر، همگام‌سازی LRC، کارائوکه
import { faDigits } from '../../../core/schemas/music-schema.js';
import { updateSong } from '../../../core/services/music-library-service.js';
import { getPlayerState, seekTo, togglePlayback } from '../../../core/services/music-player-service.js';

const LRC_KEY = 'ViXoRa:music-lrc';
const UI_KEY = 'ViXoRa:music-lyrics-ui';

function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
function loadStore() { try { return JSON.parse(localStorage.getItem(LRC_KEY) || '{}'); } catch { return {}; } }
function saveStore(s) { try { localStorage.setItem(LRC_KEY, JSON.stringify(s)); } catch { /* ignore */ } }
function loadUi() { try { return { songId: '', mode: 'karaoke', font: 20, offset: 0, follow: true, ...JSON.parse(localStorage.getItem(UI_KEY) || '{}') }; } catch { return { songId: '', mode: 'karaoke', font: 20, offset: 0, follow: true }; } }
function saveUi(patch) {
  const u = { ...loadUi(), ...patch };
  try { localStorage.setItem(UI_KEY, JSON.stringify(u)); } catch { /* ignore */ }
  return u;
}
export function getLyricsUi() { return loadUi(); }

export function fmtLrcTime(sec) {
  sec = Math.max(0, sec || 0);
  const m = Math.floor(sec / 60), s = sec - m * 60;
  return `[${String(m).padStart(2, '0')}:${s < 10 ? '0' : ''}${s.toFixed(2)}]`;
}
function parseLrcTime(tag) {
  const m = tag.match(/\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/);
  if (!m) return null;
  const ms = m[3] ? Number(String(m[3]).padEnd(3, '0').slice(0, 3)) : 0;
  return Number(m[1]) * 60 + Number(m[2]) + ms / 1000;
}
/** پارس LRC؛ خروجی [{t, text}] مرتب */
export function parseLrc(text) {
  const lines = [];
  String(text || '').split(/\r?\n/).forEach((raw) => {
    const tags = [...raw.matchAll(/\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g)];
    if (!tags.length) {
      const t = raw.trim();
      if (t && !t.startsWith('[')) lines.push({ t: null, text: t });
      return;
    }
    const textOnly = raw.replace(/\[(?:\d{1,3}):(?:\d{1,2})(?:[.:]\d{1,3})?\]/g, '').trim();
    for (const tg of tags) {
      const t = parseLrcTime(tg[0]);
      if (t !== null) lines.push({ t, text: textOnly });
    }
  });
  const timed = lines.filter((l) => l.t !== null).sort((a, b) => a.t - b.t);
  const plain = lines.filter((l) => l.t === null);
  return { timed, plain, all: lines };
}
export function serializeLrc(meta, timed) {
  const out = [];
  if (meta?.ti) out.push(`[ti:${meta.ti}]`);
  if (meta?.ar) out.push(`[ar:${meta.ar}]`);
  if (meta?.al) out.push(`[al:${meta.al}]`);
  out.push('[by:ViXoRa Lyrics Studio]');
  for (const l of timed) out.push(`${fmtLrcTime(l.t)}${l.text || ''}`);
  return out.join('\n');
}
export function getSongLrc(songId) {
  const s = loadStore();
  return Array.isArray(s[songId]) ? s[songId] : [];
}
export function setSongLrc(songId, timed) {
  const s = loadStore();
  s[songId] = timed;
  saveStore(s);
}
export function activeLrcIndex(timed, pos) {
  let idx = -1;
  for (let i = 0; i < timed.length; i++) {
    if (pos >= timed[i].t - 0.05) idx = i; else break;
  }
  return idx;
}

function songLabel(s) {
  if (!s) return '—';
  return `${s.title || 'بی‌نام'} — ${s.artist || 'ناشناس'}`;
}

/* ============================== رندر ============================== */

export function renderLyricsView(lib, snap) {
  const ui = loadUi();
  const songs = lib.songs || [];
  const song = songs.find((s) => String(s.id) === String(ui.songId)) || snap.song || songs[0] || null;
  const songId = song ? String(song.id) : '';
  const lrc = songId ? getSongLrc(songId) : [];
  const plain = song?.lyrics || '';
  const syncedPct = lrc.length ? 100 : 0;

  const opts = songs.map((s) =>
    `<option value="${esc(s.id)}" ${String(s.id) === songId ? 'selected' : ''}>${esc(songLabel(s))}</option>`
  ).join('');

  return `
  <div class="mx-secbar"><h3>🎤 استودیو شعر</h3>
    <div class="mx-secbar-actions">
      <button class="mx-btn mx-btn--sm" data-action="lx-use-current">🎧 آهنگ در حال پخش</button>
      <button class="mx-btn mx-btn--sm" data-action="lx-export">⬇ خروجی LRC</button>
      <button class="mx-btn mx-btn--sm" data-action="lx-import">⬆ ورود LRC</button>
    </div>
  </div>
  <div class="mx-panel">
    <div class="mx-form-grid">
      <label>آهنگ<select data-lx="song">${opts || '<option value="">— کتابخانه خالی است —</option>'}</select></label>
      <label>حالت<select data-lx="mode">
        <option value="karaoke" ${ui.mode === 'karaoke' ? 'selected' : ''}>🎤 کارائوکه (همگام با پخش)</option>
        <option value="edit" ${ui.mode === 'edit' ? 'selected' : ''}>✏️ ویرایش خط‌به‌خط</option>
        <option value="plain" ${ui.mode === 'plain' ? 'selected' : ''}>📄 متن ساده</option>
        <option value="tap" ${ui.mode === 'tap' ? 'selected' : ''}>👆 همگام‌سازی ضربه‌ای</option>
      </select></label>
      <label>اندازه قلم<input type="range" data-lx="font" min="14" max="34" value="${ui.font}" /><b>${faDigits(String(ui.font))}</b></label>
      <label>جابه‌جایی زمانی (ثانیه)<span class="mx-inline">
        <button class="mx-btn mx-btn--sm" data-action="lx-offset-dec">−۰.۵</button>
        <b data-lx="offset-label">${faDigits(Number(ui.offset || 0).toFixed(1))}</b>
        <button class="mx-btn mx-btn--sm" data-action="lx-offset-inc">+۰.۵</button>
      </span></label>
    </div>
    <div class="mx-stats-row">
      <span class="mx-stat">📝 ${faDigits(String(lrc.length))} خط همگام</span>
      <span class="mx-stat">📄 ${faDigits(String(plain.split('\n').filter(Boolean).length))} خط متن</span>
      <span class="mx-stat">⏱ ${lrc.length ? 'همگام‌سازی شده ✅' : 'همگام نشده ⚠️'}</span>
      <label class="mx-check"><input type="checkbox" data-lx="follow" ${ui.follow ? 'checked' : ''} /> تعقیب خودکار خط فعال</label>
    </div>
  </div>
  <div data-lx="stage">${renderLyricsStage(song, ui, lrc, plain)}</div>
  <input type="file" data-lx="file" accept=".lrc,.txt" class="mx-hidden" />`;
}

export function renderLyricsStage(song, ui, lrc, plain) {
  if (!song) return `<div class="mx-panel"><div class="mx-empty">🎵 آهنگی در کتابخانه نیست. اول از تب آهنگ‌ها اضافه کن.</div></div>`;
  if (ui.mode === 'plain') {
    return `<div class="mx-secbar"><h3>📄 متن ${esc(songLabel(song))}</h3>
      <div class="mx-secbar-actions"><button class="mx-btn mx-btn--sm mx-btn--primary" data-action="lx-save-plain">💾 ذخیره متن</button></div></div>
      <div class="mx-panel"><textarea data-lx="plain" rows="14" class="mx-textarea" placeholder="متن آهنگ را اینجا بنویس… (هر خط جدا)">${esc(plain)}</textarea>
      <div class="mx-hint">💡 با «ساخت خطوط از متن» می‌توانی هر خط را به ویرایشگر خط‌به‌خط ببری و زمان بدهی.</div>
      <div class="mx-btn-row"><button class="mx-btn mx-btn--sm" data-action="lx-plain-to-lines">📝 ساخت خطوط از متن</button>
      <button class="mx-btn mx-btn--sm" data-action="lx-clear-plain">🧹 پاک کردن متن</button></div></div>`;
  }
  if (ui.mode === 'edit') {
    const rows = lrc.map((l, i) => `
      <div class="mx-lrc-row" data-lx-row="${i}">
        <input class="mx-time" data-lx="time" data-i="${i}" value="${l.t.toFixed(2)}" inputmode="decimal" title="ثانیه" />
        <input class="mx-line" data-lx="text" data-i="${i}" value="${esc(l.text)}" placeholder="متن خط…" />
        <button class="mx-btn--icon" data-action="lx-line-play" data-i="${i}" title="پخش از این خط">▶</button>
        <button class="mx-btn--icon" data-action="lx-line-stamp" data-i="${i}" title="ثبت زمان فعلی">⏺</button>
        <button class="mx-btn--icon" data-action="lx-line-up" data-i="${i}" title="بالا">▲</button>
        <button class="mx-btn--icon" data-action="lx-line-down" data-i="${i}" title="پایین">▼</button>
        <button class="mx-btn--icon mx-btn--danger" data-action="lx-line-del" data-i="${i}" title="حذف">✕</button>
      </div>`).join('');
    return `<div class="mx-secbar"><h3>✏️ ویرایش خط‌به‌خط</h3><div class="mx-secbar-actions">
      <button class="mx-btn mx-btn--sm" data-action="lx-add-line">➕ افزودن خط</button>
      <button class="mx-btn mx-btn--sm mx-btn--primary" data-action="lx-save-lines">💾 ذخیره همگام‌سازی</button>
    </div></div>
    <div class="mx-panel"><div class="mx-btn-row">
      <button class="mx-btn mx-btn--sm" data-action="lx-sort">🔢 مرتب‌سازی زمانی</button>
      <button class="mx-btn mx-btn--sm" data-action="lx-shift-all">⏩ انتقال همه +۱ ثانیه</button>
      <button class="mx-btn mx-btn--sm" data-action="lx-unshift-all">⏪ انتقال همه −۱ ثانیه</button>
      <button class="mx-btn mx-btn--sm" data-action="lx-clear-lines">🧹 حذف همه خطوط</button>
    </div>
    <div class="mx-lrc-list" data-lx="lines">${rows || '<div class="mx-empty">خطی نیست. «افزودن خط» را بزن یا از متن ساده بساز.</div>'}</div></div>`;
  }
  if (ui.mode === 'tap') {
    const src = lrc.length ? lrc : plain.split('\n').map((t) => t.trim()).filter(Boolean).map((text) => ({ t: null, text }));
    const rows = src.map((l, i) => `
      <div class="mx-lrc-row mx-tap-row ${l.t !== null && l.t !== undefined ? 'is-stamped' : ''}" data-lx-row="${i}">
        <b class="mx-tap-time">${l.t !== null && l.t !== undefined ? fmtLrcTime(l.t) : '—:—.——'}</b>
        <span class="mx-line-text">${esc(l.text)}</span>
        <button class="mx-btn mx-btn--sm" data-action="lx-tap-stamp" data-i="${i}">👆 ثبت لحظه</button>
      </div>`).join('');
    return `<div class="mx-secbar"><h3>👆 همگام‌سازی ضربه‌ای</h3><div class="mx-secbar-actions">
      <button class="mx-btn mx-btn--sm" data-action="lx-tap-play">▶ پخش/مکث</button>
      <button class="mx-btn mx-btn--sm" data-action="lx-tap-restart">↺ شروع دوباره</button>
      <button class="mx-btn mx-btn--sm mx-btn--primary" data-action="lx-save-lines">💾 ذخیره همگام‌سازی</button>
    </div></div>
    <div class="mx-panel"><div class="mx-hint">🎧 آهنگ را پخش کن و هم‌زمان با خوانده شدن هر خط، دکمه «ثبت لحظه» همان خط را بزن. زمان فعلی پخش ثبت می‌شود.</div>
    <div class="mx-lrc-list" data-lx="lines">${rows || '<div class="mx-empty">متنی برای همگام‌سازی نیست.</div>'}</div></div>`;
  }
  // کارائوکه
  const pos = getPlayerState().position || 0;
  const lines = lrc.length
    ? lrc.map((l, i) => `<div class="mx-kara-line" data-lx-kara="${i}" data-t="${l.t}">${esc(l.text) || '♪'}</div>`).join('')
    : (plain.split('\n').filter((x) => x.trim()).map((t) => `<div class="mx-kara-line is-plain">${esc(t)}</div>`).join('') || '<div class="mx-empty">برای این آهنگ شعری ثبت نشده. از حالت «متن ساده» اضافه کن.</div>');
  return `<div class="mx-secbar"><h3>🎤 کارائوکه</h3><div class="mx-secbar-actions">
    <button class="mx-btn mx-btn--sm" data-action="lx-kara-play">▶ پخش/مکث</button>
    <button class="mx-btn mx-btn--sm" data-action="lx-kara-font-dec">A−</button>
    <button class="mx-btn mx-btn--sm" data-action="lx-kara-font-inc">A+</button>
  </div></div>
  <div class="mx-panel"><div class="mx-karaoke" data-lx="karaoke" style="font-size:${ui.font}px" data-pos="${pos}">${lines}</div></div>`;
}

/** به‌روزرسانی خط فعال کارائوکه (بدون رندر کامل) */
export function tickKaraoke(root) {
  const box = root.querySelector('[data-lx="karaoke"]');
  if (!box) return;
  const ui = loadUi();
  const songId = ui.songId || (getPlayerState().song && String(getPlayerState().song.id)) || '';
  const lrc = songId ? getSongLrc(songId) : [];
  if (!lrc.length) return;
  const pos = (getPlayerState().position || 0) + Number(ui.offset || 0);
  const idx = activeLrcIndex(lrc, pos);
  const lines = [...box.querySelectorAll('[data-lx-kara]')];
  lines.forEach((el, i) => el.classList.toggle('is-active', i === idx));
  if (ui.follow && idx >= 0 && lines[idx]) {
    const r = lines[idx].getBoundingClientRect();
    const br = box.getBoundingClientRect();
    if (r.top < br.top || r.bottom > br.bottom) lines[idx].scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  box.dataset.pos = pos.toFixed(1);
}

/* ============================== اکشن‌ها ============================== */

function currentSong(lib) {
  const ui = loadUi();
  return (lib.songs || []).find((s) => String(s.id) === String(ui.songId)) || null;
}
function readEditedLines(root) {
  const rows = [...root.querySelectorAll('[data-lx-row]')];
  const out = [];
  for (const row of rows) {
    const tIn = row.querySelector('[data-lx="time"]');
    const xIn = row.querySelector('[data-lx="text"]');
    const stamped = row.querySelector('.mx-tap-time');
    if (tIn && xIn) {
      const t = Number(String(tIn.value).replace(',', '.'));
      out.push({ t: Number.isFinite(t) && t >= 0 ? t : 0, text: xIn.value.trim() });
    } else if (row.classList.contains('mx-tap-row')) {
      const label = stamped?.textContent?.trim() || '';
      const t = parseLrcTime(label) ?? null;
      const text = row.querySelector('.mx-line-text')?.textContent || '';
      if (t !== null) out.push({ t, text });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

export async function handleLyricsAction(action, el, api) {
  const { lib, root, toast, refreshLibrary, renderContent } = api;
  const ui = loadUi();
  const song = currentSong(lib) || getPlayerState().song;
  const songId = song ? String(song.id) : '';

  switch (action) {
    case 'lx-use-current': {
      const cur = getPlayerState().song;
      if (!cur) { toast.warning('چیزی در حال پخش نیست.'); return true; }
      saveUi({ songId: String(cur.id) });
      renderContent();
      return true;
    }
    case 'lx-save-plain': {
      if (!song) return true;
      const ta = root.querySelector('[data-lx="plain"]');
      await updateSong(song.id, { lyrics: ta ? ta.value.slice(0, 20000) : '' });
      await refreshLibrary();
      toast.success('💾 متن شعر ذخیره شد.');
      return true;
    }
    case 'lx-clear-plain': {
      const ta = root.querySelector('[data-lx="plain"]');
      if (ta) ta.value = '';
      return true;
    }
    case 'lx-plain-to-lines': {
      if (!song) return true;
      const ta = root.querySelector('[data-lx="plain"]');
      const lines = String(ta ? ta.value : (song.lyrics || '')).split('\n').map((t) => t.trim()).filter(Boolean);
      if (!lines.length) { toast.warning('متنی نیست.'); return true; }
      setSongLrc(songId, lines.map((text, i) => ({ t: i * 4, text })));
      saveUi({ mode: 'edit' });
      toast.success(`📝 ${faDigits(String(lines.length))} خط ساخته شد؛ حالا زمان بده.`);
      renderContent();
      return true;
    }
    case 'lx-add-line': {
      if (!song) return true;
      const lrc = getSongLrc(songId);
      const last = lrc.length ? lrc[lrc.length - 1].t : 0;
      lrc.push({ t: +(last + 3).toFixed(2), text: '' });
      setSongLrc(songId, lrc);
      renderContent();
      return true;
    }
    case 'lx-save-lines': {
      if (!song) return true;
      const lines = readEditedLines(root);
      setSongLrc(songId, lines);
      toast.success(`💾 ${faDigits(String(lines.length))} خط همگام ذخیره شد.`);
      saveUi({ mode: 'karaoke' });
      renderContent();
      return true;
    }
    case 'lx-line-del': {
      const i = Number(el.dataset.i);
      const lrc = getSongLrc(songId);
      lrc.splice(i, 1);
      setSongLrc(songId, lrc);
      renderContent();
      return true;
    }
    case 'lx-line-up':
    case 'lx-line-down': {
      const i = Number(el.dataset.i);
      const lrc = getSongLrc(songId);
      const j = action === 'lx-line-up' ? i - 1 : i + 1;
      if (j < 0 || j >= lrc.length) return true;
      [lrc[i], lrc[j]] = [lrc[j], lrc[i]];
      setSongLrc(songId, lrc);
      renderContent();
      return true;
    }
    case 'lx-line-play': {
      const i = Number(el.dataset.i);
      const lrc = getSongLrc(songId);
      if (lrc[i]) { seekTo(lrc[i].t + 0.01); }
      return true;
    }
    case 'lx-line-stamp': {
      const i = Number(el.dataset.i);
      const lrc = getSongLrc(songId);
      const pos = getPlayerState().position || 0;
      if (lrc[i]) { lrc[i].t = +pos.toFixed(2); setSongLrc(songId, lrc); renderContent(); }
      return true;
    }
    case 'lx-sort': {
      const lrc = getSongLrc(songId).sort((a, b) => a.t - b.t);
      setSongLrc(songId, lrc);
      renderContent();
      return true;
    }
    case 'lx-shift-all':
    case 'lx-unshift-all': {
      const d = action === 'lx-shift-all' ? 1 : -1;
      const lrc = getSongLrc(songId).map((l) => ({ ...l, t: Math.max(0, +(l.t + d).toFixed(2)) }));
      setSongLrc(songId, lrc);
      renderContent();
      return true;
    }
    case 'lx-clear-lines': {
      setSongLrc(songId, []);
      renderContent();
      return true;
    }
    case 'lx-tap-play':
    case 'lx-kara-play': {
      togglePlayback();
      return true;
    }
    case 'lx-tap-restart': {
      if (!song) return true;
      seekTo(0);
      setSongLrc(songId, getSongLrc(songId).map((l) => ({ ...l, t: 0 })));
      renderContent();
      return true;
    }
    case 'lx-tap-stamp': {
      const i = Number(el.dataset.i);
      const pos = getPlayerState().position || 0;
      const row = root.querySelector(`[data-lx-row="${i}"] .mx-tap-time`);
      if (row) {
        row.textContent = fmtLrcTime(pos);
        row.closest('.mx-tap-row')?.classList.add('is-stamped');
      }
      const lrc = getSongLrc(songId);
      // ذخیره موقت در DOM؛ ذخیره نهایی با دکمه ذخیره
      void lrc;
      const next = root.querySelector(`[data-lx-row="${i + 1}"]`);
      if (next) next.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return true;
    }
    case 'lx-offset-inc':
    case 'lx-offset-dec': {
      const d = action === 'lx-offset-inc' ? 0.5 : -0.5;
      const u = saveUi({ offset: +(Number(ui.offset || 0) + d).toFixed(1) });
      const label = root.querySelector('[data-lx="offset-label"]');
      if (label) label.textContent = faDigits(Number(u.offset).toFixed(1));
      return true;
    }
    case 'lx-kara-font-inc':
    case 'lx-kara-font-dec': {
      const d = action === 'lx-kara-font-inc' ? 2 : -2;
      const u = saveUi({ font: Math.min(40, Math.max(14, (ui.font || 20) + d)) });
      const box = root.querySelector('[data-lx="karaoke"]');
      if (box) box.style.fontSize = u.font + 'px';
      const r = root.querySelector('[data-lx="font"]');
      if (r) r.value = u.font;
      return true;
    }
    case 'lx-export': {
      if (!song) return true;
      const lrc = getSongLrc(songId);
      const text = serializeLrc({ ti: song.title, ar: song.artist, al: song.album }, lrc.length ? lrc : [{ t: 0, text: song.lyrics || '' }]);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${song.title || 'lyrics'}.lrc`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast.success('⬇ فایل LRC دانلود شد.');
      return true;
    }
    case 'lx-import': {
      root.querySelector('[data-lx="file"]')?.click();
      return true;
    }
    default: return false;
  }
}

export async function handleLyricsFile(file, api) {
  const { toast, renderContent, lib } = api;
  try {
    const text = await file.text();
    const { timed, plain } = parseLrc(text);
    const ui = loadUi();
    const song = (lib.songs || []).find((s) => String(s.id) === String(ui.songId));
    if (!song) { toast.warning('اول یک آهنگ انتخاب کن.'); return; }
    if (timed.length) {
      setSongLrc(String(song.id), timed);
      toast.success(`⬆ ${faDigits(String(timed.length))} خط همگام وارد شد.`);
    } else if (plain.length) {
      await updateSong(song.id, { lyrics: plain.map((p) => p.text).join('\n').slice(0, 20000) });
      await api.refreshLibrary();
      toast.success('⬆ متن شعر وارد شد.');
    } else {
      toast.warning('خط معتبری در فایل پیدا نشد.');
      return;
    }
    renderContent();
  } catch { toast.error('خواندن فایل ناموفق بود.'); }
}

export function handleLyricsInput(el, api) {
  const k = el.dataset.lx;
  if (k === 'song') { saveUi({ songId: el.value }); api.renderContent(); return true; }
  if (k === 'mode') { saveUi({ mode: el.value }); api.renderContent(); return true; }
  if (k === 'font') {
    const u = saveUi({ font: Number(el.value) || 20 });
    const box = api.root.querySelector('[data-lx="karaoke"]');
    if (box) box.style.fontSize = u.font + 'px';
    const b = el.parentElement?.querySelector('b');
    if (b) b.textContent = faDigits(String(u.font));
    return true;
  }
  if (k === 'follow') { saveUi({ follow: el.checked }); return true; }
  return false;
}

/* ============================== تیکر و همگام‌سازی ============================== */

/** خطوط شعر یک آهنگ: LRC ذخیره‌شده یا متن ساده */
export function getLrcLines(song) {
  if (!song) return [];
  const stored = getSongLrc(String(song.id));
  if (stored.length) return stored;
  return String(song.lyrics || '').split('\n').map((x) => x.trim()).filter(Boolean).map((text) => ({ t: 0, text }));
}

export function afterLyricsRender(content, snap) {
  try {
    const ui = loadUi();
    const box = content.querySelector('[data-lx="karaoke"]');
    if (box) box.style.fontSize = (ui.font || 20) + 'px';
    tickKaraoke(content);
  } catch { /* ignore */ }
  void snap;
}

let lyricsTicker = 0;
export function startLyricsTicker(content) {
  stopLyricsTicker();
  lyricsTicker = setInterval(() => { try { tickKaraoke(content); } catch { /* ignore */ } }, 500);
}
export function stopLyricsTicker() {
  clearInterval(lyricsTicker);
  lyricsTicker = 0;
}

/** مودال همگام‌سازی ضربه‌ای LRC (با مسیرهای بستن کامل) */
export function openLrcSync(id, lines, api) {
  closeLrcSync();
  const list = (lines || []).map((l, i) => ({ t: Number(l.t) || 0, text: String(l.text || '').slice(0, 200), i }));
  const ov = document.createElement('div');
  ov.setAttribute('data-lrc-sync', '1');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(5,2,15,.75);display:flex;align-items:center;justify-content:center;padding:16px;';
  ov.innerHTML = `
    <div data-lrc-panel style="background:#17112e;color:#f4f1ff;border:1px solid #7c3aed;border-radius:18px;max-width:560px;width:100%;max-height:86vh;display:flex;flex-direction:column;overflow:hidden">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.12)">
        <b>👆 همگام‌سازی ضربه‌ای</b>
        <button data-lrc-x style="background:rgba(255,255,255,.1);color:#fff;border:none;border-radius:10px;padding:6px 12px;cursor:pointer;font-size:15px">✕ بستن</button>
      </div>
      <div style="padding:10px 16px;font-size:13px;opacity:.85">آهنگ را پخش کن و هم‌زمان با هر خط، «👆 ثبت» را بزن. در پایان «💾 ذخیره».</div>
      <div style="padding:0 16px 6px;display:flex;gap:8px">
        <button data-lrc-play style="flex:1;background:#7c3aed;color:#fff;border:none;border-radius:10px;padding:9px;cursor:pointer">▶ پخش/مکث</button>
        <button data-lrc-restart style="background:rgba(255,255,255,.12);color:#fff;border:none;border-radius:10px;padding:9px 14px;cursor:pointer">↺ از اول</button>
      </div>
      <div data-lrc-list style="overflow:auto;padding:10px 16px;display:flex;flex-direction:column;gap:7px">
        ${list.length ? list.map((l) => `
          <div data-lrc-row="${l.i}" style="display:flex;gap:8px;align-items:center;background:rgba(255,255,255,.06);border-radius:10px;padding:8px 10px;font-size:13px">
            <span data-lrc-time style="min-width:52px;color:#a78bfa;font-variant-numeric:tabular-nums">${fmtLrcTime(l.t)}</span>
            <span style="flex:1">${esc(l.text) || '…'}</span>
            <button data-lrc-stamp="${l.i}" style="background:#22c55e;color:#fff;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;white-space:nowrap">👆 ثبت</button>
          </div>`).join('') : '<div style="opacity:.7">خطی نیست.</div>'}
      </div>
      <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,.12);display:flex;gap:8px">
        <button data-lrc-save style="flex:1;background:#22c55e;color:#fff;border:none;border-radius:10px;padding:10px;cursor:pointer;font-weight:700">💾 ذخیره همگام‌سازی</button>
        <button data-lrc-x style="background:rgba(255,255,255,.12);color:#fff;border:none;border-radius:10px;padding:10px 16px;cursor:pointer">انصراف</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const pos = () => {
    try { return Number(getPlayerState().position) || 0; } catch { return 0; }
  };
  ov.addEventListener('click', async (e) => {
    if (e.target === ov || e.target.closest('[data-lrc-x]')) { closeLrcSync(); return; }
    if (e.target.closest('[data-lrc-play]')) { try { togglePlayback(); } catch { /* ignore */ } return; }
    if (e.target.closest('[data-lrc-restart]')) { try { seekTo(0); } catch { /* ignore */ } return; }
    const stamp = e.target.closest('[data-lrc-stamp]');
    if (stamp) {
      const i = Number(stamp.dataset.lrcStamp);
      if (list[i]) {
        list[i].t = +pos().toFixed(2);
        const row = ov.querySelector(`[data-lrc-row="${i}"] [data-lrc-time]`);
        if (row) row.textContent = fmtLrcTime(list[i].t);
        const next = ov.querySelector(`[data-lrc-row="${i + 1}"]`);
        if (next) next.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return;
    }
    if (e.target.closest('[data-lrc-save]')) {
      setSongLrc(String(id), list.map(({ t, text }) => ({ t, text })));
      try { api.toast.success('💾 همگام‌سازی ذخیره شد.'); } catch { /* ignore */ }
      closeLrcSync();
      try { api.renderContent(); } catch { /* ignore */ }
    }
  });
  ov._esc = (e) => { if (e.key === 'Escape') closeLrcSync(); };
  document.addEventListener('keydown', ov._esc);
}
export function closeLrcSync() {
  document.querySelectorAll('[data-lrc-sync]').forEach((ov) => {
    try { if (ov._esc) document.removeEventListener('keydown', ov._esc); } catch { /* ignore */ }
    ov.remove();
  });
}
