// src/pages/tools/customerInfo/customerInfo.js

/**
 * ViXoRa — فضای کاری «اطلاعات مشتریان» (CRM)
 * ============================================
 * قرارداد روتر:  render / afterRender / destroy
 * داده:          user.tools.customerInfo در LocalStorage (بدون بک‌اند)
 *
 * معماری: رندر منطقه‌ای (header/toolbar/panels/sidebar/view/profile) تا
 * تایپ کاربر قطع نشود؛ ویرایش درجا روی blur/Enter ذخیره می‌شود.
 */

import {
  readPersistedUi,
  readPersistedHeaderConfig,
  createDefaultUiState,
  getActiveBucket,
  getFormSections,
  toggleFormSection,
  toggleSelection,
  toggleColumn,
  getVisibleColumnDefs,
  DEFAULT_HEADER_CONFIG,
  HEADER_ACTION_META,
  RULE_FIELD_OPTIONS,
} from './customer-state.js';

import {
  renderHeader,
  renderToolbar,
  renderFilterPanel,
  renderSidebar,
  renderActiveView,
  renderBulkBar,
  renderPager,
  renderProfile,
  renderDashboard,
  renderCommandPalette,
  renderRowMenu,
  renderEmptyState,
  renderLoadingState,
  renderErrorState,
  renderInlineField,
} from './customer-renderers.js';

import {
  buildInlineInput,
  readInlineValue,
  buildSectionForm,
  readSectionForm,
  showFormErrors,
  buildCampaignForm,
  buildSegmentsManager,
  buildSegmentForm,
  readSegmentForm,
  buildImportForm,
  buildSettingsForm,
  buildMapPicker,
  buildMessageForm,
} from './customer-editor.js';

import {
  normalizeCustomer,
  normalizeCustomerList,
  createEmptyCustomer,
  createId,
  getCustomerName,
  getAge,
  getAgeRange,
  getBalanceRange,
  getCustomerStats,
  validateCustomerDraft,
  CUSTOMER_FIELD_MAP,
  CUSTOMER_SECTIONS,
  AGE_RANGE_LABELS,
  BALANCE_RANGE_LABELS,
  GENDER_LABELS,
  ACCOUNT_TYPE_LABELS,
  CUSTOMER_STATUS_LABELS,
  LOYALTY_TIER_LABELS,
} from '../../../core/schemas/customer-schema.js';

import {
  SMART_BUCKETS,
  filterCustomers,
  countBuckets,
  countSegment,
  getDashboardStats,
  getSavedSegments,
  saveSegment,
  deleteSegment,
  customersToCsv,
  parseCsv,
  previewImport,
  mapImportRow,
  normalizeRule,
  RULE_OPERATORS,
} from '../../../core/services/segmentation-service.js';

import {
  sendCustomerMessage,
  sendBulkCampaign,
  startCampaignScheduler,
  stopCampaignScheduler,
  getOutreachSettings,
  updateOutreachSettings,
  getOutreachTemplates,
  applyMergeFields,
} from '../../../core/services/outreach-service.js';

import {
  geocode,
  reverseGeocode,
  applyLocation,
  buildOsmEmbedUrl,
  buildExternalMapUrl,
  getCurrentPosition,
  formatAddressParts,
} from '../../../core/services/location-service.js';

import { collectTelemetry } from '../../../core/services/telemetry-service.js';

import { toast } from '../../../utilities/toast.js';
import { confirmDialog, createModal } from '../../../utilities/modal.js';
import { escapeHtml, delegate, on, debounce, openExternal } from '../../../utilities/dom-utils.js';
import { injectScopedCss } from '../../../utilities/css-scope.js';

import {
  getToolData,
  createToolItem,
  updateToolItem,
  deleteToolItem,
  setToolItems,
  deleteManyToolItems,
} from '../../../core/actions/tools-service.js';

import { customerInfoCss } from './customerInfo.css.js';

const TOOL_NAME = 'customerInfo';
const AUTO_BACKUP_KEY = 'ViXoRa:customerInfo:autobackup';

/** کلید همهٔ بخش‌ها (برای ساخت بخش‌های پروفایل) */
const CUSTOMER_SECTION_KEYS = CUSTOMER_SECTIONS.map((section) => section.key);

/* ================================================================== */
/* مرتب‌سازی                                                          */
/* ================================================================== */

function sortCustomers(customers, sortKey = 'newest', direction = 'desc') {
  const list = Array.isArray(customers) ? customers.slice() : [];
  const dir = direction === 'asc' ? 1 : -1;

  const byString = (getValue) => (a, b) => String(getValue(a) ?? '').localeCompare(String(getValue(b) ?? ''), 'fa');
  const byNumber = (getValue) => (a, b) => (Number(getValue(a) || 0) - Number(getValue(b) || 0)) * dir;
  const byDate = (getValue) => (a, b) => (Date.parse(getValue(b) || 0) - Date.parse(getValue(a) || 0)) * dir;

  switch (sortKey) {
    case 'name':
      return list.sort(byString((c) => getCustomerName(c)));
    case 'balance-desc':
      return list.sort(byNumber((c) => c.balance));
    case 'balance-asc':
      return list.sort((a, b) => (Number(a.balance || 0) - Number(b.balance || 0)));
    case 'spend-desc':
      return list.sort(byNumber((c) => c.totalSpent));
    case 'orders-desc':
      return list.sort(byNumber((c) => c.orderCount));
    case 'age-asc':
      return list.sort((a, b) => (getAge(a) ?? 999) - (getAge(b) ?? 999));
    case 'age-desc':
      return list.sort((a, b) => (getAge(b) ?? -1) - (getAge(a) ?? -1));
    case 'last-purchase':
      return list.sort(byDate((c) => c.lastPurchaseAt));
    case 'last-login':
      return list.sort(byDate((c) => c.lastSeenAt || c.lastLoginAt));
    case 'engagement':
      return list.sort(byNumber((c) => getCustomerStats(c).engagementScore));
    case 'oldest':
      return list.sort((a, b) => Date.parse(a.signupAt || a.createdAt || 0) - Date.parse(b.signupAt || b.createdAt || 0));
    case 'random':
      return list.sort(() => Math.random() - 0.5);
    case 'newest':
    default:
      return list.sort((a, b) => {
        // سنجاق‌شده و ستاره‌دار اول، سپس جدیدترین
        const pinDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
        if (pinDiff !== 0) return pinDiff;
        const favDiff = Number(Boolean(b.favorite)) - Number(Boolean(a.favorite));
        if (favDiff !== 0) return favDiff;
        return Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0);
      });
  }
}

/** نگاشت کلید ستون جدول → کلید مرتب‌سازی */
function columnToSortKey(columnKey) {
  const map = {
    name: 'name',
    balance: 'balance-desc',
    totalSpent: 'spend-desc',
    orderCount: 'orders-desc',
    lastPurchaseAt: 'last-purchase',
  };

  return map[columnKey] || 'newest';
}

/* ================================================================== */
/* گروه‌بندی                                                          */
/* ================================================================== */

function getGroupKey(customer, groupBy) {
  switch (groupBy) {
    case 'gender':
      return customer.gender || 'unknown';
    case 'city':
      return customer.city || 'نامشخص';
    case 'country':
      return customer.country || 'نامشخص';
    case 'accountType':
      return customer.accountType || 'normal';
    case 'status':
      return customer.status || 'active';
    case 'tier':
      return customer.loyaltyTier || 'none';
    case 'ageRange':
      return getAgeRange(customer);
    case 'balanceRange':
      return getBalanceRange(customer);
    default:
      return 'all';
  }
}

