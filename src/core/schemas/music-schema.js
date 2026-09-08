// src/core/schemas/music-schema.js

/**
 * ViXoRa — اسکیمای موزیک پلیر
 * ==================================================================
 * بدون DOM، بدون وابستگی. مدل‌های آهنگ / پلی‌لیست / آلبوم + هلپرهای
 * خالص (فیلتر، سورت، آمار، M3U، گرادیان کاور، زمان).
 *
 * ذخیره‌سازی:
 *   - متادیتا → tools-service با toolName = 'music' (آیتم‌های kind دار)
 *   - فایل صوتی آپلودشده → IndexedDB (music-library-service)
 *   - کاورها → IndexedDB
 */

export const MUSIC_TOOL_NAME = 'music';

export const MUSIC_SOURCES = ['upload', 'link'];

export const SOURCE_LABELS = {
  upload: 'آپلود شده',
  link: 'لینکی',
};

export const MUSIC_GENRES = [
  'پاپ',
  'راک',
  'سنتی',
  'رپ و هیپ‌هاپ',
  'الکترونیک',
  'جز',
  'کلاسیک',
  'متال',
  'آراندبی',
  'محلی',
  'فیلم و سریال',
  'پادکست',
  'مذهبی',
  'کودک',
  'سایر',
];

export const MUSIC_SORTS = [
  'newest',
  'oldest',
  'title',
  'artist',
  'longest',
  'shortest',
  'mostPlayed',
  'recentlyPlayed',
  'rating',
];

export const MUSIC_SORT_LABELS = {
  newest: 'جدیدترین',
  oldest: 'قدیمی‌ترین',
  title: 'نام آهنگ (الفبا)',
  artist: 'نام خواننده (الفبا)',
  longest: 'طولانی‌ترین',
  shortest: 'کوتاه‌ترین',
  mostPlayed: 'پرپخش‌ترین',
  recentlyPlayed: 'آخرین پخش',
  rating: 'بالاترین امتیاز',
};

export const REPEAT_MODES = ['off', 'all', 'one'];

export const REPEAT_LABELS = {
  off: 'تکرار خاموش',
  all: 'تکرار همه',
  one: 'تکرار همین آهنگ',
};

export const PLAYER_THEMES = ['neon', 'midnight', 'sunset', 'emerald'];

export const PLAYER_THEME_LABELS = {
  neon: 'نئون',
  midnight: 'نیمه‌شب',
  sunset: 'غروب',
  emerald: 'زمردی',
};

export const EQ_BAND_LABELS = ['۶۰Hz', '۲۳۰Hz', '۹۱۰Hz', '۳٫۶KHz', '۱۴KHz'];

export const EQ_PRESETS = {
  flat: { label: 'تخت (خاموش)', bands: [0, 0, 0, 0, 0] },
  pop: { label: 'پاپ', bands: [-1, 2, 4, 3, 1] },
  rock: { label: 'راک', bands: [5, 3, -1, 3, 5] },
  jazz: { label: 'جز', bands: [3, 2, 1, 3, 4] },
  classical: { label: 'کلاسیک', bands: [4, 3, 0, 3, 5] },
  bass: { label: 'تقویت بیس', bands: [7, 5, 1, -1, 0] },
  vocal: { label: 'وکال', bands: [-2, -1, 3, 4, 2] },
  electronic: { label: 'الکترونیک', bands: [5, 3, 0, 2, 5] },
};

export const SLEEP_OPTIONS = [
  { value: 0, label: 'خاموش' },
  { value: 5, label: '۵ دقیقه' },
  { value: 10, label: '۱۰ دقیقه' },
  { value: 15, label: '۱۵ دقیقه' },
  { value: 30, label: '۳۰ دقیقه' },
  { value: 60, label: '۱ ساعت' },
  { value: 'track', label: 'پایان همین آهنگ' },
];

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const AUDIO_EXTENSIONS = [
  'mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'weba', 'webm', 'mp4',
];

const MAX_HISTORY_ITEMS = 200;

/* ================================================================== */
/* شناسه و ابزارهای رشته                                                */
/* ================================================================== */

export function createId(prefix = 'mx') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isAudioUrl(value) {
  if (!isHttpUrl(value)) return false;
  const clean = String(value).split('?')[0].split('#')[0].toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => clean.endsWith(`.${ext}`));
}

export function looksLikeStreamUrl(value) {
  if (!isHttpUrl(value)) return false;
  return /(\.mp3|\.m4a|\.aac|\.ogg|\.opus|\.wav|\.flac|stream|audio|listen|play|media|track|download)(\?|#|$|\/)/i.test(
    String(value)
  );
}

