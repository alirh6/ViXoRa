// src/pages/tools/music/music-editor.js

/**
 * ViXoRa Music Page — مودال‌ها و فرم‌ها
 */

import { createModal, confirmDialog } from '../../../utilities/modal.js';
import { toast } from '../../../utilities/toast.js';
import { escapeHtml } from '../../../utilities/dom-utils.js';
import {
  MUSIC_GENRES,
  validateSongDraft,
  validatePlaylistDraft,
  validateAlbumDraft,
  normalizeSong,
  isAudioUrl,
  looksLikeStreamUrl,
  EQ_PRESETS,
  EQ_BAND_LABELS,
} from '../../../core/schemas/music-schema.js';
import {
  addSongFromLink,
  updateSong,
  getSong,
  getCoverUrl,
  setCoverImage,
  removeCoverImage,
} from '../../../core/services/music-library-service.js';

function esc(value) {
  return escapeHtml(value);
}

function genreOptions(selected) {
  return MUSIC_GENRES.map(
    (g) => `<option value="${esc(g)}" ${selected === g ? 'selected' : ''}>${esc(g)}</option>`
  ).join('');
}

function field(label, inner) {
  return `<label class="mx-field"><span class="mx-field__label">${label}</span>${inner}</label>`;
}

function setBusy(button, busy, label = '') {
  if (!button) return;
  button.disabled = busy;
  if (busy) {
    button.dataset.label = button.innerHTML;
    button.innerHTML = '<span class="mx-spinner mx-spinner--sm"></span> صبر کن...';
  } else if (button.dataset.label) {
    button.innerHTML = button.dataset.label;
  } else if (label) {
    button.innerHTML = label;
  }
}

/* ================================================================== */
/* افزودن با لینک                                                        */
/* ================================================================== */

export function openAddLinkModal(onAdded) {
  const modal = createModal({
    title: '🔗 افزودن آهنگ با لینک',
    size: 'wide',
    bodyHtml: `
      <div class="mx-form">
        ${field('لینک مستقیم فایل صوتی *', `<input type="url" name="url" dir="ltr" placeholder="https://example.com/song.mp3" style="text-align:left" />`)}
        <div class="mx-hint">💡 لینک باید <b>مستقیم</b> باشد (مثل <span dir="ltr">.mp3</span>). لینک صفحه یوتیوب/ساندکلاد کار نمی‌کند چون آن‌ها فایل مستقیم نمی‌دهند.</div>
        <div class="mx-form__grid">
          ${field('نام آهنگ (خالی = حدس از لینک)', `<input type="text" name="title" placeholder="مثلاً: آهنگ بهار" />`)}
          ${field('خواننده', `<input type="text" name="artist" placeholder="خواننده ناشناس" />`)}
        </div>
        <div class="mx-form__grid">
          ${field('آلبوم', `<input type="text" name="album" placeholder="اختیاری" />`)}
          ${field('سبک', `<select name="genre">${genreOptions('پاپ')}</select>`)}
        </div>
      </div>
    `,
    actions: [
      { id: 'cancel', label: 'انصراف' },
      {
        id: 'add',
        label: '➕ افزودن آهنگ',
        variant: 'primary',
        onClick: async ({ close, dialog, button }) => {
          const url = dialog.querySelector('[name="url"]')?.value?.trim() || '';
          const title = dialog.querySelector('[name="title"]')?.value?.trim() || '';
          const artist = dialog.querySelector('[name="artist"]')?.value?.trim() || '';
          const album = dialog.querySelector('[name="album"]')?.value?.trim() || '';
          const genre = dialog.querySelector('[name="genre"]')?.value || 'سایر';

          const validation = validateSongDraft({ title: title || 'x', source: 'link', url });
          if (!validation.valid && !url) {
            toast.error('لینک معتبر وارد کنید.');
            return false;
          }
          if (!isAudioUrl(url) && !looksLikeStreamUrl(url)) {
            const go = await confirmDialog({
              title: 'لینک مشکوک است',
              message: 'این لینک شبیه فایل صوتی مستقیم نیست و ممکن است پخش نشود. با این حال اضافه شود؟',
              confirmLabel: 'بله، اضافه کن',
              cancelLabel: 'برگرد',
            });
            if (!go) return false;
          }

          setBusy(button, true);
          try {
            const song = await addSongFromLink({ url, title, artist, album, genre });
            toast.success(`«${song.title}» اضافه شد 🎵`);
            if (typeof onAdded === 'function') onAdded(song);
            return true;
          } catch (error) {
            toast.error(error?.message || 'افزودن آهنگ ممکن نشد.');
            setBusy(button, false);
            return false;
          }
        },
      },
    ],
  });
  modal.open();
}

