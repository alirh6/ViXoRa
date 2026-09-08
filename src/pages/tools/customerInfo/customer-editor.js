// src/pages/tools/customerInfo/customer-editor.js

/**
 * ViXoRa — ویرایشگر مشتریان
 * ===========================
 * دو بخش:
 *   ۱) ویرایش درجا (inline): با کلیک روی هر فیلد، input جای آن می‌آید
 *      و با Enter/blur ذخیره می‌شود — بدون بازکردن مودال بزرگ.
 *   ۲) مودال‌ها: مشتری جدید (فرم بخش‌محور)، کمپین، بخش‌ها، ایمپورت،
 *      تنظیمات، نقشه، ارسال پیام.
 *
 * توابع سازندهٔ HTML خالص هستند؛ سیم‌کشی رویدادها در customerInfo.js.
 */

import { escapeHtml } from '../../../utilities/dom-utils.js';
import { formatDateInput } from '../../../utilities/formatters.js';

import {
  CUSTOMER_FIELDS,
  CUSTOMER_FIELD_MAP,
  CUSTOMER_SECTION_MAP,
  CUSTOMER_SECTIONS,
  getSectionFields,
  coerceFieldValue,
  createEmptyCustomer,
  normalizeCustomer,
  validateCustomerDraft,
  getCustomerName,
  parseCustomerTags,
} from '../../../core/schemas/customer-schema.js';

import {
  RULE_FIELDS,
  RULE_OPERATORS,
  normalizeSegment,
  describeRule,
} from '../../../core/services/segmentation-service.js';

import {
  OUTREACH_CHANNELS,
  MERGE_FIELDS,
  getOutreachTemplates,
} from '../../../core/services/outreach-service.js';

const esc = escapeHtml;

/* ================================================================== */
/* ۱) ویرایش درجا                                                      */
/* ================================================================== */

/**
 * ساخت input مناسب برای یک فیلد (برای جای‌گذاری درجا).
 * @returns {string} HTML یک input/select/textarea
 */
