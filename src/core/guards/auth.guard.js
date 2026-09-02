

// /**
//  * گارد احراز هویت
//  * @param {Object} store - شیء استیت سراسری برنامه
//  * @returns {Function} تابع گارد ناوبری
//  */
// export function createAuthGuard(store) {
//   return async function authGuard({ to }) {
//     const state = store.getState();
//     const isAuthenticated = Boolean(state.auth?.isAuthenticated);

//     // ۱. بررسی صفحاتی که نیاز به لاگین دارند
//     if (to.meta?.requiresAuth && !isAuthenticated) {
//       return { redirect: '/login' };
//     }

//     // ۲. بررسی صفحاتی که فقط مخصوص کاربران مهمان هستند (مثل لاگین/ثبت‌نام)
//     if (to.meta?.guestOnly && isAuthenticated) {
//       return { redirect: '/dashboard' };
//     }

//     // ۳. اجازه عبور
//     return true;
//   };
// }





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
