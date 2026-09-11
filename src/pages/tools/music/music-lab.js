// 🧪 ViXoRa Tag Lab — ویرایش گروهی تگ، تکراری‌یاب، سلامت کتابخانه، کاور
import { faDigits } from '../../../core/schemas/music-schema.js';
import {
  updateSong, deleteSong, setSongRating, toggleSongLike,
  setCoverImage, getCoverUrl, removeCoverImage,
} from '../../../core/services/music-library-service.js';
import { drawGauge } from './music-charts.js';

const UI_KEY = 'ViXoRa:music-lab-ui';
const URL_CACHE_KEY = 'ViXoRa:music-url-health';

function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
function loadUi() {
  try { return { view: 'bulk', selected: [], q: '', ...JSON.parse(localStorage.getItem(UI_KEY) || '{}') }; }
  catch { return { view: 'bulk', selected: [], q: '' }; }
}
function saveUi(patch) {
  const u = { ...loadUi(), ...patch };
  try { localStorage.setItem(UI_KEY, JSON.stringify({ ...u, selected: u.selected.slice(0, 500) })); } catch { /* ignore */ }
  return u;
}
function loadUrlCache() { try { return JSON.parse(localStorage.getItem(URL_CACHE_KEY) || '{}'); } catch { return {}; } }
function saveUrlCache(c) { try { localStorage.setItem(URL_CACHE_KEY, JSON.stringify(c)); } catch { /* ignore */ } }
function norm(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }

/* ---------- تحلیل‌ها ---------- */

export function findDuplicates(songs) {
  const byUrl = new Map(), byKey = new Map(), byFile = new Map();
  for (const s of songs) {
    const u = norm(s.url);
    if (u) { if (!byUrl.has(u)) byUrl.set(u, []); byUrl.get(u).push(s); }
    const k = norm(s.title) + '⟨⟩' + norm(s.artist);
    if (norm(s.title)) { if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(s); }
    const f = norm(s.fileName);
    if (f) { if (!byFile.has(f)) byFile.set(f, []); byFile.get(f).push(s); }
  }
  const groups = [];
  const seen = new Set();
  for (const [kind, map] of [['url', byUrl], ['key', byKey], ['file', byFile]]) {
    for (const [, arr] of map) {
      if (arr.length < 2) continue;
      const sig = arr.map((s) => s.id).sort().join('|');
      if (seen.has(sig)) continue;
      seen.add(sig);
      groups.push({ kind, items: arr });
    }
  }
  return groups;
}

export function missingReport(songs) {
  const rep = { noArtist: [], noAlbum: [], noGenre: [], noYear: [], noCover: [], noLyrics: [], noRating: [], neverPlayed: [] };
  for (const s of songs) {
    if (!String(s.artist || '').trim() || /unknown|ناشناس/i.test(s.artist || '')) rep.noArtist.push(s);
    if (!String(s.album || '').trim()) rep.noAlbum.push(s);
    if (!String(s.genre || '').trim()) rep.noGenre.push(s);
    if (!String(s.year || '').trim()) rep.noYear.push(s);
    if (!s.hasCover) rep.noCover.push(s);
    if (!String(s.lyrics || '').trim()) rep.noLyrics.push(s);
    if (!(s.rating > 0)) rep.noRating.push(s);
    if (!(s.playCount > 0)) rep.neverPlayed.push(s);
  }
  return rep;
}

export function healthScore(songs) {
  if (!songs.length) return 0;
  const rep = missingReport(songs);
  const dup = findDuplicates(songs).reduce((a, g) => a + g.items.length - 1, 0);
  const penalty = (rep.noArtist.length * 2 + rep.noAlbum.length + rep.noGenre.length + rep.noCover.length + dup * 3) / songs.length;
  return Math.max(0, Math.min(1, 1 - penalty / 6));
}

export function guessFromFilename(name) {
  const base = String(name || '').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_\.]+/g, ' ').trim();
  const m = base.match(/^\s*(.+?)\s*[-–—]\s*(.+?)\s*$/);
  if (m) return { artist: m[1].trim(), title: m[2].replace(/^\d{1,3}\s*[-.]?\s*/, '').trim() };
  return { artist: '', title: base.replace(/^\d{1,3}\s*[-.]?\s*/, '').trim() };
}