export function buildInlineInput(field, value, { customerId } = {}) {
  const name = `inline-${field.key}`;
  const dataAttrs = `data-field-key="${esc(field.key)}" data-customer-id="${esc(customerId || '')}" data-inline-input`;

  switch (field.type) {
    case 'select': {
      const options = (field.options || [])
        .map((option) => {
          const label = field.optionLabels?.[option] || option;
          const selected = String(value) === String(option) ? ' selected' : '';
          return `<option value="${esc(option)}"${selected}>${esc(label)}</option>`;
        })
        .join('');

      return `<select class="vci-input vci-input--inline" name="${name}" ${dataAttrs} data-autosave>${options}</select>`;
    }

    case 'checkbox': {
      const checked = value ? ' checked' : '';
      return `<label class="vci-check vci-check--inline"><input type="checkbox" name="${name}" ${dataAttrs} data-autosave${checked}><span>${value ? 'بله' : 'خیر'}</span></label>`;
    }

    case 'rating': {
      const current = Number(value) || 0;
      const stars = [1, 2, 3, 4, 5]
        .map((n) => `<button type="button" class="vci-starbtn${n <= current ? ' is-on' : ''}" data-action="set-rating" data-value="${n}" data-field-key="${esc(field.key)}" data-customer-id="${esc(customerId || '')}">★</button>`)
        .join('');
      return `<div class="vci-rating" data-rating-host>${stars}</div>`;
    }

    case 'tags': {
      const tags = Array.isArray(value) ? value.join('، ') : String(value || '');
      return `<input class="vci-input vci-input--inline" type="text" name="${name}" ${dataAttrs} data-tags-input value="${esc(tags)}" placeholder="برچسب‌ها با کاما جدا شوند">`;
    }

    case 'keyvalue': {
      const items = Array.isArray(value) ? value : [];
      const rows = items
        .map((item) => `
          <div class="vci-kvrow" data-kv-id="${esc(item.id || '')}">
            <input class="vci-input" type="text" data-kv-label value="${esc(item.label || '')}" placeholder="عنوان">
            <input class="vci-input" type="text" data-kv-value value="${esc(item.value || '')}" placeholder="مقدار">
            <button type="button" class="vci-iconbtn vci-iconbtn--sm vci-iconbtn--danger" data-action="remove-kv" data-kv-id="${esc(item.id || '')}" aria-label="حذف">✕</button>
          </div>
        `)
        .join('');

      return `
        <div class="vci-kv" data-kv-host data-field-key="${esc(field.key)}" data-customer-id="${esc(customerId || '')}">
          ${rows}
          <button type="button" class="vci-btn vci-btn--sm vci-btn--ghost" data-action="add-kv" data-field-key="${esc(field.key)}">＋ افزودن</button>
          <button type="button" class="vci-btn vci-btn--sm vci-btn--primary" data-action="save-kv" data-field-key="${esc(field.key)}" data-customer-id="${esc(customerId || '')}">ذخیره</button>
        </div>
      `;
    }

    case 'textarea':
      return `<textarea class="vci-input vci-input--inline vci-input--area" name="${name}" ${dataAttrs} rows="3">${esc(value ?? '')}</textarea>`;

    case 'number':
    case 'money':
      return `<input class="vci-input vci-input--inline" type="number" name="${name}" ${dataAttrs} value="${esc(value ?? '')}" inputmode="numeric">`;

    case 'date':
      return `<input class="vci-input vci-input--inline" type="date" name="${name}" ${dataAttrs} value="${esc(formatDateInput(value) || '')}">`;

    case 'datetime':
    case 'time':
      return `<input class="vci-input vci-input--inline" type="${field.type === 'time' ? 'time' : 'datetime-local'}" name="${name}" ${dataAttrs} value="${esc(toLocalInput(value, field.type))}">`;

    case 'nationalCode':
      return `<input class="vci-input vci-input--inline" type="text" name="${name}" ${dataAttrs} value="${esc(value ?? '')}" inputmode="numeric" maxlength="10" placeholder="کد ملی ۱۰ رقمی">`;

    case 'cardNumber':
      return `<input class="vci-input vci-input--inline" type="text" name="${name}" ${dataAttrs} value="${esc(value ?? '')}" inputmode="numeric" maxlength="19" placeholder="شماره کارت ۱۶ رقمی">`;

    case 'shaba':
      return `<input class="vci-input vci-input--inline" type="text" name="${name}" ${dataAttrs} value="${esc(value ?? '')}" placeholder="IR + ۲۴ رقم">`;

    case 'tel':
      return `<input class="vci-input vci-input--inline" type="tel" name="${name}" ${dataAttrs} value="${esc(value ?? '')}" inputmode="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹">`;

    case 'email':
      return `<input class="vci-input vci-input--inline" type="email" name="${name}" ${dataAttrs} value="${esc(value ?? '')}" dir="ltr">`;

    case 'url':
      return `<input class="vci-input vci-input--inline" type="url" name="${name}" ${dataAttrs} value="${esc(value ?? '')}" dir="ltr">`;

    case 'text':
    default:
      return `<input class="vci-input vci-input--inline" type="text" name="${name}" ${dataAttrs} value="${esc(value ?? '')}">`;
  }
}

function toLocalInput(value, type) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  if (type === 'time') {
    return date.toISOString().slice(11, 16);
  }

  // datetime-local
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

/** مقدار خام input را به مقدار فیلد تبدیل می‌کند */
export function readInlineValue(field, element) {
  if (!element) return undefined;

  switch (field.type) {
    case 'checkbox':
      return element.checked;
    case 'number':
    case 'money':
      return coerceFieldValue(field, element.value);
    case 'tags':
      return parseCustomerTags(element.value);
    case 'date':
    case 'datetime':
    case 'time':
      return element.value ? new Date(element.value).toISOString() : '';
    default:
      return coerceFieldValue(field, element.value);
  }
}

/* ================================================================== */
/* ۲) فرم بخش‌محور (مشتری جدید / ویرایش کامل)                         */
/* ================================================================== */

/**
 * فرم بخش‌محور: کاربر تیک می‌زند کدام دسته‌ها را پر کند؛
 * فیلدهای پرتکرار همیشه بازند.
 * @param {Object} options {customer, activeSections, mode}
 */
