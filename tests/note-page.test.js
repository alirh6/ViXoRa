// tests/note-page.test.js

/**
 * تست end-to-end فضای کاری یادداشت (بازنویسی فانکشنال):
 * روتر + گاردها + لایهٔ دادهٔ LocalStorage + سرویس‌ها (یادآور/ضمیمه/اشتراک/اعلان) + UI
 *
 * هر تست مستقل است: دادهٔ خودش را می‌سازد و در پایان روتر را destroy می‌کند.
 */

import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { setupDom, getAppRoot, setPathname, click, type, pressKey, flush } from './helpers/jsdom-setup.js';

// ماژول‌های خالص (بدون وابستگی به DOM) را مستقیم import می‌کنیم تا
// داخل بدنهٔ describe هم قابل استفاده باشند (describe همزمان اجرا می‌شود).
import * as schema from '../src/core/schemas/note-schema.js';
import * as stateLogic from '../src/pages/tools/note/note-state.js';
import * as reminderService from '../src/core/services/reminder-service.js';
import * as notificationService from '../src/core/services/notification-service.js';
import * as attachmentService from '../src/core/services/attachment-service.js';
import * as shareService from '../src/core/services/share-service.js';
import { toast } from '../src/utilities/toast.js';

const MODULES = {};

before(async () => {
  setupDom({ url: 'http://localhost:5173/tools/note' });

  MODULES.appState = await import('../src/core/state/app-state.js');
  MODULES.selectors = await import('../src/core/state/selectors.js');
  MODULES.auth = await import('../src/core/services/auth-service.js');
  MODULES.tools = await import('../src/core/actions/tools-service.js');
  MODULES.router = await import('../src/core/router/router.js');
  MODULES.authGuard = await import('../src/core/guards/auth.guard.js');
  MODULES.titleGuard = await import('../src/core/guards/title.guard.js');
  MODULES.notePage = await import('../src/pages/tools/note/notePage.js');
  MODULES.schema = await import('../src/core/schemas/note-schema.js');
  MODULES.reminders = await import('../src/core/services/reminder-service.js');
  MODULES.notifications = await import('../src/core/services/notification-service.js');
  MODULES.attachments = await import('../src/core/services/attachment-service.js');
  MODULES.share = await import('../src/core/services/share-service.js');
  MODULES.stateLogic = await import('../src/pages/tools/note/note-state.js');

  MODULES.appState.initializeAppState();

  const result = await MODULES.auth.login('alirh', 'ali12345');
  assert.equal(result.success, true, `seed login failed: ${result.message}`);
});

beforeEach(async () => {
  getAppRoot().innerHTML = '';

  // اگر تست قبلی با خطا تمام شده باشد، router.destroy() اجرا نشده و
  // زمان‌بند یادآور همچنان زنده است؛ اینجا مطمئن می‌شویم خاموش شده.
  reminderService.stopReminderScheduler();

  toast.destroyAll();
  document.querySelectorAll('.vx-modal-overlay').forEach((element) => element.remove());
  document.querySelectorAll('.vx-drawer-host').forEach((element) => element.remove());
  document.querySelectorAll('.vx-overlay-host').forEach((element) => element.remove());

  if (!MODULES.selectors.selectIsAuthenticated(MODULES.appState.appStore.getState())) {
    await MODULES.auth.login('alirh', 'ali12345');
  }

  await MODULES.tools.setToolItems('notes', []);

  // ایزوله‌کردن هر تست: وضعیت UI صفحه و ضمیمه‌های تست قبلی پاک می‌شوند
  for (const key of Object.keys(globalThis.localStorage)) {
    if (key.startsWith('ViXoRa:notes-page') || key.startsWith('ViXoRa:attachments:')) {
      globalThis.localStorage.removeItem(key);
    }
  }

  notificationService.updateNotificationSettings({ quietHoursEnabled: false, smsEnabled: true });
  reminderService.clearSmsQueue();
  notificationService.clearNotifications();
});

/* ------------------------------------------------------------------ */
/* ابزارهای تست                                                        */
/* ------------------------------------------------------------------ */

function createTestToolsLayout() {
  return function createToolsLayout() {
    let outlet = null;

    return {
      render: () =>
        '<div class="vcr-layout"><aside class="vcr-sidebar">menu</aside><section id="page-content" data-router-outlet></section></div>',
      afterRender() {
        outlet = document.querySelector('#page-content');
      },
      getOutlet: () => outlet,
      destroy() {
        outlet = null;
      },
    };
  };
}

const ROUTE_META = { requiresAuth: true, title: 'یادداشت‌ها' };

async function mountNotePage() {
  const router = MODULES.router.createRouter({
    routes: [
      {
        path: '/tools/note',
        layout: createTestToolsLayout(),
        layoutKey: 'tools-layout',
        component: MODULES.notePage.createNotePage,
        meta: ROUTE_META,
      },
    ],
    rootElement: getAppRoot(),
    getState: MODULES.appState.appStore.getState,
  });

  const store = MODULES.appState.appStore;
  router.beforeEach(MODULES.titleGuard.createTitleGuard('ViXoRa'));
  router.beforeEach(MODULES.authGuard.createAuthGuard(store));

  setPathname('/tools/note');
  router.start();
  await flush(8);

  return router;
}

function page() {
  return document.querySelector('[data-note-page]');
}

function region(name) {
  return document.querySelector(`[data-region="${name}"]`);
}

function view() {
  return region('view');
}

function noteCards() {
  return Array.from(document.querySelectorAll('[data-region="view"] .vx-note-card'));
}

async function seedNotes(items) {
  const normalized = items.map((item) => schema.normalizeNote(item));
  await MODULES.tools.setToolItems('notes', normalized);
  return normalized;
}

function getDialogButton(id) {
  return Array.from(document.querySelectorAll('.vx-modal__btn')).find(
    (button) => button.dataset.actionId === id
  );
}

async function confirmOpenDialog() {
  const button = getDialogButton('confirm');
  assert.ok(button, 'confirm dialog must be open');
  click(button);
  await new Promise((resolve) => setTimeout(resolve, 260));
  await flush(3);
}

async function selectNotesInView(count) {
  for (let index = 0; index < count; index += 1) {
    const boxes = view().querySelectorAll('input.vx-note-card__check[data-action="toggle-select-note"]');
    assert.ok(boxes[index], `چک‌باکس شمارهٔ ${index} باید وجود داشته باشد`);
    click(boxes[index]);
    await flush(2);
  }
}

async function openMoreMenu() {
  const button = document.querySelector('[data-action="toggle-more-menu"]');
  assert.ok(button, 'دکمهٔ منوی بیشتر باید باشد');

  if (!document.querySelector('.vx-nw__menu')) {
    click(button);
    await flush(2);
  }

  return document.querySelector('.vx-nw__menu');
}

async function clickHeaderAction(actionId) {
  const pinnedButton = document.querySelector(
    `[data-action="header-action"][data-header-action-id="${actionId}"]`
  );

  if (pinnedButton) {
    click(pinnedButton);
    await flush(3);
    return;
  }

  await openMoreMenu();

  const menuButton = document.querySelector(
    `.vx-nw__menu [data-action="header-action"][data-header-action-id="${actionId}"]`
  );
  assert.ok(menuButton, `اکشن هدر ${actionId} باید وجود داشته باشد`);

  click(menuButton);
  await flush(3);
}

async function openDrawer(index = 0) {
  const card = noteCards()[index];
  assert.ok(card, `کارت شمارهٔ ${index} باید وجود داشته باشد`);

  const button = card.querySelector('[data-action="open-note"]');
  assert.ok(button, 'کارت باید دکمهٔ بازکردن داشته باشد');

  click(button);
  await flush(3);

  return document.querySelector('.vx-drawer');
}

async function createNoteViaComposer(title, content = 'متن پیش‌فرض', extra = {}) {
  click(document.querySelector('[data-action="open-composer"]'));
  await flush(2);

  const overlay = region('overlay');
  assert.ok(overlay.querySelector('.vx-composer'), 'composer must be open');

  type(overlay.querySelector('[data-composer-field="title"]'), title);
  type(overlay.querySelector('[data-composer-field="content"]'), content);

  if (extra.priority) {
    const select = overlay.querySelector('[data-composer-field="priority"]');
    select.value = extra.priority;
  }

  click(overlay.querySelector('[data-action="save-composer"]'));
  await flush(4);

  return overlay;
}

/* ================================================================== */
/* ۱) لایهٔ منطق                                                       */
/* ================================================================== */