/* ================================================================== */
/* ویرایش آهنگ                                                           */
/* ================================================================== */

export function openSongEditorModal(songId, onSaved) {
  getSong(songId)
    .then((song) => {
      if (!song) {
        toast.error('آهنگ یافت نشد.');
        return;
      }
      const normalized = normalizeSong(song);
      const modal = createModal({
        title: '✏️ ویرایش آهنگ',
        size: 'wide',
        bodyHtml: `
        <div class="mx-form">
          <div class="mx-form__grid">
            ${field('نام آهنگ *', `<input type="text" name="title" value="${esc(normalized.title)}" />`)}
            ${field('خواننده', `<input type="text" name="artist" value="${esc(normalized.artist)}" />`)}
          </div>
          <div class="mx-form__grid">
            ${field('آلبوم', `<input type="text" name="album" value="${esc(normalized.album)}" />`)}
            ${field('سبک', `<select name="genre">${genreOptions(normalized.genre)}</select>`)}
          </div>
          <div class="mx-form__grid">
            ${field('سال', `<input type="text" name="year" inputmode="numeric" value="${esc(normalized.year)}" placeholder="۱۴۰۳" />`)}
            ${field('شماره ترک', `<input type="number" name="trackNo" min="0" value="${normalized.trackNo || ''}" />`)}
          </div>
          ${field('امتیاز', `
            <div class="mx-rate" data-mxrate>
              ${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-rate="${i}" class="${i <= (normalized.rating || 0) ? 'on' : ''}">★</button>`).join('')}
              <button type="button" data-rate="0" class="mx-rate__clear">حذف امتیاز</button>
            </div>`)}
          ${field('متن آهنگ', `<textarea name="lyrics" rows="5" placeholder="متن آهنگ را اینجا بنویس...">${esc(normalized.lyrics)}</textarea>`)}
          <div class="mx-coverrow">
            <div class="mx-cover mx-cover--lg" data-mxcover style="background:#333"><span>♪</span></div>
            <div class="mx-coverrow__ops">
              <b>🖼️ کاور آهنگ</b>
              <div class="mx-now__row">
                <button type="button" class="mx-btn mx-btn--sm" data-mxcover-pick>انتخاب تصویر</button>
                <button type="button" class="mx-btn mx-btn--sm" data-mxcover-remove>حذف کاور</button>
              </div>
              <input type="file" data-mxcover-file accept="image/*" hidden />
            </div>
          </div>
        </div>
      `,
        actions: [
          { id: 'cancel', label: 'انصراف' },
          {
            id: 'save',
            label: '💾 ذخیره',
            variant: 'primary',
            onClick: async ({ dialog, button }) => {
              const patch = {
                title: dialog.querySelector('[name="title"]')?.value?.trim() || '',
                artist: dialog.querySelector('[name="artist"]')?.value?.trim() || '',
                album: dialog.querySelector('[name="album"]')?.value?.trim() || '',
                genre: dialog.querySelector('[name="genre"]')?.value || 'سایر',
                year: dialog.querySelector('[name="year"]')?.value?.trim() || '',
                trackNo: Number(dialog.querySelector('[name="trackNo"]')?.value) || 0,
                rating: Number(dialog.querySelector('[data-mxrate]')?.dataset?.value ?? normalized.rating) || 0,
                lyrics: dialog.querySelector('[name="lyrics"]')?.value || '',
              };
              const validation = validateSongDraft({ ...patch, source: normalized.source, url: normalized.url });
              if (!validation.valid) {
                toast.error(validation.message);
                return false;
              }
              setBusy(button, true);
              try {
                const saved = await updateSong(songId, patch);
                toast.success('ذخیره شد ✅');
                if (typeof onSaved === 'function') onSaved(saved);
                return true;
              } catch (error) {
                toast.error(error?.message || 'ذخیره ممکن نشد.');
                setBusy(button, false);
                return false;
              }
            },
          },
        ],
      });
      modal.open();

      const dialog = modal.element;
      // امتیاز ستاره‌ای
      const rateBox = dialog.querySelector('[data-mxrate]');
      rateBox.dataset.value = String(normalized.rating || 0);
      rateBox.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-rate]');
        if (!btn) return;
        rateBox.dataset.value = btn.dataset.rate;
        rateBox.querySelectorAll('[data-rate]').forEach((b) => {
          if (b.dataset.rate === '0') return;
          b.classList.toggle('on', Number(b.dataset.rate) <= Number(btn.dataset.rate));
        });
      });
      // کاور
      const coverBox = dialog.querySelector('[data-mxcover]');
      getCoverUrl('song', songId)
        .then((url) => {
          if (url) coverBox.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover" />`;
        })
        .catch(() => null);
      const fileInput = dialog.querySelector('[data-mxcover-file]');
      dialog.querySelector('[data-mxcover-pick]').addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        try {
          const url = await setCoverImage('song', songId, file);
          coverBox.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover" />`;
          toast.success('کاور ذخیره شد 🖼️');
          if (typeof onSaved === 'function') onSaved(null);
        } catch (error) {
          toast.error(error?.message || 'ثبت کاور ممکن نشد.');
        }
        fileInput.value = '';
      });
      dialog.querySelector('[data-mxcover-remove]').addEventListener('click', async () => {
        await removeCoverImage('song', songId).catch(() => null);
        coverBox.innerHTML = '<span>♪</span>';
        toast.info('کاور حذف شد.');
        if (typeof onSaved === 'function') onSaved(null);
      });
    })
    .catch(() => toast.error('آهنگ یافت نشد.'));
}

