// tests/ui-kit.test.js

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

import { setupDom, click, flush } from './helpers/jsdom-setup.js';

before(() => {
  setupDom({ url: 'http://localhost:5173/tools/note' });
});

describe('utilities/toast', async () => {
  const { createToast } = await import('../src/utilities/toast.js');

  test('shows a toast and injects its stylesheet once', () => {
    const toaster = createToast();

    toaster.success('ذخیره شد');
    toaster.error('خطا رخ داد');

    const root = document.querySelector('.vx-toast-root');
    assert.ok(root, 'toast root must be appended to body');
    assert.equal(root.children.length, 2);
    assert.equal(document.querySelectorAll('#vixora-style-toast').length, 1);

    assert.equal(root.children[0].classList.contains('vx-toast--success'), true);
    assert.equal(root.children[0].getAttribute('role'), 'status');
    assert.equal(root.children[1].getAttribute('role'), 'alert');

    toaster.destroy();
    assert.equal(document.querySelector('.vx-toast-root'), null);
  });

  test('HTML in the message is escaped (no XSS)', () => {
    const toaster = createToast();

    toaster.show('<img src=x onerror="window.__pwned=1">', 'info', { duration: 0 });

    const root = document.querySelector('.vx-toast-root');
    assert.equal(root.querySelector('img'), null, 'raw HTML must not be parsed');
    assert.match(root.textContent, /onerror/);
    assert.equal(globalThis.window.__pwned, undefined);

    toaster.destroy();
  });

  test('close button dismisses the toast', async () => {
    const toaster = createToast();

    toaster.info('بستن دستی', { duration: 0 });

    const closeButton = document.querySelector('.vx-toast__close');
    assert.ok(closeButton);

    click(closeButton);

    // انیمیشن خروج + fallback حذف
    await new Promise((resolve) => setTimeout(resolve, 400));

    assert.equal(document.querySelectorAll('.vx-toast').length, 0);

    toaster.destroy();
  });

  test('maxVisible evicts the oldest toast', async () => {
    const toaster = createToast({ maxVisible: 2 });

    toaster.info('۱', { duration: 0 });
    toaster.info('۲', { duration: 0 });
    toaster.info('۳', { duration: 0 });

    await new Promise((resolve) => setTimeout(resolve, 400));

    assert.ok(document.querySelectorAll('.vx-toast').length <= 2);

    toaster.destroy();
  });

  test('action button runs its handler', async () => {
    const toaster = createToast();
    let called = 0;

    toaster.info('بازگردانی', {
      duration: 0,
      action: {
        label: 'Undo',
        onClick: () => {
          called += 1;
        },
      },
    });

    const actionButton = document.querySelector('.vx-toast__body .vx-toast__close');
    assert.ok(actionButton, 'action button must render inside the body');

    click(actionButton);
    await flush();

    assert.equal(called, 1);

    toaster.destroy();
  });
});

describe('utilities/modal', async () => {
  const { createModal, confirmDialog } = await import('../src/utilities/modal.js');

  test('opens with title/body and closes on the close button', async () => {
    let closedWith = null;

    const modal = createModal({
      title: 'ویرایش',
      bodyHtml: '<p class="body-text">سلام</p>',
      onClose: (reason) => {
        closedWith = reason;
      },
    });

    modal.open();

    assert.equal(modal.isOpen, true);
    assert.equal(document.querySelector('.vx-modal__title').textContent, 'ویرایش');
    assert.equal(document.querySelector('.body-text').textContent, 'سلام');
    assert.equal(document.documentElement.classList.contains('vx-modal-open'), true);

    click(document.querySelector('.vx-modal__close'));
    await new Promise((resolve) => setTimeout(resolve, 250));

    assert.equal(modal.isOpen, false);
    assert.equal(closedWith, 'dismiss');
    assert.equal(document.querySelector('.vx-modal'), null);
    assert.equal(document.documentElement.classList.contains('vx-modal-open'), false);
  });

  test('action buttons resolve with their id', async () => {
    let result = null;

    const modal = createModal({
      title: 'تأیید',
      bodyHtml: '<p>مطمئنی؟</p>',
      onClose: (reason) => {
        result = reason;
      },
      actions: [
        { id: 'cancel', label: 'انصراف' },
        { id: 'confirm', label: 'تأیید', variant: 'primary' },
      ],
    });

    modal.open();

    const buttons = Array.from(document.querySelectorAll('.vx-modal__btn'));
    assert.deepEqual(
      buttons.map((button) => button.dataset.actionId),
      ['cancel', 'confirm']
    );

    click(buttons[1]);
    await new Promise((resolve) => setTimeout(resolve, 250));

    assert.equal(result, 'confirm');
  });

  test('Escape closes the modal', async () => {
    const modal = createModal({ title: 'Esc', bodyHtml: '<p>x</p>' });
    modal.open();

    document.dispatchEvent(new globalThis.window.KeyboardEvent('keydown', { key: 'Escape' }));
    await new Promise((resolve) => setTimeout(resolve, 250));

    assert.equal(modal.isOpen, false);
  });

  test('confirmDialog resolves true on confirm and false on dismiss', async () => {
    const pendingConfirm = confirmDialog({ title: 'حذف', message: 'حذف شود؟' });

    await flush(2);

    const confirmButton = Array.from(document.querySelectorAll('.vx-modal__btn')).find(
      (button) => button.dataset.actionId === 'confirm'
    );

    click(confirmButton);

    assert.equal(await pendingConfirm, true);

    const pendingDismiss = confirmDialog({ title: 'حذف', message: 'حذف شود؟' });

    await flush(2);

    click(document.querySelector('.vx-modal__close'));

    assert.equal(await pendingDismiss, false);
  });

  test('body HTML is inserted as markup, message text is escaped', async () => {
    const { alertDialog } = await import('../src/utilities/modal.js');

    const pending = alertDialog({
      title: 'هشدار',
      message: '<script>window.__bad = 1</script>متن',
    });

    await flush(2);

    assert.equal(document.querySelector('.vx-modal__body script'), null);
    assert.equal(globalThis.window.__bad, undefined);

    click(Array.from(document.querySelectorAll('.vx-modal__btn'))[0]);
    await pending;
  });
});

