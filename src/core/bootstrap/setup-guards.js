// src/core/bootstrap/setup-guards.js

import { createAuthGuard } from '../guards/auth.guard.js';
import { createRoleGuard } from '../guards/role.guard.js';
import { createTitleGuard } from '../guards/title.guard.js';
import { APP_NAME } from '../../config/app-config.js';

/**
 * راه‌اندازی و اتصال گاردهای سراسری به روتر
 * ترتیب اجرا: title → auth → role
 *
 * @param {Object} router
 * @param {Object} store
 * @returns {Function[]} توابع حذف هر گارد
 */
export function setupGuards(router, store, options = {}) {
  const {
    appName = APP_NAME,
    loginPath = '/login',
    homePath = '/tools/dashboard',
    unauthorizedPath = '/unauthorized',
  } = options;

  const removeTitle = router.beforeEach(createTitleGuard(appName));
  const removeAuth = router.beforeEach(createAuthGuard(store, { loginPath, homePath }));
  const removeRole = router.beforeEach(createRoleGuard(store, { unauthorizedPath }));

  return [removeTitle, removeAuth, removeRole];
}
