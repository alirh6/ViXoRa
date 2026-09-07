// src/pages/tools/note/note-renderers.js

/**
 * رندررهای صفحهٔ یادداشت — توابع خالص HTML
 * همهٔ ورودی‌های کاربر با escapeHtml امن می‌شوند.
 */

import { escapeHtml } from '../../../utilities/dom-utils.js';
import {
  formatPersianDate,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatCompactNumber,
  truncateText,
} from '../../../utilities/formatters.js';

import {
  getNotePreview,
  getTaskStats,
  getNextReminder,
  isOverdue,
  isDueToday,
  BLOCK_TYPES,
  NOTE_COLORS,
  NOTE_PRIORITIES,
  NOTE_STATUSES,
  NOTE_VIEWS,
  NOTE_SORTS,
  NOTE_GROUPS,
  SEARCH_SCOPES,
} from '../../../core/schemas/note-schema.js';

import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  COLOR_LABELS,
  HEADER_ACTION_META,
  NOTE_TEMPLATES,
  groupNotes,
  groupByStatus,
  groupByDueDate,
  buildCalendarMatrix,
} from './note-state.js';

/* ------------------------------------------------------------------ */
/* ابزارهای کوچک                                                       */
/* ------------------------------------------------------------------ */

function options(pairs, activeValue) {
  return pairs
    .map(
      ([value, label]) =>
        `<option value="${escapeHtml(value)}"${value === activeValue ? ' selected' : ''}>${escapeHtml(label)}</option>`
    )
    .join('');
}

export function labelFor(value, map, fallback = '') {
  return map[value] || fallback || value || '';
}

const VIEW_META = {
  grid: { label: 'شبکه', icon: '▦' },
  list: { label: 'لیست', icon: '☰' },
  board: { label: 'بورد', icon: '▤' },
  timeline: { label: 'زمان‌بندی', icon: '🕒' },
  calendar: { label: 'تقویم', icon: '📅' },
  masonry: { label: 'آجری', icon: '▥' },
};

/* ------------------------------------------------------------------ */
/* هدر                                                                 */
/* ------------------------------------------------------------------ */

export function renderHeader({ ui, headerConfig, stats, unreadCount, query }) {
  const pinned = (headerConfig.pinned || [])
    .map((id) => renderHeaderAction(id, true))
    .join('');

  const menu = (headerConfig.menu || []).map((id) => renderHeaderAction(id, false)).join('');

  return `
    <header class="vx-nw__header">
      <div class="vx-nw__header-glow" aria-hidden="true"></div>

      <div class="vx-nw__brand">
        <div class="vx-nw__brand-icon" aria-hidden="true">
          <span>🧠</span>
        </div>

        <div class="vx-nw__brand-text">
          <h1 class="vx-nw__title">فضای کاری یادداشت</h1>
          <p class="vx-nw__subtitle">
            یادداشت غنی، یادآور هوشمند، ضمیمه، بکاپ و اشتراک‌گذاری — همه در یک جا
          </p>
        </div>
      </div>

      <div class="vx-nw__actions">
        ${pinned}

        <div class="vx-nw__more">
          <button class="vx-nw__icon-btn" type="button" data-action="toggle-more-menu"
                  aria-label="منوی بیشتر" aria-expanded="${ui.isMoreMenuOpen}" title="بیشتر">
            <span aria-hidden="true">⋯</span>
            ${unreadCount > 0 ? `<span class="vx-nw__dot" aria-hidden="true"></span>` : ''}
          </button>

          ${
            ui.isMoreMenuOpen
              ? `<div class="vx-nw__menu" role="menu">${menu}</div>`
              : ''
          }
        </div>
      </div>

      <div class="vx-nw__searchbar">
        <div class="vx-nw__search">
          <span class="vx-nw__search-icon" aria-hidden="true">🔍</span>

          <input
            class="vx-input vx-nw__search-input"
            type="search"
            data-input="search-query"
            value="${escapeHtml(ui.query)}"
            placeholder="جستجو در عنوان، متن، بخش‌ها، برچسب‌ها..."
            aria-label="جستجوی یادداشت"
          />

          <kbd class="vx-nw__kbd">/</kbd>
        </div>

        <select class="vx-select vx-nw__select" data-change="search-scope" aria-label="محدودهٔ جستجو">
          ${options(
            [
              ['all', 'همه'],
              ['title', 'عنوان'],
              ['content', 'محتوا'],
              ['tags', 'برچسب'],
              ['category', 'دسته'],
              ['color', 'رنگ'],
              ['date', 'تاریخ'],
            ],
            ui.searchScope
          )}
        </select>

        <button class="vx-btn vx-btn--primary vx-nw__new-btn" type="button" data-action="open-editor">
          <span aria-hidden="true">+</span> یادداشت جدید
        </button>

        <button class="vx-btn vx-btn--ghost vx-nw__cmd-btn" type="button" data-action="toggle-command-palette" title="Ctrl+K">
          <span aria-hidden="true">⌘</span> فرمان‌ها
        </button>
      </div>

      <div class="vx-nw__metrics">
        ${renderMetric('نمایش', formatNumber(query.count), 'visible')}
        ${renderMetric('کل', formatNumber(stats.total), 'total')}
        ${renderMetric('یادآور', formatNumber(stats.withReminder), 'reminders')}
        ${renderMetric('سررسید امروز', formatNumber(stats.todayDue), 'today')}
        ${renderMetric('عقب‌افتاده', formatNumber(stats.overdue), 'overdue', stats.overdue > 0 ? 'danger' : '')}
        ${renderMetric('پیشرفت وظایف', `${formatNumber(Math.round(stats.completionRatio * 100))}٪`, 'progress')}
      </div>
    </header>
  `;
}

