// src/pages/tools/note/notePage.js

/**
 * ViXoRa — فضای کاری یادداشت (بازنویسی فانکشنال و پروداکشن‌گرید)
 * ==================================================================
 * قرارداد روتر:  render / afterRender / destroy
 * داده:          user.tools.notes در LocalStorage (بدون بک‌اند)
 *
 * معماری رندر:
 *   به‌جای رندر کامل صفحه در هر تغییر (که باعث پرش فوکوس می‌شود)،
 *   هر ناحیه به‌صورت مستقل رندر می‌شود:
 *     header / toolbar / sidebar / panels / view / drawer / overlay
 *   ورودی‌های متنی روی blur ذخیره می‌شوند تا تایپ کاربر قطع نشود.
 */

import {
  createDefaultUiState,
  DEFAULT_HEADER_CONFIG,
  NOTE_TEMPLATES,
  HEADER_ACTION_META,
  STATUS_LABELS,
  PRIORITY_LABELS,
  COLOR_LABELS,
  getVisibleNotes,
  getNoteStats,
  getNeglectedNotes,
  paginate,
  matchesSearch,
  bucketTogglePatch,
  getActiveBucket,
} from './note-state.js';

import {
  renderHeader,
  renderToolbar,
  renderSidebar,
  renderPanels,
  renderActiveView,
  renderBulkBar,
  renderPager,
  renderNoteCard,
} from './note-renderers.js';

import {
  renderEditorDrawer,
  renderQuickComposer,
  renderCommandPalette,
  renderBlockPicker,
  renderBlockBody,
} from './note-editor.js';

import {
  normalizeNote,
  normalizeNoteList,
  createEmptyNote,
  createBlock,
  createId,
  parseTags,
  validateNoteDraft,
  getNotePlainText,
  BLOCK_TYPES,
} from '../../../core/schemas/note-schema.js';

import {
  getReminderSettings,
  updateReminderSettings,
  startReminderScheduler,
  stopReminderScheduler,
  collectReminders,
  getUpcomingReminders,
  dispatchReminder,
  addMinutes,
} from '../../../core/services/reminder-service.js';

import {
  getNotificationSettings,
  updateNotificationSettings,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  subscribeNotifications,
  requestDesktopPermission,
} from '../../../core/services/notification-service.js';

import {
  listAttachments,
  addAttachmentFromFile,
  removeAttachment,
  updateAttachment,
  downloadAttachment,
  getStorageUsage,
  updateAttachmentSettings,
} from '../../../core/services/attachment-service.js';

import {
  buildShareTargets,
  buildNoteShareText,
  executeShare,
  createBackupPayload,
  mergeBackup,
  readBackupFile,
  downloadTextFile,
} from '../../../core/services/share-service.js';

import { toast } from '../../../utilities/toast.js';
import { confirmDialog, createModal } from '../../../utilities/modal.js';
import { escapeHtml, delegate, on, debounce, openExternal } from '../../../utilities/dom-utils.js';
import { formatFileSize } from '../../../utilities/formatters.js';
import { injectScopedCss } from '../../../utilities/css-scope.js';

import {
  getToolData,
  createToolItem,
  updateToolItem,
  deleteToolItem,
  setToolItems,
  importToolItems,
} from '../../../core/actions/tools-service.js';

import { notePageCss } from './notePage.css.js';

/** نگاشت اکشن هدر/پالت به کلید پنل مربوطه (بدون حدس‌زدن از روی رشته) */
const PANEL_KEY_BY_ACTION = {
  'toggle-analytics': 'isAnalyticsOpen',
  'toggle-notifications': 'isNotificationCenterOpen',
  'toggle-template-panel': 'isTemplatePanelOpen',
  'toggle-header-customize': 'isHeaderCustomizeOpen',
  'toggle-reminder-panel': 'isReminderPanelOpen',
  'toggle-settings': 'isSettingsPanelOpen',
  'toggle-filter-panel': 'isFilterPanelOpen',
};

const TOOL_NAME = 'notes';
const UI_STORAGE_KEY = 'ViXoRa:notes-page:ui';
const HEADER_STORAGE_KEY = 'ViXoRa:notes-page:header';
const AUTO_BACKUP_KEY = 'ViXoRa:notes-page:autobackup';

/* ================================================================== */
/* وضعیت UI ذخیره‌شده                                                  */
/* ================================================================== */

function readPersistedUi() {
  try {
    const raw = globalThis.localStorage?.getItem(UI_STORAGE_KEY);
    if (!raw) return createDefaultUiState();

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createDefaultUiState();

    const ui = { ...createDefaultUiState(), ...parsed };

    ui.selectedIds = Array.isArray(parsed.selectedIds) ? parsed.selectedIds.map(String) : [];
    ui.page = Number.isFinite(parsed.page) ? parsed.page : 1;

    // در رندر اولیه هیچ کشو/پالتی باز نمی‌ماند (حالت تمیز بعد از رفرش)
    ui.editingNoteId = null;
    ui.isCommandPaletteOpen = false;

    return ui;
  } catch (error) {
    console.warn('[NotePage] UI state unreadable, falling back to defaults:', error);
    return createDefaultUiState();
  }
}

function readPersistedHeaderConfig() {
  try {
    const raw = globalThis.localStorage?.getItem(HEADER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_HEADER_CONFIG };

    const parsed = JSON.parse(raw);

    return {
      pinned: Array.isArray(parsed?.pinned) ? parsed.pinned : [...DEFAULT_HEADER_CONFIG.pinned],
      menu: Array.isArray(parsed?.menu) ? parsed.menu : [...DEFAULT_HEADER_CONFIG.menu],
    };
  } catch (error) {
    console.warn('[NotePage] Header config unreadable, falling back to defaults:', error);
    return { ...DEFAULT_HEADER_CONFIG };
  }
}

/* ================================================================== */
/* فکتوری صفحه                                                         */
/* ================================================================== */

