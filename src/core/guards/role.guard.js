


/**
 * گارد کنترل سطح دسترسی بر اساس نقش
 * @param {Object} store - شیء استیت سراسری برنامه
 * @returns {Function} تابع گارد ناوبری
 */
export function createRoleGuard(store) {
  return async function roleGuard({ to }) {
    // اگر صفحه نقش خاصی تعیین نکرده، عبور آزاد است
    if (!to.meta?.roles || !Array.isArray(to.meta.roles)) {
      return true;
    }

    const state = store.getState();
    const userRole = state.auth?.user?.role;

    // اگر نقش کاربر جزو نقش‌های مجاز نبود
    if (!to.meta.roles.includes(userRole)) {
      console.warn(`[RoleGuard] Access denied for role "${userRole}" to path "${to.path}"`);
      return { redirect: '/unauthorized' }; // یا return false برای توقف کامل
    }

    return true;
  };
}
