// src/pages/tools/customerInfo/customer-renderers.js

/**
 * ViXoRa — رندرکننده‌های فضای کاری مشتریان
 * ===========================================
 * توابع خالص: ورودی → رشتهٔ HTML. همه با escapeHtml ایمن شده‌اند.
 * prefix: vci- (اختصاصی) + vx- (کیت مشترک: مودال/توست)
 */

import { escapeHtml } from '../../../utilities/dom-utils.js';
import {
  formatCurrency,
  formatCompactNumber,
  formatNumber,
  formatRelativeTime,
  formatPersianDate,
  formatPersianDateTime,
} from '../../../utilities/formatters.js';

import {
  getCustomerName,
  getInitials,
  getAvatarColor,
  getCustomerStats,
  getCustomerPreview,
  getAge,
  getAgeRange,
  getBalanceRange,
  CUSTOMER_STATUS_LABELS,
  ACCOUNT_TYPE_LABELS,
  LOYALTY_TIER_LABELS,
  GENDER_LABELS,
  AGE_RANGE_LABELS,
  BALANCE_RANGE_LABELS,
  CUSTOMER_FIELDS,
  CUSTOMER_FIELD_MAP,
} from '../../../core/schemas/customer-schema.js';

import {
  SMART_BUCKETS,
  BUCKET_GROUPS,
  getSavedSegments,
  describeRule,
} from '../../../core/services/segmentation-service.js';

import {
  VIEW_META,
  TABLE_COLUMNS,
  getVisibleColumnDefs,
  SORT_OPTIONS,
  GROUP_OPTIONS,
  VIEW_OPTIONS,
  QUERY_SCOPES,
  PROFILE_TABS,
  HEADER_ACTION_META,
} from './customer-state.js';

/* ================================================================== */
/* هلپرهای کوچک                                                        */
/* ================================================================== */

const esc = escapeHtml;

function attr(value) {
  return esc(value ?? '');
}

function classList(...parts) {
  return parts.filter(Boolean).join(' ');
}

const AVATAR_COLORS = ['violet', 'blue', 'emerald', 'amber', 'rose', 'slate'];

/* ================================================================== */
/* آواتار — قاب شیک + گرادیان initials                                 */
/* ================================================================== */

export function renderAvatar(customer, { size = 44, ring = true, editable = false } = {}) {
  const name = getCustomerName(customer);
  const initials = getInitials(customer);
  const color = getAvatarColor(customer);
  const avatarUrl = String(customer?.avatar || '').trim();

  const style = `--vci-avatar-size:${size}px`;

  const inner = avatarUrl
    ? `<img class="vci-avatar__img" src="${attr(avatarUrl)}" alt="${attr(name)}" loading="lazy" referrerpolicy="no-referrer">`
    : `<span class="vci-avatar__initials" aria-hidden="true">${esc(initials)}</span>`;

  const badge = editable
    ? `<button class="vci-avatar__edit" type="button" data-action="edit-avatar" data-customer-id="${attr(customer?.id)}" aria-label="تغییر عکس" title="تغییر عکس پروفایل">📷</button>`
    : '';

  return `
    <div class="${classList('vci-avatar', `vci-avatar--${color}`, ring && 'vci-avatar--ring')}" style="${style}" title="${attr(name)}">
      ${inner}
      ${badge}
    </div>
  `;
}

/* ================================================================== */
/* برچسب وضعیت / نوع حساب / سطح                                        */
/* ================================================================== */

export function renderStatusPill(status) {
  const label = CUSTOMER_STATUS_LABELS[status] || status || 'نامشخص';
  return `<span class="vci-pill vci-pill--status vci-pill--${esc(status || 'unknown')}">${esc(label)}</span>`;
}

export function renderAccountPill(accountType) {
  const label = ACCOUNT_TYPE_LABELS[accountType] || accountType || '';
  if (!label) return '';
  return `<span class="vci-pill vci-pill--account vci-pill--acct-${esc(accountType || 'normal')}">${esc(label)}</span>`;
}

export function renderTierPill(tier) {
  if (!tier || tier === 'none') return '';
  const label = LOYALTY_TIER_LABELS[tier] || tier;
  return `<span class="vci-pill vci-pill--tier vci-pill--tier-${esc(tier)}">${esc(label)}</span>`;
}

function renderTagChips(tags = [], limit = 3) {
  const list = Array.isArray(tags) ? tags.slice(0, limit) : [];
  if (list.length === 0) return '';

  return `<span class="vci-chips">${list.map((tag) => `<span class="vci-chip">${esc(tag)}</span>`).join('')}</span>`;
}

/* ================================================================== */
/* قالب‌بندی مقدار فیلد برای نمایش                                     */
/* ================================================================== */

export function formatFieldValue(field, value) {
  if (value === null || value === undefined || value === '') return '';

  switch (field?.type) {
    case 'money':
      return formatCurrency(value, 'IRR');
    case 'number':
      return formatNumber(value);
    case 'date':
      return formatPersianDate(value);
    case 'datetime':
      return formatPersianDateTime(value);
    case 'select': {
      const labels = field.optionLabels || {};
      return labels[value] || value;
    }
    case 'checkbox':
      return value ? 'بله' : 'خیر';
    case 'rating':
      return '★'.repeat(Number(value) || 0) || '—';
    case 'tags':
      return Array.isArray(value) ? value.join('، ') : String(value);
    case 'keyvalue':
      return Array.isArray(value)
        ? value.map((item) => `${item.label}: ${item.value}`).join(' | ')
        : String(value);
    default:
      return String(value);
  }
}

/* ================================================================== */
/* هدر                                                                */
/* ================================================================== */

