// src/utilities/tool-page.js

/**
 * ViXoRa Tool Page Kit — زیرساخت مشترک همهٔ صفحات ابزار
 * ==================================================================
 * هر ابزار (یادداشت، مشتری، وام، عادت و…) الگوی یکسانی دارد:
 *   load → (loading | error | empty | list) → create/update/delete
 *
 * این ماژول آن الگو را یک‌بار و به‌صورت production-grade پیاده می‌کند
 * تا هر صفحه فقط روی UI و منطق اختصاصی خودش تمرکز کند.
 */

import {
  getToolData,
  createToolItem,
  updateToolItem,
  deleteToolItem,
} from '../core/actions/tools-service.js';

import { toast } from './toast.js';
import { confirmDialog } from './modal.js';
import { escapeHtml } from './dom-utils.js';

/* ------------------------------------------------------------------ */
/* قالب‌های آمادهٔ UI                                                  */
/* ------------------------------------------------------------------ */

export function loadingStateTemplate(rows = 4) {
  const skeletons = Array.from({ length: rows })
    .map(
      () => `
      <div class="vx-skeleton-card" aria-hidden="true">
        <span class="vx-skeleton vx-skeleton--avatar"></span>
        <span class="vx-skeleton vx-skeleton--line" style="width:62%"></span>
        <span class="vx-skeleton vx-skeleton--line" style="width:88%"></span>
        <span class="vx-skeleton vx-skeleton--line" style="width:40%"></span>
      </div>`
    )
    .join('');

  return `
    <div class="vx-state vx-state--loading" role="status" aria-live="polite">
      <div class="vx-skeleton-list">${skeletons}</div>
      <span class="vx-sr-only">در حال بارگذاری داده‌ها...</span>
    </div>
  `;
}

export function emptyStateTemplate({
  title = 'موردی ثبت نشده است',
  description = 'اولین مورد را اضافه کنید تا اینجا نمایش داده شود.',
  icon = '✦',
  actionLabel = null,
} = {}) {
  return `
    <div class="vx-state vx-state--empty">
      <div class="vx-state__icon" aria-hidden="true">${escapeHtml(icon)}</div>
      <h3 class="vx-state__title">${escapeHtml(title)}</h3>
      <p class="vx-state__desc">${escapeHtml(description)}</p>
      ${
        actionLabel
          ? `<button type="button" class="vx-btn vx-btn--primary" data-empty-action>${escapeHtml(actionLabel)}</button>`
          : ''
      }
    </div>
  `;
}

export function errorStateTemplate({
  title = 'خطا در بارگذاری داده‌ها',
  message = '',
} = {}) {
  return `
    <div class="vx-state vx-state--error" role="alert">
      <div class="vx-state__icon" aria-hidden="true">⚠</div>
      <h3 class="vx-state__title">${escapeHtml(title)}</h3>
      <p class="vx-state__desc">${escapeHtml(message || 'اتصال به حافظهٔ محلی برقرار نشد.')}</p>
      <button type="button" class="vx-btn vx-btn--ghost" data-retry>تلاش دوباره</button>
    </div>
  `;
}

