// src/core/services/music-library-service.js

/**
 * ViXoRa Music Library Service — کتابخانه موزیک
 * ==================================================================
 * متادیتا (آهنگ/پلی‌لیست/آلبوم) → tools-service با toolName = 'music'
 * فایل‌های صوتی و کاورها → IndexedDB (LocalStorage برای فایل کم است)
 *
 * آیتم‌های tool موسیقی kind دارند: 'song' | 'playlist' | 'album'
 */

import {
  getToolData,
  getToolItem,
  createToolItem,
  updateToolItem,
  deleteToolItem,
} from '../actions/tools-service.js';

import {
  MUSIC_TOOL_NAME,
  AUDIO_EXTENSIONS,
  normalizeSong,
  normalizePlaylist,
  normalizeAlbum,
  validateSongDraft,
  validatePlaylistDraft,
  validateAlbumDraft,
  isHttpUrl,
  guessTitleFromUrl,
  pushHistoryEntry,
} from '../schemas/music-schema.js';

import { createLocalStorageAdapter } from '../../utilities/storage.js';
import { getAppState } from '../state/app-state.js';

const storage = createLocalStorageAdapter();

/* ================================================================== */
/* IndexedDB                                                            */
/* ================================================================== */

const DB_NAME = 'vixora-music';
const DB_VERSION = 1;
const BLOB_STORE = 'blobs';
const COVER_STORE = 'covers';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('مرورگر شما IndexedDB را پشتیبانی نمی‌کند.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BLOB_STORE)) db.createObjectStore(BLOB_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(COVER_STORE)) db.createObjectStore(COVER_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('خطا در باز کردن دیتابیس موزیک.'));
  });
  return dbPromise;
}

function idbRequest(storeName, mode, run) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        let settled = false;
        const tx = db.transaction(storeName, mode);
        tx.oncomplete = () => {
          if (!settled) {
            settled = true;
            resolve(undefined);
          }
        };
        tx.onerror = () => {
          if (!settled) {
            settled = true;
            reject(tx.error || new Error('خطای IndexedDB.'));
          }
        };
        try {
          const store = tx.objectStore(storeName);
          const request = run(store);
          if (request && typeof request.onsuccess !== 'undefined') {
            request.onsuccess = () => {
              if (!settled) {
                settled = true;
                resolve(request.result);
              }
            };
            request.onerror = () => {
              if (!settled) {
                settled = true;
                reject(request.error || new Error('خطای IndexedDB.'));
              }
            };
          }
        } catch (error) {
          if (!settled) {
            settled = true;
            reject(error);
          }
        }
      })
  );
}

function idbPut(storeName, value) {
  return idbRequest(storeName, 'readwrite', (store) => store.put(value));
}

function idbGet(storeName, key) {
  return idbRequest(storeName, 'readonly', (store) => store.get(key));
}

function idbDelete(storeName, key) {
  return idbRequest(storeName, 'readwrite', (store) => store.delete(key));
}

/* کش blob URL در حافظه (بعد از بستن مرورگر آزاد و در نیاز بعدی بازسازی می‌شود) */
const urlCache = new Map();

function cacheKey(storeName, id) {
  return `${storeName}:${id}`;
}

function revokeCachedUrl(storeName, id) {
  const key = cacheKey(storeName, id);
  const cached = urlCache.get(key);
  if (cached) {
    try {
      URL.revokeObjectURL(cached);
    } catch {
      /* ignore */
    }
    urlCache.delete(key);
  }
}

/* ================================================================== */
/* خواندن آهنگ‌ها                                                       */
/* ================================================================== */

async function readAllMusicItems() {
  const items = await getToolData(MUSIC_TOOL_NAME);
  return Array.isArray(items) ? items : [];
}

export async function listSongs() {
  const items = await readAllMusicItems();
  return items.filter((item) => item && item.kind === 'song').map((item) => normalizeSong(item));
}

export async function getSong(songId) {
  if (!songId) return null;
  if (String(songId).startsWith('smart:')) return null;
  const item = await getToolItem(MUSIC_TOOL_NAME, songId).catch(() => null);
  if (!item || item.kind !== 'song') return null;
  return normalizeSong(item);
}