/* ---------- رندر ---------- */

const VIEWS = [
  { id: 'bulk', label: '✏️ ویرایش گروهی', icon: '✏️' },
  { id: 'dup', label: '👯 تکراری‌ها', icon: '👯' },
  { id: 'missing', label: '🧩 نواقص', icon: '🧩' },
  { id: 'health', label: '💊 سلامت', icon: '💊' },
  { id: 'cover', label: '🖼 کاورها', icon: '🖼' },
  { id: 'url', label: '🔗 سلامت لینک', icon: '🔗' },
];

export function renderLabView(lib) {
  const ui = loadUi();
  const songs = lib.songs || [];
  const tabs = VIEWS.map((v) =>
    `<button class="mx-btn mx-btn--sm ${ui.view === v.id ? 'mx-btn--primary' : ''}" data-action="lab-view" data-v="${v.id}">${v.label}</button>`
  ).join('');
  let body = '';
  if (ui.view === 'bulk') body = renderBulk(songs, ui);
  else if (ui.view === 'dup') body = renderDup(songs, ui);
  else if (ui.view === 'missing') body = renderMissing(songs, ui);
  else if (ui.view === 'health') body = renderHealth(songs, ui);
  else if (ui.view === 'cover') body = renderCovers(songs, ui);
  else if (ui.view === 'url') body = renderUrl(songs, ui);
  return `<div class="mx-secbar"><h3>🧪 آزمایشگاه تگ</h3><div class="mx-secbar-actions">${tabs}</div></div>${body}`;
}

function searchBar(ui) {
  return `<div class="mx-panel"><input class="mx-search" data-lab="q" value="${esc(ui.q)}" placeholder="🔎 جستجو در آهنگ‌ها…" /></div>`;
}

function renderBulk(songs, ui) {
  const q = norm(ui.q);
  const list = songs.filter((s) => !q || norm(s.title + ' ' + s.artist + ' ' + s.album).includes(q));
  const sel = new Set(ui.selected);
  const rows = list.slice(0, 300).map((s) => `
    <label class="mx-lab-row ${sel.has(String(s.id)) ? 'is-sel' : ''}">
      <input type="checkbox" data-lab="sel" value="${esc(s.id)}" ${sel.has(String(s.id)) ? 'checked' : ''} />
      <span class="mx-lab-title">${esc(s.title || 'بی‌نام')}</span>
      <span class="mx-lab-sub">${esc(s.artist || '—')} • ${esc(s.album || '—')}</span>
      <span class="mx-lab-plays">${faDigits(String(s.playCount || 0))} ▶</span>
    </label>`).join('');
  return `${searchBar(ui)}
  <div class="mx-panel"><h4>🎯 ${faDigits(String(sel.size))} آهنگ انتخاب شده</h4>
    <div class="mx-btn-row">
      <button class="mx-btn mx-btn--sm" data-action="lab-sel-all">✅ انتخاب همه نتایج</button>
      <button class="mx-btn mx-btn--sm" data-action="lab-sel-none">🚫 لغو انتخاب</button>
      <button class="mx-btn mx-btn--sm" data-action="lab-sel-invert">🔁 معکوس</button>
    </div>
    <div class="mx-form-grid">
      <label>خواننده<input data-lab="f-artist" placeholder="— بدون تغییر —" /></label>
      <label>آلبوم<input data-lab="f-album" placeholder="— بدون تغییر —" /></label>
      <label>سبک<input data-lab="f-genre" placeholder="— بدون تغییر —" list="mx-genres" /></label>
      <label>سال<input data-lab="f-year" placeholder="— بدون تغییر —" inputmode="numeric" /></label>
      <label>امتیاز<select data-lab="f-rating"><option value="">— بدون تغییر —</option><option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3">⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option><option value="0">حذف امتیاز</option></select></label>
      <label>علاقه‌مندی<select data-lab="f-like"><option value="">— بدون تغییر —</option><option value="1">❤️ افزودن</option><option value="0">🤍 حذف</option></select></label>
    </div>
    <div class="mx-btn-row">
      <button class="mx-btn mx-btn--primary" data-action="lab-apply">✨ اعمال روی انتخاب‌شده‌ها</button>
      <button class="mx-btn mx-btn--sm" data-action="lab-guess-names">🪄 حدس نام از روی فایل</button>
      <button class="mx-btn mx-btn--sm mx-btn--danger" data-action="lab-delete-sel">🗑 حذف انتخاب‌شده‌ها</button>
    </div>
  </div>
  <div class="mx-panel"><div class="mx-lab-list">${rows || '<div class="mx-empty">چیزی پیدا نشد.</div>'}</div>
  ${list.length > 300 ? `<div class="mx-hint">نمایش ۳۰۰ تای اول از ${faDigits(String(list.length))} — جستجو را دقیق‌تر کن.</div>` : ''}</div>`;
}