export function buildSectionForm({ customer = null, activeSections = [], mode = 'create' } = {}) {
  const source = customer ? normalizeCustomer(customer) : createEmptyCustomer();

  const frequentKeys = new Set(['firstName', 'lastName', 'mobile', 'email', 'balance', 'city']);
  const active = new Set(activeSections);

  const sectionBlocks = CUSTOMER_SECTIONS.map((section) => {
    const fields = getSectionFields(section.key);
    const isOpen = active.has(section.key);

    const fieldInputs = fields
      .map((field) => buildFormField(field, source[field.key]))
      .join('');

    return `
      <section class="vci-formsection${isOpen ? ' is-open' : ''}" data-form-section="${esc(section.key)}">
        <label class="vci-formsection__head">
          <input type="checkbox" data-action="toggle-form-section" data-section="${esc(section.key)}" ${isOpen ? 'checked' : ''}>
          <span class="vci-formsection__icon" aria-hidden="true">${esc(section.icon)}</span>
          <span class="vci-formsection__title">${esc(section.label)}</span>
          <span class="vci-formsection__desc">${esc(section.description || '')}</span>
        </label>
        <div class="vci-formsection__body">
          <div class="vci-formgrid">${fieldInputs}</div>
        </div>
      </section>
    `;
  }).join('');

  // فیلدهای پرتکرار همیشه در بالا
  const frequentFields = [...frequentKeys]
    .map((key) => CUSTOMER_FIELD_MAP[key])
    .filter(Boolean)
    .map((field) => buildFormField(field, source[field.key]))
    .join('');

  return `
    <form class="vci-form" data-customer-form data-mode="${esc(mode)}" data-customer-id="${esc(source.id || '')}">
      <div class="vci-form__frequent">
        <h4 class="vci-form__subtitle">اطلاعات اصلی</h4>
        <div class="vci-formgrid">${frequentFields}</div>
      </div>
      <h4 class="vci-form__subtitle">بخش‌های تکمیلی <span class="vci-muted">(تیک بزنید تا باز شود)</span></h4>
      ${sectionBlocks}
    </form>
  `;
}

/** یک فیلد فرم (برچسب + input) */
export function buildFormField(field, value) {
  const required = field.required ? ' data-required' : '';

  return `
    <div class="vci-formfield" data-field-key="${esc(field.key)}"${required}>
      <label class="vci-formfield__label" for="cf-${esc(field.key)}">
        ${esc(field.label)}${field.required ? ' <span class="vci-req">*</span>' : ''}
      </label>
      ${buildFormInput(field, value)}
      ${field.hint ? `<span class="vci-formfield__hint">${esc(field.hint)}</span>` : ''}
      <span class="vci-formfield__error" data-error-for="${esc(field.key)}"></span>
    </div>
  `;
}

function buildFormInput(field, value) {
  const id = `cf-${field.key}`;
  const name = field.key;

  switch (field.type) {
    case 'select': {
      const options = (field.options || [])
        .map((option) => {
          const label = field.optionLabels?.[option] || option;
          const selected = String(value) === String(option) ? ' selected' : '';
          return `<option value="${esc(option)}"${selected}>${esc(label)}</option>`;
        })
        .join('');
      return `<select class="vci-input" id="${id}" name="${name}">${options}</select>`;
    }

    case 'checkbox':
      return `<label class="vci-check"><input type="checkbox" id="${id}" name="${name}" ${value ? 'checked' : ''}><span>بله</span></label>`;

    case 'textarea':
      return `<textarea class="vci-input vci-input--area" id="${id}" name="${name}" rows="3">${esc(value ?? '')}</textarea>`;

    case 'tags':
      return `<input class="vci-input" type="text" id="${id}" name="${name}" value="${esc(Array.isArray(value) ? value.join('، ') : value || '')}" placeholder="با کاما جدا کنید">`;

    case 'rating': {
      const current = Number(value) || 0;
      return `<input class="vci-input" type="number" id="${id}" name="${name}" min="0" max="5" value="${current}">`;
    }

    case 'number':
    case 'money':
      return `<input class="vci-input" type="number" id="${id}" name="${name}" value="${esc(value ?? '')}" inputmode="numeric">`;

    case 'date':
      return `<input class="vci-input" type="date" id="${id}" name="${name}" value="${esc(formatDateInput(value) || '')}">`;

    case 'datetime':
      return `<input class="vci-input" type="datetime-local" id="${id}" name="${name}" value="${esc(toLocalInput(value, 'datetime'))}">`;

    case 'time':
      return `<input class="vci-input" type="time" id="${id}" name="${name}" value="${esc(toLocalInput(value, 'time'))}">`;

    case 'keyvalue': {
      const items = Array.isArray(value) ? value : [];
      const rows = items
        .map((item) => `
          <div class="vci-kvrow" data-kv-id="${esc(item.id || '')}">
            <input class="vci-input" type="text" data-kv-label value="${esc(item.label || '')}" placeholder="عنوان">
            <input class="vci-input" type="text" data-kv-value value="${esc(item.value || '')}" placeholder="مقدار">
          </div>
        `)
        .join('');
      return `<div class="vci-kv" data-kv-host data-field-key="${esc(field.key)}">${rows}<button type="button" class="vci-btn vci-btn--sm vci-btn--ghost" data-action="add-kv-form" data-field-key="${esc(field.key)}">＋</button></div>`;
    }

    default:
      return `<input class="vci-input" type="${esc(field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text')}" id="${id}" name="${name}" value="${esc(value ?? '')}" ${field.type === 'email' || field.type === 'url' ? 'dir="ltr"' : ''}>`;
  }
}

