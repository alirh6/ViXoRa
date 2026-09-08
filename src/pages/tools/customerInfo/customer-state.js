// src/pages/tools/customerInfo/customer-state.js

/**
 * ViXoRa — state فضای کاری مشتریان
 * ==================================
 * تمام وضعیت UI (نما، سطل، مرتب‌سازی، فیلتر، انتخاب، پروفایل باز،
 * پنل‌ها، پیکربندی ستون‌ها/سرصفحه) اینجا نگهداری و در LocalStorage
 * پایا می‌شود. توابع خالص و تست‌پذیر.
 */

import {
  CUSTOMER_VIEWS,
  CUSTOMER_SORTS,
  CUSTOMER_SORT_LABELS,
  CUSTOMER_GROUPS,
  CUSTOMER_GROUP_LABELS,
  CUSTOMER_VIEW_LABELS,
  CUSTOMER_SECTIONS,
  CUSTOMER_SECTION_MAP,
  getSectionFields,
} from '../../../core/schemas/customer-schema.js';

import { SMART_BUCKETS, RULE_FIELDS } from '../../../core/services/segmentation-service.js';

export const UI_STORAGE_KEY = 'ViXoRa:customerInfo:ui';
export const HEADER_STORAGE_KEY = 'ViXoRa:customerInfo:header';

/* ================================================================== */
/* نماها                                                               */
/* ================================================================== */

export const VIEW_META = {
  table: { key: 'table', label: 'جدول', icon: '▦', hint: 'نمای جدولی فشرده با ستون‌های قابل انتخاب' },
  cards: { key: 'cards', label: 'کارت', icon: '▤', hint: 'کارت‌های بزرگ با آمار و اقدام‌ها' },
  list: { key: 'list', label: 'لیست', icon: '☰', hint: 'لیست تک‌ستونی با اطلاعات کلیدی' },
  board: { key: 'board', label: 'برد', icon: '▥', hint: 'ستون‌بندی بر اساس وضعیت/گروه' },
  compact: { key: 'compact', label: 'فشرده', icon: '▪', hint: 'حداکثر اطلاعات در حداقل فضا' },
  map: { key: 'map', label: 'نقشه', icon: '🗺', hint: 'مشتریان دارای موقعیت روی نقشه' },
  timeline: { key: 'timeline', label: 'تایم‌لاین', icon: '🕒', hint: 'بر اساس آخرین فعالیت' },
};

export const DEFAULT_VIEW = 'table';

/* ================================================================== */
/* ستون‌های پیش‌فرض هر نما                                            */
/* ================================================================== */

export const TABLE_COLUMNS = [
  { key: 'avatar', label: 'چهره', width: '56px', locked: true },
  { key: 'name', label: 'نام', width: '1.6fr', sortable: true },
  { key: 'mobile', label: 'موبایل', width: '1fr', sortable: true },
  { key: 'city', label: 'شهر', width: '.9fr' },
  { key: 'balance', label: 'موجودی', width: '.9fr', sortable: true, align: 'left' },
  { key: 'totalSpent', label: 'مجموع خرید', width: '1fr', sortable: true, align: 'left' },
  { key: 'orderCount', label: 'سفارش', width: '.6fr', align: 'center', sortable: true },
  { key: 'status', label: 'وضعیت', width: '.8fr' },
  { key: 'lastPurchaseAt', label: 'آخرین خرید', width: '1fr', sortable: true },
  { key: 'actions', label: '', width: '120px', locked: true },
];

/* ================================================================== */
/* اقدام‌های سرصفحه                                                    */
/* ================================================================== */

export const DEFAULT_HEADER_CONFIG = {
  pinned: false,
  actions: [
    { id: 'new-customer', label: 'مشتری جدید', icon: '＋', variant: 'primary' },
    { id: 'campaign', label: 'کمپین', icon: '📣' },
    { id: 'segments', label: 'بخش‌ها', icon: '🎯' },
    { id: 'import', label: 'ایمپورت', icon: '⬆' },
    { id: 'export', label: 'خروجی', icon: '⬇' },
    { id: 'dashboard', label: 'داشبورد', icon: '📊' },
    { id: 'settings', label: 'تنظیمات', icon: '⚙' },
  ],
};

export const HEADER_ACTION_META = {
  'new-customer': { label: 'مشتری جدید', icon: '＋', command: 'new-customer' },
  campaign: { label: 'کمپین گروهی', icon: '📣', command: 'open-campaign' },
  segments: { label: 'مدیریت بخش‌ها', icon: '🎯', command: 'open-segments' },
  import: { label: 'ایمپورت مشتریان', icon: '⬆', command: 'open-import' },
  export: { label: 'خروجی گرفتن', icon: '⬇', command: 'open-export' },
  dashboard: { label: 'داشبورد آماری', icon: '📊', command: 'open-dashboard' },
  settings: { label: 'تنظیمات ابزار', icon: '⚙', command: 'open-settings' },
};

/* ================================================================== */
/* state پیش‌فرض                                                      */
/* ================================================================== */