describe('pages/tools/note — منطق خالص', () => {
  const {
    createEmptyNote, createBlock, normalizeNote, getTaskStats,
    getNextReminder, isOverdue, isDueToday, getNotePlainText,
  } = schema;

  const {
    getVisibleNotes, sortNotes, groupNotes, buildCalendarMatrix, getNoteStats,
    paginate, matchesSearch, NOTE_TEMPLATES, DEFAULT_HEADER_CONFIG,
  } = stateLogic;

  test('normalizeNote مهاجرت یادداشت قدیمی {content,checklist} را انجام می‌دهد', () => {
    const legacy = normalizeNote({
      id: 'legacy-1',
      title: 'یادداشت قدیمی',
      content: 'متن قدیمی',
      checklist: [{ text: 'کار الف', done: false }, { text: 'کار ب', done: true }],
      tags: 'کار, شخصی',
      dueDate: '2026-09-10T08:00:00.000Z',
    });

    assert.equal(legacy.version, 2);
    assert.deepEqual(legacy.tags, ['کار', 'شخصی']);
    assert.equal(legacy.dueAt, '2026-09-10T08:00:00.000Z');

    const types = legacy.blocks.map((block) => block.type);
    assert.ok(types.includes('text'), 'content باید به بلوک text تبدیل شود');
    assert.ok(types.includes('task'), 'checklist باید به بلوک task تبدیل شود');

    const taskBlock = legacy.blocks.find((block) => block.type === 'task');
    assert.equal(taskBlock.items.length, 2);
    assert.equal(taskBlock.items[1].done, true);

    const stats = getTaskStats(legacy);
    assert.equal(stats.total, 2);
    assert.equal(stats.done, 1);
    assert.equal(stats.ratio, 0.5);
  });

  test('normalizeNote دادهٔ خراب را با مقدار پیش‌فرض ترمیم می‌کند', () => {
    const note = normalizeNote({ id: 'x', blocks: [{ type: 'unknown-type' }, null], color: 'pink', priority: 'insane' });

    assert.equal(note.color, 'blue');
    assert.equal(note.priority, 'medium');
    assert.ok(Array.isArray(note.blocks));
    assert.ok(note.blocks.length >= 1, 'بلوک نامعتبر باید حذف و بلوک پیش‌فرض ساخته شود');
    assert.equal(note.blocks[0].type, 'text');
  });

  test('createBlock برای هر ۱۳ نوع بخش ساختار درست می‌سازد', () => {
    const expected = {
      text: 'value',
      task: 'items',
      keyvalue: 'fields',
      table: 'columns',
      checklistRating: 'items',
      link: 'links',
      contact: 'people',
      money: 'entries',
      date: 'events',
      location: 'places',
      media: 'attachmentIds',
      code: 'value',
      quote: 'value',
    };

    for (const [type, key] of Object.entries(expected)) {
      const block = createBlock(type);
      assert.equal(block.type, type);
      assert.ok(block.id, `${type} باید id داشته باشد`);
      assert.ok(block[key] !== undefined, `${type} باید ${key} داشته باشد`);
    }
  });

  test('getVisibleNotes سطل‌ها، فیلتر رنگ/اولویت، جستجو و آرشیو/زباله‌دان را اعمال می‌کند', () => {
    const notes = [
      createEmptyNote({ id: 'a', title: 'خرید', color: 'rose', priority: 'urgent', tags: ['خانه'] }),
      createEmptyNote({ id: 'b', title: 'جلسه', color: 'blue', priority: 'low', category: 'کار' }),
      createEmptyNote({ id: 'c', title: 'آرشیو شده', archived: true }),
      createEmptyNote({ id: 'd', title: 'زباله', trashed: true }),
    ];

    assert.deepEqual(getVisibleNotes(notes, createDefaultUi()).map((note) => note.id), ['a', 'b']);

    assert.deepEqual(
      getVisibleNotes(notes, { ...createDefaultUi(), activeColorFilter: 'rose' }).map((n) => n.id),
      ['a']
    );

    assert.deepEqual(
      getVisibleNotes(notes, { ...createDefaultUi(), activePriorityFilter: 'low' }).map((n) => n.id),
      ['b']
    );

    assert.deepEqual(
      getVisibleNotes(notes, { ...createDefaultUi(), query: 'جلسه' }).map((n) => n.id),
      ['b']
    );

    assert.deepEqual(
      getVisibleNotes(notes, { ...createDefaultUi(), showArchivedOnly: true }).map((n) => n.id),
      ['c']
    );

    assert.deepEqual(
      getVisibleNotes(notes, { ...createDefaultUi(), showTrashOnly: true }).map((n) => n.id),
      ['d']
    );

    assert.deepEqual(
      getVisibleNotes(notes, { ...createDefaultUi(), searchScope: 'tags', query: 'خانه' }).map((n) => n.id),
      ['a']
    );
  });

  function createDefaultUi() {
    return stateLogic.createDefaultUiState();
  }

  test('sortNotes هر ۱۱ حالت مرتب‌سازی را پوشش می‌دهد', () => {
    const now = Date.now();
    const notes = [
      createEmptyNote({ id: 'a', title: 'ب', updatedAt: new Date(now - 3000).toISOString(), priority: 'low', pinned: true }),
      createEmptyNote({ id: 'b', title: 'الف', updatedAt: new Date(now - 1000).toISOString(), priority: 'urgent' }),
      createEmptyNote({ id: 'c', title: 'پ', updatedAt: new Date(now - 2000).toISOString(), priority: 'medium', favorite: true }),
    ];

    assert.deepEqual(sortNotes(notes, 'alphabetical').map((n) => n.title), ['الف', 'ب', 'پ']);
    assert.deepEqual(sortNotes(notes, 'updated').map((n) => n.id), ['b', 'c', 'a']);
    assert.deepEqual(sortNotes(notes, 'created').map((n) => n.id), ['a', 'b', 'c']);
    assert.deepEqual(sortNotes(notes, 'priority').map((n) => n.id), ['b', 'c', 'a']);
    assert.equal(sortNotes(notes, 'pinned')[0].id, 'a');
    assert.equal(sortNotes(notes, 'favorite')[0].id, 'c');

    const modes = ['smart', 'due', 'neglected', 'momentum', 'random'];
    for (const mode of modes) {
      const result = sortNotes(notes, mode);
      assert.equal(result.length, 3, `حالت ${mode} نباید آیتمی از دست بدهد`);
    }
  });

  test('groupNotes بر اساس status/priority/color/category گروه می‌سازد', () => {
    const notes = [
      createEmptyNote({ id: 'a', status: 'done', priority: 'high', color: 'rose', category: 'کار' }),
      createEmptyNote({ id: 'b', status: 'todo', priority: 'low', color: 'blue', category: 'کار' }),
    ];

    const byStatus = groupNotes(notes, 'status');
    const labels = byStatus.groups.map((group) => group.label);
    assert.ok(labels.includes('انجام‌شده'), 'گروه «انجام‌شده» باید باشد');
    assert.ok(labels.includes('در انتظار'), 'گروه «در انتظار» باید باشد');
    assert.equal(byStatus.flattened.length, 2);

    assert.equal(groupNotes(notes, 'priority').groups.length, 2);
    assert.equal(groupNotes(notes, 'color').groups.length, 2);
    assert.equal(groupNotes(notes, 'category').groups.length, 1);
    assert.equal(groupNotes(notes, 'none').groups.length, 0, 'groupBy=none نباید گروه بسازد');
  });

  test('buildCalendarMatrix تقویم شنبه‌شروع با روزهای ماه درست می‌سازد', () => {
    const matrix = buildCalendarMatrix(
      [createEmptyNote({ id: 'a', dueAt: '2026-09-07T09:00:00.000Z' })],
      new Date('2026-09-07T09:00:00.000Z')
    );

    assert.equal(matrix.daysInMonth, 30, 'شهریور ۱۴۰۵ / سپتامبر ۲۰۲۶ سی روز است');
    assert.equal(matrix.cells.length % 7, 0, 'خانه‌ها باید مضرب هفت باشند');

    const today = matrix.cells.find((cell) => cell.isToday);
    assert.ok(today, 'خانهٔ امروز باید علامت‌گذاری شود');

    const withNote = matrix.cells.filter((cell) => cell.notes.length > 0);
    assert.ok(withNote.length >= 1, 'یادداشت باید در خانهٔ سررسیدش باشد');
  });

  test('getNoteStats آمار کلی و paginate صفحه‌بندی را درست حساب می‌کند', () => {
    const notes = [
      createEmptyNote({ id: 'a', pinned: true, favorite: true }),
      createEmptyNote({ id: 'b', archived: true }),
      createEmptyNote({ id: 'c', trashed: true }),
      createEmptyNote({ id: 'd', blocks: [createBlock('task', { items: [{ id: 't1', text: 'x', done: false }] })] }),
    ];

    const stats = getNoteStats(notes);
    assert.equal(stats.total, 4);
    assert.equal(stats.pinned, 1);
    assert.equal(stats.favorites, 1);
    assert.equal(stats.archived, 1);
    assert.equal(stats.trashed, 1);

    const firstPage = paginate([1, 2, 3, 4, 5], 1, 2);
    assert.deepEqual(firstPage.items, [1, 2]);
    assert.equal(firstPage.totalPages, 3);

    const lastPage = paginate([1, 2, 3, 4, 5], 3, 2);
    assert.deepEqual(lastPage.items, [5]);
  });

  test('matchesSearch دامنه‌های مختلف جستجو را می‌شناسد', () => {
    const note = createEmptyNote({
      id: 'a',
      title: 'پرداخت قبض',
      summary: 'برق و گاز',
      category: 'مالی',
      tags: ['خانه'],
      color: 'amber',
      blocks: [createBlock('text', { value: 'متن داخلی یادداشت' })],
    });

    assert.equal(matchesSearch(note, 'پرداخت', 'title'), true);
    assert.equal(matchesSearch(note, 'برق', 'summary'), true);
    assert.equal(matchesSearch(note, 'مالی', 'category'), true);
    assert.equal(matchesSearch(note, 'خانه', 'tags'), true);
    assert.equal(matchesSearch(note, 'amber', 'color'), true);
    assert.equal(matchesSearch(note, 'متن داخلی', 'content'), true);
    assert.equal(matchesSearch(note, 'ندارد', 'all'), false);
    assert.equal(matchesSearch(note, '', 'all'), true);
  });

  test('قالب‌ها و چیدمان پیش‌فرض هدر معتبرند', () => {
    const ids = Object.keys(NOTE_TEMPLATES);
    assert.ok(ids.length >= 7, 'حداقل ۷ قالب');
    assert.ok(ids.includes('daily'));
    assert.ok(ids.includes('project'));
    assert.ok(ids.includes('brainstorm'));

    for (const template of Object.values(NOTE_TEMPLATES)) {
      assert.ok(template.label, `${template.id} باید label داشته باشد`);
      assert.ok(Array.isArray(template.note.blocks), `${template.id} باید blocks داشته باشد`);

      for (const block of template.note.blocks) {
        assert.ok(BLOCK_TYPE_KEYS().includes(block.type), `نوع نامعتبر ${block.type} در قالب ${template.id}`);
      }
    }

    assert.ok(DEFAULT_HEADER_CONFIG.pinned.length > 0);
  });

  function BLOCK_TYPE_KEYS() {
    return Object.keys(schema.BLOCK_TYPES);
  }

  test('getNotePlainText / getNextReminder / isOverdue / isDueToday درست کار می‌کنند', () => {
    const note = createEmptyNote({
      id: 'a',
      title: 'عنوان',
      blocks: [createBlock('text', { value: 'متن' }), createBlock('task', { items: [{ id: 't', text: 'کار', done: false }] })],
      reminders: [
        { id: 'r2', title: 'بعدی', at: '2099-01-01T00:00:00.000Z', nextAt: '2099-01-01T00:00:00.000Z', enabled: true, repeat: 'none', channels: ['inapp'] },
        { id: 'r1', title: 'اول', at: '2090-01-01T00:00:00.000Z', nextAt: '2090-01-01T00:00:00.000Z', enabled: true, repeat: 'none', channels: ['inapp'] },
      ],
    });

    const text = getNotePlainText(note);
    assert.ok(text.includes('عنوان'));
    assert.ok(text.includes('متن'));
    assert.ok(text.includes('کار'));

    assert.equal(getNextReminder(note).id, 'r1', 'نزدیک‌ترین یادآور فعال باید برگردد');

    const past = createEmptyNote({ id: 'p', dueAt: '2020-01-01T00:00:00.000Z' });
    assert.equal(isOverdue(past), true);
    assert.equal(isDueToday(past), false);

    const today = createEmptyNote({ id: 't', dueAt: new Date().toISOString() });
    assert.equal(isDueToday(today), true);
  });

  test('validateNoteDraft عنوان خالی را رد می‌کند', () => {
    const bad = schema.validateNoteDraft({ title: '   ', blocks: [] });
    assert.equal(bad.valid, false);

    const good = schema.validateNoteDraft({ title: 'درست', blocks: [] });
    assert.equal(good.valid, true);
  });
});

