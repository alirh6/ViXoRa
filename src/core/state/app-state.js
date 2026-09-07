// src/core/state/app-state.js

/**
 * ViXoRa Global State — auth / ui / app
 * ------------------------------------------------------------------
 * تنها منبع حقیقت state برنامه.
 * صفحات و کامپوننت‌ها فقط از توابع export شده استفاده می‌کنند.
 */

import { createStore } from '../store/store.js';
import { createLocalStorageAdapter } from '../../utilities/storage.js';
import {
  APP_LANGUAGES,
  STORAGE_KEYS,
  USER_PLANS,
  USER_ROLES,
} from '../../config/app-config.js';

const storage = createLocalStorageAdapter();

const initialState = {
  auth: {
    status: 'checking', // 'checking' | 'authenticated' | 'guest'
    user: null,
  },

  ui: {
    isSidebarOpen: false,
    theme: 'light',
    language: 'persian',
  },

  app: {
    isInitialized: false,
    version: '2.4.0',
  },
};

export const appStore = createStore({
  initialState,
  storage,
  persistKey: STORAGE_KEYS.state,
});

/* ------------------------------------------------------------------ */
/* نرمال‌سازی                                                          */
/* ------------------------------------------------------------------ */

function hasValidId(id) {
  return (
    (typeof id === 'string' || typeof id === 'number') &&
    String(id).trim() !== ''
  );
}

export function normalizeUser(rawUser) {
  if (!rawUser || typeof rawUser !== 'object') return null;
  if (!hasValidId(rawUser.id)) return null;

  const user = structuredClone(rawUser);
  delete user.password;

  return {
    ...user,
    id: String(user.id),

    name: typeof user.name === 'string' ? user.name : 'user',
    lastName: typeof user.lastName === 'string' ? user.lastName : '',
    username: typeof user.username === 'string' ? user.username : '',
    email: typeof user.email === 'string' ? user.email : '',
    phoneNumber: typeof user.phoneNumber === 'string' ? user.phoneNumber : '',
    avatar: typeof user.avatar === 'string' ? user.avatar : '',
    jobTitle: typeof user.jobTitle === 'string' ? user.jobTitle : '',

    role: USER_ROLES.includes(user.role) ? user.role : 'user',
    plan: USER_PLANS.includes(user.plan) ? user.plan : 'plus',

    profileIsComplete:
      user.profileIsComplete === true || user.profileIsComplete === 'true',

    tools:
      user.tools && typeof user.tools === 'object' && !Array.isArray(user.tools)
        ? user.tools
        : {},
  };
}

function normalizeAuthState(rawAuth = {}) {
  const user = normalizeUser(rawAuth?.user);

  if (!user) {
    return {
      status: rawAuth?.status === 'checking' ? 'checking' : 'guest',
      user: null,
    };
  }

  return { status: 'authenticated', user };
}

function normalizeUiState(rawUi = {}) {
  return {
    isSidebarOpen: typeof rawUi?.isSidebarOpen === 'boolean' ? rawUi.isSidebarOpen : false,

    theme: rawUi?.theme === 'dark' ? 'dark' : 'light',

    language: APP_LANGUAGES.includes(rawUi?.language) ? rawUi.language : 'persian',
  };
}

function normalizeState(rawState = {}) {
  return {
    auth: normalizeAuthState(rawState?.auth),
    ui: normalizeUiState(rawState?.ui),
    app: {
      isInitialized: true,
      version: typeof rawState?.app?.version === 'string' ? rawState.app.version : '2.4.0',
    },
  };
}

/* ------------------------------------------------------------------ */
/* راه‌اندازی                                                          */
/* ------------------------------------------------------------------ */

export function initializeAppState() {
  appStore.initialize(normalizeState);
  return appStore.getState();
}

export function getAppState() {
  return appStore.getState();
}

export function subscribeAppState(listener) {
  return appStore.subscribe(listener);
}

/** subscribe روی auth.user — مخصوص صفحات ابزار */
export function subscribeCurrentUser(listener) {
  return appStore.watch(
    (state) => state.auth.user,
    ({ value, previousValue }) => listener(value, previousValue)
  );
}

/* ------------------------------------------------------------------ */
/* Auth actions                                                        */
/* ------------------------------------------------------------------ */

export function setAuthChecking() {
  appStore.setState((current) => ({
    ...current,
    auth: { status: 'checking', user: null },
  }));
}

export function setAuthUser(userData) {
  const normalizedUser = normalizeUser(userData);

  if (!normalizedUser) {
    throw new Error('[AppState] Invalid user data provided.');
  }

  appStore.setState((current) => ({
    ...current,
    auth: { status: 'authenticated', user: normalizedUser },
  }));

  return normalizedUser;
}

export function clearAuthUser() {
  appStore.setState((current) => ({
    ...current,
    auth: { status: 'guest', user: null },
  }));
}

/* ------------------------------------------------------------------ */
/* UI actions                                                          */
/* ------------------------------------------------------------------ */

export function setTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') return;

  appStore.setState((current) => ({
    ...current,
    ui: { ...current.ui, theme },
  }));
}

export function toggleTheme() {
  const next = appStore.getState().ui.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function setLanguage(language) {
  if (!APP_LANGUAGES.includes(language)) return;

  appStore.setState((current) => ({
    ...current,
    ui: { ...current.ui, language },
  }));
}

export function setSidebarOpen(isOpen) {
  appStore.setState((current) => ({
    ...current,
    ui: { ...current.ui, isSidebarOpen: Boolean(isOpen) },
  }));
}

export function toggleSidebar() {
  const next = !appStore.getState().ui.isSidebarOpen;
  setSidebarOpen(next);
  return next;
}