function renderDup(songs) {
  const groups = findDuplicates(songs);
  const names = { url: '🔗 لینک یکسان', key: '📝 عنوان+خواننده یکسان', file: '📁 فایل یکسان' };
  const body = groups.map((g, i) => `
    <div class="mx-panel"><h4>${names[g.kind]} — ${faDigits(String(g.items.length))} مورد</h4>
      ${g.items.map((s) => `<div class="mx-dup-row"><span>${esc(s.title || 'بی‌نام')} — ${esc(s.artist || '—')}</span>
        <span class="mx-dup-meta">${faDigits(String(s.playCount || 0))} پخش • ${esc((s.url || '').slice(0, 42))}</span>
        <button class="mx-btn mx-btn--sm" data-action="lab-dup-play" data-id="${esc(s.id)}">▶</button>
        <button class="mx-btn mx-btn--sm mx-btn--danger" data-action="lab-dup-del" data-id="${esc(s.id)}">حذف</button>
      </div>`).join('')}
      <div class="mx-btn-row"><button class="mx-btn mx-btn--sm" data-action="lab-dup-keep-best" data-g="${i}">🏆 نگه‌داشتن پرپخش‌ترین + حذف بقیه</button></div>
    </div>`).join('');
  return `<div class="mx-panel"><div class="mx-stats-row">
      <span class="mx-stat">👯 ${faDigits(String(groups.length))} گروه تکراری</span>
      <span class="mx-stat">🗑 ${faDigits(String(groups.reduce((a, g) => a + g.items.length - 1, 0)))} آهنگ اضافه</span>
    </div>
    <div class="mx-btn-row"><button class="mx-btn mx-btn--sm" data-action="lab-dup-auto">🤖 حذف خودکار همه تکراری‌ها (نگه‌داشتن بهترین)</button></div></div>
  ${body || '<div class="mx-panel"><div class="mx-empty">🎉 تکراری پیدا نشد. کتابخانه تمیزه!</div></div>'}`;
}

function renderMissing(songs, ui) {
  const rep = missingReport(songs);
  const cards = [
    ['noArtist', '🎤 بدون خواننده'], ['noAlbum', '💿 بدون آلبوم'], ['noGenre', '🎷 بدون سبک'],
    ['noYear', '📅 بدون سال'], ['noCover', '🖼 بدون کاور'], ['noLyrics', '🎤 بدون شعر'],
    ['noRating', '⭐ بدون امتیاز'], ['neverPlayed', '💤 هرگز پخش‌نشده'],
  ].map(([k, label]) => `
    <button class="mx-miss-card" data-action="lab-miss" data-k="${k}">
      <b>${faDigits(String(rep[k].length))}</b><span>${label}</span>
    </button>`).join('');
  const k = ui.missKey;
  let detail = '';
  if (k && rep[k]) {
    detail = `<div class="mx-panel"><h4>🔎 ${faDigits(String(rep[k].length))} مورد</h4>
      <div class="mx-btn-row"><button class="mx-btn mx-btn--sm" data-action="lab-miss-select" data-k="${k}">✅ انتخاب همه در ویرایش گروهی</button></div>
      <div class="mx-lab-list">${rep[k].slice(0, 120).map((s) => `<div class="mx-lab-row"><span class="mx-lab-title">${esc(s.title || 'بی‌نام')}</span><span class="mx-lab-sub">${esc(s.artist || '—')}</span></div>`).join('')}</div></div>`;
  }
  return `<div class="mx-miss-grid">${cards}</div>${detail}`;
}