export function createDefaultUiState() {
  return {
    view: DEFAULT_VIEW,
    bucket: 'all',
    activeSegmentId: null,
    sort: 'newest',
    sortDirection: 'desc',
    groupBy: 'none',
    query: '',
    queryScope: 'all', // all | name | mobile | email | city | tags
    page: 1,
    pageSize: 24,
    theme: 'dark',
    density: 'comfortable', // comfortable | compact

    selectedIds: [],
    isSelectAll: false,

    // پروفایل
    openCustomerId: null,
    profileTab: 'overview',

    // پنل‌ها
    isSidebarOpen: true,
    isFilterOpen: false,
    isCommandOpen: false,
    isCampaignOpen: false,
    isSegmentsOpen: false,
    isImportOpen: false,
    isDashboardOpen: false,
    isSettingsOpen: false,

    // فیلترهای سریع (rule builder موقت)
    quickRules: [],
    quickMatcher: 'all',

    // ستون‌های نمای جدول
    visibleColumns: TABLE_COLUMNS.filter((column) => !column.hidden).map((column) => column.key),

    // بخش‌های فعال فرم (کدام دسته‌ها باز باشند)
    activeFormSections: ['identity', 'contact', 'finance', 'location'],

    // پیکربندی سرصفحه
    headerActions: DEFAULT_HEADER_CONFIG.actions.map((action) => action.id),
  };
}

/* ================================================================== */
/* خواندن/پایاسازی state                                              */
/* ================================================================== */

export function readPersistedUi() {
  const base = createDefaultUiState();

  try {
    const raw = globalThis.localStorage?.getItem(UI_STORAGE_KEY);
    if (!raw) return base;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return base;

    return sanitizeUiState({ ...base, ...parsed });
  } catch {
    return base;
  }
}

export function readPersistedHeaderConfig() {
  try {
    const raw = globalThis.localStorage?.getItem(HEADER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_HEADER_CONFIG };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_HEADER_CONFIG };

    return {
      pinned: Boolean(parsed.pinned),
      actions: Array.isArray(parsed.actions) && parsed.actions.length
        ? parsed.actions.filter((action) => HEADER_ACTION_META[action?.id])
        : DEFAULT_HEADER_CONFIG.actions.map((action) => ({ ...action })),
    };
  } catch {
    return { ...DEFAULT_HEADER_CONFIG };
  }
}

/** پاک‌سازی state خوانده‌شده تا مقادیر نامعتبر باعث crash نشوند */
export function sanitizeUiState(raw = {}) {
  const base = createDefaultUiState();

  const view = CUSTOMER_VIEWS.includes(raw.view) ? raw.view : base.view;
  const bucket = SMART_BUCKETS.some((item) => item.key === raw.bucket) ? raw.bucket : base.bucket;
  const sort = CUSTOMER_SORTS.some((item) => item.key === raw.sort) ? raw.sort : base.sort;
  const groupBy = CUSTOMER_GROUPS.some((item) => item.key === raw.groupBy) ? raw.groupBy : base.groupBy;
  const theme = raw.theme === 'light' ? 'light' : 'dark';
  const density = raw.density === 'compact' ? 'compact' : 'comfortable';
  const queryScope = ['all', 'name', 'mobile', 'email', 'city', 'tags'].includes(raw.queryScope) ? raw.queryScope : base.queryScope;

  const pageSize = Number(raw.pageSize) > 0 ? Math.min(200, Number(raw.pageSize)) : base.pageSize;

  const visibleColumns = Array.isArray(raw.visibleColumns) && raw.visibleColumns.length
    ? raw.visibleColumns.filter((key) => TABLE_COLUMNS.some((column) => column.key === key))
    : base.visibleColumns;

  const activeFormSections = Array.isArray(raw.activeFormSections) && raw.activeFormSections.length
    ? raw.activeFormSections.filter((key) => CUSTOMER_SECTION_MAP[key])
    : base.activeFormSections;

  const headerActions = Array.isArray(raw.headerActions) && raw.headerActions.length
    ? raw.headerActions.filter((id) => HEADER_ACTION_META[id])
    : base.headerActions;

  return {
    ...base,
    ...raw,
    view,
    bucket,
    sort,
    groupBy,
    theme,
    density,
    queryScope,
    pageSize,
    visibleColumns,
    activeFormSections,
    headerActions,
    selectedIds: Array.isArray(raw.selectedIds) ? raw.selectedIds : [],
    quickRules: Array.isArray(raw.quickRules) ? raw.quickRules : [],
    quickMatcher: raw.quickMatcher === 'any' ? 'any' : 'all',
    page: Number(raw.page) > 0 ? Number(raw.page) : 1,

    // حالت‌های گذرا هرگز از storage بازیابی نمی‌شوند؛
    // وگرنه بعد از رفرش کاربر داخل پروفایل/مودال گیر می‌کند.
    openCustomerId: null,
    isCommandOpen: false,
    isCampaignOpen: false,
    isSegmentsOpen: false,
    isImportOpen: false,
    isDashboardOpen: false,
    isSettingsOpen: false,
    isFilterOpen: false,
  };
}