/** خواندن کل فرم → draft مشتری */
export function readSectionForm(formElement) {
  if (!formElement) return {};

  const draft = {};

  for (const field of CUSTOMER_FIELDS) {
    const element = formElement.querySelector(`[name="${field.key}"]`);
    if (!element) continue;

    if (field.type === 'checkbox') {
      draft[field.key] = element.checked;
      continue;
    }

    if (field.type === 'keyvalue') {
      const host = formElement.querySelector(`[data-kv-host][data-field-key="${field.key}"]`);
      draft[field.key] = host ? readKeyValue(host) : [];
      continue;
    }

    draft[field.key] = readInlineValue(field, element);
  }

  return draft;
}

function readKeyValue(host) {
  const rows = host.querySelectorAll('.vci-kvrow');

  return Array.from(rows)
    .map((row) => ({
      id: row.dataset.kvId || '',
      label: row.querySelector('[data-kv-label]')?.value || '',
      value: row.querySelector('[data-kv-value]')?.value || '',
    }))
    .filter((item) => item.label || item.value);
}

/** نمایش خطاهای اعتبارسنجی روی فرم */
export function showFormErrors(formElement, errors = {}) {
  if (!formElement) return;

  for (const element of formElement.querySelectorAll('.vci-formfield__error')) {
    element.textContent = '';
  }
  for (const element of formElement.querySelectorAll('.vci-formfield')) {
    element.classList.remove('has-error');
  }

  for (const [key, message] of Object.entries(errors)) {
    const errorEl = formElement.querySelector(`[data-error-for="${key}"]`);
    if (errorEl) errorEl.textContent = message;

    const fieldEl = formElement.querySelector(`.vci-formfield[data-field-key="${key}"]`);
    if (fieldEl) fieldEl.classList.add('has-error');
  }
}

/* ================================================================== */
/* ۳) مودال: کمپین گروهی                                               */
/* ================================================================== */

export function buildCampaignForm({ customerCount = 0, customers = [] } = {}) {
  const channels = OUTREACH_CHANNELS.map(
    (channel) => `<option value="${esc(channel.key)}">${esc(channel.icon)} ${esc(channel.label)}</option>`
  ).join('');

  const templates = getOutreachTemplates()
    .map((template) => `<option value="${esc(template.id)}">${esc(template.name)}</option>`)
    .join('');

  const mergeButtons = MERGE_FIELDS.map(
    (field) => `<button type="button" class="vci-mergebtn" data-action="insert-merge" data-merge="{${esc(field.key)}}">{${esc(field.key)}}</button>`
  ).join('');

  return `
    <form class="vci-campaignform" data-campaign-form>
      <p class="vci-muted">ارسال به <strong>${customerCount}</strong> مشتری انتخاب‌شده.</p>

      <div class="vci-formfield">
        <label class="vci-formfield__label">قالب آماده</label>
        <select class="vci-input" data-action="load-template">${templates}</select>
      </div>

      <div class="vci-formfield">
        <label class="vci-formfield__label">کانال</label>
        <select class="vci-input" name="channel" data-campaign-channel>${channels}</select>
      </div>

      <div class="vci-formfield">
        <label class="vci-formfield__label">عنوان (برای ایمیل/نوتیفیکیشن)</label>
        <input class="vci-input" type="text" name="subject" data-campaign-subject>
      </div>

      <div class="vci-formfield">
        <label class="vci-formfield__label">متن پیام</label>
        <textarea class="vci-input vci-input--area" name="text" data-campaign-text rows="4" placeholder="مثال: {name} عزیز، …"></textarea>
        <div class="vci-mergebar">${mergeButtons}</div>
      </div>

      <div class="vci-formfield">
        <label class="vci-check">
          <input type="checkbox" name="scheduled" data-campaign-scheduled>
          <span>زمان‌بندی‌شده ارسال شود</span>
        </label>
        <input class="vci-input" type="datetime-local" name="scheduledFor" data-campaign-schedule-for style="margin-top:8px">
      </div>

      <div class="vci-campaignpreview" data-campaign-preview>
        <span class="vci-muted">پیش‌نمایش برای اولین مشتری:</span>
        <p data-preview-text>—</p>
      </div>
    </form>
  `;
}