function renderHealth(songs) {
  const score = healthScore(songs);
  const rep = missingReport(songs);
  const dup = findDuplicates(songs).reduce((a, g) => a + g.items.length - 1, 0);
  const total = songs.length || 1;
  const tips = [];
  if (rep.noArtist.length > total * 0.2) tips.push('🎤 خیلی از آهنگ‌ها خواننده ندارند — از «حدس نام از روی فایل» استفاده کن.');
  if (dup > 0) tips.push(`👯 ${faDigits(String(dup))} آهنگ تکراری فضا گرفته — تب تکراری‌ها را ببین.`);
  if (rep.noCover.length > total * 0.3) tips.push('🖼 بیشتر آهنگ‌ها کاور ندارند — تب کاورها.');
  if (rep.neverPlayed.length > total * 0.5) tips.push('💤 نصف کتابخانه را هرگز گوش ندادی — تب رادیو → «کشف‌نشده‌ها».');
  if (!tips.length) tips.push('🌟 کتابخانه‌ات در وضعیت عالیه. آفرین!');
  return `<div class="mx-grid-2">
    <div class="mx-panel"><h4>💊 امتیاز سلامت کتابخانه</h4><canvas data-lab="gauge" width="300" height="130"></canvas>
      <div class="mx-hint">بر اساس تگ‌ها، کاورها و تکراری‌ها محاسبه می‌شود.</div></div>
    <div class="mx-panel"><h4>💡 پیشنهادهای هوشمند</h4><ul class="mx-tips">${tips.map((t) => `<li>${t}</li>`).join('')}</ul>
      <div class="mx-btn-row"><button class="mx-btn mx-btn--sm" data-action="lab-view" data-v="bulk">رفتن به ویرایش گروهی</button></div></div>
  </div>
  <div class="mx-panel"><h4>📊 جزئیات</h4><div class="mx-stats-row">
    <span class="mx-stat">🎵 ${faDigits(String(songs.length))} آهنگ</span>
    <span class="mx-stat">👯 ${faDigits(String(dup))} تکراری</span>
    <span class="mx-stat">🖼 ${faDigits(String(rep.noCover.length))} بدون کاور</span>
    <span class="mx-stat">🎤 ${faDigits(String(rep.noLyrics.length))} بدون شعر</span>
  </div></div>`;
}

function renderCovers(songs, ui) {
  const q = norm(ui.q);
  const list = songs.filter((s) => !q || norm(s.title + ' ' + s.artist).includes(q)).slice(0, 60);
  const cards = list.map((s) => `
    <div class="mx-cover-card" data-cover-card="${esc(s.id)}">
      <div class="mx-cover-box" data-cover="song:${esc(s.id)}">🎵</div>
      <b>${esc((s.title || 'بی‌نام').slice(0, 26))}</b>
      <span>${esc((s.artist || '—').slice(0, 24))}</span>
      <div class="mx-btn-row">
        <button class="mx-btn mx-btn--sm" data-action="lab-cover-upload" data-id="${esc(s.id)}">⬆ آپلود</button>
        <button class="mx-btn mx-btn--sm" data-action="lab-cover-url" data-id="${esc(s.id)}">🔗 لینک</button>
        ${s.hasCover ? `<button class="mx-btn mx-btn--sm mx-btn--danger" data-action="lab-cover-del" data-id="${esc(s.id)}">✕</button>` : ''}
      </div>
    </div>`).join('');
  return `${searchBar(ui)}
  <div class="mx-panel"><div class="mx-stats-row"><span class="mx-stat">🖼 ${faDigits(String(songs.filter((s) => s.hasCover).length))} کاور از ${faDigits(String(songs.length))}</span></div></div>
  <div class="mx-cover-grid">${cards || '<div class="mx-empty">چیزی پیدا نشد.</div>'}</div>
  <input type="file" data-lab="cover-file" accept="image/*" class="mx-hidden" />`;
}

