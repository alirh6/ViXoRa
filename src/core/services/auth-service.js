// src/core/services/auth-service.js

/**
 * ViXoRa Auth Service — کاملاً فانکشنال
 * ------------------------------------------------------------------
 * منبع داده: LocalStorage (بدون بک‌اند)
 * اگر dbMode = 'remote' باشد، به‌صورت آینه‌ای روی json-server هم می‌نویسد.
 */

import {
  createUser,
  findUserByCredentials,
  findUserByUsername,
  findUserByEmail,
  getUserById,
  sanitizeUser,
  ensureDatabaseReady,
} from '../storage/db-client.js';

import {
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  touchStoredUser,
} from '../storage/session-storage.js';

import {
  setAuthUser,
  clearAuthUser,
  setAuthChecking,
} from '../state/app-state.js';

/* ------------------------------------------------------------------ */
/* اعتبارسنجی                                                          */
/* ------------------------------------------------------------------ */

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLoginInput(username, password) {
  const normalizedUsername = String(username || '').trim();

  if (!normalizedUsername) {
    return { valid: false, message: 'نام کاربری را وارد کنید.' };
  }

  if (!password) {
    return { valid: false, message: 'رمز عبور را وارد کنید.' };
  }

  return { valid: true, username: normalizedUsername, password: String(password) };
}

function validateRegisterInput(data = {}) {
  const username = String(data.username || '').trim();
  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const password = String(data.password || '');
  const confirmPassword = data.confirmPassword === undefined ? password : String(data.confirmPassword || '');

  if (!name) {
    return { valid: false, message: 'نام را وارد کنید.' };
  }

  if (username.length < 3) {
    return { valid: false, message: 'نام کاربری باید حداقل ۳ کاراکتر باشد.' };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      valid: false,
      message: 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد، _ و - باشد.',
    };
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { valid: false, message: 'ایمیل معتبر وارد کنید.' };
  }

  if (password.length < 6) {
    return { valid: false, message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' };
  }

  if (password !== confirmPassword) {
    return { valid: false, message: 'رمز عبور و تکرار آن یکسان نیستند.' };
  }

  return {
    valid: true,
    data: {
      name,
      lastName: String(data.lastName || '').trim(),
      username,
      email,
      password,
      phoneNumber: String(data.phoneNumber || '').trim(),
      avatar: String(data.avatar || '').trim(),
    },
  };
}

function validateProfileInput(data = {}) {
  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();

  if (data.name !== undefined && !name) {
    return { valid: false, message: 'نام نمی‌تواند خالی باشد.' };
  }

  if (data.email !== undefined && email && !EMAIL_PATTERN.test(email)) {
    return { valid: false, message: 'ایمیل معتبر وارد کنید.' };
  }

  const payload = { ...data };
  if (data.name !== undefined) payload.name = name;
  if (data.email !== undefined) payload.email = email;
  delete payload.password;
  delete payload.id;
  delete payload.role;

  return { valid: true, data: payload };
}

/** قدرت رمز عبور: 0 تا 4 */
export function getPasswordStrength(password) {
  const value = String(password || '');

  let score = 0;
  if (value.length >= 6) score += 1;
  if (value.length >= 10) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;

  return Math.min(score, 4);
}

/* ------------------------------------------------------------------ */
/* عملیات‌ها                                                           */
/* ------------------------------------------------------------------ */

export async function login(username, password) {
  const validation = validateLoginInput(username, password);

  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  try {
    await ensureDatabaseReady();

    const serverUser = await findUserByCredentials(validation.username, validation.password);

    if (!serverUser) {
      clearStoredUser();
      clearAuthUser();

      return {
        success: false,
        message: 'نام کاربری یا رمز عبور اشتباه است.',
      };
    }

    const safeUser = sanitizeUser(serverUser);

    setStoredUser(safeUser);
    setAuthUser(safeUser);

    return { success: true, user: safeUser };
  } catch (error) {
    console.error('[Auth] Login failed:', error);

    return {
      success: false,
      message: error?.message || 'ورود انجام نشد. لطفاً دوباره تلاش کنید.',
    };
  }
}