/* ================================================================== */
/* ۴) مودال: بخش‌ها (segment builder)                                  */
/* ================================================================== */

export function buildSegmentsManager({ segments = [] } = {}) {
  const list = segments.length
    ? segments
        .map((segment) => `
          <div class="vci-segitem" data-segment-id="${esc(segment.id)}">
            <div class="vci-segitem__main">
              <strong>${esc(segment.icon || '🎯')} ${esc(segment.name)}</strong>
              <span class="vci-muted">${esc(describeRuleList(segment))}</span>
            </div>
            <div class="vci-segitem__actions">
              <button type="button" class="vci-iconbtn vci-iconbtn--sm" data-action="edit-segment" data-segment-id="${esc(segment.id)}" aria-label="ویرایش">✎</button>
              <button type="button" class="vci-iconbtn vci-iconbtn--sm vci-iconbtn--danger" data-action="delete-segment" data-segment-id="${esc(segment.id)}" aria-label="حذف">✕</button>
            </div>
          </div>
        `)
        .join('')
    : '<p class="vci-muted">هنوز بخشی نساخته‌اید.</p>';

  return `
    <div class="vci-segments" data-segments-manager>
      <div class="vci-segments__list">${list}</div>
      <button type="button" class="vci-btn vci-btn--primary" data-action="new-segment">＋ بخش جدید</button>
    </div>
  `;
}

function describeRuleList(segment) {
  const rules = (segment.rules || []).map(describeRule).filter(Boolean);
  if (rules.length === 0) return 'بدون شرط';
  return rules.join(segment.matcher === 'any' ? ' یا ' : ' و ');
}

/** فرم ساخت/ویرایش یک بخش */
export function buildSegmentForm({ segment = null } = {}) {
  const source = segment
    ? normalizeSegment(segment)
    : normalizeSegment({ name: '', rules: [{ field: 'city', operator: 'eq', value: '' }] });

  const fieldOptions = RULE_FIELDS.map(
    (field) => `<option value="${esc(field.key)}">${esc(field.label)}</option>`
  ).join('');

  const operatorOptions = RULE_OPERATORS.map(
    (op) => `<option value="${esc(op.key)}">${esc(op.label)}</option>`
  ).join('');

  const ruleRows = (source.rules || [])
    .map((rule, index) => buildSegmentRuleRow(rule, index, fieldOptions, operatorOptions))
    .join('');

  return `
    <form class="vci-segform" data-segment-form data-segment-id="${esc(source.id)}">
      <div class="vci-formfield">
        <label class="vci-formfield__label">نام بخش</label>
        <input class="vci-input" type="text" name="name" value="${esc(source.name)}" placeholder="مثلاً: مشتریان تهران">
      </div>

      <div class="vci-formfield">
        <label class="vci-check">
          <input type="checkbox" name="matcher" ${source.matcher === 'any' ? 'checked' : ''} data-segment-matcher>
          <span>حداقل یک شرط کافی است (OR) — در غیر این صورت همهٔ شرط‌ها (AND)</span>
        </label>
      </div>

      <div class="vci-segrules" data-seg-rules>${ruleRows}</div>

      <button type="button" class="vci-btn vci-btn--ghost vci-btn--sm" data-action="add-seg-rule">＋ افزودن شرط</button>

      <template data-rule-template>
        ${buildSegmentRuleRow({ id: '', field: 'city', operator: 'eq', value: '' }, '__INDEX__', fieldOptions, operatorOptions)}
      </template>
    </form>
  `;
}