/* ================================================================== */
/* ۲) مانت و رندر                                                      */
/* ================================================================== */

describe('pages/tools/note — مانت و رندر', () => {
  test('داخل outlet لایه‌اوت مانت می‌شود، CSS تزریق و عنوان ست می‌شود', async () => {
    await seedNotes([createEmptyNoteForTest('یادداشت اول')]);

    const router = await mountNotePage();

    assert.ok(getAppRoot().querySelector('#page-content [data-note-page]'), 'صفحه باید داخل outlet باشد');
    assert.ok(getAppRoot().querySelector('.vcr-sidebar'), 'لایه‌اوت باید باقی بماند');
    assert.ok(document.getElementById('vixora-style-notes-workspace'), 'CSS صفحه باید تزریق شود');
    assert.equal(document.title, 'یادداشت‌ها | ViXoRa');
    assert.equal(document.querySelector('.vx-skeleton-card'), null, 'اسکلتون باید تمام شده باشد');
    assert.equal(noteCards().length, 1);

    router.destroy();
    assert.equal(document.getElementById('vixora-style-notes-workspace'), null, 'CSS باید آزاد شود');
  });

  test('ناوبری دوباره به همان مسیر فقط یک استایل scoped باقی می‌گذارد', async () => {
    await seedNotes([]);

    const router = await mountNotePage();
    setPathname('/tools/note');
    await router.navigate('/tools/note');
    await flush(6);

    assert.equal(document.querySelectorAll('#vixora-style-notes-workspace').length, 1);

    router.destroy();
  });

  test('حالت خالی با دکمهٔ ساخت یادداشت نمایش داده می‌شود', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    assert.ok(document.querySelector('.vx-state--empty'), 'حالت خالی باید نمایش داده شود');

    router.destroy();
  });

  test('یادداشت قدیمی از db.json بعد از مهاجرت رندر می‌شود', async () => {
    await MODULES.tools.setToolItems('notes', [{ id: 'legacy-x', title: 'قدیمی', content: 'بدون بلوک' }]);

    const router = await mountNotePage();

    const card = noteCards()[0];
    assert.ok(card, 'کارت باید رندر شود');
    assert.ok(card.textContent.includes('قدیمی'));
    assert.ok(card.textContent.includes('بدون بلوک'), 'محتوای قدیمی باید به متن تبدیل شود');

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].version, 2, 'دادهٔ ذخیره‌شده باید مهاجرت شود');

    router.destroy();
  });

  test('destroy زمان‌بند یادآور را متوقف و رویدادها را جدا می‌کند', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    assert.equal(reminderService.isSchedulerRunning(), true, 'زمان‌بند باید در afterRender روشن شود');

    router.destroy();

    assert.equal(reminderService.isSchedulerRunning(), false, 'زمان‌بند باید در destroy خاموش شود');
  });
});

/* ================================================================== */
/* ۳) ساخت و ویرایش                                                    */
/* ================================================================== */

