// src/pages/tools/music/music-renderers.js

/**
 * ViXoRa Music Page — رندررهای خالص (HTML string)
 * کاورها بعد از رندر توسط music.js هایدریت می‌شوند (data-cover).
 */

import { escapeHtml } from '../../../utilities/dom-utils.js';
import {
  MUSIC_SORT_LABELS,
  MUSIC_SORTS,
  MUSIC_GENRES,
  REPEAT_LABELS,
  PLAYER_THEME_LABELS,
  PLAYER_THEMES,
  SLEEP_OPTIONS,
  formatTime,
  formatLongDuration,
  timeAgo,
  faDigits,
  gradientFor,
  initialOf,
} from '../../../core/schemas/music-schema.js';
import { MUSIC_TABS } from './music-state.js';

function esc(value) {
  return escapeHtml(value);
}

/* ================================================================== */
/* اجزای کوچک                                                           */
/* ================================================================== */

export function coverHtml(ownerType, owner, cls = '') {
  const id = owner?.id || 'x';
  const title = owner?.title || '';
  return `<div class="mx-cover ${cls}" data-cover="${ownerType}:${esc(id)}" style="background:${gradientFor(id)}" title="${esc(title)}"><span>${esc(initialOf(title))}</span></div>`;
}

export function marqueeHtml(text) {
  const safe = esc(text || '—');
  return `<span class="mx-marquee"><span class="mx-marquee__track"><span>${safe}</span><span aria-hidden="true">${safe}</span></span></span>`;
}

