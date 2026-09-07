// tests/router.test.js

import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { setupDom, getAppRoot, setPathname, click, flush } from './helpers/jsdom-setup.js';

before(() => {
  setupDom({ url: 'http://localhost:5173/' });
});

const lifecycleLog = [];

function createTestLayout({ key = 'test-layout' } = {}) {
  function createLayout() {
    let outlet = null;

    function render() {
      return `
        <div class="test-layout">
          <header class="test-header">Header</header>
          <main class="test-outlet" data-router-outlet></main>
        </div>
      `;
    }

    function afterRender() {
      outlet = document.querySelector('.test-outlet');
      lifecycleLog.push('layout:afterRender');
    }

    function getOutlet() {
      return outlet;
    }

    function destroy() {
      lifecycleLog.push('layout:destroy');
      outlet = null;
    }

    return { render, afterRender, getOutlet, destroy };
  }

  Object.defineProperty(createLayout, 'name', { value: key });

  return createLayout;
}

function createTestPage(name, { html = null, onAfterRender = null } = {}) {
  return function testPageFactory(ctx) {
    lifecycleLog.push(`page:${name}:create`);

    return {
      render() {
        lifecycleLog.push(`page:${name}:render`);
        return (
          html ??
          `<section class="page-${name}" data-ctx-path="${ctx?.path ?? ''}" data-ctx-param="${ctx?.params?.id ?? ''}">${name}</section>`
        );
      },
      afterRender() {
        lifecycleLog.push(`page:${name}:afterRender`);
        if (typeof onAfterRender === 'function') onAfterRender();
      },
      destroy() {
        lifecycleLog.push(`page:${name}:destroy`);
      },
    };
  };
}

function createRoutes() {
  return [
    {
      path: '/',
      layout: createTestLayout({ key: 'layout-a' }),
      layoutKey: 'layout-a',
      component: createTestPage('home'),
      meta: { title: 'خانه' },
    },
    {
      path: '/tools/note',
      layout: createTestLayout({ key: 'layout-a' }),
      layoutKey: 'layout-a',
      component: createTestPage('note'),
      style: () => '.page-note{color:red}',
      meta: { title: 'یادداشت' },
    },
    {
      path: '/tools/note/:id',
      layout: createTestLayout({ key: 'layout-a' }),
      layoutKey: 'layout-a',
      component: createTestPage('note-detail'),
      meta: { title: (ctx) => `یادداشت ${ctx.params.id}` },
    },
    {
      path: '/admin',
      layout: createTestLayout({ key: 'layout-b' }),
      layoutKey: 'layout-b',
      component: createTestPage('admin'),
      meta: { requiresAuth: true, title: 'ادمین' },
    },
    {
      path: '/private',
      component: createTestPage('private'),
      meta: { roles: ['admin'], title: 'خصوصی' },
    },
    {
      path: '/broken',
      component: () => ({
        render() {
          throw new Error('boom');
        },
      }),
      meta: { title: 'خراب' },
    },
  ];
}

async function buildRouter({ getState = () => ({ auth: { status: 'guest', user: null } }) } = {}) {
  const { createRouter } = await import('../src/core/router/router.js');
  const { createAuthGuard } = await import('../src/core/guards/auth.guard.js');
  const { createRoleGuard } = await import('../src/core/guards/role.guard.js');
  const { createTitleGuard } = await import('../src/core/guards/title.guard.js');

  const errors = [];

  const router = createRouter({
    routes: createRoutes(),
    rootElement: getAppRoot(),
    getState,
    onNavigateError: (error, to) => errors.push({ error, to }),
  });

  const store = { getState };

  router.beforeEach(createTitleGuard('ViXoRa'));
  router.beforeEach(createAuthGuard(store));
  router.beforeEach(createRoleGuard(store));

  router.__errors = errors;

  return router;
}

