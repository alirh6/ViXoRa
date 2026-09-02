// src/core/storage/session-storage.js

import { createLocalStorageAdapter } from '../../utilities/storage.js';

const storage = createLocalStorageAdapter();

const ACTIVE_USER_KEY = 'ViXoRa:active-user';

export function getStoredUser() {
  const user = storage.get(ACTIVE_USER_KEY, null);

  if (!user || typeof user !== 'object' || !user.id) {
    return null;
  }

  return user;
}

export function setStoredUser(user) {
  if (!user || typeof user !== 'object' || !user.id) {
    throw new Error(
      '[SessionStorage] Cannot store invalid user.'
    );
  }

  const safeUser = structuredClone(user);
  delete safeUser.password;

  return storage.set(ACTIVE_USER_KEY, safeUser);
}

export function clearStoredUser() {
  return storage.remove(ACTIVE_USER_KEY);
}