export async function listPlaylists() {
  const items = await readAllMusicItems();
  return items
    .filter((item) => item && item.kind === 'playlist')
    .map((item) => normalizePlaylist(item))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function getPlaylist(playlistId) {
  const item = await getToolItem(MUSIC_TOOL_NAME, playlistId).catch(() => null);
  if (!item || item.kind !== 'playlist') return null;
  return normalizePlaylist(item);
}

export async function listAlbums() {
  const items = await readAllMusicItems();
  return items
    .filter((item) => item && item.kind === 'album')
    .map((item) => normalizeAlbum(item))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function getAlbum(albumId) {
  const item = await getToolItem(MUSIC_TOOL_NAME, albumId).catch(() => null);
  if (!item || item.kind !== 'album') return null;
  return normalizeAlbum(item);
}

/* ================================================================== */
/* تشخیص تکراری                                                         */
/* ================================================================== */

export async function findDuplicateSong({ url = '', fileName = '', fileSize = 0 } = {}) {
  const songs = await listSongs();
  const cleanUrl = String(url || '').trim();
  if (cleanUrl) {
    const byUrl = songs.find((s) => s.source === 'link' && s.url === cleanUrl);
    if (byUrl) return byUrl;
  }
  const cleanName = String(fileName || '').trim().toLowerCase();
  if (cleanName && fileSize > 0) {
    const byFile = songs.find(
      (s) => s.source === 'upload' && String(s.fileName || '').toLowerCase() === cleanName && Number(s.fileSize) === Number(fileSize)
    );
    if (byFile) return byFile;
  }
  return null;
}

/* ================================================================== */
/* تشخیص مدت آهنگ (بدون دانلود کامل — فقط متادیتا)                        */
/* ================================================================== */

export function probeAudioDuration(src, timeoutMs = 12000) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        audio.removeAttribute('src');
        audio.load();
      } catch {
        /* ignore */
      }
      resolve(value);
    };

    const audio = new Audio();
    audio.preload = 'metadata';
    const timer = setTimeout(() => finish(null), timeoutMs);

    audio.onloadedmetadata = () => {
      const d = Number(audio.duration);
      finish(Number.isFinite(d) && d > 0 ? d : null);
    };
    audio.onerror = () => finish(null);
    try {
      audio.src = src;
    } catch {
      finish(null);
    }
  });
}

/* ================================================================== */
/* افزودن آهنگ                                                          */
/* ================================================================== */

export async function addSongFromLink({ url = '', title = '', artist = '', album = '', genre = '' } = {}) {
  const cleanUrl = String(url || '').trim();
  const validation = validateSongDraft({ title: title || guessTitleFromUrl(cleanUrl), source: 'link', url: cleanUrl });
  if (!validation.valid) throw new Error(validation.message);
  if (!isHttpUrl(cleanUrl)) throw new Error('لینک معتبر وارد کنید.');

  const duplicate = await findDuplicateSong({ url: cleanUrl });
  if (duplicate) {
    throw new Error(`این لینک قبلاً با نام «${duplicate.title}» اضافه شده است.`);
  }

  const duration = await probeAudioDuration(cleanUrl).catch(() => null);

  const created = await createToolItem(
    MUSIC_TOOL_NAME,
    normalizeSong({
      title: String(title || '').trim() || guessTitleFromUrl(cleanUrl),
      artist: String(artist || '').trim() || 'خواننده ناشناس',
      album: String(album || '').trim(),
      genre: genre || 'سایر',
      duration: duration || 0,
      source: 'link',
      url: cleanUrl,
    })
  );

  return normalizeSong(created);
}

function isAudioFile(file) {
  if (!file) return false;
  if (typeof file.type === 'string' && file.type.startsWith('audio/')) return true;
  const name = String(file.name || '').toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => name.endsWith(`.${ext}`));
}

