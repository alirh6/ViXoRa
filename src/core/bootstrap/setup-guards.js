import { createAuthGuard } from "../guards/auth.guard.js"; 
import { createRoleGuard } from "../guards/role.guard.js";
import { createTitleGuard } from "../guards/title.guard.js"

/**
 * راه‌اندازی و اتصال گاردهای سراسری به روتر
 * @param {Object} router - شیء روتر برنامه
 * @param {Object} store - شیء استیت سراسری برنامه
 */
export function setupGuards(router, store) {
  // ۱. گارد تغییر تایتل (اول اجرا می‌شود)
  router.beforeEach(createTitleGuard('ViXoRa'));

  // ۲. گارد احراز هویت (بررسی لاگین/مهمان)
  router.beforeEach(createAuthGuard(store));

  // ۳. گارد بررسی دسترسی نقش‌ها (Admin/User)
  router.beforeEach(createRoleGuard(store));
}