/* ================================================================== */
/* متن آهنگ (سریع)                                                       */
/* ================================================================== */

export function openLyricsModal(songId, onSaved) {
  getSong(songId)
    .then((song) => {
      if (!song) return;
      const modal = createModal({
        title: `📝 متن آهنگ «${song.title}»`,
        size: 'wide',
        bodyHtml: `<div class="mx-form">${field('متن', `<textarea name="lyrics" rows="10">${esc(song.lyrics || '')}</textarea>`)}</div>`,
        actions: [
          { id: 'cancel', label: 'انصراف' },
          {
            id: 'save',
            label: '💾 ذخیره متن',
            variant: 'primary',
            onClick: async ({ dialog }) => {
              const lyrics = dialog.querySelector('[name="lyrics"]')?.value || '';
              try {
                const saved = await updateSong(songId, { lyrics });
                toast.success('متن ذخیره شد 📝');
                if (typeof onSaved === 'function') onSaved(saved);
                return true;
              } catch {
                toast.error('ذخیره ممکن نشد.');
                return false;
              }
            },
          },
        ],
      });
      modal.open();
    })
    .catch(() => toast.error('آهنگ یافت نشد.'));
}

/* ================================================================== */
/* منوی آهنگ                                                             */
/* ================================================================== */

export function openSongMenuModal(song, handlers = {}) {
  const normalized = normalizeSong(song || {});
  const missing = normalized.source === 'upload' && normalized.hasBlob === false;
  const items = [
    { id: 'next', label: '⏭ پخش بعدی همین باشد', show: true },
    { id: 'queue', label: '➕ افزودن به انتهای صف', show: true },
    { id: 'playlist', label: '📝 افزودن به پلی‌لیست...', show: true },
    { id: 'album', label: '💿 افزودن به آلبوم...', show: true },
    { id: 'edit', label: '✏️ ویرایش مشخصات', show: true },
    { id: 'lyrics', label: '📝 ویرایش متن آهنگ', show: true },
    { id: 'share', label: '🔗 اشتراک‌گذاری', show: true },
    { id: 'download', label: normalized.source === 'link' ? '↗️ باز کردن لینک اصلی' : '⬇️ دانلود فایل', show: true },
    { id: 'reattach', label: '📎 الصاق مجدد فایل صوتی', show: missing },
    { id: 'delete', label: '🗑️ حذف از کتابخانه', show: true, danger: true },
  ].filter((i) => i.show);

  const modal = createModal({
    title: `⋯ ${normalized.title}`,
    bodyHtml: `<div class="mx-menu">${items
      .map((i) => `<button class="mx-menu__item ${i.danger ? 'is-danger' : ''}" data-menu="${i.id}">${i.label}</button>`)
      .join('')}</div>`,
    actions: [{ id: 'cancel', label: 'بستن' }],
  });
  modal.open();
  modal.element.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-menu]');
    if (!btn) return;
    const id = btn.dataset.menu;
    modal.close(id);
    const fn = handlers[id];
    if (typeof fn === 'function') setTimeout(() => fn(normalized), 200);
  });
}