function renderUrl(songs, ui) {
  const cache = loadUrlCache();
  const remote = songs.filter((s) => /^https?:/i.test(s.url || ''));
  const rows = remote.slice(0, 200).map((s) => {
    const st = cache[String(s.id)];
    const badge = !st ? '<span class="mx-badge">⏳ بررسی‌نشده</span>'
      : st.ok ? `<span class="mx-badge mx-ok">✅ سالم (${faDigits(String(st.ms))}ms)</span>`
      : `<span class="mx-badge mx-bad">❌ خراب</span>`;
    return `<div class="mx-lab-row"><span class="mx-lab-title">${esc((s.title || 'بی‌نام').slice(0, 40))}</span>
      <span class="mx-lab-sub" dir="ltr">${esc((s.url || '').slice(0, 60))}</span>${badge}
      <button class="mx-btn mx-btn--sm" data-action="lab-url-one" data-id="${esc(s.id)}">🔄</button></div>`;
  }).join('');
  const okCount = remote.filter((s) => cache[String(s.id)]?.ok).length;
  return `<div class="mx-panel"><div class="mx-stats-row">
      <span class="mx-stat">🔗 ${faDigits(String(remote.length))} لینک راه‌دور</span>
      <span class="mx-stat">✅ ${faDigits(String(okCount))} سالم</span>
    </div>
    <div class="mx-btn-row">
      <button class="mx-btn mx-btn--primary mx-btn--sm" data-action="lab-url-all">🚀 بررسی همه لینک‌ها</button>
      <button class="mx-btn mx-btn--sm" data-action="lab-url-clear">🧹 پاک کردن حافظه بررسی</button>
      <button class="mx-btn mx-btn--sm" data-action="lab-url-select-bad">✅ انتخاب خراب‌ها در ویرایش گروهی</button>
    </div>
    <div class="mx-progress" data-lab="url-progress" hidden><i></i></div>
  </div>
  <div class="mx-panel"><div class="mx-lab-list">${rows || '<div class="mx-empty">لینک راه‌دوری نیست.</div>'}</div></div>`;
}

/* ---------- پس از رندر ---------- */
export function afterLabRender(root, lib) {
  const g = root.querySelector('[data-lab="gauge"]');
  if (g) drawGauge(g, healthScore(lib.songs || []), { label: 'سلامت کتابخانه' });
  root.querySelectorAll('[data-cover]').forEach((box) => {
    const [type, id] = String(box.dataset.cover).split(':');
    getCoverUrl(type, id).then((url) => {
      if (url && box.isConnected) {
        box.innerHTML = '';
        box.style.backgroundImage = `url("${url}")`;
        box.classList.add('has-img');
      }
    }).catch(() => null);
  });
}

/* ---------- بررسی لینک ---------- */
async function checkUrl(url, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const t0 = performance.now();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    let r = await fetch(url, { method: 'HEAD', signal: ctrl.signal, mode: 'no-cors' }).catch(() => null);
    if (!r) r = await fetch(url, { method: 'GET', signal: ctrl.signal, mode: 'no-cors' }).catch(() => null);
    return { ok: !!r, ms: Math.round(performance.now() - t0) };
  } catch { return { ok: false, ms: Math.round(performance.now() - t0) }; }
  finally { clearTimeout(timer); }
}

/* ---------- اکشن‌ها ---------- */
let coverTargetId = '';