/** حدس عنوان از روی لینک: دیکد، حذف پسوند، تمیزکاری */
export function guessTitleFromUrl(url) {
  try {
    const pathname = new URL(String(url)).pathname;
    let base = pathname.split('/').filter(Boolean).pop() || 'آهنگ بدون نام';
    try {
      base = decodeURIComponent(base);
    } catch {
      /* ignore */
    }
    base = base.replace(/\.[a-z0-9]{2,5}$/i, '');
    base = base.replace(/^[\d\s._-]+/, '');
    base = base.replace(/[._-]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    return base || 'آهنگ بدون نام';
  } catch {
    return 'آهنگ بدون نام';
  }
}

/** پارس فایل/متن M3U/M3U8 → [{ title, url }] */
export function parseM3U(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const items = [];
  let pendingTitle = '';
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const comma = line.indexOf(',');
      pendingTitle = comma >= 0 ? line.slice(comma + 1).trim() : '';
      continue;
    }
    if (line.startsWith('#')) continue;
    if (!isHttpUrl(line)) {
      pendingTitle = '';
      continue;
    }
    items.push({ title: pendingTitle || guessTitleFromUrl(line), url: line });
    pendingTitle = '';
    if (items.length >= 500) break;
  }
  return items;
}

/* ================================================================== */
/* نرمال‌سازی مدل‌ها                                                   */
/* ================================================================== */

function toNonEmptyString(value, fallback = '') {
  const str = String(value ?? '').trim();
  return str || fallback;
}

function toFiniteNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function normalizeSong(raw = {}) {
  const now = new Date().toISOString();
  const source = raw.source === 'link' ? 'link' : 'upload';
  return {
    id: toNonEmptyString(raw.id, createId('song')),
    kind: 'song',
    title: toNonEmptyString(raw.title, 'آهنگ بدون نام'),
    artist: toNonEmptyString(raw.artist, 'خواننده ناشناس'),
    album: toNonEmptyString(raw.album, ''),
    genre: MUSIC_GENRES.includes(raw.genre) ? raw.genre : 'سایر',
    year: /^\d{4}$/.test(String(raw.year || '')) ? String(raw.year) : '',
    trackNo: toFiniteNumber(raw.trackNo, 0) > 0 ? Math.floor(toFiniteNumber(raw.trackNo, 0)) : 0,
    duration: Math.max(0, toFiniteNumber(raw.duration, 0)),
    source,
    url: source === 'link' ? toNonEmptyString(raw.url, '') : '',
    fileName: toNonEmptyString(raw.fileName, ''),
    fileSize: Math.max(0, toFiniteNumber(raw.fileSize, 0)),
    mime: toNonEmptyString(raw.mime, ''),
    hasCover: raw.hasCover === true,
    hasBlob: raw.hasBlob !== false,
    liked: raw.liked === true,
    rating: Math.min(5, Math.max(0, Math.floor(toFiniteNumber(raw.rating, 0)))),
    playCount: Math.max(0, Math.floor(toFiniteNumber(raw.playCount, 0))),
    listenedSeconds: Math.max(0, Math.floor(toFiniteNumber(raw.listenedSeconds, 0))),
    lastPlayedAt: toNonEmptyString(raw.lastPlayedAt, ''),
    lastPosition: Math.max(0, toFiniteNumber(raw.lastPosition, 0)),
    lyrics: typeof raw.lyrics === 'string' ? raw.lyrics.slice(0, 20000) : '',
    createdAt: toNonEmptyString(raw.createdAt, now),
    updatedAt: toNonEmptyString(raw.updatedAt, now),
  };
}

export function createEmptySong(source = 'link') {
  return normalizeSong({ source, createdAt: new Date().toISOString() });
}

export function validateSongDraft(draft = {}) {
  const title = String(draft.title || '').trim();
  if (!title) return { valid: false, message: 'نام آهنگ را وارد کنید.' };
  if (title.length > 200) return { valid: false, message: 'نام آهنگ خیلی طولانی است.' };
  if (draft.source === 'link' && !isHttpUrl(draft.url || '')) {
    return { valid: false, message: 'لینک معتبر وارد کنید (با http یا https شروع شود).' };
  }
  if (draft.year && !/^\d{4}$/.test(String(draft.year).trim())) {
    return { valid: false, message: 'سال باید ۴ رقم باشد (مثل ۱۴۰۳ یا 2024).' };
  }
  return { valid: true };
}

