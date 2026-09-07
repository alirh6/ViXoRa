// src/core/router/router.js

/**
 * ViXoRa Universal Production Router — Functional & Dependency-free
 * ==================================================================
 * قرارداد Layout / Page:
 *   { render(), afterRender?(), getOutlet?(), destroy?() }
 *
 * قابلیت‌ها:
 *  - Lazy loading با dynamic import
 *  - Lazy CSS با route.style
 *  - Guards: سراسری (beforeEach) + سطح route
 *  - Race-condition safe با navigationId + AbortController
 *  - مدیریت layout با layoutKey (بدون رندر مجدد غیرضروری)
 *  - پشتیبانی از params پویا  (/tools/note/:id)
 */

import { injectScopedCss } from '../../utilities/css-scope.js';
import { interceptNavigationClicks } from './link-interceptor.js';

/* ------------------------------------------------------------------ */
/* ابزارهای داخلی                                                      */
/* ------------------------------------------------------------------ */

/**
 * محیط اجرایی: در مرورگر window و در Node/تست همان globalThis.
 * (در مرورگر globalThis === window است، پس هر دو مسیر یکی‌اند.)
 */
function globalScope() {
  if (typeof window !== 'undefined' && window) return window;
  return typeof globalThis !== 'undefined' ? globalThis : {};
}

/** location معتبر (window در مرورگر، globalThis در محیط تست/Node) */
function resolveLocation() {
  if (typeof window !== 'undefined' && window?.location) return window.location;
  return globalThis.location;
}

/** history معتبر */
function resolveHistory() {
  if (typeof window !== 'undefined' && window?.history) return window.history;
  return globalThis.history;
}

/** document معتبر */
function resolveDocument() {
  if (typeof document !== 'undefined' && document) return document;
  return globalThis.document;
}

function normalizePathname(pathname) {
  if (!pathname) return '/';

  const normalized = String(pathname).replace(/\/{2,}/g, '/');

  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

/** تبدیل route path با :param به RegExp */
function compilePath(pattern) {
  const keys = [];

  const regexSource = String(pattern)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\/:([^/]+)/g, (_match, key) => {
      keys.push(key);
      return '/([^/]+)';
    });

  return { regex: new RegExp(`^${regexSource}/?$`), keys };
}

const compiledCache = new Map();

function getCompiled(pattern) {
  if (!compiledCache.has(pattern)) {
    compiledCache.set(pattern, compilePath(pattern));
  }
  return compiledCache.get(pattern);
}

function isRenderable(value) {
  return Boolean(value) && typeof value === 'object' && typeof value.render === 'function';
}

function thenable(value) {
  return Boolean(value) && typeof value.then === 'function';
}

/**
 * تبدیل هر نوع تعریف ماژول/کامپوننت به یک Factory استاندارد
 */
async function resolveFactory(definition, ctx) {
  if (!definition) return null;

  let target = definition;

  // ۱) فراخوانی تابع (ممکن است factory، dynamic import یا sync factory باشد)
  if (typeof target === 'function') {
    let result;

    try {
      result = target(ctx);
    } catch (error) {
      throw new TypeError(`[Router] Component factory threw an error: ${error?.message || error}`);
    }

    if (thenable(result)) {
      target = await result;
    } else if (isRenderable(result)) {
      return () => result;
    } else if (typeof result === 'function') {
      target = result;
    } else {
      target = definition;
    }
  }

  // ۲) resolve کردن promise (dynamic import)
  if (thenable(target)) {
    target = await target;
  }

  // ۳) ماژول ES
  if (target && typeof target === 'object' && !isRenderable(target)) {
    if (typeof target.default === 'function') return target.default;
    if (isRenderable(target.default)) return () => target.default;

    const candidateKey = Object.keys(target).find(
      (key) =>
        typeof target[key] === 'function' &&
        (key.startsWith('create') ||
          key.toLowerCase().includes('page') ||
          key.toLowerCase().includes('layout'))
    );

    if (candidateKey) return target[candidateKey];

    const functionKeys = Object.keys(target).filter((key) => typeof target[key] === 'function');
    if (functionKeys.length === 1) return target[functionKeys[0]];
  }

  if (typeof target === 'function') return target;
  if (isRenderable(target)) return () => target;

  throw new TypeError(
    '[Router] Invalid component/layout definition. Must be a function, dynamic import, or renderable object.'
  );
}

