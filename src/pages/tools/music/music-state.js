// src/pages/tools/music/music-state.js

/**
 * ViXoRa Music Page — state داخلی صفحه
 * (وضعیت پخش واقعی در music-player-service است؛ این فایل فقط UI صفحه.)
 */

import { createLocalStorageAdapter } from '../../../utilities/storage.js';

const storage = createLocalStorageAdapter();
const UI_KEY = 'ViXoRa:music-ui';

export const MUSIC_TABS = [
  { id: 'now', label: 'در حال پخش', icon: '🎧' },
  { id: 'songs', label: 'آهنگ‌ها', icon: '🎵' },
  { id: 'playlists', label: 'پلی‌لیست‌ها', icon: '📝' },
  { id: 'albums', label: 'آلبوم‌ها', icon: '💿' },
  { id: 'queue', label: 'صف پخش', icon: '⏭️' },
  { id: 'history', label: 'تاریخچه', icon: '🕘' },
  { id: 'stats', label: 'آمار', icon: '📊' },
];

export function createDefaultUiState() {
  return {
    tab: 'now',
    query: '',
    sort: 'newest',
    filterSource: 'all',
    filterGenre: 'all',
    likedOnly: false,
    selectedPlaylistId: null,
    selectedAlbumId: null,
    immersive: false,
  };
}

export function loadPersistedMusicUi() {
  const defaults = createDefaultUiState();
  const saved = storage.get(UI_KEY, {});
  return {
    ...defaults,
    ...(saved || {}),
    query: '',
    selectedPlaylistId: null,
    selectedAlbumId: null,
    immersive: false,
  };
}

export function persistMusicUi(patch = {}) {
  const current = loadPersistedMusicUi();
  const next = { ...current, ...patch };
  storage.set(UI_KEY, {
    tab: next.tab,
    sort: next.sort,
    filterSource: next.filterSource,
    filterGenre: next.filterGenre,
    likedOnly: next.likedOnly,
  });
  return next;
}
