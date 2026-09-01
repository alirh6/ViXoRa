import { initializeAppState, appStore , setAuthUser } from './core/state/app-state';
import { createRouter } from './core/router/router.js';
import { setupGuards } from './core/bootstrap/setup-guards.js';
import { routes } from './core/router/routes.js';
import { findUserById, syncDatabaseWithServer } from './core/storage/db-client.js';

const selectTheme = (state) => state?.ui?.theme || 'light';

export async function bootstrap() {
  const rootElement = document.getElementById('app');

  if (!rootElement) {
    throw new Error('[Bootstrap] Root element #app not found in document.');
  }

    // ۱. سینک سریع دیتای فایل db.json با کلاینت
  await syncDatabaseWithServer();

  // ۱. مقداردهی استیت از لوکال استوریج
  initializeAppState();

  const defaultUser = findUserById("1");
  if (defaultUser) {
    setAuthUser({
      id: defaultUser.id,
      name: defaultUser.name,
      username: defaultUser.username,
      role: defaultUser.role,
      email: defaultUser.email,
      plan: defaultUser.plan
    });
  }

  // ۲. تم برنامه
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }

  applyTheme(selectTheme(appStore.getState()));

  appStore.subscribe(({ previousState, currentState }) => {
    const previousTheme = selectTheme(previousState);
    const nextTheme = selectTheme(currentState);

    if (previousTheme !== nextTheme) {
      applyTheme(nextTheme);
    }
  });

  

  // ۳. ساخت روتر
  const router = createRouter({
    routes,
    rootElement,
    getState: appStore.getState
  });

  // ۴. اتصال گاردها به روتر (قبل از استارت)
  setupGuards(router, appStore);

  // ۵. شروع به کار روتر
  router.start();

  return { router, store: appStore };
}