/* ================================================================== */
/* ساخت/ویرایش پلی‌لیست و آلبوم                                           */
/* ================================================================== */

export function openCollectionModal(kind, existing, onSaved) {
  const isAlbum = kind === 'album';
  const data = existing || {};
  const modal = createModal({
    title: existing ? (isAlbum ? '✏️ ویرایش آلبوم' : '✏️ ویرایش پلی‌لیست') : isAlbum ? '💿 ساخت آلبوم جدید' : '📝 ساخت پلی‌لیست جدید',
    bodyHtml: `
      <div class="mx-form">
        ${field(isAlbum ? 'نام آلبوم *' : 'نام پلی‌لیست *', `<input type="text" name="title" value="${esc(data.title || '')}" placeholder="${isAlbum ? 'مثلاً: خاطرات جاده' : 'مثلاً: باشگاه'}" />`)}
        ${isAlbum ? field('هنرمند', `<input type="text" name="artist" value="${esc(data.artist || '')}" />`) : ''}
        ${isAlbum ? field('سال', `<input type="text" name="year" value="${esc(data.year || '')}" placeholder="۱۴۰۳" />`) : ''}
        ${field('توضیح', `<textarea name="description" rows="2" placeholder="اختیاری...">${esc(data.description || '')}</textarea>`)}
      </div>
    `,
    actions: [
      { id: 'cancel', label: 'انصراف' },
      {
        id: 'save',
        label: existing ? '💾 ذخیره' : '➕ ساختن',
        variant: 'primary',
        onClick: async ({ dialog, button }) => {
          const draft = {
            title: dialog.querySelector('[name="title"]')?.value?.trim() || '',
            description: dialog.querySelector('[name="description"]')?.value?.trim() || '',
            ...(isAlbum
              ? {
                  artist: dialog.querySelector('[name="artist"]')?.value?.trim() || '',
                  year: dialog.querySelector('[name="year"]')?.value?.trim() || '',
                }
              : {}),
          };
          const validation = isAlbum ? validateAlbumDraft(draft) : validatePlaylistDraft(draft);
          if (!validation.valid) {
            toast.error(validation.message);
            return false;
          }
          setBusy(button, true);
          try {
            if (typeof onSaved === 'function') await onSaved(draft);
            return true;
          } catch (error) {
            toast.error(error?.message || 'ذخیره ممکن نشد.');
            setBusy(button, false);
            return false;
          }
        },
      },
    ],
  });
  modal.open();
}

/* ================================================================== */
/* انتخاب آهنگ (افزودن گروهی به پلی‌لیست/آلبوم)                            */
/* ================================================================== */

