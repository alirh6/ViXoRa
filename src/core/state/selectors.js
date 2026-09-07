// src/core/state/selectors.js

/**
 * Selectors — توابع خالص برای خواندن state
 * هیچ side-effect ندارند؛ استفاده مستقیم و در store.watch امن است.
 */

export function selectAuth(state) {
  return state?.auth ?? { status: 'guest', user: null };
}

export function selectAuthStatus(state) {
  return state?.auth?.status ?? 'guest';
}

export function selectCurrentUser(state) {
  return state?.auth?.user ?? null;
}

export function selectUserId(state) {
  return state?.auth?.user?.id ?? null;
}

export function selectUserName(state) {
  const user = state?.auth?.user;
  if (!user) return '';
  return [user.name, user.lastName].filter(Boolean).join(' ').trim();
}

export function selectUserDisplayName(state) {
  return selectUserName(state) || state?.auth?.user?.username || 'کاربر';
}

export function selectIsAuthenticated(state) {
  return state?.auth?.status === 'authenticated' && Boolean(state?.auth?.user?.id);
}

export function selectIsGuest(state) {
  return !selectIsAuthenticated(state);
}

export function selectIsChecking(state) {
  return state?.auth?.status === 'checking';
}

export function selectUserRole(state) {
  return state?.auth?.user?.role ?? null;
}

export function selectIsAdmin(state) {
  return selectUserRole(state) === 'admin';
}

export function selectUserPlan(state) {
  return state?.auth?.user?.plan ?? null;
}

export function selectUserAvatar(state) {
  return state?.auth?.user?.avatar || '';
}

export function selectUserTools(state) {
  return state?.auth?.user?.tools ?? {};
}

export function selectToolItems(state, toolName) {
  const tools = selectUserTools(state);
  const list = tools?.[toolName];
  return Array.isArray(list) ? list : [];
}

export function selectToolCount(state, toolName) {
  return selectToolItems(state, toolName).length;
}

export function selectUi(state) {
  return state?.ui ?? { isSidebarOpen: false, theme: 'light', language: 'persian' };
}

export function selectTheme(state) {
  return state?.ui?.theme ?? 'light';
}

export function selectIsDarkTheme(state) {
  return selectTheme(state) === 'dark';
}

export function selectLanguage(state) {
  return state?.ui?.language ?? 'persian';
}

export function selectIsSidebarOpen(state) {
  return Boolean(state?.ui?.isSidebarOpen);
}

export function selectIsAppInitialized(state) {
  return Boolean(state?.app?.isInitialized);
}