export function renderHeader({ ui, headerConfig, stats, unread = 0 } = {}) {
  const actions = (headerConfig?.actions || [])
    .filter((action) => HEADER_ACTION_META[action?.id])
    .map((action) => {
      const meta = HEADER_ACTION_META[action.id];
      const variant = action.variant ? ` vci-hbtn--${action.variant}` : '';

      return `
        <button class="vci-hbtn${variant}" type="button"
          data-action="header-action" data-header-action-id="${attr(action.id)}"
          title="${attr(meta.label)}">
          <span class="vci-hbtn__icon" aria-hidden="true">${esc(meta.icon)}</span>
          <span class="vci-hbtn__label">${esc(meta.label)}</span>
        </button>
      `;
    })
    .join('');

  const total = stats?.total ?? 0;

  return `
    <header class="${classList('vci-header', headerConfig?.pinned && 'is-pinned')}">
      <div class="vci-header__brand">
        <div class="vci-header__logo" aria-hidden="true">👥</div>
        <div class="vci-header__titles">
          <h1 class="vci-header__title">اطلاعات مشتریان</h1>
          <p class="vci-header__subtitle">
            <strong>${formatNumber(total)}</strong> مشتری
            ${stats?.birthdaysToday ? ` · 🎂 ${formatNumber(stats.birthdaysToday)} تولد امروز` : ''}
            ${stats?.openCarts ? ` · 🛒 ${formatNumber(stats.openCarts)} سبد باز` : ''}
          </p>
        </div>
      </div>

      <div class="vci-header__actions">
        <button class="vci-iconbtn" type="button" data-action="toggle-command" title="پالت فرمان (Ctrl+K)" aria-label="پالت فرمان">
          <span aria-hidden="true">⌘</span>
        </button>
        <button class="vci-iconbtn" type="button" data-action="toggle-theme" title="تغییر پوسته" aria-label="تغییر پوسته">
          <span aria-hidden="true">${ui?.theme === 'light' ? '🌙' : '☀️'}</span>
        </button>
        ${actions}
      </div>
    </header>
  `;
}

/* ================================================================== */
/* نوار ابزار                                                          */
/* ================================================================== */

export function renderToolbar({ ui, resultCount, totalCount } = {}) {
  const viewButtons = VIEW_OPTIONS.map((view) => `
    <button class="${classList('vci-viewbtn', ui.view === view.key && 'is-active')}" type="button"
      data-action="set-view" data-view="${attr(view.key)}" title="${attr(view.label)}" aria-label="${attr(view.label)}"
      ${ui.view === view.key ? 'aria-pressed="true"' : ''}>
      <span aria-hidden="true">${esc(view.icon)}</span>
    </button>
  `).join('');

  const sortOptions = SORT_OPTIONS.map(
    (option) => `<option value="${attr(option.key)}" ${ui.sort === option.key ? 'selected' : ''}>${esc(option.label)}</option>`
  ).join('');

  const groupOptions = GROUP_OPTIONS.map(
    (option) => `<option value="${attr(option.key)}" ${ui.groupBy === option.key ? 'selected' : ''}>${esc(option.label)}</option>`
  ).join('');

  const scopeOptions = QUERY_SCOPES.map(
    (scope) => `<option value="${attr(scope.key)}" ${ui.queryScope === scope.key ? 'selected' : ''}>${esc(scope.label)}</option>`
  ).join('');

  return `
    <div class="vci-toolbar">
      <div class="vci-toolbar__search">
        <span class="vci-toolbar__searchicon" aria-hidden="true">🔍</span>
        <input class="vci-toolbar__input" type="search" data-action="search"
          placeholder="جستجو در نام، موبایل، ایمیل، شهر، برچسب…"
          value="${attr(ui.query)}" aria-label="جستجوی مشتری" autocomplete="off">
        <select class="vci-toolbar__scope" data-action="set-scope" aria-label="محدودهٔ جستجو">${scopeOptions}</select>
      </div>

      <div class="vci-toolbar__group">
        <label class="vci-field-inline">
          <span>مرتب‌سازی</span>
          <select data-action="set-sort">${sortOptions}</select>
        </label>
        <button class="vci-iconbtn vci-iconbtn--sm" type="button" data-action="toggle-sort-dir"
          title="جهت مرتب‌سازی" aria-label="جهت مرتب‌سازی">
          <span aria-hidden="true">${ui.sortDirection === 'asc' ? '↑' : '↓'}</span>
        </button>
        <label class="vci-field-inline">
          <span>گروه‌بندی</span>
          <select data-action="set-group">${groupOptions}</select>
        </label>
      </div>

      <div class="vci-toolbar__views" role="group" aria-label="انتخاب نما">${viewButtons}</div>

      <div class="vci-toolbar__meta">
        <button class="vci-textbtn" type="button" data-action="toggle-filter" ${ui.isFilterOpen ? 'aria-pressed="true"' : ''}>
          🎚 فیلتر پیشرفته ${ui.quickRules?.length ? `<span class="vci-badge">${ui.quickRules.length}</span>` : ''}
        </button>
        <span class="vci-toolbar__count">${formatNumber(resultCount)} از ${formatNumber(totalCount)}</span>
      </div>
    </div>
  `;
}

/* ================================================================== */
/* پنل فیلتر پیشرفته (rule builder)                                    */
/* ================================================================== */

export function renderFilterPanel({ ui, ruleFields } = {}) {
  const rules = ui.quickRules || [];

  const ruleRows = rules
    .map((rule, index) => {
      const fieldOptions = ruleFields
        .map((field) => `<option value="${attr(field.key)}" ${rule.field === field.key ? 'selected' : ''}>${esc(field.label)}</option>`)
        .join('');

      return `
        <div class="vci-rule" data-rule-index="${index}">
          <select class="vci-rule__field" data-action="rule-field" data-rule-index="${index}">${fieldOptions}</select>
          <select class="vci-rule__op" data-action="rule-operator" data-rule-index="${index}">
            ${renderOperatorOptions(rule.operator)}
          </select>
          <input class="vci-rule__value" type="text" data-action="rule-value" data-rule-index="${index}"
            value="${attr(rule.value)}" placeholder="مقدار">
          <button class="vci-iconbtn vci-iconbtn--sm vci-iconbtn--danger" type="button"
            data-action="remove-rule" data-rule-index="${index}" aria-label="حذف شرط">✕</button>
        </div>
      `;
    })
    .join('');

  return `
    <div class="vci-filter">
      <div class="vci-filter__head">
        <span>شرط‌های فیلتر</span>
        <label class="vci-toggle">
          <input type="checkbox" data-action="set-matcher" ${ui.quickMatcher === 'any' ? 'checked' : ''}>
          <span>حداقل یک شرط (OR)</span>
        </label>
      </div>
      <div class="vci-filter__rules">${ruleRows || '<p class="vci-muted">شرطی اضافه نشده. روی «افزودن شرط» بزنید.</p>'}</div>
      <div class="vci-filter__actions">
        <button class="vci-btn vci-btn--ghost" type="button" data-action="add-rule">＋ افزودن شرط</button>
        <button class="vci-btn vci-btn--ghost" type="button" data-action="clear-rules">پاک کردن</button>
      </div>
    </div>
  `;
}