export function createNotePage(ctx = {}) {
  /* ---------------- state ---------------- */

  const pageState = {
    notes: [],
    ui: readPersistedUi(),
    headerConfig: readPersistedHeaderConfig(),
    isLoading: true,
    error: null,
    isComposerOpen: false,
    composerDraft: {},
    commandQuery: '',
    commandIndex: 0,
    calendarDate: null,
    attachmentsCache: new Map(),
    isDestroyed: false,
  };

  const refs = {};
  const teardown = [];
  let releaseCss = null;
  let unsubscribeNotifications = null;
  let stopScheduler = null;

  /* ---------------- ابزارهای داخلی ---------------- */

  function register(cleanup) {
    if (typeof cleanup === 'function') teardown.push(cleanup);
    return cleanup;
  }

  function persistUi() {
    try {
      globalThis.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(pageState.ui));
      globalThis.localStorage.setItem(HEADER_STORAGE_KEY, JSON.stringify(pageState.headerConfig));
    } catch (error) {
      console.warn('[NotePage] UI persist failed:', error);
    }
  }

  function setUi(patch, options = {}) {
    const { regions = ['header', 'toolbar', 'sidebar', 'panels', 'view'] } = options;

    pageState.ui = { ...pageState.ui, ...patch };

    persistUi();

    for (const region of regions) renderRegion(region);
  }

  function findNote(noteId) {
    return pageState.notes.find((note) => String(note.id) === String(noteId)) || null;
  }

  function getEditorNote() {
    return pageState.ui.editingNoteId ? findNote(pageState.ui.editingNoteId) : null;
  }

  function logActivity(note, label) {
    const entry = { id: createId('act'), type: 'change', label, at: new Date().toISOString() };

    return { ...note, activity: [entry, ...(note.activity || [])].slice(0, 60) };
  }

  /* ---------------- ذخیره‌سازی ---------------- */

  async function persistAll(options = {}) {
    const { silent = true } = options;

    try {
      await setToolItems(TOOL_NAME, pageState.notes);
      autoBackup();
      return true;
    } catch (error) {
      console.error('[NotePage] persist failed:', error);
      if (!silent) toast.error(error?.message || 'ذخیره‌سازی ناموفق بود.');
      return false;
    }
  }

  function autoBackup() {
    try {
      const payload = createBackupPayload(pageState.notes);
      globalThis.localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('[NotePage] auto-backup failed:', error);
    }
  }

  async function applyNoteChange(noteId, updater, options = {}) {
    const { activity = null, reindex = true } = options;

    const index = pageState.notes.findIndex((note) => String(note.id) === String(noteId));
    if (index === -1) return null;

    let nextNote = updater({ ...pageState.notes[index] });
    nextNote.updatedAt = new Date().toISOString();

    if (activity) nextNote = logActivity(nextNote, activity);

    const nextNotes = [...pageState.notes];
    nextNotes[index] = nextNote;
    pageState.notes = nextNotes;

    if (reindex) invalidateAttachmentCache(noteId);

    renderRegion('view');
    renderRegion('sidebar');
    renderRegion('header');
    renderRegion('drawer');

    await persistAll();

    return nextNote;
  }

  /* ---------------- بارگذاری ---------------- */

  async function loadNotes() {
    pageState.isLoading = true;
    pageState.error = null;
    renderRegion('view');

    try {
      const raw = await getToolData(TOOL_NAME, { signal: ctx.signal });

      if (pageState.isDestroyed) return;

      pageState.notes = normalizeNoteList(raw);
      pageState.isLoading = false;

      renderAllRegions();
      await persistAll();
    } catch (error) {
      if (pageState.isDestroyed || error?.name === 'AbortError') return;

      console.error('[NotePage] load failed:', error);

      pageState.isLoading = false;
      pageState.error = error?.message || 'بارگذاری یادداشت‌ها ناموفق بود.';

      renderRegion('view');
    }
  }

  /* ---------------- رندر ناحیه‌ای ---------------- */

  function renderAllRegions() {
    for (const region of ['header', 'toolbar', 'sidebar', 'panels', 'view', 'drawer', 'overlay']) {
      renderRegion(region);
    }
  }

  function renderRegion(region) {
    if (pageState.isDestroyed) return;

    switch (region) {
      case 'header':
        replaceRegion(refs.header, buildHeaderHtml());
        break;
      case 'toolbar':
        replaceRegion(refs.toolbar, buildToolbarHtml());
        break;
      case 'sidebar':
        replaceRegion(refs.sidebar, buildSidebarHtml());
        break;
      case 'panels':
        replaceRegion(refs.panels, buildPanelsHtml());
        break;
      case 'view':
        replaceRegion(refs.view, buildViewHtml());
        break;
      case 'drawer':
        replaceRegion(refs.drawer, buildDrawerHtml());
        break;
      case 'overlay':
        replaceRegion(refs.overlay, buildOverlayHtml());
        break;
      default:
        break;
    }
  }

  function replaceRegion(element, html) {
    if (!element) return;
    element.innerHTML = html;
  }

  function buildHeaderHtml() {
    return renderHeader({
      ui: effectiveUi({ _pinnedActions: pageState.headerConfig.pinned }),
      headerConfig: pageState.headerConfig,
      stats: getNoteStats(pageState.notes),
      unreadCount: getUnreadCount(),
      query: { count: getVisibleNotes(pageState.notes, pageState.ui).length },
    });
  }

  /** ui با activeBucket مشتق‌شده (سطل‌ها از روی فلگ‌ها حدس زده می‌شوند) */
  function effectiveUi(extra = {}) {
    return { ...pageState.ui, activeBucket: getActiveBucket(pageState.ui), ...extra };
  }

  function buildToolbarHtml() {
    return renderToolbar({ ui: effectiveUi(), selectedCount: pageState.ui.selectedIds.length });
  }

  function buildSidebarHtml() {
    const usage = getStorageUsage();
    const budget = 45 * 1024 * 1024;

    return renderSidebar({
      ui: effectiveUi(),
      stats: getNoteStats(pageState.notes),
      upcomingReminders: getUpcomingReminders(pageState.notes, 5),
      attachmentsUsage: {
        label: formatFileSize(usage.totalBytes),
        noteCount: usage.noteCount,
        percent: Math.min(100, Math.round((usage.totalBytes / budget) * 100)),
      },
    });
  }

  function buildPanelsHtml() {
    return renderPanels({
      ui: effectiveUi({ _pinnedActions: pageState.headerConfig.pinned }),
      stats: getNoteStats(pageState.notes),
      reminders: collectReminders(pageState.notes).slice(0, 8),
      notifications: getNotifications(),
      settings: {
        reminder: getReminderSettings(),
        notification: getNotificationSettings(),
        attachment: { maxFileSizeBytes: 3 * 1024 * 1024 },
      },
      neglected: getNeglectedNotes(pageState.notes),
    });
  }

  function buildViewHtml() {
    if (pageState.isLoading) {
      return `
        <div class="vx-state vx-state--loading" role="status">
          <div class="vx-skeleton-list">
            ${Array.from({ length: 6 })
              .map(() => '<div class="vx-skeleton-card"><span class="vx-skeleton"></span><span class="vx-skeleton"></span><span class="vx-skeleton"></span></div>')
              .join('')}
          </div>
        </div>
      `;
    }

    if (pageState.error) {
      return `
        <div class="vx-state vx-state--error" role="alert">
          <div class="vx-state__icon" aria-hidden="true">⚠</div>
          <h3 class="vx-state__title">خطا در بارگذاری یادداشت‌ها</h3>
          <p class="vx-state__desc">${escapeHtml(pageState.error)}</p>
          <button class="vx-btn vx-btn--ghost" type="button" data-action="reload">تلاش دوباره</button>
        </div>
      `;
    }

    const visible = getVisibleNotes(pageState.notes, effectiveUi());
    const page = paginate(visible, pageState.ui.page, pageState.ui.pageSize);

    return `
      ${renderBulkBar({ selectedCount: pageState.ui.selectedIds.length })}
      ${renderActiveView({ notes: page.items, ui: effectiveUi() })}
      ${renderPager({ page: page.page, totalPages: page.totalPages, total: page.total })}
    `;
  }

  function buildDrawerHtml() {
    const note = getEditorNote();
    if (!note) return '';

    const attachments = getCachedAttachments(note.id);

    const shareNote = { ...note, _sharePreview: buildNoteShareText(note) };

    return renderEditorDrawer({
      note: shareNote,
      noteId: note.id,
      ui: effectiveUi(),
      attachments,
      targets: buildShareTargets(note, { phoneNumber: getReminderSettings().phoneNumber }),
      stats: getNoteStats(pageState.notes),
    });
  }

  function buildOverlayHtml() {
    const parts = [];

    if (pageState.isComposerOpen) {
      parts.push(renderQuickComposer({ draft: pageState.composerDraft }));
    }

    if (pageState.ui.isCommandPaletteOpen) {
      parts.push(
        renderCommandPalette({
          commands: buildCommands(),
          activeIndex: pageState.commandIndex,
          query: pageState.commandQuery,
        })
      );
    }

    return parts.join('');
  }

  /* ---------------- ضمیمه‌ها ---------------- */

  /**
   * ضمیمه‌ها همیشه مستقیم از سرویس خوانده می‌شوند (نه از کش) تا
   * افزودن/حذف از هر مسیری بلافاصله در UI دیده شود.
   */
  function getCachedAttachments(noteId) {
    if (!noteId) return [];
    return listAttachments(noteId);
  }

  function invalidateAttachmentCache(noteId) {
    if (noteId) pageState.attachmentsCache.delete(String(noteId));
    else pageState.attachmentsCache.clear();
  }

  /* ---------------- فرمان‌ها ---------------- */

  function buildCommands() {
    const query = pageState.commandQuery.trim().toLowerCase();

    const base = [
      { id: 'new-note', label: 'یادداشت جدید', icon: '➕', hint: 'ساخت یادداشت خالی', shortcut: 'N' },
      { id: 'quick-note', label: 'یادداشت سریع', icon: '⚡', hint: 'ثبت فوری بدون بازکردن ویرایشگر', shortcut: 'Q' },
      { id: 'view-grid', label: 'نمای شبکه', icon: '▦' },
      { id: 'view-list', label: 'نمای لیست', icon: '☰' },
      { id: 'view-board', label: 'نمای بورد', icon: '▤' },
      { id: 'view-timeline', label: 'نمای زمان‌بندی', icon: '🕒' },
      { id: 'view-calendar', label: 'نمای تقویم', icon: '📅' },
      { id: 'view-masonry', label: 'نمای آجری', icon: '▥' },
      { id: 'toggle-analytics', label: 'پنل آمار', icon: '📈' },
      { id: 'toggle-reminder-panel', label: 'پنل یادآورها', icon: '⏰' },
      { id: 'toggle-settings', label: 'تنظیمات پیامک و اعلان', icon: '⚙️' },
      { id: 'export-notes', label: 'خروجی JSON', icon: '⬇️' },
      { id: 'import-notes', label: 'بازیابی از بکاپ', icon: '⬆️' },
      { id: 'clear-filters', label: 'پاک‌کردن فیلترها', icon: '🧹' },
      ...Object.values(NOTE_TEMPLATES).map((template) => ({
        id: `template-${template.id}`,
        label: `قالب: ${template.label}`,
        icon: template.icon,
        hint: template.description,
      })),
    ];

    const notes = pageState.notes
      .filter((note) => !note.trashed)
      .slice(0, 60)
      .map((note) => ({
        id: `open-${note.id}`,
        label: note.title || 'بدون عنوان',
        icon: '📝',
        hint: note.category || 'یادداشت',
        noteId: note.id,
      }));

    const all = [...base, ...notes];

    if (!query) return all;

    return all.filter(
      (command) =>
        command.label.toLowerCase().includes(query) ||
        String(command.hint || '').toLowerCase().includes(query)
    );
  }

  /* ================================================================== */
  /* رندر اولیه                                                         */
  /* ================================================================== */

  function render() {
    releaseCss = injectScopedCss(notePageCss, 'notes-workspace');

    const theme = pageState.ui.theme === 'light' ? 'light' : 'dark';

    return `
      <section
        class="vx-nw theme-${theme} density-${pageState.ui.density}"
        dir="rtl"
        data-note-page
      >
        <div class="vx-nw__bg" aria-hidden="true"></div>

        <div class="vx-nw__shell">
          <div data-region="header">${buildHeaderHtml()}</div>
          <div data-region="toolbar">${buildToolbarHtml()}</div>
          <div data-region="panels">${buildPanelsHtml()}</div>

          <div class="vx-nw__layout">
            <div data-region="sidebar">${buildSidebarHtml()}</div>

            <main class="vx-nw__main">
              <div data-region="view">${buildViewHtml()}</div>
            </main>
          </div>
        </div>

        <div class="vx-drawer-host" data-region="drawer">${buildDrawerHtml()}</div>
        <div class="vx-overlay-host" data-region="overlay">${buildOverlayHtml()}</div>

        <button
          class="vx-fab"
          type="button"
          data-action="open-composer"
          aria-label="یادداشت سریع"
          title="یادداشت سریع (Q)"
        >
          <span aria-hidden="true">＋</span>
        </button>
      </section>
    `;
  }

  /* ================================================================== */
  /* afterRender                                                        */
  /* ================================================================== */

  function afterRender() {
    refs.root = document.querySelector('[data-note-page]');

    if (!refs.root) {
      console.error('[NotePage] Root element not found after render.');
      return;
    }

    refs.header = refs.root.querySelector('[data-region="header"]');
    refs.toolbar = refs.root.querySelector('[data-region="toolbar"]');
    refs.panels = refs.root.querySelector('[data-region="panels"]');
    refs.sidebar = refs.root.querySelector('[data-region="sidebar"]');
    refs.view = refs.root.querySelector('[data-region="view"]');
    refs.drawer = refs.root.querySelector('[data-region="drawer"]');
    refs.overlay = refs.root.querySelector('[data-region="overlay"]');

    attachEvents();
    loadNotes();
    startSchedulers();
  }

  function startSchedulers() {
    unsubscribeNotifications = register(
      subscribeNotifications(() => {
        if (pageState.isDestroyed) return;

        renderRegion('header');
        if (pageState.ui.isNotificationCenterOpen) renderRegion('panels');
      })
    );

    stopScheduler = startReminderScheduler(
      async () => {
        const raw = await getToolData(TOOL_NAME);
        return normalizeNoteList(raw);
      },
      async (note) => {
        const normalized = normalizeNote(note);

        await updateToolItem(TOOL_NAME, normalized.id, { reminders: normalized.reminders });

        const index = pageState.notes.findIndex((item) => String(item.id) === String(normalized.id));

        if (index !== -1) {
          const next = [...pageState.notes];
          next[index] = normalized;
          pageState.notes = next;

          renderRegion('view');
        }
      }
    );

    register(() => stopReminderScheduler());
  }

  /* ================================================================== */
  /* رویدادها                                                           */
  /* ================================================================== */

  function attachEvents() {
    // کلیک (delegation)
    register(delegate(refs.root, '[data-action]', 'click', handleActionClick));

    // تغییر select / checkbox
    register(on(refs.root, 'change', handleChange));

    // ورودی متن
    register(on(refs.root, 'input', handleInput));

    // فرم‌ها
    register(on(refs.root, 'submit', handleSubmit));

    // فوکوس‌خروج برای ذخیرهٔ درجا
    register(on(refs.root, 'focusout', handleFocusOut));

    // کلیک روی آیتم پالت فرمان
    register(
      delegate(refs.root, '.vx-cmdk__item', 'click', (event, item) => {
        runCommand(item.dataset.commandId);
      })
    );

    // کلیک روی overlay پالت
    register(
      delegate(refs.root, '[data-command-overlay]', 'click', (event, overlay) => {
        if (event.target === overlay) closeCommandPalette();
      })
    );

    // کلیدهای میان‌بر
    register(on(globalThis.window, 'keydown', handleKeyDown));

    // درگ‌اند‌دراپ فایل
    register(on(refs.root, 'dragover', handleDragOver));
    register(on(refs.root, 'dragleave', handleDragLeave));
    register(on(refs.root, 'drop', handleDrop));

    // انتخاب فایل
    register(
      delegate(refs.root, '[data-file-input]', 'change', async (event, input) => {
        await handleFiles(input.dataset.noteId, input.files);
        input.value = '';
      })
    );
  }

  /* ---------------- کلیک ---------------- */

  async function handleActionClick(event, button) {
    const action = button.dataset.action;
    const noteId = button.dataset.noteId;

    switch (action) {
      /* ----- ناوبری و نما ----- */
      case 'set-view':
        setUi({ activeView: button.dataset.view || 'grid', page: 1 }, { regions: ['toolbar', 'view'] });
        break;

      case 'toggle-selection-mode':
        setUi(
          {
            selectionMode: !pageState.ui.selectionMode,
            selectedIds: pageState.ui.selectionMode ? [] : pageState.ui.selectedIds,
          },
          { regions: ['toolbar', 'view'] }
        );
        break;

      case 'toggle-select-note':
        toggleSelection(noteId);
        break;

      case 'toggle-more-menu':
        setUi({ isMoreMenuOpen: !pageState.ui.isMoreMenuOpen }, { regions: ['header'] });
        break;

      case 'toggle-command-palette':
        toggleCommandPalette();
        break;

      case 'toggle-filter-panel':
        togglePanel('isFilterPanelOpen');
        break;

      case 'toggle-analytics':
        togglePanel('isAnalyticsOpen');
        break;

      case 'toggle-template-panel':
        togglePanel('isTemplatePanelOpen');
        break;

      case 'toggle-reminder-panel':
        togglePanel('isReminderPanelOpen');
        break;

      case 'toggle-notifications':
        togglePanel('isNotificationCenterOpen');
        break;

      case 'toggle-settings':
        togglePanel('isSettingsPanelOpen');
        break;

      case 'toggle-header-customize':
        togglePanel('isHeaderCustomizeOpen');
        break;

      case 'mark-all-notifications-read':
        markAllNotificationsRead();
        toast.success('همهٔ اعلان‌ها خوانده‌شده علامت خوردند.');
        break;

      case 'header-action':
        handleHeaderAction(button.dataset.headerActionId);
        break;

      case 'toggle-header-pin':
        toggleHeaderPin(button.dataset.headerActionId);
        break;

      case 'reset-header-config':
        pageState.headerConfig = { ...DEFAULT_HEADER_CONFIG };
        persistUi();
        renderRegion('header');
        renderRegion('panels');
        toast.success('چیدمان هدر بازنشانی شد.');
        break;

      /* ----- سطل‌ها و فیلترها (انحصاری) ----- */
      case 'show-all':
      case 'toggle-favorites':
      case 'toggle-pinned-filter':
      case 'toggle-archive':
      case 'toggle-trash':
      case 'toggle-checklist-filter':
      case 'toggle-reminder-filter':
      case 'toggle-attachment-filter':
      case 'filter-overdue':
      case 'filter-today':
        setUi(bucketTogglePatch(pageState.ui, action === 'show-all' ? 'all' : action));
        break;

      case 'set-color-filter':
        setUi({
          activeColorFilter:
            pageState.ui.activeColorFilter === button.dataset.color ? 'all' : button.dataset.color,
          page: 1,
        });
        break;

      case 'set-priority-filter':
        setUi({
          activePriorityFilter:
            pageState.ui.activePriorityFilter === button.dataset.priority ? 'all' : button.dataset.priority,
          page: 1,
        });
        break;

      case 'search-tag':
        setUi({ query: button.dataset.tag || '', searchScope: 'tags', page: 1 });
        break;

      case 'clear-filters':
        setUi({ ...createDefaultUiState(), theme: pageState.ui.theme, density: pageState.ui.density, pageSize: pageState.ui.pageSize });
        toast.info('فیلترها پاک شدند.');
        break;

      /* ----- یادداشت ----- */
      case 'open-editor':
        openEditor(noteId, button.dataset.editorTab || 'general');
        break;

      case 'close-editor':
        closeEditor();
        break;

      case 'set-editor-tab':
        setUi({ editorTab: button.dataset.tab || 'general' }, { regions: ['drawer'] });
        break;

      case 'open-note':
        openEditor(noteId, 'general');
        break;

      case 'open-composer':
        openComposer();
        break;

      case 'close-composer':
        closeComposer();
        break;

      case 'save-composer':
        await saveComposer();
        break;

      case 'save-note':
        await saveEditorNote();
        break;

      case 'toggle-pin':
        await applyNoteChange(noteId, (note) => ({ ...note, pinned: !note.pinned }), {
          activity: findNote(noteId)?.pinned ? 'برداشتن سنجاق' : 'سنجاق شد',
        });
        break;

      case 'toggle-favorite-note':
        await applyNoteChange(noteId, (note) => ({ ...note, favorite: !note.favorite }), { activity: 'تغییر علاقه‌مندی' });
        break;

      case 'set-note-color':
        await applyNoteChange(noteId, (note) => ({ ...note, color: button.dataset.color }), { activity: 'تغییر رنگ' });
        break;

      case 'trash-note':
        await trashNote(noteId);
        break;

      case 'duplicate-note':
        await duplicateNote(noteId);
        break;

      case 'create-from-template':
        createFromTemplate(button.dataset.templateId);
        break;

      case 'reload':
        await loadNotes();
        break;

      /* ----- بلوک‌ها ----- */
      case 'add-block':
        await addBlock(noteId, button.dataset.blockType);
        break;

      case 'delete-block':
        await deleteBlock(noteId, button.dataset.blockId);
        break;

      case 'move-block-up':
        await moveBlock(noteId, button.dataset.blockId, -1);
        break;

      case 'move-block-down':
        await moveBlock(noteId, button.dataset.blockId, 1);
        break;

      case 'toggle-block-collapse':
        await toggleBlockCollapse(noteId, button.dataset.blockId);
        break;

      case 'quick-add-item':
        await quickAddItem(noteId, button.dataset.blockId, button.dataset.itemKind, button);
        break;

      case 'remove-item':
        await removeBlockItem(noteId, button.dataset.blockId, button.dataset.itemId);
        break;

      case 'toggle-task':
        // در handlechange انجام می‌شود (checkbox)
        break;

      case 'rate-item':
        await rateItem(noteId, button.dataset.blockId, button.dataset.itemId, Number(button.dataset.score));
        break;

      case 'add-table-row':
        await updateTable(noteId, button.dataset.blockId, (block) => ({
          ...block,
          rows: [...(block.rows || []), (block.columns || []).map(() => '')],
        }));
        break;

      case 'add-table-column':
        await updateTable(noteId, button.dataset.blockId, (block) => ({
          ...block,
          columns: [...(block.columns || []), `ستون ${(block.columns || []).length + 1}`],
          rows: (block.rows || []).map((row) => [...row, '']),
        }));
        break;

      case 'remove-table-column':
        await updateTable(noteId, button.dataset.blockId, (block) => {
          const columns = (block.columns || []).slice(0, -1);
          return {
            ...block,
            columns: columns.length ? columns : ['ستون ۱'],
            rows: (block.rows || []).map((row) => row.slice(0, Math.max(1, columns.length))),
          };
        });
        break;

      case 'remove-table-row':
        await updateTable(noteId, button.dataset.blockId, (block) => ({
          ...block,
          rows: (block.rows || []).filter((_row, index) => index !== Number(button.dataset.rowIndex)),
        }));
        break;

      /* ----- یادآور ----- */
      case 'toggle-reminder':
        await updateReminder(noteId, button.dataset.reminderId, (reminder) => ({
          ...reminder,
          enabled: !reminder.enabled,
        }));
        break;

      case 'snooze-reminder': {
        const minutes = Number(button.dataset.minutes || 10);

        await updateReminder(noteId, button.dataset.reminderId, (reminder) => {
          // اگر یادآور هنوز در آینده است، از همان زمان جلو می‌رود
          // (نه از الان) تا زمان‌بندی کاربر عقب نیفتد.
          const scheduled = reminder.nextAt || reminder.at || '';
          const scheduledTime = new Date(scheduled).getTime();
          const base =
            Number.isFinite(scheduledTime) && scheduledTime > Date.now()
              ? scheduled
              : new Date().toISOString();

          return {
            ...reminder,
            enabled: true,
            at: reminder.at || base,
            nextAt: addMinutes(base, minutes),
          };
        });

        toast.success(`یادآور ${minutes} دقیقه به تعویق افتاد.`);
        break;
      }

      case 'fire-reminder-now':
        await testReminder(noteId, button.dataset.reminderId);
        break;

      case 'delete-reminder':
        await deleteReminder(noteId, button.dataset.reminderId);
        break;

      case 'request-notification-permission': {
        const result = await requestDesktopPermission();

        if (result.granted) toast.success('اعلان دسکتاپ فعال شد.');
        else if (!result.supported) toast.warning('مرورگر شما از اعلان دسکتاپ پشتیبانی نمی‌کند.');
        else toast.error('اجازهٔ اعلان داده نشد.');

        break;
      }

      /* ----- ضمیمه ----- */
      case 'download-attachment': {
        const attachment = getCachedAttachments(noteId).find(
          (item) => String(item.id) === String(button.dataset.attachmentId)
        );

        if (attachment) downloadAttachment(attachment);
        break;
      }

      case 'delete-attachment':
        await deleteAttachment(noteId, button.dataset.attachmentId);
        break;

      /* ----- اشتراک ----- */
      case 'open-share-sheet':
        openEditor(noteId, 'share');
        break;

      case 'share-note':
        await shareNote(noteId, button.dataset.shareTarget);
        break;

      /* ----- عملیات گروهی ----- */
      case 'bulk-pin':
      case 'bulk-favorite':
      case 'bulk-status':
      case 'bulk-color':
      case 'bulk-reminder':
      case 'bulk-archive':
      case 'bulk-trash':
      case 'bulk-export':
      case 'bulk-delete':
      case 'bulk-clear':
        await handleBulkAction(action, button);
        break;

      /* ----- تقویم ----- */
      case 'calendar-prev':
      case 'calendar-next':
        shiftCalendar(action === 'calendar-next' ? 1 : -1);
        break;

      /* ----- صفحه‌بندی ----- */
      case 'page-prev':
        setUi({ page: Math.max(1, pageState.ui.page - 1) }, { regions: ['view'] });
        break;

      case 'page-next':
        setUi({ page: pageState.ui.page + 1 }, { regions: ['view'] });
        break;

      /* ----- بکاپ ----- */
      case 'export-notes':
        exportNotes();
        break;

      case 'import-notes':
        importNotes();
        break;

      case 'auto-backup':
        autoBackup();
        toast.success('بکاپ فوری در حافظهٔ مرورگر ذخیره شد.');
        break;

      default:
        break;
    }
  }

  /* ---------------- change ---------------- */

  async function handleChange(event) {
    const target = event.target;

    if (target.matches('[data-change="search-scope"]')) {
      setUi({ searchScope: target.value, page: 1 }, { regions: ['header', 'view'] });
      return;
    }

    if (target.matches('[data-change="sort"]')) {
      setUi({ activeSort: target.value }, { regions: ['toolbar', 'view'] });
      return;
    }

    if (target.matches('[data-change="group-by"]')) {
      setUi({ groupBy: target.value }, { regions: ['toolbar', 'view'] });
      return;
    }

    // تیک وظیفه
    if (target.matches('[data-action="toggle-task"]')) {
      await applyNoteChange(
        target.dataset.noteId,
        (note) => ({
          ...note,
          blocks: (note.blocks || []).map((block) =>
            block.id === target.dataset.blockId
              ? {
                  ...block,
                  items: (block.items || []).map((item) =>
                    item.id === target.dataset.itemId ? { ...item, done: target.checked } : item
                  ),
                }
              : block
          ),
        }),
        { activity: 'تغییر وضعیت وظیفه' }
      );
      return;
    }

    // انتخاب چندتایی
    if (target.matches('[data-action="toggle-select-note"]')) {
      toggleSelection(target.dataset.noteId);
      return;
    }

    // ویرایش درجای آیتم‌های بلوک (select)
    if (target.matches('[data-block-item-input]')) {
      await saveBlockItemField(
        target.dataset.noteId,
        target.dataset.blockId,
        target.dataset.itemId,
        target.dataset.blockItemInput,
        target.value
      );
      return;
    }

    // تنظیمات کلی یادداشت
    if (target.matches('[data-note-field]')) {
      await saveNoteField(target.dataset.noteId, target.dataset.noteField, target);
    }
  }

  /* ---------------- input ---------------- */

  function handleInput(event) {
    const target = event.target;

    if (target.matches('[data-input="search-query"]')) {
      pageState.ui.query = target.value;

      debouncedSearchRender();
      return;
    }

    if (target.matches('[data-command-input]')) {
      pageState.commandQuery = target.value;
      pageState.commandIndex = 0;
      renderRegion('overlay');

      const input = refs.overlay?.querySelector('[data-command-input]');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }

  /**
   * رندر جستجو بدون رندر کامل هدر:
   * اگر ناحیهٔ هدر را جایگزین کنیم، اینپوت جستجو از DOM حذف و فوکوس کاربر از دست می‌رود.
   * پس فقط عدد «نمایش» به‌صورت درجا به‌روز می‌شود و نمای نتایج رندر می‌شود.
   */
  const debouncedSearchRender = debounce(() => {
    if (pageState.isDestroyed) return;

    persistUi();
    pageState.ui = { ...pageState.ui, page: 1 };

    updateHeaderMetrics();
    renderRegion('view');
  }, 220);

  function updateHeaderMetrics() {
    const stats = getNoteStats(pageState.notes);
    const visibleCount = getVisibleNotes(pageState.notes, effectiveUi()).length;

    const values = {
      visible: String(visibleCount),
      total: String(stats.total),
      reminders: String(stats.withReminder),
      today: String(stats.todayDue),
      overdue: String(stats.overdue),
      progress: `${Math.round(stats.completionRatio * 100)}٪`,
    };

    for (const [key, value] of Object.entries(values)) {
      const metric = refs.header?.querySelector(`[data-metric="${key}"] .vx-nw__metric-value`);
      if (metric) metric.textContent = value;
    }
  }

  /* ---------------- focusout (ذخیرهٔ درجا) ---------------- */

  async function handleFocusOut(event) {
    const target = event.target;

    if (target.matches('[data-block-input]')) {
      await saveBlockField(
        target.dataset.noteId,
        target.dataset.blockId,
        target.dataset.blockInput,
        target.value
      );
      return;
    }

    if (target.matches('[data-block-item-input]') && target.tagName === 'INPUT') {
      await saveBlockItemField(
        target.dataset.noteId,
        target.dataset.blockId,
        target.dataset.itemId,
        target.dataset.blockItemInput,
        target.value
      );
      return;
    }

    if (target.matches('[data-block-cell-row]')) {
      await updateTable(target.dataset.noteId, target.dataset.blockId, (block) => {
        const rows = (block.rows || []).map((row) => [...row]);
        const rowIndex = Number(target.dataset.blockCellRow);
        const colIndex = Number(target.dataset.blockCellCol);

        if (!rows[rowIndex]) rows[rowIndex] = [];
        rows[rowIndex][colIndex] = target.value;

        return { ...block, rows };
      });
      return;
    }

    if (target.matches('[data-block-column-index]')) {
      await updateTable(target.dataset.noteId, target.dataset.blockId, (block) => {
        const columns = [...(block.columns || [])];
        columns[Number(target.dataset.blockColumnIndex)] = target.value;
        return { ...block, columns };
      });
      return;
    }

    if (target.matches('[data-attachment-caption]')) {
      const result = updateAttachment(target.dataset.noteId, target.dataset.attachmentId, {
        caption: target.value,
      });

      invalidateAttachmentCache(target.dataset.noteId);

      if (result.ok) toast.success('توضیح ضمیمه ذخیره شد.');
      return;
    }

    if (target.matches('[data-note-field]') && target.tagName === 'INPUT' && target.type !== 'checkbox') {
      await saveNoteField(target.dataset.noteId, target.dataset.noteField, target);
    }
  }

  /* ---------------- submit ---------------- */

  async function handleSubmit(event) {
    const form = event.target;

    if (form.matches('[data-form="add-reminder"]')) {
      event.preventDefault();
      await addReminder(form);
      return;
    }

    if (form.matches('[data-form="settings"]')) {
      event.preventDefault();
      saveSettings(form);
      return;
    }

    if (form.matches('[data-form="note-general"]')) {
      event.preventDefault();
      await saveEditorNote();
    }
  }

  /* ---------------- کلیدها ---------------- */

  function handleKeyDown(event) {
    if (pageState.isDestroyed) return;

    const key = (event.key || '').toLowerCase();
    const isTyping = ['input', 'textarea', 'select'].includes(
      String(event.target?.tagName || '').toLowerCase()
    );

    if (key === 'escape') {
      if (pageState.ui.isCommandPaletteOpen) {
        closeCommandPalette();
      } else if (pageState.isComposerOpen) {
        closeComposer();
      } else if (pageState.ui.editingNoteId) {
        closeEditor();
      } else if (pageState.ui.selectionMode) {
        setUi({ selectionMode: false, selectedIds: [] }, { regions: ['toolbar', 'view'] });
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && key === 'k') {
      event.preventDefault();
      toggleCommandPalette();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && key === 'enter' && pageState.isComposerOpen) {
      event.preventDefault();
      saveComposer();
      return;
    }

    if (isTyping) return;

    if (key === '/') {
      event.preventDefault();
      refs.root?.querySelector('[data-input="search-query"]')?.focus();
      return;
    }

    if (key === 'n') {
      event.preventDefault();
      openEditor(null, 'general');
      return;
    }

    if (key === 'q') {
      event.preventDefault();
      openComposer();
    }
  }

  /* ---------------- درگ‌اند‌دراپ ---------------- */

  function handleDragOver(event) {
    const card = event.target.closest?.('[data-note-id]');
    if (!card || !event.dataTransfer) return;

    const hasFiles = Array.from(event.dataTransfer.types || []).includes('Files');
    if (!hasFiles) return;

    event.preventDefault();
    card.classList.add('is-drop-target');
  }

  function handleDragLeave(event) {
    const card = event.target.closest?.('[data-note-id]');
    card?.classList.remove('is-drop-target');
  }

  async function handleDrop(event) {
    const card = event.target.closest?.('[data-note-id]');
    if (!card || !event.dataTransfer) return;

    card.classList.remove('is-drop-target');

    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    event.preventDefault();

    await handleFiles(card.dataset.noteId, files);
  }

  async function handleFiles(noteId, fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    let success = 0;
    const failures = [];

    for (const file of files) {
      const result = await addAttachmentFromFile(noteId, file);

      if (result.ok) success += 1;
      else failures.push(`${file.name}: ${result.message}`);
    }

    invalidateAttachmentCache(noteId);

    if (success > 0) {
      await applyNoteChange(
        noteId,
        (note) => ({
          ...note,
          attachments: Array.from(
            new Set([...(note.attachments || []), ...getCachedAttachments(noteId).map((item) => item.id)])
          ),
        }),
        { activity: `افزودن ${success} ضمیمه` }
      );

      toast.success(`${success} ضمیمه اضافه شد.`);
    }

    if (failures.length > 0) {
      toast.error(failures[0], { description: failures.length > 1 ? `${failures.length} فایل ناموفق` : '' });
    }

    renderRegion('sidebar');
    renderRegion('drawer');
    renderRegion('view');
  }

  /* ================================================================== */
  /* اکشن‌ها                                                            */
  /* ================================================================== */

  function togglePanel(key) {
    const next = !pageState.ui[key];

    setUi({ [key]: next, isMoreMenuOpen: false }, { regions: ['header', 'panels'] });
  }

  function toggleSelection(noteId) {
    const selected = new Set(pageState.ui.selectedIds.map(String));

    if (selected.has(String(noteId))) selected.delete(String(noteId));
    else selected.add(String(noteId));

    const selectedIds = Array.from(selected);

    setUi(
      { selectedIds, selectionMode: selectedIds.length > 0 || pageState.ui.selectionMode },
      { regions: ['toolbar', 'view'] }
    );
  }

  function handleHeaderAction(actionId) {
    switch (actionId) {
      case 'toggle-theme': {
        const theme = pageState.ui.theme === 'dark' ? 'light' : 'dark';
        setUi({ theme });
        refs.root?.classList.remove('theme-dark', 'theme-light');
        refs.root?.classList.add(`theme-${theme}`);
        break;
      }

      case 'toggle-density': {
        const density = pageState.ui.density === 'comfortable' ? 'compact' : 'comfortable';
        setUi({ density });
        refs.root?.classList.remove('density-compact', 'density-comfortable');
        refs.root?.classList.add(`density-${density}`);
        break;
      }

      case 'toggle-analytics':
      case 'toggle-notifications':
      case 'toggle-template-panel':
      case 'toggle-header-customize':
      case 'toggle-reminder-panel':
      case 'toggle-settings':
      case 'toggle-filter-panel':
        togglePanel(PANEL_KEY_BY_ACTION[actionId]);
        break;

      case 'export-notes':
        exportNotes();
        break;

      case 'import-notes':
        importNotes();
        break;

      case 'auto-backup':
        autoBackup();
        toast.success('بکاپ فوری ذخیره شد.');
        break;

      case 'clear-filters':
        setUi({ ...createDefaultUiState(), theme: pageState.ui.theme, density: pageState.ui.density });
        break;

      default:
        break;
    }
  }

  function toggleHeaderPin(actionId) {
    if (!actionId) return;

    const allActionIds = Object.keys(HEADER_ACTION_META);
    const pinned = new Set(pageState.headerConfig.pinned);

    if (pinned.has(actionId)) pinned.delete(actionId);
    else pinned.add(actionId);

    pageState.headerConfig = {
      pinned: allActionIds.filter((id) => pinned.has(id)),
      menu: allActionIds.filter((id) => !pinned.has(id)),
    };

    persistUi();
    renderRegion('header');
    renderRegion('panels');
  }

  /* ----- ویرایشگر ----- */

  async function openEditor(noteId, tab = 'general') {
    let targetId = noteId;

    if (!targetId) {
      const created = await createBlankNote();
      targetId = created.id;
    }

    setUi({ editingNoteId: targetId, editorTab: tab, isCommandPaletteOpen: false, isComposerOpen: false }, {
      regions: ['drawer', 'overlay'],
    });

    pageState.isComposerOpen = false;
    renderRegion('overlay');

    setTimeout(() => refs.drawer?.querySelector('.vx-drawer')?.focus?.(), 40);
  }

  function closeEditor() {
    setUi({ editingNoteId: null }, { regions: ['drawer'] });
  }

  async function createBlankNote() {
    const note = createEmptyNote({ title: '', summary: '' });
    note.blocks = [createBlock('text', { title: 'توضیحات' })];

    const created = normalizeNote(await createToolItem(TOOL_NAME, note, { signal: ctx.signal }));

    pageState.notes = [created, ...pageState.notes];

    renderRegion('view');
    renderRegion('sidebar');
    renderRegion('header');

    return created;
  }

  async function saveEditorNote() {
    const note = getEditorNote();
    if (!note) return;

    const form = refs.drawer?.querySelector('[data-form="note-general"]');

    const draft = {
      title: form?.querySelector('[name="title"]')?.value ?? note.title,
      summary: form?.querySelector('[name="summary"]')?.value ?? note.summary,
      category: form?.querySelector('[name="category"]')?.value ?? note.category,
      tags: form?.querySelector('[name="tags"]')?.value ?? (note.tags || []).join(', '),
      status: form?.querySelector('[name="status"]')?.value ?? note.status,
      priority: form?.querySelector('[name="priority"]')?.value ?? note.priority,
      dueAt: form?.querySelector('[name="dueAt"]')?.value ?? note.dueAt,
      blocks: note.blocks,
    };

    const validation = validateNoteDraft(draft);

    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    await applyNoteChange(
      note.id,
      (current) => ({
        ...current,
        title: String(draft.title || '').trim(),
        summary: String(draft.summary || '').trim(),
        category: String(draft.category || '').trim(),
        tags: parseTags(draft.tags),
        status: draft.status,
        priority: draft.priority,
        dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : '',
      }),
      { activity: 'ذخیرهٔ تنظیمات کلی' }
    );

    toast.success('یادداشت ذخیره شد.');
    closeEditor();
  }

  async function saveNoteField(noteId, field, element) {
    if (!noteId || !field) return;

    let value = element.type === 'checkbox' ? element.checked : element.value;

    if (field === 'dueAt') value = value ? new Date(value).toISOString() : '';
    if (field === 'tags') value = parseTags(value);
    if (typeof value === 'string') value = value.trim();

    await applyNoteChange(noteId, (note) => ({ ...note, [field]: value }));
  }

  /* ----- کمپوزر سریع ----- */

  function openComposer() {
    pageState.isComposerOpen = true;
    pageState.composerDraft = { title: '', content: '', priority: 'medium', color: 'blue', dueAt: '' };

    setUi({ isCommandPaletteOpen: false }, { regions: ['overlay'] });

    setTimeout(() => refs.overlay?.querySelector('[data-composer-field="title"]')?.focus(), 40);
  }

  function closeComposer() {
    pageState.isComposerOpen = false;
    renderRegion('overlay');
  }

  async function saveComposer() {
    const titleElement = refs.overlay?.querySelector('[data-composer-field="title"]');
    const contentElement = refs.overlay?.querySelector('[data-composer-field="content"]');
    const priorityElement = refs.overlay?.querySelector('[data-composer-field="priority"]');
    const colorElement = refs.overlay?.querySelector('[data-composer-field="color"]');
    const dueElement = refs.overlay?.querySelector('[data-composer-field="dueAt"]');

    const draft = {
      title: titleElement?.value || '',
      content: contentElement?.value || '',
      priority: priorityElement?.value || 'medium',
      color: colorElement?.value || 'blue',
      dueAt: dueElement?.value ? new Date(dueElement.value).toISOString() : '',
    };

    const blocks = [];

    if (draft.content.trim()) {
      blocks.push(createBlock('text', { title: 'توضیحات', value: draft.content.trim() }));
    }

    const validation = validateNoteDraft({ title: draft.title, blocks });

    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    const note = createEmptyNote({
      title: draft.title.trim(),
      priority: draft.priority,
      color: draft.color,
      dueAt: draft.dueAt,
      blocks: blocks.length ? blocks : [createBlock('text', { title: 'توضیحات', value: '' })],
    });

    try {
      const created = normalizeNote(await createToolItem(TOOL_NAME, note, { signal: ctx.signal }));

      pageState.notes = [created, ...pageState.notes];

      closeComposer();

      renderRegion('view');
      renderRegion('sidebar');
      renderRegion('header');

      await persistAll();

      toast.success('یادداشت ثبت شد.');
    } catch (error) {
      toast.error(error?.message || 'ثبت یادداشت ناموفق بود.');
    }
  }

  /* ----- قالب‌ها ----- */

  function createFromTemplate(templateId) {
    const template = NOTE_TEMPLATES[templateId] || NOTE_TEMPLATES.brainstorm;

    const note = createEmptyNote({
      ...template.note,
      blocks: (template.note.blocks || []).map((block) => createBlock(block.type, block)),
    });

    pageState.composerDraft = {};
    pageState.isComposerOpen = false;

    (async () => {
      try {
        const created = normalizeNote(await createToolItem(TOOL_NAME, note, { signal: ctx.signal }));

        pageState.notes = [created, ...pageState.notes];

        setUi({ editingNoteId: created.id, editorTab: 'blocks', isTemplatePanelOpen: false }, {
          regions: ['view', 'sidebar', 'header', 'drawer', 'panels', 'overlay'],
        });

        await persistAll();

        toast.success(`یادداشت «${template.label}» ساخته شد.`);
      } catch (error) {
        toast.error(error?.message || 'ساخت یادداشت ناموفق بود.');
      }
    })();
  }

  /* ----- بلوک‌ها ----- */

  async function addBlock(noteId, blockType) {
    if (!BLOCK_TYPES[blockType]) {
      toast.error('نوع بخش نامعتبر است.');
      return;
    }

    await applyNoteChange(
      noteId,
      (note) => ({ ...note, blocks: [...(note.blocks || []), createBlock(blockType)] }),
      { activity: `افزودن بخش ${BLOCK_TYPES[blockType].label}` }
    );

    toast.success(`بخش «${BLOCK_TYPES[blockType].label}» اضافه شد.`);
  }

  async function deleteBlock(noteId, blockId) {
    const confirmed = await confirmDialog({
      title: 'حذف بخش',
      message: 'این بخش برای همیشه حذف می‌شود. ادامه می‌دهی؟',
      danger: true,
      confirmLabel: 'حذف بخش',
    });

    if (!confirmed) return;

    await applyNoteChange(
      noteId,
      (note) => ({ ...note, blocks: (note.blocks || []).filter((block) => block.id !== blockId) }),
      { activity: 'حذف یک بخش' }
    );
  }

  async function moveBlock(noteId, blockId, direction) {
    await applyNoteChange(noteId, (note) => {
      const blocks = [...(note.blocks || [])];
      const index = blocks.findIndex((block) => block.id === blockId);
      const target = index + direction;

      if (index === -1 || target < 0 || target >= blocks.length) return note;

      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];

      return { ...note, blocks };
    });
  }

  async function toggleBlockCollapse(noteId, blockId) {
    await applyNoteChange(
      noteId,
      (note) => ({
        ...note,
        blocks: (note.blocks || []).map((block) =>
          block.id === blockId ? { ...block, collapsed: !block.collapsed } : block
        ),
      }),
      { reindex: false }
    );
  }

  async function saveBlockField(noteId, blockId, field, value) {
    if (!noteId || !blockId || !field) return;

    await applyNoteChange(
      noteId,
      (note) => ({
        ...note,
        blocks: (note.blocks || []).map((block) =>
          block.id === blockId ? { ...block, [field]: value, updatedAt: new Date().toISOString() } : block
        ),
      }),
      { reindex: false }
    );
  }

  async function saveBlockItemField(noteId, blockId, itemId, field, value) {
    if (!noteId || !blockId || !itemId || !field) return;

    const arrayField = itemArrayFieldFor(field);

    await applyNoteChange(
      noteId,
      (note) => ({
        ...note,
        blocks: (note.blocks || []).map((block) =>
          block.id === blockId
            ? {
                ...block,
                [arrayField]: (block[arrayField] || []).map((item) =>
                  item.id === itemId ? { ...item, [field]: normalizeItemValue(field, value) } : item
                ),
              }
            : block
        ),
      }),
      { reindex: false }
    );
  }

  function itemArrayFieldFor(field) {
    const map = {
      text: 'items',
      done: 'items',
      score: 'items',
      label: 'fields',
      value: 'fields',
      url: 'links',
      name: 'people',
      role: 'people',
      phone: 'people',
      email: 'people',
      amount: 'entries',
      direction: 'entries',
      at: 'events',
      repeat: 'events',
      address: 'places',
    };

    return map[field] || 'items';
  }

  function normalizeItemValue(field, value) {
    if (field === 'amount') return Number(value) || 0;
    if (field === 'at') return value ? new Date(value).toISOString() : '';
    if (field === 'done') return Boolean(value);
    return typeof value === 'string' ? value : String(value ?? '');
  }

  async function quickAddItem(noteId, blockId, kind, button) {
    const container = button.closest('.vx-block__quickadd');
    if (!container) return;

    const values = {};

    for (const input of container.querySelectorAll('[data-quick-field]')) {
      values[input.dataset.quickField] = input.type === 'datetime-local' && input.value
        ? new Date(input.value).toISOString()
        : input.value;
    }

    const itemBuilders = {
      task: () => ({ id: createId('task'), text: values.text || '', done: false }),
      rating: () => ({ id: createId('rate'), text: values.text || '', score: 0 }),
      field: () => ({ id: createId('field'), label: values.label || '', value: values.value || '' }),
      link: () => ({ id: createId('link'), label: values.label || values.url || '', url: values.url || '' }),
      contact: () => ({ id: createId('person'), name: values.name || '', role: '', phone: values.phone || '', email: '' }),
      money: () => ({
        id: createId('money'),
        label: values.label || '',
        amount: Number(values.amount) || 0,
        direction: 'expense',
        paidAt: '',
      }),
      date: () => ({ id: createId('date'), label: values.label || '', at: values.at || '', repeat: 'none' }),
      location: () => ({ id: createId('place'), label: values.label || '', address: values.address || '', lat: '', lng: '' }),
    };

    const builder = itemBuilders[kind];
    if (!builder) return;

    const item = builder();

    if (!Object.values(item).some((value) => String(value || '').trim() !== '' && value !== false && value !== 0)) {
      toast.warning('ابتدا مقدار را وارد کن.');
      return;
    }

    const arrayField =
      kind === 'field' ? 'fields' : kind === 'link' ? 'links' : kind === 'contact' ? 'people'
        : kind === 'money' ? 'entries' : kind === 'date' ? 'events' : kind === 'location' ? 'places'
          : 'items';

    await applyNoteChange(
      noteId,
      (note) => ({
        ...note,
        blocks: (note.blocks || []).map((block) =>
          block.id === blockId
            ? { ...block, [arrayField]: [...(block[arrayField] || []), item] }
            : block
        ),
      }),
      { activity: 'افزودن یک آیتم' }
    );

    // پاک‌کردن inputها بدون رندر کامل (حفظ فوکوس)
    for (const input of container.querySelectorAll('[data-quick-field]')) {
      input.value = '';
    }

    container.querySelector('[data-quick-field]')?.focus();
  }

  async function removeBlockItem(noteId, blockId, itemId) {
    await applyNoteChange(
      noteId,
      (note) => ({
        ...note,
        blocks: (note.blocks || []).map((block) => {
          if (block.id !== blockId) return block;

          const next = { ...block };

          for (const key of ['items', 'fields', 'links', 'people', 'entries', 'events', 'places']) {
            if (Array.isArray(next[key])) {
              next[key] = next[key].filter((item) => item.id !== itemId);
            }
          }

          return next;
        }),
      }),
      { activity: 'حذف یک آیتم' }
    );
  }

  async function rateItem(noteId, blockId, itemId, score) {
    await applyNoteChange(
      noteId,
      (note) => ({
        ...note,
        blocks: (note.blocks || []).map((block) =>
          block.id === blockId
            ? {
                ...block,
                items: (block.items || []).map((item) =>
                  item.id === itemId ? { ...item, score } : item
                ),
              }
            : block
        ),
      }),
      { reindex: false }
    );
  }

  async function updateTable(noteId, blockId, updater) {
    await applyNoteChange(
      noteId,
      (note) => ({
        ...note,
        blocks: (note.blocks || []).map((block) => (block.id === blockId ? updater(block) : block)),
      }),
      { reindex: false }
    );
  }

  /* ----- یادآورها ----- */

  async function addReminder(form) {
    const note = getEditorNote();
    if (!note) return;

    const at = form.querySelector('[name="at"]')?.value;

    if (!at) {
      toast.error('زمان یادآور را مشخص کن.');
      form.querySelector('[name="at"]')?.focus();
      return;
    }

    const channels = [
      form.querySelector('[name="ch_inapp"]')?.checked ? 'inapp' : null,
      form.querySelector('[name="ch_desktop"]')?.checked ? 'desktop' : null,
      form.querySelector('[name="ch_sound"]')?.checked ? 'sound' : null,
      form.querySelector('[name="ch_sms"]')?.checked ? 'sms' : null,
    ].filter(Boolean);

    const reminder = {
      id: createId('reminder'),
      title: form.querySelector('[name="title"]')?.value?.trim() || note.title || 'یادآوری',
      message: form.querySelector('[name="message"]')?.value?.trim() || '',
      at: new Date(at).toISOString(),
      nextAt: new Date(at).toISOString(),
      repeat: form.querySelector('[name="repeat"]')?.value || 'none',
      channels: channels.length ? channels : ['inapp'],
      enabled: true,
      createdAt: new Date().toISOString(),
      lastFiredAt: '',
      history: [],
    };

    if (new Date(reminder.at).getTime() < Date.now() - 60_000) {
      const proceed = await confirmDialog({
        title: 'زمان گذشته',
        message: 'زمان انتخاب‌شده در گذشته است. یادآور بلافاصله ارسال شود؟',
        confirmLabel: 'بله، ارسال شود',
      });

      if (!proceed) return;
    }

    await applyNoteChange(
      note.id,
      (current) => ({ ...current, reminders: [...(current.reminders || []), reminder] }),
      { activity: 'افزودن یادآور' }
    );

    form.reset();

    if (reminder.channels.includes('sms') && !getReminderSettings().phoneNumber) {
      toast.warning('برای ارسال پیامک، شمارهٔ موبایلت را در تنظیمات وارد کن.');
    }

    toast.success('یادآور اضافه شد.');
  }

  async function updateReminder(noteId, reminderId, updater) {
    await applyNoteChange(
      noteId,
      (note) => ({
        ...note,
        reminders: (note.reminders || []).map((reminder) =>
          reminder.id === reminderId ? updater(reminder) : reminder
        ),
      }),
      { activity: 'تغییر یادآور' }
    );
  }

  async function deleteReminder(noteId, reminderId) {
    const confirmed = await confirmDialog({
      title: 'حذف یادآور',
      message: 'این یادآور حذف می‌شود. ادامه می‌دهی؟',
      danger: true,
      confirmLabel: 'حذف',
    });

    if (!confirmed) return;

    await applyNoteChange(
      noteId,
      (note) => ({ ...note, reminders: (note.reminders || []).filter((item) => item.id !== reminderId) }),
      { activity: 'حذف یادآور' }
    );
  }

  async function testReminder(noteId, reminderId) {
    const note = findNote(noteId);
    const reminder = (note?.reminders || []).find((item) => item.id === reminderId);

    if (!reminder) return;

    const settings = getReminderSettings();

    if (reminder.channels.includes('sms') && !settings.phoneNumber) {
      toast.warning('ابتدا شمارهٔ موبایل را در تنظیمات وارد کن.');
      setUi({ editorTab: 'reminders' }, { regions: ['drawer'] });
      return;
    }

    await dispatchReminder(reminder, {
      noteTitle: note.title,
      noteId: note.id,
      openSms: true,
    });

    toast.success('یادآور ارسال شد (اعلان و صف پیامک را بررسی کن).');
  }

  /* ----- ضمیمه ----- */

  async function deleteAttachment(noteId, attachmentId) {
    const confirmed = await confirmDialog({
      title: 'حذف ضمیمه',
      message: 'فایل برای همیشه از حافظهٔ مرورگر حذف می‌شود.',
      danger: true,
      confirmLabel: 'حذف',
    });

    if (!confirmed) return;

    removeAttachment(noteId, attachmentId);
    invalidateAttachmentCache(noteId);

    await applyNoteChange(
      noteId,
      (note) => ({
        ...note,
        attachments: (note.attachments || []).filter((id) => String(id) !== String(attachmentId)),
      }),
      { activity: 'حذف ضمیمه' }
    );

    renderRegion('sidebar');
    toast.success('ضمیمه حذف شد.');
  }

  /* ----- اشتراک ----- */

  async function shareNote(noteId, targetId) {
    const note = findNote(noteId);
    if (!note) return;

    const settings = getReminderSettings();

    const result = await executeShare(targetId, note, { phoneNumber: settings.phoneNumber });

    if (result.record) {
      await applyNoteChange(
        noteId,
        (current) => ({ ...current, shares: [result.record, ...(current.shares || [])].slice(0, 30) }),
        { activity: `اشتراک از طریق ${targetId}`, reindex: false }
      );
    }

    renderRegion('drawer');
  }

  /* ----- عملیات گروهی ----- */

  async function handleBulkAction(action, button) {
    const selectedIds = pageState.ui.selectedIds.map(String);

    if (action === 'bulk-clear') {
      setUi({ selectedIds: [], selectionMode: false }, { regions: ['toolbar', 'view'] });
      return;
    }

    if (selectedIds.length === 0) {
      toast.warning('ابتدا چند یادداشت را انتخاب کن.');
      return;
    }

    if (action === 'bulk-export') {
      const selectedNotes = pageState.notes.filter((note) => selectedIds.includes(String(note.id)));
      downloadTextFile(
        JSON.stringify(createBackupPayload(selectedNotes), null, 2),
        `vixora-notes-selected-${Date.now()}.json`,
        'application/json'
      );
      toast.success('خروجی یادداشت‌های انتخاب‌شده دانلود شد.');
      return;
    }

    if (action === 'bulk-delete') {
      const confirmed = await confirmDialog({
        title: 'حذف دائم',
        message: `${selectedIds.length} یادداشت برای همیشه حذف می‌شود. این عملیات قابل بازگشت نیست.`,
        danger: true,
        confirmLabel: 'حذف دائم',
      });

      if (!confirmed) return;

      for (const noteId of selectedIds) {
        try {
          await deleteToolItem(TOOL_NAME, noteId);
        } catch (error) {
          console.error('[NotePage] bulk delete failed:', error);
        }
      }

      pageState.notes = pageState.notes.filter((note) => !selectedIds.includes(String(note.id)));

      setUi({ selectedIds: [], selectionMode: false });
      await persistAll();

      toast.success('یادداشت‌ها حذف شدند.');
      return;
    }

    if (action === 'bulk-reminder') {
      const minutes = await promptNumberDialog({
        title: 'یادآور گروهی',
        label: 'چند دقیقهٔ دیگر؟',
        value: 60,
      });

      if (!Number.isFinite(minutes) || minutes <= 0) return;

      const at = new Date(Date.now() + minutes * 60_000).toISOString();

      pageState.notes = pageState.notes.map((note) =>
        selectedIds.includes(String(note.id))
          ? {
              ...note,
              reminders: [
                ...(note.reminders || []),
                {
                  id: createId('reminder'),
                  title: note.title || 'یادآوری',
                  message: '',
                  at,
                  nextAt: at,
                  repeat: 'none',
                  channels: ['inapp', 'sound'],
                  enabled: true,
                  createdAt: new Date().toISOString(),
                  lastFiredAt: '',
                  history: [],
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : note
      );

      setUi({ selectedIds: [], selectionMode: false });
      await persistAll();

      toast.success(`یادآور برای ${minutes} دقیقهٔ دیگر تنظیم شد.`);
      return;
    }

    let colorChoice = null;
    let statusChoice = null;

    if (action === 'bulk-color') {
      colorChoice = await promptChoiceDialog({
        title: 'رنگ گروهی',
        label: 'رنگ مورد نظر را انتخاب کن',
        options: Object.entries(COLOR_LABELS).map(([value, label]) => ({ value, label })),
      });
      if (!colorChoice) return;
    }

    if (action === 'bulk-status') {
      statusChoice = await promptChoiceDialog({
        title: 'وضعیت گروهی',
        label: 'وضعیت مورد نظر را انتخاب کن',
        options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
      });
      if (!statusChoice) return;
    }

    const now = new Date().toISOString();

    pageState.notes = pageState.notes.map((note) => {
      if (!selectedIds.includes(String(note.id))) return note;

      switch (action) {
        case 'bulk-pin':
          return { ...note, pinned: !note.pinned, updatedAt: now };
        case 'bulk-favorite':
          return { ...note, favorite: !note.favorite, updatedAt: now };
        case 'bulk-archive':
          return { ...note, archived: true, trashed: false, updatedAt: now };
        case 'bulk-trash':
          return { ...note, trashed: true, archived: false, deletedAt: now, updatedAt: now };
        case 'bulk-color':
          return { ...note, color: colorChoice, updatedAt: now };
        case 'bulk-status':
          return { ...note, status: statusChoice, updatedAt: now };
        default:
          return note;
      }
    });

    setUi({ selectedIds: [], selectionMode: false });
    await persistAll();

    toast.success('عملیات گروهی انجام شد.');
  }

  /* ----- زباله‌دان و کپی ----- */

  async function trashNote(noteId) {
    const note = findNote(noteId);
    if (!note) return;

    if (note.trashed) {
      const confirmed = await confirmDialog({
        title: 'حذف دائم',
        message: 'این یادداشت برای همیشه حذف می‌شود.',
        danger: true,
        confirmLabel: 'حذف دائم',
      });

      if (!confirmed) return;

      await deleteToolItem(TOOL_NAME, noteId);

      pageState.notes = pageState.notes.filter((item) => String(item.id) !== String(noteId));

      if (pageState.ui.editingNoteId === noteId) pageState.ui.editingNoteId = null;

      renderAllRegions();
      await persistAll();

      toast.success('یادداشت برای همیشه حذف شد.');
      return;
    }

    await applyNoteChange(
      noteId,
      (current) => ({ ...current, trashed: true, archived: false, deletedAt: new Date().toISOString() }),
      { activity: 'انتقال به زباله‌دان' }
    );

    toast.success('به زباله‌دان منتقل شد.', {
      title: 'یادداشت',
      action: {
        label: 'بازگردانی',
        onClick: () => restoreNote(noteId),
      },
    });

    if (pageState.ui.editingNoteId === noteId) closeEditor();
  }

  async function restoreNote(noteId) {
    await applyNoteChange(
      noteId,
      (note) => ({ ...note, trashed: false, deletedAt: null }),
      { activity: 'بازگردانی از زباله‌دان' }
    );

    toast.success('یادداشت بازگردانده شد.');
  }

  async function duplicateNote(noteId) {
    const note = findNote(noteId);
    if (!note) return;

    const copy = createEmptyNote({
      ...note,
      id: undefined,
      title: `${note.title || 'بدون عنوان'} (کپی)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shares: [],
      activity: [],
      reminders: [],
    });

    copy.blocks = (note.blocks || []).map((block) => ({ ...block, id: createId('block') }));

    try {
      const created = normalizeNote(await createToolItem(TOOL_NAME, copy, { signal: ctx.signal }));

      pageState.notes = [created, ...pageState.notes];
      renderRegion('view');
      renderRegion('sidebar');
      renderRegion('header');
      await persistAll();
      toast.success('کپی یادداشت ساخته شد.');
    } catch (error) {
      toast.error(error?.message || 'کپی کردن ناموفق بود.');
    }
  }

  /* ----- بکاپ ----- */

  function exportNotes() {
    const payload = createBackupPayload(pageState.notes, { user: ctx.user || null });

    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `vixora-notes-backup-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );

    toast.success('فایل بکاپ دانلود شد.');
  }

  function importNotes() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';

    input.onchange = async () => {
      const file = input.files?.[0];
      input.remove();

      if (!file) return;

      try {
        const backup = await readBackupFile(file);

        const mode = await chooseDialog({
          title: 'نحوهٔ بازیابی',
          message: `فایل بکاپ شامل ${backup.notes?.length || 0} یادداشت است. چطور بازیابی شود؟`,
          options: [
            { id: 'merge', label: 'ادغام با فعلی‌ها', variant: 'primary' },
            { id: 'replace', label: 'جایگزینی کامل', variant: 'danger' },
          ],
        });

        if (!mode) return;

        const result = mergeBackup(pageState.notes, backup, mode);

        pageState.notes = normalizeNoteList(result.notes);

        renderAllRegions();
        await persistAll();

        toast.success(
          `بازیابی انجام شد — ${result.added} یادداشت جدید، ${result.updated} به‌روزرسانی.`
        );
      } catch (error) {
        toast.error(error?.message || 'بازیابی ناموفق بود.');
      }
    };

    document.body.appendChild(input);
    input.click();
  }

  /* ----- تنظیمات ----- */

  function saveSettings(form) {
    const read = (name) => form.querySelector(`[name="${name}"]`);
    const checked = (name) => Boolean(read(name)?.checked);

    updateReminderSettings({
      phoneNumber: read('phoneNumber')?.value?.trim() || '',
      provider: read('provider')?.value || 'link',
      webhookUrl: read('webhookUrl')?.value?.trim() || '',
      webhookApiKey: read('webhookApiKey')?.value?.trim() || '',
      messageTemplate: read('messageTemplate')?.value || 'یادآوری ViXoRa: {title}\n{message}\nزمان: {time}',
      autoSendSms: checked('autoSendSms'),
    });

    updateNotificationSettings({
      smsEnabled: checked('smsEnabled'),
      soundEnabled: checked('soundEnabled'),
      desktopEnabled: checked('desktopEnabled'),
      quietHoursEnabled: checked('quietHoursEnabled'),
    });

    const maxMb = Number(read('maxFileSizeMb')?.value || 3);
    updateAttachmentSettings({ maxFileSizeBytes: Math.max(1, Math.min(10, maxMb)) * 1024 * 1024 });

    toast.success('تنظیمات ذخیره شد.');
  }

  /* ----- پالت فرمان ----- */

  function toggleCommandPalette() {
    const next = !pageState.ui.isCommandPaletteOpen;

    pageState.commandQuery = '';
    pageState.commandIndex = 0;

    setUi({ isCommandPaletteOpen: next, isMoreMenuOpen: false }, { regions: ['header', 'overlay'] });

    if (next) {
      setTimeout(() => refs.overlay?.querySelector('[data-command-input]')?.focus(), 40);
    }
  }

  function closeCommandPalette() {
    pageState.commandQuery = '';
    pageState.commandIndex = 0;
    setUi({ isCommandPaletteOpen: false }, { regions: ['header', 'overlay'] });
  }

  function runCommand(commandId) {
    if (!commandId) return;

    closeCommandPalette();

    if (commandId.startsWith('open-')) {
      openEditor(commandId.slice(5), 'general');
      return;
    }

    if (commandId.startsWith('template-')) {
      createFromTemplate(commandId.slice(9));
      return;
    }

    if (commandId.startsWith('view-')) {
      setUi({ activeView: commandId.slice(5) }, { regions: ['toolbar', 'view'] });
      return;
    }

    switch (commandId) {
      case 'new-note':
        openEditor(null, 'general');
        break;
      case 'quick-note':
        openComposer();
        break;
      case 'toggle-analytics':
      case 'toggle-notifications':
      case 'toggle-reminder-panel':
      case 'toggle-settings':
      case 'toggle-template-panel':
      case 'toggle-header-customize':
      case 'toggle-filter-panel':
        togglePanel(PANEL_KEY_BY_ACTION[commandId]);
        break;
      case 'export-notes':
        exportNotes();
        break;
      case 'import-notes':
        importNotes();
        break;
      case 'clear-filters':
        setUi({ ...createDefaultUiState(), theme: pageState.ui.theme, density: pageState.ui.density });
        break;
      default:
        break;
    }
  }

  /* ----- تقویم ----- */

  function shiftCalendar(direction) {
    const base = pageState.calendarDate ? new Date(pageState.calendarDate) : new Date();
    base.setMonth(base.getMonth() + direction);

    pageState.calendarDate = base.toISOString();

    setUi({ calendarDate: pageState.calendarDate }, { regions: ['view'] });
  }

  
/* ==================================================================
 *  دیالوگ‌های کمکی (جایگزین prompt بومی برای UX یکدست)
 * ================================================================== */

function promptNumberDialog({ title, label, value = 0, suffix = '' }) {
  return new Promise((resolve) => {
    let settled = false;

    const modal = createModal({
      title,
      bodyHtml: `
        <label class="vx-form__label" for="vx-prompt-number">${escapeHtml(label)}</label>
        <input
          id="vx-prompt-number"
          class="vx-input"
          type="number"
          min="1"
          step="1"
          value="${Number(value) || 1}"
          style="margin-top:8px"
        />
      `,
      actions: [
        { id: 'cancel', label: 'انصراف', variant: '' },
        { id: 'ok', label: 'اعمال', variant: 'primary' },
      ],
      onClose: (reason) => {
        if (settled) return;
        settled = true;

        if (reason !== 'ok') {
          resolve(null);
          return;
        }

        const raw = modal.bodyElement?.querySelector('#vx-prompt-number')?.value;
        resolve(Number(raw));
      },
    });

    modal.open();
  });
}

function promptChoiceDialog({ title, label, options = [] }) {
  return new Promise((resolve) => {
    let settled = false;

    const optionsHtml = options
      .map(
        (option, index) => `
        <label class="vx-switch" style="display:flex;padding:8px 10px;border:1px solid var(--vx-border);border-radius:10px">
          <input type="radio" name="vx-choice" value="${escapeHtml(option.value)}"${index === 0 ? ' checked' : ''} />
          <span>${escapeHtml(option.label)}</span>
        </label>`
      )
      .join('');

    const modal = createModal({
      title,
      bodyHtml: `
        <p class="vx-form__label" style="margin:0 0 10px">${escapeHtml(label)}</p>
        <div style="display:flex;flex-direction:column;gap:7px">${optionsHtml}</div>
      `,
      actions: [
        { id: 'cancel', label: 'انصراف', variant: '' },
        { id: 'ok', label: 'اعمال', variant: 'primary' },
      ],
      onClose: (reason) => {
        if (settled) return;
        settled = true;

        if (reason !== 'ok') {
          resolve(null);
          return;
        }

        const checked = modal.bodyElement?.querySelector('input[name="vx-choice"]:checked');
        resolve(checked?.value || null);
      },
    });

    modal.open();
  });
}

/* ================================================================== */
  /* destroy                                                            */
  /* ================================================================== */

  function destroy() {
    pageState.isDestroyed = true;

    stopReminderScheduler();

    for (const cleanup of teardown.splice(0)) {
      try {
        cleanup();
      } catch {
        /* ignore */
      }
    }

    debouncedSearchRender.cancel?.();

    if (releaseCss) releaseCss();
    releaseCss = null;

    pageState.attachmentsCache.clear();

    for (const key of Object.keys(refs)) refs[key] = null;
  }

  return { render, afterRender, destroy };
}

export default createNotePage;