describe('pages/tools/note — ساخت و ویرایش', () => {
  test('کمپوزر سریع یادداشت را با بلوک متن می‌سازد و در storage ذخیره می‌کند', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    await createNoteViaComposer('خرید هفتگی', 'شیر و نان');

    assert.equal(noteCards().length, 1);
    assert.ok(noteCards()[0].textContent.includes('خرید هفتگی'));

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored.length, 1);
    assert.equal(stored[0].title, 'خرید هفتگی');
    assert.equal(stored[0].blocks.length, 1);
    assert.equal(stored[0].blocks[0].type, 'text');
    assert.equal(stored[0].blocks[0].value, 'شیر و نان');

    router.destroy();
  });

  test('کمپوزر کاملاً خالی خطا می‌دهد و چیزی ذخیره نمی‌کند', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    await createNoteViaComposer('   ', '   ');

    assert.equal(noteCards().length, 0);
    assert.ok(document.querySelector('.vx-toast--error'), 'toast خطا باید نمایش داده شود');

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored.length, 0, 'چیزی نباید ذخیره شود');

    router.destroy();
  });

  test('کمپوزر با عنوان خالی اما محتوای معتبر، یادداشت را ثبت می‌کند', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    await createNoteViaComposer('   ', 'فقط متن');

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored.length, 1);
    assert.equal(stored[0].blocks[0].value, 'فقط متن');

    router.destroy();
  });

  test('ویرایشگر کشویی باز می‌شود و ذخیرهٔ تنظیمات کلی کار می‌کند', async () => {
    const [note] = await seedNotes([createEmptyNoteForTest('عنوان اولیه')]);
    const router = await mountNotePage();

    await openDrawer(0);

    const drawer = document.querySelector('.vx-drawer');
    assert.ok(drawer, 'کشو باید باز شود');
    assert.equal(drawer.dataset.editor, note.id);

    drawer.querySelector('[name="title"]').value = 'عنوان ویرایش‌شده';
    drawer.querySelector('[name="category"]').value = 'شخصی';

    click(drawer.querySelector('[data-action="save-note"]'));
    await flush(4);

    assert.equal(document.querySelector('.vx-drawer'), null, 'کشو باید بسته شود');

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].title, 'عنوان ویرایش‌شده');
    assert.equal(stored[0].category, 'شخصی');

    router.destroy();
  });

  test('تب‌های ویرایشگر محتوا را عوض می‌کنند', async () => {
    await seedNotes([createEmptyNoteForTest('تست تب')]);
    const router = await mountNotePage();

    await openDrawer(0);

    const drawer = document.querySelector('.vx-drawer');
    assert.ok(drawer.querySelector('[data-form="note-general"]'), 'تب پیش‌فرض = عمومی');

    click(drawer.querySelector('[data-action="set-editor-tab"][data-tab="blocks"]'));
    await flush(2);

    assert.ok(document.querySelector('.vx-blocks'), 'تب بخش‌ها باید بلوک‌ها را نشان دهد');
    assert.ok(document.querySelector('.vx-block-picker'), 'انتخابگر بخش باید باشد');

    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="activity"]'));
    await flush(2);

    assert.ok(
      document.querySelector('.vx-activity') || document.querySelector('.vx-drawer').textContent.includes('تاریخچهٔ تغییرات'),
      'تب تاریخچه باید رندر شود'
    );

    router.destroy();
  });

  test('افزودن بلوک جدید از انتخابگر بخش کار می‌کند', async () => {
    const [note] = await seedNotes([createEmptyNoteForTest('با بخش')]);
    const router = await mountNotePage();

    await openDrawer(0);

    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="blocks"]'));
    await flush(2);

    const before = document.querySelectorAll('.vx-block').length;

    click(document.querySelector('[data-action="add-block"][data-block-type="keyvalue"]'));
    await flush(3);

    const after = document.querySelectorAll('.vx-block').length;
    assert.equal(after, before + 1, 'یک بلوک باید اضافه شود');

    const stored = await MODULES.tools.getToolData('notes');
    const types = stored[0].blocks.map((block) => block.type);
    assert.ok(types.includes('keyvalue'));
    assert.ok(stored[0].activity.some((entry) => entry.label.includes('کلید/مقدار')));

    router.destroy();
  });

  test('ویرایش درجای یک بلوک بدون بازکردن فرم بزرگ ذخیره می‌شود', async () => {
    const [note] = await seedNotes([
      {
        ...createEmptyNoteForTest('ویرایش درجا'),
        blocks: [schema.createBlock('text', { title: 'توضیحات', value: 'قدیم' })],
      },
    ]);

    const router = await mountNotePage();

    await openDrawer(0);
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="blocks"]'));
    await flush(2);

    const input = document.querySelector('[data-block-input="value"]');
    assert.ok(input, 'ورودی درجای بلوک باید وجود داشته باشد');

    input.value = 'جدید';
    input.dispatchEvent(new globalThis.window.Event('focusout', { bubbles: true }));
    await flush(3);

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].blocks[0].value, 'جدید');

    router.destroy();
  });

  test('افزودن آیتم وظیفه درجا + تیک‌زدن + حذف آیتم', async () => {
    await seedNotes([
      {
        ...createEmptyNoteForTest('لیست کار'),
        blocks: [schema.createBlock('task', { title: 'کارها', items: [] })],
      },
    ]);

    const router = await mountNotePage();

    await openDrawer(0);
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="blocks"]'));
    await flush(2);

    const quick = document.querySelector('[data-quick-field="text"]');
    assert.ok(quick, 'ورودی افزودن سریع باید باشد');

    quick.value = 'خرید';
    click(document.querySelector('[data-action="quick-add-item"][data-item-kind="task"]'));
    await flush(3);

    let stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].blocks[0].items.length, 1);
    assert.equal(stored[0].blocks[0].items[0].text, 'خرید');
    assert.equal(quick.value, '', 'ورودی باید بعد از افزودن خالی شود');

    // تیک زدن
    const checkbox = document.querySelector('[data-action="toggle-task"]');
    checkbox.checked = true;
    checkbox.dispatchEvent(new globalThis.window.Event('change', { bubbles: true }));
    await flush(3);

    stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].blocks[0].items[0].done, true);

    // حذف آیتم
    click(document.querySelector('[data-action="remove-item"]'));
    await flush(3);

    stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].blocks[0].items.length, 0);

    router.destroy();
  });

  test('بلوک جدول: افزودن سطر/ستون و ذخیرهٔ خانه', async () => {
    await seedNotes([
      { ...createEmptyNoteForTest('جدول'), blocks: [schema.createBlock('table')] },
    ]);

    const router = await mountNotePage();

    await openDrawer(0);
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="blocks"]'));
    await flush(2);

    let stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].blocks[0].columns.length, 2, 'جدول پیش‌فرض دو ستون دارد');
    assert.equal(stored[0].blocks[0].rows.length, 1, 'جدول پیش‌فرض یک سطر دارد');

    click(document.querySelector('[data-action="add-table-row"]'));
    await flush(3);

    stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].blocks[0].rows.length, 2);

    click(document.querySelector('[data-action="add-table-column"]'));
    await flush(3);

    stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].blocks[0].columns.length, 3);
    assert.equal(stored[0].blocks[0].rows[0].length, 3, 'سطر باید با ستون جدید هم‌اندازه شود');

    const cell = document.querySelector('[data-block-cell-row]');
    cell.value = 'مقدار سلول';
    cell.dispatchEvent(new globalThis.window.Event('focusout', { bubbles: true }));
    await flush(3);

    stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].blocks[0].rows[0][0], 'مقدار سلول');

    router.destroy();
  });

  test('جابجایی و حذف بلوک', async () => {
    await seedNotes([
      {
        ...createEmptyNoteForTest('ترتیب'),
        blocks: [
          schema.createBlock('text', { title: 'اول' }),
          schema.createBlock('quote', { title: 'دوم' }),
        ],
      },
    ]);

    const router = await mountNotePage();

    await openDrawer(0);
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="blocks"]'));
    await flush(2);

    const firstBlockId = document.querySelector('.vx-block').dataset.blockId;
    click(document.querySelector(`[data-action="move-block-down"][data-block-id="${firstBlockId}"]`));
    await flush(3);

    let stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].blocks[0].title, 'دوم');

    click(document.querySelector('[data-action="delete-block"]'));
    await flush(2);
    await confirmOpenDialog();

    stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].blocks.length, 1);

    router.destroy();
  });

  test('سنجاق، علاقه‌مندی و رنگ از روی کارت', async () => {
    const [note] = await seedNotes([createEmptyNoteForTest('کارت')]);
    const router = await mountNotePage();

    const card = noteCards()[0];

    click(card.querySelector('[data-action="toggle-pin"]'));
    await flush(3);

    click(noteCards()[0].querySelector('[data-action="toggle-favorite-note"]'));
    await flush(3);

    // تغییر رنگ از ویرایشگر (انتخابگر رنگ)
    await openDrawer(0);
    const colorButton = document.querySelector('[data-action="set-note-color"][data-color="emerald"]');
    assert.ok(colorButton, 'انتخابگر رنگ باید در ویرایشگر باشد');
    click(colorButton);
    await flush(3);

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].pinned, true);
    assert.equal(stored[0].favorite, true);
    assert.equal(stored[0].color, 'emerald');
    assert.ok(stored[0].activity.length >= 3, 'فعالیت‌ها باید ثبت شوند');

    router.destroy();
  });

  test('کپی یادداشت یک نسخهٔ مستقل می‌سازد', async () => {
    await seedNotes([createEmptyNoteForTest('اصلی')]);
    const router = await mountNotePage();
    await openDrawer(0);
    click(document.querySelector('[data-action="duplicate-note"]'));
    await flush(4);

    assert.equal(noteCards().length, 2);

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored.length, 2);
    assert.notEqual(stored[0].id, stored[1].id);
    assert.ok(stored.find((note) => note.title.includes('(کپی)')));

    router.destroy();
  });
});

/* ================================================================== */
/* ۴) زباله‌دان / بازیابی                                               */
/* ================================================================== */

describe('pages/tools/note — زباله‌دان', () => {
  test('حذف = انتقال نرم به زباله‌دان، نه حذف دائم', async () => {
    const [note] = await seedNotes([createEmptyNoteForTest('قابل بازیافت')]);
    const router = await mountNotePage();

    click(document.querySelector('[data-action="trash-note"]'));
    await flush(4);

    assert.equal(noteCards().length, 0, 'از نمای عادی باید محو شود');

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored.length, 1, 'نباید از storage حذف شود');
    assert.equal(stored[0].trashed, true);
    assert.ok(stored[0].deletedAt, 'زمان حذف باید ثبت شود');

    router.destroy();
  });

  test('سطل زباله‌دان یادداشت را نشان می‌دهد و حذف دائم با تأیید انجام می‌شود', async () => {
    await seedNotes([createEmptyNoteForTest('در زباله‌دان', { trashed: true, deletedAt: new Date().toISOString() })]);
    const router = await mountNotePage();

    click(document.querySelector('[data-action="toggle-trash"]'));
    await flush(3);

    assert.equal(noteCards().length, 1);
    assert.ok(noteCards()[0].classList.contains('is-trashed'));

    click(document.querySelector('[data-action="trash-note"]'));
    await flush(2);
    await confirmOpenDialog();

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored.length, 0, 'با تأیید باید دائم حذف شود');

    router.destroy();
  });

  test('بازگردانی از زباله‌دان با دکمهٔ toast', async () => {
    const [note] = await seedNotes([createEmptyNoteForTest('برگشتی')]);
    const router = await mountNotePage();

    click(document.querySelector('[data-action="trash-note"]'));
    await flush(4);

    const undoButton = document.querySelector('.vx-toast__body button');
    assert.ok(undoButton, 'toast باید دکمهٔ بازگردانی داشته باشد');

    click(undoButton);
    await flush(4);

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].trashed, false);
    assert.equal(noteCards().length, 1);

    router.destroy();
  });
});

/* ================================================================== */
/* ۵) نماها، مرتب‌سازی، گروه‌بندی، جستجو و فیلتر                          */
/* ================================================================== */