export async function handleLabAction(action, el, api) {
  const { lib, root, toast, refreshLibrary, renderContent } = api;
  const ui = loadUi();
  const songs = lib.songs || [];
  const byId = new Map(songs.map((s) => [String(s.id), s]));

  switch (action) {
    case 'lab-view': saveUi({ view: el.dataset.v || 'bulk', missKey: '' }); renderContent(); return true;
    case 'lab-sel-all': {
      const q = norm(ui.q);
      const ids = songs.filter((s) => !q || norm(s.title + ' ' + s.artist + ' ' + s.album).includes(q)).slice(0, 500).map((s) => String(s.id));
      saveUi({ selected: ids }); renderContent(); return true;
    }
    case 'lab-sel-none': saveUi({ selected: [] }); renderContent(); return true;
    case 'lab-sel-invert': {
      const q = norm(ui.q);
      const vis = new Set(songs.filter((s) => !q || norm(s.title + ' ' + s.artist + ' ' + s.album).includes(q)).map((s) => String(s.id)));
      const sel = new Set(ui.selected);
      const next = [...vis].filter((id) => !sel.has(id));
      saveUi({ selected: next }); renderContent(); return true;
    }
    case 'lab-apply': {
      const ids = ui.selected.filter((id) => byId.has(id));
      if (!ids.length) { toast.warning('اول چند آهنگ انتخاب کن.'); return true; }
      const patch = {};
      const g = (k) => root.querySelector(`[data-lab="${k}"]`)?.value?.trim() ?? '';
      const artist = g('f-artist'), album = g('f-album'), genre = g('f-genre'), year = g('f-year');
      const rating = g('f-rating'), like = g('f-like');
      if (artist) patch.artist = artist;
      if (album) patch.album = album;
      if (genre) patch.genre = genre;
      if (year) patch.year = year;
      let n = 0;
      for (const id of ids) {
        const p = { ...patch };
        if (rating !== '') p.rating = Number(rating);
        if (like !== '') p.liked = like === '1';
        if (!Object.keys(p).length) break;
        await updateSong(id, p).catch(() => null);
        n++;
      }
      await refreshLibrary();
      toast.success(`✨ ${faDigits(String(n))} آهنگ به‌روز شد.`);
      renderContent();
      return true;
    }
    case 'lab-guess-names': {
      const ids = (ui.selected.length ? ui.selected : songs.map((s) => String(s.id))).filter((id) => byId.has(id));
      let n = 0;
      for (const id of ids) {
        const s = byId.get(id);
        if (!s.fileName) continue;
        const guess = guessFromFilename(s.fileName);
        const p = {};
        if (guess.artist && (!s.artist || /unknown|ناشناس/i.test(s.artist))) p.artist = guess.artist;
        if (guess.title && (!s.title || /^track|بی‌نام/i.test(s.title))) p.title = guess.title;
        if (Object.keys(p).length) { await updateSong(id, p).catch(() => null); n++; }
      }
      await refreshLibrary();
      toast.success(`🪄 ${faDigits(String(n))} آهنگ حدس و اصلاح شد.`);
      renderContent();
      return true;
    }
    case 'lab-delete-sel': {
      const ids = ui.selected.filter((id) => byId.has(id));
      if (!ids.length) { toast.warning('انتخابی نیست.'); return true; }
      if (!confirm(`🗑 ${faDigits(String(ids.length))} آهنگ حذف شود؟`)) return true;
      for (const id of ids) await deleteSong(id).catch(() => null);
      saveUi({ selected: [] });
      await refreshLibrary();
      toast.success('🗑 حذف شد.');
      renderContent();
      return true;
    }
    case 'lab-miss': saveUi({ missKey: el.dataset.k }); renderContent(); return true;
    case 'lab-miss-select': {
      const rep = missingReport(songs);
      const arr = rep[el.dataset.k] || [];
      saveUi({ view: 'bulk', missKey: '', selected: arr.map((s) => String(s.id)).slice(0, 500) });
      renderContent();
      return true;
    }
    case 'lab-dup-play': { api.playSong?.(el.dataset.id, 'songs'); return true; }
    case 'lab-dup-del': {
      await deleteSong(el.dataset.id).catch(() => null);
      await refreshLibrary(); renderContent(); return true;
    }
    case 'lab-dup-keep-best':
    case 'lab-dup-auto': {
      const groups = findDuplicates(songs);
      let n = 0;
      const targets = action === 'lab-dup-auto' ? groups : [groups[Number(el.dataset.g)]].filter(Boolean);
      for (const gr of targets) {
        const sorted = [...gr.items].sort((a, b) => (b.playCount || 0) - (a.playCount || 0) || ((b.rating || 0) - (a.rating || 0)));
        for (const victim of sorted.slice(1)) { await deleteSong(victim.id).catch(() => null); n++; }
      }
      await refreshLibrary();
      toast.success(`🤖 ${faDigits(String(n))} تکراری حذف شد.`);
      renderContent();
      return true;
    }
    case 'lab-cover-upload': {
      coverTargetId = el.dataset.id;
      root.querySelector('[data-lab="cover-file"]')?.click();
      return true;
    }
    case 'lab-cover-url': {
      const id = el.dataset.id;
      const url = prompt('🔗 لینک عکس کاور را بچسبان:');
      if (!url || !/^https?:/i.test(url)) return true;
      try {
        const r = await fetch(url);
        const blob = await r.blob();
        await setCoverImage('song', id, new File([blob], 'cover.jpg', { type: blob.type || 'image/jpeg' }));
        await refreshLibrary(); renderContent();
        toast.success('🖼 کاور ثبت شد.');
      } catch { toast.error('دانلود عکس ناموفق بود (CORS).'); }
      return true;
    }
    case 'lab-cover-del': {
      await removeCoverImage('song', el.dataset.id).catch(() => null);
      await refreshLibrary(); renderContent(); return true;
    }
    case 'lab-url-one': {
      const id = el.dataset.id;
      const s = byId.get(String(id));
      if (!s?.url) return true;
      toast.info('🔄 در حال بررسی…');
      const res = await checkUrl(s.url);
      const cache = loadUrlCache();
      cache[String(id)] = { ...res, at: Date.now() };
      saveUrlCache(cache);
      renderContent();
      return true;
    }
    case 'lab-url-all': {
      const remote = songs.filter((s) => /^https?:/i.test(s.url || ''));
      if (!remote.length) { toast.warning('لینکی نیست.'); return true; }
      const bar = root.querySelector('[data-lab="url-progress"]');
      if (bar) { bar.hidden = false; }
      const fill = bar?.querySelector('i');
      const cache = loadUrlCache();
      const CONC = 6;
      for (let i = 0; i < remote.length; i += CONC) {
        const batch = remote.slice(i, i + CONC);
        const results = await Promise.all(batch.map((s) => checkUrl(s.url)));
        batch.forEach((s, j) => { cache[String(s.id)] = { ...results[j], at: Date.now() }; });
        saveUrlCache(cache);
        if (fill) fill.style.width = Math.round(((i + batch.length) / remote.length) * 100) + '%';
      }
      const bad = remote.filter((s) => !cache[String(s.id)]?.ok).length;
      toast[bad ? 'warning' : 'success'](bad ? `⚠️ ${faDigits(String(bad))} لینک خراب پیدا شد.` : '✅ همه لینک‌ها سالم‌اند.');
      renderContent();
      return true;
    }
    case 'lab-url-clear': saveUrlCache({}); renderContent(); return true;
    case 'lab-url-select-bad': {
      const cache = loadUrlCache();
      const bad = songs.filter((s) => /^https?:/i.test(s.url || '') && cache[String(s.id)] && !cache[String(s.id)].ok);
      saveUi({ view: 'bulk', selected: bad.map((s) => String(s.id)) });
      renderContent();
      return true;
    }
    default: return false;
  }
}

export async function handleLabCoverFile(file, api) {
  if (!file || !coverTargetId) return;
  await setCoverImage('song', coverTargetId, file).catch(() => null);
  await api.refreshLibrary();
  api.renderContent();
  api.toast.success('🖼 کاور ثبت شد.');
}

export function handleLabInput(el, api) {
  const k = el.dataset.lab;
  if (k === 'q') {
    clearTimeout(handleLabInput._t);
    handleLabInput._t = setTimeout(() => { saveUi({ q: el.value }); api.renderContent(); }, 350);
    return true;
  }
  if (k === 'sel') {
    const ui = loadUi();
    const set = new Set(ui.selected);
    if (el.checked) set.add(el.value); else set.delete(el.value);
    saveUi({ selected: [...set].slice(0, 500) });
    el.closest('.mx-lab-row')?.classList.toggle('is-sel', el.checked);
    return true;
  }
  return false;
}
