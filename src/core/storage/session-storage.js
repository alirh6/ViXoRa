// src/core/storage/session-storage.js

/**
 * مدیریت session کاربر فعال (فقط LocalStorage)
 * کلید: ViXoRa:active-user
 *
 * نکته امنیتی: رمز عبور هرگز در session ذخیره نمی‌شود.
 */

import { createLocalStorageAdapter } from '../../utilities/storage.js';
import { STORAGE_KEYS } from '../../config/app-config.js';

const storage = createLocalStorageAdapter();

export function getStoredUser() {
  const user = storage.get(STORAGE_KEYS.activeUser, null);

  if (!user || typeof user !== 'object' || !user.id) {
    return null;
  }

  return user;
}

export function setStoredUser(user) {
  if (!user || typeof user !== 'object' || !user.id) {
    throw new Error('[SessionStorage] Cannot store invalid user.');
  }

  const safeUser = structuredClone(user);
  delete safeUser.password;

  return storage.set(STORAGE_KEYS.activeUser, safeUser);
}

export function clearStoredUser() {
  return storage.remove(STORAGE_KEYS.activeUser);
}

export function hasStoredUser() {
  return Boolean(getStoredUser());
}

/** آخرین زمان فعالیت — برای نمایش «آخرین ورود» */
export function touchStoredUser() {
  const user = getStoredUser();
  if (!user) return null;

  user.lastLoginAt = new Date().toISOString();
  storage.set(STORAGE_KEYS.activeUser, user);

  return user;
}