export function noResultTemplate(query) {
  return `
    <div class="vx-state vx-state--empty">
      <div class="vx-state__icon" aria-hidden="true">🔍</div>
      <h3 class="vx-state__title">نتیجه‌ای پیدا نشد</h3>
      <p class="vx-state__desc">
        ${query ? `برای عبارت «${escapeHtml(query)}» موردی یافت نشد.` : 'فیلترها را تغییر دهید.'}
      </p>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* جستجو / مرتب‌سازی / صفحه‌بندی                                       */
/* ------------------------------------------------------------------ */

export function filterItems(items, query, { fields = [], matcher = null } = {}) {
  if (!Array.isArray(items)) return [];

  const normalized = String(query ?? '').trim().toLowerCase();
  if (!normalized) return items;

  if (typeof matcher === 'function') {
    return items.filter((item) => matcher(item, normalized));
  }

  return items.filter((item) =>
    fields.some((field) => {
      const raw =
        typeof field === 'function'
          ? field(item)
          : String(field).split('.').reduce((cursor, key) => cursor?.[key], item);

      return raw !== null && raw !== undefined && String(raw).toLowerCase().includes(normalized);
    })
  );
}

export function sortItems(items, sortKey, sortDirection = 'desc', { getters = {} } = {}) {
  if (!Array.isArray(items)) return [];

  const list = [...items];
  const direction = sortDirection === 'asc' ? 1 : -1;

  list.sort((a, b) => {
    const getter = getters[sortKey];

    let first;
    let second;

    if (typeof getter === 'function') {
      first = getter(a);
      second = getter(b);
    } else {
      first = a?.[sortKey];
      second = b?.[sortKey];
    }

    if (first === second) return 0;
    if (first === null || first === undefined) return 1;
    if (second === null || second === undefined) return -1;

    if (typeof first === 'number' && typeof second === 'number') {
      return (first - second) * direction;
    }

    return String(first).localeCompare(String(second), 'fa-IR') * direction;
  });

  return list;
}

export function paginateItems(items, page = 1, pageSize = 12) {
  const list = Array.isArray(items) ? items : [];

  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    return { pageItems: list, totalPages: 1, currentPage: 1, total: list.length };
  }

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    pageItems: list.slice(start, start + pageSize),
    totalPages,
    currentPage,
    total: list.length,
  };
}

/* ------------------------------------------------------------------ */
/* کنترل‌کنندهٔ داده                                                   */
/* ------------------------------------------------------------------ */

/**
 * @param {Object} options
 * @param {string} options.toolName کلید ابزار در user.tools
 * @param {Function} options.onChange کال‌بک با امضای (items, meta)
 * @param {AbortSignal} [options.signal]
 */
export function createToolDataController({ toolName, onChange = null, signal = null } = {}) {
  if (!toolName) throw new TypeError('[ToolPage] toolName is required.');

  let items = [];
  let isLoading = false;
  let error = null;
  let pending = null;

  function emit() {
    if (typeof onChange !== 'function') return;

    onChange(items, {
      isLoading,
      error,
      count: items.length,
      toolName,
    });
  }

  async function load({ silent = false } = {}) {
    if (signal?.aborted) return items;

    // جلوگیری از race بین load های پشت‌سرهم
    const token = (pending = Symbol('load'));

    if (!silent) {
      isLoading = true;
      error = null;
      emit();
    }

    try {
      const data = await getToolData(toolName, { signal });

      if (pending !== token || signal?.aborted) return items;

      items = Array.isArray(data) ? data : [];
      isLoading = false;
      error = null;
      emit();
    } catch (loadError) {
      if (signal?.aborted || loadError?.name === 'AbortError') return items;

      if (pending !== token) return items;

      console.error(`[ToolPage:${toolName}] load failed:`, loadError);

      isLoading = false;
      error = loadError?.message || 'بارگذاری داده‌ها ناموفق بود.';
      emit();
    }

    return items;
  }

  async function create(payload, { successMessage = 'با موفقیت ثبت شد.' } = {}) {
    const created = await createToolItem(toolName, payload, { signal });

    items = [created, ...items];
    emit();

    if (successMessage) toast.success(successMessage);

    return created;
  }

  async function update(itemId, fields, { successMessage = 'به‌روزرسانی انجام شد.' } = {}) {
    const updated = await updateToolItem(toolName, itemId, fields, { signal });

    items = items.map((item) => (String(item.id) === String(itemId) ? updated : item));
    emit();

    if (successMessage) toast.success(successMessage);

    return updated;
  }

  async function remove(itemId, { successMessage = 'حذف شد.' } = {}) {
    await deleteToolItem(toolName, itemId, { signal });

    items = items.filter((item) => String(item.id) !== String(itemId));
    emit();

    if (successMessage) toast.success(successMessage);

    return true;
  }

  async function removeWithConfirm(itemId, {
    title = 'حذف مورد',
    message = 'این عملیات قابل بازگشت نیست. ادامه می‌دهید؟',
  } = {}) {
    const confirmed = await confirmDialog({ title, message, danger: true, confirmLabel: 'حذف' });
    if (!confirmed) return false;

    return remove(itemId);
  }

  return {
    load,
    create,
    update,
    remove,
    removeWithConfirm,
    getItems: () => items,
    getItemById: (itemId) => items.find((item) => String(item.id) === String(itemId)) || null,
    setItems: (nextItems) => {
      items = Array.isArray(nextItems) ? nextItems : [];
      emit();
      return items;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
  };
}

/* ------------------------------------------------------------------ */
/* خروجی گرفتن                                                         */
/* ------------------------------------------------------------------ */

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerBlobDownload(blob, filename);
}

export function downloadCsv(filename, rows, columns) {
  const list = Array.isArray(rows) ? rows : [];

  const headers = Array.isArray(columns)
    ? columns.map((column) => column.label || column.key)
    : list.length > 0
      ? Object.keys(list[0])
      : [];

  const keys = Array.isArray(columns)
    ? columns.map((column) => column.key)
    : headers;

  const escapeCell = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };

  const csv = [
    headers.map(escapeCell).join(','),
    ...list.map((row) => keys.map((key) => escapeCell(row?.[key])).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, filename);
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 200);
}