/* ================================================================== */
/* سطل‌ها                                                              */
/* ================================================================== */

export const BUCKET_FLAGS = {
  all: {},
  favorites: { favorite: true },
  pinned: { pinned: true },
  archived: { archived: true },
  trash: { trashed: true },
};

export function getActiveBucket(ui) {
  return SMART_BUCKETS.find((bucket) => bucket.key === ui.bucket) || SMART_BUCKETS[0];
}

export function bucketTogglePatch(bucketKey, currentFlags = {}) {
  const flags = BUCKET_FLAGS[bucketKey];
  if (!flags) return {};

  const patch = {};
  for (const [key, value] of Object.entries(flags)) {
    patch[key] = currentFlags[key] ? false : value;
  }

  return patch;
}

/* ================================================================== */
/* بخش‌های فرم                                                        */
/* ================================================================== */

export function getFormSections(activeKeys = []) {
  const active = new Set(activeKeys);

  return CUSTOMER_SECTIONS.map((section) => ({
    key: section.key,
    label: section.label,
    icon: section.icon,
    fields: getSectionFields(section.key),
    isActive: active.has(section.key),
  }));
}

export function toggleFormSection(activeKeys, sectionKey) {
  const list = Array.isArray(activeKeys) ? activeKeys.slice() : [];
  const index = list.indexOf(sectionKey);

  if (index === -1) list.push(sectionKey);
  else list.splice(index, 1);

  return list;
}

/* ================================================================== */
/* فیلدهای قابل مرتب‌سازی / ستون                                       */
/* ================================================================== */

export const SORT_OPTIONS = CUSTOMER_SORTS.map((key) => ({ key, label: CUSTOMER_SORT_LABELS[key] || key }));

export const GROUP_OPTIONS = CUSTOMER_GROUPS.map((key) => ({ key, label: CUSTOMER_GROUP_LABELS[key] || key }));

export const VIEW_OPTIONS = CUSTOMER_VIEWS.map((key) => ({
  key,
  label: VIEW_META[key]?.label || CUSTOMER_VIEW_LABELS[key] || key,
  icon: VIEW_META[key]?.icon || '•',
}));

export const QUERY_SCOPES = [
  { key: 'all', label: 'همه فیلدها' },
  { key: 'name', label: 'نام' },
  { key: 'mobile', label: 'موبایل' },
  { key: 'email', label: 'ایمیل' },
  { key: 'city', label: 'شهر' },
  { key: 'tags', label: 'برچسب‌ها' },
];

export const RULE_FIELD_OPTIONS = RULE_FIELDS.map((field) => ({ key: field.key, label: field.label, kind: field.kind }));

/* ================================================================== */
/* انتخاب‌ها                                                          */
/* ================================================================== */

export function toggleSelection(selectedIds, customerId) {
  const list = Array.isArray(selectedIds) ? selectedIds.slice() : [];
  const index = list.indexOf(customerId);

  if (index === -1) list.push(customerId);
  else list.splice(index, 1);

  return list;
}

export function isAllSelected(selectedIds, visibleIds) {
  if (!Array.isArray(visibleIds) || visibleIds.length === 0) return false;

  return visibleIds.every((id) => selectedIds.includes(id));
}

/* ================================================================== */
/* تب‌های پروفایل                                                     */
/* ================================================================== */

export const PROFILE_TABS = [
  { key: 'overview', label: 'نمای کلی', icon: '👤' },
  { key: 'identity', label: 'هویت', icon: '🪪' },
  { key: 'contact', label: 'تماس', icon: '📞' },
  { key: 'finance', label: 'مالی', icon: '💳' },
  { key: 'location', label: 'موقعیت', icon: '📍' },
  { key: 'commerce', label: 'خرید', icon: '🛒' },
  { key: 'support', label: 'پشتیبانی', icon: '🎧' },
  { key: 'telemetry', label: 'دستگاه و ورود', icon: '📡' },
  { key: 'preferences', label: 'ترجیحات', icon: '🎛' },
  { key: 'lifecycle', label: 'چرخهٔ عمر', icon: '🔄' },
  { key: 'custom', label: 'فیلدهای دلخواه', icon: '🧩' },
  { key: 'outreach', label: 'ارسال پیام', icon: '📨' },
  { key: 'activity', label: 'تاریخچه', icon: '📜' },
];

export const DEFAULT_PROFILE_TAB = 'overview';

/* ================================================================== */
/* پیکربندی ستون                                                      */
/* ================================================================== */

export function toggleColumn(visibleColumns, columnKey) {
  const list = Array.isArray(visibleColumns) ? visibleColumns.slice() : [];
  const index = list.indexOf(columnKey);

  if (index === -1) list.push(columnKey);
  else list.splice(index, 1);

  return list;
}

export function getVisibleColumnDefs(visibleColumns = []) {
  const order = new Map(visibleColumns.map((key, index) => [key, index]));

  return TABLE_COLUMNS.filter((column) => order.has(column.key)).sort(
    (a, b) => order.get(a.key) - order.get(b.key)
  );
}
