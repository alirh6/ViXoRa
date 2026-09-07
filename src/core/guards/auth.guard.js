// src/core/guards/auth.guard.js

/**
 * گارد احراز هویت
 * مسیرهایی با meta.requiresAuth فقط برای کاربر واردشده
 * مسیرهایی با meta.guestOnly فقط برای کاربر مهمان
 */
export function createAuthGuard(store, { loginPath = '/login', homePath = '/tools/dashboard' } = {}) {
  return async function authGuard({ to, state: guardState }) {
    const state = guardState || store?.getState?.() || {};

    const isAuthenticated =
      state.auth?.status === 'authenticated' && Boolean(state.auth?.user?.id);

    if (to.meta?.requiresAuth && !isAuthenticated) {
      return { redirect: `${loginPath}?redirect=${encodeURIComponent(to.fullPath || to.path)}` };
    }

    if (to.meta?.guestOnly && isAuthenticated) {
      return { redirect: homePath };
    }

    return true;
  };
}