export function openSongPickerModal(songs, alreadyIds, onConfirm) {
  const already = new Set(alreadyIds || []);
  const available = (songs || []).filter((s) => !already.has(s.id));
  const modal = createModal({
    title: `➕ انتخاب آهنگ (${available.length} آهنگ)`,
    size: 'wide',
    bodyHtml: `
      <div class="mx-form">
        <input type="search" data-pickq placeholder="🔍 جست‌وجو..." class="mx-input" />
        <div class="mx-picklist" data-picklist>
          ${available
            .map(
              (s) => `
            <label class="mx-pickitem" data-title="${esc(`${s.title} ${s.artist}`.toLowerCase())}">
              <input type="checkbox" value="${esc(s.id)}" />
              <span class="mx-pickitem__t">${esc(s.title)}</span>
              <span class="mx-pickitem__a">${esc(s.artist)}</span>
            </label>`
            )
            .join('') || '<div class="mx-dim">آهنگی برای افزودن نیست.</div>'}
        </div>
      </div>
    `,
    actions: [
      { id: 'cancel', label: 'انصراف' },
      {
        id: 'add',
        label: '➕ افزودن انتخاب‌شده‌ها',
        variant: 'primary',
        onClick: async ({ dialog, button }) => {
          const ids = [...dialog.querySelectorAll('[data-picklist] input:checked')].map((i) => i.value);
          if (!ids.length) {
            toast.warning('هیچ آهنگی انتخاب نشده.');
            return false;
          }
          setBusy(button, true);
          try {
            if (typeof onConfirm === 'function') await onConfirm(ids);
            return true;
          } catch (error) {
            toast.error(error?.message || 'افزودن ممکن نشد.');
            setBusy(button, false);
            return false;
          }
        },
      },
    ],
  });
  modal.open();
  const q = modal.element.querySelector('[data-pickq]');
  q?.addEventListener('input', () => {
    const term = q.value.trim().toLowerCase();
    modal.element.querySelectorAll('.mx-pickitem').forEach((label) => {
      label.style.display = !term || String(label.dataset.title).includes(term) ? '' : 'none';
    });
  });
}

/* ================================================================== */
/* انتخاب پلی‌لیست/آلبوم مقصد                                              */
/* ================================================================== */

export function openDestinationPickerModal(kind, collections, onPick, onCreateNew) {
  const isAlbum = kind === 'album';
  const modal = createModal({
    title: isAlbum ? '💿 افزودن به آلبوم...' : '📝 افزودن به پلی‌لیست...',
    bodyHtml: `
      <div class="mx-form">
        <div class="mx-menu" data-destlist>
          ${(collections || [])
            .map((c) => `<button class="mx-menu__item" data-dest="${esc(c.id)}">${isAlbum ? '💿' : '📝'} ${esc(c.title)} <small>(${(c.songIds || []).length})</small></button>`)
            .join('') || '<div class="mx-dim">هنوز چیزی نساختی.</div>'}
        </div>
        <div class="mx-form__inline">
          <input type="text" data-newname placeholder="${isAlbum ? 'نام آلبوم جدید...' : 'نام پلی‌لیست جدید...'}" class="mx-input" />
          <button class="mx-btn mx-btn--sm mx-btn--primary" data-newbtn>➕ بساز و اضافه کن</button>
        </div>
      </div>
    `,
    actions: [{ id: 'cancel', label: 'بستن' }],
  });
  modal.open();
  modal.element.querySelector('[data-destlist]')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-dest]');
    if (!btn) return;
    modal.close('pick');
    if (typeof onPick === 'function') setTimeout(() => onPick(btn.dataset.dest), 200);
  });
  modal.element.querySelector('[data-newbtn]')?.addEventListener('click', async (e) => {
    const input = modal.element.querySelector('[data-newname]');
    const name = input?.value?.trim() || '';
    if (!name) {
      toast.warning('نام را وارد کن.');
      return;
    }
    e.target.disabled = true;
    try {
      if (typeof onCreateNew === 'function') await onCreateNew(name);
      modal.close('create');
    } catch (error) {
      toast.error(error?.message || 'ساخت ممکن نشد.');
      e.target.disabled = false;
    }
  });
}

/* ================================================================== */
/* کاور کالکشن                                                            */
/* ================================================================== */

