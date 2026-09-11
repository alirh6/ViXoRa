// src/app.js

/**
 * ViXoRa Bootstrap — راه‌اندازی برنامه
 */

import {
  initializeAppState,
  appStore,
} from './core/state/app-state.js';

import { createRouter } from './core/router/router.js';
import { setupGuards } from './core/bootstrap/setup-guards.js';
import { routes } from './core/router/routes.js';
import { restoreSession } from './core/services/auth-service.js';
import { ensureDatabaseReady } from './core/storage/db-client.js';
import { selectTheme } from './core/state/selectors.js';
import { mountGlobalMiniPlayer } from './pages/tools/music/music-mini-player.js';

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('is-dark', theme === 'dark');
}

export async function bootstrap() {
  const rootElement = document.getElementById('app');

  if (!rootElement) {
    throw new Error('[Bootstrap] Root element #app not found.');
  }

  // ۱) ساخت/بازیابی دیتابیس محلی (LocalStorage)
  await ensureDatabaseReady();

  // ۲) state اولیه از LocalStorage خوانده می‌شود
  initializeAppState();

  // ۳) اعتبارسنجی session
  await restoreSession();

  // ۴) تم
  applyTheme(selectTheme(appStore.getState()));

  appStore.subscribe(({ previousState, currentState }) => {
    const previousTheme = selectTheme(previousState);
    const nextTheme = selectTheme(currentState);

    if (previousTheme !== nextTheme) applyTheme(nextTheme);
  });

  // ۵) روتر
  const router = createRouter({
    routes,
    rootElement,
    getState: appStore.getState,
    onNavigateError: (error, to) => {
      console.error(`[Router] Failed to render "${to?.path}":`, error);
    },
  });

  setupGuards(router, appStore);

  globalThis.appRouter = router;
  globalThis.appStore = appStore;

  router.start();

  return { router, store: appStore };
}