function buildSegmentRuleRow(rule, index, fieldOptions, operatorOptions) {
  const fields = fieldOptions.replace(`value="${rule.field}"`, `value="${rule.field}" selected`);
  const ops = operatorOptions.replace(`value="${rule.operator}"`, `value="${rule.operator}" selected`);

  const needsValue = RULE_OPERATORS.find((op) => op.key === rule.operator)?.needsValue !== false;

  return `
    <div class="vci-segrule" data-rule-index="${index}">
      <select class="vci-input" data-seg-field>${fields}</select>
      <select class="vci-input" data-seg-operator>${ops}</select>
      <input class="vci-input" type="text" data-seg-value value="${esc(rule.value ?? '')}" placeholder="مقدار" ${needsValue ? '' : 'disabled'}>
      <button type="button" class="vci-iconbtn vci-iconbtn--sm vci-iconbtn--danger" data-action="remove-seg-rule" data-rule-index="${index}" aria-label="حذف">✕</button>
    </div>
  `;
}

/** خواندن فرم بخش → آبجکت segment */
export function readSegmentForm(formElement) {
  if (!formElement) return null;

  const name = formElement.querySelector('[name="name"]')?.value || 'بخش جدید';
  const matcher = formElement.querySelector('[data-segment-matcher]')?.checked ? 'any' : 'all';

  const rules = Array.from(formElement.querySelectorAll('.vci-segrule')).map((row) => ({
    field: row.querySelector('[data-seg-field]')?.value || '',
    operator: row.querySelector('[data-seg-operator]')?.value || 'eq',
    value: row.querySelector('[data-seg-value]')?.value || '',
    enabled: true,
  }));

  const id = formElement.dataset.segmentId || undefined;

  return normalizeSegment({ id, name, matcher, rules });
}

/* ================================================================== */
/* ۵) مودال: ایمپورت                                                   */
/* ================================================================== */

export function buildImportForm() {
  return `
    <div class="vci-import" data-import-form>
      <p class="vci-muted">یک فایل CSV یا JSON انتخاب کنید، یا محتوا را بچسبانید. سرستون‌های فارسی/انگلیسی به‌طور خودکار شناسایی می‌شوند.</p>

      <label class="vci-dropzone" data-import-dropzone>
        <input type="file" accept=".csv,.json,.txt" data-import-file hidden>
        <span class="vci-dropzone__icon" aria-hidden="true">📄</span>
        <span>فایل را اینجا بکشید یا کلیک کنید</span>
      </label>

      <textarea class="vci-input vci-input--area" data-import-text rows="6" placeholder="یا محتوای CSV را اینجا بچسبانید…"></textarea>

      <div class="vci-import__actions">
        <button type="button" class="vci-btn vci-btn--primary" data-action="import-preview">پیش‌نمایش</button>
      </div>

      <div class="vci-import__preview" data-import-preview></div>
    </div>
  `;
}

/* ================================================================== */
/* ۶) مودال: تنظیمات                                                   */
/* ================================================================== */

export function buildSettingsForm({ settings = {} } = {}) {
  return `
    <form class="vci-settingsform" data-settings-form>
      <div class="vci-formfield">
        <label class="vci-formfield__label">نام برند (در پیام‌ها)</label>
        <input class="vci-input" type="text" name="brandName" value="${esc(settings.brandName || 'ViXoRa')}">
      </div>
      <div class="vci-formfield">
        <label class="vci-formfield__label">کد کشور</label>
        <input class="vci-input" type="text" name="countryCode" value="${esc(settings.countryCode || '98')}" maxlength="4">
      </div>
      <div class="vci-formfield">
        <label class="vci-formfield__label">آدرس وب‌هوک (اختیاری)</label>
        <input class="vci-input" type="url" name="webhookUrl" value="${esc(settings.webhookUrl || '')}" dir="ltr" placeholder="https://api.example.com/sms">
      </div>
      <div class="vci-formfield">
        <label class="vci-formfield__label">کلید API وب‌هوک</label>
        <input class="vci-input" type="text" name="webhookApiKey" value="${esc(settings.webhookApiKey || '')}" dir="ltr">
      </div>
      <div class="vci-formfield">
        <label class="vci-formfield__label">اندازهٔ صفحه</label>
        <input class="vci-input" type="number" name="pageSize" value="${esc(settings.pageSize || 24)}" min="6" max="200">
      </div>
    </form>
  `;
}