export function openCoverModal(ownerType, ownerId, title, onChanged) {
  const modal = createModal({
    title: `🖼️ کاور «${title}»`,
    bodyHtml: `
      <div class="mx-form">
        <div class="mx-coverrow">
          <div class="mx-cover mx-cover--lg" data-cvbox style="background:#333"><span>♪</span></div>
          <div class="mx-coverrow__ops">
            <div class="mx-now__row">
              <button type="button" class="mx-btn mx-btn--sm mx-btn--primary" data-cv-pick>انتخاب تصویر</button>
              <button type="button" class="mx-btn mx-btn--sm" data-cv-remove>حذف کاور</button>
            </div>
            <input type="file" data-cv-file accept="image/*" hidden />
          </div>
        </div>
      </div>
    `,
    actions: [{ id: 'done', label: 'تمام', variant: 'primary' }],
  });
  modal.open();
  const dialog = modal.element;
  const box = dialog.querySelector('[data-cvbox]');
  const fileInput = dialog.querySelector('[data-cv-file]');
  getCoverUrl(ownerType, ownerId)
    .then((url) => {
      if (url) box.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover" />`;
    })
    .catch(() => null);
  dialog.querySelector('[data-cv-pick]').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const url = await setCoverImage(ownerType, ownerId, file);
      box.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover" />`;
      toast.success('کاور ذخیره شد 🖼️');
      if (typeof onChanged === 'function') onChanged();
    } catch (error) {
      toast.error(error?.message || 'ثبت کاور ممکن نشد.');
    }
    fileInput.value = '';
  });
  dialog.querySelector('[data-cv-remove]').addEventListener('click', async () => {
    await removeCoverImage(ownerType, ownerId).catch(() => null);
    box.innerHTML = '<span>♪</span>';
    toast.info('کاور حذف شد.');
    if (typeof onChanged === 'function') onChanged();
  });
}

/* ================================================================== */
/* تایمر خواب و سرعت                                                      */
/* ================================================================== */

export function openSleepModal(currentLabel, onSet) {
  const options = [
    { value: 'off', label: '⏹️ خاموش' },
    { value: '5', label: '۵ دقیقه' },
    { value: '10', label: '۱۰ دقیقه' },
    { value: '15', label: '۱۵ دقیقه' },
    { value: '30', label: '۳۰ دقیقه' },
    { value: '60', label: '۱ ساعت' },
    { value: 'track', label: '🎵 پایان همین آهنگ' },
  ];
  const modal = createModal({
    title: `⏱️ تایمر خواب ${currentLabel ? `(${currentLabel})` : ''}`,
    bodyHtml: `<div class="mx-menu">${options.map((o) => `<button class="mx-menu__item" data-sleep="${o.value}">${o.label}</button>`).join('')}</div>`,
    actions: [{ id: 'cancel', label: 'بستن' }],
  });
  modal.open();
  modal.element.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sleep]');
    if (!btn) return;
    modal.close('set');
    if (typeof onSet === 'function') setTimeout(() => onSet(btn.dataset.sleep), 200);
  });
}

export function openRateModal(current, onSet) {
  const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const modal = createModal({
    title: '⏩ سرعت پخش',
    bodyHtml: `<div class="mx-menu">${rates
      .map((r) => `<button class="mx-menu__item" data-rate="${r}">${r}x ${Number(current) === r ? '✓' : ''}</button>`)
      .join('')}</div>`,
    actions: [{ id: 'cancel', label: 'بستن' }],
  });
  modal.open();
  modal.element.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-rate]');
    if (!btn) return;
    modal.close('set');
    if (typeof onSet === 'function') setTimeout(() => onSet(Number(btn.dataset.rate)), 200);
  });
}

/* ================================================================== */
/* اکولایزر (زنده)                                                         */
/* ================================================================== */

