// src/core/guards/role.guard.js

/**
 * گارد کنترل سطح دسترسی بر اساس نقش کاربر
 */
export function createRoleGuard(store, { unauthorizedPath = '/unauthorized' } = {}) {
  return async function roleGuard({ to, state: guardState }) {
    if (!to.meta?.roles || !Array.isArray(to.meta.roles) || to.meta.roles.length === 0) {
      return true;
    }

    const state = guardState || store?.getState?.() || {};
    const userRole = state.auth?.user?.role;

    if (!to.meta.roles.includes(userRole)) {
      console.warn(`[RoleGuard] Access denied for role "${userRole}" to path "${to.path}"`);
      return { redirect: unauthorizedPath };
    }

    return true;
  };
}