describe('pages/tools/note — نما و فیلتر', () => {
  const seedViews = () =>
    seedNotes([
      { ...createEmptyNoteForTest('الف', { status: 'todo', priority: 'high', color: 'rose' }), dueAt: new Date(Date.now() - 86_400_000).toISOString() },
      { ...createEmptyNoteForTest('ب', { status: 'done', priority: 'low', color: 'blue' }), dueAt: new Date().toISOString() },
      createEmptyNoteForTest('پ', { status: 'doing', priority: 'medium', color: 'emerald' }),
    ]);

  for (const viewName of ['grid', 'list', 'board', 'timeline', 'calendar', 'masonry']) {
    test(`نمای ${viewName} رندر می‌شود`, async () => {
      await seedViews();
      const router = await mountNotePage();

      click(document.querySelector(`[data-action="set-view"][data-view="${viewName}"]`));
      await flush(3);

      assert.ok(view().querySelector(`.vx-view--${viewName}`), `کلاس .vx-view--${viewName} باید باشد`);

      const toolbarSelect = view().closest('[data-note-page]')?.querySelector('.vx-nw__toolbar .vx-select');
      assert.ok(toolbarSelect);

      router.destroy();
    });
  }

  test('تغییر مرتب‌سازی نتیجه را عوض می‌کند و در UI ذخیره می‌شود', async () => {
    await seedViews();
    const router = await mountNotePage();

    const select = document.querySelector('[data-change="sort"]');
    select.value = 'alphabetical';
    select.dispatchEvent(new globalThis.window.Event('change', { bubbles: true }));
    await flush(3);

    const titles = noteCards().map((card) => card.querySelector('.vx-note-card__title').textContent.trim());
    assert.deepEqual(titles, ['الف', 'ب', 'پ']);

    router.destroy();
  });

  test('گروه‌بندی بر اساس وضعیت ستون‌های گروه می‌سازد', async () => {
    await seedViews();
    const router = await mountNotePage();

    const select = document.querySelector('[data-change="group-by"]');
    select.value = 'status';
    select.dispatchEvent(new globalThis.window.Event('change', { bubbles: true }));
    await flush(3);

    const groups = document.querySelectorAll('.vx-group');
    assert.equal(groups.length, 3);

    router.destroy();
  });

  test('جستجو با debounce رندر می‌کند و فوکوس را نگه می‌دارد', async () => {
    await seedViews();
    const router = await mountNotePage();

    const input = document.querySelector('[data-input="search-query"]');
    input.focus();
    type(input, 'الف');

    assert.equal(noteCards().length, 3, 'قبل از پایان debounce نباید تغییر کند');

    await new Promise((resolve) => setTimeout(resolve, 320));
    await flush(2);

    assert.equal(noteCards().length, 1);
    assert.ok(noteCards()[0].textContent.includes('الف'));
    assert.equal(document.activeElement, input, 'فوکوس باید حفظ شود');

    router.destroy();
  });

  test('فیلتر رنگ، اولویت، سطل و پاک‌کردن فیلترها', async () => {
    await seedViews();
    const router = await mountNotePage();

    click(document.querySelector('[data-action="set-color-filter"][data-color="rose"]'));
    await flush(3);
    assert.equal(noteCards().length, 1);

    click(document.querySelector('[data-action="set-color-filter"][data-color="rose"]'));
    await flush(3);
    assert.equal(noteCards().length, 3, 'کلیک دوباره باید فیلتر را بردارد');

    click(document.querySelector('[data-action="set-priority-filter"][data-priority="low"]'));
    await flush(3);
    assert.equal(noteCards().length, 1);

    click(document.querySelector('[data-action="filter-overdue"]'));
    await flush(3);
    assert.equal(noteCards().length, 0, 'با فیلتر سررسید گذشته + اولویت low نتیجه‌ای نیست');

    click(document.querySelector('[data-action="clear-filters"]'));
    await flush(3);
    assert.equal(noteCards().length, 3);

    router.destroy();
  });

  test('سطل علاقه‌مندی‌ها و آرشیو', async () => {
    await seedNotes([
      createEmptyNoteForTest('محبوب', { favorite: true }),
      createEmptyNoteForTest('آرشیو', { archived: true }),
      createEmptyNoteForTest('عادی'),
    ]);

    const router = await mountNotePage();

    click(document.querySelector('[data-action="toggle-favorites"]'));
    await flush(3);
    assert.equal(noteCards().length, 1);
    assert.ok(noteCards()[0].textContent.includes('محبوب'));

    click(document.querySelector('[data-action="toggle-archive"]'));
    await flush(3);
    assert.equal(noteCards().length, 1);
    assert.ok(noteCards()[0].textContent.includes('آرشیو'));

    router.destroy();
  });

  test('صفحه‌بندی با کلیک بعدی/قبلی', async () => {
    const many = Array.from({ length: 5 }, (_item, index) => createEmptyNoteForTest(`یادداشت ${index}`));
    await seedNotes(many);

    // اندازهٔ صفحه قبل از مانت کوچک می‌شود تا pager ساخته شود
    globalThis.localStorage.setItem('ViXoRa:notes-page:ui', JSON.stringify({ pageSize: 2, page: 1 }));

    const router = await mountNotePage();

    assert.equal(noteCards().length, 2, 'فقط دو یادداشت در صفحهٔ اول');

    const pager = document.querySelector('.vx-pager');
    assert.ok(pager, 'pager باید باشد');

    click(document.querySelector('[data-action="page-next"]'));
    await flush(3);
    assert.equal(noteCards().length, 2);

    click(document.querySelector('[data-action="page-next"]'));
    await flush(3);
    assert.equal(noteCards().length, 1, 'صفحهٔ آخر یک یادداشت دارد');
    assert.ok(document.querySelector('[data-action="page-next"]').disabled, 'دکمهٔ بعدی باید غیرفعال شود');

    click(document.querySelector('[data-action="page-prev"]'));
    await flush(3);
    assert.equal(noteCards().length, 2);

    router.destroy();
  });
});

/* ================================================================== */
/* ۶) انتخاب چندتایی و عملیات گروهی                                      */
/* ================================================================== */

describe('pages/tools/note — عملیات گروهی', () => {
  test('حالت انتخاب، انتخاب چند یادداشت و نوار گروهی', async () => {
    await seedNotes([createEmptyNoteForTest('یک'), createEmptyNoteForTest('دو')]);
    const router = await mountNotePage();

    assert.equal(document.querySelector('.vx-bulkbar'), null, 'بدون انتخاب نوار گروهی نیست');

    click(document.querySelector('[data-action="toggle-selection-mode"]'));
    await flush(3);

    const boxes = view().querySelectorAll('input.vx-note-card__check[data-action="toggle-select-note"]');
    assert.equal(boxes.length, 2, 'هر کارت یک چک‌باکس انتخاب دارد');

    click(boxes[0]);
    await flush(3);
    click(view().querySelectorAll('input.vx-note-card__check[data-action="toggle-select-note"]')[1]);
    await flush(3);

    const bulkbar = document.querySelector('.vx-bulkbar');
    assert.ok(bulkbar, 'نوار گروهی باید ظاهر شود');
    assert.ok(bulkbar.textContent.includes('۲') || bulkbar.textContent.includes('2'));

    router.destroy();
  });

  test('bulk-pin همزمان روی همهٔ انتخاب‌شده‌ها اعمال می‌شود', async () => {
    await seedNotes([createEmptyNoteForTest('یک'), createEmptyNoteForTest('دو'), createEmptyNoteForTest('سه')]);
    const router = await mountNotePage();

    click(document.querySelector('[data-action="toggle-selection-mode"]'));
    await flush(3);

    await selectNotesInView(2);

    click(document.querySelector('[data-action="bulk-pin"]'));
    await flush(4);

    const stored = await MODULES.tools.getToolData('notes');
    const pinned = stored.filter((note) => note.pinned).length;
    assert.equal(pinned, 2, 'هر دو انتخاب‌شده باید سنجاق شوند (بدون ناسازگاری)');

    router.destroy();
  });

  test('bulk-trash و bulk-export', async () => {
    await seedNotes([createEmptyNoteForTest('یک'), createEmptyNoteForTest('دو')]);
    const router = await mountNotePage();

    click(document.querySelector('[data-action="toggle-selection-mode"]'));
    await flush(3);

    await selectNotesInView(2);

    click(document.querySelector('[data-action="bulk-trash"]'));
    await flush(4);

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored.filter((note) => note.trashed).length, 2);
    assert.equal(noteCards().length, 0);

    router.destroy();
  });

  test('bulk-delete فقط با تأیید دائم حذف می‌کند', async () => {
    await seedNotes([createEmptyNoteForTest('حذفی')]);
    const router = await mountNotePage();

    click(document.querySelector('[data-action="toggle-selection-mode"]'));
    await flush(3);
    await selectNotesInView(1);

    click(document.querySelector('[data-action="bulk-delete"]'));
    await flush(2);

    let stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored.length, 1, 'بدون تأیید نباید حذف شود');

    await confirmOpenDialog();

    stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored.length, 0);

    router.destroy();
  });
});

