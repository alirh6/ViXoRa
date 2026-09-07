// src/pages/tools/note/note-editor.js

/**
 * ویرایشگر یادداشت — کشوی کنار صفحه (نه مودال بزرگ)
 * ==================================================================
 * طراحی بر اساس خواستهٔ کاربر:
 *   «هنگام به‌روزرسانی یا افزودن هر بخش، مجبور نباشم یک مودال یا صفحهٔ
 *     بزرگ از همهٔ آیتم‌ها باز کنم و دنبالش بگردم.»
 *
 * راه‌حل:
 *   - هر بلوک (بخش) در همان کارت به‌صورت درجا (inline) ویرایش می‌شود
 *   - افزودن آیتم جزئی (یک وظیفه، یک فیلد، یک لینک) با یک input کوچک
 *     در پایین همان بخش انجام می‌شود
 *   - کشوی ویرایشگر فقط برای تنظیمات کلی است و بخش‌ها را جمع‌شده نشان می‌دهد
 */

import { escapeHtml } from '../../../utilities/dom-utils.js';
import {
  BLOCK_TYPES,
  NOTE_COLORS,
  NOTE_PRIORITIES,
  NOTE_STATUSES,
  createBlock,
  getTaskStats,
} from '../../../core/schemas/note-schema.js';

import { STATUS_LABELS, PRIORITY_LABELS, COLOR_LABELS } from './note-state.js';
import { formatPersianDate, formatPersianDateTime, formatRelativeTime, formatFileSize, formatCurrency } from '../../../utilities/formatters.js';

/* ------------------------------------------------------------------ */
/* ابزارها                                                             */
/* ------------------------------------------------------------------ */

function options(pairs, activeValue) {
  return pairs
    .map(
      ([value, label]) =>
        `<option value="${escapeHtml(value)}"${value === activeValue ? ' selected' : ''}>${escapeHtml(label)}</option>`
    )
    .join('');
}