function getGroupLabel(groupBy, key) {
  switch (groupBy) {
    case 'gender':
      return GENDER_LABELS[key] || 'نامشخص';
    case 'accountType':
      return ACCOUNT_TYPE_LABELS[key] || key;
    case 'status':
      return CUSTOMER_STATUS_LABELS[key] || key;
    case 'tier':
      return LOYALTY_TIER_LABELS[key] || key;
    case 'ageRange':
      return AGE_RANGE_LABELS[key] || key;
    case 'balanceRange':
      return BALANCE_RANGE_LABELS[key] || key;
    default:
      return key;
  }
}

/* ================================================================== */
/* صفحه                                                                */
/* ================================================================== */

export function createCustomerInfoPage(ctx = {}) {
  /* ---------------- state ---------------- */

  const pageState = {
    customers: [],
    ui: readPersistedUi(),
    headerConfig: readPersistedHeaderConfig(),
    isLoading: true,
    error: null,
    isDestroyed: false,
    commandQuery: '',
    commandIndex: 0,
    rowMenuId: null,
  };

  const refs = {};
  const teardown = [];
  let releaseCss = null;
  let stopScheduler = null;

  /* ---------------- ابزارهای داخلی ---------------- */

  function register(cleanup) {
    if (typeof cleanup === 'function') teardown.push(cleanup);
    return cleanup;
  }

  function persistUi() {
    try {
      globalThis.localStorage.setItem('ViXoRa:customerInfo:ui', JSON.stringify(pageState.ui));
      globalThis.localStorage.setItem('ViXoRa:customerInfo:header', JSON.stringify(pageState.headerConfig));
    } catch (error) {
      console.warn('[CustomerInfo] UI persist failed:', error);
    }
  }

  function setUi(patch, options = {}) {
    const { regions = ['header', 'toolbar', 'panels', 'sidebar', 'view'] } = options;

    pageState.ui = { ...pageState.ui, ...patch };
    persistUi();

    for (const region of regions) renderRegion(region);
  }

  function findCustomer(customerId) {
    return pageState.customers.find((customer) => String(customer.id) === String(customerId)) || null;
  }

  function getOpenCustomer() {
    return pageState.ui.openCustomerId ? findCustomer(pageState.ui.openCustomerId) : null;
  }

  function effectiveUi(extra = {}) {
    return { ...pageState.ui, activeBucket: getActiveBucket(pageState.ui), ...extra };
  }

  function logActivity(customer, label) {
    const entry = { id: createId('act'), type: 'change', label, at: new Date().toISOString() };
    return { ...customer, activity: [entry, ...(customer.activity || [])].slice(0, 80) };
  }

  /* ---------------- ذخیره‌سازی ---------------- */

  async function persistAll(options = {}) {
    const { silent = true } = options;

    try {
      await setToolItems(TOOL_NAME, pageState.customers);
      autoBackup();
      return true;
    } catch (error) {
      console.error('[CustomerInfo] persist failed:', error);
      if (!silent) toast.error(error?.message || 'ذخیره‌سازی ناموفق بود.');
      return false;
    }
  }

  function autoBackup() {
    try {
      globalThis.localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify({ at: new Date().toISOString(), count: pageState.customers.length }));
    } catch {
      /* ignore */
    }
  }

  /** تغییر یک مشتری + ذخیره + رندر نواحی مرتبط */
  async function applyCustomerChange(customerId, updater, options = {}) {
    const { activity = null, regions = ['view', 'sidebar', 'profile'] } = options;

    const index = pageState.customers.findIndex((customer) => String(customer.id) === String(customerId));
    if (index === -1) return null;

    let nextCustomer = updater({ ...pageState.customers[index] });
    nextCustomer.updatedAt = new Date().toISOString();

    if (activity) nextCustomer = logActivity(nextCustomer, activity);

    const next = [...pageState.customers];
    next[index] = nextCustomer;
    pageState.customers = next;

    for (const region of regions) renderRegion(region);

    await persistAll();

    return nextCustomer;
  }

  /* ---------------- بارگذاری ---------------- */

  async function loadCustomers() {
    pageState.isLoading = true;
    pageState.error = null;
    renderRegion('view');

    try {
      const raw = await getToolData(TOOL_NAME, { signal: ctx.signal });
      if (pageState.isDestroyed) return;

      pageState.customers = normalizeCustomerList(raw);
      pageState.isLoading = false;

      renderAllRegions();
      await persistAll();
    } catch (error) {
      if (pageState.isDestroyed) return;

      pageState.isLoading = false;
      pageState.error = error?.message || 'خطای ناشناخته';
      renderRegion('view');
    }
  }

  /* ================================================================== */
  /* رندر مناطق                                                         */
  /* ================================================================== */

  function render() {
    releaseCss = injectScopedCss(customerInfoCss, 'customer-info-workspace');

    const theme = pageState.ui.theme === 'light' ? 'light' : 'dark';

    return `
      <section class="vci-ws theme-${theme} density-${pageState.ui.density}" dir="rtl" data-customer-page>
        <div class="vci-ws__shell">
          <div data-region="header">${buildHeaderHtml()}</div>
          <div data-region="toolbar">${buildToolbarHtml()}</div>
          <div data-region="panels">${buildPanelsHtml()}</div>

          <div class="vci-ws__layout">
            <div data-region="sidebar">${buildSidebarHtml()}</div>
            <main class="vci-ws__main">
              <div data-region="view">${buildViewHtml()}</div>
            </main>
          </div>
        </div>

        <div class="vci-profile-host" data-region="profile">${buildProfileHtml()}</div>
        <div class="vci-overlay-host" data-region="overlay">${buildOverlayHtml()}</div>

        <button class="vci-fab" type="button" data-action="new-customer" aria-label="مشتری جدید" title="مشتری جدید (N)">
          <span aria-hidden="true">＋</span>
        </button>
      </section>
    `;
  }

  function renderAllRegions() {
    for (const region of ['header', 'toolbar', 'panels', 'sidebar', 'view', 'profile', 'overlay']) {
      renderRegion(region);
    }
  }

  function renderRegion(region) {
    if (pageState.isDestroyed) return;

    const map = {
      header: [refs.header, buildHeaderHtml],
      toolbar: [refs.toolbar, buildToolbarHtml],
      panels: [refs.panels, buildPanelsHtml],
      sidebar: [refs.sidebar, buildSidebarHtml],
      view: [refs.view, buildViewHtml],
      profile: [refs.profile, buildProfileHtml],
      overlay: [refs.overlay, buildOverlayHtml],
    };

    const entry = map[region];
    if (!entry) return;

    const [element, builder] = entry;
    if (element) element.innerHTML = builder();
  }

  function buildHeaderHtml() {
    return renderHeader({
      ui: effectiveUi(),
      headerConfig: pageState.headerConfig,
      stats: getDashboardStats(pageState.customers),
    });
  }

  function buildToolbarHtml() {
    const visible = getVisibleCustomers();
    return renderToolbar({ ui: effectiveUi(), resultCount: visible.length, totalCount: pageState.customers.filter((c) => !c.trashed).length });
  }

  function buildPanelsHtml() {
    if (!pageState.ui.isFilterOpen) return '';
    return renderFilterPanel({ ui: effectiveUi(), ruleFields: RULE_FIELD_OPTIONS });
  }

  function buildSidebarHtml() {
    const segments = getSavedSegments();
    const segmentCounts = segments.reduce((acc, segment) => {
      acc[segment.id] = countSegment(pageState.customers, segment);
      return acc;
    }, {});

    return renderSidebar({
      ui: effectiveUi(),
      bucketCounts: countBuckets(pageState.customers),
      segmentCounts,
      stats: getDashboardStats(pageState.customers),
    });
  }

  function buildViewHtml() {
    if (pageState.isLoading) return renderLoadingState(8);
    if (pageState.error) return renderErrorState(pageState.error);

    const visible = getVisibleCustomers();

    if (visible.length === 0) {
      return renderEmptyState({ hasQuery: Boolean(pageState.ui.query || pageState.ui.quickRules.length || pageState.ui.activeSegmentId) });
    }

    const page = paginate(visible, pageState.ui.page, pageState.ui.pageSize);
    const groups = pageState.ui.groupBy !== 'none' ? groupCustomers(page.items, pageState.ui.groupBy) : null;

    return `
      ${renderBulkBar({ selectedCount: pageState.ui.selectedIds.length, ui: effectiveUi() })}
      ${renderActiveView({ customers: page.items, ui: effectiveUi(), groups, columns: pageState.ui.visibleColumns })}
      ${renderPager({ page: page.page, pageSize: pageState.ui.pageSize, total: page.total })}
    `;
  }

  function buildProfileHtml() {
    const customer = getOpenCustomer();
    if (!customer) return '';

    const sections = getFormSections(CUSTOMER_SECTION_KEYS);

    return renderProfile({ customer, ui: effectiveUi(), sections });
  }

  function buildOverlayHtml() {
    if (!pageState.ui.isCommandOpen) return '';

    return renderCommandPalette({
      commands: buildCommands(),
      query: pageState.commandQuery,
      activeIndex: pageState.commandIndex,
    });
  }

  /* ---------------- مشتق‌سازی داده ---------------- */

  function getVisibleCustomers() {
    const ui = pageState.ui;

    const segment = ui.activeSegmentId ? getSavedSegments().find((item) => item.id === ui.activeSegmentId) : null;

    const filtered = filterCustomers(pageState.customers, {
      bucket: ui.bucket,
      segment,
      rules: ui.quickRules,
      matcher: ui.quickMatcher,
      query: ui.query,
      excludeTrash: ui.bucket !== 'trash',
    });

    return sortCustomers(filtered, ui.sort, ui.sortDirection);
  }

  function paginate(items, page, pageSize) {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;

    return { items: items.slice(start, start + pageSize), page: safePage, total, totalPages };
  }

  function groupCustomers(customers, groupBy) {
    const groups = new Map();

    for (const customer of customers) {
      const key = getGroupKey(customer, groupBy);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(customer);
    }

    return Array.from(groups.entries())
      .map(([key, items]) => ({ key, label: getGroupLabel(groupBy, key), items }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fa'));
  }

  /* ================================================================== */
  /* afterRender                                                        */
  /* ================================================================== */

  function afterRender() {
    refs.root = document.querySelector('[data-customer-page]');

    if (!refs.root) {
      console.error('[CustomerInfo] Root not found after render.');
      return;
    }

    refs.header = refs.root.querySelector('[data-region="header"]');
    refs.toolbar = refs.root.querySelector('[data-region="toolbar"]');
    refs.panels = refs.root.querySelector('[data-region="panels"]');
    refs.sidebar = refs.root.querySelector('[data-region="sidebar"]');
    refs.view = refs.root.querySelector('[data-region="view"]');
    refs.profile = refs.root.querySelector('[data-region="profile"]');
    refs.overlay = refs.root.querySelector('[data-region="overlay"]');

    attachEvents();
    loadCustomers();
    startSchedulers();
  }

  function startSchedulers() {
    stopScheduler = startCampaignScheduler(
      async () => {
        const raw = await getToolData(TOOL_NAME);
        return normalizeCustomerList(raw);
      },
      {
        intervalMs: 30_000,
        persistCustomer: async (customer) => {
          const index = pageState.customers.findIndex((item) => String(item.id) === String(customer.id));
          if (index !== -1) {
            const next = [...pageState.customers];
            next[index] = normalizeCustomer(customer);
            pageState.customers = next;
            await persistAll();
          }
        },
      }
    );

    register(() => stopCampaignScheduler());
  }

  /* ================================================================== */
  /* رویدادها                                                           */
  /* ================================================================== */

  function attachEvents() {
    register(delegate(refs.root, '[data-action]', 'click', handleActionClick));
    register(on(refs.root, 'change', handleChange));
    register(on(refs.root, 'input', handleInput));
    register(on(refs.root, 'submit', handleSubmit));
    register(on(refs.root, 'focusout', handleFocusOut));
    register(on(refs.root, 'keydown', handleInlineKeydown));

    register(delegate(refs.root, '.vci-cmdk__item', 'click', (event, item) => {
      runCommand(item.dataset.commandId);
    }));

    register(delegate(refs.root, '[data-command-overlay]', 'click', (event, overlay) => {
      if (event.target === overlay) closeCommandPalette();
    }));

    register(on(globalThis.window, 'keydown', handleGlobalKeydown));

    // بستن منوی ردیف با کلیک بیرون
    register(on(globalThis.document, 'click', (event) => {
      if (pageState.rowMenuId && !event.target.closest('[data-row-menu]') && !event.target.closest('[data-action="open-menu"]')) {
        closeRowMenu();
      }
    }));
  }

  /* ---------------- کلیک روی اکشن‌ها ---------------- */

  async function handleActionClick(event, button) {
    const action = button?.dataset?.action;
    if (!action) return;

    const customerId = button.dataset.customerId || null;

    switch (action) {
      /* --- ناوبری نما --- */
      case 'set-view':
        setUi({ view: button.dataset.view, page: 1 }, { regions: ['toolbar', 'view'] });
        return;

      case 'set-bucket':
        setUi({ bucket: button.dataset.bucket, activeSegmentId: null, page: 1 }, { regions: ['sidebar', 'toolbar', 'view'] });
        return;

      case 'set-segment': {
        const segmentId = button.dataset.segmentId;
        setUi({ activeSegmentId: pageState.ui.activeSegmentId === segmentId ? null : segmentId, bucket: 'all', page: 1 }, { regions: ['sidebar', 'toolbar', 'view'] });
        return;
      }

      case 'set-scope':
        setUi({ queryScope: button.value }, { regions: [] });
        return;

      case 'set-sort':
        setUi({ sort: button.value, page: 1 }, { regions: ['view'] });
        return;

      case 'set-group':
        setUi({ groupBy: button.value }, { regions: ['view'] });
        return;

      case 'toggle-sort-dir':
        setUi({ sortDirection: pageState.ui.sortDirection === 'asc' ? 'desc' : 'asc' }, { regions: ['toolbar', 'view'] });
        return;

      case 'sort-column': {
        const key = columnToSortKey(button.dataset.sortKey);
        const direction = pageState.ui.sort === key && pageState.ui.sortDirection === 'desc' ? 'asc' : 'desc';
        setUi({ sort: key, sortDirection: direction, page: 1 }, { regions: ['toolbar', 'view'] });
        return;
      }

      case 'set-page':
        setUi({ page: Number(button.dataset.page) || 1 }, { regions: ['view'] });
        return;

      case 'toggle-filter':
        setUi({ isFilterOpen: !pageState.ui.isFilterOpen }, { regions: ['toolbar', 'panels'] });
        return;

      case 'toggle-theme':
        setUi({ theme: pageState.ui.theme === 'light' ? 'dark' : 'light' }, { regions: [] });
        refs.root.classList.toggle('theme-light', pageState.ui.theme === 'light');
        refs.root.classList.toggle('theme-dark', pageState.ui.theme !== 'light');
        return;

      case 'toggle-sidebar':
        setUi({ isSidebarOpen: !pageState.ui.isSidebarOpen }, { regions: ['sidebar'] });
        return;

      case 'reload':
        await loadCustomers();
        return;

      /* --- پروفایل --- */
      case 'open-profile':
        openProfile(customerId);
        return;

      case 'close-profile':
        setUi({ openCustomerId: null }, { regions: ['profile'] });
        return;

      case 'set-profile-tab':
        setUi({ profileTab: button.dataset.tab }, { regions: ['profile'] });
        return;

      case 'edit-section':
        openSectionEditor(customerId || pageState.ui.openCustomerId, button.dataset.section);
        return;

      /* --- ویرایش درجا --- */
      case 'edit-field':
        startInlineEdit(button);
        return;

      case 'set-rating': {
        const fieldKey = button.dataset.fieldKey;
        const value = Number(button.dataset.value);
        await applyCustomerChange(button.dataset.customerId, (customer) => ({ ...customer, [fieldKey]: value }), { activity: 'ویرایش امتیاز' });
        return;
      }

      /* --- انتخاب --- */
      case 'toggle-select':
        // در handleChange مدیریت می‌شود
        return;

      case 'clear-selection':
        setUi({ selectedIds: [] }, { regions: ['view'] });
        return;

      case 'toggle-favorite':
        await applyCustomerChange(customerId, (customer) => ({ ...customer, favorite: !customer.favorite }), { activity: customer => customer.favorite ? 'ستاره‌دار شد' : 'ستاره برداشته شد' });
        return;

      case 'toggle-pin':
        await applyCustomerChange(customerId, (customer) => ({ ...customer, pinned: !customer.pinned }), { activity: 'سنجاق' });
        return;

      case 'toggle-archive':
        await applyCustomerChange(customerId, (customer) => ({ ...customer, archived: !customer.archived }), { activity: 'آرشیو' });
        return;

      case 'trash-customer':
        await trashCustomer(customerId);
        return;

      case 'open-menu':
        openRowMenu(customerId, button);
        return;

      /* --- اکشن‌های سرصفحه --- */
      case 'header-action':
        await runHeaderAction(button.dataset.headerActionId);
        return;

      case 'new-customer':
        openCustomerForm(null);
        return;

      case 'toggle-command':
        toggleCommandPalette();
        return;

      /* --- کمپین و پیام --- */
      case 'campaign':
      case 'bulk-campaign':
        openCampaignModal(getSelectedCustomers());
        return;

      case 'quick-message':
        openMessageModal(customerId, 'message');
        return;

      case 'quick-notify':
        openMessageModal(customerId, 'notify');
        return;

      case 'schedule-message':
        openMessageModal(customerId, 'message', { scheduled: true });
        return;

      /* --- بخش‌ها --- */
      case 'segments':
      case 'open-segments':
        openSegmentsModal();
        return;

      case 'new-segment':
        openSegmentEditor(null);
        return;

      case 'edit-segment':
        openSegmentEditor(button.dataset.segmentId);
        return;

      case 'delete-segment':
        await removeSegment(button.dataset.segmentId);
        return;

      /* --- ایمپورت/خروجی --- */
      case 'import':
      case 'open-import':
        openImportModal();
        return;

      case 'export':
      case 'bulk-export':
        exportCustomers(getSelectedCustomers().length ? getSelectedCustomers() : getVisibleCustomers());
        return;

      case 'dashboard':
      case 'open-dashboard':
        openDashboardModal();
        return;

      case 'settings':
      case 'open-settings':
        openSettingsModal();
        return;

      /* --- اقدام گروهی --- */
      case 'bulk-tag':
        openBulkTagModal();
        return;

      case 'bulk-status':
        openBulkStatusModal();
        return;

      case 'bulk-trash':
        await bulkTrash();
        return;

      /* --- فیلتر --- */
      case 'add-rule':
        addQuickRule();
        return;

      case 'remove-rule':
        removeQuickRule(Number(button.dataset.ruleIndex));
        return;

      case 'clear-rules':
        setUi({ quickRules: [], page: 1 }, { regions: ['panels', 'toolbar', 'view'] });
        return;

      case 'rule-field':
      case 'rule-operator':
      case 'rule-value':
        // در handleChange مدیریت می‌شود
        return;

      case 'stop':
        event.preventDefault();
        event.stopPropagation();
        return;

      default:
        return;
    }
  }

  /* ---------------- تغییر select/checkbox ---------------- */

  async function handleChange(event) {
    const target = event.target;
    const action = target.dataset?.action;

    // انتخاب ردیف
    if (target.dataset?.action === 'toggle-select') {
      const customerId = target.dataset.customerId;
      const next = toggleSelection(pageState.ui.selectedIds, customerId);
      setUi({ selectedIds: next }, { regions: ['view'] });
      return;
    }

    // فیلد درجا با autosave (select/checkbox)
    if (target.hasAttribute?.('data-inline-input') && target.hasAttribute?.('data-autosave')) {
      await commitInlineEdit(target);
      return;
    }

    // matcher فیلتر
    if (action === 'set-matcher') {
      setUi({ quickMatcher: target.checked ? 'any' : 'all', page: 1 }, { regions: ['view'] });
      return;
    }

    // بخش فرم
    if (action === 'toggle-form-section') {
      const sectionKey = target.dataset.section;
      const formSection = target.closest('.vci-formsection');
      if (formSection) formSection.classList.toggle('is-open', target.checked);
      return;
    }

    // scope/sort/group select ها
    if (action === 'set-scope') {
      setUi({ queryScope: target.value }, { regions: [] });
      return;
    }
    if (action === 'set-sort') {
      setUi({ sort: target.value, page: 1 }, { regions: ['view'] });
      return;
    }
    if (action === 'set-group') {
      setUi({ groupBy: target.value }, { regions: ['view'] });
      return;
    }

    // operator قاعدهٔ فیلتر → toggle value input
    if (action === 'rule-operator') {
      const index = Number(target.dataset.ruleIndex);
      const row = target.closest('.vci-rule');
      const meta = RULE_OPERATORS.find((op) => op.key === target.value);
      const valueInput = row?.querySelector('.vci-rule__value');
      if (valueInput) valueInput.disabled = meta?.needsValue === false;

      updateQuickRule(index, { operator: target.value });
      return;
    }

    if (action === 'rule-field') {
      updateQuickRule(Number(target.dataset.ruleIndex), { field: target.value });
      return;
    }
  }

  /* ---------------- ورودی متن ---------------- */

  function handleInput(event) {
    const target = event.target;

    if (target.dataset?.action === 'search') {
      debouncedSearch(target.value);
      return;
    }

    if (target.dataset?.action === 'command-input') {
      pageState.commandQuery = target.value;
      pageState.commandIndex = 0;
      renderRegion('overlay');
      const input = refs.overlay?.querySelector('[data-action="command-input"]');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
      return;
    }

    if (target.dataset?.action === 'rule-value') {
      updateQuickRule(Number(target.dataset.ruleIndex), { value: target.value }, { rerender: false });
      return;
    }

    // پیش‌نمایش کمپین/پیام
    if (target.dataset?.campaignText !== undefined || target.dataset?.messageText !== undefined) {
      updateMergePreview(target.closest('form'));
      return;
    }
  }

  const debouncedSearch = debounce((value) => {
    setUi({ query: value, page: 1 }, { regions: ['toolbar', 'view'] });
    const input = refs.toolbar?.querySelector('[data-action="search"]');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 220);

  /* ---------------- ذخیرهٔ درجا با blur/Enter ---------------- */

  function handleFocusOut(event) {
    const target = event.target;
    if (target.hasAttribute?.('data-inline-input') && !target.hasAttribute?.('data-autosave')) {
      commitInlineEdit(target);
    }
  }

  function handleInlineKeydown(event) {
    const target = event.target;
    if (!target.hasAttribute?.('data-inline-input')) return;

    if (event.key === 'Enter' && target.tagName !== 'TEXTAREA') {
      event.preventDefault();
      commitInlineEdit(target);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelInlineEdit(target);
    }
  }

  function startInlineEdit(button) {
    const fieldKey = button.dataset.fieldKey;
    const customerId = button.dataset.customerId;
    const field = CUSTOMER_FIELD_MAP[fieldKey];
    const customer = findCustomer(customerId);
    if (!field || !customer) return;

    const fieldEl = button.closest('.vci-field');
    if (!fieldEl || fieldEl.querySelector('[data-inline-input]')) return;

    const inputHtml = buildInlineInput(field, customer[fieldKey], { customerId });
    button.style.display = 'none';

    const wrapper = document.createElement('div');
    wrapper.className = 'vci-field__editor';
    wrapper.innerHTML = inputHtml;
    fieldEl.appendChild(wrapper);

    const input = wrapper.querySelector('[data-inline-input]');
    if (input) {
      input.focus();
      if (input.select) input.select();
    }
  }

  async function commitInlineEdit(input) {
    const fieldKey = input.dataset.fieldKey;
    const customerId = input.dataset.customerId;
    const field = CUSTOMER_FIELD_MAP[fieldKey];
    if (!field) return;

    const value = readInlineValue(field, input);
    const customer = findCustomer(customerId);
    if (!customer) return;

    // اگر مقدار عوض نشده، فقط ویرایشگر را ببند
    if (String(customer[fieldKey] ?? '') === String(value ?? '')) {
      cancelInlineEdit(input);
      return;
    }

    await applyCustomerChange(
      customerId,
      (current) => ({ ...current, [fieldKey]: value }),
      { activity: `ویرایش ${field.label}`, regions: ['view', 'profile', 'sidebar'] }
    );
  }

  function cancelInlineEdit(input) {
    const fieldEl = input.closest('.vci-field');
    const editor = input.closest('.vci-field__editor');
    const button = fieldEl?.querySelector('.vci-field__value');

    if (editor) editor.remove();
    if (button) button.style.display = '';
  }

  /* ---------------- submit فرم‌ها ---------------- */

  function handleSubmit(event) {
    event.preventDefault();
  }

  /* ---------------- کلیدهای سراسری ---------------- */

  function handleGlobalKeydown(event) {
    const isMac = /mac|iphone|ipad/i.test(globalThis.navigator?.userAgent || '');
    const modKey = isMac ? event.metaKey : event.ctrlKey;

    if (modKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      toggleCommandPalette();
      return;
    }

    if (event.key === 'Escape') {
      if (pageState.ui.isCommandOpen) closeCommandPalette();
      else if (pageState.ui.openCustomerId) setUi({ openCustomerId: null }, { regions: ['profile'] });
      else if (pageState.rowMenuId) closeRowMenu();
      return;
    }

    // میان‌بر N برای مشتری جدید (وقتی فوکوس روی input نیست)
    if (event.key.toLowerCase() === 'n' && !isTypingTarget(event.target) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      openCustomerForm(null);
    }
  }

  function isTypingTarget(target) {
    return target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  }

  /* ================================================================== */
  /* پروفایل                                                            */
  /* ================================================================== */

  function openProfile(customerId) {
    if (!customerId) return;
    setUi({ openCustomerId: customerId, profileTab: 'overview' }, { regions: ['profile'] });
    refs.profile?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  /* ================================================================== */
  /* منوی ردیف                                                          */
  /* ================================================================== */

  function openRowMenu(customerId, button) {
    closeRowMenu();

    const customer = findCustomer(customerId);
    if (!customer) return;

    const menu = document.createElement('div');
    menu.innerHTML = renderRowMenu(customer);
    const menuEl = menu.firstElementChild;

    const rect = button.getBoundingClientRect();
    menuEl.style.position = 'fixed';
    menuEl.style.top = `${rect.bottom + 4}px`;
    menuEl.style.left = `${Math.max(8, rect.right - 200)}px`;
    menuEl.style.zIndex = '60';

    document.body.appendChild(menuEl);
    pageState.rowMenuId = customerId;
    pageState.rowMenuEl = menuEl;
  }

  function closeRowMenu() {
    if (pageState.rowMenuEl) {
      pageState.rowMenuEl.remove();
      pageState.rowMenuEl = null;
    }
    pageState.rowMenuId = null;
  }

  /* ================================================================== */
  /* پالت فرمان                                                         */
  /* ================================================================== */

  function toggleCommandPalette() {
    setUi({ isCommandOpen: !pageState.ui.isCommandOpen }, { regions: ['overlay'] });

    if (pageState.ui.isCommandOpen) {
      pageState.commandQuery = '';
      pageState.commandIndex = 0;
      setTimeout(() => refs.overlay?.querySelector('[data-action="command-input"]')?.focus(), 30);
    }
  }

  function closeCommandPalette() {
    setUi({ isCommandOpen: false }, { regions: ['overlay'] });
  }

  function buildCommands() {
    const commands = [
      { id: 'new-customer', label: 'مشتری جدید', icon: '＋' },
      { id: 'open-campaign', label: 'کمپین گروهی', icon: '📣' },
      { id: 'open-segments', label: 'مدیریت بخش‌ها', icon: '🎯' },
      { id: 'open-import', label: 'ایمپورت مشتریان', icon: '⬆' },
      { id: 'open-export', label: 'خروجی CSV', icon: '⬇' },
      { id: 'open-dashboard', label: 'داشبورد آماری', icon: '📊' },
      { id: 'open-settings', label: 'تنظیمات', icon: '⚙' },
      { id: 'toggle-theme', label: 'تغییر پوسته', icon: '🌓' },
    ];

    for (const bucket of SMART_BUCKETS.slice(0, 12)) {
      commands.push({ id: `bucket:${bucket.key}`, label: `سطل: ${bucket.label}`, icon: bucket.icon });
    }

    return commands;
  }

  function runCommand(commandId) {
    if (!commandId) return;

    closeCommandPalette();

    if (commandId.startsWith('bucket:')) {
      setUi({ bucket: commandId.slice(7), activeSegmentId: null, page: 1 }, { regions: ['sidebar', 'toolbar', 'view'] });
      return;
    }

    const map = {
      'new-customer': () => openCustomerForm(null),
      'open-campaign': () => openCampaignModal(getSelectedCustomers()),
      'open-segments': () => openSegmentsModal(),
      'open-import': () => openImportModal(),
      'open-export': () => exportCustomers(getVisibleCustomers()),
      'open-dashboard': () => openDashboardModal(),
      'open-settings': () => openSettingsModal(),
      'toggle-theme': () => setUi({ theme: pageState.ui.theme === 'light' ? 'dark' : 'light' }, { regions: [] }),
    };

    map[commandId]?.();
  }

  async function runHeaderAction(actionId) {
    const meta = HEADER_ACTION_META[actionId];
    if (!meta) return;

    await runCommand(meta.command);
  }

  /* ================================================================== */
  /* مودال: مشتری جدید / ویرایش کامل                                    */
  /* ================================================================== */

  function openCustomerForm(customerId) {
    const customer = customerId ? findCustomer(customerId) : null;

    const modal = createModal({
      title: customer ? `ویرایش ${getCustomerName(customer)}` : 'مشتری جدید',
      size: 'wide',
      bodyHtml: buildSectionForm({ customer, activeSections: pageState.ui.activeFormSections, mode: customer ? 'edit' : 'create' }),
      actions: [
        { id: 'cancel', label: 'انصراف', variant: 'ghost' },
        {
          id: 'save',
          label: customer ? 'ذخیره تغییرات' : 'افزودن مشتری',
          variant: 'primary',
          onClick: async ({ dialog }) => {
            const form = dialog.querySelector('[data-customer-form]');
            const draft = readSectionForm(form);

            const validation = validateCustomerDraft(draft);
            if (!validation.valid) {
              showFormErrors(form, validation.errors || {});
              toast.error(validation.message);
              return false;
            }

            if (customer) {
              await applyCustomerChange(customer.id, (current) => normalizeCustomer({ ...current, ...draft }), { activity: 'ویرایش کامل پروفایل' });
              toast.success('تغییرات ذخیره شد.');
            } else {
              const newCustomer = normalizeCustomer(draft);
              await addCustomers([newCustomer]);
              toast.success('مشتری اضافه شد.');
            }

            return true;
          },
        },
      ],
    });

    modal.open();
  }

  function openSectionEditor(customerId, sectionKey) {
    const customer = findCustomer(customerId);
    if (!customer) return;

    const section = getFormSections([sectionKey]).find((item) => item.key === sectionKey);
    if (!section) return;

    const modal = createModal({
      title: `ویرایش ${section.label}`,
      size: 'wide',
      bodyHtml: `<form class="vci-form" data-customer-form><div class="vci-formgrid">${section.fields.map((field) => buildFormFieldHtml(field, customer[field.key])).join('')}</div></form>`,
      actions: [
        { id: 'cancel', label: 'انصراف', variant: 'ghost' },
        {
          id: 'save',
          label: 'ذخیره',
          variant: 'primary',
          onClick: async ({ dialog }) => {
            const form = dialog.querySelector('[data-customer-form]');
            const draft = {};

            for (const field of section.fields) {
              const element = form.querySelector(`[name="${field.key}"]`);
              if (!element) continue;
              draft[field.key] = field.type === 'checkbox' ? element.checked : readInlineValue(field, element);
            }

            await applyCustomerChange(customerId, (current) => ({ ...current, ...draft }), { activity: `ویرایش ${section.label}` });
            toast.success('ذخیره شد.');
            return true;
          },
        },
      ],
    });

    modal.open();
  }

  // برای ساخت فیلد فرم در مودال بخش (از editor وارد نشده، محلی تعریف می‌شود)
  function buildFormFieldHtml(field, value) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildSectionForm({ customer: createEmptyCustomer({ [field.key]: value }), activeSections: [], mode: 'edit' });
    const fieldEl = wrapper.querySelector(`.vci-formfield[data-field-key="${field.key}"]`);
    return fieldEl ? fieldEl.outerHTML : '';
  }

  /* ================================================================== */
  /* مودال: کمپین گروهی                                                 */
  /* ================================================================== */

  function openCampaignModal(customers) {
    const list = Array.isArray(customers) ? customers : [];

    if (list.length === 0) {
      toast.warning('اول حداقل یک مشتری انتخاب کنید.');
      return;
    }

    const modal = createModal({
      title: 'کمپین گروهی',
      size: 'wide',
      bodyHtml: buildCampaignForm({ customerCount: list.length, customers: list }),
      actions: [
        { id: 'cancel', label: 'انصراف', variant: 'ghost' },
        {
          id: 'send',
          label: 'ارسال',
          variant: 'primary',
          onClick: async ({ dialog, button }) => {
            const form = dialog.querySelector('[data-campaign-form]');
            const channel = form.querySelector('[data-campaign-channel]').value;
            const subject = form.querySelector('[data-campaign-subject]').value;
            const text = form.querySelector('[data-campaign-text]').value;
            const scheduled = form.querySelector('[data-campaign-scheduled]').checked;
            const scheduledFor = form.querySelector('[data-campaign-schedule-for]').value;

            if (!text.trim()) {
              toast.error('متن پیام خالی است.');
              return false;
            }

            button.disabled = true;
            button.textContent = 'در حال ارسال…';

            const result = await sendBulkCampaign({
              customers: list,
              channel,
              text,
              subject,
              scheduledFor: scheduled && scheduledFor ? new Date(scheduledFor).toISOString() : '',
              persistCustomer: async (customer) => {
                const index = pageState.customers.findIndex((item) => String(item.id) === String(customer.id));
                if (index !== -1) {
                  const next = [...pageState.customers];
                  next[index] = normalizeCustomer(customer);
                  pageState.customers = next;
                }
              },
            });

            await persistAll();

            if (result.scheduled) {
              toast.success(`کمپین برای ${list.length} مشتری زمان‌بندی شد.`);
            } else {
              toast.success(`کمپین ارسال شد: ${result.delivered} موفق${result.failed ? `، ${result.failed} ناموفق` : ''}.`);
            }

            setUi({ selectedIds: [] }, { regions: ['view'] });
            return true;
          },
        },
      ],
    });

    modal.open();
    setTimeout(() => updateMergePreview(modal.bodyElement?.querySelector('[data-campaign-form]'), list[0]), 50);
  }

  function updateMergePreview(form, customer = null) {
    if (!form) return;

    const previewEl = form.querySelector('[data-preview-text]');
    const textEl = form.querySelector('[data-campaign-text], [data-message-text]');
    if (!previewEl || !textEl) return;

    const target = customer || getSelectedCustomers()[0] || pageState.customers[0];
    if (!target) {
      previewEl.textContent = textEl.value || '—';
      return;
    }

    previewEl.textContent = applyMergeFields(textEl.value || '', target);
  }

  /* ================================================================== */
  /* مودال: ارسال پیام شخصی                                             */
  /* ================================================================== */

  function openMessageModal(customerId, mode = 'message', options = {}) {
    const customer = findCustomer(customerId);
    if (!customer) return;

    const modal = createModal({
      title: mode === 'notify' ? 'ارسال نوتیفیکیشن' : 'ارسال پیام',
      bodyHtml: buildMessageForm({ customer, mode }),
      actions: [
        { id: 'cancel', label: 'انصراف', variant: 'ghost' },
        {
          id: 'send',
          label: 'ارسال',
          variant: 'primary',
          onClick: async ({ dialog }) => {
            const form = dialog.querySelector('[data-message-form]');
            const channel = form.querySelector('[data-message-channel]').value;
            const subject = form.querySelector('[data-message-subject]').value;
            const text = form.querySelector('[data-message-text]').value;

            if (!text.trim()) {
              toast.error('متن پیام خالی است.');
              return false;
            }

            const result = await sendCustomerMessage(customer, {
              channel,
              subject,
              text,
              persistCustomer: async (updated) => {
                await applyCustomerChange(customer.id, () => normalizeCustomer(updated), { activity: 'ارسال پیام' });
              },
            });

            if (result.delivered) toast.success('ارسال شد.');
            else if (result.queued) toast.info('در صف ارسال قرار گرفت.');
            else toast.error(result.error || 'ارسال ناموفق بود.');

            return true;
          },
        },
      ],
    });

    modal.open();

    if (options.scheduled) {
      setTimeout(() => {
        const checkbox = modal.bodyElement?.querySelector('[data-message-scheduled]');
        if (checkbox) checkbox.checked = true;
      }, 50);
    }
  }

  /* ================================================================== */
  /* مودال: بخش‌ها                                                      */
  /* ================================================================== */

  function openSegmentsModal() {
    const modal = createModal({
      title: 'مدیریت بخش‌ها',
      size: 'wide',
      bodyHtml: buildSegmentsManager({ segments: getSavedSegments() }),
      actions: [{ id: 'close', label: 'بستن', variant: 'primary' }],
    });

    modal.open();

    // سیم‌کشی دکمه‌های داخل مودال
    const body = modal.bodyElement;
    if (!body) return;

    body.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;

      const action = button.dataset.action;

      if (action === 'new-segment') {
        modal.close();
        openSegmentEditor(null);
      } else if (action === 'edit-segment') {
        modal.close();
        openSegmentEditor(button.dataset.segmentId);
      } else if (action === 'delete-segment') {
        removeSegment(button.dataset.segmentId).then(() => {
          modal.close();
          openSegmentsModal();
        });
      }
    });
  }

  function openSegmentEditor(segmentId) {
    const segment = segmentId ? getSavedSegments().find((item) => item.id === segmentId) : null;

    const modal = createModal({
      title: segment ? 'ویرایش بخش' : 'بخش جدید',
      size: 'wide',
      bodyHtml: buildSegmentForm({ segment }),
      actions: [
        { id: 'cancel', label: 'انصراف', variant: 'ghost' },
        {
          id: 'save',
          label: 'ذخیره بخش',
          variant: 'primary',
          onClick: ({ dialog }) => {
            const form = dialog.querySelector('[data-segment-form]');
            const data = readSegmentForm(form);

            if (!data || data.rules.length === 0) {
              toast.error('حداقل یک شرط اضافه کنید.');
              return false;
            }

            saveSegment(data);
            toast.success('بخش ذخیره شد.');
            setUi({}, { regions: ['sidebar'] });
            return true;
          },
        },
      ],
    });

    modal.open();

    // سیم‌کشی افزودن/حذف شرط
    const body = modal.bodyElement;
    if (!body) return;

    body.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;

      const rulesHost = body.querySelector('[data-seg-rules]');

      if (button.dataset.action === 'add-seg-rule') {
        const count = rulesHost.querySelectorAll('.vci-segrule').length;
        const template = body.querySelector('[data-rule-template]');
        const clone = document.createElement('div');
        clone.innerHTML = template.innerHTML.replace(/__INDEX__/g, String(count));
        rulesHost.appendChild(clone.firstElementChild);
      } else if (button.dataset.action === 'remove-seg-rule') {
        button.closest('.vci-segrule')?.remove();
      }
    });
  }

  async function removeSegment(segmentId) {
    const confirmed = await confirmDialog({ title: 'حذف بخش', message: 'این بخش حذف شود؟', confirmLabel: 'حذف', variant: 'danger' });
    if (!confirmed) return;

    deleteSegment(segmentId);
    toast.success('بخش حذف شد.');
    setUi({ activeSegmentId: null }, { regions: ['sidebar', 'view'] });
  }

  /* ================================================================== */
  /* مودال: ایمپورت                                                     */
  /* ================================================================== */

  function openImportModal() {
    const modal = createModal({
      title: 'ایمپورت مشتریان',
      size: 'wide',
      bodyHtml: buildImportForm(),
      actions: [{ id: 'close', label: 'بستن', variant: 'primary' }],
    });

    modal.open();

    const body = modal.bodyElement;
    if (!body) return;

    const fileInput = body.querySelector('[data-import-file]');
    const textArea = body.querySelector('[data-import-text]');
    const previewHost = body.querySelector('[data-import-preview]');
    let previewed = [];

    body.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;

      if (button.dataset.action === 'import-preview') {
        const text = textArea.value.trim();
        if (!text) {
          toast.warning('ابتدا یک فایل انتخاب کنید یا محتوا را بچسبانید.');
          return;
        }

        const { rows } = parseCsv(text);
        const preview = previewImport(rows, pageState.customers);
        previewed = preview.valid;

        previewHost.innerHTML = `
          <div class="vci-import__summary">
            <span class="vci-pill vci-pill--ok">${preview.validCount} معتبر</span>
            <span class="vci-pill vci-pill--warn">${preview.duplicateCount} تکراری</span>
            <span class="vci-pill vci-pill--err">${preview.invalidCount} نامعتبر</span>
          </div>
          <button class="vci-btn vci-btn--primary" type="button" data-action="import-confirm" ${preview.validCount === 0 ? 'disabled' : ''}>افزودن ${preview.validCount} مشتری</button>
        `;
      } else if (button.dataset.action === 'import-confirm') {
        if (previewed.length === 0) return;

        await addCustomers(previewed);
        toast.success(`${previewed.length} مشتری اضافه شد.`);
        modal.close();
      }
    });

    fileInput?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      textArea.value = text;
      toast.info('فایل خوانده شد. روی «پیش‌نمایش» بزنید.');
    });
  }

  /* ================================================================== */
  /* مودال: داشبورد                                                     */
  /* ================================================================== */

  function openDashboardModal() {
    const modal = createModal({
      title: 'داشبورد آماری',
      size: 'wide',
      bodyHtml: renderDashboard({ stats: getDashboardStats(pageState.customers) }),
      actions: [{ id: 'close', label: 'بستن', variant: 'primary' }],
    });

    modal.open();
  }

  /* ================================================================== */
  /* مودال: تنظیمات                                                     */
  /* ================================================================== */

  function openSettingsModal() {
    const settings = { ...getOutreachSettings(), pageSize: pageState.ui.pageSize };

    const modal = createModal({
      title: 'تنظیمات ابزار',
      bodyHtml: buildSettingsForm({ settings }),
      actions: [
        { id: 'cancel', label: 'انصراف', variant: 'ghost' },
        {
          id: 'save',
          label: 'ذخیره',
          variant: 'primary',
          onClick: ({ dialog }) => {
            const form = dialog.querySelector('[data-settings-form]');
            const data = Object.fromEntries(new FormData(form).entries());

            updateOutreachSettings({
              brandName: data.brandName || 'ViXoRa',
              countryCode: data.countryCode || '98',
              webhookUrl: data.webhookUrl || '',
              webhookApiKey: data.webhookApiKey || '',
            });

            const pageSize = Math.max(6, Math.min(200, Number(data.pageSize) || 24));
            setUi({ pageSize }, { regions: ['view'] });

            toast.success('تنظیمات ذخیره شد.');
            return true;
          },
        },
      ],
    });

    modal.open();
  }

  /* ================================================================== */
  /* مودال: نقشه                                                        */
  /* ================================================================== */

  function openMapModal(customerId) {
    const customer = findCustomer(customerId);
    if (!customer) return;

    const modal = createModal({
      title: 'انتخاب موقعیت روی نقشه',
      size: 'wide',
      bodyHtml: buildMapPicker({ lat: customer.lat, lng: customer.lng, address: customer.address }),
      actions: [
        { id: 'cancel', label: 'انصراف', variant: 'ghost' },
        {
          id: 'save',
          label: 'ذخیره موقعیت',
          variant: 'primary',
          onClick: async ({ dialog }) => {
            const lat = dialog.querySelector('[data-map-lat]').value;
            const lng = dialog.querySelector('[data-map-lng]').value;
            const address = dialog.querySelector('[data-map-address]').value;

            await applyCustomerChange(customerId, (current) => applyLocation(current, { lat, lng, address, source: 'map' }), { activity: 'به‌روزرسانی موقعیت' });
            toast.success('موقعیت ذخیره شد.');
            return true;
          },
        },
      ],
    });

    modal.open();

    const body = modal.bodyElement;
    if (!body) return;

    body.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;

      const latInput = body.querySelector('[data-map-lat]');
      const lngInput = body.querySelector('[data-map-lng]');
      const addrInput = body.querySelector('[data-map-address]');
      const resultsHost = body.querySelector('[data-map-results]');
      const canvas = body.querySelector('[data-map-canvas]');

      if (button.dataset.action === 'map-search') {
        const query = body.querySelector('[data-map-query]').value;
        resultsHost.innerHTML = '<p class="vci-muted">در حال جستجو…</p>';

        const results = await geocode(query, { limit: 5 });
        if (results.length === 0) {
          resultsHost.innerHTML = '<p class="vci-muted">نتیجه‌ای یافت نشد.</p>';
          return;
        }

        resultsHost.innerHTML = results
          .map((result, index) => `<button class="vci-mapresult" type="button" data-action="map-pick" data-index="${index}">${escapeHtml(result.displayName)}</button>`)
          .join('');

        resultsHost._results = results;
      } else if (button.dataset.action === 'map-pick') {
        const index = Number(button.dataset.index);
        const result = resultsHost._results?.[index];
        if (!result) return;

        latInput.value = result.lat;
        lngInput.value = result.lng;
        addrInput.value = result.displayName;
        renderMapCanvas(canvas, result.lat, result.lng);
      } else if (button.dataset.action === 'map-locate') {
        const position = await getCurrentPosition();
        if (!position) {
          toast.warning('دسترسی به موقعیت ممکن نشد.');
          return;
        }

        latInput.value = position.lat;
        lngInput.value = position.lng;
        renderMapCanvas(canvas, position.lat, position.lng);

        const reverse = await reverseGeocode(position.lat, position.lng);
        if (reverse) addrInput.value = formatAddressParts(reverse);
      } else if (button.dataset.action === 'map-apply-coords') {
        renderMapCanvas(canvas, latInput.value, lngInput.value);

        const reverse = await reverseGeocode(latInput.value, lngInput.value);
        if (reverse) {
          addrInput.value = formatAddressParts(reverse);
          if (reverse.city) {
            await applyCustomerChange(customerId, (current) => ({ ...current, city: current.city || reverse.city }), { regions: [] });
          }
        }
      }
    });

    if (customer.lat && customer.lng) {
      renderMapCanvas(body.querySelector('[data-map-canvas]'), customer.lat, customer.lng);
    }
  }

  function renderMapCanvas(canvas, lat, lng) {
    if (!canvas) return;

    const url = buildOsmEmbedUrl(lat, lng);
    if (!url) return;

    canvas.innerHTML = `<iframe class="vci-mapframe" src="${escapeHtml(url)}" loading="lazy" title="نقشه"></iframe>`;
  }

  /* ================================================================== */
  /* مودال: برچسب/وضعیت گروهی                                          */
  /* ================================================================== */

  function openBulkTagModal() {
    const selected = getSelectedCustomers();
    if (selected.length === 0) {
      toast.warning('اول مشتری انتخاب کنید.');
      return;
    }

    const modal = createModal({
      title: 'افزودن برچسب گروهی',
      bodyHtml: `<input class="vci-input" type="text" data-bulk-tag placeholder="برچسب را وارد کنید…">`,
      actions: [
        { id: 'cancel', label: 'انصراف', variant: 'ghost' },
        {
          id: 'apply',
          label: 'افزودن',
          variant: 'primary',
          onClick: async ({ dialog }) => {
            const tag = dialog.querySelector('[data-bulk-tag]').value.trim();
            if (!tag) return false;

            for (const customer of selected) {
              await applyCustomerChange(customer.id, (current) => {
                const tags = new Set(current.tags || []);
                tags.add(tag);
                return { ...current, tags: [...tags] };
              }, { activity: 'افزودن برچسب' });
            }

            toast.success(`برچسب به ${selected.length} مشتری اضافه شد.`);
            return true;
          },
        },
      ],
    });

    modal.open();
  }

  function openBulkStatusModal() {
    const selected = getSelectedCustomers();
    if (selected.length === 0) {
      toast.warning('اول مشتری انتخاب کنید.');
      return;
    }

    const statuses = ['active', 'inactive', 'lead', 'churned', 'blocked'];

    const modal = createModal({
      title: 'تغییر وضعیت گروهی',
      bodyHtml: `<select class="vci-input" data-bulk-status>${statuses.map((status) => `<option value="${status}">${status}</option>`).join('')}</select>`,
      actions: [
        { id: 'cancel', label: 'انصراف', variant: 'ghost' },
        {
          id: 'apply',
          label: 'اعمال',
          variant: 'primary',
          onClick: async ({ dialog }) => {
            const status = dialog.querySelector('[data-bulk-status]').value;

            for (const customer of selected) {
              await applyCustomerChange(customer.id, (current) => ({ ...current, status }), { activity: 'تغییر وضعیت' });
            }

            toast.success(`وضعیت ${selected.length} مشتری تغییر کرد.`);
            return true;
          },
        },
      ],
    });

    modal.open();
  }

  /* ================================================================== */
  /* عملیات گروهی                                                       */
  /* ================================================================== */

  function getSelectedCustomers() {
    return pageState.customers.filter((customer) => pageState.ui.selectedIds.includes(customer.id));
  }

  async function trashCustomer(customerId) {
    const confirmed = await confirmDialog({ title: 'حذف مشتری', message: 'این مشتری به زباله‌دان منتقل شود؟', confirmLabel: 'حذف', variant: 'danger' });
    if (!confirmed) return;

    await applyCustomerChange(customerId, (customer) => ({ ...customer, trashed: true, deletedAt: new Date().toISOString() }), { activity: 'حذف' });
    toast.success('به زباله‌دان منتقل شد.');
  }

  async function bulkTrash() {
    const selected = getSelectedCustomers();
    if (selected.length === 0) return;

    const confirmed = await confirmDialog({ title: 'حذف گروهی', message: `${selected.length} مشتری به زباله‌دان منتقل شوند؟`, confirmLabel: 'حذف', variant: 'danger' });
    if (!confirmed) return;

    for (const customer of selected) {
      await applyCustomerChange(customer.id, (current) => ({ ...current, trashed: true, deletedAt: new Date().toISOString() }), { activity: 'حذف' });
    }

    setUi({ selectedIds: [] }, { regions: ['view'] });
    toast.success(`${selected.length} مشتری حذف شدند.`);
  }

  async function addCustomers(newCustomers) {
    const list = Array.isArray(newCustomers) ? newCustomers : [];
    if (list.length === 0) return;

    for (const customer of list) {
      const created = await createToolItem(TOOL_NAME, customer, { signal: ctx.signal });
      pageState.customers = [...pageState.customers, normalizeCustomer(created || customer)];
    }

    renderAllRegions();
    await persistAll();
  }

  function exportCustomers(customers) {
    const list = Array.isArray(customers) ? customers : [];
    if (list.length === 0) {
      toast.warning('چیزی برای خروجی نیست.');
      return;
    }

    const csv = customersToCsv(list);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `vixora-customers-${Date.now()}.csv`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`${list.length} مشتری خروجی گرفته شد.`);
  }

  /* ================================================================== */
  /* فیلتر سریع                                                         */
  /* ================================================================== */

  function addQuickRule() {
    const rules = [...(pageState.ui.quickRules || []), normalizeRule({ field: 'city', operator: 'eq', value: '' })];
    setUi({ quickRules: rules, page: 1 }, { regions: ['panels', 'toolbar', 'view'] });
  }

  function removeQuickRule(index) {
    const rules = (pageState.ui.quickRules || []).filter((_, i) => i !== index);
    setUi({ quickRules: rules, page: 1 }, { regions: ['panels', 'toolbar', 'view'] });
  }

  function updateQuickRule(index, patch, { rerender = true } = {}) {
    const rules = (pageState.ui.quickRules || []).map((rule, i) => (i === index ? { ...rule, ...patch } : rule));
    pageState.ui.quickRules = rules;
    persistUi();

    if (rerender) setUi({ page: 1 }, { regions: ['view'] });
    else renderRegion('view');
  }

  /* ================================================================== */
  /* destroy                                                            */
  /* ================================================================== */

  function destroy() {
    pageState.isDestroyed = true;

    stopCampaignScheduler();

    for (const cleanup of teardown.splice(0)) {
      try {
        cleanup();
      } catch {
        /* ignore */
      }
    }

    debouncedSearch.cancel?.();
    closeRowMenu();

    if (releaseCss) releaseCss();
    releaseCss = null;

    for (const key of Object.keys(refs)) refs[key] = null;
  }

  return { render, afterRender, destroy };
}

export default createCustomerInfoPage;