export function openEqModal(snap, api) {
  const presetBtns = Object.entries(EQ_PRESETS)
    .map(([key, p]) => `<button class="mx-btn mx-btn--sm ${snap.eqPreset === key ? 'mx-btn--primary' : ''}" data-preset="${key}">${esc(p.label)}</button>`)
    .join('');
  const sliders = EQ_BAND_LABELS.map(
    (label, i) => `
    <div class="mx-eqband">
      <input type="range" min="-12" max="12" step="1" value="${snap.eqBands[i] || 0}" data-band="${i}" orient="vertical" aria-label="${label}" />
      <b data-bandval="${i}">${snap.eqBands[i] > 0 ? '+' : ''}${snap.eqBands[i] || 0}</b>
      <span>${label}</span>
    </div>`
  ).join('');

  const modal = createModal({
    title: '🎚️ اکولایزر و صدا',
    size: 'wide',
    bodyHtml: `
      <div class="mx-form">
        ${snap.liveAnalysis ? '<div class="mx-hint">🟢 اکولایزر روی این آهنگ <b>واقعاً اعمال می‌شود</b>.</div>' : '<div class="mx-hint">🌊 این آهنگ لینک خارجی است؛ اکولایزر ذخیره می‌شود و روی آپلودها و لینک‌های سازگار اعمال می‌شود.</div>'}
        <div class="mx-eqpresets">${presetBtns}</div>
        <div class="mx-eqbands">${sliders}</div>
        ${field('🎧 بالانس (چپ ↔ راست)', `<input type="range" min="-100" max="100" value="${Math.round((snap.balance || 0) * 100)}" data-balance class="mx-range" />`)}
        <label class="mx-check"><input type="checkbox" data-eqon ${snap.eqEnabled ? 'checked' : ''} /> اکولایزر فعال باشد</label>
        <label class="mx-check"><input type="checkbox" data-fadeon ${snap.fade ? 'checked' : ''} /> محو شدن نرم صدا هنگام پخش/توقف (Fade)</label>
      </div>
    `,
    actions: [{ id: 'done', label: 'تمام', variant: 'primary' }],
  });
  modal.open();
  const dialog = modal.element;

  dialog.querySelectorAll('[data-band]').forEach((input) => {
    input.addEventListener('input', () => {
      const i = Number(input.dataset.band);
      api.setBand(i, Number(input.value));
      const badge = dialog.querySelector(`[data-bandval="${i}"]`);
      if (badge) badge.textContent = `${Number(input.value) > 0 ? '+' : ''}${input.value}`;
      dialog.querySelectorAll('[data-preset]').forEach((b) => b.classList.remove('mx-btn--primary'));
    });
  });
  dialog.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      api.setPreset(btn.dataset.preset);
      const bands = EQ_PRESETS[btn.dataset.preset]?.bands || [0, 0, 0, 0, 0];
      dialog.querySelectorAll('[data-band]').forEach((input) => {
        input.value = bands[Number(input.dataset.band)] || 0;
        const badge = dialog.querySelector(`[data-bandval="${input.dataset.band}"]`);
        if (badge) badge.textContent = `${Number(input.value) > 0 ? '+' : ''}${input.value}`;
      });
      dialog.querySelectorAll('[data-preset]').forEach((b) => b.classList.toggle('mx-btn--primary', b === btn));
      const eqon = dialog.querySelector('[data-eqon]');
      if (eqon) eqon.checked = true;
    });
  });
  dialog.querySelector('[data-balance]')?.addEventListener('input', (e) => {
    api.setBalance(Number(e.target.value) / 100);
  });
  dialog.querySelector('[data-eqon]')?.addEventListener('change', () => api.toggleEq());
  dialog.querySelector('[data-fadeon]')?.addEventListener('change', () => api.toggleFade());
}

/* ================================================================== */
/* بکاپ                                                                  */
/* ================================================================== */

export function openBackupModal(counts, onExport, onImportFile) {
  const modal = createModal({
    title: '💾 بکاپ و بازیابی',
    bodyHtml: `
      <div class="mx-form">
        <div class="mx-hint">کتابخانه فعلی: <b>${counts.songs} آهنگ</b> • <b>${counts.playlists} پلی‌لیست</b> • <b>${counts.albums} آلبوم</b></div>
        <div class="mx-hint">⚠️ بکاپ فقط <b>مشخصات</b> را نگه می‌دارد؛ فایل‌های آپلودشده را باید بعد از بازیابی دوباره الصاق کنی (لینک‌ها مشکلی ندارند).</div>
        <div class="mx-now__row">
          <button class="mx-btn mx-btn--primary" data-exp>⬇️ دانلود بکاپ (JSON)</button>
          <button class="mx-btn" data-imp>📤 بازیابی از فایل</button>
        </div>
        <input type="file" data-impfile accept="application/json,.json" hidden />
      </div>
    `,
    actions: [{ id: 'done', label: 'بستن' }],
  });
  modal.open();
  const dialog = modal.element;
  dialog.querySelector('[data-exp]')?.addEventListener('click', () => {
    if (typeof onExport === 'function') onExport();
  });
  const imp = dialog.querySelector('[data-impfile]');
  dialog.querySelector('[data-imp]')?.addEventListener('click', () => imp.click());
  imp?.addEventListener('change', () => {
    const file = imp.files?.[0];
    if (file && typeof onImportFile === 'function') onImportFile(file);
    imp.value = '';
  });
}