export async function register(registerData) {
  const validation = validateRegisterInput(registerData);

  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  try {
    await ensureDatabaseReady();

    const existingUser = await findUserByUsername(validation.data.username);
    if (existingUser) {
      return { success: false, message: 'این نام کاربری قبلاً ثبت شده است.' };
    }

    const existingEmail = await findUserByEmail(validation.data.email);
    if (existingEmail) {
      return { success: false, message: 'این ایمیل قبلاً ثبت شده است.' };
    }

    const now = new Date().toISOString();

    const newUser = {
      id: crypto.randomUUID(),
      name: validation.data.name,
      lastName: validation.data.lastName,
      username: validation.data.username,
      email: validation.data.email,
      password: validation.data.password,
      phoneNumber: validation.data.phoneNumber,
      avatar: validation.data.avatar,
      role: 'user',
      plan: 'plus',
      address: '',
      city: '',
      country: 'iran',
      jobTitle: '',
      inventory: 0,
      profileIsComplete: false,
      createdAt: now,
      memberSince: now,
      tools: { notes: [], todos: [], customerInfo: [] },
    };

    const createdUser = await createUser(newUser);
    const safeUser = sanitizeUser(createdUser);

    setStoredUser(safeUser);
    setAuthUser(safeUser);

    return { success: true, user: safeUser };
  } catch (error) {
    console.error('[Auth] Registration failed:', error);

    return {
      success: false,
      message: error?.message || 'ثبت‌نام انجام نشد. لطفاً دوباره تلاش کنید.',
    };
  }
}

export async function logout() {
  clearStoredUser();
  clearAuthUser();

  return { success: true };
}

export async function restoreSession() {
  const storedUser = getStoredUser();

  if (!storedUser || !storedUser.id) {
    clearAuthUser();
    return { authenticated: false, reason: 'guest' };
  }

  setAuthChecking();

  try {
    await ensureDatabaseReady();

    const freshUser = await getUserById(storedUser.id);

    if (!freshUser) {
      clearStoredUser();
      clearAuthUser();

      return { authenticated: false, reason: 'invalid-session' };
    }

    const safeUser = sanitizeUser(freshUser);

    setStoredUser(safeUser);
    setAuthUser(safeUser);

    return { authenticated: true, user: safeUser };
  } catch (error) {
    console.error('[Auth] Session validation failed:', error);

    // حالت آفلاین: session محلی معتبر حفظ می‌شود
    setStoredUser(storedUser);
    setAuthUser(storedUser);

    return { authenticated: true, user: storedUser, offline: true };
  }
}

export async function changePassword(userId, currentPassword, newPassword) {
  if (String(newPassword || '').length < 6) {
    return { success: false, message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' };
  }

  try {
    const user = await getUserById(userId);

    if (!user) {
      return { success: false, message: 'کاربر پیدا نشد.' };
    }

    if (user.password !== String(currentPassword || '')) {
      return { success: false, message: 'رمز عبور فعلی اشتباه است.' };
    }

    const { updateUserInDatabase } = await import('../storage/db-client.js');

    await updateUserInDatabase(userId, (currentUser) => ({
      ...currentUser,
      password: String(newPassword),
    }));

    return { success: true };
  } catch (error) {
    console.error('[Auth] Change password failed:', error);
    return { success: false, message: error?.message || 'تغییر رمز عبور انجام نشد.' };
  }
}

export async function updateProfile(userId, profileData) {
  const validation = validateProfileInput(profileData);

  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  try {
    const { updateUserInDatabase } = await import('../storage/db-client.js');

    const updatedUser = await updateUserInDatabase(userId, (currentUser) => ({
      ...currentUser,
      ...validation.data,
    }));

    const safeUser = sanitizeUser(updatedUser);

    setStoredUser(safeUser);
    setAuthUser(safeUser);

    return { success: true, user: safeUser };
  } catch (error) {
    console.error('[Auth] Profile update failed:', error);
    return { success: false, message: error?.message || 'به‌روزرسانی پروفایل انجام نشد.' };
  }
}

export async function touchLastLogin() {
  const user = touchStoredUser();
  if (user) setAuthUser(user);
  return user;
}