export async function addSongsFromFiles(fileList) {
  const files = [...(fileList || [])];
  const added = [];
  const skipped = [];

  for (const file of files) {
    try {
      if (!isAudioFile(file)) {
        skipped.push({ name: file.name, reason: 'فرمت پشتیبانی نمی‌شود.' });
        continue;
      }
      if (file.size > 150 * 1024 * 1024) {
        skipped.push({ name: file.name, reason: 'حجم فایل بیشتر از ۱۵۰ مگابایت است.' });
        continue;
      }
      const duplicate = await findDuplicateSong({ fileName: file.name, fileSize: file.size });
      if (duplicate) {
        skipped.push({ name: file.name, reason: `تکراری است (قبلاً با نام «${duplicate.title}» اضافه شده).` });
        continue;
      }

      const objectUrl = URL.createObjectURL(file);
      let duration = 0;
      try {
        duration = (await probeAudioDuration(objectUrl)) || 0;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      const baseName = String(file.name || 'آهنگ بدون نام').replace(/\.[a-z0-9]{2,5}$/i, '');

      const created = await createToolItem(
        MUSIC_TOOL_NAME,
        normalizeSong({
          title: baseName,
          source: 'upload',
          duration,
          fileName: file.name,
          fileSize: file.size,
          mime: file.type || 'audio/mpeg',
          hasBlob: true,
        })
      );

      await idbPut(BLOB_STORE, { id: created.id, blob: file, mime: file.type || '', size: file.size });
      added.push(normalizeSong(created));
    } catch (error) {
      skipped.push({ name: file?.name || 'فایل', reason: error?.message || 'خطای ناشناخته.' });
    }
  }

  return { added, skipped };
}

/** اتصال مجدد فایل به آهنگ آپلودی که فایلش گم شده (مثلاً بعد از ایمپورت بکاپ) */
export async function reattachSongFile(songId, file) {
  const song = await getSong(songId);
  if (!song) throw new Error('آهنگ یافت نشد.');
  if (!isAudioFile(file)) throw new Error('فرمت فایل پشتیبانی نمی‌شود.');

  const objectUrl = URL.createObjectURL(file);
  let duration = song.duration || 0;
  try {
    duration = (await probeAudioDuration(objectUrl)) || duration;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  await idbPut(BLOB_STORE, { id: song.id, blob: file, mime: file.type || '', size: file.size });
  revokeCachedUrl(BLOB_STORE, song.id);

  const updated = await updateToolItem(MUSIC_TOOL_NAME, song.id, {
    duration,
    fileName: file.name,
    fileSize: file.size,
    mime: file.type || song.mime,
    hasBlob: true,
    updatedAt: new Date().toISOString(),
  });
  return normalizeSong(updated);
}

/* ================================================================== */
/* ویرایش و حذف آهنگ                                                    */
/* ================================================================== */

export async function updateSong(songId, patch = {}) {
  const song = await getSong(songId);
  if (!song) throw new Error('آهنگ یافت نشد.');

  const next = normalizeSong({ ...song, ...patch, id: song.id, kind: 'song', source: song.source });
  const validation = validateSongDraft({ title: next.title, source: next.source, url: next.url, year: next.year });
  if (!validation.valid) throw new Error(validation.message);

  const updated = await updateToolItem(MUSIC_TOOL_NAME, song.id, {
    ...next,
    updatedAt: new Date().toISOString(),
  });
  return normalizeSong(updated);
}

export async function deleteSong(songId) {
  const song = await getSong(songId);
  if (!song) return false;

  await deleteToolItem(MUSIC_TOOL_NAME, songId);

  // پاکسازی فایل و کاور
  await idbDelete(BLOB_STORE, songId).catch(() => null);
  await idbDelete(COVER_STORE, `song:${songId}`).catch(() => null);
  revokeCachedUrl(BLOB_STORE, songId);
  revokeCachedUrl(COVER_STORE, `song:${songId}`);

  // حذف از پلی‌لیست‌ها و آلبوم‌ها
  const items = await readAllMusicItems();
  for (const item of items) {
    if ((item.kind === 'playlist' || item.kind === 'album') && Array.isArray(item.songIds) && item.songIds.includes(songId)) {
      await updateToolItem(MUSIC_TOOL_NAME, item.id, {
        songIds: item.songIds.filter((id) => id !== songId),
        updatedAt: new Date().toISOString(),
      }).catch(() => null);
    }
  }
  return true;
}

export async function toggleSongLike(songId) {
  const song = await getSong(songId);
  if (!song) throw new Error('آهنگ یافت نشد.');
  const updated = await updateToolItem(MUSIC_TOOL_NAME, songId, {
    liked: !song.liked,
    updatedAt: new Date().toISOString(),
  });
  return normalizeSong(updated);
}

export async function setSongRating(songId, rating) {
  const song = await getSong(songId);
  if (!song) throw new Error('آهنگ یافت نشد.');
  const value = Math.min(5, Math.max(0, Math.floor(Number(rating) || 0)));
  const updated = await updateToolItem(MUSIC_TOOL_NAME, songId, {
    rating: value,
    updatedAt: new Date().toISOString(),
  });
  return normalizeSong(updated);
}

/** ثبت یک پخش کامل/نسبی: شمارش + ثانیه گوش‌داده‌شده + ادامه از همان‌جا */
export async function recordPlay(songId, listenedSeconds = 0) {
  const song = await getSong(songId).catch(() => null);
  if (!song) return null;
  const updated = await updateToolItem(MUSIC_TOOL_NAME, songId, {
    playCount: (song.playCount || 0) + 1,
    listenedSeconds: (song.listenedSeconds || 0) + Math.max(0, Math.floor(listenedSeconds)),
    lastPlayedAt: new Date().toISOString(),
    lastPosition: 0,
    updatedAt: new Date().toISOString(),
  }).catch(() => null);
  return updated ? normalizeSong(updated) : null;
}

export async function saveSongPosition(songId, seconds) {
  if (!songId || !Number.isFinite(seconds)) return;
  await updateToolItem(MUSIC_TOOL_NAME, songId, { lastPosition: Math.max(0, seconds) }).catch(() => null);
}

/* ================================================================== */
/* آدرس قابل پخش                                                         */
/* ================================================================== */

export async function getTrackUrl(song) {
  const normalized = normalizeSong(song || {});
  if (normalized.source === 'link') {
    if (!normalized.url) throw new Error('این آهنگ لینک معتبری ندارد.');
    return normalized.url;
  }
  const key = cacheKey(BLOB_STORE, normalized.id);
  if (urlCache.has(key)) return urlCache.get(key);
  const record = await idbGet(BLOB_STORE, normalized.id).catch(() => null);
  if (!record || !record.blob) {
    await updateToolItem(MUSIC_TOOL_NAME, normalized.id, { hasBlob: false }).catch(() => null);
    throw new Error('فایل صوتی این آهنگ یافت نشد. لطفاً دوباره آن را الصاق کنید.');
  }
  const objectUrl = URL.createObjectURL(record.blob);
  urlCache.set(key, objectUrl);
  return objectUrl;
}

/* ================================================================== */
/* کاورها                                                               */
/* ================================================================== */

function coverKeyFor(ownerType, ownerId) {
  return `${ownerType}:${ownerId}`;
}

export async function setCoverImage(ownerType, ownerId, file) {
  if (!['song', 'playlist', 'album'].includes(ownerType)) throw new Error('نوع کاور نامعتبر است.');
  if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) {
    throw new Error('فایل تصویر معتبر انتخاب کنید.');
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('حجم تصویر بیشتر از ۱۰ مگابایت است.');

  const key = coverKeyFor(ownerType, ownerId);
  await idbPut(COVER_STORE, { id: key, blob: file, mime: file.type, size: file.size });
  revokeCachedUrl(COVER_STORE, key);
  await updateToolItem(MUSIC_TOOL_NAME, ownerId, { hasCover: true, updatedAt: new Date().toISOString() }).catch(() => null);
  return getCoverUrl(ownerType, ownerId);
}

export async function getCoverUrl(ownerType, ownerId) {
  const key = coverKeyFor(ownerType, ownerId);
  const cacheId = cacheKey(COVER_STORE, key);
  if (urlCache.has(cacheId)) return urlCache.get(cacheId);
  const record = await idbGet(COVER_STORE, key).catch(() => null);
  if (!record || !record.blob) return null;
  const objectUrl = URL.createObjectURL(record.blob);
  urlCache.set(cacheId, objectUrl);
  return objectUrl;
}

export async function removeCoverImage(ownerType, ownerId) {
  const key = coverKeyFor(ownerType, ownerId);
  await idbDelete(COVER_STORE, key).catch(() => null);
  revokeCachedUrl(COVER_STORE, key);
  await updateToolItem(MUSIC_TOOL_NAME, ownerId, { hasCover: false, updatedAt: new Date().toISOString() }).catch(() => null);
}

/* ================================================================== */
/* پلی‌لیست‌ها                                                           */
/* ================================================================== */

export async function createPlaylist({ title = '', description = '', songIds = [] } = {}) {
  const validation = validatePlaylistDraft({ title });
  if (!validation.valid) throw new Error(validation.message);
  const created = await createToolItem(MUSIC_TOOL_NAME, normalizePlaylist({ title, description, songIds }));
  return normalizePlaylist(created);
}

export async function updatePlaylist(playlistId, patch = {}) {
  const playlist = await getPlaylist(playlistId);
  if (!playlist) throw new Error('پلی‌لیست یافت نشد.');
  const next = normalizePlaylist({ ...playlist, ...patch, id: playlist.id, kind: 'playlist' });
  const validation = validatePlaylistDraft(next);
  if (!validation.valid) throw new Error(validation.message);
  const updated = await updateToolItem(MUSIC_TOOL_NAME, playlist.id, { ...next, updatedAt: new Date().toISOString() });
  return normalizePlaylist(updated);
}

export async function deletePlaylist(playlistId) {
  await deleteToolItem(MUSIC_TOOL_NAME, playlistId);
  await idbDelete(COVER_STORE, coverKeyFor('playlist', playlistId)).catch(() => null);
  revokeCachedUrl(COVER_STORE, coverKeyFor('playlist', playlistId));
  return true;
}

export async function addSongsToPlaylist(playlistId, songIds) {
  const playlist = await getPlaylist(playlistId);
  if (!playlist) throw new Error('پلی‌لیست یافت نشد.');
  const ids = [...(Array.isArray(songIds) ? songIds : [songIds])].map(String).filter(Boolean);
  const merged = [...playlist.songIds];
  for (const id of ids) {
    if (!merged.includes(id)) merged.push(id);
  }
  return updatePlaylist(playlistId, { songIds: merged.slice(0, 2000) });
}

export async function removeSongFromPlaylist(playlistId, songId) {
  const playlist = await getPlaylist(playlistId);
  if (!playlist) throw new Error('پلی‌لیست یافت نشد.');
  return updatePlaylist(playlistId, { songIds: playlist.songIds.filter((id) => id !== songId) });
}

export async function moveSongInPlaylist(playlistId, songId, direction) {
  const playlist = await getPlaylist(playlistId);
  if (!playlist) throw new Error('پلی‌لیست یافت نشد.');
  const ids = [...playlist.songIds];
  const index = ids.indexOf(songId);
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= ids.length) return playlist;
  [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];
  return updatePlaylist(playlistId, { songIds: ids });
}

/* ================================================================== */
/* آلبوم‌ها                                                             */
/* ================================================================== */

export async function createAlbum({ title = '', artist = '', year = '', description = '', songIds = [] } = {}) {
  const validation = validateAlbumDraft({ title });
  if (!validation.valid) throw new Error(validation.message);
  const created = await createToolItem(MUSIC_TOOL_NAME, normalizeAlbum({ title, artist, year, description, songIds }));
  return normalizeAlbum(created);
}

export async function updateAlbum(albumId, patch = {}) {
  const album = await getAlbum(albumId);
  if (!album) throw new Error('آلبوم یافت نشد.');
  const next = normalizeAlbum({ ...album, ...patch, id: album.id, kind: 'album' });
  const validation = validateAlbumDraft(next);
  if (!validation.valid) throw new Error(validation.message);
  const updated = await updateToolItem(MUSIC_TOOL_NAME, album.id, { ...next, updatedAt: new Date().toISOString() });
  return normalizeAlbum(updated);
}

export async function deleteAlbum(albumId) {
  await deleteToolItem(MUSIC_TOOL_NAME, albumId);
  await idbDelete(COVER_STORE, coverKeyFor('album', albumId)).catch(() => null);
  revokeCachedUrl(COVER_STORE, coverKeyFor('album', albumId));
  return true;
}

export async function addSongsToAlbum(albumId, songIds) {
  const album = await getAlbum(albumId);
  if (!album) throw new Error('آلبوم یافت نشد.');
  const ids = [...(Array.isArray(songIds) ? songIds : [songIds])].map(String).filter(Boolean);
  const merged = [...album.songIds];
  for (const id of ids) {
    if (!merged.includes(id)) merged.push(id);
  }
  return updateAlbum(albumId, { songIds: merged.slice(0, 2000) });
}

export async function removeSongFromAlbum(albumId, songId) {
  const album = await getAlbum(albumId);
  if (!album) throw new Error('آلبوم یافت نشد.');
  return updateAlbum(albumId, { songIds: album.songIds.filter((id) => id !== songId) });
}

export async function moveSongInAlbum(albumId, songId, direction) {
  const album = await getAlbum(albumId);
  if (!album) throw new Error('آلبوم یافت نشد.');
  const ids = [...album.songIds];
  const index = ids.indexOf(songId);
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= ids.length) return album;
  [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];
  return updateAlbum(albumId, { songIds: ids });
}

