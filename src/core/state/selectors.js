/**
 * Selector functions - توابع خالص برای استخراج داده از State
 */

export function selectAuth(state) {
  return state.auth;
}

export function selectAuthStatus(state) {
  return state.auth.status;
}

export function selectCurrentUser(state) {
  return state.auth.user;
}

export function selectIsAuthenticated(state) {
  return state.auth.status === 'authenticated';
}

export function selectIsGuest(state) {
  return state.auth.status === 'guest';
}

export function selectUserRole(state) {
  return state.auth.user?.role ?? null;
}

export function selectUserPlan(state) {
  return state.auth.user?.plan ?? null;
}

export function selectUi(state) {
  return state.ui;
}

export function selectTheme(state) {
  return state.ui.theme;
}

export function selectLanguage(state) {
  return state.ui.language;
}

export function selectIsSidebarOpen(state) {
  return state.ui.isSidebarOpen;
}

export function selectIsAppInitialized(state) {
  return state.app.isInitialized;
}