describe('core/router', () => {
  beforeEach(() => {
    lifecycleLog.length = 0;
    getAppRoot().innerHTML = '';
  });

  test('requires a real HTMLElement as root', async () => {
    const { createRouter } = await import('../src/core/router/router.js');
    assert.throws(() => createRouter({ rootElement: null }), /valid root HTMLElement/);
  });

  test('renders layout + page into the outlet on start()', async () => {
    setPathname('/tools/note');

    const router = await buildRouter();
    router.start();
    await flush();

    const root = getAppRoot();
    assert.ok(root.querySelector('.test-layout'), 'layout must be mounted');
    assert.equal(root.querySelector('.test-outlet .page-note').textContent, 'note');

    // فکتوری پیج داخل Promise.all زودتر از mount لایوت صدا زده می‌شود
    assert.deepEqual(lifecycleLog, [
      'page:note:create',
      'layout:afterRender',
      'page:note:render',
      'page:note:afterRender',
    ]);

    router.destroy();
  });

  test('sets document title from route meta', async () => {
    setPathname('/tools/note');

    const router = await buildRouter();
    router.start();
    await flush();

    assert.equal(document.title, 'یادداشت | ViXoRa');

    router.destroy();
  });

  test('reuses the layout when layoutKey is unchanged, swaps the page', async () => {
    setPathname('/');

    const router = await buildRouter();
    router.start();
    await flush();

    lifecycleLog.length = 0;

    await router.navigate('/tools/note');
    await flush();

    assert.deepEqual(lifecycleLog, [
      'page:note:create',
      'page:home:destroy',
      'page:note:render',
      'page:note:afterRender',
    ]);

    assert.equal(getAppRoot().querySelectorAll('.test-layout').length, 1);

    router.destroy();
  });

  test('re-renders the layout when layoutKey changes', async () => {
    setPathname('/');

    const router = await buildRouter({
      getState: () => ({ auth: { status: 'authenticated', user: { id: '1', role: 'admin' } } }),
    });

    router.start();
    await flush();
    lifecycleLog.length = 0;

    await router.navigate('/admin');
    await flush();

    assert.ok(lifecycleLog.includes('layout:destroy'), 'old layout must be destroyed');
    assert.ok(getAppRoot().querySelector('.page-admin'), 'admin page must render');

    router.destroy();
  });

  test('auth guard redirects unauthenticated users to /login', async () => {
    setPathname('/admin');

    const router = await buildRouter();
    router.start();
    await flush();

    assert.equal(getAppRoot().querySelector('.page-admin'), null);
    assert.match(globalThis.location.pathname + globalThis.location.search, /^\/login\?redirect=/);

    router.destroy();
  });

  test('auth guard lets authenticated users through', async () => {
    setPathname('/admin');

    const router = await buildRouter({
      getState: () => ({ auth: { status: 'authenticated', user: { id: '1', role: 'user' } } }),
    });

    router.start();
    await flush();

    assert.ok(getAppRoot().querySelector('.page-admin'));

    router.destroy();
  });

  test('role guard redirects unauthorized roles to /unauthorized', async () => {
    setPathname('/private');

    const router = await buildRouter({
      getState: () => ({ auth: { status: 'authenticated', user: { id: '1', role: 'user' } } }),
    });

    router.start();
    await flush();

    assert.equal(globalThis.location.pathname, '/unauthorized');
    assert.equal(getAppRoot().querySelector('.page-private'), null);

    router.destroy();
  });

  test('dynamic params are decoded into ctx', async () => {
    setPathname('/tools/note/abc-123');

    const router = await buildRouter({
      getState: () => ({ auth: { status: 'authenticated', user: { id: '1', role: 'user' } } }),
    });

    router.start();
    await flush();

    const element = getAppRoot().querySelector('.page-note-detail');
    assert.equal(element.dataset.ctxParam, 'abc-123');
    assert.equal(element.dataset.ctxPath, '/tools/note/abc-123');
    assert.equal(document.title, 'یادداشت abc-123 | ViXoRa');

    router.destroy();
  });

  test('unknown path falls back to the 404 view', async () => {
    setPathname('/does-not-exist');

    const router = await buildRouter();
    router.start();
    await flush();

    assert.ok(getAppRoot().querySelector('.router-not-found'));
    assert.equal(router.getRoute().path, '/does-not-exist');

    router.destroy();
  });

  test('trailing and duplicated slashes are normalized', async () => {
    setPathname('/tools//note/');

    const router = await buildRouter();
    router.start();
    await flush();

    assert.ok(getAppRoot().querySelector('.page-note'), 'normalized path must match the route');

    router.destroy();
  });

  test('page render errors are reported and do not crash the router', async () => {
    setPathname('/broken');

    const router = await buildRouter();
    router.start();
    await flush();

    assert.equal(router.__errors.length, 1);
    assert.match(router.__errors[0].error.message, /boom/);

    // روتر هنوز زنده است
    await router.navigate('/');
    await flush();
    assert.ok(getAppRoot().querySelector('.page-home'));

    router.destroy();
  });

  test('route style is injected and released', async () => {
    setPathname('/tools/note');

    const router = await buildRouter();
    router.start();
    await flush();

    const style = document.getElementById('vixora-style-route-layout-a');
    assert.ok(style, 'route style tag must exist');
    assert.match(style.textContent, /\.page-note\{color:red\}/);

    router.destroy();

    assert.equal(
      document.getElementById('vixora-style-route-layout-a'),
      null,
      'route style must be released on destroy'
    );
  });

  test('internal anchor clicks navigate without a full page load', async () => {
    setPathname('/');

    const router = await buildRouter();
    router.start();
    await flush();

    const anchor = document.createElement('a');
    anchor.href = '/tools/note';
    document.body.appendChild(anchor);

    click(anchor);
    await flush();

    assert.ok(getAppRoot().querySelector('.page-note'), 'SPA navigation must render the page');
    assert.equal(globalThis.location.pathname, '/tools/note');

    anchor.remove();
    router.destroy();
  });

  test('external and special links are not intercepted', async () => {
    setPathname('/');

    const router = await buildRouter();
    router.start();
    await flush();

    const external = document.createElement('a');
    external.href = 'https://example.com/page';
    document.body.appendChild(external);

    const mail = document.createElement('a');
    mail.href = 'mailto:someone@vixora.dev';
    document.body.appendChild(mail);

    click(external);
    click(mail);
    await flush();

    assert.equal(globalThis.location.pathname, '/', 'no SPA navigation should happen');

    external.remove();
    mail.remove();
    router.destroy();
  });

  test('rapid navigations resolve to the last destination only', async () => {
    setPathname('/');

    const router = await buildRouter();
    router.start();
    await flush();

    lifecycleLog.length = 0;

    const first = router.navigate('/tools/note');
    const second = router.navigate('/tools/note/xyz');

    await Promise.all([first, second]);
    await flush();

    assert.ok(getAppRoot().querySelector('.page-note-detail'), 'only the last route must render');
    assert.equal(getAppRoot().querySelector('.page-note'), null);
    assert.equal(
      lifecycleLog.filter((entry) => entry === 'page:note:afterRender').length,
      0,
      'aborted navigation must not finish its lifecycle'
    );

    router.destroy();
  });

  test('navigating away destroys the previous page instance', async () => {
    setPathname('/tools/note');

    const router = await buildRouter();
    router.start();
    await flush();
    lifecycleLog.length = 0;

    await router.navigate('/');
    await flush();

    assert.ok(lifecycleLog.includes('page:note:destroy'));
    assert.ok(getAppRoot().querySelector('.page-home'));
    assert.equal(getAppRoot().querySelector('.page-note'), null);

    router.destroy();
  });

  test('beforeEach can cancel a navigation', async () => {
    setPathname('/');

    const router = await buildRouter();
    router.beforeEach(({ to }) => (to.path === '/tools/note' ? false : true));

    router.start();
    await flush();

    await router.navigate('/tools/note');
    await flush();

    assert.ok(getAppRoot().querySelector('.page-home'), 'cancelled navigation keeps the old page');
    assert.equal(globalThis.location.pathname, '/');

    router.destroy();
  });

  test('beforeEach returns an unsubscribe function', async () => {
    setPathname('/');

    const router = await buildRouter();
    const remove = router.beforeEach(() => false);

    remove();

    router.start();
    await flush();

    assert.ok(getAppRoot().querySelector('.page-home'), 'removed hook must not block');

    router.destroy();
  });

  test('destroy tears everything down', async () => {
    setPathname('/tools/note');

    const router = await buildRouter();
    router.start();
    await flush();
    lifecycleLog.length = 0;

    router.destroy();

    assert.ok(lifecycleLog.includes('page:note:destroy'));
    assert.ok(lifecycleLog.includes('layout:destroy'));
    assert.equal(getAppRoot().innerHTML, '');
    assert.equal(router.getRoute(), null);

    // ناوبری بعد از destroy بی‌اثر است
    await router.navigate('/');
    await flush();
    assert.equal(getAppRoot().innerHTML, '');
  });

  test('resolveFactory accepts a module namespace object', async () => {
    setPathname('/');

    const { createRouter } = await import('../src/core/router/router.js');

    const fakeModule = Promise.resolve({
      default: createTestPage('module-page'),
    });

    const router = createRouter({
      routes: [{ path: '/', component: () => fakeModule, meta: { title: 'M' } }],
      rootElement: getAppRoot(),
      getState: () => ({}),
    });

    router.start();
    await flush();

    assert.ok(getAppRoot().querySelector('.page-module-page'));

    router.destroy();
  });

  test('resolveFactory accepts a renderable object', async () => {
    setPathname('/');

    const { createRouter } = await import('../src/core/router/router.js');

    const router = createRouter({
      routes: [
        {
          path: '/',
          component: () => ({ render: () => '<div class="static-view">static</div>' }),
        },
      ],
      rootElement: getAppRoot(),
      getState: () => ({}),
    });

    router.start();
    await flush();

    assert.equal(getAppRoot().querySelector('.static-view').textContent, 'static');

    router.destroy();
  });
});