/* ================================================================== */
/* تاریخچه (LocalStorage — سبک و سریع)                                    */
/* ================================================================== */

function historyKey() {
  let userId = 'guest';
  try {
    userId = getAppState()?.auth?.user?.id || 'guest';
  } catch {
    /* ignore */
  }
  return `ViXoRa:music-history:${userId}`;
}

export function getHistory() {
  const list = storage.get(historyKey(), []);
  return Array.isArray(list) ? list.filter((h) => h && h.songId) : [];
}

export function pushHistory(songId) {
  if (!songId) return getHistory();
  const next = pushHistoryEntry(getHistory(), songId);
  storage.set(historyKey(), next);
  return next;
}

export function clearHistory() {
  storage.remove(historyKey());
  return [];
}

/** تاریخچه به‌همراه آبجکت آهنگ (آهنگ‌های حذف‌شده رد می‌شوند) */
export async function getHistoryWithSongs() {
  const history = getHistory();
  if (!history.length) return [];
  const songs = await listSongs().catch(() => []);
  const map = new Map(songs.map((s) => [s.id, s]));
  return history
    .map((h) => ({ ...h, song: map.get(h.songId) || null }))
    .filter((h) => h.song);
}

/* ================================================================== */
/* بکاپ (خروجی/ورودی JSON — فقط متادیتا)                                  */
/* ================================================================== */