function renderOperatorOptions(selected) {
  const operators = [
    ['eq', 'برابر با'],
    ['neq', 'مخالف با'],
    ['contains', 'شامل متن'],
    ['not-contains', 'شامل متن نباشد'],
    ['gt', 'بزرگ‌تر از'],
    ['gte', 'بزرگ‌تر یا مساوی'],
    ['lt', 'کوچک‌تر از'],
    ['lte', 'کوچک‌تر یا مساوی'],
    ['between', 'بین دو مقدار'],
    ['has', 'پر است'],
    ['empty', 'خالی است'],
  ];

  return operators
    .map(([key, label]) => `<option value="${key}" ${selected === key ? 'selected' : ''}>${esc(label)}</option>`)
    .join('');
}

/* ================================================================== */
/* سایدبار: سطل‌ها + بخش‌ها + آمار                                     */
/* ================================================================== */

export function renderSidebar({ ui, bucketCounts, segmentCounts, stats } = {}) {
  const groups = {};

  for (const bucket of SMART_BUCKETS) {
    const groupKey = bucket.group || 'main';
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(bucket);
  }

  const bucketHtml = (bucket) => {
    const count = bucketCounts?.[bucket.key] ?? 0;
    const isActive = ui.bucket === bucket.key;

    return `
      <button class="${classList('vci-bucket', isActive && 'is-active')}" type="button"
        data-action="set-bucket" data-bucket="${attr(bucket.key)}" ${isActive ? 'aria-current="true"' : ''}>
        <span class="vci-bucket__icon" aria-hidden="true">${esc(bucket.icon)}</span>
        <span class="vci-bucket__label">${esc(bucket.label)}</span>
        <span class="vci-bucket__count">${formatNumber(count)}</span>
      </button>
    `;
  };

  const mainBuckets = (groups.main || []).map(bucketHtml).join('');

  const groupedBuckets = Object.entries(groups)
    .filter(([key]) => key !== 'main')
    .map(([key, buckets]) => `
      <div class="vci-bucketgroup">
        <h4 class="vci-bucketgroup__title">${esc(BUCKET_GROUPS[key] || key)}</h4>
        ${buckets.map(bucketHtml).join('')}
      </div>
    `)
    .join('');

  // بخش‌های سفارشی
  const segments = getSavedSegments();
  const segmentsHtml = segments.length
    ? segments
        .map((segment) => {
          const isActive = ui.activeSegmentId === segment.id;
          const count = segmentCounts?.[segment.id] ?? 0;

          return `
            <button class="${classList('vci-segment', isActive && 'is-active')}" type="button"
              data-action="set-segment" data-segment-id="${attr(segment.id)}" ${isActive ? 'aria-current="true"' : ''}>
              <span class="vci-segment__icon" aria-hidden="true">${esc(segment.icon || '🎯')}</span>
              <span class="vci-segment__label">${esc(segment.name)}</span>
              <span class="vci-segment__count">${formatNumber(count)}</span>
            </button>
          `;
        })
        .join('')
    : '<p class="vci-muted vci-sidebar__empty">بخش سفارشی ندارید. از «بخش‌ها» بسازید.</p>';

  const completeness = stats?.averageCompleteness ?? 0;

  return `
    <aside class="${classList('vci-sidebar', !ui.isSidebarOpen && 'is-collapsed')}">
      <div class="vci-sidebar__scroll">
        <nav class="vci-buckets" aria-label="سطل‌های مشتری">
          ${mainBuckets}
          ${groupedBuckets}
        </nav>

        <section class="vci-sidebar__section">
          <div class="vci-sidebar__sectionhead">
            <h3>بخش‌های سفارشی</h3>
            <button class="vci-iconbtn vci-iconbtn--sm" type="button" data-action="open-segments" title="مدیریت بخش‌ها" aria-label="مدیریت بخش‌ها">＋</button>
          </div>
          ${segmentsHtml}
        </section>

        <section class="vci-sidebar__section vci-sidebar__stats">
          <h3>کیفیت داده</h3>
          <div class="vci-meter">
            <div class="vci-meter__bar"><span style="width:${completeness}%"></span></div>
            <span class="vci-meter__label">${formatNumber(completeness)}٪ کامل</span>
          </div>
          <ul class="vci-statlist">
            <li><span>با موبایل</span><strong>${formatNumber(stats?.withMobile ?? 0)}</strong></li>
            <li><span>با ایمیل</span><strong>${formatNumber(stats?.withEmail ?? 0)}</strong></li>
            <li><span>با موقعیت</span><strong>${formatNumber(stats?.withLocation ?? 0)}</strong></li>
            <li><span>زیر ۱۸ سال</span><strong>${formatNumber(stats?.minors ?? 0)}</strong></li>
          </ul>
        </section>
      </div>
    </aside>
  `;
}

/* ================================================================== */
/* نمای جدول                                                           */
/* ================================================================== */