function toDateTimeLocal(isoValue) {
  if (!isoValue) return '';

  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (value) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* ------------------------------------------------------------------ */
/* بلوک‌ها — رندر درجا                                                 */
/* ------------------------------------------------------------------ */

export function renderBlockBody(block, { noteId, readOnly = false } = {}) {
  const disabled = readOnly ? 'disabled' : '';

  switch (block.type) {
    case 'text':
      return `
        <textarea
          class="vx-textarea vx-block__textarea"
          data-block-input="value"
          data-note-id="${escapeHtml(noteId)}"
          data-block-id="${escapeHtml(block.id)}"
          rows="3"
          placeholder="متن این بخش..."
          ${disabled}
        >${escapeHtml(block.value || '')}</textarea>
      `;

    case 'quote':
      return `
        <div class="vx-block__quote">
          <textarea
            class="vx-textarea vx-block__textarea"
            data-block-input="value"
            data-note-id="${escapeHtml(noteId)}"
            data-block-id="${escapeHtml(block.id)}"
            rows="2"
            placeholder="متن نقل‌قول..."
            ${disabled}
          >${escapeHtml(block.value || '')}</textarea>

          <input
            class="vx-input vx-block__input"
            data-block-input="author"
            data-note-id="${escapeHtml(noteId)}"
            data-block-id="${escapeHtml(block.id)}"
            placeholder="گوینده"
            value="${escapeHtml(block.author || '')}"
            ${disabled}
          />
        </div>
      `;

    case 'code':
      return `
        <div class="vx-block__code">
          <input
            class="vx-input vx-block__input"
            data-block-input="language"
            data-note-id="${escapeHtml(noteId)}"
            data-block-id="${escapeHtml(block.id)}"
            placeholder="زبان"
            value="${escapeHtml(block.language || '')}"
            ${disabled}
          />

          <textarea
            class="vx-textarea vx-block__textarea vx-block__textarea--code"
            dir="ltr"
            data-block-input="value"
            data-note-id="${escapeHtml(noteId)}"
            data-block-id="${escapeHtml(block.id)}"
            rows="4"
            spellcheck="false"
            ${disabled}
          >${escapeHtml(block.value || '')}</textarea>
        </div>
      `;

    case 'task':
      return renderTaskBlock(block, noteId, disabled);

    case 'checklistRating':
      return renderRatingBlock(block, noteId, disabled);

    case 'keyvalue':
      return renderKeyValueBlock(block, noteId, disabled);

    case 'table':
      return renderTableBlock(block, noteId, disabled);

    case 'link':
      return renderLinkBlock(block, noteId, disabled);

    case 'contact':
      return renderContactBlock(block, noteId, disabled);

    case 'money':
      return renderMoneyBlock(block, noteId, disabled);

    case 'date':
      return renderDateBlock(block, noteId, disabled);

    case 'location':
      return renderLocationBlock(block, noteId, disabled);

    case 'media':
      return renderMediaBlock(block, noteId);

    default:
      return '<p class="vx-hint">این نوع بخش پشتیبانی نمی‌شود.</p>';
  }
}

function blockFooterRow(noteId, blockId, fields, actionLabel, addLabel) {
  return `
    <div class="vx-block__quickadd">
      ${fields
        .map(
          (field) => `
            <input
              class="vx-input vx-block__input"
              data-quick-field="${escapeHtml(field.key)}"
              data-note-id="${escapeHtml(noteId)}"
              data-block-id="${escapeHtml(blockId)}"
              placeholder="${escapeHtml(field.placeholder)}"
              ${field.type === 'number' ? 'type="number"' : ''}
              ${field.type === 'datetime-local' ? 'type="datetime-local"' : ''}
              ${field.dir ? `dir="${field.dir}"` : ''}
            />
          `
        )
        .join('')}

      <button
        class="vx-btn vx-btn--sm vx-btn--accent"
        type="button"
        data-action="quick-add-item"
        data-note-id="${escapeHtml(noteId)}"
        data-block-id="${escapeHtml(blockId)}"
        data-item-kind="${escapeHtml(actionLabel)}"
      >${escapeHtml(addLabel)}</button>
    </div>
  `;
}

function renderTaskBlock(block, noteId, disabled) {
  const items = (block.items || [])
    .map(
      (item) => `
        <li class="vx-item ${item.done ? 'is-done' : ''}" data-item-id="${escapeHtml(item.id)}">
          <input
            type="checkbox"
            class="vx-item__check"
            data-action="toggle-task"
            data-note-id="${escapeHtml(noteId)}"
            data-block-id="${escapeHtml(block.id)}"
            data-item-id="${escapeHtml(item.id)}"
            ${item.done ? 'checked' : ''}
            ${disabled}
            aria-label="انجام شد"
          />

          <input
            class="vx-item__text"
            data-block-item-input="text"
            data-note-id="${escapeHtml(noteId)}"
            data-block-id="${escapeHtml(block.id)}"
            data-item-id="${escapeHtml(item.id)}"
            value="${escapeHtml(item.text)}"
            ${disabled}
          />

          <button class="vx-item__remove" type="button" data-action="remove-item"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  data-item-id="${escapeHtml(item.id)}" aria-label="حذف" ${disabled}>×</button>
        </li>
      `
    )
    .join('');

  return `
    <ul class="vx-block__items">${items || '<li class="vx-hint">وظیفه‌ای نیست.</li>'}</ul>

    ${
      disabled
        ? ''
        : blockFooterRow(
            noteId,
            block.id,
            [{ key: 'text', placeholder: 'وظیفهٔ جدید...' }],
            'task',
            '+ وظیفه'
          )
    }
  `;
}

function renderRatingBlock(block, noteId, disabled) {
  const scale = block.scale || 5;

  const items = (block.items || [])
    .map(
      (item) => `
        <li class="vx-item" data-item-id="${escapeHtml(item.id)}">
          <input
            class="vx-item__text"
            data-block-item-input="text"
            data-note-id="${escapeHtml(noteId)}"
            data-block-id="${escapeHtml(block.id)}"
            data-item-id="${escapeHtml(item.id)}"
            value="${escapeHtml(item.text)}"
            ${disabled}
          />

          <div class="vx-rating" role="radiogroup" aria-label="امتیاز">
            ${Array.from({ length: scale })
              .map(
                (_star, index) => `
                  <button
                    class="vx-rating__star ${index < item.score ? 'is-on' : ''}"
                    type="button"
                    data-action="rate-item"
                    data-note-id="${escapeHtml(noteId)}"
                    data-block-id="${escapeHtml(block.id)}"
                    data-item-id="${escapeHtml(item.id)}"
                    data-score="${index + 1}"
                    aria-label="امتیاز ${index + 1}"
                    ${disabled}
                  >★</button>
                `
              )
              .join('')}
          </div>

          <button class="vx-item__remove" type="button" data-action="remove-item"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  data-item-id="${escapeHtml(item.id)}" aria-label="حذف" ${disabled}>×</button>
        </li>
      `
    )
    .join('');

  return `
    <ul class="vx-block__items">${items || '<li class="vx-hint">موردی نیست.</li>'}</ul>

    ${
      disabled
        ? ''
        : blockFooterRow(
            noteId,
            block.id,
            [{ key: 'text', placeholder: 'مورد ارزیابی...' }],
            'rating',
            '+ مورد'
          )
    }
  `;
}

function renderKeyValueBlock(block, noteId, disabled) {
  const rows = (block.fields || [])
    .map(
      (field) => `
        <li class="vx-item vx-item--kv" data-item-id="${escapeHtml(field.id)}">
          <input
            class="vx-item__text"
            data-block-item-input="label"
            data-note-id="${escapeHtml(noteId)}"
            data-block-id="${escapeHtml(block.id)}"
            data-item-id="${escapeHtml(field.id)}"
            value="${escapeHtml(field.label)}"
            placeholder="عنوان فیلد"
            ${disabled}
          />

          <input
            class="vx-item__text"
            data-block-item-input="value"
            data-note-id="${escapeHtml(noteId)}"
            data-block-id="${escapeHtml(block.id)}"
            data-item-id="${escapeHtml(field.id)}"
            value="${escapeHtml(field.value)}"
            placeholder="مقدار"
            ${disabled}
          />

          <button class="vx-item__remove" type="button" data-action="remove-item"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  data-item-id="${escapeHtml(field.id)}" aria-label="حذف" ${disabled}>×</button>
        </li>
      `
    )
    .join('');

  return `
    <ul class="vx-block__items">${rows || '<li class="vx-hint">فیلدی نیست.</li>'}</ul>

    ${
      disabled
        ? ''
        : blockFooterRow(
            noteId,
            block.id,
            [
              { key: 'label', placeholder: 'عنوان فیلد' },
              { key: 'value', placeholder: 'مقدار' },
            ],
            'field',
            '+ فیلد'
          )
    }
  `;
}

function renderTableBlock(block, noteId, disabled) {
  const columns = block.columns || [];

  return `
    <div class="vx-block__table-wrap">
      <table class="vx-block__table">
        <thead>
          <tr>
            ${columns
              .map(
                (column, index) => `
                  <th>
                    <input
                      class="vx-item__text"
                      data-block-column-index="${index}"
                      data-note-id="${escapeHtml(noteId)}"
                      data-block-id="${escapeHtml(block.id)}"
                      value="${escapeHtml(column)}"
                      ${disabled}
                    />
                  </th>
                `
              )
              .join('')}

            ${disabled ? '' : '<th class="vx-block__table-op"></th>'}
          </tr>
        </thead>

        <tbody>
          ${(block.rows || [])
            .map(
              (row, rowIndex) => `
                <tr data-row-index="${rowIndex}">
                  ${columns
                    .map(
                      (_column, columnIndex) => `
                        <td>
                          <input
                            class="vx-item__text"
                            data-block-cell-row="${rowIndex}"
                            data-block-cell-col="${columnIndex}"
                            data-note-id="${escapeHtml(noteId)}"
                            data-block-id="${escapeHtml(block.id)}"
                            value="${escapeHtml(row[columnIndex] || '')}"
                            ${disabled}
                          />
                        </td>
                      `
                    )
                    .join('')}

                  ${
                    disabled
                      ? ''
                      : `
                        <td class="vx-block__table-op">
                          <button class="vx-item__remove" type="button" data-action="remove-table-row"
                                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                                  data-row-index="${rowIndex}" aria-label="حذف ردیف">×</button>
                        </td>
                      `
                  }
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    ${
      disabled
        ? ''
        : `
          <div class="vx-block__quickadd">
            <button class="vx-btn vx-btn--sm" type="button" data-action="add-table-row"
                    data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}">+ ردیف</button>

            <button class="vx-btn vx-btn--sm" type="button" data-action="add-table-column"
                    data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}">+ ستون</button>

            <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="remove-table-column"
                    data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}">− ستون آخر</button>
          </div>
        `
    }
  `;
}

function renderLinkBlock(block, noteId, disabled) {
  const rows = (block.links || [])
    .map(
      (link) => `
        <li class="vx-item vx-item--kv" data-item-id="${escapeHtml(link.id)}">
          <input
            class="vx-item__text"
            data-block-item-input="label"
            data-note-id="${escapeHtml(noteId)}"
            data-block-id="${escapeHtml(block.id)}"
            data-item-id="${escapeHtml(link.id)}"
            value="${escapeHtml(link.label)}"
            placeholder="عنوان لینک"
            ${disabled}
          />

          <input
            class="vx-item__text"
            dir="ltr"
            data-block-item-input="url"
            data-note-id="${escapeHtml(noteId)}"
            data-block-id="${escapeHtml(block.id)}"
            data-item-id="${escapeHtml(link.id)}"
            value="${escapeHtml(link.url)}"
            placeholder="https://..."
            ${disabled}
          />

          <a class="vx-item__open" href="${escapeHtml(link.url)}" target="_blank" rel="noopener" aria-label="بازکردن">↗</a>

          <button class="vx-item__remove" type="button" data-action="remove-item"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  data-item-id="${escapeHtml(link.id)}" aria-label="حذف" ${disabled}>×</button>
        </li>
      `
    )
    .join('');

  return `
    <ul class="vx-block__items">${rows || '<li class="vx-hint">لینکی نیست.</li>'}</ul>

    ${
      disabled
        ? ''
        : blockFooterRow(
            noteId,
            block.id,
            [
              { key: 'label', placeholder: 'عنوان' },
              { key: 'url', placeholder: 'https://...', dir: 'ltr' },
            ],
            'link',
            '+ لینک'
          )
    }
  `;
}

function renderContactBlock(block, noteId, disabled) {
  const rows = (block.people || [])
    .map(
      (person) => `
        <li class="vx-item vx-item--grid" data-item-id="${escapeHtml(person.id)}">
          <input class="vx-item__text" data-block-item-input="name" placeholder="نام"
                 data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                 data-item-id="${escapeHtml(person.id)}" value="${escapeHtml(person.name)}" ${disabled} />

          <input class="vx-item__text" data-block-item-input="role" placeholder="نقش"
                 data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                 data-item-id="${escapeHtml(person.id)}" value="${escapeHtml(person.role)}" ${disabled} />

          <input class="vx-item__text" dir="ltr" data-block-item-input="phone" placeholder="موبایل"
                 data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                 data-item-id="${escapeHtml(person.id)}" value="${escapeHtml(person.phone)}" ${disabled} />

          <input class="vx-item__text" dir="ltr" data-block-item-input="email" placeholder="ایمیل"
                 data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                 data-item-id="${escapeHtml(person.id)}" value="${escapeHtml(person.email)}" ${disabled} />

          <button class="vx-item__remove" type="button" data-action="remove-item"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  data-item-id="${escapeHtml(person.id)}" aria-label="حذف" ${disabled}>×</button>
        </li>
      `
    )
    .join('');

  return `
    <ul class="vx-block__items">${rows || '<li class="vx-hint">مخاطبی نیست.</li>'}</ul>

    ${
      disabled
        ? ''
        : blockFooterRow(
            noteId,
            block.id,
            [
              { key: 'name', placeholder: 'نام' },
              { key: 'phone', placeholder: 'موبایل', dir: 'ltr' },
            ],
            'contact',
            '+ مخاطب'
          )
    }
  `;
}

function renderMoneyBlock(block, noteId, disabled) {
  const entries = block.entries || [];

  const income = entries.filter((entry) => entry.direction === 'income').reduce((sum, entry) => sum + entry.amount, 0);
  const expense = entries.filter((entry) => entry.direction !== 'income').reduce((sum, entry) => sum + entry.amount, 0);

  const rows = entries
    .map(
      (entry) => `
        <li class="vx-item vx-item--grid" data-item-id="${escapeHtml(entry.id)}">
          <input class="vx-item__text" data-block-item-input="label" placeholder="شرح"
                 data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                 data-item-id="${escapeHtml(entry.id)}" value="${escapeHtml(entry.label)}" ${disabled} />

          <input class="vx-item__text" type="number" data-block-item-input="amount" placeholder="مبلغ"
                 data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                 data-item-id="${escapeHtml(entry.id)}" value="${escapeHtml(String(entry.amount))}" ${disabled} />

          <select class="vx-select" data-block-item-input="direction"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  data-item-id="${escapeHtml(entry.id)}" ${disabled}>
            ${options([['expense', 'هزینه'], ['income', 'درآمد']], entry.direction)}
          </select>

          <button class="vx-item__remove" type="button" data-action="remove-item"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  data-item-id="${escapeHtml(entry.id)}" aria-label="حذف" ${disabled}>×</button>
        </li>
      `
    )
    .join('');

  return `
    <div class="vx-block__money-summary">
      <span class="is-income">درآمد: ${escapeHtml(formatCurrency(income))}</span>
      <span class="is-expense">هزینه: ${escapeHtml(formatCurrency(expense))}</span>
      <strong>مانده: ${escapeHtml(formatCurrency(income - expense))}</strong>
    </div>

    <ul class="vx-block__items">${rows || '<li class="vx-hint">رکوردی نیست.</li>'}</ul>

    ${
      disabled
        ? ''
        : blockFooterRow(
            noteId,
            block.id,
            [
              { key: 'label', placeholder: 'شرح' },
              { key: 'amount', placeholder: 'مبلغ', type: 'number' },
            ],
            'money',
            '+ رکورد'
          )
    }
  `;
}

function renderDateBlock(block, noteId, disabled) {
  const rows = (block.events || [])
    .map(
      (event) => `
        <li class="vx-item vx-item--grid" data-item-id="${escapeHtml(event.id)}">
          <input class="vx-item__text" data-block-item-input="label" placeholder="عنوان"
                 data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                 data-item-id="${escapeHtml(event.id)}" value="${escapeHtml(event.label)}" ${disabled} />

          <input class="vx-item__text" type="datetime-local" data-block-item-input="at"
                 data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                 data-item-id="${escapeHtml(event.id)}" value="${escapeHtml(toDateTimeLocal(event.at))}" ${disabled} />

          <select class="vx-select" data-block-item-input="repeat"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  data-item-id="${escapeHtml(event.id)}" ${disabled}>
            ${options([['none', 'بدون تکرار'], ['daily', 'روزانه'], ['weekly', 'هفتگی'], ['monthly', 'ماهانه']], event.repeat)}
          </select>

          <button class="vx-item__remove" type="button" data-action="remove-item"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  data-item-id="${escapeHtml(event.id)}" aria-label="حذف" ${disabled}>×</button>
        </li>
      `
    )
    .join('');

  return `
    <ul class="vx-block__items">${rows || '<li class="vx-hint">رویدادی نیست.</li>'}</ul>

    ${
      disabled
        ? ''
        : blockFooterRow(
            noteId,
            block.id,
            [
              { key: 'label', placeholder: 'عنوان رویداد' },
              { key: 'at', placeholder: 'زمان', type: 'datetime-local' },
            ],
            'date',
            '+ رویداد'
          )
    }
  `;
}

function renderLocationBlock(block, noteId, disabled) {
  const rows = (block.places || [])
    .map(
      (place) => `
        <li class="vx-item vx-item--grid" data-item-id="${escapeHtml(place.id)}">
          <input class="vx-item__text" data-block-item-input="label" placeholder="نام مکان"
                 data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                 data-item-id="${escapeHtml(place.id)}" value="${escapeHtml(place.label)}" ${disabled} />

          <input class="vx-item__text" data-block-item-input="address" placeholder="آدرس"
                 data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                 data-item-id="${escapeHtml(place.id)}" value="${escapeHtml(place.address)}" ${disabled} />

          <a class="vx-item__open" target="_blank" rel="noopener"
             href="https://www.openstreetmap.org/search?query=${encodeURIComponent(place.address || place.label || '')}"
             aria-label="نمایش روی نقشه">🗺</a>

          <button class="vx-item__remove" type="button" data-action="remove-item"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  data-item-id="${escapeHtml(place.id)}" aria-label="حذف" ${disabled}>×</button>
        </li>
      `
    )
    .join('');

  return `
    <ul class="vx-block__items">${rows || '<li class="vx-hint">مکانی نیست.</li>'}</ul>

    ${
      disabled
        ? ''
        : blockFooterRow(
            noteId,
            block.id,
            [
              { key: 'label', placeholder: 'نام مکان' },
              { key: 'address', placeholder: 'آدرس' },
            ],
            'location',
            '+ مکان'
          )
    }
  `;
}

function renderMediaBlock(block, noteId) {
  return `
    <p class="vx-hint">
      ضمیمه‌ها از تب «ضمیمه‌ها» در ویرایشگر یا با کشیدن فایل روی کارت اضافه می‌شوند.
    </p>

    <button class="vx-btn vx-btn--sm" type="button" data-action="open-editor" data-note-id="${escapeHtml(noteId)}" data-editor-tab="attachments">
      مدیریت ضمیمه‌ها
    </button>
  `;
}

/* ------------------------------------------------------------------ */
/* کارت بلوک                                                           */
/* ------------------------------------------------------------------ */

export function renderBlockCard(block, { noteId, index, total, readOnly = false } = {}) {
  const definition = BLOCK_TYPES[block.type] || { icon: '📄', label: block.type };

  return `
    <section
      class="vx-block ${block.collapsed ? 'is-collapsed' : ''}"
      data-block-id="${escapeHtml(block.id)}"
      data-block-type="${escapeHtml(block.type)}"
    >
      <header class="vx-block__head">
        <button
          class="vx-block__toggle"
          type="button"
          data-action="toggle-block-collapse"
          data-note-id="${escapeHtml(noteId)}"
          data-block-id="${escapeHtml(block.id)}"
          aria-expanded="${!block.collapsed}"
          aria-label="باز و بسته کردن بخش"
        >
          <span aria-hidden="true">${block.collapsed ? '▸' : '▾'}</span>
        </button>

        <span class="vx-block__icon" aria-hidden="true">${definition.icon}</span>

        <input
          class="vx-block__title"
          data-block-input="title"
          data-note-id="${escapeHtml(noteId)}"
          data-block-id="${escapeHtml(block.id)}"
          value="${escapeHtml(block.title || '')}"
          aria-label="عنوان بخش"
          ${readOnly ? 'disabled' : ''}
        />

        <div class="vx-block__ops">
          <button class="vx-mini-btn" type="button" data-action="move-block-up"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  ${index === 0 || readOnly ? 'disabled' : ''} aria-label="بالا">↑</button>

          <button class="vx-mini-btn" type="button" data-action="move-block-down"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  ${index === total - 1 || readOnly ? 'disabled' : ''} aria-label="پایین">↓</button>

          <button class="vx-mini-btn vx-mini-btn--danger" type="button" data-action="delete-block"
                  data-note-id="${escapeHtml(noteId)}" data-block-id="${escapeHtml(block.id)}"
                  ${readOnly ? 'disabled' : ''} aria-label="حذف بخش">×</button>
        </div>
      </header>

      <div class="vx-block__body">
        ${renderBlockBody(block, { noteId, readOnly })}
      </div>
    </section>
  `;
}

export function renderBlockPicker({ noteId }) {
  return `
    <div class="vx-block-picker">
      <span class="vx-block-picker__label">افزودن بخش:</span>

      <div class="vx-block-picker__grid">
        ${Object.values(BLOCK_TYPES)
          .map(
            (definition) => `
              <button
                class="vx-block-picker__item"
                type="button"
                data-action="add-block"
                data-note-id="${escapeHtml(noteId)}"
                data-block-type="${escapeHtml(definition.key)}"
                title="${escapeHtml(definition.hint)}"
              >
                <span aria-hidden="true">${definition.icon}</span>
                ${escapeHtml(definition.label)}
              </button>
            `
          )
          .join('')}
      </div>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* یادآورها                                                            */
/* ------------------------------------------------------------------ */

function formatSnoozeLabel(minutes) {
  if (minutes < 60) return `${minutes} دقیقه بعد`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} ساعت بعد`;
  return `${Math.round(minutes / 1440)} روز بعد`;
}

export function renderRemindersSection({ note, noteId }) {
  const reminders = note.reminders || [];

  return `
    <section class="vx-section">
      <div class="vx-section__head">
        <h3>⏰ یادآورها</h3>
        <span class="vx-chip">${reminders.length}</span>
      </div>

      <div class="vx-section__body">
        ${
          reminders.length === 0
            ? '<p class="vx-hint">یادآوری برای این یادداشت تنظیم نشده است.</p>'
            : `
              <ul class="vx-reminder-list">
                ${reminders
                  .map(
                    (reminder) => `
                      <li class="vx-reminder-item ${reminder.enabled ? '' : 'is-off'}">
                        <div class="vx-reminder-item__main">
                          <strong>${escapeHtml(reminder.title || 'یادآوری')}</strong>

                          ${reminder.message ? `<p>${escapeHtml(reminder.message)}</p>` : ''}

                          <div class="vx-reminder-item__meta">
                            <span>🕒 ${escapeHtml(reminder.nextAt || reminder.at ? formatPersianDateTime(reminder.nextAt || reminder.at) : 'بدون زمان')}</span>

                            ${
                              reminder.repeat && reminder.repeat !== 'none'
                                ? `<span class="vx-chip">تکرار: ${escapeHtml(repeatLabel(reminder.repeat))}</span>`
                                : ''
                            }

                            <span class="vx-chip">${(reminder.channels || []).map((channel) => channelLabel(channel)).join(' • ')}</span>

                            ${
                              reminder.lastFiredAt
                                ? `<span class="vx-chip">آخرین ارسال: ${escapeHtml(formatRelativeTime(reminder.lastFiredAt))}</span>`
                                : ''
                            }
                          </div>
                        </div>

                        <div class="vx-reminder-item__ops">
                          <button class="vx-btn vx-btn--sm" type="button" data-action="toggle-reminder"
                                  data-note-id="${escapeHtml(noteId)}" data-reminder-id="${escapeHtml(reminder.id)}">
                            ${reminder.enabled ? 'غیرفعال' : 'فعال'}
                          </button>

                          ${[10, 30, 60, 1440]
                            .map(
                              (minutes) => `
                          <button class="vx-btn vx-btn--sm" type="button" data-action="snooze-reminder"
                                  data-note-id="${escapeHtml(noteId)}" data-reminder-id="${escapeHtml(reminder.id)}"
                                  data-minutes="${minutes}">${formatSnoozeLabel(minutes)}</button>`
                            )
                            .join('')}

                          <button class="vx-btn vx-btn--sm" type="button" data-action="fire-reminder-now"
                                  data-note-id="${escapeHtml(noteId)}" data-reminder-id="${escapeHtml(reminder.id)}">
                            تست ارسال
                          </button>

                          <button class="vx-btn vx-btn--sm vx-btn--danger" type="button" data-action="delete-reminder"
                                  data-note-id="${escapeHtml(noteId)}" data-reminder-id="${escapeHtml(reminder.id)}">حذف</button>
                        </div>
                      </li>
                    `
                  )
                  .join('')}
              </ul>
            `
        }

        <form class="vx-form vx-form--grid" data-form="add-reminder" novalidate>
          <label class="vx-form__field">
            <span class="vx-form__label">عنوان یادآور</span>
            <input class="vx-input" name="title" placeholder="مثلاً: پرداخت قسط" />
          </label>

          <label class="vx-form__field">
            <span class="vx-form__label">پیام</span>
            <input class="vx-input" name="message" placeholder="متنی که در پیامک و اعلان نمایش داده می‌شود" />
          </label>

          <label class="vx-form__field">
            <span class="vx-form__label">زمان</span>
            <input class="vx-input" type="datetime-local" name="at" required />
          </label>

          <label class="vx-form__field">
            <span class="vx-form__label">تکرار</span>
            <select class="vx-select" name="repeat">
              ${options([
                ['none', 'بدون تکرار'],
                ['hourly', 'هر ساعت'],
                ['daily', 'روزانه'],
                ['weekly', 'هفتگی'],
                ['monthly', 'ماهانه'],
              ])}
            </select>
          </label>

          <div class="vx-form__switches">
            <label class="vx-switch"><input type="checkbox" name="ch_inapp" checked /><span>اعلان درون‌برنامه</span></label>
            <label class="vx-switch"><input type="checkbox" name="ch_desktop" /><span>اعلان دسکتاپ</span></label>
            <label class="vx-switch"><input type="checkbox" name="ch_sound" /><span>صدا</span></label>
            <label class="vx-switch"><input type="checkbox" name="ch_sms" /><span>پیامک</span></label>
          </div>

          <div class="vx-form__footer">
            <button class="vx-btn vx-btn--primary" type="submit">افزودن یادآور</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function repeatLabel(repeat) {
  return { none: 'بدون تکرار', hourly: 'هر ساعت', daily: 'روزانه', weekly: 'هفتگی', monthly: 'ماهانه' }[repeat] || repeat;
}

function channelLabel(channel) {
  return { inapp: 'درون‌برنامه', desktop: 'دسکتاپ', sound: 'صدا', sms: 'پیامک' }[channel] || channel;
}

/* ------------------------------------------------------------------ */
/* ضمیمه‌ها                                                            */
/* ------------------------------------------------------------------ */

export function renderAttachmentsSection({ note, noteId, attachments }) {
  return `
    <section class="vx-section">
      <div class="vx-section__head">
        <h3>📎 ضمیمه‌ها</h3>
        <span class="vx-chip">${attachments.length}</span>
      </div>

      <div class="vx-section__body">
        <div class="vx-dropzone" data-dropzone="${escapeHtml(noteId)}">
          <input
            class="vx-dropzone__input"
            type="file"
            multiple
            data-file-input
            data-note-id="${escapeHtml(noteId)}"
            aria-label="انتخاب فایل"
          />

          <div class="vx-dropzone__content">
            <span aria-hidden="true">📂</span>
            <strong>فایل را اینجا رها کن یا کلیک کن</strong>
            <small>عکس، صوت، ویدیو، PDF یا متن — ذخیره در حافظهٔ مرورگر</small>
          </div>
        </div>

        ${
          attachments.length === 0
            ? '<p class="vx-hint">ضمیمه‌ای اضافه نشده است.</p>'
            : `
              <ul class="vx-attachment-list">
                ${attachments
                  .map(
                    (attachment) => `
                      <li class="vx-attachment" data-attachment-id="${escapeHtml(attachment.id)}">
                        ${renderAttachmentThumb(attachment)}

                        <div class="vx-attachment__main">
                          <strong title="${escapeHtml(attachment.name)}">${escapeHtml(attachment.name)}</strong>

                          <small>
                            ${escapeHtml(formatFileSize(attachment.size))} •
                            ${escapeHtml(attachment.mimeType || 'نامشخص')} •
                            ${escapeHtml(formatRelativeTime(attachment.createdAt))}
                          </small>

                          <input
                            class="vx-input vx-attachment__caption"
                            data-attachment-caption
                            data-note-id="${escapeHtml(noteId)}"
                            data-attachment-id="${escapeHtml(attachment.id)}"
                            value="${escapeHtml(attachment.caption || '')}"
                            placeholder="توضیح ضمیمه..."
                          />
                        </div>

                        <div class="vx-attachment__ops">
                          ${renderAttachmentPlayer(attachment)}

                          <button class="vx-btn vx-btn--sm" type="button" data-action="download-attachment"
                                  data-note-id="${escapeHtml(noteId)}" data-attachment-id="${escapeHtml(attachment.id)}">
                            دانلود
                          </button>

                          <button class="vx-btn vx-btn--sm vx-btn--danger" type="button" data-action="delete-attachment"
                                  data-note-id="${escapeHtml(noteId)}" data-attachment-id="${escapeHtml(attachment.id)}">
                            حذف
                          </button>
                        </div>
                      </li>
                    `
                  )
                  .join('')}
              </ul>
            `
        }
      </div>
    </section>
  `;
}

function renderAttachmentThumb(attachment) {
  if (attachment.kind === 'image') {
    return `<img class="vx-attachment__thumb" src="${escapeHtml(attachment.thumbnail || attachment.dataUrl)}" alt="${escapeHtml(attachment.name)}" loading="lazy" />`;
  }

  const icons = { audio: '🎵', video: '🎬', pdf: '📕', text: '📄', file: '📦' };

  return `<span class="vx-attachment__thumb vx-attachment__thumb--icon" aria-hidden="true">${icons[attachment.kind] || '📦'}</span>`;
}

function renderAttachmentPlayer(attachment) {
  if (attachment.kind === 'audio') {
    return `<audio class="vx-attachment__player" controls preload="none" src="${escapeHtml(attachment.dataUrl)}"></audio>`;
  }

  if (attachment.kind === 'video') {
    return `<video class="vx-attachment__player" controls preload="none" src="${escapeHtml(attachment.dataUrl)}"></video>`;
  }

  return '';
}

/* ------------------------------------------------------------------ */
/* اشتراک‌گذاری                                                        */
/* ------------------------------------------------------------------ */

export function renderShareSection({ note, noteId, targets }) {
  return `
    <section class="vx-section">
      <div class="vx-section__head">
        <h3>↗ اشتراک‌گذاری</h3>
      </div>

      <div class="vx-section__body">
        <div class="vx-share-grid">
          ${targets
            .map(
              (target) => `
                <button
                  class="vx-share-btn"
                  type="button"
                  data-action="share-note"
                  data-note-id="${escapeHtml(noteId)}"
                  data-share-target="${escapeHtml(target.id)}"
                >
                  <span aria-hidden="true">${target.icon}</span>
                  ${escapeHtml(target.label)}
                </button>
              `
            )
            .join('')}
        </div>

        <div class="vx-share-preview">
          <h4>پیش‌نمایش متن ارسالی</h4>

          <textarea class="vx-textarea" rows="6" readonly data-share-preview>${escapeHtml(note._sharePreview || '')}</textarea>
        </div>

        ${
          (note.shares || []).length > 0
            ? `
              <div class="vx-share-history">
                <h4>تاریخچهٔ اشتراک</h4>

                <ul>
                  ${note.shares
                    .slice(0, 6)
                    .map(
                      (share) => `
                        <li>
                          <span>${escapeHtml(channelLabel(share.channel) || share.channel)}</span>
                          <small>${escapeHtml(formatRelativeTime(share.sharedAt))}</small>
                        </li>
                      `
                    )
                    .join('')}
                </ul>
              </div>
            `
            : ''
        }
      </div>
    </section>
  `;
}

/* ------------------------------------------------------------------ */
/* فعالیت‌ها                                                           */
/* ------------------------------------------------------------------ */

export function renderActivitySection({ note }) {
  const activity = note.activity || [];

  return `
    <section class="vx-section">
      <div class="vx-section__head">
        <h3>🕓 تاریخچهٔ تغییرات</h3>
        <span class="vx-chip">${activity.length}</span>
      </div>

      <div class="vx-section__body">
        ${
          activity.length === 0
            ? '<p class="vx-hint">تغییری ثبت نشده است.</p>'
            : `
              <ul class="vx-activity">
                ${activity
                  .slice(0, 20)
                  .map(
                    (entry) => `
                      <li>
                        <span class="vx-activity__dot" aria-hidden="true"></span>
                        <span>${escapeHtml(entry.label || entry.type || 'تغییر')}</span>
                        <small>${escapeHtml(formatRelativeTime(entry.at))}</small>
                      </li>
                    `
                  )
                  .join('')}
              </ul>
            `
        }
      </div>
    </section>
  `;
}

/* ------------------------------------------------------------------ */
/* کشوی ویرایشگر                                                       */
/* ------------------------------------------------------------------ */

export function renderEditorDrawer({ note, noteId, ui, attachments, targets, stats }) {
  const taskStats = getTaskStats(note);

  return `
    <aside class="vx-drawer" role="dialog" aria-modal="false" aria-label="ویرایش یادداشت" data-editor="${escapeHtml(noteId)}">
      <header class="vx-drawer__head">
        <div class="vx-drawer__title">
          <h2>${escapeHtml(note.title || 'یادداشت جدید')}</h2>

          <small>
            ایجاد: ${escapeHtml(formatPersianDate(note.createdAt))} •
            ویرایش: ${escapeHtml(formatRelativeTime(note.updatedAt))}
            ${taskStats.total > 0 ? ` • ${formatNumber(taskStats.done)}/${formatNumber(taskStats.total)} وظیفه` : ''}
          </small>
        </div>

        <button class="vx-drawer__close" type="button" data-action="close-editor" aria-label="بستن">×</button>
      </header>

      <nav class="vx-drawer__tabs" role="tablist">
        ${[
          ['general', 'کلی'],
          ['blocks', `بخش‌ها (${(note.blocks || []).length})`],
          ['reminders', `یادآور (${(note.reminders || []).length})`],
          ['attachments', `ضمیمه (${attachments.length})`],
          ['share', 'اشتراک'],
          ['activity', 'تاریخچه'],
        ]
          .map(
            ([tab, label]) => `
              <button
                class="vx-drawer__tab ${ui.editorTab === tab ? 'is-active' : ''}"
                type="button"
                role="tab"
                aria-selected="${ui.editorTab === tab}"
                data-action="set-editor-tab"
                data-tab="${tab}"
              >${escapeHtml(label)}</button>
            `
          )
          .join('')}
      </nav>

      <div class="vx-drawer__body">
        ${renderEditorTab({ note, noteId, ui, attachments, targets, stats })}
      </div>

      <footer class="vx-drawer__footer">
        <button class="vx-btn vx-btn--ghost" type="button" data-action="duplicate-note" data-note-id="${escapeHtml(noteId)}">
          کپی یادداشت
        </button>

        <button class="vx-btn vx-btn--danger" type="button" data-action="trash-note" data-note-id="${escapeHtml(noteId)}">
          انتقال به زباله‌دان
        </button>

        <button class="vx-btn vx-btn--primary" type="button" data-action="save-note" data-note-id="${escapeHtml(noteId)}">
          ذخیره
        </button>
      </footer>
    </aside>
  `;
}

function formatNumber(value) {
  try {
    return new Intl.NumberFormat('fa-IR').format(value);
  } catch {
    return String(value);
  }
}

function renderEditorTab({ note, noteId, ui, attachments, targets }) {
  switch (ui.editorTab) {
    case 'blocks':
      return `
        <div class="vx-blocks">
          ${(note.blocks || [])
            .map((block, index) =>
              renderBlockCard(block, { noteId, index, total: (note.blocks || []).length })
            )
            .join('')}

          ${renderBlockPicker({ noteId })}
        </div>
      `;

    case 'reminders':
      return renderRemindersSection({ note, noteId });

    case 'attachments':
      return renderAttachmentsSection({ note, noteId, attachments });

    case 'share':
      return renderShareSection({ note, noteId, targets });

    case 'activity':
      return renderActivitySection({ note });

    case 'general':
    default:
      return renderGeneralTab({ note, noteId });
  }
}

function renderGeneralTab({ note, noteId }) {
  return `
    <form class="vx-form" data-form="note-general" novalidate>
      <label class="vx-form__field">
        <span class="vx-form__label">عنوان</span>

        <input
          class="vx-input"
          name="title"
          value="${escapeHtml(note.title || '')}"
          data-note-field="title"
          data-note-id="${escapeHtml(noteId)}"
          placeholder="عنوان یادداشت"
          maxlength="120"
        />
      </label>

      <label class="vx-form__field">
        <span class="vx-form__label">خلاصه</span>

        <input
          class="vx-input"
          name="summary"
          value="${escapeHtml(note.summary || '')}"
          data-note-field="summary"
          data-note-id="${escapeHtml(noteId)}"
          placeholder="یک جمله دربارهٔ این یادداشت"
        />
      </label>

      <div class="vx-form__row">
        <label class="vx-form__field">
          <span class="vx-form__label">دسته</span>

          <input
            class="vx-input"
            name="category"
            value="${escapeHtml(note.category || '')}"
            data-note-field="category"
            data-note-id="${escapeHtml(noteId)}"
            list="vx-note-categories"
            placeholder="مثلاً کار"
          />
        </label>

        <label class="vx-form__field">
          <span class="vx-form__label">برچسب‌ها (با کاما جدا کن)</span>

          <input
            class="vx-input"
            name="tags"
            value="${escapeHtml((note.tags || []).join(', '))}"
            data-note-field="tags"
            data-note-id="${escapeHtml(noteId)}"
            placeholder="فوری, مشتری"
          />
        </label>
      </div>

      <div class="vx-form__row">
        <label class="vx-form__field">
          <span class="vx-form__label">وضعیت</span>

          <select class="vx-select" name="status" data-note-field="status" data-note-id="${escapeHtml(noteId)}">
            ${options(NOTE_STATUSES.map((status) => [status, STATUS_LABELS[status]]), note.status)}
          </select>
        </label>

        <label class="vx-form__field">
          <span class="vx-form__label">اولویت</span>

          <select class="vx-select" name="priority" data-note-field="priority" data-note-id="${escapeHtml(noteId)}">
            ${options(NOTE_PRIORITIES.map((priority) => [priority, PRIORITY_LABELS[priority]]), note.priority)}
          </select>
        </label>

        <label class="vx-form__field">
          <span class="vx-form__label">سررسید</span>

          <input
            class="vx-input"
            type="datetime-local"
            name="dueAt"
            value="${escapeHtml(toDateTimeLocal(note.dueAt))}"
            data-note-field="dueAt"
            data-note-id="${escapeHtml(noteId)}"
          />
        </label>
      </div>

      <div class="vx-form__field">
        <span class="vx-form__label">رنگ</span>

        <div class="vx-color-picker">
          ${NOTE_COLORS.map((color) => {
            const isActive = note.color === color;

            return `
              <button
                class="vx-color-picker__item vx-color-picker__item--${color} ${isActive ? 'is-active' : ''}"
                type="button"
                data-action="set-note-color"
                data-note-id="${escapeHtml(noteId)}"
                data-color="${color}"
                aria-label="${escapeHtml(COLOR_LABELS[color] || color)}"
                title="${escapeHtml(COLOR_LABELS[color] || color)}"
              ></button>
            `;
          }).join('')}
        </div>
      </div>

      <div class="vx-form__switches">
        <label class="vx-switch">
          <input type="checkbox" data-note-field="pinned" data-note-id="${escapeHtml(noteId)}" ${note.pinned ? 'checked' : ''} />
          <span>سنجاق کردن</span>
        </label>

        <label class="vx-switch">
          <input type="checkbox" data-note-field="favorite" data-note-id="${escapeHtml(noteId)}" ${note.favorite ? 'checked' : ''} />
          <span>علاقه‌مندی</span>
        </label>

        <label class="vx-switch">
          <input type="checkbox" data-note-field="archived" data-note-id="${escapeHtml(noteId)}" ${note.archived ? 'checked' : ''} />
          <span>آرشیو</span>
        </label>
      </div>

      <datalist id="vx-note-categories">
        <option value="کار"></option>
        <option value="شخصی"></option>
        <option value="مشتری"></option>
        <option value="مالی"></option>
        <option value="ایده"></option>
        <option value="سفر"></option>
      </datalist>
    </form>
  `;
}

/* ------------------------------------------------------------------ */
/* مودال ساخت سریع (بدون بازکردن کشو)                                  */
/* ------------------------------------------------------------------ */

export function renderQuickComposer({ draft }) {
  return `
    <div class="vx-composer" role="dialog" aria-label="یادداشت سریع">
      <header class="vx-composer__head">
        <h3>یادداشت سریع</h3>

        <button class="vx-drawer__close" type="button" data-action="close-composer" aria-label="بستن">×</button>
      </header>

      <div class="vx-composer__body">
        <input
          class="vx-input"
          data-composer-field="title"
          placeholder="عنوان..."
          value="${escapeHtml(draft.title || '')}"
          autofocus
        />

        <textarea
          class="vx-textarea"
          data-composer-field="content"
          rows="3"
          placeholder="متن کوتاه... (Enter برای ذخیره، Shift+Enter برای خط جدید)"
        >${escapeHtml(draft.content || '')}</textarea>

        <div class="vx-composer__row">
          <select class="vx-select" data-composer-field="priority">
            ${options(NOTE_PRIORITIES.map((priority) => [priority, PRIORITY_LABELS[priority]]), draft.priority || 'medium')}
          </select>

          <select class="vx-select" data-composer-field="color">
            ${options(NOTE_COLORS.map((color) => [color, COLOR_LABELS[color] || color]), draft.color || 'blue')}
          </select>

          <input class="vx-input" type="datetime-local" data-composer-field="dueAt" value="${escapeHtml(toDateTimeLocal(draft.dueAt))}" />
        </div>
      </div>

      <footer class="vx-composer__footer">
        <button class="vx-btn vx-btn--ghost" type="button" data-action="open-editor">بازکردن ویرایشگر کامل</button>

        <button class="vx-btn vx-btn--primary" type="button" data-action="save-composer">ذخیره (Ctrl+Enter)</button>
      </footer>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* پالت فرمان                                                          */
/* ------------------------------------------------------------------ */

export function renderCommandPalette({ commands, activeIndex = 0, query = '' }) {
  return `
    <div class="vx-cmdk__overlay" data-command-overlay>
      <div class="vx-cmdk" role="dialog" aria-modal="true" aria-label="پالت فرمان">
        <div class="vx-cmdk__head">
          <input
            class="vx-cmdk__input"
            data-command-input
            type="search"
            placeholder="جستجوی فرمان یا یادداشت..."
            value="${escapeHtml(query)}"
            autocomplete="off"
          />

          <kbd>Esc</kbd>
        </div>

        <ul class="vx-cmdk__list" role="listbox">
          ${
            commands.length === 0
              ? '<li class="vx-cmdk__empty">فرمانی پیدا نشد.</li>'
              : commands
                  .slice(0, 14)
                  .map(
                    (command, index) => `
                      <li
                        class="vx-cmdk__item ${index === activeIndex ? 'is-active' : ''}"
                        role="option"
                        aria-selected="${index === activeIndex}"
                        data-command-id="${escapeHtml(command.id)}"
                        data-command-index="${index}"
                      >
                        <span class="vx-cmdk__icon" aria-hidden="true">${command.icon || '•'}</span>

                        <span class="vx-cmdk__text">
                          <strong>${escapeHtml(command.label)}</strong>
                          ${command.hint ? `<small>${escapeHtml(command.hint)}</small>` : ''}
                        </span>

                        ${command.shortcut ? `<kbd>${escapeHtml(command.shortcut)}</kbd>` : ''}
                      </li>
                    `
                  )
                  .join('')
          }
        </ul>
      </div>
    </div>
  `;
}

export { createBlock };