export function normalizePlaylist(raw = {}) {
  const now = new Date().toISOString();
  return {
    id: toNonEmptyString(raw.id, createId('pl')),
    kind: 'playlist',
    title: toNonEmptyString(raw.title, 'پلی‌لیست بدون نام'),
    description: toNonEmptyString(raw.description, '').slice(0, 500),
    hasCover: raw.hasCover === true,
    songIds: Array.isArray(raw.songIds)
      ? [...new Set(raw.songIds.map((id) => String(id)).filter(Boolean))].slice(0, 2000)
      : [],
    createdAt: toNonEmptyString(raw.createdAt, now),
    updatedAt: toNonEmptyString(raw.updatedAt, now),
  };
}

export function createEmptyPlaylist() {
  return normalizePlaylist({});
}

export function validatePlaylistDraft(draft = {}) {
  const title = String(draft.title || '').trim();
  if (!title) return { valid: false, message: 'نام پلی‌لیست را وارد کنید.' };
  if (title.length > 120) return { valid: false, message: 'نام پلی‌لیست خیلی طولانی است.' };
  return { valid: true };
}

export function normalizeAlbum(raw = {}) {
  const now = new Date().toISOString();
  return {
    id: toNonEmptyString(raw.id, createId('alb')),
    kind: 'album',
    title: toNonEmptyString(raw.title, 'آلبوم بدون نام'),
    artist: toNonEmptyString(raw.artist, ''),
    year: /^\d{4}$/.test(String(raw.year || '')) ? String(raw.year) : '',
    description: toNonEmptyString(raw.description, '').slice(0, 500),
    hasCover: raw.hasCover === true,
    songIds: Array.isArray(raw.songIds)
      ? [...new Set(raw.songIds.map((id) => String(id)).filter(Boolean))].slice(0, 2000)
      : [],
    createdAt: toNonEmptyString(raw.createdAt, now),
    updatedAt: toNonEmptyString(raw.updatedAt, now),
  };
}

export function createEmptyAlbum() {
  return normalizeAlbum({});
}

export function validateAlbumDraft(draft = {}) {
  const title = String(draft.title || '').trim();
  if (!title) return { valid: false, message: 'نام آلبوم را وارد کنید.' };
  if (title.length > 120) return { valid: false, message: 'نام آلبوم خیلی طولانی است.' };
  return { valid: true };
}

/* ================================================================== */
/* فیلتر و سورت                                                         */
/* ================================================================== */

export function songMatchesQuery(song, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const hay = [song.title, song.artist, song.album, song.genre, song.fileName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((word) => hay.includes(word));
}

export function filterSongs(songs, options = {}) {
  const { query = '', source = 'all', genre = 'all', likedOnly = false, minRating = 0 } = options;
  return (Array.isArray(songs) ? songs : []).filter((song) => {
    if (source !== 'all' && song.source !== source) return false;
    if (genre !== 'all' && song.genre !== genre) return false;
    if (likedOnly && !song.liked) return false;
    if (minRating > 0 && (song.rating || 0) < minRating) return false;
    return songMatchesQuery(song, query);
  });
}

const collator = { compare: (a, b) => String(a || '').localeCompare(String(b || ''), 'fa') };

export function sortSongs(songs, sortKey = 'newest') {
  const list = [...(Array.isArray(songs) ? songs : [])];
  switch (sortKey) {
    case 'oldest':
      return list.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    case 'title':
      return list.sort((a, b) => collator.compare(a.title, b.title));
    case 'artist':
      return list.sort(
        (a, b) => collator.compare(a.artist, b.artist) || collator.compare(a.title, b.title)
      );
    case 'longest':
      return list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    case 'shortest':
      return list.sort((a, b) => (a.duration || 0) - (b.duration || 0));
    case 'mostPlayed':
      return list.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    case 'recentlyPlayed':
      return list.sort((a, b) => String(b.lastPlayedAt || '').localeCompare(String(a.lastPlayedAt || '')));
    case 'rating':
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.playCount || 0) - (a.playCount || 0));
    case 'newest':
    default:
      return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
}

/* ================================================================== */
/* آمار و پلی‌لیست‌های هوشمند                                           */
/* ================================================================== */

export function getMusicStats(songs) {
  const list = Array.isArray(songs) ? songs : [];
  const artistMap = new Map();
  const genreMap = new Map();
  let totalPlays = 0;
  let listenedSeconds = 0;
  let liked = 0;
  let uploads = 0;
  let links = 0;

  for (const song of list) {
    totalPlays += song.playCount || 0;
    listenedSeconds += song.listenedSeconds || 0;
    if (song.liked) liked += 1;
    if (song.source === 'upload') uploads += 1;
    else links += 1;

    const artist = song.artist || 'خواننده ناشناس';
    const entry = artistMap.get(artist) || { name: artist, tracks: 0, plays: 0, seconds: 0 };
    entry.tracks += 1;
    entry.plays += song.playCount || 0;
    entry.seconds += song.listenedSeconds || 0;
    artistMap.set(artist, entry);

    const genre = song.genre || 'سایر';
    genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
  }

  const topArtists = [...artistMap.values()]
    .sort((a, b) => b.plays - a.plays || b.tracks - a.tracks)
    .slice(0, 5);
  const topTracks = [...list].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 5);
  const genres = [...genreMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: list.length,
    uploads,
    links,
    liked,
    totalPlays,
    listenedSeconds,
    topArtists,
    topTracks,
    genres,
  };
}