export async function exportLibrary() {
  const [songs, playlists, albums] = await Promise.all([listSongs(), listPlaylists(), listAlbums()]);
  return {
    app: 'ViXoRa-music',
    version: 1,
    exportedAt: new Date().toISOString(),
    songs,
    playlists,
    albums,
    note: 'فایل‌های صوتی آپلودشده در بکاپ نیستند و باید دوباره الصاق شوند.',
  };
}

export async function importLibrary(payload) {
  const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
  if (!data || typeof data !== 'object') throw new Error('فایل بکاپ معتبر نیست.');

  const songs = Array.isArray(data.songs) ? data.songs : [];
  const playlists = Array.isArray(data.playlists) ? data.playlists : [];
  const albums = Array.isArray(data.albums) ? data.albums : [];

  const existingSongs = await listSongs().catch(() => []);
  const existingIds = new Set(existingSongs.map((s) => s.id));
  const idMap = new Map(); // نگاشت شناسه قدیمی → جدید (برای پلی‌لیست‌ها)

  let songCount = 0;
  for (const raw of songs.slice(0, 2000)) {
    try {
      const normalized = normalizeSong(raw || {});
      let id = normalized.id;
      if (existingIds.has(id)) {
        id = `${normalized.id}-i${Date.now().toString(36)}${Math.floor(Math.random() * 9999)}`;
      }
      idMap.set(String(raw.id), id);
      existingIds.add(id);
      await createToolItem(
        MUSIC_TOOL_NAME,
        normalizeSong({ ...normalized, id, hasBlob: normalized.source === 'link', lastPosition: 0 })
      );
      songCount += 1;
    } catch {
      /* skip broken entries */
    }
  }

  const remap = (ids) => (Array.isArray(ids) ? ids.map((id) => idMap.get(String(id)) || String(id)) : []);

  let playlistCount = 0;
  for (const raw of playlists.slice(0, 500)) {
    try {
      await createToolItem(MUSIC_TOOL_NAME, normalizePlaylist({ ...(raw || {}), songIds: remap(raw.songIds) }));
      playlistCount += 1;
    } catch {
      /* skip */
    }
  }

  let albumCount = 0;
  for (const raw of albums.slice(0, 500)) {
    try {
      await createToolItem(MUSIC_TOOL_NAME, normalizeAlbum({ ...(raw || {}), songIds: remap(raw.songIds) }));
      albumCount += 1;
    } catch {
      /* skip */
    }
  }

  return { songs: songCount, playlists: playlistCount, albums: albumCount };
}