function renderMetric(label, value, key, tone = '') {
  return `
    <div class="vx-nw__metric ${tone}" data-metric="${key}">
      <strong class="vx-nw__metric-value">${value}</strong>
      <span class="vx-nw__metric-label">${escapeHtml(label)}</span>
    </div>
  `;
}

function renderHeaderAction(actionId, isPinned) {
  const meta = HEADER_ACTION_META[actionId];
  if (!meta) return '';

  return `
    <button
      class="vx-nw__icon-btn ${isPinned ? 'is-pinned' : ''}"
      type="button"
      data-action="header-action"
      data-header-action-id="${escapeHtml(actionId)}"
      title="${escapeHtml(meta.title)}"
      aria-label="${escapeHtml(meta.title)}"
    >
      <span aria-hidden="true">${meta.icon}</span>
    </button>
  `;
}

/* ------------------------------------------------------------------ */
/* نوار ابزار                                                          */
/* ------------------------------------------------------------------ */

export function renderToolbar({ ui, selectedCount }) {
  return `
    <section class="vx-nw__toolbar">
      <div class="vx-nw__views" role="tablist" aria-label="نوع نمایش">
        ${NOTE_VIEWS.map((view) => {
          const meta = VIEW_META[view] || { label: view, icon: '•' };
          const isActive = ui.activeView === view;

          return `
            <button
              class="vx-nw__view-tab ${isActive ? 'is-active' : ''}"
              type="button"
              role="tab"
              aria-selected="${isActive}"
              data-action="set-view"
              data-view="${view}"
              title="${escapeHtml(meta.label)}"
            >
              <span class="vx-nw__view-icon" aria-hidden="true">${meta.icon}</span>
              <span class="vx-nw__view-label">${escapeHtml(meta.label)}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="vx-nw__toolbar-side">
        <select class="vx-select" data-change="sort" aria-label="مرتب‌سازی">
          ${options(
            [
              ['smart', 'مرتب‌سازی هوشمند'],
              ['updated', 'اخیراً ویرایش‌شده'],
              ['created', 'اخیراً ایجادشده'],
              ['alphabetical', 'الفبا'],
              ['priority', 'اولویت'],
              ['due', 'نزدیک‌ترین سررسید'],
              ['pinned', 'سنجاق‌شده اول'],
              ['favorite', 'علاقه‌مندی اول'],
              ['neglected', 'فراموش‌شده'],
              ['momentum', 'بیشترین فعالیت'],
              ['random', 'تصادفی'],
            ],
            ui.activeSort
          )}
        </select>

        <select class="vx-select" data-change="group-by" aria-label="گروه‌بندی">
          ${options(
            [
              ['none', 'بدون گروه'],
              ['status', 'بر اساس وضعیت'],
              ['priority', 'بر اساس اولویت'],
              ['color', 'بر اساس رنگ'],
              ['category', 'بر اساس دسته'],
            ],
            ui.groupBy
          )}
        </select>

        <button
          class="vx-btn ${ui.selectionMode ? 'vx-btn--accent' : 'vx-btn--ghost'}"
          type="button"
          data-action="toggle-selection-mode"
        >
          ${selectedCount > 0 ? `${formatNumber(selectedCount)} انتخاب‌شده` : 'انتخاب چندتایی'}
        </button>

        <button class="vx-btn vx-btn--ghost" type="button" data-action="toggle-filter-panel">
          فیلترها
        </button>
      </div>
    </section>
  `;
}

/* ------------------------------------------------------------------ */
/* سایدبار                                                             */
/* ------------------------------------------------------------------ */

export function renderSidebar({ ui, stats, attachmentsUsage, upcomingReminders = [] }) {
  const buckets = [
    { key: 'show-all', label: 'همهٔ یادداشت‌ها', count: stats.active, icon: '🗂️' },
    { key: 'toggle-favorites', label: 'علاقه‌مندی‌ها', count: stats.favorites, icon: '⭐' },
    { key: 'toggle-pinned-filter', label: 'سنجاق‌شده', count: stats.pinned, icon: '📌' },
    { key: 'toggle-checklist-filter', label: 'دارای چک‌لیست', count: stats.withChecklist, icon: '✅' },
    { key: 'toggle-reminder-filter', label: 'یادآوردار', count: stats.withReminder, icon: '⏰' },
    { key: 'toggle-attachment-filter', label: 'دارای ضمیمه', count: stats.withAttachment, icon: '📎' },
    { key: 'filter-overdue', label: 'عقب‌افتاده', count: stats.overdue, icon: '⚠️' },
    { key: 'filter-today', label: 'سررسید امروز', count: stats.todayDue, icon: '📆' },
    { key: 'toggle-archive', label: 'آرشیو', count: stats.archived, icon: '🗄️' },
    { key: 'toggle-trash', label: 'زباله‌دان', count: stats.trashed, icon: '🗑️' },
  ];

  const bucketStateMap = {
    'toggle-favorites': ui.showFavoritesOnly,
    'toggle-pinned-filter': ui.showPinnedOnly,
    'toggle-checklist-filter': ui.showChecklistOnly,
    'toggle-reminder-filter': ui.showReminderOnly,
    'toggle-attachment-filter': ui.showAttachmentOnly,
    'filter-overdue': ui.showOverdueOnly,
    'filter-today': ui.showTodayOnly,
    'toggle-archive': ui.showArchivedOnly,
    'toggle-trash': ui.showTrashOnly,
  };

  return `
    <aside class="vx-nw__sidebar">
      <section class="vx-nw__side-card">
        <h3 class="vx-nw__side-title">سطل‌های هوشمند</h3>

        <div class="vx-nw__bucket-list">
          ${buckets
            .map(
              (bucket) => `
                <button
                  class="vx-nw__bucket ${bucketStateMap[bucket.key] ? 'is-active' : ''}"
                  type="button"
                  data-action="${bucket.key}"
                >
                  <span class="vx-nw__bucket-icon" aria-hidden="true">${bucket.icon}</span>
                  <span class="vx-nw__bucket-label">${escapeHtml(bucket.label)}</span>
                  <span class="vx-nw__bucket-count">${formatNumber(bucket.count)}</span>
                </button>
              `
            )
            .join('')}
        </div>
      </section>

      <section class="vx-nw__side-card">
        <h3 class="vx-nw__side-title">رنگ‌ها</h3>

        <div class="vx-nw__chip-row">
          ${NOTE_COLORS.map((color) => {
            const isActive = ui.activeColorFilter === color;

            return `
              <button
                class="vx-nw__chip vx-nw__chip--color ${isActive ? 'is-active' : ''}"
                type="button"
                data-action="set-color-filter"
                data-color="${color}"
                title="${escapeHtml(COLOR_LABELS[color] || color)}"
              >
                <span class="vx-nw__dot vx-nw__dot--${color}" aria-hidden="true"></span>
                ${escapeHtml(COLOR_LABELS[color] || color)}
              </button>
            `;
          }).join('')}
        </div>
      </section>

      <section class="vx-nw__side-card">
        <h3 class="vx-nw__side-title">اولویت</h3>

        <div class="vx-nw__chip-row">
          ${NOTE_PRIORITIES.map((priority) => {
            const isActive = ui.activePriorityFilter === priority;

            return `
              <button
                class="vx-nw__chip vx-nw__chip--priority-${priority} ${isActive ? 'is-active' : ''}"
                type="button"
                data-action="set-priority-filter"
                data-priority="${priority}"
              >
                ${escapeHtml(PRIORITY_LABELS[priority] || priority)}
              </button>
            `;
          }).join('')}
        </div>
      </section>

      <section class="vx-nw__side-card">
        <h3 class="vx-nw__side-title">قالب‌های آماده</h3>

        <div class="vx-nw__template-list">
          ${Object.values(NOTE_TEMPLATES)
            .map(
              (template) => `
                <button
                  class="vx-nw__template"
                  type="button"
                  data-action="create-from-template"
                  data-template-id="${template.id}"
                >
                  <span class="vx-nw__template-icon" aria-hidden="true">${template.icon}</span>
                  <span class="vx-nw__template-text">
                    <strong>${escapeHtml(template.label)}</strong>
                    <small>${escapeHtml(template.description)}</small>
                  </span>
                </button>
              `
            )
            .join('')}
        </div>
      </section>

      <section class="vx-nw__side-card">
        <h3 class="vx-nw__side-title">یادآورهای پیش‌رو</h3>

        ${
          upcomingReminders.length === 0
            ? '<p class="vx-hint">یادآور فعالی در پیش نیست.</p>'
            : `<div class="vx-nw__upcoming">
                ${upcomingReminders
                  .slice(0, 5)
                  .map(
                    (entry) => `
                  <button class="vx-nw__upcoming-item" type="button"
                          data-action="open-note" data-note-id="${escapeHtml(entry.noteId)}">
                    <span class="vx-nw__upcoming-icon" aria-hidden="true">⏰</span>
                    <span class="vx-nw__upcoming-text">
                      <strong>${escapeHtml(entry.title || 'یادآوری')}</strong>
                      <small>${escapeHtml(entry.noteTitle || '')} • ${escapeHtml(formatRelativeTime(entry.at))}</small>
                    </span>
                  </button>`
                  )
                  .join('')}
              </div>`
        }
      </section>

      <section class="vx-nw__side-card">
        <h3 class="vx-nw__side-title">حافظهٔ ضمیمه</h3>

        <div class="vx-nw__usage">
          <div class="vx-nw__usage-bar" role="progressbar" aria-valuenow="${attachmentsUsage.percent}">
            <span style="width:${attachmentsUsage.percent}%"></span>
          </div>

          <p class="vx-nw__usage-text">
            ${escapeHtml(attachmentsUsage.label)}
            <small>برای ${formatNumber(attachmentsUsage.noteCount)} یادداشت</small>
          </p>
        </div>
      </section>
    </aside>
  `;
}

/* ------------------------------------------------------------------ */
/* پنل‌ها                                                              */
/* ------------------------------------------------------------------ */

export function renderPanels({ ui, stats, reminders, notifications, settings, neglected }) {
  const panels = [];

  if (ui.isFilterPanelOpen) panels.push(renderFilterPanel(ui));
  if (ui.isAnalyticsOpen) panels.push(renderAnalyticsPanel(stats, neglected));
  if (ui.isTemplatePanelOpen) panels.push(renderTemplatePanel());
  if (ui.isReminderPanelOpen) panels.push(renderReminderPanel(reminders, settings));
  if (ui.isNotificationCenterOpen) panels.push(renderNotificationCenter(notifications));
  if (ui.isSettingsPanelOpen) panels.push(renderSettingsPanel(settings));
  if (ui.isHeaderCustomizeOpen) panels.push(renderHeaderCustomizePanel(ui));

  return panels.length > 0 ? `<div class="vx-nw__panels">${panels.join('')}</div>` : '';
}

function renderFilterPanel(ui) {
  const toggles = [
    ['showFavoritesOnly', 'toggle-favorites', 'علاقه‌مندی'],
    ['showPinnedOnly', 'toggle-pinned-filter', 'سنجاق‌شده'],
    ['showChecklistOnly', 'toggle-checklist-filter', 'چک‌لیست'],
    ['showReminderOnly', 'toggle-reminder-filter', 'یادآور'],
    ['showAttachmentOnly', 'toggle-attachment-filter', 'ضمیمه'],
    ['showOverdueOnly', 'filter-overdue', 'عقب‌افتاده'],
    ['showTodayOnly', 'filter-today', 'امروز'],
  ];

  return `
    <section class="vx-nw__panel">
      <div class="vx-nw__panel-head">
        <h3>فیلترهای ترکیبی</h3>
        <div class="vx-nw__panel-actions">
          <button class="vx-btn vx-btn--sm" type="button" data-action="clear-filters">پاک‌کردن همه</button>
          <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="toggle-filter-panel">بستن</button>
        </div>
      </div>

      <div class="vx-nw__panel-body">
        <div class="vx-nw__chip-row">
          ${toggles
            .map(
              ([stateKey, actionKey, label]) => `
                <button
                  class="vx-nw__chip ${ui[stateKey] ? 'is-active' : ''}"
                  type="button"
                  data-action="${actionKey}"
                >${escapeHtml(label)}</button>
              `
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
}

function renderAnalyticsPanel(stats, neglected) {
  const cards = [
    { label: 'یادداشت فعال', value: formatNumber(stats.active), icon: '🗂️' },
    { label: 'بخش‌های ثبت‌شده', value: formatNumber(stats.blocksTotal), icon: '🧱' },
    { label: 'وظایف انجام‌شده', value: `${formatNumber(stats.tasksDone)} / ${formatNumber(stats.tasksTotal)}`, icon: '✅' },
    { label: 'عقب‌افتاده', value: formatNumber(stats.overdue), icon: '⚠️', tone: stats.overdue > 0 ? 'danger' : '' },
    { label: 'سررسید امروز', value: formatNumber(stats.todayDue), icon: '📆' },
    { label: 'یادآور فعال', value: formatNumber(stats.withReminder), icon: '⏰' },
  ];

  const maxColorCount = Math.max(1, ...stats.colors.map((item) => item.count));

  return `
    <section class="vx-nw__panel">
      <div class="vx-nw__panel-head">
        <h3>تحلیل و آمار</h3>
        <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="toggle-analytics">بستن</button>
      </div>

      <div class="vx-nw__panel-body">
        <div class="vx-nw__stat-grid">
          ${cards
            .map(
              (card) => `
                <div class="vx-nw__stat-card ${card.tone || ''}">
                  <span class="vx-nw__stat-icon" aria-hidden="true">${card.icon}</span>
                  <strong>${card.value}</strong>
                  <small>${escapeHtml(card.label)}</small>
                </div>
              `
            )
            .join('')}
        </div>

        <div class="vx-nw__chart">
          <h4>توزیع رنگ‌ها</h4>

          ${stats.colors
            .map(
              (item) => `
                <div class="vx-nw__chart-row">
                  <span class="vx-nw__dot vx-nw__dot--${item.color}" aria-hidden="true"></span>
                  <span class="vx-nw__chart-label">${escapeHtml(COLOR_LABELS[item.color] || item.color)}</span>
                  <div class="vx-nw__chart-bar">
                    <span style="width:${Math.round((item.count / maxColorCount) * 100)}%"></span>
                  </div>
                  <strong>${formatNumber(item.count)}</strong>
                </div>
              `
            )
            .join('')}
        </div>

        ${
          stats.allTags.length > 0
            ? `
              <div class="vx-nw__tags-cloud">
                <h4>برچسب‌های پرتکرار</h4>
                <div class="vx-nw__chip-row">
                  ${stats.allTags
                    .slice(0, 12)
                    .map(
                      (tag) =>
                        `<button class="vx-nw__chip" type="button" data-action="search-tag" data-tag="${escapeHtml(tag.label)}">#${escapeHtml(tag.label)} <small>${formatNumber(tag.count)}</small></button>`
                    )
                    .join('')}
                </div>
              </div>
            `
            : ''
        }

        ${
          neglected.length > 0
            ? `
              <div class="vx-nw__neglected">
                <h4>یادداشت‌های فراموش‌شده</h4>
                <ul>
                  ${neglected
                    .map(
                      (note) => `
                        <li>
                          <button class="vx-nw__link-btn" type="button" data-action="open-note" data-note-id="${escapeHtml(note.id)}">
                            ${escapeHtml(truncateText(note.title || 'بدون عنوان', 40))}
                          </button>
                          <small>${escapeHtml(formatRelativeTime(note.updatedAt || note.createdAt))}</small>
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

function renderTemplatePanel() {
  return `
    <section class="vx-nw__panel">
      <div class="vx-nw__panel-head">
        <h3>قالب‌های آماده</h3>
        <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="toggle-template-panel">بستن</button>
      </div>

      <div class="vx-nw__panel-body">
        <div class="vx-nw__template-grid">
          ${Object.values(NOTE_TEMPLATES)
            .map(
              (template) => `
                <button
                  class="vx-nw__template-card"
                  type="button"
                  data-action="create-from-template"
                  data-template-id="${template.id}"
                >
                  <span class="vx-nw__template-card-icon" aria-hidden="true">${template.icon}</span>
                  <strong>${escapeHtml(template.label)}</strong>
                  <small>${escapeHtml(template.description)}</small>
                  <span class="vx-nw__template-card-count">${(template.note.blocks || []).length} بخش آماده</span>
                </button>
              `
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
}

function renderReminderPanel(reminders, settings) {
  const providerLabels = {
    link: 'پیامک با گوشی خودم (sms:)',
    whatsapp: 'واتساپ',
    telegram: 'تلگرام',
    email: 'ایمیل',
    webhook: 'پنل پیامکی (Webhook)',
  };

  return `
    <section class="vx-nw__panel">
      <div class="vx-nw__panel-head">
        <h3>یادآورهای پیش‌رو</h3>
        <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="toggle-reminder-panel">بستن</button>
      </div>

      <div class="vx-nw__panel-body">
        <p class="vx-nw__hint">
          کانال فعلی پیامک: <strong>${escapeHtml(providerLabels[settings.provider] || settings.provider)}</strong>
          ${settings.phoneNumber ? ` • شماره: <strong dir="ltr">${escapeHtml(settings.phoneNumber)}</strong>` : ' • شماره‌ای تنظیم نشده'}
        </p>

        ${
          reminders.length === 0
            ? '<p class="vx-nw__hint">یادآور فعالی وجود ندارد. از داخل هر یادداشت می‌توانی یادآور بسازی.</p>'
            : `
              <ul class="vx-nw__reminder-list">
                ${reminders
                  .slice(0, 8)
                  .map(
                    (reminder) => `
                      <li class="vx-nw__reminder-item">
                        <div>
                          <strong>${escapeHtml(reminder.title || 'یادآوری')}</strong>
                          <small>
                            ${escapeHtml(reminder.noteTitle || '')} •
                            ${escapeHtml(reminder.nextAt || reminder.at ? formatPersianDate(reminder.nextAt || reminder.at) : 'بدون زمان')}
                            ${reminder.repeat && reminder.repeat !== 'none' ? ' • تکرارشونده' : ''}
                          </small>
                        </div>

                        <div class="vx-nw__reminder-actions">
                          <button class="vx-btn vx-btn--sm" type="button" data-action="snooze-reminder"
                                  data-note-id="${escapeHtml(reminder.noteId)}" data-reminder-id="${escapeHtml(reminder.id)}"
                                  data-minutes="10">۱۰ دقیقه</button>

                          <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="open-note"
                                  data-note-id="${escapeHtml(reminder.noteId)}">بازکردن</button>
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

function renderNotificationCenter(notifications) {
  return `
    <section class="vx-nw__panel">
      <div class="vx-nw__panel-head">
        <h3>مرکز اعلان‌ها</h3>

        <div class="vx-nw__panel-actions">
          <button class="vx-btn vx-btn--sm" type="button" data-action="mark-all-notifications-read">خواندن همه</button>
          <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="toggle-notifications">بستن</button>
        </div>
      </div>

      <div class="vx-nw__panel-body">
        ${
          notifications.length === 0
            ? '<p class="vx-nw__hint">اعلانی وجود ندارد.</p>'
            : `
              <ul class="vx-nw__notif-list">
                ${notifications
                  .slice(0, 12)
                  .map(
                    (item) => `
                      <li class="vx-nw__notif-item ${item.read ? '' : 'is-unread'}">
                        <div class="vx-nw__notif-body">
                          <strong>${escapeHtml(item.title)}</strong>
                          ${item.body ? `<p>${escapeHtml(truncateText(item.body, 120))}</p>` : ''}
                          <small>${escapeHtml(formatRelativeTime(item.createdAt))}</small>
                        </div>

                        <div class="vx-nw__notif-actions">
                          ${
                            item.noteId
                              ? `<button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="open-note" data-note-id="${escapeHtml(item.noteId)}">بازکردن</button>`
                              : ''
                          }
                          ${
                            (item.actions || []).length > 0 && item.actions[0].url
                              ? `<a class="vx-btn vx-btn--sm" href="${escapeHtml(item.actions[0].url)}" target="_blank" rel="noopener">${escapeHtml(item.actions[0].label || 'ارسال')}</a>`
                              : ''
                          }
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

function renderSettingsPanel(settings) {
  return `
    <section class="vx-nw__panel">
      <div class="vx-nw__panel-head">
        <h3>تنظیمات یادآور، پیامک و ضمیمه</h3>
        <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="toggle-settings">بستن</button>
      </div>

      <div class="vx-nw__panel-body">
        <form class="vx-form vx-form--grid" data-form="settings" novalidate>
          <label class="vx-form__field">
            <span class="vx-form__label">شمارهٔ موبایل من (برای پیامک)</span>
            <input class="vx-input" dir="ltr" name="phoneNumber" value="${escapeHtml(settings.reminder.phoneNumber)}" placeholder="09xxxxxxxxx" />
          </label>

          <label class="vx-form__field">
            <span class="vx-form__label">کانال ارسال پیامک</span>
            <select class="vx-select" name="provider">
              ${options(
                [
                  ['link', 'پیامک با گوشی خودم (sms:)'],
                  ['whatsapp', 'واتساپ'],
                  ['telegram', 'تلگرام'],
                  ['email', 'ایمیل'],
                  ['webhook', 'پنل پیامکی (Webhook)'],
                ],
                settings.reminder.provider
              )}
            </select>
          </label>

          <label class="vx-form__field">
            <span class="vx-form__label">آدرس پنل پیامکی (Webhook)</span>
            <input class="vx-input" dir="ltr" name="webhookUrl" value="${escapeHtml(settings.reminder.webhookUrl)}" placeholder="https://sms-panel.example/api/send" />
          </label>

          <label class="vx-form__field">
            <span class="vx-form__label">کلید API پنل</span>
            <input class="vx-input" dir="ltr" name="webhookApiKey" value="${escapeHtml(settings.reminder.webhookApiKey)}" placeholder="اختیاری" />
          </label>

          <label class="vx-form__field">
            <span class="vx-form__label">حداکثر حجم هر ضمیمه (مگابایت)</span>
            <input class="vx-input" type="number" min="1" max="10" step="1" name="maxFileSizeMb" value="${Math.round(settings.attachment.maxFileSizeBytes / (1024 * 1024))}" />
          </label>

          <label class="vx-form__field">
            <span class="vx-form__label">قالب متن پیامک</span>
            <input class="vx-input" name="messageTemplate" value="${escapeHtml(settings.reminder.messageTemplate)}" />
          </label>

          <div class="vx-form__switches">
            <label class="vx-switch">
              <input type="checkbox" name="smsEnabled" ${settings.notification.smsEnabled ? 'checked' : ''} />
              <span>فعال‌سازی ارسال پیامک</span>
            </label>

            <label class="vx-switch">
              <input type="checkbox" name="soundEnabled" ${settings.notification.soundEnabled ? 'checked' : ''} />
              <span>صدای اعلان</span>
            </label>

            <label class="vx-switch">
              <input type="checkbox" name="desktopEnabled" ${settings.notification.desktopEnabled ? 'checked' : ''} />
              <span>اعلان دسکتاپ</span>
            </label>

            <label class="vx-switch">
              <input type="checkbox" name="autoSendSms" ${settings.reminder.autoSendSms ? 'checked' : ''} />
              <span>بازکردن خودکار پیامک هنگام سررسید</span>
            </label>

            <label class="vx-switch">
              <input type="checkbox" name="quietHoursEnabled" ${settings.notification.quietHoursEnabled ? 'checked' : ''} />
              <span>ساعت سکوت</span>
            </label>
          </div>

          <div class="vx-form__footer">
            <button class="vx-btn vx-btn--ghost" type="button" data-action="request-notification-permission">
              فعال‌سازی اعلان دسکتاپ
            </button>

            <button class="vx-btn vx-btn--primary" type="submit">ذخیرهٔ تنظیمات</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderHeaderCustomizePanel(ui) {
  return `
    <section class="vx-nw__panel">
      <div class="vx-nw__panel-head">
        <h3>چیدمان هدر</h3>
        <div class="vx-nw__panel-actions">
          <button class="vx-btn vx-btn--sm" type="button" data-action="reset-header-config">بازنشانی</button>
          <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="toggle-header-customize">بستن</button>
        </div>
      </div>

      <div class="vx-nw__panel-body">
        <p class="vx-nw__hint">
          دکمه‌هایی که می‌خواهی مستقیم در هدر باشد را انتخاب کن؛ بقیه داخل منوی «بیشتر» می‌روند.
        </p>

        <div class="vx-nw__chip-row">
          ${Object.entries(HEADER_ACTION_META)
            .map(
              ([id, meta]) => `
                <button
                  class="vx-nw__chip ${ui._pinnedActions.includes(id) ? 'is-active' : ''}"
                  type="button"
                  data-action="toggle-header-pin"
                  data-header-action-id="${escapeHtml(id)}"
                >
                  ${meta.icon} ${escapeHtml(meta.label)}
                </button>
              `
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
}

/* ------------------------------------------------------------------ */
/* کارت یادداشت                                                        */
/* ------------------------------------------------------------------ */

export function renderNoteCard(note, { ui, selected = false, compact = false } = {}) {
  const taskStats = getTaskStats(note);
  const nextReminder = getNextReminder(note);
  const preview = getNotePreview(note, compact ? 90 : 150);
  const overdue = isOverdue(note);
  const today = isDueToday(note);

  const blockIcons = (note.blocks || [])
    .slice(0, 6)
    .map((block) => BLOCK_TYPES[block.type]?.icon || '📄')
    .join(' ');

  return `
    <article
      class="vx-note-card vx-note-card--${escapeHtml(note.color || 'blue')} ${selected ? 'is-selected' : ''} ${overdue ? 'is-overdue' : ''} ${note.trashed ? 'is-trashed' : ''} ${note.archived ? 'is-archived' : ''}"
      data-note-id="${escapeHtml(note.id)}"
      style="--note-accent: var(--vx-color-${escapeHtml(note.color || 'blue')})"
      tabindex="0"
    >
      ${note.pinned ? '<span class="vx-note-card__pin" aria-hidden="true">📌</span>' : ''}

      <header class="vx-note-card__head">
        <div class="vx-note-card__heading">
          <h3 class="vx-note-card__title">${escapeHtml(note.title || 'بدون عنوان')}</h3>

          <div class="vx-note-card__meta">
            <span class="vx-chip vx-chip--status-${escapeHtml(note.status || 'todo')}">
              ${escapeHtml(STATUS_LABELS[note.status] || 'در انتظار')}
            </span>

            <span class="vx-chip vx-chip--priority-${escapeHtml(note.priority || 'medium')}">
              ${escapeHtml(PRIORITY_LABELS[note.priority] || 'متوسط')}
            </span>

            ${note.category ? `<span class="vx-chip">${escapeHtml(note.category)}</span>` : ''}
            ${note.favorite ? '<span class="vx-chip vx-chip--star" title="علاقه‌مندی">★</span>' : ''}
          </div>
        </div>

        ${
          ui.selectionMode
            ? `
              <input
                type="checkbox"
                class="vx-note-card__check"
                data-action="toggle-select-note"
                data-note-id="${escapeHtml(note.id)}"
                ${selected ? 'checked' : ''}
                aria-label="انتخاب یادداشت"
              />
            `
            : ''
        }
      </header>

      ${
        preview
          ? `<p class="vx-note-card__preview">${escapeHtml(preview)}</p>`
          : '<p class="vx-note-card__preview is-empty">بدون محتوا</p>'
      }

      <div class="vx-note-card__blocks" aria-hidden="true">${blockIcons}</div>

      ${
        taskStats.total > 0
          ? `
            <div class="vx-note-card__progress">
              <div class="vx-note-card__progress-bar" role="progressbar"
                   aria-valuenow="${Math.round(taskStats.ratio * 100)}" aria-valuemin="0" aria-valuemax="100">
                <span style="width:${Math.round(taskStats.ratio * 100)}%"></span>
              </div>
              <small>${formatNumber(taskStats.done)} / ${formatNumber(taskStats.total)} وظیفه</small>
            </div>
          `
          : ''
      }

      ${
        (note.tags || []).length > 0
          ? `
            <div class="vx-note-card__tags">
              ${note.tags
                .slice(0, 5)
                .map((tag) => `<span class="vx-tag">#${escapeHtml(tag)}</span>`)
                .join('')}
            </div>
          `
          : ''
      }

      <footer class="vx-note-card__footer">
        <div class="vx-note-card__badges">
          ${
            note.dueAt
              ? `<span class="vx-note-card__due ${overdue ? 'is-overdue' : today ? 'is-today' : ''}">
                   ${overdue ? '⚠️' : '📆'} ${escapeHtml(formatPersianDate(note.dueAt))}
                 </span>`
              : ''
          }

          ${
            nextReminder
              ? `<span class="vx-note-card__reminder" title="یادآور">
                   ⏰ ${escapeHtml(formatRelativeTime(nextReminder.nextAt || nextReminder.at))}
                 </span>`
              : ''
          }

          ${
            (note.attachments || []).length > 0
              ? `<span class="vx-note-card__attachment">📎 ${formatNumber(note.attachments.length)}</span>`
              : ''
          }
        </div>

        <div class="vx-note-card__actions">
          ${
            ui.selectionMode
              ? `<button class="vx-mini-btn" type="button" data-action="toggle-select-note" data-note-id="${escapeHtml(note.id)}">${selected ? 'لغو' : 'انتخاب'}</button>`
              : ''
          }

          <button class="vx-mini-btn" type="button" data-action="open-note" data-note-id="${escapeHtml(note.id)}">بازکردن</button>
          <button class="vx-mini-btn" type="button" data-action="toggle-pin" data-note-id="${escapeHtml(note.id)}" title="سنجاق">${note.pinned ? '📌' : '📍'}</button>
          <button class="vx-mini-btn" type="button" data-action="toggle-favorite-note" data-note-id="${escapeHtml(note.id)}" title="علاقه‌مندی">${note.favorite ? '★' : '☆'}</button>
          <button class="vx-mini-btn" type="button" data-action="open-share-sheet" data-note-id="${escapeHtml(note.id)}" title="اشتراک">↗</button>
          <button class="vx-mini-btn vx-mini-btn--danger" type="button" data-action="trash-note" data-note-id="${escapeHtml(note.id)}" title="انتقال به زباله‌دان">🗑</button>
        </div>
      </footer>
    </article>
  `;
}

/* ------------------------------------------------------------------ */
/* نماها                                                               */
/* ------------------------------------------------------------------ */

export function renderActiveView({ notes, ui }) {
  if (notes.length === 0) {
    return renderEmptyState(ui);
  }

  const grouped = groupNotes(notes, ui.groupBy);

  switch (ui.activeView) {
    case 'list':
      return `<div class="vx-view vx-view--list">${renderGroupedSections(grouped, ui, 'vx-note-list')}</div>`;

    case 'board':
      return renderBoardView(notes, ui);

    case 'timeline':
      return renderTimelineView(notes);

    case 'calendar':
      return renderCalendarView(notes, ui);

    case 'masonry':
      return `<div class="vx-view vx-view--masonry">${notes.map((note) => renderNoteCard(note, { ui })).join('')}</div>`;

    case 'grid':
    default:
      return `<div class="vx-view vx-view--grid">${renderGroupedSections(grouped, ui, 'vx-note-grid')}</div>`;
  }
}

function renderEmptyState(ui) {
  const hasFilters =
    Boolean(String(ui.query || '').trim()) ||
    ui.showFavoritesOnly ||
    ui.showPinnedOnly ||
    ui.showArchivedOnly ||
    ui.showTrashOnly ||
    ui.showChecklistOnly ||
    ui.showOverdueOnly ||
    ui.showTodayOnly ||
    ui.showReminderOnly ||
    ui.showAttachmentOnly ||
    ui.activeColorFilter !== 'all' ||
    ui.activePriorityFilter !== 'all';

  return `
    <section class="vx-state vx-state--empty">
      <div class="vx-state__icon" aria-hidden="true">${hasFilters ? '🔍' : '📝'}</div>

      <h3 class="vx-state__title">${hasFilters ? 'نتیجه‌ای پیدا نشد' : 'هنوز یادداشتی نداری'}</h3>

      <p class="vx-state__desc">
        ${
          hasFilters
            ? 'فیلترها یا عبارت جستجو را تغییر بده، یا یک یادداشت تازه بساز.'
            : 'اولین یادداشتت را بساز؛ می‌توانی بخش‌های دلخواه، یادآور، ضمیمه و اشتراک‌گذاری اضافه کنی.'
        }
      </p>

      <div class="vx-state__actions">
        <button class="vx-btn vx-btn--primary" type="button" data-action="open-editor">+ یادداشت جدید</button>

        ${hasFilters ? '<button class="vx-btn vx-btn--ghost" type="button" data-action="clear-filters">پاک‌کردن فیلترها</button>' : ''}
      </div>
    </section>
  `;
}

function renderGroupedSections(grouped, ui, wrapperClass) {
  if (grouped.groups.length === 0) {
    return `<div class="${wrapperClass}">${grouped.flattened.map((note) => renderNoteCard(note, { ui })).join('')}</div>`;
  }

  return grouped.groups
    .map(
      (group) => `
        <section class="vx-group">
          <div class="vx-group__head">
            <h3 class="vx-group__title">${escapeHtml(group.label)}</h3>
            <span class="vx-chip">${formatNumber(group.items.length)}</span>
          </div>

          <div class="${wrapperClass}">
            ${group.items.map((note) => renderNoteCard(note, { ui })).join('')}
          </div>
        </section>
      `
    )
    .join('');
}

function renderBoardView(notes, ui) {
  const columns = groupByStatus(notes);
  const order = NOTE_STATUSES;

  return `
    <div class="vx-view vx-view--board">
      ${order
        .map((status) => {
          const items = columns[status] || [];

          return `
            <section class="vx-board__column" data-status="${status}">
              <header class="vx-board__head">
                <h3>${escapeHtml(STATUS_LABELS[status] || status)}</h3>
                <span class="vx-chip">${formatNumber(items.length)}</span>
              </header>

              <div class="vx-board__body" data-drop-status="${status}">
                ${items.map((note) => renderNoteCard(note, { ui, compact: true })).join('')}
              </div>
            </section>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderTimelineView(notes) {
  const sorted = [...notes].sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );

  return `
    <div class="vx-view vx-view--timeline">
      ${sorted
        .map((note) => {
          const taskStats = getTaskStats(note);

          return `
            <article class="vx-timeline__item" data-note-id="${escapeHtml(note.id)}">
              <span class="vx-timeline__dot" aria-hidden="true"></span>

              <div class="vx-timeline__card">
                <header>
                  <h3>${escapeHtml(note.title || 'بدون عنوان')}</h3>

                  <span class="vx-chip">${escapeHtml(formatRelativeTime(note.updatedAt || note.createdAt))}</span>
                </header>

                <p>${escapeHtml(truncateText(getNotePreview(note, 120) || 'بدون محتوا', 120))}</p>

                <footer>
                  <span class="vx-chip vx-chip--status-${escapeHtml(note.status || 'todo')}">
                    ${escapeHtml(STATUS_LABELS[note.status] || '')}
                  </span>

                  ${
                    taskStats.total > 0
                      ? `<span class="vx-chip">${formatNumber(taskStats.done)}/${formatNumber(taskStats.total)} وظیفه</span>`
                      : ''
                  }

                  <button class="vx-mini-btn" type="button" data-action="open-note" data-note-id="${escapeHtml(note.id)}">بازکردن</button>
                </footer>
              </div>
            </article>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderCalendarView(notes, ui) {
  const matrix = buildCalendarMatrix(notes, ui.calendarDate ? new Date(ui.calendarDate) : new Date());

  const monthLabel = (() => {
    try {
      return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(
        new Date(matrix.year, matrix.month, 1)
      );
    } catch {
      return `${matrix.year}/${matrix.month + 1}`;
    }
  })();

  const dueGroups = groupByDueDate(notes);

  return `
    <div class="vx-view vx-view--calendar">
      <section class="vx-calendar">
        <header class="vx-calendar__head">
          <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="calendar-prev" aria-label="ماه قبل">→</button>
          <h3>${escapeHtml(monthLabel)}</h3>
          <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="calendar-next" aria-label="ماه بعد">←</button>
        </header>

        <div class="vx-calendar__weekdays">
          ${['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day) => `<span>${day}</span>`).join('')}
        </div>

        <div class="vx-calendar__grid">
          ${matrix.cells
            .map((cell) =>
              cell.day === null
                ? '<span class="vx-calendar__cell is-blank"></span>'
                : `
                  <span class="vx-calendar__cell ${cell.isToday ? 'is-today' : ''} ${cell.notes.length ? 'has-notes' : ''}">
                    <strong>${formatNumber(cell.day)}</strong>
                    ${
                      cell.notes.length > 0
                        ? `<span class="vx-calendar__pill">${formatNumber(cell.notes.length)}</span>`
                        : ''
                    }
                  </span>
                `
            )
            .join('')}
        </div>
      </section>

      <section class="vx-calendar__list">
        <h3 class="vx-nw__side-title">سررسیدها</h3>

        ${
          dueGroups.length === 0
            ? '<p class="vx-nw__hint">سررسیدی ثبت نشده است.</p>'
            : dueGroups
                .map(
                  (group) => `
                    <div class="vx-calendar__day">
                      <h4>${escapeHtml(group.date === 'بدون سررسید' ? group.date : formatPersianDate(group.date))}</h4>

                      <div class="vx-note-list">
                        ${group.items.map((note) => renderNoteCard(note, { ui, compact: true })).join('')}
                      </div>
                    </div>
                  `
                )
                .join('')
        }
      </section>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* نوار عملیات گروهی                                                   */
/* ------------------------------------------------------------------ */

export function renderBulkBar({ selectedCount }) {
  if (selectedCount === 0) return '';

  return `
    <div class="vx-bulkbar" role="toolbar" aria-label="عملیات گروهی">
      <strong>${formatNumber(selectedCount)} یادداشت انتخاب شده</strong>

      <div class="vx-bulkbar__actions">
        <button class="vx-btn vx-btn--sm" type="button" data-action="bulk-pin">📌 سنجاق</button>
        <button class="vx-btn vx-btn--sm" type="button" data-action="bulk-favorite">⭐ علاقه‌مندی</button>
        <button class="vx-btn vx-btn--sm" type="button" data-action="bulk-status">وضعیت</button>
        <button class="vx-btn vx-btn--sm" type="button" data-action="bulk-color">رنگ</button>
        <button class="vx-btn vx-btn--sm" type="button" data-action="bulk-reminder">⏰ یادآور</button>
        <button class="vx-btn vx-btn--sm" type="button" data-action="bulk-archive">🗄️ آرشیو</button>
        <button class="vx-btn vx-btn--sm" type="button" data-action="bulk-trash">🗑 زباله‌دان</button>
        <button class="vx-btn vx-btn--sm" type="button" data-action="bulk-export">⬇️ خروجی</button>
        <button class="vx-btn vx-btn--sm vx-btn--danger" type="button" data-action="bulk-delete">حذف دائم</button>
        <button class="vx-btn vx-btn--sm vx-btn--ghost" type="button" data-action="bulk-clear">لغو انتخاب</button>
      </div>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* صفحه‌بندی                                                           */
/* ------------------------------------------------------------------ */

export function renderPager({ page, totalPages, total }) {
  if (totalPages <= 1) return '';

  return `
    <nav class="vx-pager" aria-label="صفحه‌بندی">
      <button class="vx-btn vx-btn--sm" type="button" data-action="page-prev" ${page <= 1 ? 'disabled' : ''}>قبلی</button>

      <span class="vx-pager__info">
        صفحهٔ ${formatNumber(page)} از ${formatNumber(totalPages)} • ${formatNumber(total)} یادداشت
      </span>

      <button class="vx-btn vx-btn--sm" type="button" data-action="page-next" ${page >= totalPages ? 'disabled' : ''}>بعدی</button>
    </nav>
  `;
}

export { formatNumber, formatCompactNumber, formatCurrency };