export function eqMiniHtml() {
  return `<span class="mx-eqmini" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
}

export function emptyStateHtml(icon, title, hint, action = null) {
  return `
    <div class="mx-empty">
      <div class="mx-empty__icon">${icon}</div>
      <div class="mx-empty__title">${esc(title)}</div>
      <div class="mx-empty__hint">${esc(hint)}</div>
      ${action ? `<button class="mx-btn mx-btn--primary" data-action="${action.action}" ${action.args || ''}>${esc(action.label)}</button>` : ''}
    </div>
  `;
}

export function starsHtml(rating) {
  const r = Math.min(5, Math.max(0, Number(rating) || 0));
  let out = '';
  for (let i = 1; i <= 5; i += 1) {
    out += `<span class="${i <= r ? 'on' : ''}">★</span>`;
  }
  return `<span class="mx-stars" title="${faDigits(r)} از ۵">${out}</span>`;
}

/* ================================================================== */
/* پوسته صفحه                                                            */
/* ================================================================== */

export function renderShell(ui, theme) {
  return `
  <div class="mx-root" data-music-theme="${esc(theme || 'neon')}" dir="rtl">
    <div class="mx-bg" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="mx-drop" data-mx="drop" hidden>
      <div class="mx-drop__box">🎵<b>فایل‌ها را همین‌جا رها کن</b><span>آهنگ‌ها به کتابخانه اضافه می‌شوند</span><button class="mx-drop__close" data-action="drop-cancel">✕ انصراف</button></div>
    </div>
    <header class="mx-head" data-mx="header"></header>
    <nav class="mx-tabs" data-mx="tabs"></nav>
    <main class="mx-content" data-mx="content"></main>
    <footer class="mx-bar" data-mx="bar"></footer>
    <input type="file" data-mx="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus,.weba,.mp4" multiple hidden />
    <input type="file" data-mx="m3ufile" accept=".m3u,.m3u8" hidden />
    <input type="file" data-mx="backupfile" accept="application/json,.json" hidden />
  </div>
  `;
}

export function renderHeader(stats) {
  return `
    <div class="mx-head__brand">
      <div class="mx-logo">🎵</div>
      <div>
        <h1 class="mx-head__title">موزیک پلیر <span class="mx-head__badge">ViXoRa</span></h1>
        <p class="mx-head__sub">${faDigits(stats.total)} آهنگ • ${faDigits(stats.uploads)} آپلود • ${faDigits(stats.links)} لینک • ${faDigits(stats.totalPlays)} پخش</p>
      </div>
    </div>
    <div class="mx-head__actions">
      <button class="mx-btn mx-btn--primary" data-action="add-link">🔗 افزودن لینک</button>
      <button class="mx-btn" data-action="upload">📤 آپلود آهنگ</button>
      <button class="mx-btn mx-btn--icon" data-action="import-m3u" title="ایمپورت لیست M3U">📋</button>
      <button class="mx-btn mx-btn--icon" data-action="backup" title="بکاپ / بازیابی">💾</button>
      <button class="mx-btn mx-btn--icon" data-action="immersive" title="حالت فراگیر">🖥️</button>
    </div>
  `;
}

export function renderTabs(ui, counts) {
  const badges = {
    songs: counts.songs,
    playlists: counts.playlists,
    albums: counts.albums,
    queue: counts.queue,
    history: counts.history,
  };
  return MUSIC_TABS.map(
    (t) => `
    <button class="mx-tab ${ui.tab === t.id ? 'is-active' : ''}" data-action="tab" data-tab="${t.id}">
      <span class="mx-tab__icon">${t.icon}</span><span>${t.label}</span>
      ${badges[t.id] ? `<span class="mx-tab__badge">${faDigits(badges[t.id])}</span>` : ''}
    </button>
  `
  ).join('');
}

/* ================================================================== */
/* نمای «در حال پخش»                                                      */
/* ================================================================== */

export function renderNow(song, snap) {
  if (!song) {
    return emptyStateHtml('🎧', 'چیزی در حال پخش نیست', 'از تب آهنگ‌ها یک موزیک انتخاب کن، یا لینک/فایل اضافه کن.', {
      action: 'tab',
      args: 'data-tab="songs"',
      label: 'رفتن به آهنگ‌ها',
    });
  }
  const playing = snap.status === 'playing';
  const lyrics = String(song.lyrics || '').trim();

  return `
  <div class="mx-now">
    <div class="mx-now__stage">
      <div class="mx-vinylwrap ${playing ? 'is-playing' : ''}">
        <div class="mx-tonearm"><i></i></div>
        <div class="mx-vinyl">
          <div class="mx-vinyl__disc"></div>
          <div class="mx-vinyl__label" data-cover="song:${esc(song.id)}" style="background:${gradientFor(song.id)}">
            <span>${esc(initialOf(song.title))}</span>
          </div>
        </div>
        <div class="mx-vinyl__glow"></div>
      </div>
      <div class="mx-now__visual">
        <canvas class="mx-visual" data-mx="visual" height="120"></canvas>
        <div class="mx-now__live">${snap.liveAnalysis ? '🟢 تحلیل زنده صدا' : '🌊 نمایش شبیه‌سازی‌شده (لینک خارجی)'}</div>
      </div>
    </div>
    <div class="mx-now__info">
      <div class="mx-now__kicker">${esc(snap.contextLabel || 'ViXoRa Music')}</div>
      <h2 class="mx-now__title">${marqueeHtml(song.title)}</h2>
      <div class="mx-now__artist">${esc(song.artist)}${song.album ? ` • ${esc(song.album)}` : ''}</div>
      <div class="mx-now__chips">
        <span class="mx-chip">${song.source === 'link' ? '🔗 لینکی' : '📤 آپلود شده'}</span>
        <span class="mx-chip">🎼 ${esc(song.genre || 'سایر')}</span>
        ${song.year ? `<span class="mx-chip">📅 ${faDigits(song.year)}</span>` : ''}
        <span class="mx-chip">▶ ${faDigits(song.playCount || 0)} پخش</span>
        ${song.rating ? `<span class="mx-chip">${starsHtml(song.rating)}</span>` : ''}
      </div>
      <div class="mx-now__row">
        <button class="mx-btn ${song.liked ? 'mx-btn--liked' : ''}" data-action="like" data-id="${esc(song.id)}">${song.liked ? '❤️ علاقه‌مندی شد' : '🤍 افزودن به علاقه‌مندی‌ها'}</button>
        <button class="mx-btn" data-action="song-edit" data-id="${esc(song.id)}">✏️ ویرایش</button>
        <button class="mx-btn" data-action="song-share" data-id="${esc(song.id)}">🔗 اشتراک</button>
        <button class="mx-btn" data-action="song-download" data-id="${esc(song.id)}">⬇️ دانلود</button>
      </div>
      <div class="mx-lyrics">
        <div class="mx-lyrics__head"><b>📝 متن آهنگ</b><button class="mx-link" data-action="lyrics-edit" data-id="${esc(song.id)}">ویرایش متن</button></div>
        <div class="mx-lyrics__body">${lyrics ? esc(lyrics).replace(/\n/g, '<br>') : '<span class="mx-dim">هنوز متنی ثبت نشده. با «ویرایش متن» اضافه کن.</span>'}</div>
      </div>
    </div>
  </div>
  `;
}

/* ================================================================== */
/* آهنگ‌ها                                                               */
/* ================================================================== */

export function renderSongsToolbar(ui, genresInUse) {
  const sortOptions = MUSIC_SORTS.map(
    (k) => `<option value="${k}" ${ui.sort === k ? 'selected' : ''}>${MUSIC_SORT_LABELS[k]}</option>`
  ).join('');
  const genreOptions = ['all', ...MUSIC_GENRES.filter((g) => genresInUse.has(g))]
    .map((g) => `<option value="${esc(g)}" ${ui.filterGenre === g ? 'selected' : ''}>${g === 'all' ? 'همه سبک‌ها' : esc(g)}</option>`)
    .join('');

  return `
  <div class="mx-toolbar">
    <div class="mx-search"><span>🔍</span><input type="search" data-mx="q" placeholder="جست‌وجو در نام، خواننده، آلبوم..." value="${esc(ui.query)}" /></div>
    <select class="mx-select" data-mx="sort" title="مرتب‌سازی">${sortOptions}</select>
    <select class="mx-select" data-mx="genre" title="سبک">${genreOptions}</select>
    <div class="mx-seg" role="tablist">
      ${[['all', 'همه'], ['upload', '📤 آپلودها'], ['link', '🔗 لینک‌ها']]
        .map(([v, l]) => `<button class="mx-seg__btn ${ui.filterSource === v ? 'is-active' : ''}" data-action="filter-source" data-v="${v}">${l}</button>`)
        .join('')}
    </div>
    <button class="mx-btn mx-btn--sm ${ui.likedOnly ? 'mx-btn--liked' : ''}" data-action="filter-liked">${ui.likedOnly ? '❤️ فقط علاقه‌مندی‌ها ✓' : '🤍 علاقه‌مندی‌ها'}</button>
  </div>
  <div class="mx-bulkrow">
    <button class="mx-btn mx-btn--sm mx-btn--primary" data-action="play-all">▶ پخش همه</button>
    <button class="mx-btn mx-btn--sm" data-action="surprise">🎲 سورپرایزم کن</button>
    <span class="mx-dim mx-bulkrow__count" data-mx="count"></span>
  </div>
  `;
}

export function renderSongRow(song, { playing = false, current = false, index = 0, context = 'songs', extra = '' } = {}) {
  const missing = song.source === 'upload' && song.hasBlob === false;
  return `
  <div class="mx-row ${current ? 'is-current' : ''} ${missing ? 'is-missing' : ''}" data-song-row="${esc(song.id)}" data-action="play-song" data-id="${esc(song.id)}" data-context="${esc(context)}">
    <div class="mx-row__idx">${current && playing ? eqMiniHtml() : `<span>${faDigits(index + 1)}</span>`}</div>
    ${coverHtml('song', song, 'mx-row__cover')}
    <div class="mx-row__meta">
      <div class="mx-row__title">${esc(song.title)} ${missing ? '<span class="mx-warn">⚠️ نیاز به فایل مجدد</span>' : ''}</div>
      <div class="mx-row__sub">${esc(song.artist)}${song.album ? ` • ${esc(song.album)}` : ''} • ${faDigits(formatTime(song.duration))}</div>
    </div>
    <div class="mx-row__tags">
      <span class="mx-mini">${song.source === 'link' ? '🔗' : '📤'}</span>
      ${song.liked ? '<span class="mx-mini">❤️</span>' : ''}
      ${(song.rating || 0) > 0 ? `<span class="mx-mini">★${faDigits(song.rating)}</span>` : ''}
      ${(song.playCount || 0) > 0 ? `<span class="mx-mini">▶${faDigits(song.playCount)}</span>` : ''}
    </div>
    <div class="mx-row__ops">
      ${extra}
      <button class="mx-iconbtn" data-action="like" data-id="${esc(song.id)}" title="علاقه‌مندی">${song.liked ? '❤️' : '🤍'}</button>
      <button class="mx-iconbtn" data-action="song-menu" data-id="${esc(song.id)}" title="گزینه‌ها">⋯</button>
    </div>
  </div>
  `;
}

export function renderSongsList(songs, ui, snap, context = 'songs') {
  if (!songs.length) {
    return emptyStateHtml(
      '🎵',
      ui.query || ui.likedOnly || ui.filterSource !== 'all' ? 'چیزی پیدا نشد' : 'هنوز آهنگی نداری',
      ui.query ? 'فیلترها را عوض کن یا عبارت دیگری را جست‌وجو کن.' : 'اولین آهنگت را با لینک یا آپلود اضافه کن.',
      ui.query ? null : { action: 'add-link', label: '🔗 افزودن اولین آهنگ با لینک' }
    );
  }
  return `<div class="mx-rows">${songs
    .map((s, i) =>
      renderSongRow(s, {
        playing: snap.status === 'playing',
        current: snap.song?.id === s.id,
        index: i,
        context,
      })
    )
    .join('')}</div>`;
}

/* ================================================================== */
/* پلی‌لیست‌ها                                                           */
/* ================================================================== */

export function renderCollectionCard(item, { type = 'playlist', count = 0 } = {}) {
  const action = type === 'playlist' ? 'open-playlist' : 'open-album';
  return `
  <button class="mx-card" data-action="${action}" data-id="${esc(item.id)}">
    <div class="mx-card__cover">
      ${item.smart ? `<div class="mx-cover mx-cover--lg" style="background:${gradientFor(item.id)}"><span style="font-size:30px">${esc((item.title || ' ').trim()[0] || '♪')}</span></div>` : coverHtml(type, item, 'mx-cover--lg')}
      <span class="mx-card__count">${faDigits(count)} آهنگ</span>
    </div>
    <div class="mx-card__title">${esc(item.title)}</div>
    <div class="mx-card__sub">${esc(item.description || (item.smart ? 'هوشمند • خودکار' : type === 'album' ? item.artist || 'آلبوم' : 'پلی‌لیست'))}</div>
  </button>
  `;
}

export function renderPlaylistsView(playlists, smart, songMap) {
  const smartCards = smart
    .map((s) => renderCollectionCard(s, { type: 'playlist', count: s.songIds.filter((id) => songMap.has(id)).length }))
    .join('');
  const userCards = playlists.length
    ? playlists.map((p) => renderCollectionCard(p, { type: 'playlist', count: p.songIds.filter((id) => songMap.has(id)).length })).join('')
    : `<div class="mx-dim" style="padding:8px">هنوز پلی‌لیست نساختی.</div>`;

  return `
    <div class="mx-secbar">
      <h3>✨ هوشمند (خودکار)</h3>
    </div>
    <div class="mx-cards">${smartCards}</div>
    <div class="mx-secbar">
      <h3>📝 پلی‌لیست‌های من</h3>
      <button class="mx-btn mx-btn--sm mx-btn--primary" data-action="create-playlist">➕ ساخت پلی‌لیست</button>
    </div>
    <div class="mx-cards">${userCards}</div>
  `;
}

export function renderPlaylistDetail(pl, songs, ui, snap, isSmart) {
  const rows = songs.length
    ? songs
        .map((s, i) =>
          renderSongRow(s, {
            playing: snap.status === 'playing',
            current: snap.song?.id === s.id,
            index: i,
            context: `playlist:${pl.id}`,
            extra: !isSmart
              ? `<button class="mx-iconbtn" data-action="pl-move-up" data-id="${esc(s.id)}" data-pl="${esc(pl.id)}" title="بالا">▲</button>
                 <button class="mx-iconbtn" data-action="pl-move-down" data-id="${esc(s.id)}" data-pl="${esc(pl.id)}" title="پایین">▼</button>
                 <button class="mx-iconbtn" data-action="pl-remove" data-id="${esc(s.id)}" data-pl="${esc(pl.id)}" title="حذف از پلی‌لیست">🗑️</button>`
              : '',
          })
        )
        .join('')
    : emptyStateHtml('📝', 'این پلی‌لیست خالی است', isSmart ? 'شرایط هوشمند هنوز آهنگی را شامل نشده.' : 'با دکمه «افزودن آهنگ» موزیک اضافه کن.');

  return `
  <button class="mx-back" data-action="back-collections">→ بازگشت به پلی‌لیست‌ها</button>
  <div class="mx-detail">
    <div class="mx-detail__cover">${isSmart ? `<div class="mx-cover mx-cover--xl" style="background:${gradientFor(pl.id)}"><span style="font-size:44px">✨</span></div>` : coverHtml('playlist', pl, 'mx-cover--xl')}</div>
    <div class="mx-detail__meta">
      <h2>${esc(pl.title)}</h2>
      <p class="mx-dim">${esc(pl.description || (isSmart ? 'پلی‌لیست هوشمند و خودکار' : 'بدون توضیح'))}</p>
      <p class="mx-dim">${faDigits(songs.length)} آهنگ${songs.length ? ` • ${faDigits(formatLongDuration(songs.reduce((a, s) => a + (s.duration || 0), 0)))}` : ''}</p>
      <div class="mx-now__row">
        <button class="mx-btn mx-btn--primary" data-action="play-collection" data-id="${esc(pl.id)}" data-kind="playlist">▶ پخش</button>
        <button class="mx-btn" data-action="shuffle-collection" data-id="${esc(pl.id)}" data-kind="playlist">🔀 شافل</button>
        ${
          isSmart
            ? ''
            : `<button class="mx-btn" data-action="pl-add-songs" data-id="${esc(pl.id)}">➕ افزودن آهنگ</button>
               <button class="mx-btn" data-action="pl-cover" data-id="${esc(pl.id)}">🖼️ کاور</button>
               <button class="mx-btn" data-action="pl-rename" data-id="${esc(pl.id)}">✏️ ویرایش</button>
               <button class="mx-btn mx-btn--danger" data-action="pl-delete" data-id="${esc(pl.id)}">🗑️ حذف</button>`
        }
      </div>
    </div>
  </div>
  <div class="mx-rows">${rows}</div>
  `;
}

/* ================================================================== */
/* آلبوم‌ها                                                              */
/* ================================================================== */

export function renderAlbumsView(albums, songMap) {
  const cards = albums.length
    ? albums.map((a) => renderCollectionCard(a, { type: 'album', count: a.songIds.filter((id) => songMap.has(id)).length })).join('')
    : emptyStateHtml('💿', 'هنوز آلبومی نساختی', 'از آهنگ‌های کتابخانه‌ات آلبوم بساز.', { action: 'create-album', label: '➕ ساخت آلبوم' });

  return `
    <div class="mx-secbar">
      <h3>💿 آلبوم‌های من</h3>
      ${albums.length ? '<button class="mx-btn mx-btn--sm mx-btn--primary" data-action="create-album">➕ ساخت آلبوم</button>' : ''}
    </div>
    <div class="mx-cards">${albums.length ? cards : ''}</div>
    ${albums.length ? '' : cards}
  `;
}

export function renderAlbumDetail(album, songs, ui, snap) {
  const rows = songs.length
    ? songs
        .map((s, i) =>
          renderSongRow(s, {
            playing: snap.status === 'playing',
            current: snap.song?.id === s.id,
            index: i,
            context: `album:${album.id}`,
            extra: `<button class="mx-iconbtn" data-action="alb-move-up" data-id="${esc(s.id)}" data-alb="${esc(album.id)}" title="بالا">▲</button>
               <button class="mx-iconbtn" data-action="alb-move-down" data-id="${esc(s.id)}" data-alb="${esc(album.id)}" title="پایین">▼</button>
               <button class="mx-iconbtn" data-action="alb-remove" data-id="${esc(s.id)}" data-alb="${esc(album.id)}" title="حذف از آلبوم">🗑️</button>`,
          })
        )
        .join('')
    : emptyStateHtml('💿', 'این آلبوم خالی است', 'با دکمه «افزودن آهنگ» موزیک اضافه کن.');

  return `
  <button class="mx-back" data-action="back-collections">→ بازگشت به آلبوم‌ها</button>
  <div class="mx-detail">
    <div class="mx-detail__cover">${coverHtml('album', album, 'mx-cover--xl')}</div>
    <div class="mx-detail__meta">
      <h2>${esc(album.title)}</h2>
      <p class="mx-dim">${esc(album.artist || 'هنرمند مشخص نیست')}${album.year ? ` • ${faDigits(album.year)}` : ''}</p>
      <p class="mx-dim">${esc(album.description || 'بدون توضیح')}</p>
      <p class="mx-dim">${faDigits(songs.length)} آهنگ${songs.length ? ` • ${faDigits(formatLongDuration(songs.reduce((a, s) => a + (s.duration || 0), 0)))}` : ''}</p>
      <div class="mx-now__row">
        <button class="mx-btn mx-btn--primary" data-action="play-collection" data-id="${esc(album.id)}" data-kind="album">▶ پخش</button>
        <button class="mx-btn" data-action="shuffle-collection" data-id="${esc(album.id)}" data-kind="album">🔀 شافل</button>
        <button class="mx-btn" data-action="alb-add-songs" data-id="${esc(album.id)}">➕ افزودن آهنگ</button>
        <button class="mx-btn" data-action="alb-cover" data-id="${esc(album.id)}">🖼️ کاور</button>
        <button class="mx-btn" data-action="alb-edit" data-id="${esc(album.id)}">✏️ ویرایش</button>
        <button class="mx-btn mx-btn--danger" data-action="alb-delete" data-id="${esc(album.id)}">🗑️ حذف</button>
      </div>
    </div>
  </div>
  <div class="mx-rows">${rows}</div>
  `;
}

/* ================================================================== */
/* صف پخش                                                                */
/* ================================================================== */

export function renderQueueView(snap) {
  if (!snap.queue.length) {
    return emptyStateHtml('⏭️', 'صف پخش خالی است', 'آهنگی را پخش کن تا صف ساخته شود.', {
      action: 'tab',
      args: 'data-tab="songs"',
      label: 'رفتن به آهنگ‌ها',
    });
  }
  const rows = snap.queue
    .map((s, i) => {
      const current = i === snap.index;
      return `
      <div class="mx-row ${current ? 'is-current' : ''}" data-action="queue-play" data-i="${i}">
        <div class="mx-row__idx">${current && snap.status === 'playing' ? eqMiniHtml() : `<span>${faDigits(i + 1)}</span>`}</div>
        ${coverHtml('song', s, 'mx-row__cover')}
        <div class="mx-row__meta">
          <div class="mx-row__title">${esc(s.title)} ${current ? '<span class="mx-chip mx-chip--sm">در حال پخش</span>' : ''}</div>
          <div class="mx-row__sub">${esc(s.artist)} • ${faDigits(formatTime(s.duration))}</div>
        </div>
        <div class="mx-row__ops">
          <button class="mx-iconbtn" data-action="queue-up" data-i="${i}" title="بالا">▲</button>
          <button class="mx-iconbtn" data-action="queue-down" data-i="${i}" title="پایین">▼</button>
          <button class="mx-iconbtn" data-action="queue-remove" data-i="${i}" title="حذف از صف">✕</button>
        </div>
      </div>`;
    })
    .join('');

  return `
    <div class="mx-secbar">
      <h3>⏭️ صف پخش ${snap.contextLabel ? `• ${esc(snap.contextLabel)}` : ''} <span class="mx-dim">(${faDigits(snap.queue.length)} آهنگ)</span></h3>
      <div class="mx-now__row">
        <button class="mx-btn mx-btn--sm" data-action="queue-shuffle">🔀 بر زدن صف</button>
        <button class="mx-btn mx-btn--sm" data-action="queue-save">💾 ذخیره صف به‌صورت پلی‌لیست</button>
        <button class="mx-btn mx-btn--sm mx-btn--danger" data-action="queue-clear">🧹 پاک کردن صف</button>
      </div>
    </div>
    <div class="mx-rows">${rows}</div>
  `;
}

/* ================================================================== */
/* تاریخچه                                                               */
/* ================================================================== */

export function renderHistoryView(entries, snap) {
  if (!entries.length) {
    return emptyStateHtml('🕘', 'تاریخچه خالی است', 'هر آهنگی که پخش کنی اینجا ثبت می‌شود.');
  }
  const rows = entries
    .map(
      (h, i) => `
      <div class="mx-row" data-action="play-song" data-id="${esc(h.song.id)}" data-context="history">
        <div class="mx-row__idx"><span>${faDigits(i + 1)}</span></div>
        ${coverHtml('song', h.song, 'mx-row__cover')}
        <div class="mx-row__meta">
          <div class="mx-row__title">${esc(h.song.title)}</div>
          <div class="mx-row__sub">${esc(h.song.artist)} • ${esc(timeAgo(h.at))}</div>
        </div>
        <div class="mx-row__ops">
          <button class="mx-iconbtn" data-action="like" data-id="${esc(h.song.id)}">${h.song.liked ? '❤️' : '🤍'}</button>
          <button class="mx-iconbtn" data-action="song-menu" data-id="${esc(h.song.id)}">⋯</button>
        </div>
      </div>`
    )
    .join('');
  return `
    <div class="mx-secbar">
      <h3>🕘 تاریخچه پخش <span class="mx-dim">(${faDigits(entries.length)})</span></h3>
      <button class="mx-btn mx-btn--sm mx-btn--danger" data-action="history-clear">🧹 پاک کردن تاریخچه</button>
    </div>
    <div class="mx-rows">${rows}</div>
  `;
}

/* ================================================================== */
/* آمار                                                                  */
/* ================================================================== */

export function renderStatsView(stats) {
  const maxArtist = Math.max(1, ...stats.topArtists.map((a) => a.plays));
  const maxGenre = Math.max(1, ...stats.genres.map((g) => g.count));
  const maxTrack = Math.max(1, ...stats.topTracks.map((t) => t.playCount || 0));

  const statCards = [
    ['🎵', 'آهنگ‌ها', stats.total],
    ['📤', 'آپلودها', stats.uploads],
    ['🔗', 'لینک‌ها', stats.links],
    ['❤️', 'علاقه‌مندی‌ها', stats.liked],
    ['▶', 'کل پخش‌ها', stats.totalPlays],
    ['⏱️', 'زمان گوش دادن', formatLongDuration(stats.listenedSeconds)],
  ]
    .map(
      ([icon, label, value]) => `
      <div class="mx-stat"><div class="mx-stat__icon">${icon}</div><div class="mx-stat__value">${faDigits(value)}</div><div class="mx-stat__label">${label}</div></div>`
    )
    .join('');

  const artistBars = stats.topArtists.length
    ? stats.topArtists
        .map(
          (a) => `
        <div class="mx-bar-row"><span class="mx-bar-row__label">${esc(a.name)}</span>
        <div class="mx-bar-row__track"><i style="width:${Math.round((a.plays / maxArtist) * 100)}%"></i></div>
        <span class="mx-bar-row__value">${faDigits(a.plays)} پخش • ${faDigits(a.tracks)} آهنگ</span></div>`
        )
        .join('')
    : '<div class="mx-dim">هنوز آماری نیست.</div>';

  const genreBars = stats.genres.length
    ? stats.genres
        .slice(0, 8)
        .map(
          (g) => `
        <div class="mx-bar-row"><span class="mx-bar-row__label">${esc(g.name)}</span>
        <div class="mx-bar-row__track"><i class="alt" style="width:${Math.round((g.count / maxGenre) * 100)}%"></i></div>
        <span class="mx-bar-row__value">${faDigits(g.count)}</span></div>`
        )
        .join('')
    : '<div class="mx-dim">هنوز آماری نیست.</div>';

  const trackBars = stats.topTracks
    .filter((t) => (t.playCount || 0) > 0)
    .map(
      (t) => `
      <div class="mx-bar-row"><span class="mx-bar-row__label">${esc(t.title)} <small>• ${esc(t.artist)}</small></span>
      <div class="mx-bar-row__track"><i class="hot" style="width:${Math.round(((t.playCount || 0) / maxTrack) * 100)}%"></i></div>
      <span class="mx-bar-row__value">${faDigits(t.playCount)} پخش</span></div>`
    )
    .join('');

  return `
    <div class="mx-stats-grid">${statCards}</div>
    <div class="mx-secbar"><h3>🎤 پرپخش‌ترین خواننده‌ها</h3></div>
    <div class="mx-panel">${artistBars}</div>
    <div class="mx-secbar"><h3>🔥 پرپخش‌ترین آهنگ‌ها</h3></div>
    <div class="mx-panel">${trackBars || '<div class="mx-dim">هنوز آهنگی پخش نشده.</div>'}</div>
    <div class="mx-secbar"><h3>🎼 تفکیک سبک‌ها</h3></div>
    <div class="mx-panel">${genreBars}</div>
  `;
}

/* ================================================================== */
/* نوار پخش کامل                                                          */
/* ================================================================== */

function repeatIcon(repeat) {
  if (repeat === 'one') return '🔂';
  if (repeat === 'all') return '🔁';
  return '🔁';
}

export function renderPlayerBar(snap) {
  const song = snap.song;
  if (!song) {
    return `<div class="mx-bar__idle">🎵 برای شروع، یک آهنگ انتخاب کن <button class="mx-link" data-action="surprise">یا سورپرایزم کن 🎲</button></div>`;
  }
  const playing = snap.status === 'playing';
  const loading = snap.status === 'loading';
  const pct = snap.duration > 0 ? Math.min(1000, Math.round((snap.currentTime / snap.duration) * 1000)) : 0;
  const sleepActive = snap.sleepEndAt > 0 || snap.sleepEndOfTrack;
  const rateLabel = snap.rate === 1 ? '1x' : `${snap.rate}x`;

  return `
  <div class="mx-bar__song" data-action="tab" data-tab="now" title="رفتن به «در حال پخش»">
    ${coverHtml('song', song, 'mx-bar__cover')}
    <div class="mx-bar__meta">
      <div class="mx-bar__title">${marqueeHtml(song.title)}</div>
      <div class="mx-bar__artist">${esc(song.artist)}</div>
    </div>
  </div>
  <div class="mx-bar__center">
    <div class="mx-bar__controls">
      <button class="mx-iconbtn ${snap.shuffle ? 'is-on' : ''}" data-action="shuffle" title="شافل ${snap.shuffle ? '(روشن)' : '(خاموش)'}">🔀</button>
      <button class="mx-iconbtn" data-action="prev" title="قبلی">⏮</button>
      <button class="mx-playbtn ${playing ? 'is-playing' : ''}" data-action="toggle" title="${playing ? 'توقف' : 'پخش'}">${loading ? '<span class="mx-spinner"></span>' : playing ? '⏸' : '▶'}</button>
      <button class="mx-iconbtn" data-action="next" title="بعدی">⏭</button>
      <button class="mx-iconbtn ${snap.repeat !== 'off' ? 'is-on' : ''}" data-action="repeat" title="${REPEAT_LABELS[snap.repeat]}">${repeatIcon(snap.repeat)}</button>
    </div>
    <div class="mx-bar__seek">
      <span class="mx-time" data-mx="tcur">${faDigits(formatTime(snap.currentTime))}</span>
      <input class="mx-range mx-range--seek" type="range" min="0" max="1000" value="${pct}" data-mx="seek" aria-label="موقعیت پخش" />
      <span class="mx-time" data-mx="tdur">${faDigits(formatTime(snap.duration))}</span>
    </div>
  </div>
  <div class="mx-bar__side">
    <button class="mx-iconbtn mx-bar__hide-sm ${sleepActive ? 'is-on' : ''}" data-action="sleep" title="تایمر خواب${sleepActive ? ' (فعال)' : ''}">⏱️</button>
    <button class="mx-iconbtn mx-bar__hide-sm ${snap.eqEnabled ? 'is-on' : ''}" data-action="eq" title="اکولایزر">🎚️</button>
    <button class="mx-iconbtn mx-bar__hide-sm" data-action="rate" title="سرعت پخش">${rateLabel}</button>
    <button class="mx-iconbtn" data-action="mute" title="${snap.muted ? 'بی‌صدا (روشن)' : 'بی‌صدا'}">${snap.muted || snap.volume === 0 ? '🔇' : snap.volume < 0.5 ? '🔈' : '🔊'}</button>
    <input class="mx-range mx-range--vol mx-bar__hide-sm" type="range" min="0" max="100" value="${Math.round((snap.muted ? 0 : snap.volume) * 100)}" data-mx="vol" aria-label="بلندی صدا" />
    <button class="mx-iconbtn mx-bar__hide-sm" data-action="tab" data-tab="queue" title="صف پخش">⏭️</button>
  </div>
  `;
}

/* ================================================================== */
/* حالت فراگیر                                                            */
/* ================================================================== */

export function renderImmersive(song, snap) {
  if (!song) return '';
  const playing = snap.status === 'playing';
  return `
  <div class="mx-im__bg" aria-hidden="true"><i></i><i></i><i></i></div>
  <button class="mx-im__close" data-action="immersive">✕ بستن</button>
  <div class="mx-im__core">
    <div class="mx-vinylwrap ${playing ? 'is-playing' : ''} mx-vinylwrap--big">
      <div class="mx-tonearm"><i></i></div>
      <div class="mx-vinyl">
        <div class="mx-vinyl__disc"></div>
        <div class="mx-vinyl__label" data-cover="song:${esc(song.id)}" style="background:${gradientFor(song.id)}"><span>${esc(initialOf(song.title))}</span></div>
      </div>
      <div class="mx-vinyl__glow"></div>
    </div>
    <h2 class="mx-im__title">${esc(song.title)}</h2>
    <div class="mx-im__artist">${esc(song.artist)}${song.album ? ` • ${esc(song.album)}` : ''}</div>
    <canvas class="mx-visual mx-visual--big" data-mx="visual-big" height="160"></canvas>
    <div class="mx-im__controls">
      <button class="mx-iconbtn ${snap.shuffle ? 'is-on' : ''}" data-action="shuffle">🔀</button>
      <button class="mx-iconbtn" data-action="prev">⏮</button>
      <button class="mx-playbtn mx-playbtn--big ${playing ? 'is-playing' : ''}" data-action="toggle">${playing ? '⏸' : '▶'}</button>
      <button class="mx-iconbtn" data-action="next">⏭</button>
      <button class="mx-iconbtn ${snap.repeat !== 'off' ? 'is-on' : ''}" data-action="repeat">${repeatIcon(snap.repeat)}</button>
    </div>
    <div class="mx-im__seek">
      <span class="mx-time" data-mx="tcur">${faDigits(formatTime(snap.currentTime))}</span>
      <input class="mx-range mx-range--seek" type="range" min="0" max="1000" value="${snap.duration > 0 ? Math.round((snap.currentTime / snap.duration) * 1000) : 0}" data-mx="seek" />
      <span class="mx-time" data-mx="tdur">${faDigits(formatTime(snap.duration))}</span>
    </div>
  </div>
  `;
}

/* ================================================================== */
/* تم‌ها (دکمه‌های انتخاب تم در تب آمار؟ نه — در مودال تنظیمات سریع)        */
/* ================================================================== */

export function themeButtonsHtml(current) {
  return PLAYER_THEMES.map(
    (t) => `<button class="mx-btn mx-btn--sm ${current === t ? 'mx-btn--primary' : ''}" data-action="theme" data-v="${t}">${PLAYER_THEME_LABELS[t]}</button>`
  ).join('');
}

export function sleepOptionsHtml() {
  return SLEEP_OPTIONS.map(
    (o) => `<button class="mx-pick" data-action="sleep-set" data-v="${o.value}">${o.label}</button>`
  ).join('');
}

export function rateOptionsHtml(current) {
  return [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    .map((r) => `<button class="mx-pick ${current === r ? 'is-active' : ''}" data-action="rate-set" data-v="${r}">${r}x</button>`)
    .join('');
}