/** پلی‌لیست‌های هوشمند محاسباتی (ذخیره نمی‌شوند) */
export function buildSmartPlaylists(songs) {
  const list = Array.isArray(songs) ? songs : [];
  const monthAgo = Date.now() - 30 * 24 * 3600 * 1000;

  const liked = list.filter((s) => s.liked);
  const fresh = list
    .filter((s) => Date.parse(s.createdAt || '') >= monthAgo)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const hot = list
    .filter((s) => (s.playCount || 0) > 0)
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
    .slice(0, 50);
  const topRated = list
    .filter((s) => (s.rating || 0) >= 4)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return [
    { id: 'smart:liked', title: '❤️ علاقه‌مندی‌ها', description: 'آهنگ‌هایی که قلب گرفتی', smart: true, songIds: liked.map((s) => s.id) },
    { id: 'smart:fresh', title: '🆕 تازه‌های این ماه', description: '۳۰ روز اخیر', smart: true, songIds: fresh.map((s) => s.id) },
    { id: 'smart:hot', title: '🔥 پرپخش‌ترین‌ها', description: 'بیشترین تعداد پخش', smart: true, songIds: hot.map((s) => s.id) },
    { id: 'smart:rated', title: '⭐ امتیازهای بالا', description: '۴ ستاره و بیشتر', smart: true, songIds: topRated.map((s) => s.id) },
  ];
}

/* ================================================================== */
/* تاریخچه                                                             */
/* ================================================================== */

export function pushHistoryEntry(history, songId) {
  const list = Array.isArray(history) ? history.filter((h) => h && h.songId !== songId) : [];
  list.unshift({ songId: String(songId), at: new Date().toISOString() });
  return list.slice(0, MAX_HISTORY_ITEMS);
}

/* ================================================================== */
/* نمایش زمان و متن                                                     */
/* ================================================================== */

export function formatTime(totalSeconds) {
  const sec = Math.floor(Number(totalSeconds));
  if (!Number.isFinite(sec) || sec < 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatLongDuration(totalSeconds) {
  const sec = Math.floor(Number(totalSeconds) || 0);
  if (sec < 60) return `${sec} ثانیه`;
  if (sec < 3600) return `${Math.floor(sec / 60)} دقیقه`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return m > 0 ? `${h} ساعت و ${m} دقیقه` : `${h} ساعت`;
}

export function timeAgo(isoDate) {
  const ts = Date.parse(isoDate || '');
  if (!ts) return 'هرگز';
  const diff = Date.now() - ts;
  if (diff < 60 * 1000) return 'لحظاتی پیش';
  if (diff < 3600 * 1000) return `${Math.floor(diff / 60000)} دقیقه پیش`;
  if (diff < 24 * 3600 * 1000) return `${Math.floor(diff / 3600000)} ساعت پیش`;
  if (diff < 30 * 24 * 3600 * 1000) return `${Math.floor(diff / 86400000)} روز پیش`;
  return `${Math.floor(diff / (30 * 86400000))} ماه پیش`;
}

/** رقم فارسی برای نمایش */
export function faDigits(value) {
  return String(value ?? '').replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

/* ================================================================== */
/* کاور پیش‌فرض (گرادیان قطعی از روی شناسه)                              */
/* ================================================================== */

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#7c3aed,#db2777)',
  'linear-gradient(135deg,#0891b2,#22d3ee)',
  'linear-gradient(135deg,#ea580c,#facc15)',
  'linear-gradient(135deg,#059669,#34d399)',
  'linear-gradient(135deg,#dc2626,#f97316)',
  'linear-gradient(135deg,#4f46e5,#06b6d4)',
  'linear-gradient(135deg,#be185d,#8b5cf6)',
  'linear-gradient(135deg,#0d9488,#84cc16)',
  'linear-gradient(135deg,#1d4ed8,#e879f9)',
  'linear-gradient(135deg,#b45309,#ef4444)',
  'linear-gradient(135deg,#0f766e,#38bdf8)',
  'linear-gradient(135deg,#6d28d9,#f472b6)',
];

export function gradientFor(seed) {
  const str = String(seed || 'x');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
}

export function initialOf(text) {
  const t = String(text || '').trim();
  return t ? t[0] : '♪';
}