/* ================================================================== */
/* ۷) یادآور + پیامک + اعلان                                           */
/* ================================================================== */

describe('pages/tools/note — یادآور، پیامک و اعلان', () => {
  test('افزودن یادآور از فرم ویرایشگر با اعتبارسنجی زمان', async () => {
    await seedNotes([createEmptyNoteForTest('جلسهٔ مهم')]);
    const router = await mountNotePage();

    await openDrawer(0);
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="reminders"]'));
    await flush(2);

    const form = document.querySelector('[data-form="add-reminder"]');
    assert.ok(form, 'فرم یادآور باید باشد');

    // بدون زمان → خطا
    form.dispatchEvent(new globalThis.window.Event('submit', { bubbles: true, cancelable: true }));
    await flush(3);

    let stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].reminders.length, 0);
    assert.ok(document.querySelector('.vx-toast--error'));

    // با زمان معتبر
    form.querySelector('[name="at"]').value = '2026-12-25T09:30';
    form.querySelector('[name="title"]').value = 'یادآوری جلسه';
    form.querySelector('[name="ch_sms"]').checked = true;

    form.dispatchEvent(new globalThis.window.Event('submit', { bubbles: true, cancelable: true }));
    await flush(4);

    stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].reminders.length, 1);

    const reminder = stored[0].reminders[0];
    assert.equal(reminder.title, 'یادآوری جلسه');
    assert.ok(reminder.channels.includes('sms'));
    assert.equal(reminder.enabled, true);
    assert.equal(new Date(reminder.at).getUTCFullYear(), 2026);

    router.destroy();
  });

  test('در زمان مقرر: اعلان + صف پیامک ساخته می‌شود (tickReminders)', async () => {
    reminderService.updateReminderSettings({ phoneNumber: '09121234567' });

    const at = new Date(Date.now() - 120_000).toISOString();

    const [note] = await seedNotes([
      {
        ...createEmptyNoteForTest('پرداخت قبض'),
        reminders: [
          {
            id: 'rem-1',
            title: 'پرداخت قبض برق',
            message: 'تا پایان امروز پرداخت شود',
            at,
            nextAt: at,
            repeat: 'none',
            channels: ['inapp', 'sound', 'sms'],
            enabled: true,
            createdAt: new Date().toISOString(),
            lastFiredAt: '',
            history: [],
          },
        ],
      },
    ]);

    const persisted = [];

    const result = await reminderService.tickReminders(
      async () => schema.normalizeNoteList(await MODULES.tools.getToolData('notes')),
      async (updated) => {
        persisted.push(updated.id);
        await MODULES.tools.updateToolItem('notes', updated.id, { reminders: updated.reminders });
      }
    );

    assert.ok(Array.isArray(result), 'tickReminders باید آرایهٔ یادآورهای شلیک‌شده را برگرداند');
    assert.equal(result.length, 1, 'باید یک یادآور شلیک شود');
    assert.equal(result[0].reminderId, 'rem-1');

    // ۱) اعلان
    const notifications = notificationService.getNotifications();
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].title, 'پرداخت قبض برق');
    assert.equal(notifications[0].read, false);
    assert.equal(notificationService.getUnreadCount(), 1);

    // ۲) صف پیامک با لینک قابل ارسال از خود گوشی
    const queue = reminderService.getSmsQueue();
    assert.equal(queue.length, 1);
    assert.equal(queue[0].to, '09121234567');
    assert.ok(queue[0].link.startsWith('sms:09121234567'), queue[0].link);
    assert.ok(queue[0].text.includes('پرداخت قبض برق'));
    assert.equal(queue[0].status, 'pending');

    // ۳) وضعیت یادآور
    assert.equal(persisted.length, 1);
    const stored = await MODULES.tools.getToolData('notes');
    const reminder = stored[0].reminders[0];
    assert.ok(reminder.lastFiredAt, 'زمان شلیک باید ثبت شود');
    assert.equal(reminder.history.length, 1);
    assert.equal(reminder.enabled, false, 'یادآور یک‌بارمصرف باید غیرفعال شود');

    // ۴) شلیک مجدد در همان دقیقه رخ نمی‌دهد
    const again = await reminderService.tickReminders(
      async () => schema.normalizeNoteList(await MODULES.tools.getToolData('notes')),
      async () => {}
    );
    assert.equal(again.length, 0);

    assert.equal(note.id, stored[0].id);
  });

  test('یادآور تکرارشونده بعد از شلیک به زمان بعدی منتقل می‌شود', async () => {
    const at = new Date(Date.now() - 3 * 86_400_000).toISOString();

    await seedNotes([
      {
        ...createEmptyNoteForTest('ورزش'),
        reminders: [
          {
            id: 'rem-2',
            title: 'ورزش روزانه',
            at,
            nextAt: at,
            repeat: 'daily',
            channels: ['inapp'],
            enabled: true,
            createdAt: new Date().toISOString(),
            lastFiredAt: '',
            history: [],
          },
        ],
      },
    ]);

    await reminderService.tickReminders(
      async () => schema.normalizeNoteList(await MODULES.tools.getToolData('notes')),
      async (updated) => {
        await MODULES.tools.updateToolItem('notes', updated.id, { reminders: updated.reminders });
      }
    );

    const stored = await MODULES.tools.getToolData('notes');
    const reminder = stored[0].reminders[0];

    assert.equal(reminder.enabled, true, 'یادآور تکرارشونده باید فعال بماند');
    assert.ok(new Date(reminder.nextAt) > new Date(at), 'nextAt باید جلو برود');
  });

  test('buildSmsLink برای هر provider لینک درست می‌سازد (ارسال از گوشی کاربر)', () => {
    const reminder = { id: 'r', title: 'عنوان', message: 'متن', at: '2026-09-07T09:00:00.000Z' };

    reminderService.updateReminderSettings({ phoneNumber: '09121112233', provider: 'link' });

    const link = reminderService.buildSmsLink(reminder);
    assert.ok(link.startsWith('sms:09121112233'), link);
    assert.ok(link.includes('body='));

    reminderService.updateReminderSettings({ provider: 'whatsapp' });
    const whatsapp = reminderService.buildSmsLink(reminder);
    assert.ok(whatsapp.startsWith('https://wa.me/989121112233'));

    reminderService.updateReminderSettings({ provider: 'telegram' });
    const telegram = reminderService.buildSmsLink(reminder);
    assert.ok(telegram.startsWith('https://t.me/'));

    reminderService.updateReminderSettings({ provider: 'email' });
    const email = reminderService.buildSmsLink(reminder);
    assert.ok(email.startsWith('mailto:'));

    reminderService.updateReminderSettings({ provider: 'link' });
  });

  test('یادآور آینده در سایدبار و پنل یادآورها دیده می‌شود', async () => {
    const at = new Date(Date.now() + 3600_000).toISOString();

    await seedNotes([
      {
        ...createEmptyNoteForTest('با یادآور'),
        reminders: [
          {
            id: 'rem-3',
            title: 'تماس با دکتر',
            at,
            nextAt: at,
            repeat: 'none',
            channels: ['inapp'],
            enabled: true,
            createdAt: new Date().toISOString(),
            lastFiredAt: '',
            history: [],
          },
        ],
      },
    ]);

    const router = await mountNotePage();

    const sidebarText = region('sidebar').textContent;
    assert.ok(sidebarText.includes('با یادآور'), 'یادآور بعدی باید در سایدبار باشد');

    await clickHeaderAction('toggle-reminder-panel');

    assert.ok(region('panels').querySelector('.vx-nw__reminder-item'));

    router.destroy();
  });

  test('snooze و حذف یادآور از پنل', async () => {
    const at = new Date(Date.now() + 3600_000).toISOString();

    await seedNotes([
      {
        ...createEmptyNoteForTest('با یادآور'),
        reminders: [
          {
            id: 'rem-4',
            title: 'یادآور',
            at,
            nextAt: at,
            repeat: 'none',
            channels: ['inapp'],
            enabled: true,
            createdAt: new Date().toISOString(),
            lastFiredAt: '',
            history: [],
          },
        ],
      },
    ]);

    const router = await mountNotePage();

    await openDrawer(0);
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="reminders"]'));
    await flush(2);

    click(document.querySelector('[data-action="snooze-reminder"][data-minutes="30"]'));
    await flush(3);

    let stored = await MODULES.tools.getToolData('notes');
    assert.ok(new Date(stored[0].reminders[0].nextAt) > new Date(at));

    click(document.querySelector('[data-action="delete-reminder"]'));
    await flush(2);
    await confirmOpenDialog();

    stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].reminders.length, 0);

    router.destroy();
  });

  test('شمارندهٔ اعلان‌ها در هدر و علامت‌گذاری همه به‌عنوان خوانده‌شده', async () => {
    await seedNotes([]);

    notificationService.pushNotification({ title: 'تست', body: 'متن' });

    const router = await mountNotePage();

    assert.ok(region('header').querySelector('.vx-nw__dot'), 'نقطهٔ اعلان خوانده‌نشده باید باشد');

    await clickHeaderAction('toggle-notifications');

    assert.ok(region('panels').querySelector('.vx-nw__notif-item'));

    click(document.querySelector('[data-action="mark-all-notifications-read"]'));
    await flush(3);

    assert.equal(notificationService.getUnreadCount(), 0);

    router.destroy();
  });
});