export function renderTableView({ customers, ui, columns } = {}) {
  const defs = getVisibleColumnDefs(columns || ui.visibleColumns);

  const headCells = defs
    .map((column) => {
      const sortable = column.sortable ? ' data-action="sort-column" data-sort-key="' + attr(column.key) + '"' : '';
      const isSorted = ui.sort === column.key;

      return `
        <th class="vci-th vci-th--${attr(column.key)}${column.align ? ' is-' + column.align : ''}"
          style="--vci-col-w:${attr(column.width)}" scope="col" ${sortable ? 'role="button" tabindex="0"' : ''} ${sortable}>
          <span class="vci-th__label">${esc(column.label)}</span>
          ${isSorted ? `<span class="vci-th__arrow" aria-hidden="true">${ui.sortDirection === 'asc' ? '↑' : '↓'}</span>` : ''}
        </th>
      `;
    })
    .join('');

  const rows = customers
    .map((customer) => {
      const cells = defs
        .map((column) => `<td class="vci-td vci-td--${attr(column.key)}${column.align ? ' is-' + column.align : ''}">${renderTableCell(customer, column, ui)}</td>`)
        .join('');

      const isSelected = ui.selectedIds?.includes(customer.id);

      return `
        <tr class="${classList('vci-row', isSelected && 'is-selected', customer.favorite && 'is-favorite', customer.trashed && 'is-trashed')}"
          data-customer-id="${attr(customer.id)}" tabindex="0">
          ${cells}
        </tr>
      `;
    })
    .join('');

  return `
    <div class="vci-tablewrap">
      <table class="vci-table">
        <thead><tr>${headCells}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderTableCell(customer, column, ui) {
  switch (column.key) {
    case 'avatar':
      return `<div class="vci-cell-avatar">
        <label class="vci-check" title="انتخاب">
          <input type="checkbox" data-action="toggle-select" data-customer-id="${attr(customer.id)}" ${ui.selectedIds?.includes(customer.id) ? 'checked' : ''}>
        </label>
        <button class="vci-cell-avatar__btn" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">
          ${renderAvatar(customer, { size: 36, ring: false })}
        </button>
      </div>`;

    case 'name':
      return `
        <button class="vci-cell-name" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">
          <span class="vci-cell-name__text">${esc(getCustomerName(customer))}</span>
          ${customer.favorite ? '<span class="vci-cell-name__star" aria-hidden="true">★</span>' : ''}
          ${customer.blocked ? '<span class="vci-cell-name__blocked" title="مسدود">🚫</span>' : ''}
          <span class="vci-cell-name__sub">${esc(getCustomerPreview(customer))}</span>
        </button>`;

    case 'mobile':
      return customer.mobile
        ? `<a class="vci-cell-link" href="tel:${attr(customer.mobile)}" data-action="stop">${esc(customer.mobile)}</a>`
        : '<span class="vci-muted">—</span>';

    case 'email':
      return customer.email
        ? `<a class="vci-cell-link" href="mailto:${attr(customer.email)}" data-action="stop">${esc(customer.email)}</a>`
        : '<span class="vci-muted">—</span>';

    case 'city':
      return customer.city ? esc(customer.city) : '<span class="vci-muted">—</span>';

    case 'balance': {
      const value = Number(customer.balance || 0);
      const tone = value < 0 ? 'neg' : value > 0 ? 'pos' : 'zero';
      return `<span class="vci-money vci-money--${tone}">${formatCurrency(value, 'IRR')}</span>`;
    }

    case 'totalSpent':
      return `<span class="vci-money">${formatCurrency(customer.totalSpent || 0, 'IRR')}</span>`;

    case 'orderCount':
      return `<span class="vci-num">${formatNumber(customer.orderCount || 0)}</span>`;

    case 'status':
      return renderStatusPill(customer.status);

    case 'lastPurchaseAt':
      return customer.lastPurchaseAt
        ? `<span title="${attr(formatPersianDateTime(customer.lastPurchaseAt))}">${esc(formatRelativeTime(customer.lastPurchaseAt))}</span>`
        : '<span class="vci-muted">—</span>';

    case 'actions':
      return `
        <div class="vci-rowactions">
          <button class="vci-iconbtn vci-iconbtn--sm" type="button" data-action="quick-message" data-customer-id="${attr(customer.id)}" title="پیام سریع" aria-label="پیام سریع">💬</button>
          <button class="vci-iconbtn vci-iconbtn--sm" type="button" data-action="toggle-favorite" data-customer-id="${attr(customer.id)}" title="ستاره" aria-label="ستاره">${customer.favorite ? '★' : '☆'}</button>
          <button class="vci-iconbtn vci-iconbtn--sm" type="button" data-action="open-menu" data-customer-id="${attr(customer.id)}" title="بیشتر" aria-label="بیشتر">⋯</button>
        </div>`;

    default: {
      const field = CUSTOMER_FIELD_MAP[column.key];
      const value = customer[column.key];
      const text = field ? formatFieldValue(field, value) : value;
      return text ? esc(text) : '<span class="vci-muted">—</span>';
    }
  }
}

/* ================================================================== */
/* نمای کارت                                                           */
/* ================================================================== */

export function renderCardsView({ customers, ui } = {}) {
  const cards = customers.map((customer) => renderCustomerCard(customer, ui)).join('');

  return `<div class="vci-cards">${cards}</div>`;
}

export function renderCustomerCard(customer, ui = {}) {
  const stats = getCustomerStats(customer);
  const isSelected = ui.selectedIds?.includes(customer.id);

  return `
    <article class="${classList('vci-card', isSelected && 'is-selected', customer.favorite && 'is-favorite')}"
      data-customer-id="${attr(customer.id)}" tabindex="0">
      <div class="vci-card__top">
        <label class="vci-check">
          <input type="checkbox" data-action="toggle-select" data-customer-id="${attr(customer.id)}" ${isSelected ? 'checked' : ''}>
        </label>
        <button class="vci-card__avatar" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">
          ${renderAvatar(customer, { size: 56 })}
        </button>
        <button class="vci-card__star" type="button" data-action="toggle-favorite" data-customer-id="${attr(customer.id)}" aria-label="ستاره">${customer.favorite ? '★' : '☆'}</button>
      </div>

      <div class="vci-card__body">
        <button class="vci-card__name" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">
          ${esc(getCustomerName(customer))}
        </button>
        <p class="vci-card__preview">${esc(getCustomerPreview(customer))}</p>

        <div class="vci-card__pills">
          ${renderStatusPill(customer.status)}
          ${renderAccountPill(customer.accountType)}
          ${renderTierPill(customer.loyaltyTier)}
        </div>

        ${renderTagChips(customer.tags)}
      </div>

      <div class="vci-card__stats">
        <div class="vci-stat">
          <span class="vci-stat__label">موجودی</span>
          <strong class="${classList('vci-stat__value', Number(customer.balance || 0) < 0 && 'is-neg')}">${formatCurrency(customer.balance || 0, 'IRR')}</strong>
        </div>
        <div class="vci-stat">
          <span class="vci-stat__label">مجموع خرید</span>
          <strong class="vci-stat__value">${formatCompactNumber(customer.totalSpent || 0)}</strong>
        </div>
        <div class="vci-stat">
          <span class="vci-stat__label">سفارش‌ها</span>
          <strong class="vci-stat__value">${formatNumber(customer.orderCount || 0)}</strong>
        </div>
      </div>

      <div class="vci-card__meter" title="کامل بودن پروفایل">
        <span style="width:${stats.profileCompleteness}%"></span>
      </div>

      <footer class="vci-card__actions">
        <button class="vci-btn vci-btn--sm" type="button" data-action="quick-message" data-customer-id="${attr(customer.id)}">💬 پیام</button>
        <button class="vci-btn vci-btn--sm vci-btn--ghost" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">پروفایل</button>
      </footer>
    </article>
  `;
}

/* ================================================================== */
/* نمای لیست                                                           */
/* ================================================================== */

export function renderListView({ customers, ui } = {}) {
  const rows = customers
    .map((customer) => {
      const isSelected = ui.selectedIds?.includes(customer.id);

      return `
        <div class="${classList('vci-listrow', isSelected && 'is-selected')}" data-customer-id="${attr(customer.id)}" tabindex="0">
          <label class="vci-check">
            <input type="checkbox" data-action="toggle-select" data-customer-id="${attr(customer.id)}" ${isSelected ? 'checked' : ''}>
          </label>
          <button class="vci-listrow__avatar" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">
            ${renderAvatar(customer, { size: 44 })}
          </button>
          <div class="vci-listrow__main">
            <button class="vci-listrow__name" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">
              ${esc(getCustomerName(customer))}
              ${customer.favorite ? '<span class="vci-star">★</span>' : ''}
            </button>
            <span class="vci-listrow__sub">${esc(getCustomerPreview(customer))}</span>
          </div>
          <div class="vci-listrow__pills">
            ${renderStatusPill(customer.status)}
            ${renderAccountPill(customer.accountType)}
          </div>
          <div class="vci-listrow__balance ${Number(customer.balance || 0) < 0 ? 'is-neg' : ''}">${formatCurrency(customer.balance || 0, 'IRR')}</div>
          <div class="vci-listrow__actions">
            <button class="vci-iconbtn vci-iconbtn--sm" type="button" data-action="quick-message" data-customer-id="${attr(customer.id)}" aria-label="پیام">💬</button>
            <button class="vci-iconbtn vci-iconbtn--sm" type="button" data-action="open-menu" data-customer-id="${attr(customer.id)}" aria-label="بیشتر">⋯</button>
          </div>
        </div>
      `;
    })
    .join('');

  return `<div class="vci-list">${rows}</div>`;
}

/* ================================================================== */
/* نمای فشرده                                                          */
/* ================================================================== */

export function renderCompactView({ customers, ui } = {}) {
  const rows = customers
    .map((customer) => {
      const isSelected = ui.selectedIds?.includes(customer.id);

      return `
        <div class="${classList('vci-compactrow', isSelected && 'is-selected')}" data-customer-id="${attr(customer.id)}" tabindex="0">
          <label class="vci-check"><input type="checkbox" data-action="toggle-select" data-customer-id="${attr(customer.id)}" ${isSelected ? 'checked' : ''}></label>
          <button class="vci-compactrow__avatar" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">${renderAvatar(customer, { size: 28, ring: false })}</button>
          <button class="vci-compactrow__name" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">${esc(getCustomerName(customer))}</button>
          <span class="vci-compactrow__mobile">${esc(customer.mobile || '—')}</span>
          <span class="vci-compactrow__city">${esc(customer.city || '—')}</span>
          <span class="vci-compactrow__balance">${formatCompactNumber(customer.balance || 0)}</span>
        </div>
      `;
    })
    .join('');

  return `<div class="vci-compact">${rows}</div>`;
}

/* ================================================================== */
/* نمای برد (گروه‌بندی)                                                */
/* ================================================================== */

export function renderBoardView({ customers, ui, groups } = {}) {
  const columns = (groups || [])
    .map((group) => {
      const cards = group.items.map((customer) => renderCustomerCard(customer, ui)).join('');

      return `
        <section class="vci-boardcol" data-group-key="${attr(group.key)}">
          <header class="vci-boardcol__head">
            <h3>${esc(group.label)}</h3>
            <span class="vci-boardcol__count">${formatNumber(group.items.length)}</span>
          </header>
          <div class="vci-boardcol__body">${cards || '<p class="vci-muted">خالی</p>'}</div>
        </section>
      `;
    })
    .join('');

  return `<div class="vci-board">${columns}</div>`;
}

/* ================================================================== */
/* نمای نقشه                                                           */
/* ================================================================== */

export function renderMapView({ customers, ui } = {}) {
  const located = customers.filter((customer) => customer.lat && customer.lng);

  if (located.length === 0) {
    return `
      <div class="vci-empty">
        <div class="vci-empty__icon" aria-hidden="true">🗺</div>
        <h3>هیچ مشتری با موقعیت نیست</h3>
        <p>برای دیدن مشتریان روی نقشه، در پروفایل هر مشتری موقعیت را از نقشه انتخاب کنید.</p>
      </div>
    `;
  }

  const list = located
    .map((customer) => `
      <button class="vci-mapitem" type="button" data-action="focus-map-customer" data-customer-id="${attr(customer.id)}">
        ${renderAvatar(customer, { size: 32, ring: false })}
        <span class="vci-mapitem__name">${esc(getCustomerName(customer))}</span>
        <span class="vci-mapitem__addr">${esc(customer.city || customer.address || `${customer.lat}, ${customer.lng}`)}</span>
      </button>
    `)
    .join('');

  return `
    <div class="vci-mapview">
      <div class="vci-mapview__list">${list}</div>
      <div class="vci-mapview__map" data-map-host>
        <div class="vci-mapview__placeholder">
          <span aria-hidden="true">📍</span>
          <p>${formatNumber(located.length)} مشتری دارای موقعیت</p>
          <p class="vci-muted">روی هر مشتری کلیک کنید تا روی نقشه نشان داده شود.</p>
        </div>
      </div>
    </div>
  `;
}

/* ================================================================== */
/* نمای تایم‌لاین                                                      */
/* ================================================================== */

export function renderTimelineView({ customers, ui } = {}) {
  const items = customers
    .map((customer) => {
      const at = customer.lastSeenAt || customer.lastLoginAt || customer.lastPurchaseAt || customer.updatedAt || customer.createdAt;
      const isSelected = ui.selectedIds?.includes(customer.id);

      let label = 'فعالیت';
      if (customer.lastPurchaseAt && customer.lastPurchaseAt === at) label = 'خرید';
      else if (customer.lastLoginAt && customer.lastLoginAt === at) label = 'ورود';
      else if (customer.lastSeenAt && customer.lastSeenAt === at) label = 'بازدید';

      return `
        <div class="${classList('vci-tlitem', isSelected && 'is-selected')}" data-customer-id="${attr(customer.id)}">
          <div class="vci-tlitem__dot" aria-hidden="true"></div>
          <button class="vci-tlitem__avatar" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">${renderAvatar(customer, { size: 40 })}</button>
          <div class="vci-tlitem__body">
            <button class="vci-tlitem__name" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">${esc(getCustomerName(customer))}</button>
            <span class="vci-tlitem__meta">${esc(label)} · ${at ? esc(formatRelativeTime(at)) : '—'}</span>
          </div>
          <span class="vci-tlitem__time">${at ? esc(formatPersianDate(at)) : ''}</span>
        </div>
      `;
    })
    .join('');

  return `<div class="vci-timeline">${items}</div>`;
}

/* ================================================================== */
/* دیسپچر نما                                                          */
/* ================================================================== */

export function renderActiveView({ customers, ui, groups, columns } = {}) {
  switch (ui.view) {
    case 'cards':
      return renderCardsView({ customers, ui });
    case 'list':
      return renderListView({ customers, ui });
    case 'compact':
      return renderCompactView({ customers, ui });
    case 'board':
      return renderBoardView({ customers, ui, groups });
    case 'map':
      return renderMapView({ customers, ui });
    case 'timeline':
      return renderTimelineView({ customers, ui });
    case 'table':
    default:
      return renderTableView({ customers, ui, columns });
  }
}

/* ================================================================== */
/* نوار اقدام گروهی                                                    */
/* ================================================================== */

export function renderBulkBar({ selectedCount, ui } = {}) {
  if (!selectedCount) return '';

  return `
    <div class="vci-bulkbar" role="toolbar" aria-label="اقدام گروهی">
      <span class="vci-bulkbar__count">${formatNumber(selectedCount)} مشتری انتخاب شده</span>
      <div class="vci-bulkbar__actions">
        <button class="vci-btn vci-btn--sm" type="button" data-action="bulk-campaign">📣 کمپین</button>
        <button class="vci-btn vci-btn--sm vci-btn--ghost" type="button" data-action="bulk-tag">🏷 برچسب</button>
        <button class="vci-btn vci-btn--sm vci-btn--ghost" type="button" data-action="bulk-status">وضعیت</button>
        <button class="vci-btn vci-btn--sm vci-btn--ghost" type="button" data-action="bulk-export">⬇ خروجی</button>
        <button class="vci-btn vci-btn--sm vci-btn--danger" type="button" data-action="bulk-trash">🗑 حذف</button>
        <button class="vci-btn vci-btn--sm vci-btn--ghost" type="button" data-action="clear-selection">لغو انتخاب</button>
      </div>
    </div>
  `;
}

/* ================================================================== */
/* صفحه‌بندی                                                          */
/* ================================================================== */

export function renderPager({ page, pageSize, total } = {}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return '';

  const pages = [];
  const window = 2;
  const start = Math.max(1, page - window);
  const end = Math.min(totalPages, page + window);

  if (start > 1) pages.push(1);
  if (start > 2) pages.push('…');

  for (let index = start; index <= end; index += 1) pages.push(index);

  if (end < totalPages - 1) pages.push('…');
  if (end < totalPages) pages.push(totalPages);

  const buttons = pages
    .map((item) =>
      item === '…'
        ? '<span class="vci-pager__gap">…</span>'
        : `<button class="${classList('vci-pager__btn', item === page && 'is-active')}" type="button" data-action="set-page" data-page="${item}">${item}</button>`
    )
    .join('');

  return `
    <nav class="vci-pager" aria-label="صفحه‌بندی">
      <button class="vci-pager__btn" type="button" data-action="set-page" data-page="${Math.max(1, page - 1)}" ${page === 1 ? 'disabled' : ''}>›</button>
      ${buttons}
      <button class="vci-pager__btn" type="button" data-action="set-page" data-page="${Math.min(totalPages, page + 1)}" ${page === totalPages ? 'disabled' : ''}>‹</button>
    </nav>
  `;
}

/* ================================================================== */
/* وضعیت‌های خالی / بارگذاری / خطا                                    */
/* ================================================================== */

export function renderEmptyState({ hasQuery = false, bucketLabel = '' } = {}) {
  if (hasQuery) {
    return `
      <div class="vci-empty">
        <div class="vci-empty__icon" aria-hidden="true">🔍</div>
        <h3>نتیجه‌ای پیدا نشد</h3>
        <p>عبارت جستجو یا فیلترها را تغییر دهید.</p>
      </div>
    `;
  }

  return `
    <div class="vci-empty">
      <div class="vci-empty__icon" aria-hidden="true">👥</div>
      <h3>هنوز مشتری ندارید</h3>
      <p>اولین مشتری را اضافه کنید یا از یک فایل CSV/ابزار دیگر ایمپورت کنید.</p>
      <div class="vci-empty__actions">
        <button class="vci-btn vci-btn--primary" type="button" data-action="new-customer">＋ مشتری جدید</button>
        <button class="vci-btn vci-btn--ghost" type="button" data-action="open-import">⬆ ایمپورت</button>
      </div>
    </div>
  `;
}

export function renderLoadingState(rows = 6) {
  const skeletons = Array.from({ length: rows }, () => '<div class="vci-skeleton"></div>').join('');
  return `<div class="vci-skeletons">${skeletons}</div>`;
}

export function renderErrorState(message) {
  return `
    <div class="vci-empty vci-empty--error">
      <div class="vci-empty__icon" aria-hidden="true">⚠️</div>
      <h3>خطا در بارگذاری</h3>
      <p>${esc(message || 'خطای نامشخص')}</p>
      <button class="vci-btn vci-btn--primary" type="button" data-action="reload">تلاش دوباره</button>
    </div>
  `;
}

/* ================================================================== */
/* فیلد درجا (inline) — هستهٔ ویرایش بدون مودال                        */
/* ================================================================== */

/**
 * یک فیلد قابل ویرایش درجا. با کلیک روی مقدار، input جای آن می‌آید
 * (منطق در editor). اینجا فقط ساختار نمایشی.
 */
export function renderInlineField(field, value, { customerId, compact = false } = {}) {
  const display = formatFieldValue(field, value);
  const isEmpty = display === '' || display === '—';

  return `
    <div class="${classList('vci-field', `vci-field--${field.type}`, isEmpty && 'is-empty', compact && 'is-compact')}"
      data-field-key="${attr(field.key)}" data-customer-id="${attr(customerId)}">
      <span class="vci-field__label">${esc(field.label)}</span>
      <button class="vci-field__value" type="button" data-action="edit-field"
        data-field-key="${attr(field.key)}" data-customer-id="${attr(customerId)}"
        title="کلیک برای ویرایش">
        ${isEmpty ? '<span class="vci-field__placeholder">افزودن…</span>' : esc(display)}
      </button>
    </div>
  `;
}

/** شبکهٔ فیلدهای یک بخش */
export function renderFieldGrid(fields, customer, { compact = false } = {}) {
  const cells = fields
    .map((field) => renderInlineField(field, customer?.[field.key], { customerId: customer?.id, compact }))
    .join('');

  return `<div class="vci-fieldgrid">${cells}</div>`;
}

/* ================================================================== */
/* پروفایل کامل                                                        */
/* ================================================================== */

export function renderProfile({ customer, ui, sections } = {}) {
  if (!customer) return '';

  const stats = getCustomerStats(customer);
  const activeTab = ui.profileTab || 'overview';

  const tabs = PROFILE_TABS.map((tab) => `
    <button class="${classList('vci-ptab', activeTab === tab.key && 'is-active')}" type="button"
      data-action="set-profile-tab" data-tab="${attr(tab.key)}" ${activeTab === tab.key ? 'aria-current="page"' : ''}>
      <span aria-hidden="true">${esc(tab.icon)}</span>
      <span>${esc(tab.label)}</span>
    </button>
  `).join('');

  return `
    <div class="vci-profile" data-profile-id="${attr(customer.id)}">
      <header class="vci-profile__hero">
        <div class="vci-profile__heroart" aria-hidden="true"></div>
        <button class="vci-profile__back" type="button" data-action="close-profile" aria-label="بازگشت">→ بازگشت</button>

        <div class="vci-profile__id">
          <div class="vci-profile__avatarwrap">
            ${renderAvatar(customer, { size: 96, editable: true })}
          </div>
          <div class="vci-profile__idtext">
            <h2 class="vci-profile__name">${esc(getCustomerName(customer))}</h2>
            <p class="vci-profile__preview">${esc(getCustomerPreview(customer))}</p>
            <div class="vci-profile__pills">
              ${renderStatusPill(customer.status)}
              ${renderAccountPill(customer.accountType)}
              ${renderTierPill(customer.loyaltyTier)}
              ${customer.favorite ? '<span class="vci-pill vci-pill--fav">★ ستاره‌دار</span>' : ''}
            </div>
          </div>
        </div>

        <div class="vci-profile__quick">
          <button class="vci-btn vci-btn--primary" type="button" data-action="quick-message" data-customer-id="${attr(customer.id)}">💬 ارسال پیام</button>
          <button class="vci-btn vci-btn--ghost" type="button" data-action="quick-notify" data-customer-id="${attr(customer.id)}">🔔 نوتیفیکیشن</button>
          <button class="vci-btn vci-btn--ghost" type="button" data-action="toggle-favorite" data-customer-id="${attr(customer.id)}">${customer.favorite ? '★ برداشتن ستاره' : '☆ ستاره'}</button>
        </div>

        <div class="vci-profile__kpis">
          <div class="vci-kpi"><span>موجودی</span><strong class="${Number(customer.balance || 0) < 0 ? 'is-neg' : ''}">${formatCurrency(customer.balance || 0, 'IRR')}</strong></div>
          <div class="vci-kpi"><span>مجموع خرید</span><strong>${formatCurrency(customer.totalSpent || 0, 'IRR')}</strong></div>
          <div class="vci-kpi"><span>سفارش‌ها</span><strong>${formatNumber(customer.orderCount || 0)}</strong></div>
          <div class="vci-kpi"><span>کامل بودن</span><strong>${formatNumber(stats.profileCompleteness)}٪</strong></div>
        </div>
      </header>

      <nav class="vci-profile__tabs" role="tablist">${tabs}</nav>

      <div class="vci-profile__content" data-profile-content>
        ${renderProfileTab(customer, activeTab, { sections, stats })}
      </div>
    </div>
  `;
}

function renderProfileTab(customer, tab, { sections, stats } = {}) {
  switch (tab) {
    case 'overview':
      return renderOverviewTab(customer, stats);
    case 'outreach':
      return renderOutreachTab(customer);
    case 'activity':
      return renderActivityTab(customer);
    default: {
      const section = sections?.find((item) => item.key === tab);
      if (!section) return '<p class="vci-muted">بخش یافت نشد.</p>';

      return `
        <section class="vci-psection">
          <header class="vci-psection__head">
            <h3>${esc(section.icon)} ${esc(section.label)}</h3>
            <button class="vci-btn vci-btn--sm vci-btn--ghost" type="button" data-action="edit-section" data-section="${attr(section.key)}">ویرایش کامل بخش</button>
          </header>
          ${renderFieldGrid(section.fields, customer)}
        </section>
      `;
    }
  }
}

function renderOverviewTab(customer, stats) {
  const items = [
    ['سن', stats.age !== null && stats.age !== undefined ? `${formatNumber(stats.age)} سال` : '—'],
    ['بازهٔ سنی', AGE_RANGE_LABELS[stats.ageRange] || '—'],
    ['بازهٔ موجودی', BALANCE_RANGE_LABELS[stats.balanceRange] || '—'],
    ['روز از آخرین خرید', stats.daysSinceLastPurchase === null ? '—' : formatNumber(stats.daysSinceLastPurchase)],
    ['روز از آخرین ورود', stats.daysSinceLastLogin === null ? '—' : formatNumber(stats.daysSinceLastLogin)],
    ['تیکت باز', formatNumber(stats.openTicketCount)],
    ['زمان آنلاین', `${formatNumber(stats.onlineMinutes)} دقیقه`],
    ['امتیاز تعامل', formatNumber(stats.engagementScore)],
  ];

  const cells = items
    .map(([label, value]) => `<div class="vci-overviewcell"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`)
    .join('');

  return `
    <section class="vci-psection">
      <header class="vci-psection__head"><h3>👤 نمای کلی</h3></header>
      <div class="vci-overviewgrid">${cells}</div>
    </section>
  `;
}

function renderOutreachTab(customer) {
  const communications = Array.isArray(customer.communications) ? customer.communications.slice(-20).reverse() : [];

  const history = communications.length
    ? communications
        .map((item) => `
          <li class="vci-comm vci-comm--${esc(item.channel)}">
            <span class="vci-comm__icon" aria-hidden="true">${esc(channelIcon(item.channel))}</span>
            <div class="vci-comm__body">
              <strong>${esc(item.subject || item.channel)}</strong>
              <p>${esc(item.text || '')}</p>
              <span class="vci-comm__meta">${esc(item.status || '')} · ${item.createdAt ? esc(formatRelativeTime(item.createdAt)) : ''}</span>
            </div>
          </li>
        `)
        .join('')
    : '<p class="vci-muted">هنوز پیامی ارسال نشده.</p>';

  return `
    <section class="vci-psection">
      <header class="vci-psection__head"><h3>📨 ارسال پیام و نوتیفیکیشن</h3></header>
      <div class="vci-outreach">
        <button class="vci-btn vci-btn--primary" type="button" data-action="quick-message" data-customer-id="${attr(customer.id)}">💬 ارسال پیام شخصی</button>
        <button class="vci-btn vci-btn--ghost" type="button" data-action="quick-notify" data-customer-id="${attr(customer.id)}">🔔 ارسال نوتیفیکیشن</button>
        <button class="vci-btn vci-btn--ghost" type="button" data-action="schedule-message" data-customer-id="${attr(customer.id)}">⏰ پیام زمان‌بندی‌شده</button>
      </div>
      <h4 class="vci-psection__subhead">تاریخچهٔ تماس</h4>
      <ul class="vci-commlist">${history}</ul>
    </section>
  `;
}

function channelIcon(channel) {
  const icons = { inapp: '🔔', push: '📳', sms: '💬', whatsapp: '🟢', telegram: '✈️', email: '✉️', webhook: '🔗' };
  return icons[channel] || '📨';
}

function renderActivityTab(customer) {
  const activity = Array.isArray(customer.activity) ? customer.activity : [];

  const items = activity.length
    ? activity
        .map((item) => `
          <li class="vci-activity">
            <span class="vci-activity__dot" aria-hidden="true"></span>
            <span class="vci-activity__label">${esc(item.label || item.type || '')}</span>
            <span class="vci-activity__time">${item.at ? esc(formatRelativeTime(item.at)) : ''}</span>
          </li>
        `)
        .join('')
    : '<p class="vci-muted">تاریخچه‌ای ثبت نشده.</p>';

  return `
    <section class="vci-psection">
      <header class="vci-psection__head"><h3>📜 تاریخچهٔ تغییرات</h3></header>
      <ul class="vci-activitylist">${items}</ul>
    </section>
  `;
}

/* ================================================================== */
/* داشبورد آماری                                                       */
/* ================================================================== */

export function renderDashboard({ stats } = {}) {
  if (!stats) return '';

  const cityBars = (stats.topCities || [])
    .map((city) => {
      const max = stats.topCities[0]?.count || 1;
      const width = Math.round((city.count / max) * 100);

      return `
        <div class="vci-bar">
          <span class="vci-bar__label">${esc(city.label)}</span>
          <span class="vci-bar__track"><span style="width:${width}%"></span></span>
          <span class="vci-bar__value">${formatNumber(city.count)}</span>
        </div>
      `;
    })
    .join('');

  const genderTotal = Math.max(1, stats.total);
  const genderRows = [
    ['مرد', stats.genders?.male || 0],
    ['زن', stats.genders?.female || 0],
    ['سایر', stats.genders?.other || 0],
    ['نامشخص', stats.genders?.unknown || 0],
  ]
    .map(([label, count]) => {
      const width = Math.round((count / genderTotal) * 100);
      return `<div class="vci-bar"><span class="vci-bar__label">${esc(label)}</span><span class="vci-bar__track"><span style="width:${width}%"></span></span><span class="vci-bar__value">${formatNumber(count)}</span></div>`;
    })
    .join('');

  return `
    <div class="vci-dashboard">
      <div class="vci-dashgrid">
        <div class="vci-dashcard"><span>کل مشتریان</span><strong>${formatNumber(stats.total)}</strong></div>
        <div class="vci-dashcard"><span>موجودی کل</span><strong>${formatCurrency(stats.totalBalance, 'IRR')}</strong></div>
        <div class="vci-dashcard"><span>مجموع خرید</span><strong>${formatCurrency(stats.totalSpent, 'IRR')}</strong></div>
        <div class="vci-dashcard"><span>سفارش‌ها</span><strong>${formatNumber(stats.totalOrders)}</strong></div>
        <div class="vci-dashcard"><span>تولد امروز</span><strong>${formatNumber(stats.birthdaysToday)}</strong></div>
        <div class="vci-dashcard"><span>سبد باز</span><strong>${formatNumber(stats.openCarts)}</strong></div>
        <div class="vci-dashcard"><span>عضو این ماه</span><strong>${formatNumber(stats.newThisMonth)}</strong></div>
        <div class="vci-dashcard"><span>میانگین کامل بودن</span><strong>${formatNumber(stats.averageCompleteness)}٪</strong></div>
      </div>

      <div class="vci-dashcols">
        <section class="vci-dashcol">
          <h4>شهرهای برتر</h4>
          ${cityBars || '<p class="vci-muted">داده‌ای نیست.</p>'}
        </section>
        <section class="vci-dashcol">
          <h4>تفکیک جنسیت</h4>
          ${genderRows}
        </section>
      </div>
    </div>
  `;
}

/* ================================================================== */
/* پالت فرمان                                                          */
/* ================================================================== */

export function renderCommandPalette({ commands, query = '', activeIndex = 0 } = {}) {
  const filtered = commands.filter((command) =>
    `${command.label} ${command.hint || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const items = filtered
    .map((command, index) => `
      <button class="${classList('vci-cmdk__item', index === activeIndex && 'is-active')}" type="button"
        data-command-id="${attr(command.id)}" data-command-index="${index}">
        <span class="vci-cmdk__icon" aria-hidden="true">${esc(command.icon || '•')}</span>
        <span class="vci-cmdk__label">${esc(command.label)}</span>
        ${command.hint ? `<span class="vci-cmdk__hint">${esc(command.hint)}</span>` : ''}
      </button>
    `)
    .join('');

  return `
    <div class="vci-cmdk" data-command-overlay>
      <div class="vci-cmdk__panel" role="dialog" aria-label="پالت فرمان">
        <input class="vci-cmdk__input" type="text" data-action="command-input" placeholder="جستجوی فرمان…" value="${attr(query)}" autocomplete="off">
        <div class="vci-cmdk__list">${items || '<p class="vci-muted vci-cmdk__empty">فرمانی یافت نشد.</p>'}</div>
      </div>
    </div>
  `;
}

/* ================================================================== */
/* منوی kontekstی ردیف                                                 */
/* ================================================================== */

export function renderRowMenu(customer) {
  return `
    <div class="vci-menu" data-row-menu data-customer-id="${attr(customer.id)}">
      <button class="vci-menu__item" type="button" data-action="open-profile" data-customer-id="${attr(customer.id)}">👤 پروفایل کامل</button>
      <button class="vci-menu__item" type="button" data-action="quick-message" data-customer-id="${attr(customer.id)}">💬 ارسال پیام</button>
      <button class="vci-menu__item" type="button" data-action="quick-notify" data-customer-id="${attr(customer.id)}">🔔 نوتیفیکیشن</button>
      <button class="vci-menu__item" type="button" data-action="toggle-favorite" data-customer-id="${attr(customer.id)}">${customer.favorite ? '☆ برداشتن ستاره' : '★ ستاره‌دار'}</button>
      <button class="vci-menu__item" type="button" data-action="toggle-pin" data-customer-id="${attr(customer.id)}">${customer.pinned ? '📌 برداشتن سنجاق' : '📌 سنجاق'}</button>
      <button class="vci-menu__item" type="button" data-action="toggle-archive" data-customer-id="${attr(customer.id)}">${customer.archived ? '🗄 خروج از آرشیو' : '🗄 آرشیو'}</button>
      <button class="vci-menu__item vci-menu__item--danger" type="button" data-action="trash-customer" data-customer-id="${attr(customer.id)}">🗑 حذف</button>
    </div>
  `;
}
