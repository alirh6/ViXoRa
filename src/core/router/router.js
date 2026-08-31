import { interceptNavigationClicks } from './link-interceptor.js';

/**
 * ViXoRa Universal Production Router
 * معماری بدون وابستگی، کامپوزیشنی (Functional) و صددرصد امن
 */

/**
 * نرمال‌سازی مسیر و حذف اسلش‌های تکراری و انتهایی
 */
function normalizePathname(pathname) {
  if (!pathname) return '/';
  const normalized = pathname.replace(/\/{2,}/g, '/');
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }
  return normalized;
}

/**
 * تبدیل هوشمند هر نوع ورودی ماژول/کامپوننت به یک Factory استاندارد
 * پشتیبانی از:
 * ۱. Page/Layout Factory مستقیم
 * ۲. Dynamic Import (Promise)
 * ۳. ماژول‌های ES با export default یا create*
 */
async function resolveFactory(definition, ctx) {
  if (!definition) return null;

  let target = definition;

  // اگر تابع بود، اجرا می‌کنیم تا ببینیم مستقیماً اینستنس/ماژول می‌دهد یا پرامیس
  if (typeof target === 'function') {
    try {
      const result = target(ctx);
      if (result instanceof Promise) {
        target = await result;
      } else if (
        result &&
        (typeof result.render === 'function' || typeof result.then === 'function')
      ) {
        // اگر اجرای تابع مستقیماً اینستنس داد، آن را درون یک فکتوری کپسوله می‌کنیم
        if (typeof result.render === 'function') {
          return () => result;
        }
        target = await result;
      }
    } catch {
      // اگر تابع نیاز به آرگومان نداشت یا فکتوری معمولی بود
      target = definition;
    }
  }

  // اگر خروجی هنوز یک پرامیس است (مثلاً import مستقیم)
  if (target instanceof Promise) {
    target = await target;
  }

  // اگر ورودی یک ماژول ES بارگذاری شده باشد
  if (target && typeof target === 'object' && !target.render) {
    if (typeof target.default === 'function') {
      return target.default;
    }
    
    // جستجوی نام‌های متداول فکتوری
    const candidateKey = Object.keys(target).find((key) =>
      typeof target[key] === 'function' &&
      (key.startsWith('create') || key.toLowerCase().includes('page') || key.toLowerCase().includes('layout'))
    );

    if (candidateKey) {
      return target[candidateKey];
    }

    // اگر ماژول تنها یک تابع اکسپورت کرده باشد
    const functionKeys = Object.keys(target).filter((k) => typeof target[k] === 'function');
    if (functionKeys.length === 1) {
      return target[functionKeys[0]];
    }
  }

  if (typeof target === 'function') {
    return target;
  }

  // اگر مستقیماً یک شیء با متد render ارسال شده باشد (Static View Object)
  if (target && typeof target.render === 'function') {
    return () => target;
  }

  throw new TypeError(
    '[Router] Invalid component/layout definition. Must be a function, dynamic import, or renderable object.'
  );
}

/**
 * تزریق امن محتوا (HTML String یا DOM Node) به درون والد هدف
 */
async function mountNode(targetContainer, renderResult) {
  if (!targetContainer) {
    throw new Error('[Router] Target container (outlet or root) does not exist in DOM.');
  }

  // خروجی ممکن است Promise باشد (مثلاً متد render ناهمگام)
  const node = renderResult instanceof Promise ? await renderResult : renderResult;

  if (typeof node === 'string') {
    targetContainer.innerHTML = node;
  } else if (node instanceof Node) {
    targetContainer.innerHTML = '';
    targetContainer.appendChild(node);
  } else if (node === null || node === undefined) {
    targetContainer.innerHTML = '';
  } else {
    throw new TypeError('[Router] render() must return a valid DOM Node, HTML string, or Promise.');
  }
}

/**
 * تخریب امن یک اینستنس (Page یا Layout) بدون پرتاب خطای شکننده
 */
function safelyDestroyInstance(instance) {
  if (instance && typeof instance.destroy === 'function') {
    try {
      instance.destroy();
    } catch (err) {
      console.error('[Router] Error during instance destroy lifecycle:', err);
    }
  }
}

/**
 * فکتوری ساخت روتر ViXoRa
 */