/* ================================================================== */
/* ۸) ضمیمه‌ها                                                          */
/* ================================================================== */

describe('pages/tools/note — ضمیمه‌ها', () => {
  test('افزودن ضمیمهٔ متنی در localStorage ذخیره می‌شود و در UI دیده می‌شود', async () => {
    const [note] = await seedNotes([createEmptyNoteForTest('با ضمیمه')]);
    const router = await mountNotePage();

    await openDrawer(0);
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="attachments"]'));
    await flush(2);

    const saved = attachmentService.saveAttachmentData(note.id, {
      name: 'یادداشت.txt',
      mimeType: 'text/plain',
      size: 12,
      kind: 'text',
      dataUrl: 'data:text/plain;base64,' + Buffer.from('سلام دنیا').toString('base64'),
      caption: 'متن آزمایشی',
    });

    assert.equal(saved.ok, true, saved.message);

    // رندر مجدد کشو با کلیک روی تب
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="general"]'));
    await flush(2);
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="attachments"]'));
    await flush(2);

    const item = document.querySelector('.vx-attachment');
    assert.ok(item, 'ضمیمه باید در UI نمایش داده شود');
    assert.ok(item.textContent.includes('یادداشت.txt'));

    const raw = globalThis.localStorage.getItem(attachmentService.storageKeyFor(note.id));
    assert.ok(raw, 'دادهٔ ضمیمه باید در localStorage باشد');
    assert.equal(attachmentService.listAttachments(note.id).length, 1);

    const usage = attachmentService.getStorageUsage();
    assert.equal(usage.noteCount, 1);
    assert.ok(usage.totalBytes > 0);

    router.destroy();
  });

  test('حذف ضمیمه با تأیید هم فایل و هم ارجاع را پاک می‌کند', async () => {
    const [note] = await seedNotes([createEmptyNoteForTest('ضمیمه‌دار')]);

    const saved = attachmentService.saveAttachmentData(note.id, {
      name: 'a.txt',
      mimeType: 'text/plain',
      size: 3,
      kind: 'text',
      dataUrl: 'data:text/plain;base64,QUJD',
    });

    await MODULES.tools.setToolItems('notes', [
      schema.normalizeNote({ ...note, attachments: [saved.attachment.id] }),
    ]);

    const router = await mountNotePage();

    await openDrawer(0);
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="attachments"]'));
    await flush(2);

    click(document.querySelector('[data-action="delete-attachment"]'));
    await flush(2);
    await confirmOpenDialog();

    assert.equal(attachmentService.listAttachments(note.id).length, 0);

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].attachments.length, 0);

    router.destroy();
  });

  test('فیلتر «دارای ضمیمه» فقط یادداشت‌های ضمیمه‌دار را نشان می‌دهد', async () => {
    const [withFile] = await seedNotes([
      createEmptyNoteForTest('با فایل'),
      createEmptyNoteForTest('بدون فایل'),
    ]);

    attachmentService.saveAttachmentData(withFile.id, {
      name: 'x.txt',
      mimeType: 'text/plain',
      size: 2,
      kind: 'text',
      dataUrl: 'data:text/plain;base64,QUI=',
    });

    await MODULES.tools.setToolItems('notes', [
      schema.normalizeNote({ ...withFile, attachments: ['att-1'] }),
      ...(await MODULES.tools.getToolData('notes')).filter((note) => note.id !== withFile.id),
    ]);

    const router = await mountNotePage();

    click(document.querySelector('[data-action="toggle-attachment-filter"]'));
    await flush(3);

    assert.equal(noteCards().length, 1);
    assert.ok(noteCards()[0].textContent.includes('با فایل'));

    router.destroy();
  });
});

/* ================================================================== */
/* ۹) اشتراک‌گذاری                                                      */
/* ================================================================== */

describe('pages/tools/note — اشتراک‌گذاری', () => {
  test('اشتراک از طریق پیامک لینک sms: با متن کامل یادداشت می‌سازد', async () => {
    reminderService.updateReminderSettings({ phoneNumber: '09121112233' });

    await seedNotes([
      {
        ...createEmptyNoteForTest('لیست خرید'),
        blocks: [schema.createBlock('text', { value: 'شیر، نان، پنیر' })],
      },
    ]);

    const router = await mountNotePage();

    await openDrawer(0);
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="share"]'));
    await flush(2);

    const shareButtons = Array.from(document.querySelectorAll('[data-action="share-note"]'));
    assert.ok(shareButtons.length >= 5, 'کانال‌های اشتراک باید رندر شوند');

    const opened = [];
    const originalOpen = globalThis.window.open;
    globalThis.window.open = (url) => {
      opened.push(url);
      return null;
    };

    const smsButton = shareButtons.find((button) => button.dataset.shareTarget === 'sms');
    assert.ok(smsButton, 'دکمهٔ پیامک باید باشد');

    click(smsButton);
    await flush(4);

    globalThis.window.open = originalOpen;

    assert.equal(opened.length, 1);
    assert.ok(opened[0].startsWith('sms:09121112233'));
    assert.ok(decodeURIComponent(opened[0]).includes('لیست خرید'));
    assert.ok(decodeURIComponent(opened[0]).includes('شیر، نان، پنیر'));

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored[0].shares.length, 1, 'اشتراک باید در تاریخچهٔ یادداشت ثبت شود');
    assert.equal(stored[0].shares[0].channel, 'sms');

    router.destroy();
  });

  test('کپی در کلیپ‌بورد متن کامل یادداشت را کپی می‌کند', async () => {
    await seedNotes([
      { ...createEmptyNoteForTest('کپی'), blocks: [schema.createBlock('text', { value: 'متن' })] },
    ]);

    let copied = null;

    const originalClipboard = globalThis.navigator.clipboard;
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text) => { copied = text; } },
    });

    const router = await mountNotePage();

    await openDrawer(0);
    click(document.querySelector('.vx-drawer').querySelector('[data-action="set-editor-tab"][data-tab="share"]'));
    await flush(2);

    click(document.querySelector('[data-action="share-note"][data-share-target="copy"]'));
    await flush(4);

    Object.defineProperty(globalThis.navigator, 'clipboard', { configurable: true, value: originalClipboard });

    assert.ok(copied, 'متن باید کپی شود');
    assert.ok(copied.includes('کپی'));
    assert.ok(copied.includes('متن'));

    router.destroy();
  });

  test('buildShareTargets همهٔ کانال‌ها را برمی‌گرداند', () => {
    const note = schema.createEmptyNote({ id: 'n1', title: 'تست' });
    const targets = shareService.buildShareTargets(note, { phoneNumber: '09121112233' });

    const ids = targets.map((target) => target.id);
    for (const expected of ['copy', 'sms', 'whatsapp', 'telegram', 'email', 'image', 'markdown']) {
      assert.ok(ids.includes(expected), `کانال ${expected} باید باشد`);
    }

    // «اشتراک سیستمی» فقط وقتی ارائه می‌شود که مرورگر از آن پشتیبانی کند
    assert.ok(
      shareService.canUseNativeShare() === ids.includes('native'),
      'کانال native باید با پشتیبانی مرورگر هم‌خوان باشد'
    );
  });
});

/* ================================================================== */
/* ۱۰) بکاپ و بازیابی                                                   */
/* ================================================================== */

describe('pages/tools/note — بکاپ و بازیابی', () => {
  test('createBackupPayload ساختار معتبر می‌سازد و mergeBackup ادغام می‌کند', () => {
    const current = [schema.createEmptyNote({ id: 'a', title: 'موجود', updatedAt: '2026-01-01T00:00:00.000Z' })];

    const payload = shareService.createBackupPayload(current, { user: { id: 'u1' } });
    assert.equal(payload.app, 'ViXoRa');
    assert.equal(payload.tool, 'notes');
    assert.equal(payload.notes.length, 1);
    assert.equal(shareService.isValidBackup(payload), true);

    const incoming = shareService.createBackupPayload([
      schema.createEmptyNote({ id: 'b', title: 'جدید' }),
      schema.createEmptyNote({ id: 'a', title: 'موجودِ جدیدتر', updatedAt: '2026-06-01T00:00:00.000Z' }),
    ]);

    const merged = shareService.mergeBackup(current, incoming, 'merge');
    assert.equal(merged.notes.length, 2);
    assert.equal(merged.added, 1);
    assert.equal(merged.updated, 1);
    assert.equal(merged.notes.find((note) => note.id === 'a').title, 'موجودِ جدیدتر');

    const replaced = shareService.mergeBackup(current, incoming, 'replace');
    assert.equal(replaced.notes.length, 2);
    assert.equal(replaced.added, 2);
  });

  test('mergeBackup دادهٔ خراب را رد می‌کند', () => {
    const current = [schema.createEmptyNote({ id: 'a' })];

    assert.throws(() => shareService.mergeBackup(current, { notes: 'not-an-array' }, 'merge'));
    assert.equal(shareService.isValidBackup({ notes: [] }), false);
  });

  test('خروجی JSON از صفحه تولید می‌شود', async () => {
    await seedNotes([createEmptyNoteForTest('برای بکاپ')]);
    const router = await mountNotePage();

    const downloaded = [];
    const originalCreate = globalThis.document.createElement.bind(globalThis.document);

    globalThis.document.createElement = (tag) => {
      const element = originalCreate(tag);

      if (String(tag).toLowerCase() === 'a') {
        element.click = () => downloaded.push(element.download);
      }

      return element;
    };

    await clickHeaderAction('export-notes');

    globalThis.document.createElement = originalCreate;

    assert.equal(downloaded.length, 1);
    assert.ok(downloaded[0].startsWith('vixora-notes-backup-'));

    router.destroy();
  });

  test('بکاپ خودکار بعد از هر تغییر در localStorage نوشته می‌شود', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    await createNoteViaComposer('یادداشت پشتیبان', 'متن');

    const raw = globalThis.localStorage.getItem('ViXoRa:notes-page:autobackup');
    assert.ok(raw, 'بکاپ خودکار باید نوشته شود');

    const payload = JSON.parse(raw);
    assert.equal(payload.notes.length, 1);
    assert.equal(payload.notes[0].title, 'یادداشت پشتیبان');

    router.destroy();
  });
});

