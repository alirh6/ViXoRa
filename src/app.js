// src/app.js

import { initializeAppState , appStore, } from './core/state/app-state.js';
import { createRouter } from './core/router/router.js';
import { setupGuards } from './core/bootstrap/setup-guards.js';
import { routes } from './core/router/routes.js';
import { restoreSession } from './core/services/auth-service.js';
import { renderHeader } from './pages/tools/note/note-renderers';

const selectTheme = (state) =>
  state?.ui?.theme || 'light';

export async function bootstrap() {
  const rootElement =
    document.getElementById('app');

  if (!rootElement) {
    throw new Error(
      '[Bootstrap] Root element #app not found.'
    );
  }

  /*
   * state اولیه از LocalStorage خوانده می‌شود.
   * اما session در مرحله بعد با API اعتبارسنجی می‌شود.
   */
  initializeAppState();

  /*
   * اگر active user وجود داشته باشد:
   * - id آن خوانده می‌شود
   * - کاربر از json-server دریافت می‌شود
   * - اطلاعات تازه در state و LocalStorage ذخیره می‌شود
   *
   * اگر وجود نداشته باشد:
   * - کاربر مهمان می‌شود
   */
  await restoreSession();

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }

  applyTheme(selectTheme(appStore.getState()));

  appStore.subscribe(
    ({ previousState, currentState }) => {
      const previousTheme =
        selectTheme(previousState);

      const nextTheme =
        selectTheme(currentState);

      if (previousTheme !== nextTheme) {
        applyTheme(nextTheme);
      }
    }
  );

  const router = createRouter({
    routes,
    rootElement,
    getState: appStore.getState,
  });

  setupGuards(router, appStore);

  window.appRouter = router;

  router.start();

  return {
    router,
    store: appStore,
  };
}


// export default async function  x(w) {
//   function  render() {
    
//   }

//   function  after() {
    
//   }

//   function destroy() {
    
//   }

//   return {
//     render,after,destroy
//   }
// }
// export async function  y(w) {
//   function  render() {
//     console.log('shod');
    
//   }

//   function  after() {
    
//   }

//   function destroy() {
    
//   }

//   return {
//     render,after,destroy
//   }
// }