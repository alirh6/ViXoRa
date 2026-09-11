// src/config/app-config.js

/**
 * ViXoRa — تنظیمات مرکزی برنامه
 * ------------------------------------------------------------------
 * ⚠️ سیاست داده در این پروژه: «اول لوکال، بعد سرور»
 *
 * `dbMode = 'local'`  => همه‌چیز روی LocalStorage ذخیره می‌شود
 *                        (پروژه بک‌اند ندارد — حالت پیش‌فرض)
 * `dbMode = 'remote'` => LocalStorage به‌عنوان کش + آینه‌سازی
 *                        روی json-server (فقط در حالت توسعه)
 *
 * تغییر حالت بدون دست‌زدن به کد هم ممکن است:
 *   localStorage.setItem('ViXoRa:db-mode', 'remote')
 */

export const APP_NAME = 'ViXoRa';

export const STORAGE_KEYS = {
  state: 'ViXoRa:state',
  activeUser: 'ViXoRa:active-user',
  users: 'ViXoRa:users',
  seed: 'ViXoRa:db-seeded',
  dbMode: 'ViXoRa:db-mode',
  settings: 'ViXoRa:settings',
  css: 'ViXoRa:css',
};

export const DEFAULT_DB_MODE = 'local';

export const API_BASE_URL = 'http://localhost:3001';

export const APP_ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  unauthorized: '/unauthorized',
  toolsDashboard: '/tools/dashboard',
};

export const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300f0ff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>'
  );

/** نام ابزارهایی که در schema کاربر تعریف شده‌اند */
export const TOOL_NAMES = [
  'notes',
  'todos',
  'customerInfo',
  'music',
  'invoices',
];

/** نقش‌های معتبر سیستم */
export const USER_ROLES = ['user', 'admin'];

/** پلن‌های معتبر سیستم */
export const USER_PLANS = ['free', 'plus', 'pro', 'go', 'gift'];

/** زبان‌های پشتیبانی‌شده */
export const APP_LANGUAGES = ['english', 'persian', 'france', 'spanish', 'arabic'];