async function mountNode(targetContainer, renderResult) {
  if (!targetContainer) {
    throw new Error('[Router] Target container (outlet or root) does not exist in DOM.');
  }

  const node = thenable(renderResult) ? await renderResult : renderResult;

  if (typeof node === 'string') {
    targetContainer.innerHTML = node;
  } else if (typeof Node !== 'undefined' && node instanceof Node) {
    targetContainer.innerHTML = '';
    targetContainer.appendChild(node);
  } else if (node === null || node === undefined) {
    targetContainer.innerHTML = '';
  } else {
    throw new TypeError('[Router] render() must return a valid DOM Node, HTML string, or Promise.');
  }
}

function safelyDestroyInstance(instance) {
  if (instance && typeof instance.destroy === 'function') {
    try {
      instance.destroy();
    } catch (error) {
      console.error('[Router] Error during instance destroy lifecycle:', error);
    }
  }
}

async function loadRouteStyle(styleDefinition, cacheKey) {
  if (!styleDefinition) return null;

  try {
    const loaded =
      typeof styleDefinition === 'function' ? await styleDefinition() : await styleDefinition;

    const cssText =
      typeof loaded === 'string'
        ? loaded
        : loaded && typeof loaded.default === 'string'
          ? loaded.default
          : '';

    if (cssText.trim()) {
      return injectScopedCss(cssText, `route-${cacheKey}`);
    }
  } catch (error) {
    console.warn('[Router] Route style could not be loaded:', error?.message || error);
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* فکتوری اصلی                                                         */
/* ------------------------------------------------------------------ */

export function createRouter({
  routes = [],
  rootElement,
  getState,
  onNavigateError = null,
  appName = 'ViXoRa',
}) {
  if (!rootElement || !(rootElement instanceof HTMLElement)) {
    throw new Error('[Router] A valid root HTMLElement must be provided.');
  }

  const routerState = {
    currentPageInstance: null,
    currentLayoutInstance: null,
    currentLayoutKey: null,
    currentRoute: null,
    beforeHooks: [],
    navigationId: 0,
    currentAbortController: null,
    routeStyleRelease: null,
    titleHandledByGuard: false,
    isStarting: false,
    isDestroyed: false,
  };

  let stopLinkInterceptor = null;

  /* ---------------- تطبیق مسیر ---------------- */

  function matchRoute(pathname) {
    const normalized = normalizePathname(pathname);

    // تطبیق دقیق (سریع‌ترین حالت)
    const exact = routes.find((route) => normalizePathname(route.path) === normalized);
    if (exact) return { route: exact, params: {} };

    // تطبیق پارامتریک
    for (const route of routes) {
      if (!route.path.includes(':')) continue;

      const { regex, keys } = getCompiled(route.path);
      const match = regex.exec(normalized);

      if (match) {
        const params = {};
        keys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1]);
        });

        return { route, params };
      }
    }

    // Fallback 404
    const notFoundRoute = routes.find((route) => route.path === '/404');

    if (notFoundRoute) return { route: notFoundRoute, params: {} };

    return {
      route: {
        path: '/404',
        component: () => ({
          render: () => `
            <div class="router-not-found" style="text-align:center;padding:4rem 1rem;">
              <h1>۴۰۴ — صفحه یافت نشد</h1>
              <p>مسیر «${normalized}» در این برنامه تعریف نشده است.</p>
              <a href="/" style="display:inline-block;margin-top:1rem;color:#3b82f6;">بازگشت به صفحه اصلی</a>
            </div>
          `,
        }),
        meta: { title: '۴۰۴ — یافت نشد' },
      },
      params: {},
    };
  }

  /* ---------------- گاردها ---------------- */

  function beforeEach(hook) {
    if (typeof hook !== 'function') {
      throw new TypeError('[Router] beforeEach hook must be a function.');
    }

    routerState.beforeHooks.push(hook);

    // اگر گارد عنوان ثبت شود، مدیریت document.title به او سپرده می‌شود
    if (hook.managesDocumentTitle === true) {
      routerState.titleHandledByGuard = true;
    }

    return function removeHook() {
      const index = routerState.beforeHooks.indexOf(hook);
      if (index !== -1) routerState.beforeHooks.splice(index, 1);
    };
  }

  async function runGuards(allGuards, context) {
    for (const guard of allGuards) {
      if (typeof guard !== 'function') continue;

      let result;

      try {
        result = await guard(context);
      } catch (error) {
        console.error('[Router] Guard execution failed with an exception:', error);
        return { status: 'CANCELLED', error };
      }

      if (result === false) return { status: 'CANCELLED' };

      if (result && typeof result === 'object' && result.redirect) {
        return { status: 'REDIRECT', to: result.redirect };
      }
    }

    return { status: 'ALLOWED' };
  }

  /* ---------------- هستهٔ ناوبری ---------------- */

  async function processNavigation(destination, { replace = false } = {}) {
    if (routerState.isDestroyed) return;

    const currentNavId = ++routerState.navigationId;

    if (routerState.currentAbortController) {
      routerState.currentAbortController.abort();
    }

    routerState.currentAbortController = new AbortController();
    const { signal } = routerState.currentAbortController;

    const isStale = () => currentNavId !== routerState.navigationId || signal.aborted;

    let url;
    try {
      url = new URL(destination, resolveLocation().origin);
    } catch (error) {
      console.error('[Router] Invalid navigation destination:', destination, error);
      return;
    }

    const pathname = normalizePathname(url.pathname);
    const { route, params } = matchRoute(pathname);

    const toContext = {
      ...route,
      path: pathname,
      fullPath: `${pathname}${url.search}${url.hash}`,
      params,
      query: Object.fromEntries(url.searchParams.entries()),
    };

    const fromContext = routerState.currentRoute;
    const currentState = typeof getState === 'function' ? getState() : {};

    const routeGuards = Array.isArray(route.guards)
      ? route.guards
      : route.guard
        ? [route.guard]
        : [];

    const pipeline = [...routerState.beforeHooks, ...routeGuards];

    const guardResult = await runGuards(pipeline, {
      to: toContext,
      from: fromContext,
      state: currentState,
      signal,
    });

    if (isStale()) return;

    if (guardResult.status === 'CANCELLED') {
      if (!routerState.currentRoute) {
        resolveHistory().replaceState(null, '', '/');
      }
      return;
    }

    if (guardResult.status === 'REDIRECT') {
      return navigate(guardResult.to, { replace: true });
    }

    // تاریخچهٔ مرورگر
    try {
      if (replace) {
        resolveHistory().replaceState(null, '', toContext.fullPath);
      } else if (
        resolveLocation().pathname !== pathname ||
        resolveLocation().search !== url.search
      ) {
        resolveHistory().pushState(null, '', toContext.fullPath);
      }
    } catch (error) {
      console.warn('[Router] History update failed:', error?.message || error);
    }

    const ctx = {
      to: toContext.fullPath,
      path: pathname,
      params,
      query: toContext.query,
      state: currentState,
      user: currentState?.auth?.user || null,
      signal,
      navigate,
    };

    let nextLayoutFactory = null;
    let nextPageFactory = null;

    try {
      const [layoutFactory, pageFactory, styleRelease] = await Promise.all([
        resolveFactory(route.layout, ctx),
        resolveFactory(route.component, ctx),
        loadRouteStyle(route.style, route.layoutKey || pathname),
      ]);

      nextLayoutFactory = layoutFactory;
      nextPageFactory = pageFactory;

      // آزادسازی استایل route قبلی قبل از جایگزینی
      // (بدون این کار، ناوبری‌های پشت‌سرهم روی یک route باعث نشتی ref-count می‌شود)
      if (routerState.routeStyleRelease) {
        routerState.routeStyleRelease();
      }

      routerState.routeStyleRelease = styleRelease || null;
    } catch (error) {
      console.error('[Router] Failed to resolve route modules:', error);
      reportNavigationError(error, toContext);
      return;
    }

    if (isStale()) return;

    // تخریب پیج قبلی
    safelyDestroyInstance(routerState.currentPageInstance);
    routerState.currentPageInstance = null;

    // مدیریت لایوت
    const nextLayoutKey =
      route.layoutKey || (nextLayoutFactory ? nextLayoutFactory.name || 'custom-layout' : null);

    const isLayoutChanged = routerState.currentLayoutKey !== nextLayoutKey;

    try {
      if (isLayoutChanged) {
        safelyDestroyInstance(routerState.currentLayoutInstance);
        routerState.currentLayoutInstance = null;
        rootElement.innerHTML = '';

        if (nextLayoutFactory) {
          routerState.currentLayoutInstance = nextLayoutFactory(ctx);

          if (!isRenderable(routerState.currentLayoutInstance)) {
            throw new Error(
              `[Router] Layout for route "${pathname}" must return an object with a render() method.`
            );
          }

          const layoutResult = routerState.currentLayoutInstance.render();
          await mountNode(rootElement, layoutResult);

          if (isStale()) return;

          if (typeof routerState.currentLayoutInstance.afterRender === 'function') {
            await routerState.currentLayoutInstance.afterRender();
          }

          routerState.currentLayoutKey = nextLayoutKey;
        } else {
          routerState.currentLayoutKey = null;
        }
      }

      if (isStale()) return;

      // پیدا کردن outlet
      let outletElement = rootElement;

      if (routerState.currentLayoutInstance) {
        if (typeof routerState.currentLayoutInstance.getOutlet === 'function') {
          outletElement =
            routerState.currentLayoutInstance.getOutlet() ||
            rootElement.querySelector('[data-router-outlet]') ||
            rootElement;
        } else {
          outletElement =
            rootElement.querySelector('[data-router-outlet]') ||
            rootElement.querySelector('#router-outlet') ||
            rootElement.querySelector('main') ||
            rootElement;
        }
      }

      if (!outletElement) outletElement = rootElement;

      outletElement.innerHTML = '';

      // سوار کردن پیج
      if (nextPageFactory) {
        routerState.currentPageInstance = nextPageFactory(ctx);

        if (!isRenderable(routerState.currentPageInstance)) {
          throw new Error(
            `[Router] Page instance for route "${pathname}" must implement a render() method.`
          );
        }

        const pageResult = routerState.currentPageInstance.render();
        await mountNode(outletElement, pageResult);

        if (isStale()) return;

        if (typeof routerState.currentPageInstance.afterRender === 'function') {
          await routerState.currentPageInstance.afterRender();
        }
      }

      // عنوان سند
      // اگر title guard سراسری ثبت شده باشد، عنوان را او مدیریت می‌کند
      // تا دو بار و با دو فرمت مختلف نوشته نشود.
      if (route.meta?.title && !routerState.titleHandledByGuard) {
        const rawTitle =
          typeof route.meta.title === 'function' ? route.meta.title(ctx) : route.meta.title;

        resolveDocument().title = appName ? `${rawTitle} | ${appName}` : rawTitle;
      }

      routerState.currentRoute = toContext;

      if (typeof route.meta?.onEnter === 'function') {
        route.meta.onEnter(ctx);
      }
    } catch (error) {
      console.error('[Router] Navigation failed:', error);
      reportNavigationError(error, toContext);
    }
  }

  function reportNavigationError(error, toContext) {
    if (typeof onNavigateError === 'function') {
      try {
        onNavigateError(error, toContext);
      } catch (handlerError) {
        console.error('[Router] onNavigateError handler failed:', handlerError);
      }
    }
  }

  function navigate(path, options = {}) {
    return processNavigation(path, options);
  }

  function back() {
    resolveHistory().back();
  }

  function forward() {
    resolveHistory().forward();
  }

  function handlePopState() {
    const destination = `${resolveLocation().pathname}${resolveLocation().search}${resolveLocation().hash}`;
    processNavigation(destination, { replace: true });
  }

  function start() {
    if (routerState.isStarting || routerState.isDestroyed) return;
    routerState.isStarting = true;

    globalScope().addEventListener('popstate', handlePopState);

    stopLinkInterceptor = interceptNavigationClicks((path) => navigate(path));

    handlePopState();
  }

  function destroy() {
    routerState.isDestroyed = true;

    globalScope().removeEventListener('popstate', handlePopState);

    if (stopLinkInterceptor) stopLinkInterceptor();
    stopLinkInterceptor = null;

    if (routerState.currentAbortController) {
      routerState.currentAbortController.abort();
    }

    safelyDestroyInstance(routerState.currentPageInstance);
    safelyDestroyInstance(routerState.currentLayoutInstance);

    if (routerState.routeStyleRelease) routerState.routeStyleRelease();

    routerState.currentPageInstance = null;
    routerState.currentLayoutInstance = null;
    routerState.currentLayoutKey = null;
    routerState.currentRoute = null;
    routerState.beforeHooks.length = 0;
    routerState.routeStyleRelease = null;

    rootElement.innerHTML = '';
  }

  return {
    beforeEach,
    navigate,
    back,
    forward,
    start,
    destroy,
    getRoute: () => routerState.currentRoute,
    isNavigating: () => Boolean(routerState.currentAbortController),
  };
}

/* ------------------------------------------------------------- */
/* نکته: link-interceptor مستقیماً از ./link-interceptor.js       */
/* import می‌شود (بدون circular dependency).                      */
/* ------------------------------------------------------------- */
