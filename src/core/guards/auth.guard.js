
// src/core/guards/auth.guard.js

export function createAuthGuard(store) {
  return async function authGuard({ to }) {
    const state = store.getState();

    const isAuthenticated =
      state.auth?.status === 'authenticated' &&
      Boolean(state.auth?.user?.id);

    if (to.meta?.requiresAuth && !isAuthenticated) {
      return {
        redirect: '/login',
      };
    }

    if (to.meta?.guestOnly && isAuthenticated) {
      return {
        redirect: '/tools/dashboard',
      };
    }

    return true;
  };
}