describe('utilities/tool-page', async () => {
  const {
    loadingStateTemplate,
    emptyStateTemplate,
    errorStateTemplate,
    filterItems,
    sortItems,
    paginateItems,
  } = await import('../src/utilities/tool-page.js');

  test('templates render valid markup and escape input', () => {
    const loading = document.createElement('div');
    loading.innerHTML = loadingStateTemplate(3);
    assert.equal(loading.querySelectorAll('.vx-skeleton-card').length, 3);

    const empty = document.createElement('div');
    empty.innerHTML = emptyStateTemplate({ title: 'خالی', actionLabel: 'افزودن' });
    assert.equal(empty.querySelector('[data-empty-action]').textContent, 'افزودن');

    const error = document.createElement('div');
    error.innerHTML = errorStateTemplate({ message: '<b>x</b>' });
    assert.equal(error.querySelector('b'), null, 'error message must be escaped');
    assert.match(error.textContent, /<b>x<\/b>/);
  });

  test('filterItems searches across fields, including nested paths', () => {
    const items = [
      { name: 'علی', meta: { city: 'تهران' } },
      { name: 'زهرا', meta: { city: 'شیراز' } },
    ];

    assert.equal(filterItems(items, 'علی', { fields: ['name'] }).length, 1);
    assert.equal(filterItems(items, 'شیراز', { fields: ['meta.city'] }).length, 1);
    assert.equal(filterItems(items, '', { fields: ['name'] }).length, 2);
    assert.equal(filterItems(items, 'تهران', { matcher: (item, q) => item.meta.city.includes(q) }).length, 1);
    assert.deepEqual(filterItems(null, 'x'), []);
  });

  test('sortItems respects direction and custom getters', () => {
    const items = [
      { id: 1, title: 'ب', createdAt: '2026-01-01' },
      { id: 2, title: 'الف', createdAt: '2026-03-01' },
      { id: 3, title: 'پ', createdAt: '2026-02-01' },
    ];

    assert.deepEqual(
      sortItems(items, 'createdAt', 'desc').map((item) => item.id),
      [2, 3, 1]
    );

    assert.deepEqual(
      sortItems(items, 'createdAt', 'asc').map((item) => item.id),
      [1, 3, 2]
    );

    const sorted = sortItems(items, 'custom', 'asc', {
      getters: { custom: (item) => item.title },
    });

    assert.equal(sorted.length, 3);
    assert.deepEqual(sortItems(null, 'x'), []);
  });

  test('paginateItems clamps the page number', () => {
    const items = Array.from({ length: 25 }, (_item, index) => ({ id: index }));

    const first = paginateItems(items, 1, 10);
    assert.equal(first.pageItems.length, 10);
    assert.equal(first.totalPages, 3);

    const last = paginateItems(items, 99, 10);
    assert.equal(last.currentPage, 3);
    assert.equal(last.pageItems.length, 5);

    const invalid = paginateItems(items, 0, 0);
    assert.equal(invalid.pageItems.length, 25);
  });
});

describe('utilities/tool-page data controller (end-to-end on localStorage)', async () => {
  const { createToolDataController } = await import('../src/utilities/tool-page.js');
  const auth = await import('../src/core/services/auth-service.js');
  const { initializeAppState, getAppState } = await import('../src/core/state/app-state.js');

  before(async () => {
    initializeAppState();
    await auth.login('alirh', 'ali12345');
  });

  test('load → create → update → remove keeps UI state in sync', async () => {
    const snapshots = [];

    const controller = createToolDataController({
      toolName: 'todos',
      onChange: (items, meta) => snapshots.push({ count: items.length, ...meta }),
    });

    await controller.load();
    assert.equal(controller.getItems().length, 0);
    assert.equal(controller.isLoading, false);
    assert.equal(snapshots.at(-1).isLoading, false);

    const created = await controller.create({ title: 'کار اول' }, { successMessage: null });
    assert.equal(controller.getItems().length, 1);
    assert.equal(created.id.startsWith('todos-'), true);

    await controller.update(created.id, { title: 'کار ویرایش‌شده' }, { successMessage: null });
    assert.equal(controller.getItemById(created.id).title, 'کار ویرایش‌شده');

    await controller.remove(created.id, { successMessage: null });
    assert.equal(controller.getItems().length, 0);

    // state سراسری هم همگام است
    assert.equal(getAppState().auth.user.tools.todos.length, 0);
  });

  test('load reports errors instead of throwing', async () => {
    const { clearAuthUser } = await import('../src/core/state/app-state.js');
    clearAuthUser();

    const controller = createToolDataController({ toolName: 'todos' });

    await controller.load();

    assert.match(controller.error, /No authenticated user/);
  });
});