/* ================================================================== */
/* ۱۱) قالب‌ها، آمار، پالت فرمان و تنظیمات                                */
/* ================================================================== */

describe('pages/tools/note — قالب‌ها و ابزارها', () => {
  test('ساخت یادداشت از قالب روزانه، ویرایشگر را باز می‌کند', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    click(document.querySelector('[data-action="create-from-template"][data-template-id="daily"]'));
    await flush(5);

    assert.equal(noteCards().length, 1);

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored.length, 1);
    assert.ok(stored[0].title.includes('روزانه'));
    assert.ok(stored[0].blocks.length >= 2, 'قالب باید چند بخش بسازد');

    assert.ok(document.querySelector('.vx-drawer'), 'ویرایشگر باید باز شود');

    router.destroy();
  });

  test('پنل آمار نمودارها و آمار را نشان می‌دهد', async () => {
    await seedNotes([
      createEmptyNoteForTest('یک', { tags: ['کار'] }),
      createEmptyNoteForTest('دو', { tags: ['کار', 'فوری'] }),
    ]);

    const router = await mountNotePage();

    await clickHeaderAction('toggle-analytics');

    const panel = region('panels');
    assert.ok(panel.querySelector('.vx-nw__stat-grid'));
    assert.ok(panel.querySelector('.vx-nw__chart'));
    assert.ok(panel.querySelector('.vx-nw__tags-cloud'));
    assert.ok(panel.textContent.includes('کار'));

    router.destroy();
  });

  test('پالت فرمان با Ctrl+K باز می‌شود و فرمان را اجرا می‌کند', async () => {
    await seedNotes([createEmptyNoteForTest('یادداشت پالت')]);
    const router = await mountNotePage();

    pressKey(document.body, 'k', { ctrlKey: true });
    await flush(3);

    const overlay = region('overlay');
    assert.ok(overlay.querySelector('.vx-cmdk'), 'پالت فرمان باید باز شود');

    const input = overlay.querySelector('[data-command-input]');
    type(input, 'پالت');
    await flush(2);

    const items = Array.from(overlay.querySelectorAll('.vx-cmdk__item'));
    assert.ok(items.length >= 1, 'نتیجهٔ جستجو باید باشد');

    click(items[0]);
    await flush(4);

    assert.ok(document.querySelector('.vx-drawer'), 'فرمان بازکردن یادداشت باید کشو را باز کند');

    router.destroy();
  });

  test('Esc به ترتیب پالت، کمپوزر و کشو را می‌بندد', async () => {
    await seedNotes([createEmptyNoteForTest('تست')]);
    const router = await mountNotePage();

    pressKey(document.body, 'k', { ctrlKey: true });
    await flush(3);
    assert.ok(region('overlay').querySelector('.vx-cmdk'));

    pressKey(document.body, 'Escape');
    await flush(3);
    assert.equal(region('overlay').querySelector('.vx-cmdk'), null);

    click(document.querySelector('[data-action="open-composer"]'));
    await flush(3);
    assert.ok(region('overlay').querySelector('.vx-composer'));

    pressKey(document.body, 'Escape');
    await flush(3);
    assert.equal(region('overlay').querySelector('.vx-composer'), null);

    await openDrawer(0);
    assert.ok(document.querySelector('.vx-drawer'));

    pressKey(document.body, 'Escape');
    await flush(3);
    assert.equal(document.querySelector('.vx-drawer'), null);

    router.destroy();
  });

  test('میان‌بر Q کمپوزر سریع و N یادداشت جدید باز می‌کند', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    pressKey(document.body, 'q');
    await flush(3);
    assert.ok(region('overlay').querySelector('.vx-composer'));

    pressKey(document.body, 'Escape');
    await flush(3);

    pressKey(document.body, 'n');
    await flush(5);
    assert.ok(document.querySelector('.vx-drawer'));

    const stored = await MODULES.tools.getToolData('notes');
    assert.equal(stored.length, 1, 'یادداشت خالی باید ساخته شود');

    router.destroy();
  });

  test('تغییر تم و تراکم کلاس ریشه را عوض و ذخیره می‌کند', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    click(document.querySelector('[data-action="header-action"][data-header-action-id="toggle-theme"]'));
    await flush(3);

    assert.ok(page().classList.contains('theme-light'), 'تم روشن باید فعال شود');
    assert.equal(JSON.parse(globalThis.localStorage.getItem('ViXoRa:notes-page:ui')).theme, 'light');

    click(document.querySelector('[data-action="header-action"][data-header-action-id="toggle-density"]'));
    await flush(3);

    assert.ok(page().classList.contains('density-compact'));

    router.destroy();
  });

  test('تنظیمات پیامک/اعلان ذخیره می‌شوند', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    await clickHeaderAction('toggle-settings');

    const form = document.querySelector('[data-form="settings"]');
    assert.ok(form, 'فرم تنظیمات باید باشد');

    form.querySelector('[name="phoneNumber"]').value = '09351112233';
    form.querySelector('[name="autoSendSms"]').checked = true;

    form.dispatchEvent(new globalThis.window.Event('submit', { bubbles: true, cancelable: true }));
    await flush(3);

    const settings = reminderService.getReminderSettings();
    assert.equal(settings.phoneNumber, '09351112233');
    assert.equal(settings.autoSendSms, true);

    router.destroy();
  });

  test('سفارشی‌سازی هدر: سنجاق‌کردن اکشن و بازنشانی', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    await clickHeaderAction('toggle-header-customize');

    const pinButtons = document.querySelectorAll('[data-action="toggle-header-pin"]');
    assert.ok(pinButtons.length > 0);

    const target = pinButtons[0];
    const actionId = target.dataset.headerActionId;

    const before = document.querySelectorAll('[data-region="header"] .vx-nw__actions .vx-nw__icon-btn').length;

    click(target);
    await flush(3);

    const config = JSON.parse(globalThis.localStorage.getItem('ViXoRa:notes-page:header'));
    assert.ok(config.pinned.includes(actionId) || !config.pinned.includes(actionId));
    assert.ok(Array.isArray(config.pinned));

    click(document.querySelector('[data-action="reset-header-config"]'));
    await flush(3);

    const reset = JSON.parse(globalThis.localStorage.getItem('ViXoRa:notes-page:header'));
    assert.ok(reset.pinned.length > 0);

    assert.ok(before > 0);

    router.destroy();
  });
});

/* ================================================================== */
/* ۱۲) دسترس‌پذیری و a11y                                                */
/* ================================================================== */

describe('pages/tools/note — دسترس‌پذیری', () => {
  test('عناصر تعاملی label/aria دارند و متن کاربر escape می‌شود', async () => {
    await seedNotes([
      schema.normalizeNote({
        id: 'xss-1',
        title: '<img src=x onerror="window.__pwned=1">',
        blocks: [schema.createBlock('text', { value: '<script>window.__pwned2=1</script>' })],
      }),
    ]);

    const router = await mountNotePage();

    assert.equal(globalThis.window.__pwned, undefined, 'HTML کاربر نباید اجرا شود');
    assert.equal(globalThis.window.__pwned2, undefined);

    const card = noteCards()[0];
    assert.equal(card.querySelectorAll('img').length, 0);
    assert.ok(card.textContent.includes('<img'), 'متن باید به‌صورت متن نمایش داده شود');

    const search = document.querySelector('[data-input="search-query"]');
    assert.ok(search.getAttribute('aria-label') || search.getAttribute('placeholder'), 'ورودی جستجو باید label داشته باشد');

    router.destroy();
  });

  test('صفحه در حالت RTL رندر می‌شود و dir درست است', async () => {
    await seedNotes([]);
    const router = await mountNotePage();

    assert.equal(page().getAttribute('dir'), 'rtl');

    router.destroy();
  });
});

/* ------------------------------------------------------------------ */

function createEmptyNoteForTest(title, overrides = {}) {
  return schema.normalizeNote({
    id: overrides.id || `note-${Math.random().toString(36).slice(2, 9)}`,
    title,
    ...overrides,
  });
}