export function createRouter({ routes = [], rootElement, getState }) {
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
    currentAbortController: null
  };

  let stopLinkInterceptor = null;

  /**
   * تطبیق مسیر با لیست Routes یا بازگرداندن 404
   */
  function matchRoute(pathname) {
    const matched = routes.find((r) => r.path === pathname);
    if (matched) return { route: matched, params: {} };

    // پشتیبانی از Fallback 404
    const notFoundRoute = routes.find((r) => r.path === '/404') || {
      path: '/404',
      component: () => ({
        render: () => `
          <div class="router-not-found" style="text-align:center; padding: 4rem 1rem;">
            <h1>۴۰۴ - صفحه یافت نشد</h1>
            <p>صفحه مورد نظر شما وجود ندارد یا جابه‌جا شده است.</p>
            <a href="/" style="display:inline-block; margin-top:1rem; color:#3b82f6;">بازگشت به صفحه اصلی</a>
          </div>
        `
      }),
      meta: { title: '۴۰۴ - یافت نشد' }
    };

    return { route: notFoundRoute, params: {} };
  }

  /**
   * ثبت گاردهای عمومی ناوبری
   */
  function beforeEach(hook) {
    if (typeof hook !== 'function') {
      throw new TypeError('[Router] beforeEach hook must be a function.');
    }
    routerState.beforeHooks.push(hook);

    return function removeHook() {
      const idx = routerState.beforeHooks.indexOf(hook);
      if (idx !== -1) routerState.beforeHooks.splice(idx, 1);
    };
  }

  /**
   * اجرای پایپ‌لاین گاردها (Global Guards + Route-Level Guards)
   */
  async function runGuards(allGuards, context) {
    for (const guard of allGuards) {
      if (typeof guard !== 'function') continue;

      try {
        const result = await guard(context);

        // ۱. ناوبری لغو شد
        if (result === false) {
          return { status: 'CANCELLED' };
        }

        // ۲. درخواست ریدایرکت داده شد
        if (result && typeof result === 'object' && result.redirect) {
          return { status: 'REDIRECT', to: result.redirect };
        }
      } catch (error) {
        console.error('[Router] Guard execution failed with an exception:', error);
        return { status: 'CANCELLED', error };
      }
    }
    return { status: 'ALLOWED' };
  }

  /**
   * هستهٔ اصلی پردازش ناوبری (Safe Async Pipeline)
   */
  async function processNavigation(destination, { replace = false } = {}) {
    // ۱. افزایش شمارنده یکتا برای رهگیری هم‌زمانی و ابطال عملیات‌های قبلی
    const currentNavId = ++routerState.navigationId;

    // ۲. لغو درخواست‌ها و عملیات‌های ناهمگام در حال اجرای ناوبری قبلی
    if (routerState.currentAbortController) {
      routerState.currentAbortController.abort();
    }
    routerState.currentAbortController = new AbortController();
    const { signal } = routerState.currentAbortController;

    const url = new URL(destination, window.location.origin);
    const pathname = normalizePathname(url.pathname);
    const { route, params } = matchRoute(pathname);

    const toContext = {
      ...route,
      path: pathname,
      fullPath: `${pathname}${url.search}${url.hash}`,
      params,
      query: Object.fromEntries(url.searchParams.entries())
    };

    const fromContext = routerState.currentRoute;
    const currentState = typeof getState === 'function' ? getState() : {};

    // تجمیع گاردهای سراسری و گاردهای اختصاصی مسیر
    const routeGuards = Array.isArray(route.guards) ? route.guards : (route.guard ? [route.guard] : []);
    const pipeline = [...routerState.beforeHooks, ...routeGuards];

    // ۳. اجرای زنجیره گاردها
    const guardResult = await runGuards(pipeline, {
      to: toContext,
      from: fromContext,
      state: currentState,
      signal
    });

    // 🛡️ بررسی Race Condition بعد از گاردها
    if (currentNavId !== routerState.navigationId || signal.aborted) return;

    if (guardResult.status === 'CANCELLED') {
      if (!routerState.currentRoute) {
        window.history.replaceState(null, '', '/');
      }
      return;
    }

    if (guardResult.status === 'REDIRECT') {
      return navigate(guardResult.to, { replace: true });
    }

    // ۴. به‌روزرسانی تاریخچه مرورگر
    if (replace) {
      window.history.replaceState(null, '', toContext.fullPath);
    } else if (window.location.pathname !== pathname || window.location.search !== url.search) {
      window.history.pushState(null, '', toContext.fullPath);
    }

    // ۵. ساخت Navigation Context استاندارد برای تزریق به کامپوننت‌ها
    const ctx = {
      to: toContext.fullPath,
      path: pathname,
      params,
      query: toContext.query,
      state: currentState,
      user: currentState?.auth?.user || null,
      signal
    };

    // ۶. استخراج Factoryها به‌صورت Polymorphic
    const [nextLayoutFactory, nextPageFactory] = await Promise.all([
      resolveFactory(route.layout, ctx),
      resolveFactory(route.component, ctx)
    ]);

    // 🛡️ بررسی مجدد Race Condition پس از اتمام بارگذاری فایل‌های Lazy
    if (currentNavId !== routerState.navigationId || signal.aborted) return;

    // ۷. تخریب پیج قبلی (Page Cleanup)
    safelyDestroyInstance(routerState.currentPageInstance);
    routerState.currentPageInstance = null;

    // ۸. مدیریت لایوت (تشخیص تفاوت، رندر یا استفاده مجدد)
    const nextLayoutKey = route.layoutKey || (nextLayoutFactory ? nextLayoutFactory.name || 'custom-layout' : null);
    const isLayoutChanged = routerState.currentLayoutKey !== nextLayoutKey;

    if (isLayoutChanged) {
      safelyDestroyInstance(routerState.currentLayoutInstance);
      routerState.currentLayoutInstance = null;
      rootElement.innerHTML = '';

      if (nextLayoutFactory) {
        routerState.currentLayoutInstance = nextLayoutFactory(ctx);

        if (!routerState.currentLayoutInstance || typeof routerState.currentLayoutInstance.render !== 'function') {
          throw new Error(`[Router] Layout for route "${pathname}" must return an object with a render() method.`);
        }

        const layoutResult = routerState.currentLayoutInstance.render();
        await mountNode(rootElement, layoutResult);

        if (typeof routerState.currentLayoutInstance.afterRender === 'function') {
          await routerState.currentLayoutInstance.afterRender();
        }

        routerState.currentLayoutKey = nextLayoutKey;
      } else {
        routerState.currentLayoutKey = null;
      }
    }

    // 🛡️ بررسی Race Condition پس از رندر لایوت
    if (currentNavId !== routerState.navigationId || signal.aborted) return;

    // ۹. پیدا کردن Outlet هدف به‌صورت کاملاً هوشمند
    let outletElement = rootElement;

    if (routerState.currentLayoutInstance) {
      if (typeof routerState.currentLayoutInstance.getOutlet === 'function') {
        outletElement = routerState.currentLayoutInstance.getOutlet();
      } else {
        outletElement =
          rootElement.querySelector('[data-router-outlet]') ||
          rootElement.querySelector('#router-outlet') ||
          rootElement.querySelector('main') ||
          rootElement;
      }
    }

    if (!outletElement) {
      outletElement = rootElement;
    }

    // تخلیه پیج قبلی از داخل Outlet
    outletElement.innerHTML = '';

    // ۱۰. سوار کردن و اجرای چرخه حیات پیج جدید
    if (nextPageFactory) {
      routerState.currentPageInstance = nextPageFactory(ctx);

      if (!routerState.currentPageInstance || typeof routerState.currentPageInstance.render !== 'function') {
        throw new Error(`[Router] Page instance for route "${pathname}" must implement a render() method.`);
      }

      const pageResult = routerState.currentPageInstance.render();
      await mountNode(outletElement, pageResult);

      if (typeof routerState.currentPageInstance.afterRender === 'function') {
        await routerState.currentPageInstance.afterRender();
      }
    }

    // ۱۱. تنظیم متادیتای سند (Document Title)
    if (route.meta?.title) {
      document.title = typeof route.meta.title === 'function' 
        ? route.meta.title(ctx) 
        : `${route.meta.title} | ViXoRa`;
    }

    // ۱۲. نهایی‌سازی وضعیت مسیر فعال
    routerState.currentRoute = toContext;
  }

  function navigate(path, options = {}) {
    return processNavigation(path, options);
  }

  function handlePopState() {
    const destination = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    processNavigation(destination, { replace: true });
  }

  /**
   * رهگیری کلیک‌های لینک‌های داخلی (SPA Navigation Interceptor)
   */
  // function interceptNavigationClicks(onNavigate) {
  //   function handleClick(event) {
  //     if (event.defaultPrevented || event.button !== 0) return;
  //     if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;

  //     const link = event.target.closest('a');
  //     if (!link) return;

  //     const href = link.getAttribute('href');
  //     if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
  //     if (link.hasAttribute('download') || link.getAttribute('rel') === 'external' || link.target === '_blank') return;

  //     // بررسی یکسان بودن دامنه
  //     const url = new URL(link.href, window.location.origin);
  //     if (url.origin !== window.location.origin) return;

  //     event.preventDefault();
  //     onNavigate(url.pathname + url.search + url.hash);
  //   }

  //   document.addEventListener('click', handleClick);
  //   return () => document.removeEventListener('click', handleClick);
  // }

  /**
   * استارت روتر
   */
  function start() {
    window.addEventListener('popstate', handlePopState);
    stopLinkInterceptor = interceptNavigationClicks((path) => navigate(path));
    handlePopState();
  }

  /**
   * متوقف‌سازی و پاکسازی کامل منابع روتر
   */
  function destroy() {
    window.removeEventListener('popstate', handlePopState);
    if (stopLinkInterceptor) stopLinkInterceptor();
    if (routerState.currentAbortController) {
      routerState.currentAbortController.abort();
    }
    safelyDestroyInstance(routerState.currentPageInstance);
    safelyDestroyInstance(routerState.currentLayoutInstance);
    routerState.currentPageInstance = null;
    routerState.currentLayoutInstance = null;
    rootElement.innerHTML = '';
  }

  return {
    beforeEach,
    navigate,
    start,
    destroy,
    getRoute: () => routerState.currentRoute
  };
}