/* ================================================================== */
/* ۷) مودال: نقشه                                                      */
/* ================================================================== */

export function buildMapPicker({ lat = '', lng = '', address = '' } = {}) {
  return `
    <div class="vci-mappicker" data-map-picker>
      <div class="vci-mappicker__search">
        <input class="vci-input" type="text" data-map-query value="${esc(address)}" placeholder="جستجوی آدرس یا شهر…">
        <button type="button" class="vci-btn vci-btn--primary" data-action="map-search">جستجو</button>
        <button type="button" class="vci-btn vci-btn--ghost" data-action="map-locate" title="موقعیت من">📍</button>
      </div>

      <div class="vci-mappicker__results" data-map-results></div>

      <div class="vci-mappicker__map" data-map-canvas>
        <div class="vci-mappicker__hint">روی نقشه کلیک کنید یا مختصات را دستی وارد کنید.</div>
      </div>

      <div class="vci-mappicker__coords">
        <label class="vci-field-inline">
          <span>عرض جغرافیایی</span>
          <input class="vci-input" type="text" data-map-lat value="${esc(lat)}" dir="ltr">
        </label>
        <label class="vci-field-inline">
          <span>طول جغرافیایی</span>
          <input class="vci-input" type="text" data-map-lng value="${esc(lng)}" dir="ltr">
        </label>
        <button type="button" class="vci-btn vci-btn--ghost" data-action="map-apply-coords">اعمال</button>
      </div>

      <div class="vci-mappicker__address">
        <label class="vci-formfield__label">آدرس (قابل ویرایش)</label>
        <textarea class="vci-input vci-input--area" data-map-address rows="2">${esc(address)}</textarea>
      </div>
    </div>
  `;
}

/* ================================================================== */
/* ۸) مودال: ارسال پیام شخصی                                          */
/* ================================================================== */

export function buildMessageForm({ customer = null, mode = 'message' } = {}) {
  const source = customer ? normalizeCustomer(customer) : createEmptyCustomer();

  const channels = OUTREACH_CHANNELS.map(
    (channel) => `<option value="${esc(channel.key)}"${channel.key === (mode === 'notify' ? 'push' : 'sms') ? ' selected' : ''}>${esc(channel.icon)} ${esc(channel.label)}</option>`
  ).join('');

  const templates = getOutreachTemplates()
    .map((template) => `<option value="${esc(template.id)}">${esc(template.name)}</option>`)
    .join('');

  const mergeButtons = MERGE_FIELDS.map(
    (field) => `<button type="button" class="vci-mergebtn" data-action="insert-merge" data-merge="{${esc(field.key)}}">{${esc(field.key)}}</button>`
  ).join('');

  return `
    <form class="vci-messageform" data-message-form data-customer-id="${esc(source.id)}">
      <div class="vci-messageform__to">
        ${esc(getCustomerName(source))}
        ${source.mobile ? `<span class="vci-muted" dir="ltr">${esc(source.mobile)}</span>` : ''}
      </div>

      <div class="vci-formfield">
        <label class="vci-formfield__label">قالب</label>
        <select class="vci-input" data-action="load-template">${templates}</select>
      </div>

      <div class="vci-formfield">
        <label class="vci-formfield__label">کانال</label>
        <select class="vci-input" name="channel" data-message-channel>${channels}</select>
      </div>

      <div class="vci-formfield">
        <label class="vci-formfield__label">عنوان</label>
        <input class="vci-input" type="text" name="subject" data-message-subject>
      </div>

      <div class="vci-formfield">
        <label class="vci-formfield__label">متن</label>
        <textarea class="vci-input vci-input--area" name="text" data-message-text rows="4"></textarea>
        <div class="vci-mergebar">${mergeButtons}</div>
      </div>

      <div class="vci-formfield">
        <label class="vci-check">
          <input type="checkbox" name="scheduled" data-message-scheduled>
          <span>زمان‌بندی‌شده</span>
        </label>
        <input class="vci-input" type="datetime-local" name="scheduledFor" data-message-schedule-for style="margin-top:8px">
      </div>
    </form>
  `;
}
